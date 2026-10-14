import { useState, useEffect, useCallback } from "react";
import { COIN_ID_PATTERN } from "@/lib/safe-url";

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  targetPrice: number;
  direction: "above" | "below";
  createdAt: number;
}

const STORAGE_KEY = "aifirstcrypto_alerts";

function isPriceAlert(value: unknown): value is PriceAlert {
  if (!value || typeof value !== "object") return false;
  const alert = value as Partial<PriceAlert>;
  return (
    typeof alert.id === "string" &&
    typeof alert.coinId === "string" &&
    COIN_ID_PATTERN.test(alert.coinId) &&
    typeof alert.coinName === "string" &&
    typeof alert.coinSymbol === "string" &&
    typeof alert.coinImage === "string" &&
    typeof alert.targetPrice === "number" &&
    Number.isFinite(alert.targetPrice) &&
    (alert.direction === "above" || alert.direction === "below") &&
    typeof alert.createdAt === "number"
  );
}

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPriceAlert).slice(0, 50);
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // Private mode or a full quota should not crash the page.
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const addAlert = useCallback(
    (alert: Omit<PriceAlert, "id" | "createdAt">) => {
      if (!COIN_ID_PATTERN.test(alert.coinId) || !Number.isFinite(alert.targetPrice)) return;
      const newAlert: PriceAlert = {
        ...alert,
        id: `${alert.coinId}-${Date.now()}`,
        createdAt: Date.now(),
      };
      setAlerts((prev) => [...prev, newAlert]);
    },
    []
  );

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const removeAlerts = useCallback((ids: string[]) => {
    setAlerts((prev) => prev.filter((a) => !ids.includes(a.id)));
  }, []);

  const getAlertsForCoin = useCallback(
    (coinId: string) => alerts.filter((a) => a.coinId === coinId),
    [alerts]
  );

  return { alerts, addAlert, removeAlert, removeAlerts, getAlertsForCoin };
}
