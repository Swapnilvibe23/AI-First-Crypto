/**
 * CoinMarketCap Pro API client (free Basic plan, commercial use).
 *
 * Only the scheduled ingest function calls this module. Visitor-facing API
 * routes read the stored snapshot instead, so site traffic never spends
 * CoinMarketCap credits.
 *
 * CybeDefend owasp-2025-a01 / owasp-2025-a06: requests go through the
 * allowlisted fetch helper, and every upstream field is type-checked before
 * it is stored.
 */

import { htmlToPlainText } from "./sanitize";
import { fetchAllowlisted } from "./upstream";

const CMC_HOSTS = ["pro-api.coinmarketcap.com"] as const;
const CMC_BASE = "https://pro-api.coinmarketcap.com";

export interface CoinRecord {
  cmc_id: number;
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
}

export interface GlobalRecord {
  total_market_cap_usd: number;
  total_volume_usd: number;
  btc_dominance: number;
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h: number;
}

export interface CreditInfo {
  day_left: number | null;
  month_left: number | null;
}

/** A CoinMarketCap response body plus the credits it cost. */
interface CmcResult<T> {
  data: T;
  credits: number;
}

function apiKey(): string {
  const key = process.env.CMC_API_KEY;
  if (!key) throw new Error("CMC_API_KEY is not configured");
  return key;
}

async function cmcGet<T>(path: string, params: Record<string, string>): Promise<CmcResult<T>> {
  const url = new URL(path, CMC_BASE);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const text = await fetchAllowlisted(url.toString(), CMC_HOSTS, {
    headers: { Accept: "application/json", "X-CMC_PRO_API_KEY": apiKey() },
    timeoutMs: 10_000,
    maxBytes: 5_000_000,
    redirect: "allowlist",
  });
  const body = JSON.parse(text) as { data?: T; status?: { credit_count?: unknown } };
  if (body.data === undefined) throw new Error(`CoinMarketCap ${path} response had no data`);
  const credits = typeof body.status?.credit_count === "number" ? body.status.credit_count : 0;
  return { data: body.data, credits };
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function coinLogoUrl(cmcId: number, size: 64 | 128 = 64): string {
  return `https://s2.coinmarketcap.com/static/img/coins/${size}x${size}/${cmcId}.png`;
}

/** Ranked listings with USD quotes. One credit per 100 coins. */
export async function fetchListings(start: number, limit: number): Promise<CmcResult<CoinRecord[]>> {
  const result = await cmcGet<unknown[]>("/v1/cryptocurrency/listings/latest", {
    start: String(start),
    limit: String(limit),
    convert: "USD",
    sort: "market_cap",
  });
  if (!Array.isArray(result.data)) throw new Error("CoinMarketCap listings response was not a list");
  const coins = result.data.flatMap((row): CoinRecord[] => {
    if (!row || typeof row !== "object") return [];
    const r = row as Record<string, unknown>;
    const usd = ((r.quote as Record<string, unknown> | undefined)?.USD ?? {}) as Record<string, unknown>;
    const cmcId = num(r.id);
    const slug = str(r.slug).toLowerCase();
    if (!cmcId || !slug) return [];
    return [{
      cmc_id: cmcId,
      id: slug,
      symbol: str(r.symbol).toLowerCase(),
      name: str(r.name),
      image: coinLogoUrl(cmcId),
      current_price: num(usd.price),
      market_cap: num(usd.market_cap),
      market_cap_rank: num(r.cmc_rank),
      total_volume: num(usd.volume_24h),
      price_change_percentage_24h: numOrNull(usd.percent_change_24h),
      price_change_percentage_7d: numOrNull(usd.percent_change_7d),
      circulating_supply: numOrNull(r.circulating_supply),
      max_supply: numOrNull(r.max_supply),
    }];
  });
  return { data: coins, credits: result.credits };
}

/** Total market cap, volume and BTC dominance. One credit. */
export async function fetchGlobalMetrics(): Promise<CmcResult<GlobalRecord>> {
  const result = await cmcGet<Record<string, unknown>>("/v1/global-metrics/quotes/latest", {
    convert: "USD",
  });
  const d = result.data;
  const usd = ((d.quote as Record<string, unknown> | undefined)?.USD ?? {}) as Record<string, unknown>;
  return {
    credits: result.credits,
    data: {
      total_market_cap_usd: num(usd.total_market_cap),
      total_volume_usd: num(usd.total_volume_24h),
      btc_dominance: num(d.btc_dominance),
      active_cryptocurrencies: num(d.active_cryptocurrencies),
      market_cap_change_percentage_24h: num(usd.total_market_cap_yesterday_percentage_change),
    },
  };
}

/** Plain-text descriptions keyed by slug. One credit per 100 coins. */
export async function fetchCoinInfo(cmcIds: number[]): Promise<CmcResult<Record<string, string>>> {
  const result = await cmcGet<Record<string, unknown>>("/v2/cryptocurrency/info", {
    id: cmcIds.join(","),
    aux: "description",
  });
  const descriptions: Record<string, string> = {};
  for (const value of Object.values(result.data ?? {})) {
    const entry = (Array.isArray(value) ? value[0] : value) as Record<string, unknown> | undefined;
    const slug = str(entry?.slug).toLowerCase();
    const description = str(entry?.description);
    if (slug && description) descriptions[slug] = htmlToPlainText(description);
  }
  return { data: descriptions, credits: result.credits };
}

/**
 * Daily USD closes for one coin. One credit per 100 points.
 * The free Basic plan includes one year of daily history.
 */
export async function fetchDailyHistory(cmcId: number, days: number): Promise<CmcResult<[number, number][]>> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const result = await cmcGet<Record<string, unknown>>("/v2/cryptocurrency/quotes/historical", {
    id: String(cmcId),
    interval: "daily",
    time_start: start.toISOString(),
    time_end: end.toISOString(),
    convert: "USD",
  });
  const raw = result.data?.[String(cmcId)] ?? Object.values(result.data ?? {})[0];
  const entry = (Array.isArray(raw) ? raw[0] : raw) as { quotes?: unknown } | undefined;
  const quotes = Array.isArray(entry?.quotes) ? entry.quotes : [];
  const points = quotes.flatMap((q): [number, number][] => {
    const quote = q as { timestamp?: unknown; quote?: { USD?: { price?: unknown } } };
    const ts = Date.parse(str(quote.timestamp));
    const price = quote.quote?.USD?.price;
    return Number.isFinite(ts) && typeof price === "number" && Number.isFinite(price) ? [[ts, price]] : [];
  });
  return { data: points, credits: result.credits };
}

/** Remaining credits. Usage-stats calls do not cost credits. */
export async function fetchCreditInfo(): Promise<CreditInfo> {
  const result = await cmcGet<Record<string, unknown>>("/v1/key/info", {});
  const usage = (result.data.usage ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const plan = (result.data.plan ?? {}) as Record<string, unknown>;
  const dayLeft = numOrNull(usage.current_day?.credits_left);
  const monthLeft = numOrNull(usage.current_month?.credits_left);
  const dailyLimit = numOrNull(plan.credit_limit_daily);
  const dayUsed = numOrNull(usage.current_day?.credits_used);
  return {
    day_left: dayLeft ?? (dailyLimit !== null && dayUsed !== null ? dailyLimit - dayUsed : null),
    month_left: monthLeft,
  };
}
