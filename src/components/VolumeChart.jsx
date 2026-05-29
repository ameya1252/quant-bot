import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const vol = payload[0]?.value;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-[#888] mb-1">{label}</div>
      <div className="text-[#f1f1f1]">Vol: {(vol / 1_000_000).toFixed(1)}M</div>
    </div>
  );
};

function avgVolume(data) {
  if (!data?.length) return 0;
  return data.reduce((s, d) => s + (d.volume || 0), 0) / data.length;
}

export default function VolumeChart({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  const recent = chartData.slice(-60).filter((d) => d.volume > 0);
  if (recent.length < 5) return null;

  const avg = avgVolume(recent);
  const fmtVol = (v) => `${(v / 1_000_000).toFixed(0)}M`;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label">Volume</span>
        <span className="text-xs text-[#555]">Avg: {fmtVol(avg)}</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={recent} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => d?.slice(5)}
            interval={Math.floor(recent.length / 6)}
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtVol}
            width={38}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avg} stroke="#555" strokeDasharray="3 2" />
          <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
            {recent.map((d, i) => (
              <Cell
                key={i}
                fill={d.volColor === 'up' ? '#00c46a' : '#ff4757'}
                fillOpacity={0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
