import { Router } from "express";
import { SessionController } from "../../../controllers/session.controller.js";

const router = Router();

router.post("/", SessionController.createSession);
router.get("/:userId", SessionController.getSession);
router.patch("/:userId", SessionController.updateSession);
router.delete("/:userId", SessionController.deleteSession);

export default router;
