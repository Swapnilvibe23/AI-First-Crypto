import { useState, useEffect, useCallback } from "react";

export interface Holding {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  amount: number;
  buyPrice: number;
  addedAt: number;
}

const STORAGE_KEY = "aifirstcrypto_holdings";

function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);

  useEffect(() => {
    saveHoldings(holdings);
  }, [holdings]);

  const addHolding = useCallback(
    (holding: Omit<Holding, "id" | "addedAt">) => {
      const newHolding: Holding = {
        ...holding,
        id: `${holding.coinId}-${Date.now()}`,
        addedAt: Date.now(),
      };
      setHoldings((prev) => [...prev, newHolding]);
    },
    []
  );

  const updateHolding = useCallback(
    (id: string, updates: Partial<Pick<Holding, "amount" | "buyPrice">>) => {
      setHoldings((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
      );
    },
    []
  );

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const getHoldingsForCoin = useCallback(
    (coinId: string) => holdings.filter((h) => h.coinId === coinId),
    [holdings]
  );

  return { holdings, addHolding, updateHolding, removeHolding, getHoldingsForCoin };
}
