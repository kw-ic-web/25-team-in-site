import { Router } from "express";
import { UserController } from "../../../controllers/user.controller.js";

const router = Router();

router.get("/check-id/:user_id", UserController.checkUserId);

export default router;
