import { Problem } from "../entity/problem.entity.js";

export const ProblemRepository = {
  async findProblemById(id) {
    return await Problem.findOne({ problemId: id });
  },
};
