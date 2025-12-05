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

    // 먼저 원본 데이터를 가져와서 problem_id를 저장
    const solvedDocs = await Solved.find({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // 원본 problem_id 값들을 저장
    const originalProblemIds = solvedDocs.map((doc) => doc.problem_id);
    // populate 실행
    const result = await Solved.find({ user_id: userObjectId })
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
        strictPopulate: false,
      })
      .lean();
    // populate 실패한 항목들 확인 및 로깅
    const itemsWithMissingProblem = result
      .map((item, index) => ({
        item,
        originalProblemId: originalProblemIds[index],
      }))
      .filter(({ item }) => !item.problem_id);

    if (itemsWithMissingProblem.length > 0) {
      const missingProblemIds = itemsWithMissingProblem.map(
        ({ originalProblemId }) => originalProblemId?.toString() || "unknown",
      );
      console.warn(
        `[findRecentSolvedProblems] ${itemsWithMissingProblem.length}개의 Solved 항목에서 Problem을 찾을 수 없습니다.`,
        `문제 ID들: ${missingProblemIds.join(", ")}`,
        `\n데이터 정리를 위해 다음 명령을 실행하세요:`,
        `node scripts/cleanup_orphaned_solved.js`,
      );
    }

    // problem_id가 null인 항목은 제외하고 반환
    return result.filter((item) => item.problem_id !== null);
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

  async createSolved(payload) {
    const solved = new Solved(payload);
    return this.save(solved);
  },
};
