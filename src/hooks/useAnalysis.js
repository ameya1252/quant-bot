import { useState, useCallback } from 'react';
import { parseAnalysis } from '../utils/parseAnalysis';
import { enrichChartData, buildTechnicalSummary } from '../utils/indicators';
import { validateAnalysis } from '../utils/validateAnalysis';
import { applyTradeGuardrails } from '../utils/tradeGuardrails';
import { buildTimeframeDecision, TIMEFRAME_LABELS } from '../utils/timeframeDecision';
import { buildLocalTimeframeDecision } from '../utils/localTimeframeAnalysis';

async function readAnalysisStream(resp, onEvent) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let parsed;
      try {
        parsed = JSON.parse(line.slice(6));
      } catch (_) {
        continue;
      }

      if (parsed.type === 'delta') {
        accumulated += parsed.text;
      }
      onEvent?.(parsed, accumulated);
    }
  }

  return accumulated;
}

function isRateLimitError(message) {
  return /rate_limit|rate limit|429|input tokens per minute/i.test(message || '');
}

function localFallback(ticker, enrichedChart, reason) {
  const fallback = buildLocalTimeframeDecision(ticker, enrichedChart);
  return {
    ...fallback,
    fallbackMode: true,
    verdict: fallback.verdict === 'AVOID' ? 'AVOID' : 'WAIT',
    confidence: Math.min(fallback.confidence ?? 5, 6),
    risks: [
      reason,
      ...(fallback.risks ?? []),
    ],
  };
}

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [searchCount, setSearchCount] = useState(0);

  const analyze = useCallback(async (ticker) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setChartData(null);
    setSearchCount(0);
    setStatus('Connecting to AI...');

    const chartPromise = fetch(`/api/chart?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((raw) => {
        if (Array.isArray(raw) && raw.length > 0) {
          const enriched = enrichChartData(raw);
          setChartData(enriched);
          return enriched;
        }
        return [];
      })
      .catch(() => []);

    try {
      setStatus('Fetching price data...');
      const enrichedChart = await chartPromise;
      setStatus('Connecting to AI...');

      let searches = 0;
      setStatus('Analyzing all timeframes...');
      const technicals = buildTechnicalSummary(enrichedChart);
      const resp = await fetch('/api/analyze-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, technicals }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        if (resp.status === 429 && enrichedChart.length) {
          const guardedFallback = localFallback(
            ticker,
            enrichedChart,
            'Claude rate limit hit; showing local price/volume fallback until the limit resets.',
          );
          setAnalysis(guardedFallback);
          fetch('/api/analysis-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, timeframe: 'local-fallback', analysis: guardedFallback }),
          }).catch(() => {});
          setStatus('');
          return;
        }
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      let streamError = null;
      const accumulated = await readAnalysisStream(resp, (parsed, text) => {
        if (parsed.type === 'searching') {
          searches += 1;
          setSearchCount(searches);
          setStatus(`Searching live market data... (${searches} searches)`);
        } else if (parsed.type === 'search_done') {
          setStatus('Processing search results with AI...');
        } else if (parsed.type === 'heartbeat') {
          setStatus((prev) =>
            prev.startsWith('Processing') || prev.startsWith('Scoring')
              ? prev
              : 'AI is working, this can take 1–2 min...',
          );
        } else if (parsed.type === 'delta' && text.length > 20) {
          setStatus('Scoring swing, medium, and extended timing...');
        } else if (parsed.type === 'error') {
          streamError = parsed.message || 'Analysis failed';
        }
      });

      if (streamError) {
        if (isRateLimitError(streamError) && enrichedChart.length) {
          const guardedFallback = localFallback(
            ticker,
            enrichedChart,
            'Claude rate limit hit; showing local price/volume fallback until the limit resets.',
          );
          setAnalysis(guardedFallback);
          fetch('/api/analysis-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, timeframe: 'local-fallback', analysis: guardedFallback }),
          }).catch(() => {});
          setStatus('');
          return;
        }
        throw new Error(streamError);
      }

      if (!accumulated.trim()) {
        throw new Error('No response received from AI.');
      }

      const parsedResult = parseAnalysis(accumulated);
      const rawTimeframes = parsedResult.timeframes ?? parsedResult;
      const timeframeResults = {};

      for (const timeframe of Object.keys(TIMEFRAME_LABELS)) {
        if (!rawTimeframes[timeframe]) {
          throw new Error(`Missing ${timeframe} analysis from model response.`);
        }
        const validated = validateAnalysis(rawTimeframes[timeframe]);
        timeframeResults[timeframe] = applyTradeGuardrails(validated, enrichedChart);
      }

      const decision = buildTimeframeDecision(timeframeResults);
      setAnalysis(decision);
      fetch('/api/analysis-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, timeframe: 'all', analysis: decision }),
      }).catch(() => {});
      setStatus('');
    } catch (err) {
      setError(err.message || 'Network error — check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setStatus('');
    setChartData(null);
    setSearchCount(0);
  }, []);

  return { analysis, loading, status, error, chartData, searchCount, analyze, reset };
}
