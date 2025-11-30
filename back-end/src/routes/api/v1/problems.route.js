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
// POST /api/v1/problems/:id/code
// TODO: WebSocket 'user:code:save' 이벤트로 대체 예정 
router.post("/:id/code", problemsController.saveUserCode);
// POST /api/v1/problems/:id/hint
// TODO: WebSocket 'user:hint:request' 이벤트로 대체 예정 
router.post("/:id/hint", problemsController.getHint);

export default router;
