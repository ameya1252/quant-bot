import Anthropic from '@anthropic-ai/sdk';

const rateBuckets = new Map();
const TICKER_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;

export const SYSTEM_PROMPT = `You are a professional quantitative swing trader with 15 years of experience. Your analysis is institutional-grade and data-driven.

When given a stock ticker and timeframe, follow these steps EXACTLY:

STEP 1 — SEARCH LIVE DATA (search multiple times to gather comprehensive data)
- Search for the current stock price, today's change %, volume, and 52-week range
- Search for news and headlines from the last 48 hours
- Search for the next earnings date and any upcoming catalysts
- Search for recent analyst ratings, upgrades, and downgrades (last 30 days)
- Search for current short interest percentage
- Search for relevant sector ETF performance (e.g., XLK for tech, XLF for financials, XLE for energy)
- Search for current VIX level
- Search for any recent SEC filings, insider trades, or institutional changes

STEP 2 — TECHNICAL ANALYSIS
Analyze these indicators using your search results:
- EMA crossovers (9, 21, 50, 200-day): trend direction and momentum
- RSI (14-period): overbought (>70) or oversold (<30) and divergences
- MACD (12/26/9): signal line position, histogram direction, any divergences
- Bollinger Bands: squeeze (low volatility setup) or expansion (breakout in progress)
- VWAP: is price above or below, by how much
- Volume: today's vs 30-day average, any climactic or dry-up patterns
- Key support and resistance levels (recent swing highs/lows, gaps, round numbers)
- Any notable chart patterns (ascending triangle, bull flag, cup-and-handle, etc.)

STEP 3 — FUNDAMENTAL ANALYSIS
Evaluate:
- Market cap and float
- P/E and forward P/E ratios, PEG ratio
- Revenue growth (QoQ and YoY) and earnings growth
- EPS beat/miss history for last 4 quarters
- Short interest % and days-to-cover
- Institutional ownership changes (last quarter)
- Upcoming catalysts (earnings date, product launches, FDA dates, conferences)

STEP 4 — SENTIMENT ANALYSIS
Gather:
- Top 5 most relevant news headlines from last 48 hours
- Analyst consensus (buy/hold/sell ratio) and average price target
- Recent analyst changes (upgrades/downgrades) with specific firms
- Options market: any unusual volume or notable put/call ratio

STEP 5 — MACRO CONTEXT
Assess:
- Current VIX level: is the market fearful (>25), cautious (18-25), or complacent (<15)?
- Sector ETF performance: is the sector in a bull or bear trend?
- Federal Reserve: current stance (hawkish/dovish), upcoming FOMC dates
- Market regime: strong uptrend, distribution, choppy, or downtrend

STEP 6 — PRODUCE JSON OUTPUT
Output ONLY the following JSON object. No preamble. No explanation. No markdown fences. Pure JSON only. Every field must be present:

{
  "verdict": "BUY",
  "confidence": 8,
  "summary": "One sentence TL;DR of the trade setup and rationale.",
  "entry": {
    "low": 0.00,
    "high": 0.00
  },
  "targets": {
    "tp1": 0.00,
    "tp2": 0.00
  },
  "stopLoss": 0.00,
  "riskReward": "1:2.5",
  "holdDays": "5-10 days",
  "scores": {
    "technical": 7,
    "fundamental": 6,
    "sentiment": 5,
    "macro": 5,
    "risk": 4
  },
  "technical": {
    "trend": "Description of overall price trend",
    "ema9": "Price vs 9-day EMA with approximate value",
    "ema21": "Price vs 21-day EMA with approximate value",
    "ema50": "Price vs 50-day EMA with approximate value",
    "ema200": "Price vs 200-day EMA with approximate value",
    "rsi": 58.5,
    "rsiSignal": "Neutral - not overbought or oversold, trending up",
    "macd": "Bullish crossover above zero line, histogram expanding",
    "bollingerBands": "Trading in upper half of bands, no squeeze",
    "vwap": "Trading 2.3% above VWAP, bullish intraday bias",
    "volume": "Volume 140% of 30-day average - accumulation signal",
    "support": [100.00, 95.00],
    "resistance": [115.00, 120.00],
    "keyPattern": "Bull flag forming on 4H chart after breakout"
  },
  "fundamental": {
    "marketCap": "$500B",
    "float": "2.8B shares",
    "pe": "28.5x",
    "forwardPE": "24.2x",
    "revenueGrowth": "+18% YoY",
    "earningsGrowth": "+22% YoY",
    "epsHistory": "Beat 4 of last 4 quarters, avg beat +8%",
    "shortInterest": "2.4% of float",
    "daysToCover": "2.1 days",
    "institutionalOwnership": "76% - increased 2.1% last quarter",
    "earningsDate": "Feb 5, 2025 (after-hours)",
    "catalysts": ["Earnings in 3 weeks", "Product launch scheduled Q1"]
  },
  "sentiment": {
    "headlines": [
      "Headline 1 from last 48 hours",
      "Headline 2 from last 48 hours",
      "Headline 3 from last 48 hours",
      "Headline 4 from last 48 hours",
      "Headline 5 from last 48 hours"
    ],
    "analystConsensus": "Strong Buy - 18 Buy, 4 Hold, 1 Sell | Avg PT $145",
    "recentChanges": ["Goldman Sachs upgraded to Buy, PT raised to $150 (Jan 15)", "Morgan Stanley initiated with Overweight"],
    "optionsActivity": "Unusual call buying in Feb $120 strikes, 3x normal volume"
  },
  "macro": {
    "vix": "VIX at 16.2 - complacent market, low fear",
    "sectorPerformance": "XLK up 3.2% this week, sector in strong uptrend",
    "fedContext": "Fed paused rate hikes, dovish tone at last meeting. Next FOMC Jan 29.",
    "marketRegime": "S&P 500 in uptrend, breadth expanding, risk-on environment"
  },
  "bullCase": "Strong technical setup with institutional accumulation. Sector tailwind and improving fundamentals with earnings beat track record support further upside.",
  "bearCase": "Elevated valuation leaves little margin for error. Any macro deterioration or earnings miss could trigger sharp selloff given thin short interest cushion.",
  "risks": [
    "Earnings report in 3 weeks could cause volatility",
    "Broader market pullback if VIX spikes above 20",
    "Valuation stretched vs sector peers"
  ],
  "sources": [
    "https://finance.yahoo.com",
    "https://seekingalpha.com"
  ]
}

CRITICAL RULES:
1. verdict must be one of: "BUY", "SELL", "AVOID", "WAIT"
2. Never give BUY in a clearly bearish macro environment without strong diverging catalysts
3. Risk score is INVERSE: 1=lowest risk, 10=highest risk
4. All prices must be realistic numbers based on actual current market data
5. Output ONLY valid JSON — no trailing commas, no comments, no text before or after
6. Every field in the schema must be present with real data`;

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function isRateLimited(req) {
  const limit = Number(process.env.ANALYZE_RATE_LIMIT || 12);
  const windowMs = Number(process.env.ANALYZE_RATE_WINDOW_MS || 60 * 60 * 1000);
  const key = clientKey(req);
  const now = Date.now();
  const bucket = rateBuckets.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count > limit;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { ticker, timeframe } = req.body || {};
  const normalizedTicker = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';

  if (!normalizedTicker || !timeframe) {
    return res.status(400).json({ error: 'ticker and timeframe are required' });
  }

  if (!TICKER_RE.test(normalizedTicker)) {
    return res.status(400).json({ error: 'ticker must be 1-10 letters/numbers/dot/dash characters' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_) {}
  };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeframeLabels = {
      swing: '2-5 day swing trade',
      medium: '1-3 week medium-term trade',
      extended: '1 month extended trade',
    };

    const stream = client.messages.stream({
      model: process.env.ANTHROPIC_ANALYSIS_MODEL || 'claude-opus-4-20250514',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          allowed_callers: ['direct'],
          max_uses: 12,
          user_location: {
            type: 'approximate',
            country: 'US',
            timezone: 'America/Los_Angeles',
          },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze ${normalizedTicker} for a ${timeframeLabels[timeframe] || timeframe}. Today is ${today}. Search for live data first. Respond with ONLY valid JSON.`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'server_tool_use') {
          send({ type: 'searching', tool: event.content_block.name });
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          send({ type: 'delta', text: event.delta.text });
        }
      } else if (event.type === 'message_delta') {
        send({ type: 'stop_reason', reason: event.delta.stop_reason });
      }
    }

    send({ type: 'done' });
    res.end();
  } catch (error) {
    console.error('Analyze API error:', error);
    send({ type: 'error', message: error.message || 'Analysis failed. Please try again.' });
    res.end();
  }
}
