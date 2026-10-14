/**
 * Alternative.me Fear & Greed Index service layer.
 * Free public API — no key required.
 *
 * CybeDefend owasp-2025-a06: the payload is checked for numeric bounds
 * before it is returned to clients.
 */

import { LIMITS, clampInt } from "./sanitize";
import { fetchAllowlisted } from "./upstream";

const FEAR_GREED_HOSTS = ["api.alternative.me"] as const;
const FEAR_GREED_BASE = "https://api.alternative.me/fng/";

const cache = new Map<string, { data: FGResponse; expiresAt: number }>();

async function fetchWithCache(url: string, ttlMs = 300_000): Promise<FGResponse> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const text = await fetchAllowlisted(url, FEAR_GREED_HOSTS, {
    headers: { Accept: "application/json" },
    timeoutMs: 8_000,
    maxBytes: 1_000_000,
    redirect: "allowlist",
  });
  const data = JSON.parse(text) as FGResponse;
  if (!data || !Array.isArray(data.data)) {
    throw new Error("Fear & Greed response was not a list");
  }
  cache.set(url, { data, expiresAt: now + ttlMs });
  return data;
}

interface FGRawItem {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

interface FGResponse {
  data: FGRawItem[];
  metadata?: { error: null | string };
}

function fearGreedUrl(limit: number): string {
  const safeLimit = clampInt(limit, LIMITS.fearGreed.min, LIMITS.fearGreed.max);
  const url = new URL(FEAR_GREED_BASE);
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set("format", "json");
  return url.toString();
}

function parsePoint(item: FGRawItem) {
  if (!item || typeof item.value !== "string" || !/^\d{1,3}$/.test(item.value)) {
    throw new Error("Fear & Greed value was not a number");
  }
  const value = Number(item.value);
  if (value < 0 || value > 100) {
    throw new Error("Fear & Greed value was out of range");
  }
  const timestampSec = Number(item.timestamp);
  if (!Number.isFinite(timestampSec) || timestampSec < 0) {
    throw new Error("Fear & Greed timestamp was invalid");
  }
  const classification =
    typeof item.value_classification === "string"
      ? item.value_classification.replace(/[^\w\s-]/g, "").slice(0, 40)
      : "";
  return {
    value,
    value_classification: classification,
    timestamp: new Date(timestampSec * 1000).toISOString(),
  };
}

export async function fetchFearGreed() {
  const data = await fetchWithCache(fearGreedUrl(1), 300_000);
  const item = data.data[0];
  if (!item) throw new Error("Fear & Greed response was empty");
  return {
    ...parsePoint(item),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchFearGreedHistory(limit = 30) {
  const data = await fetchWithCache(fearGreedUrl(limit), 300_000);
  return data.data.map(parsePoint);
}
