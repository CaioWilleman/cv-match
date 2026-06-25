export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_GROQ_KEY}`,
    },
    body: JSON.stringify(req.body),
  });

  const dados = await resposta.json();
  return res.status(200).json(dados);
}