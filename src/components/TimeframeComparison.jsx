const VERDICT_CLASS = {
  BUY: 'text-[#00c46a]',
  SELL: 'text-[#ff4757]',
  WAIT: 'text-[#ffa502]',
  AVOID: 'text-[#ff4757]',
};

export default function TimeframeComparison({ analysis }) {
  const rows = analysis?.timeframeComparison ?? [];
  if (!rows.length) return null;

  return (
    <div className="card mb-4 border-[#333]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Best Timing Window</h3>
          <div className="text-sm text-[#f1f1f1] mt-1">{analysis.bestTiming?.label}</div>
        </div>
        <div className="text-xs text-[#888]">{analysis.bestTiming?.reason}</div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {rows.map((row) => {
          const selected = row.timeframe === analysis.selectedTimeframe;
          return (
            <div
              key={row.timeframe}
              className={`rounded border p-3 bg-[#111] ${
                selected ? 'border-[#4e9af1]' : 'border-[#222]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-sm font-bold text-[#f1f1f1]">{row.label}</div>
                  {selected && <div className="text-[10px] text-[#4e9af1] mt-0.5">Selected</div>}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black ${VERDICT_CLASS[row.verdict] ?? 'text-[#888]'}`}>
                    {row.verdict}
                  </div>
                  <div className="text-[10px] text-[#555]">score {row.score}</div>
                </div>
              </div>

              <p className="text-xs text-[#888] leading-relaxed mb-3 line-clamp-3">{row.summary}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="label mb-0.5">Entry</div>
                  <div className="price text-[#4e9af1]">
                    {row.entry?.low && row.entry?.high
                      ? `$${row.entry.low.toFixed(2)}-${row.entry.high.toFixed(2)}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="label mb-0.5">Stop</div>
                  <div className="price text-[#ff4757]">
                    {row.stopLoss ? `$${row.stopLoss.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="label mb-0.5">Confidence</div>
                  <div>{row.confidence}/10</div>
                </div>
                <div>
                  <div className="label mb-0.5">Local</div>
                  <div>{row.signalQuality?.scannerScore ?? '—'}/100</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
