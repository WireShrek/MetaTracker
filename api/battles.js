export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { player, leaderboard, format, limit } = req.query;
  
  try {
    let url;
    
    if (player) {
      // Per-player history (requires no auth when called server-side)
      url = `https://api2.splinterlands.com/battle/history?player=${encodeURIComponent(player)}&limit=${limit || 50}`;
    } else {
      // Top battles - fully public, no auth needed
      url = `https://api2.splinterlands.com/battle/top_battles?leaderboard=${leaderboard || 0}&format=${format || 'modern'}&limit=${limit || 50}`;
    }
    
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://splinterlands.com',
        'Referer': 'https://splinterlands.com/',
      }
    });
    
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
