export class UserStatsResponseDto {
    constructor(data) {
        this.profile = {
            nickname: data.user.user_id,
            avatarImage: this.getAvatarImage(data.user.user_level),
            bio: this.getBioMessage(data.user.purpose),
            level: data.user.user_level,
            exp: data.user.user_xp,
            preferLanguage: data.user.prefer_language,
            totalSolved: data.totalSolved,
            rank: "Unranked", // Placeholder
        };
        this.stats = {
            streak: 0, // Placeholder
            todaySolved: data.todaySolved,
            thisWeekSolved: data.thisWeekSolved,
            mostUsedLanguage: data.mostUsedLanguage,
        };
        this.badges = []; // Placeholder
        this.levelDistribution = data.levelDistribution;
        this.languageDistribution = data.languageDistribution;
        this.heatmap = data.heatmap;
    }

    static from(data) {
        return new UserStatsResponseDto(data);
    }

    getAvatarImage(level) {
        // Ensure level is within 1-4 range
        const safeLevel = Math.max(1, Math.min(level, 4));
        return `/images/level/${safeLevel}.png`;
    }

    getBioMessage(purpose) {
        switch (purpose) {
            case "prob":
                return "문제 풀이에 집중하고 있어요 🧩";
            case "proj":
                return "프로젝트를 준비하고 있어요 🛠️";
            case "learn":
                return "열심히 배우는 중이에요 📚";
            default:
                return "안녕하세요! 👋";
        }
    }
}
