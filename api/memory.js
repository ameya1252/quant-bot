import { ensureUser, getSql, getUserId, setJsonCors } from './_db.js';

export default async function handler(req, res) {
  setJsonCors(res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const sql = getSql();
    const userId = getUserId(req);
    await ensureUser(sql, userId);

    if (req.method === 'GET') {
      const [watchlist, analyses, scans, events] = await Promise.all([
        sql`
          select ticker, last_analysis, analyzed_at
          from watchlist_items
          where user_id = ${userId}
          order by added_at desc
          limit 30
        `,
        sql`
          select ticker, timeframe, analysis, created_at
          from analyses
          where user_id = ${userId}
          order by created_at desc
          limit 20
        `,
        sql`
          select universe, results, created_at
          from scanner_runs
          where user_id = ${userId}
          order by created_at desc
          limit 5
        `,
        sql`
          select event_type, payload, created_at
          from user_events
          where user_id = ${userId}
          order by created_at desc
          limit 50
        `,
      ]);

      return res.json({ userId, watchlist, analyses, scans, events });
    }

    if (req.method === 'POST') {
      const eventType = typeof req.body?.eventType === 'string' ? req.body.eventType.slice(0, 80) : 'note';
      const payload = req.body?.payload ?? {};
      await sql`
        insert into user_events (user_id, event_type, payload)
        values (${userId}, ${eventType}, ${JSON.stringify(payload)}::jsonb)
      `;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Memory API error:', error);
    return res.status(500).json({ error: error.message || 'Memory request failed' });
  }
}
