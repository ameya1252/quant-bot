function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-[#1e1e1e] last:border-0 gap-4">
      <span className="label flex-shrink-0 w-36">{label}</span>
      <span className="text-xs text-[#ccc] text-right leading-relaxed">{value || '—'}</span>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color =
    score >= 7 ? 'text-[#00c46a]' : score >= 4 ? 'text-[#ffa502]' : 'text-[#ff4757]';
  return <span className={`font-bold ${color}`}>{score}/10</span>;
}

export default function FundamentalCard({ analysis }) {
  if (!analysis?.fundamental) return null;
  const f = analysis.fundamental;
  const score = analysis.scores?.fundamental;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Fundamental</h3>
        {score != null && <ScoreBadge score={score} />}
      </div>
      <div>
        <Row label="Market Cap" value={f.marketCap} />
        <Row label="Float" value={f.float} />
        <Row label="P/E" value={f.pe} />
        <Row label="Forward P/E" value={f.forwardPE} />
        <Row label="Rev. Growth" value={f.revenueGrowth} />
        <Row label="EPS Growth" value={f.earningsGrowth} />
        <Row label="EPS History" value={f.epsHistory} />
        <Row label="Short Interest" value={f.shortInterest} />
        <Row label="Days to Cover" value={f.daysToCover} />
        <Row label="Inst. Ownership" value={f.institutionalOwnership} />
        <Row
          label="Earnings Date"
          value={f.earningsDate}
        />
      </div>
      {f.catalysts?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#222]">
          <div className="label mb-1.5">Catalysts</div>
          <ul className="space-y-1">
            {f.catalysts.map((c, i) => (
              <li key={i} className="text-xs text-[#ccc] flex gap-2">
                <span className="text-[#ffa502]">◆</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
