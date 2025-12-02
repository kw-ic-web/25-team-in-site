import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

const findProblemById = jest.fn();

jest.unstable_mockModule(
  "../../../src/repository/problem.repository.js",
  () => ({
    ProblemRepository: {
      findProblemById,
    },
  }),
);

const { EvaluationService } = await import(
  "../../../src/service/evaluation.service.js"
);

describe("EvaluationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("evaluateCode", () => {
    it("채점 케이스를 실행하고 결과를 반환한다", async () => {
      findProblemById.mockResolvedValue({
        problem_id: "prob-1",
        problem_evaluate_cases: ["1:::1", "2:::4"],
        problem_test_cases: ["3:::6"],
        problem_time_limit: "2초",
        problem_memory_limit: "256MB",
      });

      const executeSpy = jest
        .spyOn(EvaluationService, "_executeInDocker")
        .mockImplementation(async (code, runtime, input) => ({
          output: input === "2" ? "3" : "1",
          executionTime: 42,
          memoryUsage: null,
        }));

      const result = await EvaluationService.evaluateCode({
        userId: "user-1",
        problemId: "prob-1",
        code: "console.log()",
        language: "js",
      });

      expect(findProblemById).toHaveBeenCalledWith("prob-1");
      expect(executeSpy).toHaveBeenCalledTimes(2);
      expect(result.caseType).toBe("submission");
      expect(result.totalCases).toBe(2);
      expect(result.passed).toBe(false);
      expect(result.results[0].isPassed).toBe(true);
      expect(result.results[1].isPassed).toBe(false);
      expect(result.timeLimitMs).toBe(2000);
      expect(result.memoryLimitBytes).toBe(256 * 1024 * 1024);
    });

    it("테스트 케이스를 요청하면 공개 케이스를 사용한다", async () => {
      findProblemById.mockResolvedValue({
        problem_id: "prob-2",
        problem_evaluate_cases: [],
        problem_test_cases: ["5:::5"],
        problem_time_limit: 1500,
        problem_memory_limit: 64,
      });

      const executeSpy = jest
        .spyOn(EvaluationService, "_executeInDocker")
        .mockResolvedValue({
          output: "5",
          executionTime: 10,
          memoryUsage: null,
        });

      const result = await EvaluationService.evaluateCode({
        userId: "user-2",
        problemId: "prob-2",
        code: "print(input())",
        language: "py",
        caseType: "test",
      });

      expect(result.caseType).toBe("test");
      expect(result.totalCases).toBe(1);
      expect(result.passed).toBe(true);
      expect(result.timeLimitMs).toBe(1500);
      expect(result.memoryLimitBytes).toBe(64 * 1024 * 1024);
      expect(executeSpy).toHaveBeenCalledWith(
        "print(input())",
        expect.objectContaining({ image: "python:3.11-alpine" }),
        "5",
        expect.objectContaining({ timeLimitMs: 1500 }),
      );
    });
  });
});
