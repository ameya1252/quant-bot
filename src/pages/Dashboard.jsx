import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TickerInput from '../components/TickerInput';
import VerdictCard from '../components/VerdictCard';
import TradeSetup from '../components/TradeSetup';
import TechnicalCard from '../components/TechnicalCard';
import FundamentalCard from '../components/FundamentalCard';
import SentimentCard from '../components/SentimentCard';
import MacroCard from '../components/MacroCard';
import RiskCard from '../components/RiskCard';
import PriceChart from '../components/PriceChart';
import RSIChart from '../components/RSIChart';
import MACDChart from '../components/MACDChart';
import VolumeChart from '../components/VolumeChart';
import RadarChart from '../components/RadarChart';
import WatchlistPanel from '../components/WatchlistPanel';
import TimeframeComparison from '../components/TimeframeComparison';
import { useAnalysis } from '../hooks/useAnalysis';
import { useWatchlist } from '../hooks/useWatchlist';

function Skeleton({ h = 32, className = '' }) {
  return (
    <div
      className={`skeleton rounded mb-4 ${className}`}
      style={{ height: h }}
    />
  );
}

function LoadingState({ status, searchCount }) {
  return (
    <div className="mb-4">
      <div className="card border border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#4e9af1] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <div className="text-sm text-[#f1f1f1]">{status || 'Analyzing...'}</div>
            {searchCount > 0 && (
              <div className="text-xs text-[#555] mt-0.5">
                {searchCount} web {searchCount === 1 ? 'search' : 'searches'} completed
              </div>
            )}
          </div>
        </div>
      </div>
      <Skeleton h={120} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton h={180} />
        <Skeleton h={180} />
      </div>
      <Skeleton h={300} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton h={160} />
        <Skeleton h={160} />
        <Skeleton h={160} />
        <Skeleton h={200} />
      </div>
    </div>
  );
}

function pnl(entry, exit, shares, direction) {
  if (!entry || !exit || !shares) return null;
  const mult = direction === 'long' ? 1 : -1;
  return (exit - entry) * shares * mult;
}

function DashboardOverview({ onAnalyze, watchlist }) {
  const [scan, setScan] = useState(null);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetch('/api/scan?universe=mega')
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (payload?.results) setScan(payload);
      })
      .catch(() => {});

    fetch('/api/trades')
      .then((response) => response.ok ? response.json() : [])
      .then((payload) => {
        if (Array.isArray(payload)) setTrades(payload);
      })
      .catch(() => {});
  }, []);

  const topSetups = scan?.results?.slice(0, 4) ?? [];
  const closed = trades.filter((trade) => trade.exitPrice != null);
  const totalPnl = closed.reduce(
    (sum, trade) => sum + (pnl(trade.entryPrice, trade.exitPrice, trade.shares, trade.direction) ?? 0),
    0,
  );
  const wins = closed.filter((trade) => pnl(trade.entryPrice, trade.exitPrice, trade.shares, trade.direction) > 0);
  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : null;
  const bestWatch = [...watchlist]
    .filter((item) => item.lastAnalysis)
    .sort((a, b) => (b.lastAnalysis?.signalQuality?.scannerScore ?? 0) - (a.lastAnalysis?.signalQuality?.scannerScore ?? 0))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="label mb-2">Top Scanner</div>
          <div className="text-2xl font-black text-[#f1f1f1]">{topSetups[0]?.ticker ?? '—'}</div>
          <div className="text-xs text-[#555] mt-1">
            {topSetups[0] ? `${topSetups[0].score}/100 · ${topSetups[0].action.replace('_', ' ')}` : 'Run scanner for candidates'}
          </div>
        </div>
        <div className="card">
          <div className="label mb-2">Watchlist</div>
          <div className="text-2xl font-black text-[#f1f1f1]">{watchlist.length}</div>
          <div className="text-xs text-[#555] mt-1">Tracked tickers</div>
        </div>
        <div className="card">
          <div className="label mb-2">Closed Trades</div>
          <div className="text-2xl font-black text-[#f1f1f1]">{closed.length}</div>
          <div className="text-xs text-[#555] mt-1">{winRate == null ? 'No win rate yet' : `${winRate}% win rate`}</div>
        </div>
        <div className="card">
          <div className="label mb-2">Realized P&L</div>
          <div className={`text-2xl font-black price ${totalPnl >= 0 ? 'text-[#00c46a]' : 'text-[#ff4757]'}`}>
            {closed.length ? `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(0)}` : '—'}
          </div>
          <div className="text-xs text-[#555] mt-1">From trade log</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Best Setups Right Now</h3>
            <span className="text-xs text-[#555]">Mega-cap scan</span>
          </div>
          {topSetups.length ? (
            <div className="divide-y divide-[#222]">
              {topSetups.map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => onAnalyze(item.ticker)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[#111] px-2 rounded transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#f1f1f1]">{item.ticker}</div>
                    <div className="text-xs text-[#888] mt-0.5">{item.when}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black text-[#4e9af1]">{item.score}</div>
                    <div className="text-[10px] text-[#555]">{item.action.replace('_', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#555] py-8 text-center">Loading scanner preview...</div>
          )}
        </div>

        <div className="card">
          <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Watchlist Pulse</h3>
          {bestWatch.length ? (
            <div className="space-y-3">
              {bestWatch.map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => onAnalyze(item.ticker)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-bold text-sm text-[#f1f1f1]">{item.ticker}</div>
                    <div className="text-[10px] text-[#555]">{item.lastAnalysis?.verdict}</div>
                  </div>
                  <div className="text-xs text-[#4e9af1]">
                    {item.lastAnalysis?.signalQuality?.scannerScore ?? '—'}/100
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#555] leading-relaxed">
              Analyze or add tickers to build a personalized watchlist pulse.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FallbackNotice() {
  return (
    <div className="card border-[#ffa502]/40 bg-[#ffa502]/5 mb-4">
      <div className="text-[#ffa502] text-sm font-bold mb-1">Local Technical Mode</div>
      <p className="text-xs text-[#ccc] leading-relaxed">
        Claude is rate-limited, so this view uses price, volume, RSI, EMAs, and ATR only.
        News, fundamentals, macro, catalysts, and sentiment are intentionally not scored here.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentTicker, setCurrentTicker] = useState('');
  const { analysis, loading, status, error, chartData, searchCount, analyze, reset } =
    useAnalysis();
  const { items: watchlistItems, add, updateAnalysis, has } = useWatchlist();

  // Support ?t=TICKER in URL (from watchlist clicks)
  useEffect(() => {
    const t = searchParams.get('t');
    if (t && t !== currentTicker) {
      setCurrentTicker(t);
      analyze(t);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to watchlist when analysis completes
  useEffect(() => {
    if (analysis && currentTicker) {
      updateAnalysis(currentTicker, {
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        summary: analysis.summary,
        scores: analysis.scores,
        riskPlan: analysis.riskPlan,
        signalQuality: analysis.signalQuality,
      });
    }
  }, [analysis]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = (ticker) => {
    setCurrentTicker(ticker);
    reset();
    analyze(ticker);
  };

  const handleNewAnalysis = () => {
    setCurrentTicker('');
    reset();
    navigate('/', { replace: true });
  };

  const inWatchlist = currentTicker ? has(currentTicker) : false;

  return (
    <div>
      <WatchlistPanel currentTicker={currentTicker} />
      <TickerInput onAnalyze={handleAnalyze} loading={loading} />

      {error && (
        <div className="card border border-[#ff4757]/40 bg-[#ff4757]/5 mb-4">
          <div className="text-[#ff4757] text-sm font-bold mb-1">Analysis Failed</div>
          <p className="text-xs text-[#ccc]">{error}</p>
        </div>
      )}

      {loading && <LoadingState status={status} searchCount={searchCount} />}

      {analysis && !loading && (
        <>
          {/* Header actions */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#f1f1f1]">{currentTicker}</h2>
            <div className="flex gap-2">
              <button
                onClick={handleNewAnalysis}
                className="text-xs px-3 py-1.5 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-[#f1f1f1] border border-[#333] transition-colors"
              >
                New Analysis
              </button>
              {!inWatchlist && currentTicker && (
                <button
                  onClick={() => add(currentTicker)}
                  className="text-xs px-3 py-1.5 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-[#f1f1f1] border border-[#333] transition-colors"
                >
                  + Watchlist
                </button>
              )}
              {inWatchlist && (
                <span className="text-xs px-3 py-1.5 rounded bg-[#222] text-[#00c46a] border border-[#00c46a]/30">
                  ✓ Watching
                </span>
              )}
            </div>
          </div>

          {/* Main verdict + setup */}
          <VerdictCard analysis={analysis} ticker={currentTicker} />
          {analysis.fallbackMode && <FallbackNotice />}
          <TimeframeComparison analysis={analysis} />

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <TradeSetup analysis={analysis} />
            <RadarChart analysis={analysis} />
          </div>

          {/* Price chart */}
          <PriceChart chartData={chartData} analysis={analysis} />

          {/* Analysis cards 2x2 */}
          {analysis.fallbackMode ? (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <TechnicalCard analysis={analysis} />
              <RiskCard analysis={analysis} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <TechnicalCard analysis={analysis} />
              <FundamentalCard analysis={analysis} />
              <SentimentCard analysis={analysis} />
              <MacroCard analysis={analysis} />
            </div>
          )}

          {/* Secondary charts */}
          {chartData && (
            <>
              <RSIChart chartData={chartData} />
              <div className="grid sm:grid-cols-2 gap-4">
                <MACDChart chartData={chartData} />
                <VolumeChart chartData={chartData} />
              </div>
            </>
          )}

          {/* Risk card */}
          {!analysis.fallbackMode && (
            <div className="mt-4">
              <RiskCard analysis={analysis} />
            </div>
          )}
        </>
      )}

      {!analysis && !loading && !error && (
        <DashboardOverview onAnalyze={handleAnalyze} watchlist={watchlistItems} />
      )}
    </div>
  );
}
