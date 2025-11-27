import { UserRepository } from "../repository/user.repository.js";
import { SolvedRepository } from "../repository/solved.repository.js";

export const UserService = {
    async getUserStats(userId) {
        const user = await UserRepository.findOne({ user_id: userId });
        if (!user) {
            throw new Error("User not found");
        }

        const userObjectId = user._id;

        // 1. Basic Stats
        const totalSolved = await SolvedRepository.countByUserId(userObjectId);

        // 2. Date Range Stats (Today, This Week)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
        startOfWeek.setHours(0, 0, 0, 0);

        const todaySolved = await SolvedRepository.countByUserIdAndDateRange(
            userObjectId,
            startOfToday,
            now
        );
        const thisWeekSolved = await SolvedRepository.countByUserIdAndDateRange(
            userObjectId,
            startOfWeek,
            now
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

        // 4. Heatmap (Last 365 days)
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const dailyActivity = await SolvedRepository.getDailyActivity(
            userObjectId,
            oneYearAgo
        );

        const heatmap = dailyActivity.map((item) => ({
            date: item._id,
            count: item.count,
        }));

        // 5. Avatar Logic
        const getAvatarImage = (level) => {
            // Ensure level is within 1-4 range
            const safeLevel = Math.max(1, Math.min(level, 4));
            return `/images/level/${safeLevel}.png`;
        };

        // 6. Bio Logic (Purpose Mapping)
        const getBioMessage = (purpose) => {
            switch (purpose) {
                case "prob": return "문제 풀이에 집중하고 있어요 🧩";
                case "proj": return "프로젝트를 준비하고 있어요 🛠️";
                case "learn": return "열심히 배우는 중이에요 📚";
                default: return "안녕하세요! 👋";
            }
        };

        return {
            profile: {
                nickname: user.user_id,
                avatarImage: getAvatarImage(user.user_level),
                bio: getBioMessage(user.purpose),
                level: user.user_level,
                exp: user.user_xp,
                preferLanguage: user.prefer_language,
                totalSolved,
                rank: "Unranked", // Placeholder
            },
            stats: {
                streak: 0, // Placeholder
                todaySolved,
                thisWeekSolved,
                mostUsedLanguage,
            },
            badges: [], // Placeholder
            levelDistribution,
            languageDistribution,
            heatmap,
        };
    },
};
