import { describe, it, expect } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
  seedProblemWithDetail,
  seedSolvedRecord,
} from "../utils/test-helpers.js";
import { createUser } from "../utils/test-data.js";

setupTestDBHooks();

describe("User API", () => {
  it("GET /api/v1/user/check-id/:user_id → 사용 가능 여부", async () => {
    const availableRes = await appRequest().get(
      "/api/v1/user/check-id/free_id",
    );
    expect(availableRes.status).toBe(200);
    expect(availableRes.body.available).toBe(true);

    await createUser({ user_id: "taken_id", user_email: "taken@example.com" });
    const takenRes = await appRequest().get("/api/v1/user/check-id/taken_id");
    expect(takenRes.status).toBe(200);
    expect(takenRes.body.available).toBe(false);
  });

  it("GET /api/v1/user/stats → 인증된 사용자 정보", async () => {
    const { user, cookie } = await createAuthenticatedUser({
      user_id: "stats_user",
      prefer_language: "js",
    });
    const prob = await seedProblemWithDetail({
      problem_difficulty: 2,
    });
    await seedSolvedRecord({
      user,
      problem: prob.problem,
      language: "py",
    });

    const res = await appRequest()
      .get("/api/v1/user/stats")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile.nickname).toBe("stats_user");
    expect(res.body.profile.totalSolved).toBe(1);
    expect(res.body.stats.mostUsedLanguage).toBe("py");
  });

  describe("GET /api/v1/user/check-id/:user_id 엣지 케이스", () => {
    it("user_id가 정확히 3자인 경우를 허용한다", async () => {
      const res = await appRequest().get("/api/v1/user/check-id/abc");

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it("user_id가 정확히 50자인 경우를 허용한다", async () => {
      const maxLengthUserId = "a".repeat(50);
      const res = await appRequest().get(
        `/api/v1/user/check-id/${maxLengthUserId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it("user_id에 언더스코어(_)가 포함된 경우를 허용한다", async () => {
      const res = await appRequest().get("/api/v1/user/check-id/user_name");

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });

    it("user_id에 하이픈(-)이 포함된 경우를 허용한다", async () => {
      const res = await appRequest().get("/api/v1/user/check-id/user-name");

      expect(res.status).toBe(200);
      expect(res.body.available).toBe(true);
    });
  });

  describe("GET /api/v1/user/check-id/:user_id 실패", () => {
    it("잘못된 user_id 형식이면 400을 반환한다", async () => {
      const res = await appRequest().get("/api/v1/user/check-id/ab");

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });

    it("특수문자가 포함된 user_id면 400을 반환한다", async () => {
      const res = await appRequest().get("/api/v1/user/check-id/user@id");

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });

    it("매우 긴 user_id(50자 초과)면 400을 반환한다", async () => {
      const longUserId = "a".repeat(51);
      const res = await appRequest().get(`/api/v1/user/check-id/${longUserId}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });
  });

  describe("GET /api/v1/user/stats 엣지 케이스", () => {
    it("해결한 문제가 하나도 없는 사용자의 stats를 반환한다", async () => {
      const { user, cookie } = await createAuthenticatedUser({
        user_id: "no_solved_user",
        user_level: 2,
        prefer_language: "js",
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.nickname).toBe("no_solved_user");
      expect(res.body.profile.totalSolved).toBe(0);
      expect(res.body.stats.todaySolved).toBe(0);
      expect(res.body.stats.thisWeekSolved).toBe(0);
      expect(res.body.stats.mostUsedLanguage).toBe("-");
      expect(res.body.levelDistribution).toEqual({});
      expect(res.body.languageDistribution).toEqual({});
    });

    it("user_level이 1인 경우를 처리한다", async () => {
      const { cookie } = await createAuthenticatedUser({
        user_id: "level1_user",
        user_level: 1,
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/1.png");
    });

    it("user_level이 2인 경우를 처리한다", async () => {
      const { cookie } = await createAuthenticatedUser({
        user_id: "level2_user",
        user_level: 2,
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/2.png");
    });

    it("user_level이 4인 경우를 처리한다", async () => {
      const { cookie } = await createAuthenticatedUser({
        user_id: "level4_user",
        user_level: 4,
      });

      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      expect(res.body.profile.avatarImage).toBe("/images/level/4.png");
    });
  });

  describe("GET /api/v1/user/stats 실패", () => {
    it("토큰 없이 접근 시 401을 반환한다", async () => {
      const res = await appRequest().get("/api/v1/user/stats");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });

    it("잘못된 토큰으로 접근 시 401을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/user/stats")
        .set("Cookie", "token=invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });
  });
});
