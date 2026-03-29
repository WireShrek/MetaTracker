export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { player, limit } = req.query;
  if (!player) return res.status(400).json({ error: 'player required' });

  try {
    // Get player's Hive transaction history — look for sm_battle results
    // These are posted ON-CHAIN by Splinterlands after each battle ends
    const hiveRes = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_account_history',
        params: [player, -1, 1000],
        id: 1
      })
    });

    const hiveData = await hiveRes.json();
    const ops = hiveData?.result || [];

    // Find sm_battle_result or sm_battle custom_json ops
    // These contain battle IDs we can look up via battle/result
    const battleIds = [];
    for (const entry of ops) {
      const op = entry?.[1]?.op;
      if (!op || op[0] !== 'custom_json') continue;
      const id = op[1]?.id || '';
      if (id !== 'sm_battle_result' && id !== 'sm_battle') continue;
      try {
        const data = typeof op[1].json === 'string' ? JSON.parse(op[1].json) : op[1].json;
        // battle result ops contain a battle id
        const bid = data?.battle_queue_id || data?.id || data?.battle_id;
        if (bid && !battleIds.includes(bid)) battleIds.push(bid);
        if (battleIds.length >= (parseInt(limit) || 30)) break;
      } catch(e) {}
    }

    if (battleIds.length === 0) {
      return res.status(200).json({ battles: [], source: 'hive', note: 'no battle ids found in hive history' });
    }

    // Fetch battle results — this endpoint IS public, no auth needed
    const battles = await Promise.all(
      battleIds.slice(0, 30).map(async (bid) => {
        try {
          const r = await fetch(`https://api2.splinterlands.com/battle/result?id=${bid}`);
          if (!r.ok) return null;
          return await r.json();
        } catch(e) { return null; }
      })
    );

    return res.status(200).json({
      battles: battles.filter(Boolean),
      source: 'hive+result',
      battle_ids_found: battleIds.length
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
