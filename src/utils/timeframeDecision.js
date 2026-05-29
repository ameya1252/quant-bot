export const TIMEFRAME_LABELS = {
  swing: 'Swing: 2-5 days',
  medium: 'Medium: 1-3 weeks',
  extended: 'Extended: 1 month',
};

const ACTION_SCORE = {
  BUY: 28,
  SELL: 18,
  WAIT: 8,
  AVOID: -12,
};

export function timeframeScore(analysis) {
  if (!analysis) return -100;
  const setupScore = analysis.signalQuality?.scannerScore ?? 50;
  const risk = analysis.scores?.risk ?? 5;
  const confidence = analysis.confidence ?? 5;
  const invalidRisk = analysis.riskPlan?.maxAccountRiskPct === 0;

  return Math.round(
    (ACTION_SCORE[analysis.verdict] ?? 0) +
      confidence * 4 +
      setupScore * 0.45 -
      risk * 3 -
      (invalidRisk ? 30 : 0),
  );
}

export function buildTimeframeDecision(results) {
  const comparisons = Object.entries(results)
    .map(([timeframe, analysis]) => ({
      timeframe,
      label: TIMEFRAME_LABELS[timeframe] ?? timeframe,
      score: timeframeScore(analysis),
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      summary: analysis.summary,
      entry: analysis.entry,
      stopLoss: analysis.stopLoss,
      targets: analysis.targets,
      riskPlan: analysis.riskPlan,
      signalQuality: analysis.signalQuality,
    }))
    .sort((a, b) => b.score - a.score);

  const best = comparisons[0];
  const bestAnalysis = results[best.timeframe];

  return {
    ...bestAnalysis,
    selectedTimeframe: best.timeframe,
    bestTiming: {
      timeframe: best.timeframe,
      label: best.label,
      score: best.score,
      reason:
        best.verdict === 'BUY'
          ? `Best actionable window is ${best.label}. Use the entry/stop plan below.`
          : `Best current window is ${best.label}, but the setup is not a clean BUY yet.`,
    },
    timeframeComparison: comparisons,
    timeframeAnalyses: results,
  };
}
