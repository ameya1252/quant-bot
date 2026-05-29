import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCandidate, ema, rsi, atr } from './quantScanner.js';

function candles(length, start = 100, step = 0.6) {
  return Array.from({ length }, (_, i) => {
    const close = start + i * step;
    return {
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
      open: close - 0.4,
      high: close + 1,
      low: close - 1,
      close,
      volume: i > length - 5 ? 2000000 : 1000000,
    };
  });
}

test('ema calculates latest exponential average', () => {
  const value = ema([1, 2, 3, 4, 5], 3);
  assert.equal(Number(value.toFixed(2)), 4);
});

test('rsi returns high value for persistent gains', () => {
  assert.ok(rsi(candles(30).map((c) => c.close), 14) > 70);
});

test('atr calculates average true range', () => {
  assert.ok(atr(candles(30), 14) > 0);
});

test('analyzeCandidate ranks strong trends and builds trade levels', () => {
  const result = analyzeCandidate('TEST', candles(220));
  assert.equal(result.ticker, 'TEST');
  assert.ok(result.score >= 60);
  assert.ok(['BUY_ZONE', 'WATCH_BREAKOUT', 'WAIT'].includes(result.action));
  assert.ok(result.stopLoss < result.price);
  assert.ok(result.targets.tp1 > result.price);
});
