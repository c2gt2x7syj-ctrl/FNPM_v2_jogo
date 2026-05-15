# Deploy FNPM v2 no Vercel

## Estrutura pronta para Vercel
- Frontend: index.html, sketch.js, assets
- Backend: /api/lead.js (captura leads no Supabase; Google Sheets pode ficar como fallback/espelho)
- Config: vercel.json

## Como publicar
1. Faça login em https://vercel.com/
2. Clique em "New Project" e importe este repositório
3. Vercel detecta automaticamente a pasta raiz
4. Deploy automático

## Observações
- O endpoint /api/lead salva os leads no Supabase quando `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas no Vercel.
- Rode o SQL em `supabase/fnpm_login_leads.sql` no SQL Editor do Supabase antes do deploy.
- A tabela usa RLS habilitado; a escrita deve passar pela rota serverless, nunca pelo frontend.
- Sem Supabase configurado, a rota mantém o fallback para Google Sheets.
- Para espelhar em Google Sheets mesmo com Supabase ativo, configure `GOOGLE_SHEETS_LEADS_MIRROR=true`.
