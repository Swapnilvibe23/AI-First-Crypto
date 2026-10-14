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
 *
 * CybeDefend owasp-2025-a06: responses are treated as untrusted. Image URLs are
 * restricted to http(s), request inputs are bounded, and the host is fixed.
 */

import {
  LIMITS,
  clampInt,
  isCoinId,
  isCoinOrder,
  safeImageUrl,
  type CoinOrder,
} from "./sanitize";
import { fetchAllowlisted, UpstreamHttpError } from "./upstream";

const COINGECKO_HOSTS = ["api.coingecko.com"] as const;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const MAX_CACHE_ENTRIES = 200;
const MAX_IN_FLIGHT = 40;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

// Main cache — entries persist until the cap so stale data can still be served
const cache = new Map<string, CacheEntry>();

// In-flight requests — deduplicates concurrent fetches for the same URL
const inFlight = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function storeCache(url: string, data: unknown, ttlMs: number) {
  if (cache.has(url)) cache.delete(url);
  cache.set(url, { data, expiresAt: Date.now() + ttlMs });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

async function readJson<T>(url: string): Promise<T> {
  const text = await fetchAllowlisted(url, COINGECKO_HOSTS, {
    headers: { Accept: "application/json" },
    timeoutMs: 10_000,
    maxBytes: 5_000_000,
    redirect: "allowlist",
  });
  return JSON.parse(text) as T;
}

async function doFetch<T>(url: string): Promise<T> {
  // Jitter 0–300 ms to spread burst requests
  await sleep(Math.random() * 300);

  try {
    return await readJson<T>(url);
  } catch (err) {
    if (err instanceof UpstreamHttpError && err.status === 429) {
      await sleep(2000 + Math.random() * 1000);
      return readJson<T>(url);
    }
    throw err;
  }
}

function startFetch<T>(url: string, ttlMs: number): Promise<T> {
  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T>;
  if (inFlight.size >= MAX_IN_FLIGHT) {
    return Promise.reject(new Error("Too many CoinGecko requests in flight"));
  }

  const promise = doFetch<T>(url)
    .then((data) => {
      storeCache(url, data, ttlMs);
      return data;
    })
    .finally(() => inFlight.delete(url));

  inFlight.set(url, promise);
  return promise;
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
    if (!inFlight.has(url) && inFlight.size < MAX_IN_FLIGHT) {
      const bg = doFetch<T>(url)
        .then((data) => {
          storeCache(url, data, ttlMs);
        })
        .catch(() => {
          /* silently keep stale */
        })
        .finally(() => inFlight.delete(url));
      inFlight.set(url, bg);
    }
    return cached.data as T;
  }

  return startFetch<T>(url, ttlMs);
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function withSafeImage<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const image = (row as { image?: unknown }).image;
  if (typeof image !== "string") return row;
  return { ...row, image: safeImageUrl(image) };
}

// Global market overview
export async function fetchGlobalMarket() {
  const data = await fetchWithCache<{ data: Record<string, unknown> }>(
    `${COINGECKO_BASE}/global`,
    120_000,
  );
  if (!data?.data || typeof data.data !== "object") {
    throw new Error("CoinGecko global response was empty");
  }
  const d = data.data;
  const totalMarketCap = d.total_market_cap as Record<string, unknown> | undefined;
  const totalVolume = d.total_volume as Record<string, unknown> | undefined;
  const dominance = d.market_cap_percentage as Record<string, unknown> | undefined;
  return {
    total_market_cap_usd: num(totalMarketCap?.usd),
    total_volume_usd: num(totalVolume?.usd),
    btc_dominance: num(dominance?.btc),
    active_cryptocurrencies: num(d.active_cryptocurrencies),
    market_cap_change_percentage_24h: num(d.market_cap_change_percentage_24h_usd),
  };
}

// Paginated coin list with prices
export async function fetchCoins(
  page = 1,
  perPage = 100,
  order: CoinOrder | string = "market_cap_desc",
) {
  const safePage = clampInt(page, LIMITS.page.min, LIMITS.page.max);
  const safePerPage = clampInt(perPage, LIMITS.perPage.min, LIMITS.perPage.max);
  if (!isCoinOrder(order)) throw new Error("Invalid coin sort order");

  const url = new URL(`${COINGECKO_BASE}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", order);
  url.searchParams.set("per_page", String(safePerPage));
  url.searchParams.set("page", String(safePage));
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const rows = await fetchWithCache<unknown[]>(url.toString(), 60_000);
  if (!Array.isArray(rows)) throw new Error("CoinGecko markets response was not a list");
  return rows.map(withSafeImage);
}

// Trending coins (CoinGecko trending endpoint)
export async function fetchTrending() {
  const data = await fetchWithCache<{
    coins: Array<{ item: Record<string, unknown> }>;
  }>(`${COINGECKO_BASE}/search/trending`, 120_000);

  const coins = Array.isArray(data?.coins) ? data.coins : [];
  return coins.flatMap(({ item }) => {
    if (!item || typeof item !== "object") return [];
    return [{
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : "",
      symbol: typeof item.symbol === "string" ? item.symbol : "",
      market_cap_rank: typeof item.market_cap_rank === "number" ? item.market_cap_rank : null,
      thumb: safeImageUrl(item.thumb),
      price_btc: num(item.price_btc),
    }];
  });
}

// Coin detail
export async function fetchCoinDetail(id: string) {
  if (!isCoinId(id)) throw new Error("Invalid coin id");
  const url = new URL(`${COINGECKO_BASE}/coins/${encodeURIComponent(id)}`);
  url.searchParams.set("localization", "false");
  url.searchParams.set("tickers", "false");
  url.searchParams.set("market_data", "true");
  url.searchParams.set("community_data", "false");
  url.searchParams.set("developer_data", "false");
  return fetchWithCache<Record<string, unknown>>(url.toString(), 90_000);
}

// Coin price history — longer TTL since history data changes slowly
export async function fetchCoinHistory(id: string, days = 7) {
  if (!isCoinId(id)) throw new Error("Invalid coin id");
  const safeDays = clampInt(days, LIMITS.days.min, LIMITS.days.max);
  const url = new URL(`${COINGECKO_BASE}/coins/${encodeURIComponent(id)}/market_chart`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", String(safeDays));
  // 5-minute TTL: historical data doesn't change minute-to-minute
  return fetchWithCache<{ prices: [number, number][] }>(url.toString(), 300_000);
}
