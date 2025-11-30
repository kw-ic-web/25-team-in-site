import { jest } from "@jest/globals";
import { UserCodeService } from "../../../../src/service/userCode.service.js";
import { SolvedRepository } from "../../../../src/repository/solved.repository.js";
import { ProblemRepository } from "../../../../src/repository/problem.repository.js";
import { OpenAIService } from "../../../../src/service/openai.service.js";
import { Solved } from "../../../../src/entity/solved.entity.js";
import { ERROR } from "../../../../src/mapper/error.mapper.js";
import { storeModule } from "../../../../src/infrastructure/store/store.module.js";

jest.mock("../../../../src/repository/solved.repository.js");
jest.mock("../../../../src/repository/problem.repository.js");
jest.mock("../../../../src/service/openai.service.js");
jest.mock("../../../../src/entity/solved.entity.js");
jest.mock("../../../../src/infrastructure/store/store.module.js", () => ({
    storeModule: {
        resolve: jest.fn(),
    },
    KEY_VALUE_STORE: Symbol("KEY_VALUE_STORE"),
}));

describe("UserCodeService", () => {
    let mockStore;

    beforeEach(() => {
        mockStore = {
            update: jest.fn(),
        };
        storeModule.resolve.mockReturnValue(mockStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("saveCode", () => {
        it("should save new code and history to store when no previous record exists", async () => {
            const userId = "user1";
            const problemId = "prob1";
            const dto = { code: "new code", language: "javascript" };
            const problem = { _id: "probObjectId" };

            ProblemRepository.findProblemById.mockResolvedValue(problem);
            SolvedRepository.findByUserIdAndProblemId.mockResolvedValue(null);
            Solved.mockImplementation(() => ({
                solved_code: "",
                language: "",
            }));

            const result = await UserCodeService.saveCode(userId, problemId, dto);

            expect(result).toEqual({ success: true });
            expect(SolvedRepository.save).toHaveBeenCalled();
            expect(mockStore.update).toHaveBeenCalledWith(
                `code_history:${userId}:${problemId}`,
                expect.any(Function)
            );
        });

        it("should update existing code and save history to store", async () => {
            const userId = "user1";
            const problemId = "prob1";
            const dto = { code: "updated code", language: "javascript" };
            const problem = { _id: "probObjectId" };
            const existingSolved = {
                solved_code: "old code",
                language: "javascript",
            };

            ProblemRepository.findProblemById.mockResolvedValue(problem);
            SolvedRepository.findByUserIdAndProblemId.mockResolvedValue(existingSolved);

            const result = await UserCodeService.saveCode(userId, problemId, dto);

            expect(result).toEqual({ success: true });
            expect(existingSolved.solved_code).toBe("updated code");
            expect(SolvedRepository.save).toHaveBeenCalledWith(existingSolved);
            expect(mockStore.update).toHaveBeenCalledWith(
                `code_history:${userId}:${problemId}`,
                expect.any(Function)
            );
        });

        it("should throw error if problem not found", async () => {
            ProblemRepository.findProblemById.mockResolvedValue(null);

            await expect(
                UserCodeService.saveCode("user1", "prob1", {})
            ).rejects.toThrow(ERROR.FAIL_TO_GET_PROB_DETAIL());
        });
    });

    describe("getHint", () => {
        it("should return hint from OpenAI", async () => {
            const userId = "user1";
            const problemId = "prob1";
            const dto = { code: "code", language: "javascript" };
            const problem = {
                problem_title: "Title",
                problem_body: "Body",
            };

            ProblemRepository.findProblemById.mockResolvedValue(problem);
            OpenAIService.getChatCompletion.mockResolvedValue("Hint message");

            const result = await UserCodeService.getHint(userId, problemId, dto);

            expect(result).toEqual({ hint: "Hint message" });
            expect(OpenAIService.getChatCompletion).toHaveBeenCalled();
        });

        it("should throw error if problem not found", async () => {
            ProblemRepository.findProblemById.mockResolvedValue(null);

            await expect(
                UserCodeService.getHint("user1", "prob1", {})
            ).rejects.toThrow(ERROR.FAIL_TO_GET_PROB_DETAIL());
        });
    });
});
