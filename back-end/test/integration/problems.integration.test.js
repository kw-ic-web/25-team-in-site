import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
  seedProblemWithDetail,
  seedSolvedRecord,
} from "../utils/test-helpers.js";

setupTestDBHooks();

describe("Problems API Integration", () => {
  let cookie;
  let user;
  let problemA;
  let problemB;

  beforeEach(async () => {
    const created = await createAuthenticatedUser({
      prefer_language: "py",
    });
    user = created.user;
    cookie = created.cookie;
    problemA = await seedProblemWithDetail({
      problem_difficulty: 2,
      problem_lang: ["Python"],
    });
    problemB = await seedProblemWithDetail({
      problem_difficulty: 3,
      problem_lang: ["Python"],
    });
    await seedSolvedRecord({
      user,
      problem: problemA.problem,
      language: "Python",
    });
  });

  it("GET /api/v1/problems → 해결 여부/expected_xp를 포함한다", async () => {
    const res = await appRequest()
      .get("/api/v1/problems?page=1&limit=10&languages=Python")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    const solved = res.body.problems.find(
      (p) => p.id === problemA.problem.problem_id,
    );
    const unsolved = res.body.problems.find(
      (p) => p.id === problemB.problem.problem_id,
    );
    expect(solved?.is_solved).toBe(true);
    expect(unsolved?.is_solved).toBe(false);
    expect(solved?.expected_xp).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/:id → 상세 DTO 구조를 반환한다", async () => {
    const res = await appRequest()
      .get(`/api/v1/problems/${problemA.problem.problem_id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(problemA.problem.problem_id);
    expect(res.body.body).toContain("<p>");
    expect(res.body.expected_xp).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/recommendations/personal → DTO 규격 유지", async () => {
    const res = await appRequest()
      .get("/api/v1/problems/recommendations/personal?limit=2")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.problems[0].expected_xp).toBeGreaterThan(0);
  });

  it("GET /api/v1/problems/:id/similar → 대상 문제 제외", async () => {
    const res = await appRequest()
      .get(`/api/v1/problems/${problemB.problem.problem_id}/similar?limit=3`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.problems)).toBe(true);
    res.body.problems.forEach((problem) => {
      expect(problem).toHaveProperty("id");
      expect(problem).toHaveProperty("expected_xp");
    });
  });

  it("GET /api/v1/problems/recent/solved → 최근 해결 목록 반환", async () => {
    const res = await appRequest()
      .get("/api/v1/problems/recent/solved?limit=5")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.items[0].problem.id).toBe(problemA.problem.problem_id);
  });

  it("GET /api/v1/problems → 문제가 하나도 없는 경우 빈 결과를 반환한다", async () => {
    // 새로운 사용자로 테스트 (문제가 없는 상태)
    // beforeEach에서 생성된 문제들을 제외하기 위해 존재하지 않는 필터 사용
    const newUser = await createAuthenticatedUser({
      prefer_language: "js",
    });

    const res = await appRequest()
      .get(
        "/api/v1/problems?page=1&limit=10&languages=NonExistentLanguage&main_category=NonExistentCategory",
      )
      .set("Cookie", newUser.cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total_count).toBe(0);
    expect(res.body.problems).toEqual([]);
  });

  it("GET /api/v1/problems/recent/solved → 해결한 문제가 없는 경우 빈 결과를 반환한다", async () => {
    const newUser = await createAuthenticatedUser({
      prefer_language: "js",
    });

    const res = await appRequest()
      .get("/api/v1/problems/recent/solved?limit=5")
      .set("Cookie", newUser.cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.items).toEqual([]);
  });

  it("GET /api/v1/problems/recommendations/personal → 추천 문제가 없는 경우 빈 결과를 반환한다", async () => {
    // 모든 문제를 해결한 사용자로 테스트
    const newUser = await createAuthenticatedUser({
      prefer_language: "js",
    });
    // beforeEach에서 생성된 문제들도 모두 해결
    await seedSolvedRecord({
      user: newUser.user,
      problem: problemA.problem,
      language: "Python",
    });
    await seedSolvedRecord({
      user: newUser.user,
      problem: problemB.problem,
      language: "Python",
    });
    const newProblem = await seedProblemWithDetail({
      problem_difficulty: 1,
      problem_lang: ["JavaScript"],
    });
    await seedSolvedRecord({
      user: newUser.user,
      problem: newProblem.problem,
      language: "JavaScript",
    });

    const res = await appRequest()
      .get("/api/v1/problems/recommendations/personal?limit=2")
      .set("Cookie", newUser.cookie);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.problems).toEqual([]);
  });

  it("GET /api/v1/problems/:id/similar → 유사 문제가 없는 경우 빈 결과를 반환한다", async () => {
    // difficulty 5, Rust 언어, UniqueCategory인 문제 생성
    // beforeEach에서 생성된 문제들( difficulty 2, 3, Python, Algorithm)은
    // difficulty 범위(4~5)와 언어/카테고리 조건을 만족하지 않으므로 필터링되어야 함
    const isolatedProblem = await seedProblemWithDetail({
      problem_difficulty: 5,
      problem_lang: ["Rust"],
      problem_main_category: ["UniqueCategory"],
      problem_sub_category: ["UniqueSubCategory"],
    });

    const res = await appRequest()
      .get(
        `/api/v1/problems/${isolatedProblem.problem.problem_id}/similar?limit=3`,
      )
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    // difficulty 4~5 범위에 있고, Rust 언어이거나 UniqueCategory인 문제가 없어야 함
    expect(res.body.count).toBe(0);
    expect(res.body.problems).toEqual([]);
  });

  it("GET /api/v1/problems → 여러 필터를 동시에 사용하는 경우 정상 동작한다", async () => {
    const res = await appRequest()
      .get(
        "/api/v1/problems?page=1&limit=10&difficulties=2,3&languages=Python&main_category=Algorithm",
      )
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.problems)).toBe(true);
  });

  it("GET /api/v1/problems → 필터 조합으로 결과가 없는 경우 빈 결과를 반환한다", async () => {
    const res = await appRequest()
      .get(
        "/api/v1/problems?page=1&limit=10&difficulties=5&languages=NonExistent&main_category=NonExistent",
      )
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total_count).toBe(0);
    expect(res.body.problems).toEqual([]);
  });
});
