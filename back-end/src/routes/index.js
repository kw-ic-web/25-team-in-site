import { Router } from "express";
import apiRouter from "./api/apiRoutes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));
router.use("/api", apiRouter);

export default router;
