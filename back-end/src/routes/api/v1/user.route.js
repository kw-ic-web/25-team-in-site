import { Router } from "express";
import { UserController } from "../../../controllers/user.controller.js";

const router = Router();

router.get("/check-id/:user_id", UserController.checkUserId);
router.get("/stats", UserController.getStats);

export default router;
