import { ensureUser, getSql, getUserId, setJsonCors } from './_db.js';

export default async function handler(req, res) {
  setJsonCors(res, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ticker = typeof req.body?.ticker === 'string' ? req.body.ticker.trim().toUpperCase() : '';
  const timeframe = typeof req.body?.timeframe === 'string' ? req.body.timeframe : 'unknown';
  const analysis = req.body?.analysis;

  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker) || !analysis) {
    return res.status(400).json({ error: 'ticker and analysis are required' });
  }

  try {
    const sql = getSql();
    const userId = getUserId(req);
    await ensureUser(sql, userId);

    await sql`
      insert into analyses (user_id, ticker, timeframe, analysis)
      values (${userId}, ${ticker}, ${timeframe}, ${JSON.stringify(analysis)}::jsonb)
    `;

    await sql`
      insert into watchlist_items (user_id, ticker, last_analysis, analyzed_at)
      values (${userId}, ${ticker}, ${JSON.stringify({
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        summary: analysis.summary,
        scores: analysis.scores,
        riskPlan: analysis.riskPlan,
        signalQuality: analysis.signalQuality
      })}::jsonb, now())
      on conflict (user_id, ticker) do update set
        last_analysis = excluded.last_analysis,
        analyzed_at = excluded.analyzed_at
    `;

    return res.json({ ok: true });
  } catch (error) {
    console.error('Analysis log API error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save analysis' });
  }
}
