import { useState, useEffect, useCallback } from "react";

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

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const addAlert = useCallback(
    (alert: Omit<PriceAlert, "id" | "createdAt">) => {
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
