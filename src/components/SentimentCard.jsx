function ScoreBadge({ score }) {
  const color =
    score >= 7 ? 'text-[#00c46a]' : score >= 4 ? 'text-[#ffa502]' : 'text-[#ff4757]';
  return <span className={`font-bold ${color}`}>{score}/10</span>;
}

export default function SentimentCard({ analysis }) {
  if (!analysis?.sentiment) return null;
  const s = analysis.sentiment;
  const score = analysis.scores?.sentiment;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Sentiment</h3>
        {score != null && <ScoreBadge score={score} />}
      </div>

      {s.headlines?.length > 0 && (
        <div className="mb-3">
          <div className="label mb-2">Latest Headlines</div>
          <ul className="space-y-1.5">
            {s.headlines.map((h, i) => (
              <li key={i} className="text-xs text-[#ccc] flex gap-2 leading-relaxed">
                <span className="text-[#555] flex-shrink-0">{i + 1}.</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-[#222] space-y-2">
        {s.analystConsensus && (
          <div>
            <div className="label mb-1">Analyst Consensus</div>
            <p className="text-xs text-[#ccc]">{s.analystConsensus}</p>
          </div>
        )}

        {s.recentChanges?.length > 0 && (
          <div>
            <div className="label mb-1">Recent Changes</div>
            <ul className="space-y-0.5">
              {s.recentChanges.map((c, i) => (
                <li key={i} className="text-xs text-[#ccc]">
                  <span className="text-[#4e9af1]">→ </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {s.optionsActivity && (
          <div>
            <div className="label mb-1">Options Activity</div>
            <p className="text-xs text-[#ccc]">{s.optionsActivity}</p>
          </div>
        )}
      </div>
    </div>
  );
}
