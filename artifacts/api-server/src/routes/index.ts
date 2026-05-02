import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketRouter from "./market";
import coinsRouter from "./coins";
import sentimentRouter from "./sentiment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketRouter);
router.use(coinsRouter);
router.use(sentimentRouter);

export default router;
