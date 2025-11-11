import { Router } from "express";
import { getProblem } from "../../../controllers/problem.controller.js";

const router = Router();

// GET /api/v1/problem/:id
router.get("/:id", getProblem);

export default router;
