import {
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs font-mono shadow-xl">
      <div className="text-[#888]">{payload[0]?.payload?.axis}</div>
      <div className="text-[#4e9af1] font-bold">{payload[0]?.value}/10</div>
    </div>
  );
};

export default function RadarChartCard({ analysis }) {
  if (!analysis?.scores) return null;
  const { technical, fundamental, sentiment, macro, risk } = analysis.scores;

  // Risk is inverse (1=safest, 10=riskiest), so invert for radar display
  // so that "safe" (low risk) fills outward like other positive scores
  const riskDisplay = risk != null ? 11 - risk : 0;

  const data = [
    { axis: 'Technical', value: technical ?? 0, fullMark: 10 },
    { axis: 'Fundamental', value: fundamental ?? 0, fullMark: 10 },
    { axis: 'Sentiment', value: sentiment ?? 0, fullMark: 10 },
    { axis: 'Macro', value: macro ?? 0, fullMark: 10 },
    { axis: 'Risk', value: riskDisplay, fullMark: 10 },
  ];

  return (
    <div className="card mb-4">
      <span className="label">Score Radar</span>
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={240}>
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="#2a2a2a" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#888', fontSize: 11 }}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#4e9af1"
              fill="#4e9af1"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
            <Tooltip content={<CustomTooltip />} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-5 gap-2 mt-1">
        {[
          { axis: 'Technical', raw: technical ?? 0 },
          { axis: 'Fundamental', raw: fundamental ?? 0 },
          { axis: 'Sentiment', raw: sentiment ?? 0 },
          { axis: 'Macro', raw: macro ?? 0 },
          { axis: 'Risk', raw: risk ?? 0 },
        ].map(({ axis, raw }) => {
          const color =
            axis === 'Risk'
              ? raw >= 7 ? '#ff4757' : raw >= 4 ? '#ffa502' : '#00c46a'
              : raw >= 7 ? '#00c46a' : raw >= 4 ? '#ffa502' : '#ff4757';
          return (
            <div key={axis} className="text-center">
              <div className="text-lg font-bold" style={{ color }}>
                {raw}
              </div>
              <div className="text-[10px] text-[#555]">{axis}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
