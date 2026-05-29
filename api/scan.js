import { analyzeCandidate, UNIVERSES } from '../src/utils/quantScanner.js';
import { ensureUser, getSql, getUserId } from './_db.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

async function fetchCandles(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const { open = [], high = [], low = [], close = [], volume = [] } = quote;

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: open[i],
      high: high[i],
      low: low[i],
      close: close[i],
      volume: volume[i] ?? 0,
    }))
    .filter((c) => Number.isFinite(c.close));
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      results.push(await mapper(current));
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const universeName = typeof req.query?.universe === 'string' ? req.query.universe : 'liquid';
  const custom = typeof req.query?.tickers === 'string'
    ? req.query.tickers.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
    : null;
  const tickers = (custom?.length ? custom : UNIVERSES[universeName] ?? UNIVERSES.liquid)
    .filter((ticker) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker))
    .slice(0, 60);

  try {
    const scanned = await mapLimit(tickers, 6, async (ticker) => {
      const candles = await fetchCandles(ticker);
      return analyzeCandidate(ticker, candles);
    });

    const results = scanned
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (process.env.DATABASE_URL) {
      try {
        const sql = getSql();
        const userId = getUserId(req);
        await ensureUser(sql, userId);
        await sql`
          insert into scanner_runs (user_id, universe, results)
          values (${userId}, ${custom?.length ? 'custom' : universeName}, ${JSON.stringify(results)}::jsonb)
        `;
      } catch (dbError) {
        console.warn('Scan DB save skipped:', dbError.message);
      }
    }

    res.setHeader('Cache-Control', 's-maxage=180');
    res.json({
      asOf: new Date().toISOString(),
      universe: custom?.length ? 'custom' : universeName,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Scan API error:', error);
    res.status(500).json({ error: 'Failed to scan universe' });
  }
}
