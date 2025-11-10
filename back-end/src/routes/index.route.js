import { Router } from "express";
import apiRouter from "./api/api.route.js";

const router = Router();

router.use("/api", apiRouter);

export default router;
