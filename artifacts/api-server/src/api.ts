/**
 * Framework-neutral API handlers, shared by the Express server (local dev)
 * and the Netlify Function that serves /api/* in production.
 *
 * Market routes only read the snapshot that the scheduled ingest writes to
 * Netlify Blobs. No route here calls CoinMarketCap, so visitor traffic never
 * spends API credits.
 */

import {
  GetCoinDetailParams,
  GetCoinDetailResponse,
  GetCoinHistoryParams,
  GetCoinHistoryQueryParams,
  GetCoinHistoryResponse,
  GetCoinsQueryParams,
  GetCoinsResponse,
  GetFearGreedHistoryQueryParams,
  GetFearGreedHistoryResponse,
  GetFearGreedResponse,
  GetGlobalMarketResponse,
  GetMarketSummaryResponse,
  GetNewsQueryParams,
  GetNewsResponse,
  GetTopMoversResponse,
  GetTrendingResponse,
  HealthCheckResponse,
} from "./lib/schemas";
import { fetchFearGreed, fetchFearGreedHistory } from "./lib/feargreed";
import { coinLogoUrl, type CoinRecord } from "./lib/market-data";
import {
  KEYS,
  readHistory,
  readJSON,
  readTrackedCoins,
  type GlobalSnapshot,
  type HistoryPoint,
  type InfoSnapshot,
  type SparklineSnapshot,
} from "./lib/market-store";
import { fetchNews } from "./lib/news";
import { generateCoinSummary, generateMarketSummary } from "./lib/summary";

export interface ApiResult {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

export interface ApiLogger {
  error: (err: unknown, msg: string) => void;
}

const DAY_MS = 86_400_000;

/** Coin IDs from the previous data provider that differ from CoinMarketCap slugs. */
const LEGACY_COIN_IDS: Record<string, string> = {
  ripple: "xrp",
  binancecoin: "bnb",
  "avalanche-2": "avalanche",
  polkadot: "polkadot-new",
  "matic-network": "polygon-ecosystem-token",
  "the-open-network": "toncoin",
  near: "near-protocol",
  "hedera-hashgraph": "hedera",
  dai: "multi-collateral-dai",
  "staked-ether": "steth",
  "crypto-com-chain": "cronos",
  "leo-token": "unus-sed-leo",
  "render-token": "render",
  "injective-protocol": "injective",
  optimism: "optimism-ethereum",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

/** CDN caching: one shared copy per URL, refreshed in the background. */
function cached(maxAge: number, swr: number): Record<string, string> {
  return {
    "Cache-Control": "public, max-age=60",
    "Netlify-CDN-Cache-Control": `public, durable, max-age=${maxAge}, stale-while-revalidate=${swr}`,
  };
}

const MARKET_CACHE = cached(300, 900);
const NO_STORE = { "Cache-Control": "no-store" };

function ok(body: unknown, cache: Record<string, string> = MARKET_CACHE): ApiResult {
  return { status: 200, body, headers: { ...SECURITY_HEADERS, ...cache } };
}

function fail(status: number, error: string, cache: Record<string, string> = NO_STORE): ApiResult {
  return { status, body: { error }, headers: { ...SECURITY_HEADERS, ...cache } };
}

const WARMING_UP = "Market data is warming up. Please try again in a few minutes.";

function toListCoin(coin: CoinRecord, sparklines: Record<string, number[]>) {
  const prices = sparklines[coin.id];
  return { ...coin, sparkline_in_7d: prices?.length ? { price: prices } : null };
}

async function trackedWithSparklines() {
  const [{ coins, updated_at }, sparklines] = await Promise.all([
    readTrackedCoins(),
    readJSON<SparklineSnapshot>(KEYS.sparklines),
  ]);
  return { coins: coins.map((coin) => toListCoin(coin, sparklines?.prices ?? {})), updated_at };
}

function sortCoins<T extends { market_cap: number; total_volume: number }>(coins: T[], order: string): T[] {
  const sorted = [...coins];
  switch (order) {
    case "market_cap_asc": return sorted.sort((a, b) => a.market_cap - b.market_cap);
    case "volume_desc": return sorted.sort((a, b) => b.total_volume - a.total_volume);
    case "volume_asc": return sorted.sort((a, b) => a.total_volume - b.total_volume);
    default: return sorted.sort((a, b) => b.market_cap - a.market_cap);
  }
}

function movers<T extends { market_cap_rank: number; price_change_percentage_24h: number | null }>(coins: T[]) {
  const withChange = coins.filter(
    (c) => c.market_cap_rank <= 100 && typeof c.price_change_percentage_24h === "number",
  );
  return [...withChange].sort(
    (a, b) => (b.price_change_percentage_24h as number) - (a.price_change_percentage_24h as number),
  );
}

async function findCoin(rawId: string): Promise<CoinRecord | null> {
  const { coins } = await readTrackedCoins();
  const id = LEGACY_COIN_IDS[rawId] ?? rawId;
  return coins.find((coin) => coin.id === id) ?? null;
}

async function handleGlobal(): Promise<ApiResult> {
  const snapshot = await readJSON<GlobalSnapshot>(KEYS.global);
  if (!snapshot) return fail(503, WARMING_UP);
  return ok(GetGlobalMarketResponse.parse(snapshot.data));
}

async function handleCoins(params: Record<string, string>): Promise<ApiResult> {
  const parsed = GetCoinsQueryParams.safeParse(params);
  if (!parsed.success) return fail(400, "Invalid request parameters");
  const { page, per_page, order } = parsed.data;
  const { coins } = await trackedWithSparklines();
  if (coins.length === 0) return fail(503, WARMING_UP);
  const start = (page - 1) * per_page;
  return ok(GetCoinsResponse.parse(sortCoins(coins, order).slice(start, start + per_page)));
}

async function handleTopMovers(): Promise<ApiResult> {
  const { coins } = await trackedWithSparklines();
  if (coins.length === 0) return fail(503, WARMING_UP);
  const sorted = movers(coins);
  return ok(GetTopMoversResponse.parse({
    gainers: sorted.slice(0, 10),
    losers: sorted.slice(-10).reverse(),
  }));
}

async function handleSummary(): Promise<ApiResult> {
  const [global, { coins, updated_at }, fearGreed] = await Promise.all([
    readJSON<GlobalSnapshot>(KEYS.global),
    readTrackedCoins(),
    fetchFearGreed().catch(() => ({ value: 50 })),
  ]);
  if (!global || coins.length === 0) return fail(503, WARMING_UP);
  const sorted = movers(coins.filter((c) => c.market_cap_rank <= 50));
  const summary = generateMarketSummary({
    btcDominance: global.data.btc_dominance,
    marketCapChange24h: global.data.market_cap_change_percentage_24h,
    totalVolume: global.data.total_volume_usd,
    fearGreedValue: fearGreed.value,
    topGainerChange: sorted[0]?.price_change_percentage_24h ?? 0,
    topLoserChange: sorted[sorted.length - 1]?.price_change_percentage_24h ?? 0,
  });
  return ok(GetMarketSummaryResponse.parse({
    summary,
    generated_at: updated_at ?? global.updated_at,
  }));
}

async function handleCoinDetail(rawId: string): Promise<ApiResult> {
  const params = GetCoinDetailParams.safeParse({ id: rawId });
  if (!params.success) return fail(400, "Invalid request parameters");
  const [coin, info] = await Promise.all([
    findCoin(params.data.id),
    readJSON<InfoSnapshot>(KEYS.info),
  ]);
  if (!coin) return fail(404, "Not tracked yet", MARKET_CACHE);
  return ok(GetCoinDetailResponse.parse({
    ...coin,
    image: coinLogoUrl(coin.cmc_id, 128),
    description: info?.descriptions[coin.id] ?? "",
    ai_summary: generateCoinSummary({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      priceChange24h: coin.price_change_percentage_24h,
      priceChange7d: coin.price_change_percentage_7d,
      totalVolume: coin.total_volume,
      marketCap: coin.market_cap,
    }),
  }));
}

/**
 * Up to 7 days: hourly saves, with older daily points filling any gap
 * before hourly history begins. Longer ranges: daily history. The latest
 * snapshot price is appended so every chart ends at "now".
 */
async function handleCoinHistory(rawId: string, query: Record<string, string>): Promise<ApiResult> {
  const idParsed = GetCoinHistoryParams.safeParse({ id: rawId });
  const queryParsed = GetCoinHistoryQueryParams.safeParse(query);
  if (!idParsed.success || !queryParsed.success) return fail(400, "Invalid request parameters");
  const coin = await findCoin(idParsed.data.id);
  if (!coin) return fail(404, "Not tracked yet", MARKET_CACHE);

  const days = queryParsed.data.days;
  const now = Date.now();
  const from = now - days * DAY_MS;
  const inWindow = ([ts]: HistoryPoint) => ts >= from;

  const daily = (await readHistory(KEYS.daily(coin.id))).filter(inWindow);
  let points: HistoryPoint[] = daily;
  if (days <= 7) {
    const hourly = (await readHistory(KEYS.hourly(coin.id))).filter(inWindow);
    const firstHourly = hourly[0]?.[0] ?? Infinity;
    points = [...daily.filter(([ts]) => ts < firstHourly), ...hourly];
  }
  const last = points[points.length - 1];
  if (!last || now - last[0] > 3_600_000) points = [...points, [now, coin.current_price]];

  return ok(GetCoinHistoryResponse.parse(points.map(([timestamp, price]) => ({ timestamp, price }))));
}

async function handleFearGreed(): Promise<ApiResult> {
  return ok(GetFearGreedResponse.parse(await fetchFearGreed()), cached(3600, 3600));
}

async function handleFearGreedHistory(params: Record<string, string>): Promise<ApiResult> {
  const parsed = GetFearGreedHistoryQueryParams.safeParse(params);
  if (!parsed.success) return fail(400, "Invalid request parameters");
  const history = await fetchFearGreedHistory(parsed.data.limit);
  return ok(GetFearGreedHistoryResponse.parse(history), cached(3600, 3600));
}

async function handleNews(params: Record<string, string>): Promise<ApiResult> {
  const parsed = GetNewsQueryParams.safeParse(params);
  if (!parsed.success) return fail(400, "Invalid request parameters");
  return ok(GetNewsResponse.parse(await fetchNews(parsed.data.limit)), cached(600, 1800));
}

/** Route a GET request. `url.pathname` must start with /api. */
export async function handleApiRequest(url: URL, log: ApiLogger): Promise<ApiResult> {
  const path = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";
  const query = Object.fromEntries(url.searchParams);
  const coinMatch = path.match(/^\/coins\/([^/]+)(\/history)?$/);

  const routes: Record<string, () => Promise<ApiResult>> = {
    "/healthz": async () => ok(HealthCheckResponse.parse({ status: "ok" }), NO_STORE),
    "/market/global": handleGlobal,
    "/market/coins": () => handleCoins(query),
    // Trending is not available on the current data plan.
    "/market/trending": async () => ok(GetTrendingResponse.parse([])),
    "/market/top-movers": handleTopMovers,
    "/market/summary": handleSummary,
    "/sentiment/fear-greed": handleFearGreed,
    "/sentiment/fear-greed/history": () => handleFearGreedHistory(query),
    "/news": () => handleNews(query),
  };

  let handler = routes[path];
  if (!handler && coinMatch) {
    const id = coinMatch[1];
    handler = coinMatch[2] ? () => handleCoinHistory(id, query) : () => handleCoinDetail(id);
  }
  if (!handler) return fail(404, "Not found");

  try {
    return await handler();
  } catch (err) {
    log.error(err, `API request failed: ${path}`);
    return fail(503, "Data temporarily unavailable. Please try again shortly.");
  }
}
