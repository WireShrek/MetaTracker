const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { ids } = req.query;
  if (!ids) return res.status(400).json({ error: 'ids required' });

  const colorMap = {
    Red:'fire', Blue:'water', Green:'earth', White:'life',
    Black:'death', Gold:'dragon', Gray:'neutral', Purple:'death'
  };

  return new Promise((resolve) => {
    const path = '/cards/find_by_ids?ids=' + encodeURIComponent(ids);
    const options = {
      hostname: 'api2.splinterlands.com',
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const cards = JSON.parse(data);
          const result = (Array.isArray(cards) ? cards : []).map(c => ({
            id: c.id,
            name: c.name,
            splinter: colorMap[c.color] || 'neutral'
          }));
          res.status(200).json(result);
        } catch(e) {
          res.status(200).json([]);
        }
        resolve();
      });
    });
    request.on('error', () => { res.status(200).json([]); resolve(); });
    request.end();
  });
};
