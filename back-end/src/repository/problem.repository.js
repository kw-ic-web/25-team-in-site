import { Problem } from "../entity/problem.entity.js";
import { ProblemDetail } from "../entity/problemDetail.entity.js";

export const ProblemRepository = {
  async findProblemById(id) {
    const probInfo = await Problem.findOne({ problemId: id }).lean();
    const probDetail = await ProblemDetail.findOne({ problemId: id }).lean();

    if (!probInfo || !probDetail) {
      return null;
    }

    return {
      ...probInfo,
      ...probDetail,
    };
  },
};
