# quant-bot

AI-assisted trading setup analyzer. It does not execute trades.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a real local env file:

```bash
cp .env.example .env
```

3. Put your Claude API key in `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key
ANTHROPIC_ANALYSIS_MODEL=claude-opus-4-20250514
ANTHROPIC_CHAT_MODEL=claude-3-haiku-20240307
ANTHROPIC_ANALYSIS_MAX_TOKENS=3500
ANTHROPIC_WEB_SEARCH_MAX_USES=2
ANALYSIS_CACHE_TTL_MS=900000
APP_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
APP_USER_ID=ameya
```

Do not put the real key in `.env.example`; that file is only a template.

4. Initialize Neon tables:

```bash
npm run db:init
```

5. Run locally:

```bash
npm run dev
```

This starts both the local API server on `http://localhost:3000` and Vite on `http://localhost:5173`.

## Checks

```bash
npm test
npm run build
```

## What It Does

- Scans preset or custom stock universes and ranks candidates by quant-style setup score.
- Pulls recent daily chart data for local EMA, RSI, MACD, and volume checks.
- Asks Claude for live market context and a structured trade setup.
- Validates the JSON response before rendering it.
- Downgrades risky or technically unconfirmed ideas to `WAIT`.
- Shows entry, targets, stop, invalidation, max account-risk guidance, and local confirmation score.
- Ranks analyzed watchlist names by setup score.
- Stores watchlist, analysis history, scanner runs, trade logs, chat messages, and personal events in Neon.
- Provides a bottom-right chat agent that uses your stored context.

## Scanner Logic

The scanner is deterministic and does not need Claude. It ranks names using:

- Trend alignment: price vs 20/50/200 EMA.
- Momentum: 21-day and 63-day return.
- RSI regime: prefers constructive momentum that is not too extended.
- Breakout location: proximity to 20-day highs.
- Volume expansion: latest volume vs 20-day average.
- Volatility/risk: ATR percentage and distance from moving averages.

Use high-ranked scanner names as candidates, then click "Deep Analyze With Claude" for news, catalysts, and context.

## Cost Controls

The app defaults to `claude-opus-4-20250514` for analysis and `claude-3-haiku-20240307` for chat. Opus has higher limits on this account, so cost is controlled by fewer web searches, lower max output, scanner-first workflow, and 15-minute per-ticker caching.

To spend less, lower:

```bash
ANTHROPIC_WEB_SEARCH_MAX_USES=2
ANTHROPIC_ANALYSIS_MAX_TOKENS=3500
```

To reduce cost further:

```bash
ANTHROPIC_WEB_SEARCH_MAX_USES=1
ANTHROPIC_ANALYSIS_MAX_TOKENS=2500
```

## Important Limits

This is a decision-support tool, not a broker or execution system. For production-grade accuracy, add paid market-data providers for fundamentals, earnings, analyst ratings, news, options flow, VIX, and sector ETF data instead of relying only on AI search and the Yahoo chart endpoint.
