export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, body, cc } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Email service not configured' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'CERP Platform Administration <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
        subject,
        text: body,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Send failed');
    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
