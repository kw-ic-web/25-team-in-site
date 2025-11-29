import { describe, it, expect } from "@jest/globals";
import { UserStatsResponseDto } from "../../../../src/dto/user/userStats.response.dto.js";

const buildStatsInput = (overrides = {}) => ({
  user: {
    user_id: "tester01",
    user_level: 5,
    user_xp: 1200,
    prefer_language: "js",
    purpose: "prob",
    ...overrides.user,
  },
  totalSolved: 42,
  todaySolved: 1,
  thisWeekSolved: 5,
  mostUsedLanguage: "js",
  levelDistribution: [0, 1, 2, 3],
  languageDistribution: { js: 10 },
  heatmap: [],
  ...overrides,
});

describe("UserStatsResponseDto", () => {
  it("입력 데이터를 뷰 모델 형태로 변환한다", () => {
    const dto = UserStatsResponseDto.from(buildStatsInput());
    expect(dto.profile).toMatchObject({
      nickname: "tester01",
      avatarImage: "/images/level/4.png",
      preferLanguage: "js",
    });
    expect(dto.stats).toMatchObject({
      todaySolved: 1,
      thisWeekSolved: 5,
      mostUsedLanguage: "js",
    });
    expect(dto.levelDistribution).toEqual([0, 1, 2, 3]);
  });

  it("purpose에 따라 bio 메시지를 다르게 제공한다", () => {
    const dto = UserStatsResponseDto.from(
      buildStatsInput({
        user: { purpose: "proj", user_level: 2 },
      }),
    );
    expect(dto.profile.bio).toBe("프로젝트를 준비하고 있어요 🛠️");
    expect(dto.profile.avatarImage).toBe("/images/level/2.png");
  });

  it("알 수 없는 purpose면 기본 메시지를 사용한다", () => {
    const dto = UserStatsResponseDto.from(
      buildStatsInput({
        user: { purpose: "unknown" },
      }),
    );
    expect(dto.profile.bio).toBe("안녕하세요! 👋");
  });

  describe("엣지 케이스", () => {
    it("user_level이 0인 경우 1로 clamp된다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { user_level: 0 },
        }),
      );
      expect(dto.profile.avatarImage).toBe("/images/level/1.png");
    });

    it("user_level이 5 이상인 경우 4로 clamp된다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { user_level: 5 },
        }),
      );
      expect(dto.profile.avatarImage).toBe("/images/level/4.png");
      expect(dto.profile.level).toBe(5);
    });

    it("user_level이 null인 경우 1로 clamp된다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { user_level: null },
        }),
      );
      expect(dto.profile.avatarImage).toBe("/images/level/1.png");
    });

    it("user_xp가 null인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { user_xp: null },
        }),
      );
      expect(dto.profile.exp).toBeNull();
    });

    it("prefer_language가 null인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { prefer_language: null },
        }),
      );
      expect(dto.profile.preferLanguage).toBeNull();
    });

    it("purpose가 null인 경우 기본 메시지를 사용한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          user: { purpose: null },
        }),
      );
      expect(dto.profile.bio).toBe("안녕하세요! 👋");
    });

    it("totalSolved가 0인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          totalSolved: 0,
        }),
      );
      expect(dto.profile.totalSolved).toBe(0);
    });

    it("todaySolved가 0인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          todaySolved: 0,
        }),
      );
      expect(dto.stats.todaySolved).toBe(0);
    });

    it("thisWeekSolved가 0인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          thisWeekSolved: 0,
        }),
      );
      expect(dto.stats.thisWeekSolved).toBe(0);
    });

    it("mostUsedLanguage가 '-'인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          mostUsedLanguage: "-",
        }),
      );
      expect(dto.stats.mostUsedLanguage).toBe("-");
    });

    it("levelDistribution이 빈 객체인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          levelDistribution: {},
        }),
      );
      expect(dto.levelDistribution).toEqual({});
    });

    it("languageDistribution이 빈 객체인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          languageDistribution: {},
        }),
      );
      expect(dto.languageDistribution).toEqual({});
    });

    it("heatmap이 빈 배열인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          heatmap: [],
        }),
      );
      expect(dto.heatmap).toEqual([]);
    });

    it("levelDistribution의 키가 숫자인 경우를 처리한다", () => {
      const dto = UserStatsResponseDto.from(
        buildStatsInput({
          levelDistribution: { 1: 5, 2: 3, 3: 2 },
        }),
      );
      expect(dto.levelDistribution).toEqual({ 1: 5, 2: 3, 3: 2 });
      // JavaScript 객체 키는 문자열로 변환되지만, 값은 유지됨
      expect(dto.levelDistribution["1"]).toBe(5);
      expect(dto.levelDistribution["2"]).toBe(3);
      expect(dto.levelDistribution["3"]).toBe(2);
    });
  });
});
