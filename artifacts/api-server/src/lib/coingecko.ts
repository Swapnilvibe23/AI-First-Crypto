/**
 * CoinGecko API service layer.
 * Uses the free public CoinGecko API — no API key required.
 * All fetch calls go through this module so the API base URL can be swapped easily.
 *
 * Rate-limit resilience strategy:
 *   1. In-memory cache with configurable TTL — served immediately on subsequent calls.
 *   2. Stale-while-revalidate — expired entries are served while a background refresh runs.
 *   3. In-flight deduplication — concurrent requests for the same URL share one fetch.
 *   4. 429 / 5xx fallback — always return stale data rather than throwing when available.
 *   5. Jittered retry — one automatic retry with a small delay on 429 before giving up.
 */

const COINGECKO_PUBLIC_BASE = "https://api.coingecko.com/api/v3";
const COINGECKO_PRO_BASE = "https://pro-api.coingecko.com/api/v3";
const COINGECKO_TIMEOUT_MS = 8_000;
const COINGECKO_MAX_RETRY_DELAY_MS = 6_000;

declare const process: {
  env: Record<string, string | undefined>;
};

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

// Main cache — entries persist indefinitely so stale data can always be served
const cache = new Map<string, CacheEntry>();

// In-flight requests — deduplicates concurrent fetches for the same URL
const inFlight = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let nextFetchAt = 0;
let fetchQueue = Promise.resolve();

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const demoKey = process.env["COINGECKO_DEMO_API_KEY"] ?? process.env["COINGECKO_API_KEY"];
  const proKey = process.env["COINGECKO_PRO_API_KEY"];

  if (demoKey) headers["x-cg-demo-api-key"] = demoKey;
  if (proKey) headers["x-cg-pro-api-key"] = proKey;

  return headers;
}

function getMinIntervalMs() {
  if (process.env["COINGECKO_PRO_API_KEY"]) return 250;
  if (process.env["COINGECKO_DEMO_API_KEY"] || process.env["COINGECKO_API_KEY"]) return 2_000;
  return 4_500;
}

function getCoinGeckoBase() {
  return process.env["COINGECKO_PRO_API_KEY"] ? COINGECKO_PRO_BASE : COINGECKO_PUBLIC_BASE;
}

async function waitForTurn() {
  const previous = fetchQueue;
  let release: () => void = () => {};
  fetchQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;

  const now = Date.now();
  const waitMs = Math.max(0, nextFetchAt - now);
  if (waitMs > 0) await sleep(waitMs);

  nextFetchAt = Date.now() + getMinIntervalMs();
  release();
}

function getRetryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1_000, COINGECKO_MAX_RETRY_DELAY_MS);
  }

  return Math.min(1_500 * (attempt + 1) + Math.random() * 750, COINGECKO_MAX_RETRY_DELAY_MS);
}

async function doFetch<T>(url: string): Promise<T> {
  const headers = buildHeaders();

  for (let attempt = 0; attempt < 2; attempt++) {
    await waitForTurn();

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(COINGECKO_TIMEOUT_MS),
    });

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    if ((res.status === 429 || res.status >= 500) && attempt < 1) {
      await sleep(getRetryDelay(res, attempt));
      continue;
    }

    throw new Error(`CoinGecko error ${res.status}: ${await res.text()}`);
  }

  throw new Error("CoinGecko request failed after retries");
}

async function fetchWithCache<T>(url: string, ttlMs = 60_000): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);

  // Fresh cache hit — return immediately
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  // Stale-while-revalidate: serve stale data immediately and refresh in background
  if (cached) {
    // Fire-and-forget background refresh (don't await, don't throw)
    if (!inFlight.has(url)) {
      const bg = doFetch<T>(url)
        .then((data) => {
          cache.set(url, { data, expiresAt: Date.now() + ttlMs });
        })
        .catch(() => { /* silently keep stale */ })
        .finally(() => inFlight.delete(url));
      inFlight.set(url, bg);
    }
    return cached.data as T;
  }

  // No cache yet — deduplicate concurrent first-time fetches
  if (inFlight.has(url)) {
    return inFlight.get(url)! as Promise<T>;
  }

  const promise = doFetch<T>(url)
    .then((data) => {
      cache.set(url, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, promise);
  return promise as Promise<T>;
}

// Global market overview
export async function fetchGlobalMarket() {
  const data = await fetchWithCache<{ data: Record<string, unknown> }>(
    `${getCoinGeckoBase()}/global`,
    120_000
  );
  const d = data.data as Record<string, unknown>;
  const totalMarketCap = d.total_market_cap as Record<string, number>;
  const totalVolume = d.total_volume as Record<string, number>;
  return {
    total_market_cap_usd: totalMarketCap?.usd ?? 0,
    total_volume_usd: totalVolume?.usd ?? 0,
    btc_dominance: (d.market_cap_percentage as Record<string, number>)?.btc ?? 0,
    active_cryptocurrencies: (d.active_cryptocurrencies as number) ?? 0,
    market_cap_change_percentage_24h: (d.market_cap_change_percentage_24h_usd as number) ?? 0,
  };
}

// Paginated coin list with prices
export async function fetchCoins(page = 1, per_page = 100, order = "market_cap_desc") {
  const url = `${getCoinGeckoBase()}/coins/markets?vs_currency=usd&order=${order}&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=24h`;
  return fetchWithCache<unknown[]>(url, 60_000);
}

// Trending coins (CoinGecko trending endpoint)
export async function fetchTrending() {
  const data = await fetchWithCache<{
    coins: Array<{ item: Record<string, unknown> }>;
  }>(`${getCoinGeckoBase()}/search/trending`, 120_000);

  return (data.coins ?? []).map(({ item }) => ({
    id: item.id as string,
    name: item.name as string,
    symbol: item.symbol as string,
    market_cap_rank: (item.market_cap_rank as number | null) ?? null,
    thumb: item.thumb as string,
    price_btc: (item.price_btc as number) ?? 0,
  }));
}

// Coin detail
export async function fetchCoinDetail(id: string) {
  const url = `${getCoinGeckoBase()}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
  return fetchWithCache<Record<string, unknown>>(url, 90_000);
}

// Coin price history — longer TTL since history data changes slowly
export async function fetchCoinHistory(id: string, days = 7) {
  const url = `${getCoinGeckoBase()}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
  // 5-minute TTL: historical data doesn't change minute-to-minute
  return fetchWithCache<{ prices: [number, number][] }>(url, 300_000);
}
