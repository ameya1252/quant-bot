import Anthropic from '@anthropic-ai/sdk';
const TICKER_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;
let rateLimitedUntil = 0;
const analysisCache = new Map();

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function sendEvent(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (_) {}
}

function cacheKey(ticker) {
  return `${process.env.ANTHROPIC_ANALYSIS_MODEL || 'claude-opus-4-20250514'}:${ticker}`;
}

const COMPACT_SYSTEM_PROMPT = `You are a professional quantitative swing trader. Search live market data, then output ONLY valid JSON — no markdown, no preamble, no trailing text.

Analyze all three timeframes independently. Use WAIT if the setup is unclear or evidence is weak.

SCORING — integers 1 to 10:
• confidence, technical, fundamental, sentiment, macro: higher = better
• risk: INVERSE — 1 = safest trade, 10 = extremely risky
Use realistic, differentiated values based on actual data. Do NOT output 1 for every numeric field.

CRITICAL: Replace ALL example values below with real data for the requested ticker. Every field is required.

{
  "timeframes": {
    "swing": {
      "verdict": "WAIT",
      "confidence": 5,
      "summary": "One-sentence rationale citing a specific live data point.",
      "entry": {"low": 182.00, "high": 188.00},
      "targets": {"tp1": 200.00, "tp2": 215.00},
      "stopLoss": 175.00,
      "riskReward": "1:2.5",
      "holdDays": "2-5 days",
      "scores": {"technical": 5, "fundamental": 7, "sentiment": 5, "macro": 6, "risk": 5},
      "technical": {
        "trend": "Bearish short-term, below 50-day MA",
        "ema9": "Below at $184", "ema21": "Below at $187",
        "ema50": "Above at $176", "ema200": "Above at $179",
        "rsi": 44.5, "rsiSignal": "Neutral, recovering from oversold",
        "macd": "Negative histogram, no crossover yet",
        "bollingerBands": "Lower half, no squeeze",
        "vwap": "1.2% below intraday VWAP",
        "volume": "85% of 30-day avg, light",
        "support": [175.00, 170.00], "resistance": [190.00, 200.00],
        "keyPattern": "Potential double bottom forming"
      },
      "fundamental": {
        "marketCap": "$149B", "float": "815M shares",
        "pe": "20x", "forwardPE": "18x",
        "revenueGrowth": "+12% YoY", "earningsGrowth": "+20% YoY",
        "epsHistory": "Beat 4 straight quarters",
        "shortInterest": "2.8%", "daysToCover": "1.5 days",
        "institutionalOwnership": "82%",
        "earningsDate": "Aug 27 2026",
        "catalysts": ["Agentforce AI expansion", "Operating margin improvement"]
      },
      "sentiment": {
        "headlines": ["Headline 1", "Headline 2", "Headline 3"],
        "analystConsensus": "Buy — 28 Buy, 8 Hold, 1 Sell | Avg PT $262",
        "recentChanges": ["JPMorgan raised PT to $275 (May 2026)"],
        "optionsActivity": "Mild call buying in Aug $200 strikes"
      },
      "macro": {
        "vix": "VIX 15.7 — complacent, low fear",
        "sectorPerformance": "SaaS -1.2% this week, lagging SPX",
        "fedContext": "Fed on hold, rate cuts expected H2 2026",
        "marketRegime": "Quality rotation, large-cap tech mixed"
      },
      "bullCase": "Beat-and-raise EPS track record with AI monetization ramp.",
      "bearCase": "Stock below key MAs with weak momentum; SaaS headwinds persist.",
      "risks": ["No technical trend confirmation", "Macro SaaS headwinds", "Premium valuation vs peers"],
      "sources": ["https://finance.yahoo.com", "https://seekingalpha.com"]
    },
    "medium": {
      "verdict": "BUY",
      "confidence": 7,
      "summary": "Fill in with real medium-term rationale from your search.",
      "entry": {"low": 178.00, "high": 186.00},
      "targets": {"tp1": 205.00, "tp2": 225.00},
      "stopLoss": 168.00,
      "riskReward": "1:3.0",
      "holdDays": "1-3 weeks",
      "scores": {"technical": 6, "fundamental": 7, "sentiment": 6, "macro": 6, "risk": 4},
      "technical": {"trend": "", "ema9": "", "ema21": "", "ema50": "", "ema200": "", "rsi": 0.0, "rsiSignal": "", "macd": "", "bollingerBands": "", "vwap": "", "volume": "", "support": [], "resistance": [], "keyPattern": ""},
      "fundamental": {"marketCap": "", "float": "", "pe": "", "forwardPE": "", "revenueGrowth": "", "earningsGrowth": "", "epsHistory": "", "shortInterest": "", "daysToCover": "", "institutionalOwnership": "", "earningsDate": "", "catalysts": []},
      "sentiment": {"headlines": [], "analystConsensus": "", "recentChanges": [], "optionsActivity": ""},
      "macro": {"vix": "", "sectorPerformance": "", "fedContext": "", "marketRegime": ""},
      "bullCase": "", "bearCase": "", "risks": [], "sources": []
    },
    "extended": {
      "verdict": "BUY",
      "confidence": 8,
      "summary": "Fill in with real extended-term rationale from your search.",
      "entry": {"low": 175.00, "high": 186.00},
      "targets": {"tp1": 220.00, "tp2": 250.00},
      "stopLoss": 160.00,
      "riskReward": "1:4.0",
      "holdDays": "1 month",
      "scores": {"technical": 6, "fundamental": 8, "sentiment": 6, "macro": 6, "risk": 4},
      "technical": {"trend": "", "ema9": "", "ema21": "", "ema50": "", "ema200": "", "rsi": 0.0, "rsiSignal": "", "macd": "", "bollingerBands": "", "vwap": "", "volume": "", "support": [], "resistance": [], "keyPattern": ""},
      "fundamental": {"marketCap": "", "float": "", "pe": "", "forwardPE": "", "revenueGrowth": "", "earningsGrowth": "", "epsHistory": "", "shortInterest": "", "daysToCover": "", "institutionalOwnership": "", "earningsDate": "", "catalysts": []},
      "sentiment": {"headlines": [], "analystConsensus": "", "recentChanges": [], "optionsActivity": ""},
      "macro": {"vix": "", "sectorPerformance": "", "fedContext": "", "marketRegime": ""},
      "bullCase": "", "bearCase": "", "risks": [], "sources": []
    }
  },
  "bestTimeframe": "medium",
  "bestReason": "One sentence on why this timeframe has the best risk/reward right now."
}

For medium and extended: fill ALL text fields with real data from your search — the empty strings above are structural placeholders only. The numeric scores shown are illustrative; use values that reflect your actual assessment.`;

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const ticker = typeof req.body?.ticker === 'string' ? req.body.ticker.trim().toUpperCase() : '';
  if (!TICKER_RE.test(ticker)) {
    return res.status(400).json({ error: 'ticker must be 1-10 letters/numbers/dot/dash characters' });
  }
  const technicals = req.body?.technicals ?? null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const heartbeat = setInterval(() => {
    sendEvent(res, { type: 'heartbeat' });
  }, 12_000);

  try {
    const ttl = Number(process.env.ANALYSIS_CACHE_TTL_MS || 15 * 60 * 1000);
    const cached = analysisCache.get(cacheKey(ticker));
    if (cached && Date.now() - cached.createdAt < ttl) {
      sendEvent(res, { type: 'delta', text: cached.text });
      sendEvent(res, { type: 'done', cached: true });
      res.end();
      return;
    }

    if (Date.now() < rateLimitedUntil) {
      const seconds = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
      sendEvent(res, {
        type: 'error',
        code: 'rate_limited',
        message: `Claude rate limit is cooling down. Try again in ${seconds}s.`,
      });
      res.end();
      return;
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const stream = client.messages.stream({
      model: process.env.ANTHROPIC_ANALYSIS_MODEL || 'claude-opus-4-20250514',
      max_tokens: Number(process.env.ANTHROPIC_ANALYSIS_MAX_TOKENS || 8000),
      system: COMPACT_SYSTEM_PROMPT,
      tools: [
        {
          type: 'web_search_20260209',
          name: 'web_search',
          allowed_callers: ['direct'],
          max_uses: Number(process.env.ANTHROPIC_WEB_SEARCH_MAX_USES || 2),
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
          content: technicals
            ? `Analyze ${ticker} across swing, medium, and extended timeframes. Today is ${today}.

PRE-COMPUTED TECHNICAL DATA (from ${technicals.barsOfData} days of exact OHLCV — use these values directly, do NOT search for technical indicators):
- Price: $${technicals.price} (as of ${technicals.asOf})
- EMA9:  ${technicals.ema9 ?? 'N/A'} — price is ${technicals.priceVsEma9 ?? 'N/A'}
- EMA21: ${technicals.ema21 ?? 'N/A'} — price is ${technicals.priceVsEma21 ?? 'N/A'}
- EMA50: ${technicals.ema50 ?? 'N/A'} — price is ${technicals.priceVsEma50 ?? 'N/A'}
- EMA200: ${technicals.ema200 ?? 'N/A (< 200 bars available)'} — price is ${technicals.priceVsEma200 ?? 'N/A'}
- RSI (14): ${technicals.rsi ?? 'N/A'} — ${technicals.rsiSignal}
- MACD line: ${technicals.macd ?? 'N/A'} | Signal: ${technicals.macdSignal ?? 'N/A'} | Histogram: ${technicals.macdHist ?? 'N/A'} (${technicals.macdTrend})
- Volume today: ${technicals.volumeToday?.toLocaleString() ?? 'N/A'} vs 20-day avg ${technicals.volumeAvg20?.toLocaleString() ?? 'N/A'} (${technicals.volumeRatio ?? 'N/A'}x)
- 20-day range: $${technicals.low20} – $${technicals.high20}
- 50-day range: $${technicals.low50} – $${technicals.high50}

Since technicals are already provided above, use ALL web searches for: live news & catalysts, analyst ratings & price targets, earnings date/guidance, short interest, options flow, sector ETF performance, VIX, macro/Fed context. Return only JSON.`
            : `Analyze ${ticker} across swing, medium, and extended. Today is ${today}. Keep it compact and return only JSON.`,
        },
      ],
    });

    let accumulated = '';
    let inSearch = false;
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'server_tool_use') {
          inSearch = true;
          sendEvent(res, { type: 'searching', tool: event.content_block.name });
        }
      } else if (event.type === 'content_block_stop') {
        if (inSearch) {
          inSearch = false;
          sendEvent(res, { type: 'search_done' });
        }
      } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        accumulated += event.delta.text;
        sendEvent(res, { type: 'delta', text: event.delta.text });
      } else if (event.type === 'message_delta') {
        sendEvent(res, { type: 'stop_reason', reason: event.delta.stop_reason });
      }
    }

    if (accumulated.trim()) {
      analysisCache.set(cacheKey(ticker), { createdAt: Date.now(), text: accumulated });
    }

    sendEvent(res, { type: 'done' });
    res.end();
  } catch (error) {
    if (error?.status === 429) {
      const retryAfter = Number(error.headers?.get?.('retry-after') || 120);
      rateLimitedUntil = Date.now() + retryAfter * 1000;
      console.warn(`Analyze all API rate-limited. Cooling down for ${retryAfter}s.`);
      sendEvent(res, {
        type: 'error',
        code: 'rate_limited',
        message: `Claude rate limit hit. Try again in ${retryAfter}s.`,
      });
      res.end();
      return;
    }

    console.error('Analyze all API error:', error);
    sendEvent(res, { type: 'error', message: error.message || 'Analysis failed. Please try again.' });
    res.end();
  } finally {
    clearInterval(heartbeat);
  }
}
