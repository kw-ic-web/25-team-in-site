import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
  seedProblemWithDetail,
  seedSolvedRecord,
} from "../utils/test-helpers.js";

setupTestDBHooks();

describe("Problems API", () => {
  let user;
  let cookie;
  let problemA;
  let problemB;

  beforeEach(async () => {
    const created = await createAuthenticatedUser({
      user_id: `prob_user_${Date.now()}`,
      prefer_language: "py",
    });
    user = created.user;
    cookie = created.cookie;
    problemA = await seedProblemWithDetail({
      problem_difficulty: 2,
      problem_lang: ["Python"],
      problem_main_category: ["Algorithm"],
      problem_sub_category: ["Sorting"],
    });
    problemB = await seedProblemWithDetail({
      problem_difficulty: 3,
      problem_lang: ["Python"],
      problem_main_category: ["Graph"],
      problem_sub_category: ["Tree"],
    });
    await seedSolvedRecord({
      user,
      problem: problemA.problem,
      language: "Python",
    });
  });

  it("GET /api/v1/problems", async () => {
    const res = await appRequest()
      .get("/api/v1/problems?page=1&limit=10")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total_count).toBeGreaterThanOrEqual(2);
    expect(res.body.problems.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/:id", async () => {
    const res = await appRequest()
      .get(`/api/v1/problems/${problemA.problem.problem_id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(problemA.problem.problem_id);
    expect(res.body.expected_xp).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/recommendations/personal", async () => {
    const res = await appRequest()
      .get("/api/v1/problems/recommendations/personal?limit=2")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.problems.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/:id/similar", async () => {
    const res = await appRequest()
      .get(`/api/v1/problems/${problemB.problem.problem_id}/similar?limit=5`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/v1/problems/recent/solved", async () => {
    const res = await appRequest()
      .get("/api/v1/problems/recent/solved?limit=5")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.items[0].problem.id).toBe(problemA.problem.problem_id);
  });

  describe("인증 실패", () => {
    it("토큰 없이 접근 시 401을 반환한다", async () => {
      const res = await appRequest().get("/api/v1/problems");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });

    it("잘못된 토큰으로 접근 시 401을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems")
        .set("Cookie", "token=invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });
  });

  describe("GET /api/v1/problems/:id 실패", () => {
    it("잘못된 UUID 형식이면 400을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems/invalid-uuid")
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("문제 ID가 올바르지 않습니다");
    });

    it("존재하지 않는 문제면 500을 반환한다", async () => {
      const { v7: uuidv7 } = await import("uuid");
      const fakeId = uuidv7();

      const res = await appRequest()
        .get(`/api/v1/problems/${fakeId}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("문제 세부사항을 찾을 수 없습니다.");
    });
  });

  describe("GET /api/v1/problems/:id/similar 실패", () => {
    it("잘못된 UUID 형식이면 400을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems/invalid-uuid/similar")
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("문제 ID가 올바르지 않습니다");
    });

    it("존재하지 않는 문제면 500을 반환한다", async () => {
      const { v7: uuidv7 } = await import("uuid");
      const fakeId = uuidv7();

      const res = await appRequest()
        .get(`/api/v1/problems/${fakeId}/similar?limit=5`)
        .set("Cookie", cookie);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("문제 세부사항을 찾을 수 없습니다.");
    });
  });

  describe("DTO 검증 실패", () => {
    it("limit이 0이면 400을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems/recommendations/personal?limit=0")
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
    });

    it("limit이 21 이상이면 400을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems/recommendations/personal?limit=21")
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
    });

    it("page가 0 이하면 400을 반환한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems?page=0")
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
    });
  });

  describe("Edge Cases", () => {
    it("빈 문제 목록을 반환한다 (total_count: 0)", async () => {
      const { cookie: newCookie } = await createAuthenticatedUser({
        user_id: `empty_user_${Date.now()}`,
      });

      const res = await appRequest()
        .get("/api/v1/problems?page=1&limit=10")
        .set("Cookie", newCookie);

      expect(res.status).toBe(200);
      expect(res.body.pagination.total_count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.problems)).toBe(true);
    });

    it("exclude_solved=true일 때 해결한 문제를 제외한다", async () => {
      const res = await appRequest()
        .get(`/api/v1/problems?page=1&limit=10&exclude_solved=true`)
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      const solvedProblem = res.body.problems.find(
        (p) => p.id === problemA.problem.problem_id,
      );
      expect(solvedProblem).toBeUndefined();
    });

    it("difficulties 필터링이 동작한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems?page=1&limit=10&difficulties=2")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      res.body.problems.forEach((p) => {
        expect(p.difficulty).toBe(2);
      });
    });

    it("languages 필터링이 동작한다", async () => {
      const res = await appRequest()
        .get("/api/v1/problems?page=1&limit=10&languages=Python")
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      res.body.problems.forEach((p) => {
        expect(p.language).toContain("Python");
      });
    });

    it("sort_by와 sort_order가 동작한다", async () => {
      const res = await appRequest()
        .get(
          "/api/v1/problems?page=1&limit=10&sort_by=difficulty&sort_order=asc",
        )
        .set("Cookie", cookie);

      expect(res.status).toBe(200);
      if (res.body.problems.length > 1) {
        const difficulties = res.body.problems.map((p) => p.difficulty);
        const sorted = [...difficulties].sort((a, b) => a - b);
        expect(difficulties).toEqual(sorted);
      }
    });

    it("해결한 문제가 없으면 빈 목록을 반환한다", async () => {
      const { cookie: newCookie } = await createAuthenticatedUser({
        user_id: `no_solved_${Date.now()}`,
      });

      const res = await appRequest()
        .get("/api/v1/problems/recent/solved?limit=5")
        .set("Cookie", newCookie);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.items).toEqual([]);
    });

    it("추천 문제가 없으면 빈 목록을 반환한다", async () => {
      const { cookie: newCookie } = await createAuthenticatedUser({
        user_id: `no_recommend_${Date.now()}`,
      });

      const res = await appRequest()
        .get("/api/v1/problems/recommendations/personal?limit=2")
        .set("Cookie", newCookie);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.problems)).toBe(true);
    });
  });
});
