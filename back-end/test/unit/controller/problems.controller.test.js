import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { v7 as uuidv7 } from "uuid";
import { problemsController } from "../../../src/controllers/problems.controller.js";

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const problemId = uuidv7();
const baseProblem = {
  problem_id: problemId,
  problem_title: "정렬 문제",
  problem_difficulty: 2,
  problem_lang: ["JavaScript"],
  problem_main_category: ["Algorithm"],
  problem_sub_category: ["Sorting"],
  problem_success_rate: 70,
  expected_xp: 120,
  is_solved: false,
};

describe("problemsController.getProblems", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: { page: "1", limit: "10" },
      services: {
        problems: {
          getProblemList: jest.fn().mockResolvedValue({
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    res = mockResponse();
    next = jest.fn();
  });

  it("문제 목록을 반환한다", async () => {
    await problemsController.getProblems(req, res, next);

    expect(req.services.problems.getProblemList).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pagination: {
        page: 1,
        limit: 10,
        total_count: 1,
        total_pages: 1,
      },
      problems: [
        {
          id: problemId,
          title: "정렬 문제",
          difficulty: 2,
          language: ["JavaScript"],
          main_category: ["Algorithm"],
          sub_category: ["Sorting"],
          success_rate: 70,
          expected_xp: 120,
          is_solved: false,
        },
      ],
    });
  });

  it("에러 발생 시 next로 전달한다", async () => {
    const error = new Error("boom");
    req.services.problems.getProblemList.mockRejectedValue(error);

    await problemsController.getProblems(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("DTO 검증 실패 시 서비스를 호출하지 않는다", async () => {
    req.query.limit = "0";

    await problemsController.getProblems(req, res, next);

    expect(req.services.problems.getProblemList).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.user가 없어도 정상 동작한다", async () => {
    req.user = undefined;

    await problemsController.getProblems(req, res, next);

    expect(req.services.problems.getProblemList).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("req.query가 완전히 비어있는 경우 모든 기본값을 사용한다", async () => {
    req.query = {};

    await problemsController.getProblems(req, res, next);

    expect(req.services.problems.getProblemList).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("req.query에 잘못된 타입의 값이 들어있으면 DTO 검증 실패한다", async () => {
    req.query = { page: "abc", limit: "10" };

    await problemsController.getProblems(req, res, next);

    expect(req.services.problems.getProblemList).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("problemsController.getProblemDetail", () => {
  it("문제 상세 정보를 반환한다", async () => {
    const req = {
      params: { id: problemId },
      services: {
        problems: {
          getProblemById: jest.fn().mockResolvedValue({
            problem: {
              problem_id: problemId,
              problem_title: "정렬 문제",
              problem_difficulty: 2,
              problem_lang: ["JavaScript"],
              problem_main_category: ["Algorithm"],
              problem_sub_category: ["Sorting"],
              problem_success_rate: 70,
              problem_body: "<p>본문</p>",
              problem_attachment_urls: [],
              problem_test_cases: ["1 2"],
              problem_time_limit: 1000,
              problem_memory_limit: 256,
            },
            expectedXp: 120,
            isSolved: true,
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getProblemDetail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: problemId,
        expected_xp: 120,
        is_solved: true,
      }),
    );
  });

  it("잘못된 문제 ID면 next를 호출한다", async () => {
    const req = {
      params: { id: "invalid-id" },
      services: {
        problems: {
          getProblemById: jest.fn(),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getProblemDetail(req, res, next);

    expect(req.services.problems.getProblemById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("서비스 에러 발생 시 next로 전달한다", async () => {
    const req = {
      params: { id: problemId },
      services: {
        problems: {
          getProblemById: jest
            .fn()
            .mockRejectedValue(new Error("service error")),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getProblemDetail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.user가 없어도 정상 동작한다", async () => {
    const req = {
      params: { id: problemId },
      services: {
        problems: {
          getProblemById: jest.fn().mockResolvedValue({
            problem: {
              problem_id: problemId,
              problem_title: "정렬 문제",
              problem_difficulty: 2,
              problem_lang: ["JavaScript"],
              problem_main_category: ["Algorithm"],
              problem_sub_category: ["Sorting"],
              problem_success_rate: 70,
              problem_body: "<p>본문</p>",
              problem_attachment_urls: [],
              problem_test_cases: ["1 2"],
              problem_time_limit: 1000,
              problem_memory_limit: 256,
            },
            expectedXp: 120,
            isSolved: false,
          }),
        },
      },
      user: undefined,
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getProblemDetail(req, res, next);

    expect(req.services.problems.getProblemById).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("req.params.id가 undefined인 경우 DTO 검증 실패한다", async () => {
    const req = {
      params: {},
      services: {
        problems: {
          getProblemById: jest.fn(),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getProblemDetail(req, res, next);

    expect(req.services.problems.getProblemById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("problemsController.getPersonalRecommendations", () => {
  it("개인 추천 목록을 반환한다", async () => {
    const req = {
      query: { limit: "2" },
      services: {
        problems: {
          getPersonalRecommendations: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getPersonalRecommendations(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      count: 1,
      problems: [
        {
          id: problemId,
          title: "정렬 문제",
          difficulty: 2,
          language: ["JavaScript"],
          main_category: ["Algorithm"],
          sub_category: ["Sorting"],
          success_rate: 70,
          expected_xp: 120,
          is_solved: false,
        },
      ],
    });
  });

  it("추천 DTO 검증 실패 시 next를 호출한다", async () => {
    const req = {
      query: { limit: "0" },
      services: {
        problems: {
          getPersonalRecommendations: jest.fn(),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getPersonalRecommendations(req, res, next);

    expect(
      req.services.problems.getPersonalRecommendations,
    ).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("서비스 에러 발생 시 next로 전달한다", async () => {
    const req = {
      query: { limit: "2" },
      services: {
        problems: {
          getPersonalRecommendations: jest
            .fn()
            .mockRejectedValue(new Error("service error")),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getPersonalRecommendations(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.user가 없어도 정상 동작한다", async () => {
    const req = {
      query: { limit: "2" },
      services: {
        problems: {
          getPersonalRecommendations: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: undefined,
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getPersonalRecommendations(req, res, next);

    expect(
      req.services.problems.getPersonalRecommendations,
    ).toHaveBeenCalledWith(expect.any(Object), undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("req.query가 완전히 비어있는 경우 기본값을 사용한다", async () => {
    const req = {
      query: {},
      services: {
        problems: {
          getPersonalRecommendations: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getPersonalRecommendations(req, res, next);

    expect(req.services.problems.getPersonalRecommendations).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("problemsController.getSimilarProblems", () => {
  it("유사 문제 목록을 반환한다", async () => {
    const req = {
      params: { id: problemId },
      query: { limit: "3" },
      services: {
        problems: {
          getSimilarProblems: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getSimilarProblems(req, res, next);

    expect(req.services.problems.getSimilarProblems).toHaveBeenCalledWith(
      { id: problemId, limit: 3 },
      "tester",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      count: 1,
      problems: [
        {
          id: problemId,
          title: "정렬 문제",
          difficulty: 2,
          language: ["JavaScript"],
          main_category: ["Algorithm"],
          sub_category: ["Sorting"],
          success_rate: 70,
          expected_xp: 120,
          is_solved: false,
        },
      ],
    });
  });

  it("유사 문제 DTO 검증 실패 시 next를 호출한다", async () => {
    const req = {
      params: { id: "invalid" },
      query: { limit: "3" },
      services: {
        problems: {
          getSimilarProblems: jest.fn(),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getSimilarProblems(req, res, next);

    expect(req.services.problems.getSimilarProblems).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("서비스 에러 발생 시 next로 전달한다", async () => {
    const req = {
      params: { id: problemId },
      query: { limit: "3" },
      services: {
        problems: {
          getSimilarProblems: jest
            .fn()
            .mockRejectedValue(new Error("service error")),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getSimilarProblems(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.user가 없어도 정상 동작한다", async () => {
    const req = {
      params: { id: problemId },
      query: { limit: "3" },
      services: {
        problems: {
          getSimilarProblems: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: undefined,
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getSimilarProblems(req, res, next);

    expect(req.services.problems.getSimilarProblems).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("req.query.limit이 없는 경우 기본값 5를 사용한다", async () => {
    const req = {
      params: { id: problemId },
      query: {},
      services: {
        problems: {
          getSimilarProblems: jest.fn().mockResolvedValue({
            count: 1,
            problems: [baseProblem],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getSimilarProblems(req, res, next);

    expect(req.services.problems.getSimilarProblems).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 }),
      "tester",
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("problemsController.getRecentSolvedProblems", () => {
  it("최근 해결 문제 목록을 반환한다", async () => {
    const req = {
      query: { limit: "5" },
      services: {
        problems: {
          getRecentSolvedProblems: jest.fn().mockResolvedValue({
            count: 1,
            items: [
              {
                solved_id: "solved-1",
                solved_at: new Date("2024-01-01T00:00:00.000Z"),
                runtime_ms: 100,
                memory_kb: 32,
                problem: baseProblem,
              },
            ],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      count: 1,
      items: [
        {
          solved_id: "solved-1",
          solved_at: new Date("2024-01-01T00:00:00.000Z").toISOString(),
          runtime_ms: 100,
          memory_kb: 32,
          problem: {
            id: problemId,
            title: "정렬 문제",
            difficulty: 2,
            language: ["JavaScript"],
            main_category: ["Algorithm"],
            sub_category: ["Sorting"],
            success_rate: 70,
            expected_xp: 120,
            is_solved: baseProblem.is_solved,
          },
        },
      ],
    });
  });

  it("최근 해결 DTO 검증 실패 시 next를 호출한다", async () => {
    const req = {
      query: { limit: "0" },
      services: {
        problems: {
          getRecentSolvedProblems: jest.fn(),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(
      req.services.problems.getRecentSolvedProblems,
    ).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.user가 없어도 정상 동작한다", async () => {
    const req = {
      query: { limit: "5" },
      services: {
        problems: {
          getRecentSolvedProblems: jest.fn().mockResolvedValue({
            count: 1,
            items: [
              {
                solved_id: "solved-1",
                solved_at: new Date("2024-01-01T00:00:00.000Z"),
                runtime_ms: 100,
                memory_kb: 32,
                problem: baseProblem,
              },
            ],
          }),
        },
      },
      user: undefined,
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(req.services.problems.getRecentSolvedProblems).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("solved_at이 Date가 아닌 경우 문자열로 그대로 반환한다", async () => {
    const req = {
      query: { limit: "5" },
      services: {
        problems: {
          getRecentSolvedProblems: jest.fn().mockResolvedValue({
            count: 1,
            items: [
              {
                solved_id: "solved-1",
                solved_at: "2024-01-01T00:00:00.000Z",
                runtime_ms: 100,
                memory_kb: 32,
                problem: baseProblem,
              },
            ],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      count: 1,
      items: [
        {
          solved_id: "solved-1",
          solved_at: "2024-01-01T00:00:00.000Z",
          runtime_ms: 100,
          memory_kb: 32,
          problem: expect.any(Object),
        },
      ],
    });
  });

  it("req.query가 완전히 비어있는 경우 기본값을 사용한다", async () => {
    const req = {
      query: {},
      services: {
        problems: {
          getRecentSolvedProblems: jest.fn().mockResolvedValue({
            count: 1,
            items: [
              {
                solved_id: "solved-1",
                solved_at: new Date("2024-01-01T00:00:00.000Z"),
                runtime_ms: 100,
                memory_kb: 32,
                problem: baseProblem,
              },
            ],
          }),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(req.services.problems.getRecentSolvedProblems).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("서비스 에러 발생 시 next로 전달한다", async () => {
    const req = {
      query: { limit: "5" },
      services: {
        problems: {
          getRecentSolvedProblems: jest
            .fn()
            .mockRejectedValue(new Error("service error")),
        },
      },
      user: { user_id: "tester" },
    };
    const res = mockResponse();
    const next = jest.fn();

    await problemsController.getRecentSolvedProblems(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
