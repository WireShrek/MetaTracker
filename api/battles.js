export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const player = req.query.player;

  if (!player) {
    return res.status(400).json({ error: 'player param required' });
  }

  try {
    // Try v1 API first — this one is confirmed public (no auth needed)
    const url = `https://api.splinterlands.io/battle/history?player=${encodeURIComponent(player)}&limit=50`;

    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://splinterlands.com/',
      },
    });

    const text = await r.text();
    res.status(r.status).send(text);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
