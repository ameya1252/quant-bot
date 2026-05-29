export function parseAnalysis(text) {
  const trimmed = text.trim();

  // Try raw JSON first
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch (_) {}
  }

  // Try JSON inside markdown code blocks
  const fenceMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch (_) {}
  }

  // Try extracting the outermost JSON object
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_) {}
  }

  throw new Error('Response could not be parsed as JSON. The model may have returned an explanation instead of raw JSON.');
}
