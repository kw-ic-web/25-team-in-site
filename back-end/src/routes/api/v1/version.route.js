import { Router } from "express";
import authRouter from "./auth.route.js";
import problemRouter from "./problem.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/problem", problemRouter);

export default router;
