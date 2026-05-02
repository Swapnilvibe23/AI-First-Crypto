import { useState, useEffect } from "react";

const WATCHLIST_KEY = "aifirstcrypto_watchlist";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse watchlist from local storage", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const addCoin = (id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeCoin = (id: string) => {
    setWatchlist((prev) => prev.filter((coinId) => coinId !== id));
  };

  const toggleCoin = (id: string) => {
    if (watchlist.includes(id)) {
      removeCoin(id);
    } else {
      addCoin(id);
    }
  };

  const isInWatchlist = (id: string) => watchlist.includes(id);

  return {
    watchlist,
    addCoin,
    removeCoin,
    toggleCoin,
    isInWatchlist,
  };
}
