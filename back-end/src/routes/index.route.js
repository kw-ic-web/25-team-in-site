import { Router } from "express";
import apiRouter from "./api/api.route.js";
import swaggerConfig from "../config/swagger.config.js";

const router = Router();

router.use("/api", apiRouter);
router.use("/api-docs", swaggerConfig.swaggerServe, swaggerConfig.swaggerSetup);
router.get("/api-docs.json", (req, res) => res.json(swaggerConfig.swaggerDocument));


export default router;
