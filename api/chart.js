export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticker } = req.query;
  const normalizedTicker = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';

  if (!normalizedTicker) {
    return res.status(400).json({ error: 'ticker is required' });
  }

  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizedTicker)) {
    return res.status(400).json({ error: 'ticker must be 1-10 letters/numbers/dot/dash characters' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?interval=1d&range=1y&includePrePost=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch chart data' });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: 'No data found for ticker' });
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const { open = [], high = [], low = [], close = [], volume = [] } = quote;

    const candles = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        open: open[i] ? +open[i].toFixed(2) : null,
        high: high[i] ? +high[i].toFixed(2) : null,
        low: low[i] ? +low[i].toFixed(2) : null,
        close: close[i] ? +close[i].toFixed(2) : null,
        volume: volume[i] ? Math.round(volume[i]) : 0,
      }))
      .filter((c) => c.close !== null);

    res.setHeader('Cache-Control', 's-maxage=300');
    res.json(candles);
  } catch (error) {
    console.error('Chart API error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
}
