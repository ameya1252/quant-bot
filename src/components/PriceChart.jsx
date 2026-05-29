import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  Legend,
} from 'recharts';

function Skel() {
  return (
    <div className="card mb-4">
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton rounded" style={{ height: 280 }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-[#888] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ${p.value?.toFixed(2)}
        </div>
      ))}
    </div>
  );
};

export default function PriceChart({ chartData, analysis }) {
  if (!chartData || chartData.length === 0) {
    if (!analysis) return <Skel />;
    return (
      <div className="card mb-4">
        <div className="h-4 mb-3">
          <span className="label">Price Chart</span>
        </div>
        <div className="flex items-center justify-center h-48 text-[#444] text-xs">
          Chart data unavailable
        </div>
      </div>
    );
  }

  const { entry, targets, stopLoss } = analysis ?? {};
  const hasEntry = entry?.low != null && entry?.high != null;
  const recent = chartData.slice(-60);
  const prices = recent.map((d) => d.close).filter(Boolean);
  const yMin = Math.floor(Math.min(...prices) * 0.98);
  const yMax = Math.ceil(Math.max(...prices) * 1.02);

  const fmt = (v) => `$${v?.toFixed(0)}`;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label">Price + EMAs (60 days)</span>
        <div className="flex gap-3 text-xs">
          <span style={{ color: '#4e9af1' }}>― EMA9</span>
          <span style={{ color: '#ffa502' }}>― EMA21</span>
          <span style={{ color: '#00c46a' }}>― EMA50</span>
          <span style={{ color: '#ff4757' }}>― EMA200</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={recent} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => d?.slice(5)}
            interval={Math.floor(recent.length / 6)}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Entry zone band */}
          {hasEntry && (
            <ReferenceArea
              y1={entry.low}
              y2={entry.high}
              fill="#4e9af1"
              fillOpacity={0.08}
              label={{ value: 'Entry', fill: '#4e9af1', fontSize: 10, position: 'insideTopRight' }}
            />
          )}

          {/* TP and SL levels */}
          {targets?.tp1 && (
            <ReferenceLine
              y={targets.tp1}
              stroke="#00c46a"
              strokeDasharray="4 2"
              label={{ value: 'TP1', fill: '#00c46a', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          {targets?.tp2 && (
            <ReferenceLine
              y={targets.tp2}
              stroke="#00c46a"
              strokeDasharray="4 2"
              label={{ value: 'TP2', fill: '#00c46a', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          {stopLoss && (
            <ReferenceLine
              y={stopLoss}
              stroke="#ff4757"
              strokeDasharray="4 2"
              label={{ value: 'Stop', fill: '#ff4757', fontSize: 10, position: 'insideBottomRight' }}
            />
          )}

          {/* Price line */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#f1f1f1"
            strokeWidth={1.5}
            dot={false}
            name="Close"
          />
          <Line type="monotone" dataKey="ema9" stroke="#4e9af1" strokeWidth={1} dot={false} name="EMA9" />
          <Line type="monotone" dataKey="ema21" stroke="#ffa502" strokeWidth={1} dot={false} name="EMA21" />
          <Line type="monotone" dataKey="ema50" stroke="#00c46a" strokeWidth={1} dot={false} name="EMA50" />
          <Line type="monotone" dataKey="ema200" stroke="#ff4757" strokeWidth={1} strokeDasharray="4 2" dot={false} name="EMA200" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
