import { jest } from "@jest/globals";
import { CodeService } from "../../../src/service/code.service.js";
import { sessionStoreRepository } from "../../../src/repository/sessionStore.repository.js";

describe("CodeService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("saveCode", () => {
    it("문제 ID와 함께 코드를 저장한다", async () => {
      const userId = "user-1";
      const problemId = "problem-1";
      const code = "console.log('hello');";
      const language = "js";

      const updateSpy = jest
        .spyOn(sessionStoreRepository, "updateHintSessionCode")
        .mockResolvedValue({
          code: { current: code, diff: "", cached: "" },
        });

      const result = await CodeService.saveCode(
        userId,
        problemId,
        code,
        language,
      );

      expect(result).toEqual({ success: true });
      expect(updateSpy).toHaveBeenCalledWith(
        userId,
        problemId,
        code,
        language,
      );
    });

    it("repository에서 에러가 발생하면 throw한다", async () => {
      const error = new Error("redis error");
      jest
        .spyOn(sessionStoreRepository, "updateHintSessionCode")
        .mockRejectedValue(error);

      await expect(
        CodeService.saveCode("user-1", "problem-1", "code", "js"),
      ).rejects.toThrow(error);
    });
  });
});
