const https = require('https');
let cardCache = null;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'ids required' });

  const colorMap = {
    Red:'fire', Blue:'water', Green:'earth', White:'life',
    Black:'death', Gold:'dragon', Gray:'neutral', Purple:'death'
  };

  try {
    if (!cardCache) {
      cardCache = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api2.splinterlands.com',
          path: '/cards/get_details',
          method: 'GET',
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          timeout: 25000,
        };
        const r = https.request(options, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch(e) { cardCache = null; reject(new Error('parse failed')); }
          });
        });
        r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
        r.on('error', (e) => { reject(e); });
        r.end();
      });
    }

    const wantedIds = ids === 'all'
      ? null
      : new Set(ids.split(',').map(s => parseInt(s.trim())).filter(Boolean));

    const result = (wantedIds
      ? cardCache.filter(c => wantedIds.has(c.id))
      : cardCache
    ).map(c => ({
      id: c.id,
      name: c.name,
      splinter: colorMap[c.color] || 'neutral',
      type: c.type === 'Summoner' ? 'S' : 'M'
    }));

    res.status(200).json(result);
  } catch(e) {
    cardCache = null;
    res.status(200).json([]);
  }
};
