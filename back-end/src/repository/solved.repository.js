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
          problem_title: 1,
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

  async countByUserId(userObjectId) {
    return Solved.countDocuments({ user_id: userObjectId });
  },

  async countByUserIdAndDateRange(userObjectId, startDate, endDate) {
    return Solved.countDocuments({
      user_id: userObjectId,
      createdAt: { $gte: startDate, $lt: endDate },
    });
  },

  async groupByLevel(userObjectId) {
    return Solved.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $lookup: {
          from: "problems",
          localField: "problem_id",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: "$problem" },
      {
        $group: {
          _id: "$problem.problem_difficulty",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async groupByLanguage(userObjectId) {
    return Solved.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $group: {
          _id: "$language",
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async getDailyActivity(userObjectId, startDate) {
    return Solved.aggregate([
      {
        $match: {
          user_id: userObjectId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
  },

  async findByUserIdAndProblemId(userObjectId, problemObjectId) {
    return Solved.findOne({
      user_id: userObjectId,
      problem_id: problemObjectId,
    });
  },

  async save(solved) {
    return solved.save();
  },
};
