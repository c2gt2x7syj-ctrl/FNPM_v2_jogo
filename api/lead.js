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

function getSupabaseConfig() {
  return {
    url: cleanText(process.env.SUPABASE_URL, 1000).replace(/\/$/, ''),
    key: cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY, 2000),
    table: cleanText(process.env.SUPABASE_LEADS_TABLE || 'fnpm_login_leads', 120),
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

  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
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
