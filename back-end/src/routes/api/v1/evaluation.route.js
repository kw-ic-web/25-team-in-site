import { Router } from "express";
import { evaluationController } from "../../../controllers/evaluation.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, evaluationController.evaluate);

export default router;
