/**
 * Sentiment routes — Fear & Greed index from Alternative.me.
 */
import { Router, type IRouter } from "express";
import {
  GetFearGreedResponse,
  GetFearGreedHistoryResponse,
  GetFearGreedHistoryQueryParams,
} from "@workspace/api-zod";
import { fetchFearGreed, fetchFearGreedHistory } from "../lib/feargreed";

const router: IRouter = Router();

// GET /sentiment/fear-greed
router.get("/sentiment/fear-greed", async (_req, res): Promise<void> => {
  const data = await fetchFearGreed();
  res.json(GetFearGreedResponse.parse(data));
});

// GET /sentiment/fear-greed/history?limit=30
router.get("/sentiment/fear-greed/history", async (req, res): Promise<void> => {
  const parsed = GetFearGreedHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const history = await fetchFearGreedHistory(parsed.data.limit);
  res.json(GetFearGreedHistoryResponse.parse(history));
});

export default router;
