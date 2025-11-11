import { Problem } from "../entity/problem.entity.js";

export const findProblemById = async (id) => {
  return await Problem.findOne({ problemId: id });
};
