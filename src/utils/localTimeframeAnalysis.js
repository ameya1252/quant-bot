import { analyzeCandidate } from './quantScanner.js';
import { buildTimeframeDecision } from './timeframeDecision.js';

function recent(candles, n) {
  return candles.slice(Math.max(0, candles.length - n));
}

function high(candles) {
  return Math.max(...candles.map((c) => c.high ?? c.close));
}

function low(candles) {
  return Math.min(...candles.map((c) => c.low ?? c.close));
}

function makeAnalysis(ticker, candles, timeframe, label, holdDays, riskMultiplier, rewardMultiplier) {
  const candidate = analyzeCandidate(ticker, candles);
  const close = candles.at(-1)?.close ?? candidate?.price ?? 0;
  const window = timeframe === 'swing' ? recent(candles, 20) : timeframe === 'medium' ? recent(candles, 50) : recent(candles, 100);
  const support = low(window);
  const resistance = high(window);
  const atrRisk = candidate ? Math.abs(candidate.price - candidate.stopLoss) * riskMultiplier : close * 0.04;
  const stopLoss = Math.max(0.01, close - atrRisk);
  const tp1 = close + atrRisk * rewardMultiplier;
  const tp2 = close + atrRisk * (rewardMultiplier + 1);
  const score = candidate?.score ?? 50;
  const latest = candles.at(-1) ?? {};
  const trendAligned =
    latest.ema9 && latest.ema21 && latest.ema50
      ? latest.close > latest.ema9 && latest.ema9 >= latest.ema21 && latest.close >= latest.ema50
      : false;
  const rsiOk = candidate?.metrics?.rsi == null || (candidate.metrics.rsi >= 45 && candidate.metrics.rsi <= 72);
  const verdict = score >= 48 ? 'WAIT' : 'AVOID';
  const confidence = Math.max(3, Math.min(6, Math.round((score + (trendAligned ? 10 : 0)) / 14)));

  return {
    fallbackMode: true,
    verdict,
    confidence,
    summary: `${label} local technical score is ${score}/100. Wait for Claude/news confirmation before treating this as actionable.`,
    entry: {
      low: +(close * 0.995).toFixed(2),
      high: +(close * 1.01).toFixed(2),
    },
    targets: {
      tp1: +tp1.toFixed(2),
      tp2: +tp2.toFixed(2),
    },
    stopLoss: +stopLoss.toFixed(2),
    riskReward: `1:${rewardMultiplier.toFixed(1)}+`,
    holdDays,
    scores: {
      technical: Math.max(1, Math.min(10, Math.round((score + (trendAligned ? 10 : 0)) / 10))),
      fundamental: 5,
      sentiment: 5,
      macro: 5,
      risk: score >= 75 ? 4 : score >= 48 ? 6 : 8,
    },
    technical: {
      trend: candidate?.reasons?.[0] ?? 'Local price trend only; no AI/news context included.',
      ema9: 'Computed locally in chart view',
      ema21: 'Computed locally in chart view',
      ema50: 'Used by local scanner',
      ema200: 'Used by local scanner when enough data is available',
      rsi: candidate?.metrics?.rsi ?? null,
      rsiSignal: candidate?.metrics?.rsi ? `RSI ${candidate.metrics.rsi}` : 'Unavailable',
      macd: 'Computed locally in chart view',
      bollingerBands: 'Not included in fallback mode',
      vwap: 'Not included in fallback mode',
      volume: candidate?.metrics?.volumeRatio ? `${candidate.metrics.volumeRatio}x 20-day average` : 'Unavailable',
      support: [+support.toFixed(2)],
      resistance: [+resistance.toFixed(2)],
      keyPattern: candidate?.action ?? 'WAIT',
    },
    fundamental: {
      marketCap: 'Not checked in local fallback',
      float: 'Not checked in local fallback',
      pe: 'Not checked in local fallback',
      forwardPE: 'Not checked in local fallback',
      revenueGrowth: 'Not checked in local fallback',
      earningsGrowth: 'Not checked in local fallback',
      epsHistory: 'Not checked in local fallback',
      shortInterest: 'Not checked in local fallback',
      daysToCover: 'Not checked in local fallback',
      institutionalOwnership: 'Not checked in local fallback',
      earningsDate: 'Not checked in local fallback',
      catalysts: [],
    },
    sentiment: {
      headlines: [],
      analystConsensus: 'Not checked in local fallback',
      recentChanges: [],
      optionsActivity: 'Not checked in local fallback',
    },
    macro: {
      vix: 'Not checked in local fallback',
      sectorPerformance: 'Not checked in local fallback',
      fedContext: 'Not checked in local fallback',
      marketRegime: 'Not checked in local fallback',
    },
    bullCase: candidate?.reasons?.join('; ') || 'Local technicals are not strong enough for a clear bull case.',
    bearCase: 'Fallback mode excludes live news, fundamentals, earnings, and macro context.',
    risks: ['Claude analysis was skipped or rate-limited; this is local price/volume math only.'],
    sources: [],
    signalQuality: {
      scannerScore: score,
      confirmations: trendAligned ? 2 : 1,
      checks: [
        { label: 'Trend aligned', ok: Boolean(trendAligned) },
        { label: 'RSI usable', ok: Boolean(rsiOk) },
        { label: 'Volume/price score', ok: score >= 60 },
      ],
    },
  };
}

export function buildLocalTimeframeDecision(ticker, candles) {
  const results = {
    swing: makeAnalysis(ticker, candles, 'swing', 'Swing', '2-5 days', 0.8, 1.8),
    medium: makeAnalysis(ticker, candles, 'medium', 'Medium', '1-3 weeks', 1.2, 2.2),
    extended: makeAnalysis(ticker, candles, 'extended', 'Extended', '1 month', 1.8, 2.8),
  };

  return buildTimeframeDecision(results);
}
