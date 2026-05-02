/**
 * Market routes — proxies CoinGecko data and computes top movers / market summary.
 */
import { Router, type IRouter } from "express";
import {
  GetGlobalMarketResponse,
  GetCoinsResponse,
  GetTrendingResponse,
  GetTopMoversResponse,
  GetCoinsQueryParams,
  GetMarketSummaryResponse,
} from "@workspace/api-zod";
import { fetchGlobalMarket, fetchCoins, fetchTrending } from "../lib/coingecko";
import { fetchFearGreed } from "../lib/feargreed";
import { generateMarketSummary } from "../lib/summary";

const router: IRouter = Router();

// GET /market/global
router.get("/market/global", async (req, res): Promise<void> => {
  const data = await fetchGlobalMarket();
  res.json(GetGlobalMarketResponse.parse(data));
});

// GET /market/coins?page=1&per_page=100&order=market_cap_desc
router.get("/market/coins", async (req, res): Promise<void> => {
  const parsed = GetCoinsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page, per_page, order } = parsed.data;
  const coins = await fetchCoins(page, per_page, order);
  res.json(GetCoinsResponse.parse(coins));
});

// GET /market/trending
router.get("/market/trending", async (_req, res): Promise<void> => {
  const coins = await fetchTrending();
  res.json(GetTrendingResponse.parse(coins));
});

// GET /market/top-movers — derives from the top-100 market data
router.get("/market/top-movers", async (_req, res): Promise<void> => {
  const coins = await fetchCoins(1, 100, "market_cap_desc") as Record<string, unknown>[];
  const withChange = coins.filter(
    (c) => typeof c.price_change_percentage_24h === "number"
  );
  const sorted = [...withChange].sort(
    (a, b) => (b.price_change_percentage_24h as number) - (a.price_change_percentage_24h as number)
  );
  const gainers = sorted.slice(0, 10);
  const losers = sorted.slice(-10).reverse();
  res.json(GetTopMoversResponse.parse({ gainers, losers }));
});

// GET /market/summary — plain-English computed summary
router.get("/market/summary", async (_req, res): Promise<void> => {
  const [global, coins, fearGreed] = await Promise.all([
    fetchGlobalMarket(),
    fetchCoins(1, 50, "market_cap_desc") as Promise<Record<string, unknown>[]>,
    fetchFearGreed().catch(() => ({ value: 50 })),
  ]);

  const coinsWithChange = (coins as Record<string, unknown>[]).filter(
    (c) => typeof c.price_change_percentage_24h === "number"
  );
  const sorted = [...coinsWithChange].sort(
    (a, b) => (b.price_change_percentage_24h as number) - (a.price_change_percentage_24h as number)
  );
  const topGainerChange = sorted[0]?.price_change_percentage_24h as number ?? 0;
  const topLoserChange = sorted[sorted.length - 1]?.price_change_percentage_24h as number ?? 0;

  const summary = generateMarketSummary({
    btcDominance: global.btc_dominance,
    marketCapChange24h: global.market_cap_change_percentage_24h,
    totalVolume: global.total_volume_usd,
    fearGreedValue: (fearGreed as { value: number }).value,
    topGainerChange,
    topLoserChange,
  });

  res.json(GetMarketSummaryResponse.parse({ summary, generated_at: new Date().toISOString() }));
});

export default router;
