function latestWith(data, key) {
  if (!Array.isArray(data)) return null;
  for (let i = data.length - 1; i >= 0; i -= 1) {
    if (data[i]?.[key] != null) return data[i];
  }
  return null;
}

function scoreSetup(analysis, chartData) {
  const latest = chartData?.[chartData.length - 1];
  const rsiPoint = latestWith(chartData, 'rsi');
  const macdPoint = latestWith(chartData, 'macdHist');
  const score = analysis.scores ?? {};
  let confirmations = 0;
  const checks = [];

  if (latest?.ema9 && latest?.ema21) {
    const bullish = latest.close > latest.ema9 && latest.ema9 > latest.ema21;
    const bearish = latest.close < latest.ema9 && latest.ema9 < latest.ema21;
    const ok = analysis.verdict === 'SELL' ? bearish : bullish;
    confirmations += ok ? 1 : 0;
    checks.push({ label: 'EMA trend', ok });
  }

  if (rsiPoint?.rsi != null) {
    const ok = analysis.verdict === 'SELL'
      ? rsiPoint.rsi > 35 && rsiPoint.rsi < 75
      : rsiPoint.rsi > 40 && rsiPoint.rsi < 70;
    confirmations += ok ? 1 : 0;
    checks.push({ label: 'RSI usable', ok });
  }

  if (macdPoint?.macdHist != null) {
    const ok = analysis.verdict === 'SELL' ? macdPoint.macdHist < 0 : macdPoint.macdHist > 0;
    confirmations += ok ? 1 : 0;
    checks.push({ label: 'MACD momentum', ok });
  }

  const quality =
    analysis.confidence * 1.6 +
    (score.technical ?? 5) * 1.4 +
    (score.fundamental ?? 5) * 1.0 +
    (score.sentiment ?? 5) +
    (score.macro ?? 5) -
    (score.risk ?? 5) * 1.2 +
    confirmations * 4;

  // quality range: ~10 (weak, 0 confs) → ~71 (exceptional, 3 confs)
  // mapped to 0-100: quality * 1.35 + 7
  return {
    checks,
    confirmations,
    scannerScore: Math.max(0, Math.min(100, Math.round(quality * 1.35 + 7))),
  };
}

function computeRiskPlan(analysis) {
  const entryLow = analysis.entry?.low;
  const entryHigh = analysis.entry?.high;
  const stop = analysis.stopLoss;
  const target = analysis.targets?.tp1;

  if (!entryLow || !entryHigh || !stop) {
    return {
      maxAccountRiskPct: 0,
      positionFormula: 'No trade until entry and stop are valid.',
      invalidation: 'Missing complete entry/stop data.',
    };
  }

  const entry = (entryLow + entryHigh) / 2;
  const isShort = analysis.verdict === 'SELL';
  const perShareRisk = isShort ? stop - entry : entry - stop;
  const targetReward = target ? (isShort ? entry - target : target - entry) : null;

  if (perShareRisk <= 0) {
    return {
      maxAccountRiskPct: 0,
      positionFormula: 'No trade: stop is on the wrong side of entry.',
      invalidation: 'Trade setup has invalid stop placement.',
    };
  }

  const maxAccountRiskPct = analysis.scores?.risk >= 7 ? 0.5 : analysis.confidence >= 8 ? 1 : 0.75;
  const rewardRisk = targetReward && targetReward > 0 ? targetReward / perShareRisk : null;

  return {
    maxAccountRiskPct,
    entryMid: +entry.toFixed(2),
    perShareRisk: +perShareRisk.toFixed(2),
    rewardRisk: rewardRisk ? +rewardRisk.toFixed(2) : null,
    positionFormula: `Shares = account value x ${maxAccountRiskPct}% / $${perShareRisk.toFixed(2)}`,
    invalidation: isShort
      ? `Invalid above $${stop.toFixed(2)}`
      : `Invalid below $${stop.toFixed(2)}`,
  };
}

export function applyTradeGuardrails(analysis, chartData = []) {
  const riskPlan = computeRiskPlan(analysis);
  const signalQuality = scoreSetup(analysis, chartData);
  const risks = [...(analysis.risks ?? [])];
  let verdict = analysis.verdict;
  let confidence = analysis.confidence;

  if (riskPlan.maxAccountRiskPct === 0) {
    verdict = 'WAIT';
    confidence = Math.min(confidence, 5);
    risks.unshift('Setup blocked: invalid or incomplete entry/stop risk plan.');
  }

  if ((verdict === 'BUY' || verdict === 'SELL') && signalQuality.checks.length >= 3 && signalQuality.confirmations < 2) {
    verdict = 'WAIT';
    confidence = Math.min(confidence, 6);
    risks.unshift('Setup downgraded: local technical indicators do not confirm the AI recommendation.');
  }

  if ((verdict === 'BUY' || verdict === 'SELL') && analysis.scores?.risk >= 8) {
    verdict = 'WAIT';
    confidence = Math.min(confidence, 6);
    risks.unshift('Setup downgraded: risk score is too high for an actionable idea.');
  }

  return {
    ...analysis,
    verdict,
    confidence,
    risks: Array.from(new Set(risks)),
    riskPlan,
    signalQuality,
  };
}
