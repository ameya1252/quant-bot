import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';

const VERDICT_STYLES = {
  BUY: 'badge-buy',
  SELL: 'badge-sell',
  AVOID: 'badge-avoid',
  WAIT: 'badge-wait',
};

function TickerCard({ item, onRemove }) {
  const navigate = useNavigate();
  const analysis = item.lastAnalysis;
  const ago = item.analyzedAt
    ? (() => {
        const diff = Date.now() - item.analyzedAt;
        const m = Math.floor(diff / 60000);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);
        if (d > 0) return `${d}d ago`;
        if (h > 0) return `${h}h ago`;
        if (m > 0) return `${m}m ago`;
        return 'just now';
      })()
    : null;

  return (
    <div
      className="card hover:border-[#333] transition-colors cursor-pointer relative group"
      onClick={() => navigate(`/?t=${item.ticker}`)}
    >
      <button
        className="absolute top-3 right-3 text-[#444] hover:text-[#ff4757] opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.ticker);
        }}
        title="Remove from watchlist"
      >
        ×
      </button>

      <div className="flex items-start justify-between mb-3 pr-6">
        <div>
          <div className="text-xl font-black text-[#f1f1f1]">{item.ticker}</div>
          {ago && <div className="text-xs text-[#555] mt-0.5">Analyzed {ago}</div>}
        </div>
        {analysis?.verdict && (
          <span className={VERDICT_STYLES[analysis.verdict] ?? 'badge-wait'}>
            {analysis.verdict}
          </span>
        )}
      </div>

      {analysis ? (
        <>
          {analysis.summary && (
            <p className="text-xs text-[#888] leading-relaxed mb-3 line-clamp-2">
              {analysis.summary}
            </p>
          )}
          {analysis.confidence != null && (
            <div className="flex items-center gap-2">
              <span className="label">Confidence</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${
                      i < analysis.confidence ? 'bg-[#4e9af1]' : 'bg-[#222]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#555]">{analysis.confidence}/10</span>
            </div>
          )}
          {analysis.signalQuality?.scannerScore != null && (
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="label">Setup Score</span>
              <span className="font-bold text-[#4e9af1]">{analysis.signalQuality.scannerScore}/100</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-[#555]">No analysis yet — click to analyze</p>
      )}

      <div className="mt-3 pt-2 border-t border-[#1e1e1e]">
        <span className="text-xs text-[#4e9af1]">Analyze →</span>
      </div>
    </div>
  );
}

export default function Watchlist() {
  const { items, add, remove } = useWatchlist();
  const [input, setInput] = useState('');
  const rankedItems = [...items].sort((a, b) => {
    const aScore = a.lastAnalysis?.signalQuality?.scannerScore ?? -1;
    const bScore = b.lastAnalysis?.signalQuality?.scannerScore ?? -1;
    return bScore - aScore;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const t = input.trim().toUpperCase();
    if (t) {
      add(t);
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-[#f1f1f1]">Watchlist</h1>
        <span className="text-xs text-[#555]">{items.length} tickers</span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Add ticker (e.g. NVDA)"
          maxLength={10}
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-4 py-2 text-sm text-[#f1f1f1] placeholder-[#444] focus:outline-none focus:border-[#4e9af1] font-mono uppercase tracking-widest"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-40 rounded text-sm text-[#f1f1f1] border border-[#333] transition-colors"
        >
          + Add
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-center py-20 text-[#333]">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-sm">Your watchlist is empty</p>
          <p className="text-xs mt-2">Add tickers above or analyze a stock on the dashboard</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedItems.map((item) => (
            <TickerCard key={item.ticker} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
