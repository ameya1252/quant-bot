import { useState } from 'react';

const POPULAR = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'META', 'AMD', 'PLTR'];

export default function TickerInput({ onAnalyze, loading }) {
  const [ticker, setTicker] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    onAnalyze(t);
  };

  const quickPick = (t) => {
    setTicker(t);
    onAnalyze(t);
  };

  return (
    <div className="card mb-6">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="TICKER (e.g. NVDA)"
            maxLength={10}
            disabled={loading}
            className="w-full bg-[#111] border border-[#333] rounded px-4 py-2.5 text-sm text-[#f1f1f1] placeholder-[#444] focus:outline-none focus:border-[#4e9af1] font-mono uppercase tracking-widest"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !ticker.trim()}
          className="px-6 py-2.5 bg-[#4e9af1] hover:bg-[#6aaef5] disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-bold text-[#111] transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
              Analyzing
            </span>
          ) : (
            'Analyze All Timeframes →'
          )}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="label">Quick:</span>
        {POPULAR.map((t) => (
          <button
            key={t}
            onClick={() => quickPick(t)}
            disabled={loading}
            className="text-xs px-2 py-0.5 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-[#f1f1f1] transition-colors disabled:opacity-40"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
