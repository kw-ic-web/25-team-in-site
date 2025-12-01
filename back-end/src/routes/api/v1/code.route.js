import { Router } from "express";
import { CodeController } from "../../../controllers/code.controller.js";

const router = Router();

router.post("/", CodeController.saveCode);

export default router;
