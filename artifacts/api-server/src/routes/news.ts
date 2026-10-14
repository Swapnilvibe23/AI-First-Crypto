/**
 * News routes — aggregates RSS headlines from crypto news sources.
 */
import { Router, type IRouter } from "express";
import { GetNewsQueryParams, GetNewsResponse } from "@workspace/api-zod";
import { fetchNews } from "../lib/news";

const router: IRouter = Router();

// GET /news?limit=10
router.get("/news", async (req, res): Promise<void> => {
  try {
    const parsed = GetNewsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }
    const items = await fetchNews(parsed.data.limit);
    res.json(GetNewsResponse.parse(items));
  } catch (err) {
    req.log.error(err, "Failed to fetch news");
    res.status(503).json({ error: "News temporarily unavailable." });
  }
});

export default router;
