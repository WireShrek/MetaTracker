const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { player, debug } = req.query;
  if (!player) return res.status(400).json({ error: 'player required' });

  const token = process.env.SPL_TOKEN;
  if (!token) return res.status(500).json({ error: 'SPL_TOKEN not configured' });

  const path = '/battle/history?player=' + encodeURIComponent(player) + '&limit=50';

  return new Promise((resolve) => {
    const options = {
      hostname: 'api2.splinterlands.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json',
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        // In debug mode, show parsed details of first battle
        if (debug === '1') {
          try {
            const parsed = JSON.parse(data);
            const battles = parsed.battles || parsed;
            const first = battles[0];
            const det = typeof first.details === 'string' ? JSON.parse(first.details) : first.details;
            return res.status(200).json({
              top_keys: Object.keys(first),
              details_keys: det ? Object.keys(det) : null,
              details_sample: det,
            });
          } catch(e) {
            return res.status(200).json({ raw: data.slice(0, 1000) });
          } finally {
            resolve();
          }
        }
        res.status(response.statusCode).send(data);
        resolve();
      });
    });

    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.end();
  });
};
