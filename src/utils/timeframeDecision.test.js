import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeframeDecision, timeframeScore } from './timeframeDecision.js';

const base = {
  verdict: 'WAIT',
  confidence: 5,
  scores: { risk: 5 },
  signalQuality: { scannerScore: 50 },
  riskPlan: { maxAccountRiskPct: 0.75 },
  summary: 'Base',
};

test('timeframeScore prefers actionable high confidence setup', () => {
  const wait = timeframeScore(base);
  const buy = timeframeScore({
    ...base,
    verdict: 'BUY',
    confidence: 8,
    scores: { risk: 3 },
    signalQuality: { scannerScore: 85 },
  });

  assert.ok(buy > wait);
});

test('buildTimeframeDecision selects best timeframe and preserves comparisons', () => {
  const decision = buildTimeframeDecision({
    swing: base,
    medium: {
      ...base,
      verdict: 'BUY',
      confidence: 8,
      scores: { risk: 3 },
      signalQuality: { scannerScore: 82 },
      summary: 'Best',
    },
    extended: { ...base, verdict: 'AVOID', confidence: 3 },
  });

  assert.equal(decision.selectedTimeframe, 'medium');
  assert.equal(decision.summary, 'Best');
  assert.equal(decision.timeframeComparison.length, 3);
});
