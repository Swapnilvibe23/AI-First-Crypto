import {
  fetchCoinDetail,
  fetchCoinHistory,
  fetchCoins,
  fetchGlobalMarket,
  fetchTrending,
} from "../../artifacts/api-server/src/lib/coingecko.js";
import { fetchFearGreed, fetchFearGreedHistory } from "../../artifacts/api-server/src/lib/feargreed.js";
import { fetchNews } from "../../artifacts/api-server/src/lib/news.js";
import { generateMarketSummary } from "../../artifacts/api-server/src/lib/summary.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=30",
};

const ERROR_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const parsePositiveInteger = (
  value: string | null,
  fallback: number,
  options: { min?: number; max?: number } = {},
) => {
  if (value === null || value.trim() === "") return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;

  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(parsed, min), max);
};

const json = (data: unknown, init?: ResponseInit) =>
  Response.json(data, {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  });

const error = (message: string, status = 503) =>
  Response.json(
    { error: message },
    {
      status,
      headers: ERROR_HEADERS,
    },
  );

const normalizeApiPath = (url: URL) => {
  const pathParam = url.searchParams.get("path");
  if (pathParam) return `/${pathParam.replace(/^\/+/, "").replace(/\/+$/, "")}`;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/api")) return path.slice(4) || "/";
  if (path.startsWith("/.netlify/functions/api")) {
    return path.slice("/.netlify/functions/api".length) || "/";
  }
  return path;
};

const buildCoinDetail = (raw: Record<string, unknown>) => {
  const md = raw.market_data as Record<string, unknown> | undefined;
  const image = raw.image as Record<string, string> | undefined;
  const descriptionRaw = raw.description as Record<string, string> | undefined;

  const currentPrice = (md?.current_price as Record<string, number> | undefined)?.usd ?? 0;
  const marketCap = (md?.market_cap as Record<string, number> | undefined)?.usd ?? 0;
  const totalVolume = (md?.total_volume as Record<string, number> | undefined)?.usd ?? 0;
  const priceChange24h = (md?.price_change_percentage_24h as number | null | undefined) ?? null;
  const priceChange7d = (md?.price_change_percentage_7d as number | null | undefined) ?? null;

  return {
    id: raw.id as string,
    symbol: raw.symbol as string,
    name: raw.name as string,
    image: image?.large ?? image?.small ?? "",
    current_price: currentPrice,
    market_cap: marketCap,
    market_cap_rank: (raw.market_cap_rank as number | null | undefined) ?? 0,
    total_volume: totalVolume,
    price_change_percentage_24h: priceChange24h,
    price_change_percentage_7d: priceChange7d,
    circulating_supply: (md?.circulating_supply as number | null | undefined) ?? null,
    max_supply: (md?.max_supply as number | null | undefined) ?? null,
    description: descriptionRaw?.en ? descriptionRaw.en.replace(/<[^>]*>/g, "").slice(0, 500) : "",
    ai_summary: generateCoinSummary({
      name: raw.name as string,
      symbol: String(raw.symbol ?? "").toUpperCase(),
      priceChange24h,
      priceChange7d,
      totalVolume,
      marketCap,
    }),
  };
};

const generateCoinSummary = (input: {
  name: string;
  symbol: string;
  priceChange24h: number | null;
  priceChange7d: number | null;
  totalVolume: number;
  marketCap: number;
}) => {
  const { name, symbol, priceChange24h, priceChange7d, totalVolume, marketCap } = input;
  const parts: string[] = [];

  if (priceChange24h !== null) {
    const direction = priceChange24h >= 0 ? "up" : "down";
    parts.push(
      `${name} (${symbol}) is ${direction} ${Math.abs(priceChange24h).toFixed(1)}% in the last 24 hours.`,
    );
  } else {
    parts.push(`${name} (${symbol}) price change data is currently unavailable.`);
  }

  if (priceChange7d !== null) {
    parts.push(`Over the past week, it has ${priceChange7d >= 0 ? "gained" : "lost"} ${Math.abs(priceChange7d).toFixed(1)}%.`);
  }

  const volumeToMarketCap = marketCap > 0 ? totalVolume / marketCap : 0;
  if (volumeToMarketCap > 0.3) {
    parts.push("Volume is unusually elevated relative to market cap, suggesting very active participation.");
  } else if (volumeToMarketCap > 0.1) {
    parts.push("Volume remains elevated, suggesting active participation.");
  } else {
    parts.push("Trading volume is moderate relative to its market cap.");
  }

  parts.push("This is an informational summary only, not financial advice.");
  return parts.join(" ");
};

const topMovers = async () => {
  const coins = (await fetchCoins(1, 100, "market_cap_desc")) as Record<string, unknown>[];
  const withChange = coins.filter((coin) => typeof coin.price_change_percentage_24h === "number");
  const sorted = [...withChange].sort(
    (a, b) => (b.price_change_percentage_24h as number) - (a.price_change_percentage_24h as number),
  );

  return {
    gainers: sorted.slice(0, 10),
    losers: sorted.slice(-10).reverse(),
  };
};

const marketSummary = async () => {
  const [global, coins, fearGreed] = await Promise.all([
    fetchGlobalMarket(),
    fetchCoins(1, 100, "market_cap_desc") as Promise<Record<string, unknown>[]>,
    fetchFearGreed().catch(() => ({ value: 50 })),
  ]);

  const coinsWithChange = coins.filter((coin) => typeof coin.price_change_percentage_24h === "number");
  const sorted = [...coinsWithChange].sort(
    (a, b) => (b.price_change_percentage_24h as number) - (a.price_change_percentage_24h as number),
  );

  return {
    summary: generateMarketSummary({
      btcDominance: global.btc_dominance,
      marketCapChange24h: global.market_cap_change_percentage_24h,
      totalVolume: global.total_volume_usd,
      fearGreedValue: (fearGreed as { value: number }).value,
      topGainerChange: (sorted[0]?.price_change_percentage_24h as number | undefined) ?? 0,
      topLoserChange: (sorted[sorted.length - 1]?.price_change_percentage_24h as number | undefined) ?? 0,
    }),
    generated_at: new Date().toISOString(),
  };
};

export default async (request: Request) => {
  if (request.method !== "GET") {
    return error("Method not allowed", 405);
  }

  const url = new URL(request.url);
  const path = normalizeApiPath(url);

  try {
    if (path === "/healthz") return json({ status: "ok" });
    if (path === "/market/global") return json(await fetchGlobalMarket());
    if (path === "/market/trending") return json(await fetchTrending());
    if (path === "/market/top-movers") return json(await topMovers());
    if (path === "/market/summary") return json(await marketSummary());

    if (path === "/market/coins") {
      const page = parsePositiveInteger(url.searchParams.get("page"), 1, { max: 250 });
      const perPage = parsePositiveInteger(url.searchParams.get("per_page"), 100, { max: 250 });
      const order = url.searchParams.get("order") || "market_cap_desc";
      return json(await fetchCoins(page, perPage, order));
    }

    if (path === "/sentiment/fear-greed") return json(await fetchFearGreed());

    if (path === "/sentiment/fear-greed/history") {
      const limit = parsePositiveInteger(url.searchParams.get("limit"), 30, { max: 365 });
      return json(await fetchFearGreedHistory(limit));
    }

    if (path === "/news") {
      const limit = parsePositiveInteger(url.searchParams.get("limit"), 10, { max: 50 });
      return json(await fetchNews(limit));
    }

    const historyMatch = /^\/coins\/([^/]+)\/history$/.exec(path);
    if (historyMatch) {
      const days = parsePositiveInteger(url.searchParams.get("days"), 7, { max: 365 });
      const history = await fetchCoinHistory(decodeURIComponent(historyMatch[1]), days);
      return json((history.prices ?? []).map(([timestamp, price]) => ({ timestamp, price })));
    }

    const coinMatch = /^\/coins\/([^/]+)$/.exec(path);
    if (coinMatch) {
      const raw = await fetchCoinDetail(decodeURIComponent(coinMatch[1]));
      return json(buildCoinDetail(raw));
    }

    return error("Not found", 404);
  } catch (cause) {
    console.error("Live market API request failed", {
      path,
      message: cause instanceof Error ? cause.message : "Unknown error",
    });
    return error("Live market data temporarily unavailable. Please try again shortly.");
  }
};

export const config = {
  path: "/api/*",
};
