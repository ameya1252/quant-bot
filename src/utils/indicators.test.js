import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichChartData } from './indicators.js';

test('enrichChartData adds indicator fields when enough data exists', () => {
  const raw = Array.from({ length: 40 }, (_, i) => ({
    date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    close: 100 + i,
    volume: 1000 + i,
  }));

  const result = enrichChartData(raw);
  const latest = result.at(-1);

  assert.equal(result.length, 40);
  assert.equal(typeof latest.ema9, 'number');
  assert.equal(typeof latest.rsi, 'number');
  assert.equal(typeof latest.macdHist, 'number');
  assert.ok(['up', 'down'].includes(latest.volColor));
});
