import { Router } from "express";
import { CodeController } from "../../../controllers/code.controller.js";

const router = Router();

router.post("/", CodeController.saveCode);
router.post("/tokenize", CodeController.tokenize);

export default router;
