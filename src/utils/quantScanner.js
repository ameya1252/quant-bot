export const UNIVERSES = {
  mega: [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'AVGO', 'TSLA', 'COST', 'NFLX',
    'AMD', 'PLTR', 'CRM', 'NOW', 'ADBE', 'ORCL', 'INTU', 'QCOM', 'AMAT', 'MU',
  ],
  liquid: [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD', 'PLTR', 'NFLX',
    'SMCI', 'COIN', 'MSTR', 'ARM', 'SHOP', 'UBER', 'HOOD', 'SNOW', 'CRWD', 'NET',
    'JPM', 'BAC', 'XOM', 'CVX', 'LLY', 'UNH', 'COST', 'WMT', 'HD', 'CAT',
  ],
  growth: [
    'NVDA', 'AMD', 'PLTR', 'TSLA', 'COIN', 'MSTR', 'ARM', 'SHOP', 'UBER', 'HOOD',
    'SNOW', 'CRWD', 'NET', 'DDOG', 'MDB', 'RBLX', 'ROKU', 'SOFI', 'CELH', 'ELF',
  ],
};

function avg(values) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function ema(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const k = 2 / (period + 1);
  let current = avg(values.slice(0, period));
  for (let i = period; i < values.length; i += 1) {
    current = values[i] * k + current * (1 - k);
  }
  return current;
}

export function rsi(values, period = 14) {
  if (!Array.isArray(values) || values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    gain += Math.max(change, 0);
    loss += Math.max(-change, 0);
  }
  const avgGain = gain / period;
  const avgLoss = loss / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function atr(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length < period + 1) return null;
  const trs = [];
  for (let i = candles.length - period; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];
    trs.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    ));
  }
  return avg(trs);
}

function pctChange(values, lookback) {
  if (!Array.isArray(values) || values.length <= lookback) return null;
  const current = values.at(-1);
  const previous = values[values.length - 1 - lookback];
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function scoreCandidate(metrics) {
  let score = 0;
  const reasons = [];

  if (metrics.ema200 != null && metrics.close > metrics.ema50 && metrics.ema50 > metrics.ema200) {
    score += 24;
    reasons.push('Primary trend above 50/200 EMA');
  } else if (metrics.close > metrics.ema50) {
    score += 14;
    reasons.push('Price above 50 EMA');
  } else {
    score -= 10;
    reasons.push('Trend not clean');
  }

  if (metrics.return63 > 12 && metrics.return21 > 2) {
    score += 18;
    reasons.push('Strong 3-month and 1-month momentum');
  } else if (metrics.return21 > 0) {
    score += 8;
    reasons.push('Short-term momentum positive');
  }

  if (metrics.rsi >= 50 && metrics.rsi <= 68) {
    score += 14;
    reasons.push('RSI in constructive range');
  } else if (metrics.rsi > 72) {
    score -= 10;
    reasons.push('RSI extended');
  } else if (metrics.rsi < 45) {
    score -= 8;
    reasons.push('RSI weak');
  }

  if (metrics.close >= metrics.high20 * 0.97 && metrics.close <= metrics.high20 * 1.03) {
    score += 14;
    reasons.push('Near 20-day breakout area');
  }

  if (metrics.volumeRatio >= 1.2) {
    score += 10;
    reasons.push('Volume expanding vs 20-day average');
  } else if (metrics.volumeRatio < 0.7) {
    score -= 4;
    reasons.push('Volume below average');
  }

  if (metrics.atrPct >= 1.2 && metrics.atrPct <= 5.5) {
    score += 10;
    reasons.push('Tradable volatility range');
  } else if (metrics.atrPct > 8) {
    score -= 14;
    reasons.push('Volatility too high');
  }

  if (metrics.distanceFromEma20Pct > 12) {
    score -= 14;
    reasons.push('Too stretched above 20 EMA');
  }

  return {
    score: clamp(Math.round(score + 30), 0, 100),
    reasons,
  };
}

export function analyzeCandidate(ticker, candles) {
  const valid = candles?.filter((c) => c.close && c.high && c.low && c.volume != null) ?? [];
  if (valid.length < 80) {
    return null;
  }

  const closes = valid.map((c) => c.close);
  const volumes = valid.map((c) => c.volume);
  const close = closes.at(-1);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = closes.length >= 200 ? ema(closes, 200) : null;
  const rsi14 = rsi(closes, 14);
  const atr14 = atr(valid, 14);
  const avgVolume20 = avg(volumes.slice(-21, -1));
  const volumeRatio = avgVolume20 ? volumes.at(-1) / avgVolume20 : 1;
  const high20 = Math.max(...valid.slice(-20).map((c) => c.high));
  const low20 = Math.min(...valid.slice(-20).map((c) => c.low));

  const metrics = {
    close,
    ema20,
    ema50,
    ema200,
    rsi: rsi14,
    atr: atr14,
    atrPct: atr14 ? (atr14 / close) * 100 : 0,
    volumeRatio,
    high20,
    low20,
    return21: pctChange(closes, 21) ?? 0,
    return63: pctChange(closes, 63) ?? 0,
    distanceFromEma20Pct: ema20 ? ((close - ema20) / ema20) * 100 : 0,
  };

  const scored = scoreCandidate(metrics);
  const stop = Math.max(close - atr14 * 2, low20 * 0.985);
  const risk = close - stop;
  const target1 = close + risk * 2;
  const target2 = close + risk * 3;

  let action = 'WAIT';
  let when = 'Wait for trend, momentum, and volume to improve.';
  if (scored.score >= 78 && close > ema20 && close > ema50 && metrics.rsi <= 70) {
    action = 'BUY_ZONE';
    when = `Actionable near $${close.toFixed(2)} only while price holds above $${stop.toFixed(2)}.`;
  } else if (scored.score >= 65) {
    action = 'WATCH_BREAKOUT';
    when = `Watch for a close above $${high20.toFixed(2)} on volume at least 1.2x average.`;
  }

  return {
    ticker,
    action,
    score: scored.score,
    price: +close.toFixed(2),
    entry: {
      low: +(close * 0.995).toFixed(2),
      high: +(close * 1.01).toFixed(2),
    },
    stopLoss: +stop.toFixed(2),
    targets: {
      tp1: +target1.toFixed(2),
      tp2: +target2.toFixed(2),
    },
    riskReward: risk > 0 ? '1:2.0+' : '—',
    when,
    metrics: {
      rsi: +metrics.rsi.toFixed(1),
      atrPct: +metrics.atrPct.toFixed(1),
      volumeRatio: +metrics.volumeRatio.toFixed(2),
      return21: +metrics.return21.toFixed(1),
      return63: +metrics.return63.toFixed(1),
      distanceFromEma20Pct: +metrics.distanceFromEma20Pct.toFixed(1),
    },
    reasons: scored.reasons.slice(0, 5),
  };
}
