import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-[#888] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {p.value?.toFixed(4)}
        </div>
      ))}
    </div>
  );
};

export default function MACDChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  const recent = chartData.slice(-60).filter((d) => d.macdHist != null);
  if (recent.length < 5) return null;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label">MACD (12/26/9)</span>
        <div className="flex gap-3 text-xs">
          <span className="text-[#4e9af1]">― MACD</span>
          <span className="text-[#ffa502]">― Signal</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={recent} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => d?.slice(5)}
            interval={Math.floor(recent.length / 5)}
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#444" />

          <Bar dataKey="macdHist" name="Histogram" radius={[1, 1, 0, 0]}>
            {recent.map((d, i) => (
              <Cell
                key={i}
                fill={d.macdHist >= 0 ? '#00c46a' : '#ff4757'}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
          <Line type="monotone" dataKey="macd" stroke="#4e9af1" strokeWidth={1.5} dot={false} name="MACD" />
          <Line
            type="monotone"
            dataKey="macdSignal"
            stroke="#ffa502"
            strokeWidth={1.5}
            dot={false}
            name="Signal"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
