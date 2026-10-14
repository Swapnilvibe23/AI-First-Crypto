import { useState, useEffect, useCallback } from "react";
import { COIN_ID_PATTERN } from "@/lib/safe-url";

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

function isHolding(value: unknown): value is Holding {
  if (!value || typeof value !== "object") return false;
  const holding = value as Partial<Holding>;
  return (
    typeof holding.id === "string" &&
    typeof holding.coinId === "string" &&
    COIN_ID_PATTERN.test(holding.coinId) &&
    typeof holding.coinName === "string" &&
    typeof holding.coinSymbol === "string" &&
    typeof holding.coinImage === "string" &&
    typeof holding.amount === "number" &&
    Number.isFinite(holding.amount) &&
    typeof holding.buyPrice === "number" &&
    Number.isFinite(holding.buyPrice) &&
    typeof holding.addedAt === "number"
  );
}

function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHolding).slice(0, 100);
  } catch {
    return [];
  }
}

function saveHoldings(holdings: Holding[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  } catch {
    // Private mode or a full quota should not crash the page.
  }
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings);

  useEffect(() => {
    saveHoldings(holdings);
  }, [holdings]);

  const addHolding = useCallback(
    (holding: Omit<Holding, "id" | "addedAt">) => {
      if (!COIN_ID_PATTERN.test(holding.coinId)) return;
      if (!Number.isFinite(holding.amount) || !Number.isFinite(holding.buyPrice)) return;
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
