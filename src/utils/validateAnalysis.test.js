import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis } from './validateAnalysis.js';

test('validateAnalysis normalizes scores and prices', () => {
  const result = validateAnalysis({
    verdict: 'buy',
    confidence: 99,
    summary: 'Setup',
    entry: { low: 20, high: 10 },
    targets: { tp1: '25.129', tp2: 30 },
    stopLoss: '9.876',
    scores: { technical: 11, fundamental: 0, sentiment: 6, macro: 5, risk: 4 },
    sources: ['https://example.com', 'bad'],
  });

  assert.equal(result.verdict, 'BUY');
  assert.equal(result.confidence, 10);
  assert.deepEqual(result.entry, { low: 10, high: 20 });
  assert.equal(result.targets.tp1, 25.13);
  assert.equal(result.stopLoss, 9.88);
  assert.equal(result.scores.technical, 10);
  assert.equal(result.scores.fundamental, 1);
  assert.deepEqual(result.sources, ['https://example.com']);
});

test('validateAnalysis rejects invalid verdicts', () => {
  assert.throws(() => validateAnalysis({ verdict: 'MOON' }), /verdict/i);
});
