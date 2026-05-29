import { useState, useEffect } from 'react';

const KEY = 'ai_trader_log';

function loadTrades() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function saveTrades(trades) {
  localStorage.setItem(KEY, JSON.stringify(trades));
}

const EMPTY_FORM = {
  ticker: '',
  direction: 'long',
  entryPrice: '',
  exitPrice: '',
  shares: '',
  dateOpened: '',
  dateClosed: '',
  notes: '',
};

function pnl(entry, exit, shares, direction) {
  if (!entry || !exit || !shares) return null;
  const mult = direction === 'long' ? 1 : -1;
  return (exit - entry) * shares * mult;
}

function pnlPct(entry, exit, direction) {
  if (!entry || !exit) return null;
  const mult = direction === 'long' ? 1 : -1;
  return ((exit - entry) / entry) * 100 * mult;
}

function TradeForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticker || !form.entryPrice || !form.shares || !form.dateOpened) return;
    onSave({
      ...form,
      id: initial?.id ?? Date.now(),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: form.exitPrice ? parseFloat(form.exitPrice) : null,
      shares: parseFloat(form.shares),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card border border-[#333] mb-6">
      <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-4">
        {initial ? 'Edit Trade' : 'Log New Trade'}
      </h3>
      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="label block mb-1">Ticker</label>
          <input
            value={form.ticker}
            onChange={(e) => set('ticker', e.target.value.toUpperCase())}
            required
            placeholder="NVDA"
            maxLength={10}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div>
          <label className="label block mb-1">Direction</label>
          <select
            value={form.direction}
            onChange={(e) => set('direction', e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className="label block mb-1">Shares</label>
          <input
            type="number"
            value={form.shares}
            onChange={(e) => set('shares', e.target.value)}
            required
            placeholder="100"
            min="0"
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div>
          <label className="label block mb-1">Entry Price</label>
          <input
            type="number"
            value={form.entryPrice}
            onChange={(e) => set('entryPrice', e.target.value)}
            required
            placeholder="0.00"
            step="0.01"
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div>
          <label className="label block mb-1">Exit Price</label>
          <input
            type="number"
            value={form.exitPrice}
            onChange={(e) => set('exitPrice', e.target.value)}
            placeholder="0.00 (open)"
            step="0.01"
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div>
          <label className="label block mb-1">Date Opened</label>
          <input
            type="date"
            value={form.dateOpened}
            onChange={(e) => set('dateOpened', e.target.value)}
            required
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div>
          <label className="label block mb-1">Date Closed</label>
          <input
            type="date"
            value={form.dateClosed}
            onChange={(e) => set('dateClosed', e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label block mb-1">Notes</label>
          <input
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Optional notes..."
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4e9af1]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-[#4e9af1] hover:bg-[#6aaef5] rounded text-sm font-bold text-[#111] transition-colors"
        >
          {initial ? 'Update Trade' : 'Log Trade'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] rounded text-sm text-[#888] border border-[#333] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TradeLog() {
  const [trades, setTrades] = useState(() => loadTrades());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/trades')
      .then((response) => {
        if (!response.ok) throw new Error('Trade sync unavailable');
        return response.json();
      })
      .then((remoteTrades) => {
        if (cancelled || !Array.isArray(remoteTrades)) return;
        setTrades(remoteTrades);
        saveTrades(remoteTrades);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (trade) => {
    let savedTrade = trade;
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade),
      });
      if (response.ok) {
        savedTrade = await response.json();
      }
    } catch (_) {}

    setTrades((prev) => {
      const next = editing
        ? prev.map((t) => (t.id === trade.id ? savedTrade : t))
        : [savedTrade, ...prev];
      saveTrades(next);
      return next;
    });
    setShowForm(false);
    setEditing(null);
  };

  const remove = (id) => {
    fetch(`/api/trades?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
    setTrades((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTrades(next);
      return next;
    });
  };

  const startEdit = (trade) => {
    setEditing({
      ...trade,
      entryPrice: String(trade.entryPrice),
      exitPrice: trade.exitPrice != null ? String(trade.exitPrice) : '',
      shares: String(trade.shares),
    });
    setShowForm(true);
  };

  // Summary stats
  const closed = trades.filter((t) => t.exitPrice != null);
  const wins = closed.filter(
    (t) => pnl(t.entryPrice, t.exitPrice, t.shares, t.direction) > 0,
  );
  const totalPnl = closed.reduce(
    (sum, t) => sum + (pnl(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? 0),
    0,
  );
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-[#f1f1f1]">Trade Log</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-3 py-1.5 bg-[#4e9af1] hover:bg-[#6aaef5] rounded text-xs font-bold text-[#111] transition-colors"
        >
          + New Trade
        </button>
      </div>

      {/* Summary bar */}
      {trades.length > 0 && (
        <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="label mb-1">Total Trades</div>
            <div className="text-xl font-bold">{trades.length}</div>
          </div>
          <div>
            <div className="label mb-1">Win Rate</div>
            <div className={`text-xl font-bold ${winRate >= 50 ? 'text-[#00c46a]' : 'text-[#ff4757]'}`}>
              {closed.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="label mb-1">Total P&L</div>
            <div className={`text-xl font-bold price ${totalPnl >= 0 ? 'text-[#00c46a]' : 'text-[#ff4757]'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="label mb-1">Open Trades</div>
            <div className="text-xl font-bold text-[#ffa502]">
              {trades.filter((t) => t.exitPrice == null).length}
            </div>
          </div>
        </div>
      )}

      {(showForm || editing) && (
        <TradeForm
          initial={editing}
          onSave={save}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {trades.length === 0 && !showForm ? (
        <div className="text-center py-20 text-[#333]">
          <div className="text-4xl mb-4">📓</div>
          <p className="text-sm">No trades logged yet</p>
          <p className="text-xs mt-2">Track your entries, exits, and P&L</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="py-2 pr-4 text-left label">Ticker</th>
                <th className="py-2 pr-4 text-left label">Dir</th>
                <th className="py-2 pr-4 text-right label">Entry</th>
                <th className="py-2 pr-4 text-right label">Exit</th>
                <th className="py-2 pr-4 text-right label">Shares</th>
                <th className="py-2 pr-4 text-right label">P&L $</th>
                <th className="py-2 pr-4 text-right label">P&L %</th>
                <th className="py-2 pr-4 text-left label">Opened</th>
                <th className="py-2 pr-4 text-left label">Closed</th>
                <th className="py-2 text-left label">Notes</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const p = pnl(t.entryPrice, t.exitPrice, t.shares, t.direction);
                const pp = pnlPct(t.entryPrice, t.exitPrice, t.direction);
                const isWin = p != null && p > 0;
                const isOpen = t.exitPrice == null;

                return (
                  <tr
                    key={t.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="py-2 pr-4 font-bold text-[#f1f1f1]">{t.ticker}</td>
                    <td className={`py-2 pr-4 font-bold ${t.direction === 'long' ? 'text-[#00c46a]' : 'text-[#ff4757]'}`}>
                      {t.direction === 'long' ? 'L' : 'S'}
                    </td>
                    <td className="py-2 pr-4 text-right price">${t.entryPrice.toFixed(2)}</td>
                    <td className="py-2 pr-4 text-right price text-[#888]">
                      {isOpen ? <span className="text-[#ffa502]">Open</span> : `$${t.exitPrice.toFixed(2)}`}
                    </td>
                    <td className="py-2 pr-4 text-right price">{t.shares.toLocaleString()}</td>
                    <td className={`py-2 pr-4 text-right price font-bold ${!isOpen && isWin ? 'text-[#00c46a]' : !isOpen ? 'text-[#ff4757]' : 'text-[#555]'}`}>
                      {p != null ? `${p >= 0 ? '+' : ''}$${p.toFixed(0)}` : '—'}
                    </td>
                    <td className={`py-2 pr-4 text-right price font-bold ${!isOpen && isWin ? 'text-[#00c46a]' : !isOpen ? 'text-[#ff4757]' : 'text-[#555]'}`}>
                      {pp != null ? `${pp >= 0 ? '+' : ''}${pp.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-[#888]">{t.dateOpened}</td>
                    <td className="py-2 pr-4 text-[#888]">{t.dateClosed || '—'}</td>
                    <td className="py-2 pr-4 text-[#555] max-w-32 truncate">{t.notes || '—'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(t)}
                          className="text-[#555] hover:text-[#4e9af1] transition-colors"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => remove(t.id)}
                          className="text-[#555] hover:text-[#ff4757] transition-colors"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
