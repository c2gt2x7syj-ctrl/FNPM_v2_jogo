// Vercel Serverless API Route: /api/lead
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { nome, email } = req.body;
    const response = await fetch('https://script.google.com/macros/s/AKfycbxQyg2nYCgOItkwWSkWmENuhd7p3KcR0WB6z_wNyk3qqwcsajD4CKKB1wnTG2XUDbNnSA/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar lead' });
  }
}
