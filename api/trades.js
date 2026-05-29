import { ensureUser, getSql, getUserId, setJsonCors } from './_db.js';

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapTrade(row) {
  return {
    id: Number(row.id),
    ticker: row.ticker,
    direction: row.direction,
    entryPrice: Number(row.entry_price),
    exitPrice: row.exit_price == null ? null : Number(row.exit_price),
    shares: Number(row.shares),
    dateOpened: row.date_opened,
    dateClosed: row.date_closed,
    notes: row.notes || '',
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
        select id, ticker, direction, entry_price, exit_price, shares, date_opened, date_closed, notes
        from trade_logs
        where user_id = ${userId}
        order by date_opened desc, id desc
      `;
      return res.json(rows.map(mapTrade));
    }

    if (req.method === 'POST') {
      const trade = req.body || {};
      const ticker = typeof trade.ticker === 'string' ? trade.ticker.trim().toUpperCase() : '';
      const direction = trade.direction === 'short' ? 'short' : 'long';
      const entryPrice = num(trade.entryPrice);
      const exitPrice = trade.exitPrice == null || trade.exitPrice === '' ? null : num(trade.exitPrice);
      const shares = num(trade.shares);

      if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker) || !entryPrice || !shares || !trade.dateOpened) {
        return res.status(400).json({ error: 'ticker, entryPrice, shares, and dateOpened are required' });
      }

      const id = Number.isFinite(Number(trade.id)) ? Number(trade.id) : null;
      const rows = id
        ? await sql`
            update trade_logs set
              ticker = ${ticker},
              direction = ${direction},
              entry_price = ${entryPrice},
              exit_price = ${exitPrice},
              shares = ${shares},
              date_opened = ${trade.dateOpened},
              date_closed = ${trade.dateClosed || null},
              notes = ${trade.notes || ''},
              updated_at = now()
            where id = ${id} and user_id = ${userId}
            returning id, ticker, direction, entry_price, exit_price, shares, date_opened, date_closed, notes
          `
        : await sql`
            insert into trade_logs (user_id, ticker, direction, entry_price, exit_price, shares, date_opened, date_closed, notes)
            values (${userId}, ${ticker}, ${direction}, ${entryPrice}, ${exitPrice}, ${shares}, ${trade.dateOpened}, ${trade.dateClosed || null}, ${trade.notes || ''})
            returning id, ticker, direction, entry_price, exit_price, shares, date_opened, date_closed, notes
          `;

      return res.json(mapTrade(rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Valid id is required' });
      await sql`delete from trade_logs where id = ${id} and user_id = ${userId}`;
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Trades API error:', error);
    return res.status(500).json({ error: error.message || 'Trades request failed' });
  }
}
