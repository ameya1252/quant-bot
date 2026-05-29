function ScoreBadge({ score }) {
  const color =
    score >= 7 ? 'text-[#00c46a]' : score >= 4 ? 'text-[#ffa502]' : 'text-[#ff4757]';
  return <span className={`font-bold ${color}`}>{score}/10</span>;
}

function Row({ label, value, icon }) {
  return (
    <div className="py-2.5 border-b border-[#1e1e1e] last:border-0">
      <div className="flex items-center gap-1.5 mb-0.5">
        {icon && <span>{icon}</span>}
        <span className="label">{label}</span>
      </div>
      <p className="text-xs text-[#ccc] leading-relaxed pl-0">{value || '—'}</p>
    </div>
  );
}

export default function MacroCard({ analysis }) {
  if (!analysis?.macro) return null;
  const m = analysis.macro;
  const score = analysis.scores?.macro;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Macro Context</h3>
        {score != null && <ScoreBadge score={score} />}
      </div>
      <Row label="VIX" value={m.vix} icon="📊" />
      <Row label="Sector" value={m.sectorPerformance} icon="📈" />
      <Row label="Fed / FOMC" value={m.fedContext} icon="🏦" />
      <Row label="Market Regime" value={m.marketRegime} icon="🌐" />
    </div>
  );
}
