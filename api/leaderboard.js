export default async function handler(req, res) {
  const { leaderboard, format, limit } = req.query;
  try {
    const r = await fetch(
      `https://api2.splinterlands.com/players/leaderboard?leaderboard=${leaderboard||0}&format=${format||'modern'}&limit=${limit||100}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
