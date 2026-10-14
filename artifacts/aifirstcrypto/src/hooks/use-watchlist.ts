import { useState, useEffect } from "react";
import { COIN_ID_PATTERN } from "@/lib/safe-url";

const WATCHLIST_KEY = "aifirstcrypto_watchlist";
const MAX_WATCHLIST = 100;

function readWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && COIN_ID_PATTERN.test(id))
      .slice(0, MAX_WATCHLIST);
  } catch (e) {
    console.error("Failed to parse watchlist from local storage", e);
    return [];
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(readWatchlist);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch {
      // Private mode or a full quota should not crash the page.
    }
  }, [watchlist]);

  const addCoin = (id: string) => {
    if (!COIN_ID_PATTERN.test(id)) return;
    setWatchlist((prev) => (prev.includes(id) || prev.length >= MAX_WATCHLIST ? prev : [...prev, id]));
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
