import { Router } from "express";
import { problemsController } from "../../../controllers/problems.controller.js";

const router = Router();

// GET /api/v1/problems
router.get("/", problemsController.getProblems);
// GET /api/v1/problems/:id
router.get("/:id", problemsController.getProblemDetail);

export default router;
