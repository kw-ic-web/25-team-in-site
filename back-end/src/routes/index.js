import { Router } from "express";
import apiRouter from "./api/apiRoutes.js";

const router = Router();

router.use("/api", apiRouter);

export default router;
