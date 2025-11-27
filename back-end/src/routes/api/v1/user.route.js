import { Router } from "express";
import { UserController } from "../../../controllers/user.controller.js";

import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.get("/check-id/:user_id", UserController.checkUserId);
router.get("/stats", authMiddleware, UserController.getStats);

export default router;
