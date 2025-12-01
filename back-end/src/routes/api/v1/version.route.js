import { Router } from "express";
import authRouter from "./auth.route.js";
import problemsRouter from "./problems.route.js";
import userRouter from "./user.route.js";
import codeRouter from "./code.route.js";
import evaluationRouter from "./evaluation.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/problems", problemsRouter);
router.use("/user", userRouter);
router.use("/code", codeRouter);
router.use("/evaluation", evaluationRouter);

export default router;
