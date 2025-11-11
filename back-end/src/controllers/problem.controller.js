import { getProblemById } from "../service/problem.service.js";

export const getProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problem = await getProblemById(Number(id));

    if (!problem) {
      return res.status(404).json({ message: "문제를 찾을 수 없습니다." });
    }

    res.status(200).json(problem);
  } catch (error) {
    next(error);
  }
};
