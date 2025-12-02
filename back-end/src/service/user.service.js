import { UserRepository } from "../repository/user.repository.js";
import { SolvedRepository } from "../repository/solved.repository.js";
import { UserStatsResponseDto } from "../dto/user/userStats.response.dto.js";
import { ERROR } from "../mapper/error.mapper.js";

export const UserService = {
  async getUserStats(userId) {
    const user = await UserRepository.findOne({ user_id: userId });
    if (!user) {
      throw ERROR.USER_NOT_FOUND();
    }

    const userObjectId = user._id;

    // 1. Basic Stats
    const totalSolved = await SolvedRepository.countByUserId(userObjectId);

    // 2. Date Range Stats (Today, This Week)
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay()); // Sunday as start

    const todaySolved = await SolvedRepository.countByUserIdAndDateRange(
      userObjectId,
      startOfToday,
      now,
    );
    const thisWeekSolved = await SolvedRepository.countByUserIdAndDateRange(
      userObjectId,
      startOfWeek,
      now,
    );

    // 3. Group Stats
    const levelStats = await SolvedRepository.groupByLevel(userObjectId);
    const languageStats = await SolvedRepository.groupByLanguage(userObjectId);

    // Format Level Distribution
    const levelDistribution = {};
    levelStats.forEach((stat) => {
      levelDistribution[stat._id] = stat.count;
    });

    // Format Language Distribution & Find Most Used
    const languageDistribution = {};
    let mostUsedLanguage = "-";
    let maxCount = 0;

    languageStats.forEach((stat) => {
      languageDistribution[stat._id] = stat.count;
      if (stat.count > maxCount) {
        maxCount = stat.count;
        mostUsedLanguage = stat._id;
      }
    });

    // 4. Heatmap (Last 365/366 days)
    const oneYearAgo = new Date(now);
    oneYearAgo.setUTCFullYear(now.getUTCFullYear() - 1);
    const dailyActivity = await SolvedRepository.getDailyActivity(
      userObjectId,
      oneYearAgo,
    );

    const heatmap = dailyActivity.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    return UserStatsResponseDto.from({
      user,
      totalSolved,
      todaySolved,
      thisWeekSolved,
      mostUsedLanguage,
      levelDistribution,
      languageDistribution,
      heatmap,
    });
  },
};
