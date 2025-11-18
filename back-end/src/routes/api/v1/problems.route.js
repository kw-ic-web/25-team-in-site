import { Router } from "express";
import { problemsController } from "../../../controllers/problems.controller.js";

const router = Router();

// GET /api/v1/problems
router.get("/", problemsController.getProblems);
// GET /api/v1/problems/recommendations/personal
router.get(
  "/recommendations/personal",
  problemsController.getPersonalRecommendations,
);
// GET /api/v1/problems/recent/solved
router.get("/recent/solved", problemsController.getRecentSolvedProblems);
// GET /api/v1/problems/:id/similar
router.get("/:id/similar", problemsController.getSimilarProblems);
// GET /api/v1/problems/:id
router.get("/:id", problemsController.getProblemDetail);

export default router;
