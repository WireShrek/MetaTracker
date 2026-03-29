const https = require('https');

// In-memory cache so we only fetch once per cold start
let cardCache = null;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'ids required' });

  const wantedIds = new Set(ids.split(',').map(s => parseInt(s.trim())).filter(Boolean));
  const colorMap = { Red:'fire', Blue:'water', Green:'earth', White:'life', Black:'death', Gold:'dragon', Gray:'neutral', Purple:'death' };

  try {
    // Use cache if available
    if (!cardCache) {
      cardCache = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api2.splinterlands.com',
          path: '/cards/get_details',
          method: 'GET',
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        };
        const req2 = https.request(options, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch(e) { reject(e); }
          });
        });
        req2.on('error', reject);
        req2.setTimeout(20000, () => reject(new Error('timeout')));
        req2.end();
      });
    }

    const result = cardCache
      .filter(c => wantedIds.has(c.id))
      .map(c => ({ id: c.id, name: c.name, splinter: colorMap[c.color] || 'neutral' }));

    res.status(200).json(result);
  } catch(e) {
    cardCache = null; // reset on error
    res.status(200).json([]);
  }
};
