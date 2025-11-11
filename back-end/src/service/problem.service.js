import { findProblemById } from "../repository/problem.repository.js";

export const getProblemById = async (id) => {
  const problem = await findProblemById(id);
  return problem;
};
