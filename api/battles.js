const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { player, limit } = req.query;
  if (!player) return res.status(400).json({ error: 'player required' });

  const token = process.env.SPL_TOKEN;
  if (!token) return res.status(500).json({ error: 'SPL_TOKEN not configured' });

  const path = '/battle/history?player=' + encodeURIComponent(player) + '&limit=' + (limit || 50);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api2.splinterlands.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json',
      },
      timeout: 25000,
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        res.status(response.statusCode).send(data);
        resolve();
      });
    });

    request.on('timeout', () => {
      request.destroy();
      res.status(504).json({ error: 'Request timed out' });
      resolve();
    });

    request.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.end();
  });
};
