function ScoreBadge({ score }) {
  const color =
    score >= 7 ? 'text-[#00c46a]' : score >= 4 ? 'text-[#ffa502]' : 'text-[#ff4757]';
  return <span className={`font-bold ${color}`}>{score}/10</span>;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-[#1e1e1e] last:border-0 gap-4">
      <span className="label flex-shrink-0 w-28">{label}</span>
      <span className="text-xs text-[#ccc] text-right leading-relaxed">{value || '—'}</span>
    </div>
  );
}

export default function TechnicalCard({ analysis }) {
  if (!analysis?.technical) return null;
  const t = analysis.technical;
  const score = analysis.scores?.technical;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Technical</h3>
        {score != null && <ScoreBadge score={score} />}
      </div>
      <div className="space-y-0">
        <Row label="Trend" value={t.trend} />
        <Row label="EMA 9" value={t.ema9} />
        <Row label="EMA 21" value={t.ema21} />
        <Row label="EMA 50" value={t.ema50} />
        <Row label="EMA 200" value={t.ema200} />
        <Row label="RSI (14)" value={t.rsi != null ? `${t.rsi} — ${t.rsiSignal}` : t.rsiSignal} />
        <Row label="MACD" value={t.macd} />
        <Row label="Bol. Bands" value={t.bollingerBands} />
        <Row label="VWAP" value={t.vwap} />
        <Row label="Volume" value={t.volume} />
        <Row
          label="Support"
          value={t.support?.length ? t.support.map((p) => `$${p}`).join(' / ') : undefined}
        />
        <Row
          label="Resistance"
          value={t.resistance?.length ? t.resistance.map((p) => `$${p}`).join(' / ') : undefined}
        />
        {t.keyPattern && <Row label="Pattern" value={t.keyPattern} />}
      </div>
    </div>
  );
}
