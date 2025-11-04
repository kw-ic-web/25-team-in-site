import express from "express";
import Problem from "../entity/problem.js";

const router = express.Router();

// 문제 상세 조회 API
router.get("/:problemId", async (req, res) => {
  try {
    const { problemId } = req.params;
    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ message: "문제를 찾을 수 없습니다." });
    }

    res.status(200).json(problem);
  } catch (error) {
    console.error("문제 조회 실패:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

export default router;
