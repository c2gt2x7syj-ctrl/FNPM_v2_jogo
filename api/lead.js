// Vercel Serverless API Route: /api/lead
const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbxQyg2nYCgOItkwWSkWmENuhd7p3KcR0WB6z_wNyk3qqwcsajD4CKKB1wnTG2XUDbNnSA/exec';

const MAX_TEXT_LENGTH = 500;

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') return JSON.parse(body);
  return body;
}

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizeSupabaseUrl(value) {
  const raw = cleanText(value, 1000);
  if (!raw) return '';

  const withoutTableSuffix = raw.split('/SUPABASE_LEADS_TABLE=')[0].replace(/\/$/, '');
  if (/^https?:\/\//i.test(withoutTableSuffix)) return withoutTableSuffix;
  if (/^[a-z0-9-]+$/i.test(withoutTableSuffix)) {
    return `https://${withoutTableSuffix}.supabase.co`;
  }

  return withoutTableSuffix;
}

function normalizeSupabaseTable(value) {
  const raw = cleanText(value, 500);
  if (!raw) return 'fnpm_login_leads';

  const envAssignmentMatch = raw.match(/SUPABASE_LEADS_TABLE=([^/?#]+)/);
  if (envAssignmentMatch) return envAssignmentMatch[1];

  if (raw.includes('=')) {
    const afterEquals = raw.split('=').pop();
    if (afterEquals) return afterEquals;
  }

  const pathMatch = raw.match(/\/([^/?#]+)$/);
  if (pathMatch && !raw.startsWith(pathMatch[1])) return pathMatch[1];

  return raw;
}

function isLegacyJwtKey(key) {
  return /^eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*$/.test(key);
}

function getSupabaseConfig() {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.supabase_url ||
    process.env.url ||
    process.env.URL ||
    process.env.table ||
    '';
  const rawKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.service ||
    process.env.SERVICE ||
    '';
  const rawTable =
    process.env.SUPABASE_LEADS_TABLE ||
    process.env.supabase_leads_table ||
    process.env.table ||
    process.env.TABLE ||
    (rawUrl.includes('SUPABASE_LEADS_TABLE=') ? rawUrl : 'fnpm_login_leads');

  return {
    url: normalizeSupabaseUrl(rawUrl),
    key: cleanText(rawKey, 2000),
    table: normalizeSupabaseTable(rawTable),
  };
}

function getGoogleSheetsWebhookUrl() {
  return cleanText(
    process.env.GOOGLE_SHEETS_LEADS_WEBHOOK_URL || DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL,
    1000
  );
}

function buildLeadPayload(req, body) {
  const nome = cleanText(body.nome, 200);
  const email = cleanText(body.email, 200).toLowerCase();
  const rawDevice = cleanText(body.device, 30);
  const device = ['mobile', 'desktop'].includes(rawDevice) ? rawDevice : 'unknown';
  const viewportWidth = Number.parseInt(body.viewport_width, 10) || null;
  const viewportHeight = Number.parseInt(body.viewport_height, 10) || null;

  return {
    nome,
    email,
    device,
    page_path: cleanText(body.page_path, 500),
    referrer: cleanText(body.referrer, 500),
    language: cleanText(body.language, 40),
    viewport_width: viewportWidth,
    viewport_height: viewportHeight,
    user_agent: cleanText(req.headers['user-agent'], 500),
    source: 'fnpm_game',
  };
}

async function saveToSupabase(payload) {
  const { url, key, table } = getSupabaseConfig();
  if (!url || !key) {
    return { skipped: true, reason: 'missing_supabase_env' };
  }

  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  if (isLegacyJwtKey(key)) {
    headers.Authorization = `Bearer ${key}`;
  }

  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  return { ok: true, data };
}

async function saveToGoogleSheets(payload) {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl) {
    return { skipped: true, reason: 'missing_google_sheets_webhook' };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: payload.nome,
      email: payload.email,
      device: payload.device,
      page_path: payload.page_path,
      source: payload.source,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Sheets insert failed: ${response.status} ${detail}`);
  }

  return { ok: true, data: await response.json() };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req.body);
    const payload = buildLeadPayload(req, body);

    if (!payload.nome || !payload.email) {
      res.status(400).json({ error: 'nome e email obrigatorios' });
      return;
    }

    if (!isValidEmail(payload.email)) {
      res.status(400).json({ error: 'email invalido' });
      return;
    }

    let supabaseResult;
    try {
      supabaseResult = await saveToSupabase(payload);
    } catch (err) {
      console.error(err);
      supabaseResult = { failed: true, reason: 'supabase_insert_failed' };
    }

    let sheetsResult = { skipped: true, reason: 'supabase_primary' };
    if (supabaseResult.skipped || supabaseResult.failed || process.env.GOOGLE_SHEETS_LEADS_MIRROR === 'true') {
      try {
        sheetsResult = await saveToGoogleSheets(payload);
      } catch (err) {
        console.error(err);
        sheetsResult = { failed: true, reason: 'google_sheets_insert_failed' };
      }
    }

    const leadSaved = supabaseResult.ok || sheetsResult.ok;
    if (!leadSaved && supabaseResult.skipped && sheetsResult.skipped) {
      res.status(500).json({ error: 'Nenhum armazenamento de leads configurado' });
      return;
    }

    if (!leadSaved) {
      res.status(502).json({ error: 'Erro ao salvar lead' });
      return;
    }

    res.status(200).json({
      ok: true,
      storage: {
        supabase: supabaseResult.ok ? 'saved' : supabaseResult.reason,
        google_sheets: sheetsResult.ok ? 'saved' : sheetsResult.reason,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar lead' });
  }
}
