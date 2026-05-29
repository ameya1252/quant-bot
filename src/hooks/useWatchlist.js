import { useState, useCallback, useEffect } from 'react';

const KEY = 'ai_trader_watchlist';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (_) {
    return [];
  }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [items, setItems] = useState(() => load());
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/watchlist')
      .then((response) => {
        if (!response.ok) throw new Error('Watchlist sync unavailable');
        return response.json();
      })
      .then((remoteItems) => {
        if (cancelled || !Array.isArray(remoteItems)) return;
        setItems(remoteItems);
        save(remoteItems);
        setRemoteReady(true);
      })
      .catch(() => {
        if (!cancelled) setRemoteReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback((ticker) => {
    const upper = ticker.toUpperCase().trim();
    if (!upper) return;
    setItems((prev) => {
      if (prev.find((i) => i.ticker === upper)) return prev;
      const next = [{ ticker: upper, addedAt: Date.now(), lastAnalysis: null }, ...prev];
      save(next);
      fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: upper }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const remove = useCallback((ticker) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.ticker !== ticker);
      save(next);
      fetch(`/api/watchlist?ticker=${encodeURIComponent(ticker)}`, {
        method: 'DELETE',
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateAnalysis = useCallback((ticker, analysis) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.ticker === ticker
          ? { ...i, lastAnalysis: analysis, analyzedAt: Date.now() }
          : i,
      );
      save(next);
      fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, analysis }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const has = useCallback(
    (ticker) => items.some((i) => i.ticker === ticker.toUpperCase()),
    [items],
  );

  return { items, add, remove, updateAnalysis, has, remoteReady };
}
