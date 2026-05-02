/**
 * Coin routes — individual coin details and price history via CoinGecko.
 */
import { Router, type IRouter } from "express";
import {
  GetCoinDetailParams,
  GetCoinDetailResponse,
  GetCoinHistoryParams,
  GetCoinHistoryQueryParams,
  GetCoinHistoryResponse,
} from "@workspace/api-zod";
import { fetchCoinDetail, fetchCoinHistory } from "../lib/coingecko";

const router: IRouter = Router();

// GET /coins/:id
router.get("/coins/:id", async (req, res): Promise<void> => {
  const params = GetCoinHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const raw = await fetchCoinDetail(params.data.id);
    const md = raw.market_data as Record<string, Record<string, number>> | undefined;

    const currentPrice = (md?.current_price?.usd as unknown as number) ?? 0;
    const marketCap = (md?.market_cap?.usd as unknown as number) ?? 0;
    const totalVolume = (md?.total_volume?.usd as unknown as number) ?? 0;
    const priceChange24h = (md?.price_change_percentage_24h as unknown as number | null) ?? null;
    const priceChange7d = (md?.price_change_percentage_7d as unknown as number | null) ?? null;
    const circulatingSupply = (md?.circulating_supply as unknown as number | null) ?? null;
    const maxSupply = (md?.max_supply as unknown as number | null) ?? null;
    const marketCapRank = (raw.market_cap_rank as number) ?? 0;

    const aiSummary = generateCoinSummary({
      name: raw.name as string,
      symbol: (raw.symbol as string).toUpperCase(),
      priceChange24h,
      priceChange7d,
      totalVolume,
      marketCap,
    });

    const descriptionRaw = raw.description as Record<string, string> | undefined;
    const description = descriptionRaw?.en
      ? descriptionRaw.en.replace(/<[^>]*>/g, "").slice(0, 500)
      : "";

    const coin = {
      id: raw.id as string,
      symbol: raw.symbol as string,
      name: raw.name as string,
      image: (raw.image as Record<string, string>)?.large ?? "",
      current_price: currentPrice,
      market_cap: marketCap,
      market_cap_rank: marketCapRank,
      total_volume: totalVolume,
      price_change_percentage_24h: priceChange24h,
      price_change_percentage_7d: priceChange7d,
      circulating_supply: circulatingSupply,
      max_supply: maxSupply,
      description,
      ai_summary: aiSummary,
    };

    res.json(GetCoinDetailResponse.parse(coin));
  } catch (err) {
    req.log.error(err, "Failed to fetch coin detail");
    res.status(503).json({ error: "Coin data temporarily unavailable. CoinGecko may be rate limiting — please try again shortly." });
  }
});

// GET /coins/:id/history?days=7
router.get("/coins/:id/history", async (req, res): Promise<void> => {
  const idParsed = GetCoinHistoryParams.safeParse(req.params);
  if (!idParsed.success) {
    res.status(400).json({ error: idParsed.error.message });
    return;
  }

  const queryParsed = GetCoinHistoryQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  try {
    const history = await fetchCoinHistory(idParsed.data.id, queryParsed.data.days);
    const points = (history.prices ?? []).map(([timestamp, price]) => ({ timestamp, price }));
    res.json(GetCoinHistoryResponse.parse(points));
  } catch (err) {
    req.log.error(err, "Failed to fetch coin history");
    res.status(503).json({ error: "Price history temporarily unavailable. Please try again shortly." });
  }
});

// Coin-specific plain-English summary
function generateCoinSummary(input: {
  name: string;
  symbol: string;
  priceChange24h: number | null;
  priceChange7d: number | null;
  totalVolume: number;
  marketCap: number;
}): string {
  const { name, symbol, priceChange24h, priceChange7d, totalVolume, marketCap } = input;
  const parts: string[] = [];

  if (priceChange24h !== null) {
    const dir24h = priceChange24h >= 0 ? "up" : "down";
    const abs24h = Math.abs(priceChange24h).toFixed(1);
    if (Math.abs(priceChange24h) > 10) {
      parts.push(`${name} (${symbol}) is ${dir24h} ${abs24h}% in the last 24 hours — a notable move that may reflect significant news or broad market momentum.`);
    } else {
      parts.push(`${name} (${symbol}) is ${dir24h} ${abs24h}% in the last 24 hours, showing ${priceChange24h >= 0 ? "short-term strength" : "short-term weakness"}.`);
    }
  } else {
    parts.push(`${name} (${symbol}) price change data is currently unavailable.`);
  }

  if (priceChange7d !== null) {
    const dir7d = priceChange7d >= 0 ? "gained" : "lost";
    parts.push(`Over the past week, it has ${dir7d} ${Math.abs(priceChange7d).toFixed(1)}%.`);
  }

  const volumeToMcapRatio = marketCap > 0 ? totalVolume / marketCap : 0;
  if (volumeToMcapRatio > 0.3) {
    parts.push("Volume is unusually elevated relative to market cap, suggesting very active participation.");
  } else if (volumeToMcapRatio > 0.1) {
    parts.push("Volume remains elevated, suggesting active participation.");
  } else {
    parts.push("Trading volume is moderate relative to its market cap.");
  }

  parts.push("This is an informational summary only, not financial advice.");
  return parts.join(" ");
}

export default router;
