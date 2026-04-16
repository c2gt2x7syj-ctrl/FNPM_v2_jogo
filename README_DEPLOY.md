# Deploy FNPM v2 no Vercel

## Estrutura pronta para Vercel
- Frontend: index.html, sketch.js, assets
- Backend: /api/lead.js (proxy para Google Sheets)
- Config: vercel.json

## Como publicar
1. Faça login em https://vercel.com/
2. Clique em "New Project" e importe este repositório
3. Vercel detecta automaticamente a pasta raiz
4. Deploy automático

## Observações
- O endpoint /api/lead salva os leads diretamente no Google Sheets via Apps Script
- Não há persistência local de CSV
- O Google Sheets precisa estar ativo e com permissão "Qualquer pessoa"
