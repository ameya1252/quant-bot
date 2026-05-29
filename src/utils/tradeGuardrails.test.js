import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTradeGuardrails } from './tradeGuardrails.js';

const base = {
  verdict: 'BUY',
  confidence: 8,
  entry: { low: 100, high: 102 },
  targets: { tp1: 110, tp2: 115 },
  stopLoss: 97,
  scores: { technical: 8, fundamental: 6, sentiment: 6, macro: 6, risk: 4 },
  risks: [],
};

test('applyTradeGuardrails keeps confirmed setup actionable', () => {
  const result = applyTradeGuardrails(base, [
    { close: 100, ema9: 99, ema21: 98, rsi: 55, macdHist: 1 },
    { close: 103, ema9: 101, ema21: 99, rsi: 58, macdHist: 1.2 },
  ]);

  assert.equal(result.verdict, 'BUY');
  assert.equal(result.riskPlan.maxAccountRiskPct, 1);
  assert.equal(result.signalQuality.confirmations, 3);
});

test('applyTradeGuardrails downgrades invalid stop placement', () => {
  const result = applyTradeGuardrails({ ...base, stopLoss: 105 }, []);
  assert.equal(result.verdict, 'WAIT');
  assert.equal(result.riskPlan.maxAccountRiskPct, 0);
});
