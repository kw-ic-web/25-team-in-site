import { Solved } from "../entity/solved.entity.js";

export const SolvedRepository = {
  async findProblemObjectIdsByUser(userObjectId) {
    if (!userObjectId) {
      return [];
    }

    return Solved.find({ user_id: userObjectId }).distinct("problem_id");
  },

  async hasUserSolvedProblem(userObjectId, problemObjectId) {
    if (!userObjectId || !problemObjectId) {
      return false;
    }

    const exists = await Solved.exists({
      user_id: userObjectId,
      problem_id: problemObjectId,
    });
    return Boolean(exists);
  },

  async findRecentSolvedProblems(userObjectId, { limit = 5 } = {}) {
    if (!userObjectId) {
      return [];
    }

    return Solved.find({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "problem_id",
        select: {
          problem_id: 1,
          problem_difficulty: 1,
          problem_lang: 1,
          problem_main_category: 1,
          problem_sub_category: 1,
          problem_success_rate: 1,
          createdAt: 1,
        },
      })
      .lean();
  },
};
