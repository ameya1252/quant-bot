const VALID_VERDICTS = new Set(['BUY', 'SELL', 'AVOID', 'WAIT']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stripCitations(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<cite[^>]*>([\s\S]*?)<\/cite>/gi, '$1').trim();
}

function clampScore(value, fallback = 5) {
  const n = Math.round(toNumber(value, fallback));
  return Math.max(1, Math.min(10, n));
}

function normalizePrice(value) {
  const n = toNumber(value);
  return n && n > 0 ? +n.toFixed(2) : null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function normalizeNumberArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizePrice).filter((item) => item !== null);
}

export function validateAnalysis(raw) {
  if (!isObject(raw)) {
    throw new Error('Analysis must be a JSON object.');
  }

  const verdict = typeof raw.verdict === 'string' ? raw.verdict.toUpperCase() : 'WAIT';
  if (!VALID_VERDICTS.has(verdict)) {
    throw new Error('Analysis verdict must be BUY, SELL, AVOID, or WAIT.');
  }

  const entry = isObject(raw.entry)
    ? {
        low: normalizePrice(raw.entry.low),
        high: normalizePrice(raw.entry.high),
      }
    : { low: null, high: null };

  if (entry.low && entry.high && entry.low > entry.high) {
    [entry.low, entry.high] = [entry.high, entry.low];
  }

  const targets = isObject(raw.targets)
    ? {
        tp1: normalizePrice(raw.targets.tp1),
        tp2: normalizePrice(raw.targets.tp2),
      }
    : { tp1: null, tp2: null };

  const scores = isObject(raw.scores) ? raw.scores : {};
  const technical = isObject(raw.technical) ? raw.technical : {};
  const fundamental = isObject(raw.fundamental) ? raw.fundamental : {};
  const sentiment = isObject(raw.sentiment) ? raw.sentiment : {};
  const macro = isObject(raw.macro) ? raw.macro : {};

  const clean = (s) => stripCitations(s);
  const cleanArr = (arr) => normalizeStringArray(arr).map(clean);

  return {
    ...raw,
    verdict,
    confidence: clampScore(raw.confidence, 5),
    summary: clean(
      typeof raw.summary === 'string' && raw.summary.trim()
        ? raw.summary.trim()
        : 'No summary provided.',
    ),
    entry,
    targets,
    stopLoss: normalizePrice(raw.stopLoss),
    riskReward: typeof raw.riskReward === 'string' ? clean(raw.riskReward) : '—',
    holdDays: typeof raw.holdDays === 'string' ? raw.holdDays : '—',
    scores: {
      technical: clampScore(scores.technical, 5),
      fundamental: clampScore(scores.fundamental, 5),
      sentiment: clampScore(scores.sentiment, 5),
      macro: clampScore(scores.macro, 5),
      risk: clampScore(scores.risk, 5),
    },
    technical: {
      ...Object.fromEntries(
        Object.entries(technical).map(([k, v]) => [k, typeof v === 'string' ? clean(v) : v]),
      ),
      rsi: toNumber(technical.rsi),
      support: normalizeNumberArray(technical.support),
      resistance: normalizeNumberArray(technical.resistance),
    },
    fundamental: Object.fromEntries(
      Object.entries(fundamental).map(([k, v]) =>
        Array.isArray(v) ? [k, cleanArr(v)] : [k, typeof v === 'string' ? clean(v) : v],
      ),
    ),
    sentiment: {
      ...Object.fromEntries(
        Object.entries(sentiment).map(([k, v]) => [k, typeof v === 'string' ? clean(v) : v]),
      ),
      headlines: cleanArr(sentiment.headlines).slice(0, 5),
      recentChanges: cleanArr(sentiment.recentChanges),
    },
    macro: Object.fromEntries(
      Object.entries(macro).map(([k, v]) => [k, typeof v === 'string' ? clean(v) : v]),
    ),
    bullCase: clean(typeof raw.bullCase === 'string' ? raw.bullCase : ''),
    bearCase: clean(typeof raw.bearCase === 'string' ? raw.bearCase : ''),
    risks: cleanArr(raw.risks),
    sources: normalizeStringArray(raw.sources).filter((s) => /^https?:\/\//i.test(s)),
  };
}
