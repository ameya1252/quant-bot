// This is the client-side copy of the system prompt for reference.
// The actual prompt used by Claude lives in api/analyze.js (server-side).
export const SYSTEM_PROMPT_SUMMARY = `Professional quant swing trader analysis using Claude claude-opus-4-8 with live web search.
Covers: Technical (EMA/RSI/MACD/BB/VWAP) + Fundamental + Sentiment + Macro.
Output: Structured JSON with verdict, entry zone, targets, stop loss, and detailed breakdowns.`;
