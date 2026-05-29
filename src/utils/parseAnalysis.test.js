import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis } from './parseAnalysis.js';

test('parseAnalysis parses raw JSON', () => {
  assert.deepEqual(parseAnalysis('{"verdict":"WAIT"}'), { verdict: 'WAIT' });
});

test('parseAnalysis extracts JSON from fenced response', () => {
  assert.deepEqual(parseAnalysis('```json\n{"verdict":"BUY"}\n```'), { verdict: 'BUY' });
});

test('parseAnalysis throws on non-json output', () => {
  assert.throws(() => parseAnalysis('not json'), /could not be parsed/i);
});
