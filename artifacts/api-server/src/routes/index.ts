import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketRouter from "./market";
import coinsRouter from "./coins";
import sentimentRouter from "./sentiment";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketRouter);
router.use(coinsRouter);
router.use(sentimentRouter);
router.use(newsRouter);

export default router;
