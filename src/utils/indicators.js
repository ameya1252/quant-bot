export function calcEMA(data, period) {
  if (!data || data.length < period) return data?.map((d) => ({ ...d })) ?? [];
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((s, d) => s + d.close, 0) / period;
  return data.map((d, i) => {
    if (i < period - 1) return { ...d };
    if (i === period - 1) {
      ema = data.slice(0, period).reduce((s, x) => s + x.close, 0) / period;
    } else {
      ema = d.close * k + ema * (1 - k);
    }
    return { ...d, [`ema${period}`]: +ema.toFixed(2) };
  });
}

export function calcRSI(data, period = 14) {
  if (!data || data.length < period + 1) return data?.map((d) => ({ ...d })) ?? [];

  const result = data.map((d) => ({ ...d }));
  const changes = result.slice(1).map((d, i) => d.close - result[i].close);

  let avgGain = changes.slice(0, period).reduce((s, c) => s + Math.max(c, 0), 0) / period;
  let avgLoss = changes.slice(0, period).reduce((s, c) => s + Math.max(-c, 0), 0) / period;

  for (let i = period; i < result.length; i++) {
    const change = result[i].close - result[i - 1].close;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (i === period) {
      avgGain = changes.slice(0, period).reduce((s, c) => s + Math.max(c, 0), 0) / period;
      avgLoss = changes.slice(0, period).reduce((s, c) => s + Math.max(-c, 0), 0) / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i].rsi = +( 100 - 100 / (1 + rs)).toFixed(2);
  }

  return result;
}

export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  if (!data || data.length < slow + signal) return data?.map((d) => ({ ...d })) ?? [];

  const ema = (arr, p) => {
    const k = 2 / (p + 1);
    let e = arr.slice(0, p).reduce((s, x) => s + x.close, 0) / p;
    return arr.map((d, i) => {
      if (i < p - 1) return null;
      if (i === p - 1) e = arr.slice(0, p).reduce((s, x) => s + x.close, 0) / p;
      else e = d.close * k + e * (1 - k);
      return +e.toFixed(4);
    });
  };

  const fastLine = ema(data, fast);
  const slowLine = ema(data, slow);

  const macdLine = data.map((_, i) => {
    if (fastLine[i] == null || slowLine[i] == null) return null;
    return +(fastLine[i] - slowLine[i]).toFixed(4);
  });

  // Signal line = EMA of MACD line
  const validStart = macdLine.findIndex((v) => v != null);
  const macdValues = macdLine.slice(validStart);
  const k = 2 / (signal + 1);
  let sig = macdValues.slice(0, signal).reduce((s, v) => s + (v ?? 0), 0) / signal;

  return data.map((d, i) => {
    const m = macdLine[i];
    if (m == null) return { ...d };

    const offset = i - validStart;
    if (offset < signal - 1) return { ...d, macd: m };
    if (offset === signal - 1) {
      sig = macdValues.slice(0, signal).reduce((s, v) => s + (v ?? 0), 0) / signal;
    } else {
      sig = m * k + sig * (1 - k);
    }
    const hist = +(m - sig).toFixed(4);
    return { ...d, macd: m, macdSignal: +sig.toFixed(4), macdHist: hist };
  });
}

export function enrichChartData(raw) {
  if (!raw || raw.length === 0) return [];
  let data = calcEMA(raw, 9);
  data = calcEMA(data, 21);
  data = calcEMA(data, 50);
  if (raw.length >= 200) data = calcEMA(data, 200);
  data = calcRSI(data, 14);
  data = calcMACD(data, 12, 26, 9);

  // Mark volume bars up/down
  data = data.map((d, i) => ({
    ...d,
    volColor: i === 0 || d.close >= data[i - 1]?.close ? 'up' : 'down',
  }));

  return data;
}

export function buildTechnicalSummary(enriched) {
  if (!enriched || enriched.length < 10) return null;

  const latest = enriched.at(-1);
  const prev5 = enriched.slice(-5);
  const prev20 = enriched.slice(-20);
  const prev50 = enriched.slice(-50);

  const close = latest.close;
  const avgVol20 = prev20.reduce((s, d) => s + (d.volume || 0), 0) / prev20.length;
  const todayVol = latest.volume || 0;

  const high20 = Math.max(...prev20.map((d) => d.high || d.close));
  const low20 = Math.min(...prev20.map((d) => d.low || d.close));
  const high50 = Math.max(...prev50.map((d) => d.high || d.close));
  const low50 = Math.min(...prev50.map((d) => d.low || d.close));

  const macdTrend = (() => {
    const recent = prev5.filter((d) => d.macdHist != null);
    if (recent.length < 2) return 'unknown';
    const rising = recent.at(-1).macdHist > recent.at(-2).macdHist;
    const positive = recent.at(-1).macdHist >= 0;
    return `${positive ? 'positive' : 'negative'} histogram, ${rising ? 'expanding' : 'contracting'}`;
  })();

  const rsi = latest.rsi;
  const rsiSignal =
    rsi == null ? 'unavailable'
    : rsi > 70 ? 'overbought'
    : rsi < 30 ? 'oversold'
    : rsi > 55 ? 'bullish neutral'
    : rsi < 45 ? 'bearish neutral'
    : 'neutral';

  const pctVs = (ref) =>
    ref != null
      ? `${close > ref ? 'above' : 'below'} by ${Math.abs(((close - ref) / ref) * 100).toFixed(1)}%`
      : null;

  return {
    asOf: latest.date,
    price: close,
    ema9: latest.ema9 ?? null,
    ema21: latest.ema21 ?? null,
    ema50: latest.ema50 ?? null,
    ema200: latest.ema200 ?? null,
    rsi: rsi != null ? +rsi.toFixed(1) : null,
    rsiSignal,
    macd: latest.macd != null ? +latest.macd.toFixed(3) : null,
    macdSignal: latest.macdSignal != null ? +latest.macdSignal.toFixed(3) : null,
    macdHist: latest.macdHist != null ? +latest.macdHist.toFixed(3) : null,
    macdTrend,
    volumeToday: todayVol,
    volumeAvg20: Math.round(avgVol20),
    volumeRatio: avgVol20 > 0 ? +(todayVol / avgVol20).toFixed(2) : null,
    high20: +high20.toFixed(2),
    low20: +low20.toFixed(2),
    high50: +high50.toFixed(2),
    low50: +low50.toFixed(2),
    priceVsEma9: pctVs(latest.ema9),
    priceVsEma21: pctVs(latest.ema21),
    priceVsEma50: pctVs(latest.ema50),
    priceVsEma200: pctVs(latest.ema200),
    barsOfData: enriched.length,
  };
}
