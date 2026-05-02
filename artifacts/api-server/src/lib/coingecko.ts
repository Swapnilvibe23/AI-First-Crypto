/**
 * CoinGecko API service layer.
 * Uses the free public CoinGecko API — no API key required.
 * All fetch calls go through this module so the API base URL can be swapped easily.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Simple in-memory cache to avoid hitting rate limits (60 calls/min on free tier)
const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchWithCache<T>(url: string, ttlMs = 60_000): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`CoinGecko error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as T;
  cache.set(url, { data, expiresAt: now + ttlMs });
  return data;
}

// Global market overview
export async function fetchGlobalMarket() {
  const data = await fetchWithCache<{ data: Record<string, unknown> }>(
    `${COINGECKO_BASE}/global`,
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
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${per_page}&page=${page}&sparkline=true&price_change_percentage=24h`;
  return fetchWithCache<unknown[]>(url, 60_000);
}

// Trending coins (CoinGecko trending endpoint)
export async function fetchTrending() {
  const data = await fetchWithCache<{
    coins: Array<{ item: Record<string, unknown> }>;
  }>(`${COINGECKO_BASE}/search/trending`, 120_000);

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
  const url = `${COINGECKO_BASE}/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
  return fetchWithCache<Record<string, unknown>>(url, 60_000);
}

// Coin price history (OHLC not needed — use market_chart for simplicity)
export async function fetchCoinHistory(id: string, days = 7) {
  const url = `${COINGECKO_BASE}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`;
  return fetchWithCache<{ prices: [number, number][] }>(url, 60_000);
}
