import { ensureUser, getSql, getUserId, setJsonCors } from './_db.js';

function normalizeTicker(value) {
  const ticker = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker) ? ticker : null;
}

function mapItem(row) {
  return {
    ticker: row.ticker,
    addedAt: new Date(row.added_at).getTime(),
    lastAnalysis: row.last_analysis,
    analyzedAt: row.analyzed_at ? new Date(row.analyzed_at).getTime() : null,
  };
}

export default async function handler(req, res) {
  setJsonCors(res, 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = getSql();
    const userId = getUserId(req);
    await ensureUser(sql, userId);

    if (req.method === 'GET') {
      const rows = await sql`
        select ticker, added_at, last_analysis, analyzed_at
        from watchlist_items
        where user_id = ${userId}
        order by added_at desc
      `;
      return res.json(rows.map(mapItem));
    }

    if (req.method === 'POST') {
      const ticker = normalizeTicker(req.body?.ticker);
      if (!ticker) return res.status(400).json({ error: 'Valid ticker is required' });

      const analysis = req.body?.analysis ?? null;
      const rows = await sql`
        insert into watchlist_items (user_id, ticker, last_analysis, analyzed_at)
        values (${userId}, ${ticker}, ${analysis ? JSON.stringify(analysis) : null}::jsonb, ${analysis ? new Date().toISOString() : null})
        on conflict (user_id, ticker) do update set
          last_analysis = coalesce(excluded.last_analysis, watchlist_items.last_analysis),
          analyzed_at = coalesce(excluded.analyzed_at, watchlist_items.analyzed_at)
        returning ticker, added_at, last_analysis, analyzed_at
      `;
      return res.json(mapItem(rows[0]));
    }

    if (req.method === 'DELETE') {
      const ticker = normalizeTicker(req.query?.ticker || req.body?.ticker);
      if (!ticker) return res.status(400).json({ error: 'Valid ticker is required' });
      await sql`delete from watchlist_items where user_id = ${userId} and ticker = ${ticker}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Watchlist API error:', error);
    return res.status(500).json({ error: error.message || 'Watchlist request failed' });
  }
}
