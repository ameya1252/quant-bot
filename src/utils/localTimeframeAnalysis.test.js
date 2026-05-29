import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalTimeframeDecision } from './localTimeframeAnalysis.js';

function candles(length) {
  return Array.from({ length }, (_, i) => {
    const close = 100 + i * 0.4;
    return {
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1000000 + i * 1000,
    };
  });
}

test('buildLocalTimeframeDecision creates all timeframe analyses', () => {
  const decision = buildLocalTimeframeDecision('TEST', candles(220));
  assert.ok(decision.selectedTimeframe);
  assert.equal(Object.keys(decision.timeframeAnalyses).length, 3);
  assert.ok(decision.entry.low > 0);
});
