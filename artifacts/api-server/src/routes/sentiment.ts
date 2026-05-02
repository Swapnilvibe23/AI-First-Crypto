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
router.get("/sentiment/fear-greed", async (req, res): Promise<void> => {
  try {
    const data = await fetchFearGreed();
    res.json(GetFearGreedResponse.parse(data));
  } catch (err) {
    req.log.error(err, "Failed to fetch fear & greed index");
    res.status(503).json({ error: "Fear & Greed data temporarily unavailable." });
  }
});

// GET /sentiment/fear-greed/history?limit=30
router.get("/sentiment/fear-greed/history", async (req, res): Promise<void> => {
  const parsed = GetFearGreedHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const history = await fetchFearGreedHistory(parsed.data.limit);
    res.json(GetFearGreedHistoryResponse.parse(history));
  } catch (err) {
    req.log.error(err, "Failed to fetch fear & greed history");
    res.status(503).json({ error: "Fear & Greed history temporarily unavailable." });
  }
});

export default router;
