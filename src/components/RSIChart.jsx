import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rsi = payload[0]?.value;
  const color = rsi >= 70 ? '#ff4757' : rsi <= 30 ? '#00c46a' : '#4e9af1';
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-[#888] mb-1">{label}</div>
      <div style={{ color }}>RSI: {rsi?.toFixed(1)}</div>
    </div>
  );
};

export default function RSIChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  const recent = chartData.slice(-60).filter((d) => d.rsi != null);
  if (recent.length < 5) return null;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label">RSI (14)</span>
        <div className="flex gap-3 text-xs">
          <span className="text-[#ff4757]">— OB (70)</span>
          <span className="text-[#00c46a]">— OS (30)</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={recent} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
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
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={70} stroke="#ff4757" strokeDasharray="3 2" strokeOpacity={0.6} />
          <ReferenceLine y={50} stroke="#444" strokeDasharray="3 2" />
          <ReferenceLine y={30} stroke="#00c46a" strokeDasharray="3 2" strokeOpacity={0.6} />

          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#4e9af1"
            strokeWidth={1.5}
            dot={false}
            name="RSI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
