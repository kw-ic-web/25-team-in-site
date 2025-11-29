import { describe, it, expect } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
  seedProblemWithDetail,
  seedSolvedRecord,
} from "../utils/test-helpers.js";

setupTestDBHooks();

describe("User API Integration - /api/v1/user/stats", () => {
  it("DB 데이터를 기반으로 DTO 형태의 통계를 반환한다", async () => {
    const { user, cookie } = await createAuthenticatedUser({
      user_level: 3,
      prefer_language: "py",
      purpose: "learn",
    });

    const easy = await seedProblemWithDetail({ problem_difficulty: 2 });
    const hard = await seedProblemWithDetail({
      problem_difficulty: 4,
      problem_lang: ["Python"],
    });

    await seedSolvedRecord({
      user,
      problem: easy.problem,
      language: "JavaScript",
    });
    await seedSolvedRecord({
      user,
      problem: hard.problem,
      language: "Python",
    });

    const res = await appRequest()
      .get("/api/v1/user/stats")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile.nickname).toBe(user.user_id);
    expect(res.body.profile.totalSolved).toBe(2);
    expect(res.body.profile.avatarImage).toBe("/images/level/3.png");
    expect(["JavaScript", "Python"]).toContain(res.body.stats.mostUsedLanguage);
    expect(res.body.levelDistribution["2"]).toBe(1);
    expect(res.body.levelDistribution["4"]).toBe(1);
    expect(res.body.languageDistribution.JavaScript).toBe(1);
    expect(res.body.languageDistribution.Python).toBe(1);
    expect(res.body.heatmap.length).toBeGreaterThan(0);
  });

  it("해결한 문제가 하나도 없는 사용자의 stats를 반환한다", async () => {
    const { user, cookie } = await createAuthenticatedUser({
      user_level: 2,
      prefer_language: "js",
      purpose: "learn",
    });

    const res = await appRequest()
      .get("/api/v1/user/stats")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile.nickname).toBe(user.user_id);
    expect(res.body.profile.totalSolved).toBe(0);
    expect(res.body.stats.todaySolved).toBe(0);
    expect(res.body.stats.thisWeekSolved).toBe(0);
    expect(res.body.stats.mostUsedLanguage).toBe("-");
    expect(res.body.levelDistribution).toEqual({});
    expect(res.body.languageDistribution).toEqual({});
  });

  describe("다양한 사용자 레벨 테스트", () => {
    it("user_level이 1인 경우를 처리한다", async () => {
      const { user, cookie } = await createAuthenticatedUser({
        user_level: 1,
        prefer_language: "py",
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/1.png");
      expect(res.body.profile.level).toBe(1);
    });

    it("user_level이 2인 경우를 처리한다", async () => {
      const { user, cookie } = await createAuthenticatedUser({
        user_level: 2,
        prefer_language: "py",
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/2.png");
      expect(res.body.profile.level).toBe(2);
    });

    it("user_level이 4인 경우를 처리한다", async () => {
      const { user, cookie } = await createAuthenticatedUser({
        user_level: 4,
        prefer_language: "py",
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/4.png");
      expect(res.body.profile.level).toBe(4);
    });
  });
});
