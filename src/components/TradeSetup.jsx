function Row({ label, value, valueClass = 'text-[#f1f1f1]', hint }) {
  return (
    <tr className="border-b border-[#222] last:border-0">
      <td className="py-2.5 pr-4 label w-28">{label}</td>
      <td className={`py-2.5 price font-semibold ${valueClass}`}>{value}</td>
      {hint && <td className="py-2.5 pl-4 text-xs text-[#555] hidden sm:table-cell">{hint}</td>}
    </tr>
  );
}

export default function TradeSetup({ analysis }) {
  if (!analysis) return null;
  const { entry, targets, stopLoss, riskReward, holdDays } = analysis;
  const hasEntry = entry?.low != null && entry?.high != null;

  const entryMid = hasEntry ? ((entry.low + entry.high) / 2).toFixed(2) : null;

  return (
    <div className="card mb-4">
      <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Trade Setup</h3>
      <table className="w-full">
        <tbody>
          <Row
            label="Entry Zone"
            value={
              hasEntry
                ? `$${entry.low.toFixed(2)} – $${entry.high.toFixed(2)}`
                : '—'
            }
            valueClass="text-[#4e9af1]"
            hint={entryMid ? `Mid: $${entryMid}` : undefined}
          />
          <Row
            label="Target 1"
            value={targets?.tp1 ? `$${targets.tp1.toFixed(2)}` : '—'}
            valueClass="text-[#00c46a]"
            hint={
              entryMid && targets?.tp1
                ? `+${(((targets.tp1 - entryMid) / entryMid) * 100).toFixed(1)}%`
                : undefined
            }
          />
          <Row
            label="Target 2"
            value={targets?.tp2 ? `$${targets.tp2.toFixed(2)}` : '—'}
            valueClass="text-[#00c46a]"
            hint={
              entryMid && targets?.tp2
                ? `+${(((targets.tp2 - entryMid) / entryMid) * 100).toFixed(1)}%`
                : undefined
            }
          />
          <Row
            label="Stop Loss"
            value={stopLoss ? `$${stopLoss.toFixed(2)}` : '—'}
            valueClass="text-[#ff4757]"
            hint={
              entryMid && stopLoss
                ? `-${(((entryMid - stopLoss) / entryMid) * 100).toFixed(1)}%`
                : undefined
            }
          />
          <Row label="Risk/Reward" value={riskReward ?? '—'} valueClass="text-[#ffa502]" />
          <Row label="Hold Time" value={holdDays ?? '—'} />
          {analysis.riskPlan && (
            <>
              <Row
                label="Acct Risk"
                value={
                  analysis.riskPlan.maxAccountRiskPct
                    ? `${analysis.riskPlan.maxAccountRiskPct}% max`
                    : 'No trade'
                }
                valueClass={analysis.riskPlan.maxAccountRiskPct ? 'text-[#00c46a]' : 'text-[#ff4757]'}
              />
              <Row
                label="Position"
                value={analysis.riskPlan.positionFormula}
                valueClass="text-[#888]"
              />
              <Row
                label="Invalid"
                value={analysis.riskPlan.invalidation}
                valueClass="text-[#ffa502]"
              />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
