const VERDICT_STYLES = {
  BUY: {
    bg: 'bg-[#00c46a]/10',
    border: 'border-[#00c46a]/40',
    text: 'text-[#00c46a]',
    glow: 'shadow-[0_0_30px_rgba(0,196,106,0.15)]',
  },
  SELL: {
    bg: 'bg-[#ff4757]/10',
    border: 'border-[#ff4757]/40',
    text: 'text-[#ff4757]',
    glow: 'shadow-[0_0_30px_rgba(255,71,87,0.15)]',
  },
  AVOID: {
    bg: 'bg-[#ff4757]/10',
    border: 'border-[#ff4757]/40',
    text: 'text-[#ff4757]',
    glow: 'shadow-[0_0_30px_rgba(255,71,87,0.1)]',
  },
  WAIT: {
    bg: 'bg-[#ffa502]/10',
    border: 'border-[#ffa502]/40',
    text: 'text-[#ffa502]',
    glow: 'shadow-[0_0_30px_rgba(255,165,2,0.15)]',
  },
};

function ConfidencePips({ value }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-4 rounded-sm transition-colors ${
            i < value ? 'bg-[#4e9af1]' : 'bg-[#222]'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-[#888]">{value}/10</span>
    </div>
  );
}

export default function VerdictCard({ analysis, ticker }) {
  if (!analysis) return null;
  const style = VERDICT_STYLES[analysis.verdict] ?? VERDICT_STYLES.WAIT;

  return (
    <div className={`card mb-4 ${style.bg} border ${style.border} ${style.glow}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`text-5xl font-black tracking-tight ${style.text}`}>
            {analysis.verdict}
          </div>
          <div className="text-[#888] text-xs mt-1 font-mono">{ticker}</div>
          {analysis.bestTiming?.label && (
            <div className="text-[#4e9af1] text-xs mt-1">{analysis.bestTiming.label}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#ccc] mb-3 leading-relaxed">{analysis.summary}</p>
          <div>
            <div className="label mb-1.5">Confidence</div>
            <ConfidencePips value={analysis.confidence ?? 0} />
          </div>
        </div>

        <div className="flex-shrink-0 grid grid-cols-2 gap-x-6 gap-y-2 text-right">
          <div>
            <div className="label">Hold</div>
            <div className="text-sm text-[#f1f1f1]">{analysis.holdDays ?? '—'}</div>
          </div>
          <div>
            <div className="label">R:R</div>
            <div className="text-sm text-[#f1f1f1]">{analysis.riskReward ?? '—'}</div>
          </div>
          <div className="col-span-2">
            <div className="label">Stop Loss</div>
            <div className="text-sm text-[#ff4757] price">${analysis.stopLoss?.toFixed(2) ?? '—'}</div>
          </div>
          {analysis.signalQuality?.scannerScore != null && (
            <div className="col-span-2">
              <div className="label">Setup Score</div>
              <div className="text-sm text-[#4e9af1]">{analysis.signalQuality.scannerScore}/100</div>
            </div>
          )}
        </div>
      </div>

      {analysis.verdict === 'WAIT' && analysis.risks?.[0] && (
        <div className="mt-4 border-t border-[#222] pt-3 text-xs text-[#ffa502]">
          {analysis.risks[0]}
        </div>
      )}

      {(analysis.bullCase || analysis.bearCase) && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3 pt-4 border-t border-[#222]">
          {analysis.bullCase && (
            <div>
              <div className="label text-[#00c46a] mb-1">▲ Bull Case</div>
              <p className="text-xs text-[#aaa] leading-relaxed">{analysis.bullCase}</p>
            </div>
          )}
          {analysis.bearCase && (
            <div>
              <div className="label text-[#ff4757] mb-1">▼ Bear Case</div>
              <p className="text-xs text-[#aaa] leading-relaxed">{analysis.bearCase}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
