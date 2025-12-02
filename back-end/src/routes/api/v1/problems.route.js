import { Router } from "express";
import { problemsController } from "../../../controllers/problems.controller.js";

const router = Router();

router.get("/", problemsController.getProblems);
router.get(
  "/recommendations/personal",
  problemsController.getPersonalRecommendations,
);
router.get("/recent/solved", problemsController.getRecentSolvedProblems);
router.get("/:id/similar", problemsController.getSimilarProblems);
router.get("/:id", problemsController.getProblemDetail);

export default router;
