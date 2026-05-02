/**
 * Alternative.me Fear & Greed Index service layer.
 * Free public API — no key required.
 */

const FEAR_GREED_BASE = "https://api.alternative.me/fng/";

const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchWithCache<T>(url: string, ttlMs = 300_000): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Fear & Greed API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json() as T;
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
  metadata: { error: null | string };
}

export async function fetchFearGreed() {
  const data = await fetchWithCache<FGResponse>(`${FEAR_GREED_BASE}?limit=1&format=json`, 300_000);
  const item = data.data[0];
  const updatedAt = new Date().toISOString();
  return {
    value: parseInt(item.value, 10),
    value_classification: item.value_classification,
    timestamp: new Date(parseInt(item.timestamp, 10) * 1000).toISOString(),
    updated_at: updatedAt,
  };
}

export async function fetchFearGreedHistory(limit = 30) {
  const data = await fetchWithCache<FGResponse>(
    `${FEAR_GREED_BASE}?limit=${limit}&format=json`,
    300_000
  );
  return data.data.map((item) => ({
    value: parseInt(item.value, 10),
    value_classification: item.value_classification,
    timestamp: new Date(parseInt(item.timestamp, 10) * 1000).toISOString(),
  }));
}
