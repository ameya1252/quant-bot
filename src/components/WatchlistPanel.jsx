import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../hooks/useWatchlist';

const VERDICT_COLOR = {
  BUY: 'text-[#00c46a]',
  SELL: 'text-[#ff4757]',
  AVOID: 'text-[#ff4757]',
  WAIT: 'text-[#ffa502]',
};

export default function WatchlistPanel({ currentTicker }) {
  const { items, remove } = useWatchlist();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label">Watchlist</span>
        <button
          onClick={() => navigate('/watchlist')}
          className="text-xs text-[#4e9af1] hover:underline"
        >
          View all →
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 12).map((item) => (
          <div
            key={item.ticker}
            className={`flex items-center gap-1.5 px-2 py-1 rounded bg-[#222] text-xs cursor-pointer hover:bg-[#2a2a2a] group ${
              item.ticker === currentTicker ? 'border border-[#4e9af1]/40' : 'border border-transparent'
            }`}
            onClick={() => navigate(`/?t=${item.ticker}`)}
          >
            <span className="font-bold text-[#f1f1f1]">{item.ticker}</span>
            {item.lastAnalysis?.verdict && (
              <span className={`font-bold ${VERDICT_COLOR[item.lastAnalysis.verdict] ?? 'text-[#888]'}`}>
                {item.lastAnalysis.verdict}
              </span>
            )}
            <button
              className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ff4757] ml-1 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                remove(item.ticker);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
