import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UNIVERSES = [
  { value: 'liquid', label: 'Liquid Leaders' },
  { value: 'mega', label: 'Mega Cap' },
  { value: 'growth', label: 'Growth/Momentum' },
];

const ACTION_STYLE = {
  BUY_ZONE: 'badge-buy',
  WATCH_BREAKOUT: 'badge-wait',
  WAIT: 'badge-avoid',
};

function scoreColor(score) {
  if (score >= 78) return 'text-[#00c46a]';
  if (score >= 65) return 'text-[#ffa502]';
  return 'text-[#888]';
}

function Candidate({ item }) {
  const navigate = useNavigate();

  return (
    <div className="card hover:border-[#333] transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[#f1f1f1]">{item.ticker}</span>
            <span className={ACTION_STYLE[item.action] ?? 'badge-wait'}>
              {item.action.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-[#555] mt-1 price">${item.price.toFixed(2)}</div>
        </div>
        <div className={`text-2xl font-black ${scoreColor(item.score)}`}>{item.score}</div>
      </div>

      <p className="text-xs text-[#ccc] leading-relaxed mb-4">{item.when}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-[#111] border border-[#222] rounded p-2">
          <div className="label mb-1">Entry</div>
          <div className="text-xs price text-[#4e9af1]">
            ${item.entry.low.toFixed(2)}-${item.entry.high.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded p-2">
          <div className="label mb-1">Stop</div>
          <div className="text-xs price text-[#ff4757]">${item.stopLoss.toFixed(2)}</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded p-2">
          <div className="label mb-1">TP1</div>
          <div className="text-xs price text-[#00c46a]">${item.targets.tp1.toFixed(2)}</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded p-2">
          <div className="label mb-1">TP2</div>
          <div className="text-xs price text-[#00c46a]">${item.targets.tp2.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div>
          <div className="label mb-1">RSI</div>
          <div>{item.metrics.rsi}</div>
        </div>
        <div>
          <div className="label mb-1">Vol x</div>
          <div>{item.metrics.volumeRatio}</div>
        </div>
        <div>
          <div className="label mb-1">21D</div>
          <div className={item.metrics.return21 >= 0 ? 'text-[#00c46a]' : 'text-[#ff4757]'}>
            {item.metrics.return21 > 0 ? '+' : ''}{item.metrics.return21}%
          </div>
        </div>
      </div>

      <ul className="space-y-1 mb-4">
        {item.reasons.map((reason) => (
          <li key={reason} className="text-xs text-[#888]">• {reason}</li>
        ))}
      </ul>

      <button
        onClick={() => navigate(`/?t=${item.ticker}`)}
        className="w-full px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] rounded text-xs text-[#f1f1f1] border border-[#333] transition-colors"
      >
        Deep Analyze With Claude
      </button>
    </div>
  );
}

export default function Scanner() {
  const [universe, setUniverse] = useState('liquid');
  const [custom, setCustom] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (custom.trim()) {
        params.set('tickers', custom);
      } else {
        params.set('universe', universe);
      }
      const response = await fetch(`/api/scan?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Scan failed');
      setData(payload);
    } catch (err) {
      setError(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold text-[#f1f1f1]">Quant Scanner</h1>
          <p className="text-xs text-[#555] mt-1">
            Ranks liquid stocks by trend, momentum, breakout, volume, and volatility.
          </p>
        </div>
        <button
          onClick={scan}
          disabled={loading}
          className="px-4 py-2 bg-[#4e9af1] hover:bg-[#6aaef5] disabled:opacity-40 rounded text-xs font-bold text-[#111] transition-colors"
        >
          {loading ? 'Scanning...' : 'Refresh Scan'}
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-[220px_1fr] gap-3">
          <select
            value={universe}
            onChange={(e) => {
              setCustom('');
              setUniverse(e.target.value);
            }}
            disabled={loading || custom.trim()}
            className="bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-[#f1f1f1] focus:outline-none focus:border-[#4e9af1] font-mono"
          >
            {UNIVERSES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              scan();
            }}
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase())}
              placeholder="Optional custom tickers: NVDA,AMD,PLTR"
              className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-[#f1f1f1] placeholder-[#444] focus:outline-none focus:border-[#4e9af1] font-mono uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-40 rounded text-xs text-[#f1f1f1] border border-[#333]"
            >
              Scan
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="card border border-[#ff4757]/40 bg-[#ff4757]/5 mb-4">
          <div className="text-[#ff4757] text-sm font-bold mb-1">Scan Failed</div>
          <p className="text-xs text-[#ccc]">{error}</p>
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-5 w-24 mb-4" />
              <div className="skeleton h-20 mb-3" />
              <div className="skeleton h-28" />
            </div>
          ))}
        </div>
      )}

      {!loading && data?.results?.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3 text-xs text-[#555]">
            <span>{data.count} ranked candidates</span>
            <span>As of {new Date(data.asOf).toLocaleString()}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((item) => (
              <Candidate key={item.ticker} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
