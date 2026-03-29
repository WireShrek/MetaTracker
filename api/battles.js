export default async function handler(req, res) {
  const { player } = req.query;
  if (!player) return res.status(400).json({ error: 'player required' });
  try {
    const r = await fetch(
      `https://api2.splinterlands.com/battle/history?player=${encodeURIComponent(player)}&limit=50`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
