const RISK_COLORS = {
  1: 'text-[#00c46a]',
  2: 'text-[#00c46a]',
  3: 'text-[#00c46a]',
  4: 'text-[#ffa502]',
  5: 'text-[#ffa502]',
  6: 'text-[#ffa502]',
  7: 'text-[#ff4757]',
  8: 'text-[#ff4757]',
  9: 'text-[#ff4757]',
  10: 'text-[#ff4757]',
};

function RiskMeter({ score }) {
  const pct = score * 10;
  const color =
    score <= 3 ? '#00c46a' : score <= 6 ? '#ffa502' : '#ff4757';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-sm font-bold ${RISK_COLORS[score]}`}>{score}/10</span>
    </div>
  );
}

export default function RiskCard({ analysis }) {
  if (!analysis) return null;
  const risks = analysis.risks ?? [];
  const riskScore = analysis.scores?.risk;
  const sources = analysis.sources ?? [];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Risk Flags</h3>
        {riskScore != null && (
          <span className="label">Risk: <span className={RISK_COLORS[riskScore]}>{riskScore}/10</span></span>
        )}
      </div>

      {riskScore != null && (
        <div className="mb-4">
          <RiskMeter score={riskScore} />
        </div>
      )}

      {analysis.riskPlan && (
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-[#111] border border-[#222] rounded p-3">
            <div className="label mb-1">Max Risk</div>
            <div className="text-sm font-bold text-[#f1f1f1]">
              {analysis.riskPlan.maxAccountRiskPct ? `${analysis.riskPlan.maxAccountRiskPct}%` : 'Blocked'}
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded p-3">
            <div className="label mb-1">Per Share</div>
            <div className="text-sm font-bold text-[#f1f1f1] price">
              {analysis.riskPlan.perShareRisk ? `$${analysis.riskPlan.perShareRisk.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="bg-[#111] border border-[#222] rounded p-3">
            <div className="label mb-1">Local Score</div>
            <div className="text-sm font-bold text-[#4e9af1]">
              {analysis.signalQuality?.scannerScore ?? '—'}/100
            </div>
          </div>
        </div>
      )}

      {analysis.signalQuality?.checks?.length > 0 && (
        <div className="mb-4">
          <div className="label mb-2">Local Confirmations</div>
          <div className="flex flex-wrap gap-2">
            {analysis.signalQuality.checks.map((check) => (
              <span
                key={check.label}
                className={`text-xs rounded border px-2 py-1 ${
                  check.ok
                    ? 'border-[#00c46a]/30 text-[#00c46a] bg-[#00c46a]/10'
                    : 'border-[#ff4757]/30 text-[#ff4757] bg-[#ff4757]/10'
                }`}
              >
                {check.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <ul className="space-y-2 mb-4">
          {risks.map((r, i) => (
            <li key={i} className="flex gap-2 items-start text-xs text-[#ccc]">
              <span className="text-[#ff4757] mt-0.5 flex-shrink-0">⚠</span>
              {r}
            </li>
          ))}
        </ul>
      )}

      {sources.length > 0 && (
        <div className="pt-3 border-t border-[#222]">
          <div className="label mb-1.5">Sources</div>
          <ul className="space-y-0.5">
            {sources.map((s, i) => (
              <li key={i} className="text-xs truncate">
                <a
                  href={s}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4e9af1] hover:underline"
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
