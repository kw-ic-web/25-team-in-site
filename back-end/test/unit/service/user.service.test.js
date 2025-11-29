import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserService } from "../../../src/service/user.service.js";
import { UserRepository } from "../../../src/repository/user.repository.js";
import { SolvedRepository } from "../../../src/repository/solved.repository.js";

const mockUser = {
  _id: "user-object-id",
  user_id: "tester",
  user_level: 3,
  user_xp: 1500,
  prefer_language: "py",
  purpose: "learn",
};

const mockDateRangeCounts = () =>
  jest
    .spyOn(SolvedRepository, "countByUserIdAndDateRange")
    .mockResolvedValueOnce(1)
    .mockResolvedValueOnce(4);

const mockLevelStats = () =>
  jest.spyOn(SolvedRepository, "groupByLevel").mockResolvedValue([
    { _id: 2, count: 3 },
    { _id: 3, count: 5 },
  ]);

const mockLanguageStats = () =>
  jest.spyOn(SolvedRepository, "groupByLanguage").mockResolvedValue([
    { _id: "JavaScript", count: 6 },
    { _id: "Python", count: 2 },
  ]);

const mockHeatmap = () =>
  jest
    .spyOn(SolvedRepository, "getDailyActivity")
    .mockResolvedValue([{ _id: "2024-01-01", count: 2 }]);

describe("UserService.getUserStats", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("사용자 통계를 계산해 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(12);
    mockDateRangeCounts();
    mockLevelStats();
    mockLanguageStats();
    mockHeatmap();

    const stats = await UserService.getUserStats("tester");

    expect(stats.profile.nickname).toBe("tester");
    expect(stats.profile.avatarImage).toBe("/images/level/3.png");
    expect(stats.profile.totalSolved).toBe(12);
    expect(stats.stats.todaySolved).toBe(1);
    expect(stats.stats.thisWeekSolved).toBe(4);
    expect(stats.stats.mostUsedLanguage).toBe("JavaScript");
    expect(stats.levelDistribution).toEqual({ 2: 3, 3: 5 });
    expect(stats.languageDistribution).toEqual({
      JavaScript: 6,
      Python: 2,
    });
    expect(stats.heatmap).toEqual([{ date: "2024-01-01", count: 2 }]);
  });

  it("사용자가 존재하지 않으면 예외를 던진다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(null);

    await expect(UserService.getUserStats("ghost")).rejects.toThrow(
      "사용자 정보를 찾을 수 없습니다.",
    );
  });

  it("언어 통계가 없으면 mostUsedLanguage를 '-'로 반환한다", async () => {
    jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(0);
    mockDateRangeCounts();
    mockLevelStats();
    jest.spyOn(SolvedRepository, "groupByLanguage").mockResolvedValue([]);
    mockHeatmap();

    const stats = await UserService.getUserStats("tester");

    expect(stats.stats.mostUsedLanguage).toBe("-");
    expect(stats.languageDistribution).toEqual({});
  });

  describe("Repository 실패 케이스", () => {
    it("totalSolved가 0인 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(0);
      jest
        .spyOn(SolvedRepository, "countByUserIdAndDateRange")
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      jest.spyOn(SolvedRepository, "groupByLevel").mockResolvedValue([]);
      jest.spyOn(SolvedRepository, "groupByLanguage").mockResolvedValue([]);
      jest.spyOn(SolvedRepository, "getDailyActivity").mockResolvedValue([]);

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.totalSolved).toBe(0);
      expect(stats.stats.todaySolved).toBe(0);
      expect(stats.stats.thisWeekSolved).toBe(0);
      expect(stats.levelDistribution).toEqual({});
      expect(stats.languageDistribution).toEqual({});
      expect(stats.heatmap).toEqual([]);
    });

    it("levelStats가 빈 배열인 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      jest.spyOn(SolvedRepository, "groupByLevel").mockResolvedValue([]);
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.levelDistribution).toEqual({});
    });

    it("dailyActivity가 빈 배열인 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      jest.spyOn(SolvedRepository, "getDailyActivity").mockResolvedValue([]);

      const stats = await UserService.getUserStats("tester");

      expect(stats.heatmap).toEqual([]);
    });
  });

  describe("엣지 케이스", () => {
    it("user.user_level이 null인 경우를 처리한다", async () => {
      const userWithNullLevel = { ...mockUser, user_level: null };
      jest
        .spyOn(UserRepository, "findOne")
        .mockResolvedValue(userWithNullLevel);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      // getAvatarImage에서 Math.max(1, Math.min(null, 4)) = Math.max(1, 0) = 1
      expect(stats.profile.avatarImage).toBe("/images/level/1.png");
    });

    it("user.user_level이 0인 경우를 처리한다", async () => {
      const userWithZeroLevel = { ...mockUser, user_level: 0 };
      jest
        .spyOn(UserRepository, "findOne")
        .mockResolvedValue(userWithZeroLevel);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.avatarImage).toBe("/images/level/1.png");
    });

    it("user.user_level이 5 이상인 경우를 처리한다", async () => {
      const userWithHighLevel = { ...mockUser, user_level: 5 };
      jest
        .spyOn(UserRepository, "findOne")
        .mockResolvedValue(userWithHighLevel);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.avatarImage).toBe("/images/level/4.png");
    });

    it("user.user_xp가 null인 경우를 처리한다", async () => {
      const userWithNullXp = { ...mockUser, user_xp: null };
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(userWithNullXp);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.exp).toBeNull();
    });

    it("user.prefer_language가 null인 경우를 처리한다", async () => {
      const userWithNullLanguage = { ...mockUser, prefer_language: null };
      jest
        .spyOn(UserRepository, "findOne")
        .mockResolvedValue(userWithNullLanguage);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.preferLanguage).toBeNull();
    });

    it("user.purpose가 null인 경우를 처리한다", async () => {
      const userWithNullPurpose = { ...mockUser, purpose: null };
      jest
        .spyOn(UserRepository, "findOne")
        .mockResolvedValue(userWithNullPurpose);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.profile.bio).toBe("안녕하세요! 👋");
    });

    it("levelStats에 _id가 null인 항목이 있는 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      jest.spyOn(SolvedRepository, "groupByLevel").mockResolvedValue([
        { _id: null, count: 3 },
        { _id: 2, count: 5 },
      ]);
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.levelDistribution).toHaveProperty("null", 3);
      expect(stats.levelDistribution[2]).toBe(5);
    });

    it("languageStats에 _id가 null인 항목이 있는 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      jest.spyOn(SolvedRepository, "groupByLanguage").mockResolvedValue([
        { _id: null, count: 1 },
        { _id: "JavaScript", count: 6 },
      ]);
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.languageDistribution).toHaveProperty("null", 1);
      expect(stats.stats.mostUsedLanguage).toBe("JavaScript");
    });

    it("languageStats에 동일한 count를 가진 여러 언어가 있는 경우 가장 먼저 나온 것을 선택한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      jest.spyOn(SolvedRepository, "groupByLanguage").mockResolvedValue([
        { _id: "Python", count: 5 },
        { _id: "JavaScript", count: 5 },
        { _id: "Java", count: 3 },
      ]);
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.stats.mostUsedLanguage).toBe("Python");
    });

    it("dailyActivity에 _id가 null인 항목이 있는 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      mockDateRangeCounts();
      mockLevelStats();
      mockLanguageStats();
      jest.spyOn(SolvedRepository, "getDailyActivity").mockResolvedValue([
        { _id: null, count: 1 },
        { _id: "2024-01-01", count: 2 },
      ]);

      const stats = await UserService.getUserStats("tester");

      expect(stats.heatmap).toContainEqual({ date: null, count: 1 });
      expect(stats.heatmap).toContainEqual({ date: "2024-01-01", count: 2 });
    });
  });

  describe("날짜 계산 엣지 케이스", () => {
    it("오늘 해결한 문제가 0개인 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      jest
        .spyOn(SolvedRepository, "countByUserIdAndDateRange")
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(4);
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.stats.todaySolved).toBe(0);
      expect(stats.stats.thisWeekSolved).toBe(4);
    });

    it("이번 주 해결한 문제가 0개인 경우를 처리한다", async () => {
      jest.spyOn(UserRepository, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(SolvedRepository, "countByUserId").mockResolvedValue(5);
      jest
        .spyOn(SolvedRepository, "countByUserIdAndDateRange")
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      mockLevelStats();
      mockLanguageStats();
      mockHeatmap();

      const stats = await UserService.getUserStats("tester");

      expect(stats.stats.todaySolved).toBe(1);
      expect(stats.stats.thisWeekSolved).toBe(0);
    });
  });
});
