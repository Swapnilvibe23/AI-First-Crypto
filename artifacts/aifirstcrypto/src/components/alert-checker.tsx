import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/format";
import type { PriceAlert } from "@/hooks/use-alerts";

const STORAGE_KEY = "aifirstcrypto_alerts";
const CHECK_INTERVAL = 60_000;

function readAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

function fireNotification(alert: PriceAlert, currentPrice: number) {
  const directionText = alert.direction === "above" ? "risen above" : "fallen below";
  const body = `${alert.coinName} has ${directionText} ${formatPrice(alert.targetPrice)}. Current price: ${formatPrice(currentPrice)}`;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`🔔 ${alert.coinSymbol.toUpperCase()} Price Alert`, {
      body,
      icon: alert.coinImage,
      tag: alert.id,
    });
  }

  return body;
}

export function AlertChecker() {
  const { toast } = useToast();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    async function checkAlerts() {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL * 0.9) return;
      lastCheckRef.current = now;

      const alerts = readAlerts();
      if (alerts.length === 0) return;

      const uniqueIds = [...new Set(alerts.map((a) => a.coinId))];
      const triggeredIds: string[] = [];

      await Promise.allSettled(
        uniqueIds.map(async (coinId) => {
          try {
            const res = await fetch(`/api/coins/${coinId}`);
            if (!res.ok) return;
            const coin = await res.json();
            const currentPrice: number = coin.current_price;

            const coinAlerts = alerts.filter((a) => a.coinId === coinId);
            for (const alert of coinAlerts) {
              const triggered =
                (alert.direction === "above" && currentPrice >= alert.targetPrice) ||
                (alert.direction === "below" && currentPrice <= alert.targetPrice);

              if (triggered) {
                triggeredIds.push(alert.id);
                const body = fireNotification(alert, currentPrice);
                toast({
                  title: `🔔 ${alert.coinSymbol.toUpperCase()} Alert Triggered`,
                  description: body,
                });
              }
            }
          } catch {
            // silently skip fetch errors
          }
        })
      );

      if (triggeredIds.length > 0) {
        const remaining = alerts.filter((a) => !triggeredIds.includes(a.id));
        writeAlerts(remaining);
      }
    }

    checkAlerts();
    const id = setInterval(checkAlerts, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [toast]);

  return null;
}
