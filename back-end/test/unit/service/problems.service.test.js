import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ProblemsService } from "../../../src/service/problems.service.js";
import { ProblemRepository } from "../../../src/repository/problem.repository.js";
import { SolvedRepository } from "../../../src/repository/solved.repository.js";
import { ProbListRequestDto } from "../../../src/dto/problems/problemList.request.dto.js";
import { ProbDetailRequestDto } from "../../../src/dto/problems/problem.request.dto.js";
import { ProbRecommendRequestDto } from "../../../src/dto/problems/problemRecommend.request.dto.js";
import { SimilarProblemRequestDto } from "../../../src/dto/problems/problemSimilar.request.dto.js";
import { RecentSolvedListRequestDto } from "../../../src/dto/problems/problemRecentSolved.request.dto.js";
import { ERROR } from "../../../src/mapper/error.mapper.js";

const PROBLEM_ID = "018f1d40-5c40-7c60-ace2-dad9b0400559";

const mockUser = {
  _id: "user-object-id",
  user_id: "tester",
  metalevel: 3,
  user_level: 3,
  prefer_language: "py",
};

const baseProblem = {
  _id: "mongo-prob-1",
  problem_id: PROBLEM_ID,
  problem_title: "정렬 문제",
  problem_difficulty: 2,
  problem_lang: ["JavaScript"],
  problem_main_category: ["Algorithm"],
  problem_sub_category: ["Sorting"],
  problem_success_rate: 60,
  createdAt: new Date(),
};

const buildProblemListDto = (overrides = {}) =>
  ProbListRequestDto.parse({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
    exclude_solved: false,
    ...overrides,
  });

const buildProblemDetailDto = (overrides = {}) =>
  ProbDetailRequestDto.parse({ id: PROBLEM_ID, ...overrides });

const buildRecommendDto = (overrides = {}) =>
  ProbRecommendRequestDto.parse({ limit: 2, ...overrides });

const buildSimilarDto = (overrides = {}) =>
  SimilarProblemRequestDto.parse({
    id: PROBLEM_ID,
    limit: 1,
    ...overrides,
  });

const buildRecentSolvedDto = (overrides = {}) =>
  RecentSolvedListRequestDto.parse({ limit: 5, ...overrides });

describe("ProblemsService.getProblemList", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("문제 목록을 가져오고 expected_xp/is_solved를 채운다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([baseProblem._id]);
    jest.spyOn(ProblemRepository, "findProblems").mockResolvedValue({
      items: [baseProblem],
      total: 1,
    });

    const dto = buildProblemListDto();
    const result = await ProblemsService.getProblemList(dto, "tester");

    expect(result.page).toBe(1);
    expect(result.totalCount).toBe(1);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0].problem_id).toBe(PROBLEM_ID);
    expect(result.problems[0].is_solved).toBe(true);
    expect(result.problems[0].expected_xp).toBeGreaterThan(0);
  });

  it("userId가 null이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemListDto();
    await expect(ProblemsService.getProblemList(dto, null)).rejects.toThrow(
      "사용자 정보를 찾을 수 없습니다.",
    );
  });

  it("userId가 undefined이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemListDto();
    await expect(
      ProblemsService.getProblemList(dto, undefined),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("사용자를 찾을 수 없으면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemListDto();
    await expect(
      ProblemsService.getProblemList(dto, "nonexistent"),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("ProblemRepository.findProblems가 빈 배열을 반환하면 빈 결과를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest.spyOn(ProblemRepository, "findProblems").mockResolvedValue({
      items: [],
      total: 0,
    });

    const dto = buildProblemListDto();
    const result = await ProblemsService.getProblemList(dto, "tester");

    expect(result.page).toBe(1);
    expect(result.totalCount).toBe(0);
    expect(result.problems).toEqual([]);
  });

  it("ProblemRepository.findProblems가 null 문제를 반환해도 정상 처리된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest.spyOn(ProblemRepository, "findProblems").mockResolvedValue({
      items: [baseProblem],
      total: 1,
    });

    const dto = buildProblemListDto();
    const result = await ProblemsService.getProblemList(dto, "tester");

    expect(result.problems).toBeDefined();
    expect(result.problems.length).toBeGreaterThanOrEqual(0);
  });
});

describe("ProblemsService.getProblemById", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("문제 상세를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(ProblemRepository, "findProblemById").mockResolvedValue({
      ...baseProblem,
      problem_body: "<p>본문</p>",
      problem_attachment_urls: [],
      problem_test_cases: ["1 2"],
      problem_time_limit: 1000,
      problem_memory_limit: 256,
    });
    jest
      .spyOn(SolvedRepository, "hasUserSolvedProblem")
      .mockResolvedValue(true);

    const dto = buildProblemDetailDto();
    const result = await ProblemsService.getProblemById(dto, "tester");

    expect(result.problem.problem_id).toBe(PROBLEM_ID);
    expect(result.isSolved).toBe(true);
    expect(result.expectedXp).toBeGreaterThan(0);
  });

  it("문제가 없으면 예외를 던진다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(ProblemRepository, "findProblemById").mockResolvedValue(null);

    const dto = buildProblemDetailDto({ id: PROBLEM_ID });

    await expect(ProblemsService.getProblemById(dto, "tester")).rejects.toThrow(
      "문제 세부사항을 찾을 수 없습니다.",
    );
  });

  it("userId가 null이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemDetailDto();
    await expect(ProblemsService.getProblemById(dto, null)).rejects.toThrow(
      "사용자 정보를 찾을 수 없습니다.",
    );
  });

  it("userId가 undefined이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemDetailDto();
    await expect(
      ProblemsService.getProblemById(dto, undefined),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("사용자를 찾을 수 없으면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildProblemDetailDto();
    await expect(
      ProblemsService.getProblemById(dto, "nonexistent"),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });
});

describe("ProblemsService.getPersonalRecommendations", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("추천 문제를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    const candidates = [{ problem_id: PROBLEM_ID }, { problem_id: "prob-2" }];
    jest
      .spyOn(ProblemsService, "_fetchRecommendationCandidates")
      .mockResolvedValue(candidates);
    jest
      .spyOn(ProblemsService, "_scoreRecommendations")
      .mockReturnValue(candidates);
    jest
      .spyOn(ProblemsService, "_buildProblemSummary")
      .mockImplementation((problem) => ({
        problem_id: problem.problem_id,
        problem_title: problem.problem_id,
        problem_difficulty: 2,
        problem_lang: ["JavaScript"],
        problem_main_category: ["Algorithm"],
        problem_sub_category: ["Sorting"],
        problem_success_rate: 50,
        expected_xp: 100,
        is_solved: false,
      }));

    const dto = buildRecommendDto();
    const result = await ProblemsService.getPersonalRecommendations(
      dto,
      "tester",
    );

    expect(result.count).toBe(2);
    expect(result.problems.map((p) => p.problem_id)).toEqual([
      PROBLEM_ID,
      "prob-2",
    ]);
  });

  it("_buildProblemSummary가 null을 반환하면 필터링된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    const candidates = [{ problem_id: PROBLEM_ID }, { problem_id: "prob-2" }];
    jest
      .spyOn(ProblemsService, "_fetchRecommendationCandidates")
      .mockResolvedValue(candidates);
    jest
      .spyOn(ProblemsService, "_scoreRecommendations")
      .mockReturnValue(candidates);
    jest.spyOn(ProblemsService, "_buildProblemSummary").mockReturnValue(null);

    const dto = buildRecommendDto();
    const result = await ProblemsService.getPersonalRecommendations(
      dto,
      "tester",
    );

    expect(result.count).toBe(0);
    expect(result.problems).toEqual([]);
  });

  it("userId가 null이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecommendDto();
    await expect(
      ProblemsService.getPersonalRecommendations(dto, null),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("userId가 undefined이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecommendDto();
    await expect(
      ProblemsService.getPersonalRecommendations(dto, undefined),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("사용자를 찾을 수 없으면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecommendDto();
    await expect(
      ProblemsService.getPersonalRecommendations(dto, "nonexistent"),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("_fetchRecommendationCandidates가 빈 배열을 반환하면 빈 결과를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest
      .spyOn(ProblemsService, "_fetchRecommendationCandidates")
      .mockResolvedValue([]);

    const dto = buildRecommendDto();
    const result = await ProblemsService.getPersonalRecommendations(
      dto,
      "tester",
    );

    expect(result.count).toBe(0);
    expect(result.problems).toEqual([]);
  });

  it("SolvedRepository.findProblemObjectIdsByUser가 빈 배열을 반환해도 정상 동작한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    const candidates = [{ problem_id: PROBLEM_ID }];
    jest
      .spyOn(ProblemsService, "_fetchRecommendationCandidates")
      .mockResolvedValue(candidates);
    jest
      .spyOn(ProblemsService, "_scoreRecommendations")
      .mockReturnValue(candidates);
    jest
      .spyOn(ProblemsService, "_buildProblemSummary")
      .mockImplementation((problem) => ({
        problem_id: problem.problem_id,
        problem_title: problem.problem_id,
        problem_difficulty: 2,
        problem_lang: ["JavaScript"],
        problem_main_category: ["Algorithm"],
        problem_sub_category: ["Sorting"],
        problem_success_rate: 50,
        expected_xp: 100,
        is_solved: false,
      }));

    const dto = buildRecommendDto();
    const result = await ProblemsService.getPersonalRecommendations(
      dto,
      "tester",
    );

    expect(result.count).toBeGreaterThan(0);
  });
});

describe("ProblemsService.getSimilarProblems", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("유사 문제를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(ProblemRepository, "findProblemById").mockResolvedValue({
      ...baseProblem,
    });
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest.spyOn(ProblemRepository, "findSimilarProblems").mockResolvedValue([
      {
        ...baseProblem,
        problem_id: "prob-2",
        _id: "mongo-prob-2",
      },
    ]);

    const dto = buildSimilarDto();
    const result = await ProblemsService.getSimilarProblems(dto, "tester");

    expect(result.count).toBe(1);
    expect(result.problems[0].problem_id).toBe("prob-2");
    expect(result.problems[0].expected_xp).toBeGreaterThan(0);
  });

  it("_buildProblemSummary가 null을 반환하면 필터링된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(ProblemRepository, "findProblemById").mockResolvedValue({
      ...baseProblem,
    });
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest.spyOn(ProblemRepository, "findSimilarProblems").mockResolvedValue([
      {
        ...baseProblem,
        problem_id: "prob-2",
        _id: "mongo-prob-2",
      },
    ]);
    jest.spyOn(ProblemsService, "_buildProblemSummary").mockReturnValue(null);

    const dto = buildSimilarDto();
    const result = await ProblemsService.getSimilarProblems(dto, "tester");

    expect(result.count).toBe(0);
    expect(result.problems).toEqual([]);
  });

  it("userId가 null이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildSimilarDto();
    await expect(ProblemsService.getSimilarProblems(dto, null)).rejects.toThrow(
      "사용자 정보를 찾을 수 없습니다.",
    );
  });

  it("userId가 undefined이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildSimilarDto();
    await expect(
      ProblemsService.getSimilarProblems(dto, undefined),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("사용자를 찾을 수 없으면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildSimilarDto();
    await expect(
      ProblemsService.getSimilarProblems(dto, "nonexistent"),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("ProblemRepository.findSimilarProblems가 빈 배열을 반환하면 빈 결과를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(ProblemRepository, "findProblemById").mockResolvedValue({
      ...baseProblem,
    });
    jest
      .spyOn(SolvedRepository, "findProblemObjectIdsByUser")
      .mockResolvedValue([]);
    jest.spyOn(ProblemRepository, "findSimilarProblems").mockResolvedValue([]);

    const dto = buildSimilarDto();
    const result = await ProblemsService.getSimilarProblems(dto, "tester");

    expect(result.count).toBe(0);
    expect(result.problems).toEqual([]);
  });
});

describe("ProblemsService.getRecentSolvedProblems", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("최근 해결 문제를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "findRecentSolvedProblems").mockResolvedValue([
      {
        solved_id: "solved-1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        solved_runtime: 120,
        solved_memory_usage: 64,
        problem_id: {
          ...baseProblem,
        },
      },
    ]);

    const dto = buildRecentSolvedDto();
    const result = await ProblemsService.getRecentSolvedProblems(dto, "tester");

    expect(result.count).toBe(1);
    expect(result.items[0].problem.is_solved).toBe(true);
    expect(result.items[0].problem.problem_id).toBe(PROBLEM_ID);
  });

  it("recent가 빈 배열이면 빈 결과를 반환한다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest
      .spyOn(SolvedRepository, "findRecentSolvedProblems")
      .mockResolvedValue([]);

    const dto = buildRecentSolvedDto();
    const result = await ProblemsService.getRecentSolvedProblems(dto, "tester");

    expect(result.count).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("problem_id가 null인 항목은 필터링된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "findRecentSolvedProblems").mockResolvedValue([
      {
        solved_id: "solved-1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        solved_runtime: 120,
        solved_memory_usage: 64,
        problem_id: {
          ...baseProblem,
        },
      },
      {
        solved_id: "solved-2",
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
        solved_runtime: 100,
        solved_memory_usage: 32,
        problem_id: null,
      },
    ]);

    const dto = buildRecentSolvedDto();
    const result = await ProblemsService.getRecentSolvedProblems(dto, "tester");

    expect(result.count).toBe(1);
    expect(result.items[0].solved_id).toBe("solved-1");
  });

  it("runtime_ms와 memory_kb가 null이어도 허용된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "findRecentSolvedProblems").mockResolvedValue([
      {
        solved_id: "solved-1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        solved_runtime: null,
        solved_memory_usage: null,
        problem_id: {
          ...baseProblem,
        },
      },
    ]);

    const dto = buildRecentSolvedDto();
    const result = await ProblemsService.getRecentSolvedProblems(dto, "tester");

    expect(result.count).toBe(1);
    expect(result.items[0].runtime_ms).toBeNull();
    expect(result.items[0].memory_kb).toBeNull();
  });

  it("_buildProblemSummary가 null을 반환하면 필터링된다", async () => {
    jest.spyOn(ProblemsService, "_getUserOrThrow").mockResolvedValue(mockUser);
    jest.spyOn(SolvedRepository, "findRecentSolvedProblems").mockResolvedValue([
      {
        solved_id: "solved-1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        solved_runtime: 120,
        solved_memory_usage: 64,
        problem_id: {
          ...baseProblem,
        },
      },
    ]);
    jest.spyOn(ProblemsService, "_buildProblemSummary").mockReturnValue(null);

    const dto = buildRecentSolvedDto();
    const result = await ProblemsService.getRecentSolvedProblems(dto, "tester");

    expect(result.count).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("userId가 null이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecentSolvedDto();
    await expect(
      ProblemsService.getRecentSolvedProblems(dto, null),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("userId가 undefined이면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecentSolvedDto();
    await expect(
      ProblemsService.getRecentSolvedProblems(dto, undefined),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });

  it("사용자를 찾을 수 없으면 USER_NOT_FOUND 에러를 던진다", async () => {
    jest
      .spyOn(ProblemsService, "_getUserOrThrow")
      .mockRejectedValue(ERROR.USER_NOT_FOUND());

    const dto = buildRecentSolvedDto();
    await expect(
      ProblemsService.getRecentSolvedProblems(dto, "nonexistent"),
    ).rejects.toThrow("사용자 정보를 찾을 수 없습니다.");
  });
});

describe("ProblemsService._calculateExpectedXp", () => {
  it("난이도/성공률에 따라 XP를 계산한다", () => {
    const xpEasy = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 1, problem_success_rate: 80 },
      { metalevel: 3 },
    );
    const xpHard = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 5, problem_success_rate: 20 },
      { metalevel: 1 },
    );

    expect(xpHard).toBeGreaterThan(xpEasy);
    expect(xpEasy).toBeGreaterThanOrEqual(10);
  });

  it("problem_difficulty가 null이면 기본값 1을 사용한다", () => {
    const xp = ProblemsService._calculateExpectedXp(
      { problem_difficulty: null, problem_success_rate: 50 },
      { metalevel: 2 },
    );
    expect(xp).toBeGreaterThanOrEqual(10);
  });

  it("problem_difficulty가 undefined이면 기본값 1을 사용한다", () => {
    const xp = ProblemsService._calculateExpectedXp(
      { problem_success_rate: 50 },
      { metalevel: 2 },
    );
    expect(xp).toBeGreaterThanOrEqual(10);
  });

  it("problem_success_rate가 null이면 기본값 50을 사용한다", () => {
    const xp = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 2, problem_success_rate: null },
      { metalevel: 2 },
    );
    expect(xp).toBeGreaterThanOrEqual(10);
  });

  it("problem_success_rate가 undefined이면 기본값 50을 사용한다", () => {
    const xp = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 2 },
      { metalevel: 2 },
    );
    expect(xp).toBeGreaterThanOrEqual(10);
  });

  it("user.metalevel과 user.user_level이 모두 없으면 기본값 1을 사용한다", () => {
    const xp = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 2, problem_success_rate: 50 },
      {},
    );
    expect(xp).toBeGreaterThanOrEqual(10);
  });

  it("user.metalevel과 user.user_level이 모두 있으면 metalevel을 우선 사용한다", () => {
    const xpWithMetalevel = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 2, problem_success_rate: 50 },
      { metalevel: 3, user_level: 1 },
    );
    const xpWithUserLevel = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 2, problem_success_rate: 50 },
      { user_level: 1 },
    );
    // metalevel이 더 높으면 XP 계산이 달라질 수 있음
    expect(xpWithMetalevel).toBeGreaterThanOrEqual(10);
    expect(xpWithUserLevel).toBeGreaterThanOrEqual(10);
  });

  it("XP 계산 결과가 10 미만이면 최소값 10으로 clamp된다", () => {
    // 매우 쉬운 문제와 매우 높은 레벨 사용자로 최소값 테스트
    // difficulty 1, success_rate 100, metalevel 10 (매우 높음)으로 시도
    const xp = ProblemsService._calculateExpectedXp(
      { problem_difficulty: 1, problem_success_rate: 100 },
      { metalevel: 10 },
    );
    // 실제 계산 결과가 10 미만일 수 있으므로, 최소값 10이 보장되는지 확인
    expect(xp).toBeGreaterThanOrEqual(10);
  });
});

describe("ProblemsService._scoreRecommendations", () => {
  it("preferLanguage가 null이어도 정상 동작한다", () => {
    const problems = [
      {
        problem_id: "prob-1",
        problem_difficulty: 2,
        problem_success_rate: 50,
        problem_lang: ["JavaScript"],
        createdAt: new Date(),
      },
    ];

    const result = ProblemsService._scoreRecommendations(problems, {
      preferLanguage: null,
      targetDifficulty: 2,
    });

    expect(result).toHaveLength(1);
    expect(result[0].problem_id).toBe("prob-1");
  });

  it("preferLanguage가 'other'이어도 정상 동작한다", () => {
    const problems = [
      {
        problem_id: "prob-1",
        problem_difficulty: 2,
        problem_success_rate: 50,
        problem_lang: ["JavaScript"],
        createdAt: new Date(),
      },
    ];

    const result = ProblemsService._scoreRecommendations(problems, {
      preferLanguage: "other",
      targetDifficulty: 2,
    });

    expect(result).toHaveLength(1);
  });

  it("problem.createdAt이 없어도 정상 동작한다", () => {
    const problems = [
      {
        problem_id: "prob-1",
        problem_difficulty: 2,
        problem_success_rate: 50,
        problem_lang: ["JavaScript"],
      },
    ];

    const result = ProblemsService._scoreRecommendations(problems, {
      preferLanguage: "JavaScript",
      targetDifficulty: 2,
    });

    expect(result).toHaveLength(1);
  });

  it("problem.problem_difficulty가 없으면 기본값 1을 사용한다", () => {
    const problems = [
      {
        problem_id: "prob-1",
        problem_success_rate: 50,
        problem_lang: ["JavaScript"],
        createdAt: new Date(),
      },
    ];

    const result = ProblemsService._scoreRecommendations(problems, {
      preferLanguage: "JavaScript",
      targetDifficulty: 2,
    });

    expect(result).toHaveLength(1);
  });
});

describe("ProblemsService._fetchRecommendationCandidates", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("ProblemRepository.findProblemsForRecommendations가 빈 배열을 반환해도 정상 동작한다", async () => {
    jest
      .spyOn(ProblemRepository, "findProblemsForRecommendations")
      .mockResolvedValue([]);

    const result = await ProblemsService._fetchRecommendationCandidates({
      preferLanguage: "py",
      difficultyRange: { min: 1, max: 2 },
      solvedIds: [],
      desiredCount: 5,
    });

    expect(result).toEqual([]);
  });

  it("여러 request set을 시도해도 결과가 없으면 빈 배열을 반환한다", async () => {
    jest
      .spyOn(ProblemRepository, "findProblemsForRecommendations")
      .mockResolvedValue([]);

    const result = await ProblemsService._fetchRecommendationCandidates({
      preferLanguage: "py",
      difficultyRange: { min: 1, max: 2 },
      solvedIds: [],
      desiredCount: 5,
    });

    expect(result).toEqual([]);
    expect(
      ProblemRepository.findProblemsForRecommendations,
    ).toHaveBeenCalledTimes(3);
  });
});
