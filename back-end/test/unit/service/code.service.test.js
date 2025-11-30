import { jest } from "@jest/globals";
import { CodeService } from "../../../src/service/code.service.js";
import { sessionStoreRepository } from "../../../src/repository/sessionStore.repository.js";
import { Code } from "../../../src/entity/code.entity.js";

describe("CodeService", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("saveCode", () => {
        it("should save code with empty diff when cachedCode is not set", async () => {
            const userId = "user1";
            const code = "new code";
            const language = "javascript";

            jest.spyOn(sessionStoreRepository, "updateCode").mockImplementation(async (userId, updater) => {
                const codeEntity = Code.create({ userId });
                const updated = updater(codeEntity);
                return updated;
            });

            const result = await CodeService.saveCode(userId, code, language);

            expect(result).toEqual({ success: true });
            expect(sessionStoreRepository.updateCode).toHaveBeenCalledWith(
                userId,
                expect.any(Function)
            );

            // updater 함수가 올바르게 동작하는지 확인
            const updater = sessionStoreRepository.updateCode.mock.calls[0][1];
            const codeEntity = Code.create({ userId });
            const updated = updater(codeEntity);

            expect(updated.currentCode).toBe(code);
            expect(updated.language).toBe(language);
            expect(updated.diff).toBe(""); // cachedCode가 없으면 빈 문자열
        });

        it("should calculate diff when cachedCode exists and code is different", async () => {
            const userId = "user1";
            const cachedCode = "a";
            const newCode = "ab";
            const language = "javascript";

            jest.spyOn(sessionStoreRepository, "updateCode").mockImplementation(async (userId, updater) => {
                const codeEntity = Code.create({ userId, cachedCode });
                const updated = updater(codeEntity);
                return updated;
            });

            const result = await CodeService.saveCode(userId, newCode, language);

            expect(result).toEqual({ success: true });
            expect(sessionStoreRepository.updateCode).toHaveBeenCalledWith(
                userId,
                expect.any(Function)
            );

            // updater 함수가 올바르게 diff를 계산하는지 확인
            const updater = sessionStoreRepository.updateCode.mock.calls[0][1];
            const codeEntity = Code.create({ userId, cachedCode });
            const updated = updater(codeEntity);

            expect(updated.currentCode).toBe(newCode);
            expect(updated.language).toBe(language);
            expect(updated.diff).toContain("+"); // diff 패치 형식이 포함되어야 함
            expect(updated.diff).not.toBe("");
        });

        it("should update diff when cachedCode changes", async () => {
            const userId = "user1";
            const cachedCode = "ab";
            const newCode = "abc";
            const language = "javascript";

            jest.spyOn(sessionStoreRepository, "updateCode").mockImplementation(async (userId, updater) => {
                const codeEntity = Code.create({ userId, cachedCode });
                const updated = updater(codeEntity);
                return updated;
            });

            const result = await CodeService.saveCode(userId, newCode, language);

            expect(result).toEqual({ success: true });

            // updater 함수 확인
            const updater = sessionStoreRepository.updateCode.mock.calls[0][1];
            const codeEntity = Code.create({ userId, cachedCode });
            const updated = updater(codeEntity);

            expect(updated.currentCode).toBe(newCode);
            expect(updated.cachedCode).toBe(cachedCode); // cachedCode는 유지
            expect(updated.diff).toContain("+"); // diff가 계산되어야 함
        });

        it("should handle code deletion (cachedCode to shorter code)", async () => {
            const userId = "user1";
            const cachedCode = "abc";
            const newCode = "ab";
            const language = "javascript";

            jest.spyOn(sessionStoreRepository, "updateCode").mockImplementation(async (userId, updater) => {
                const codeEntity = Code.create({ userId, cachedCode });
                const updated = updater(codeEntity);
                return updated;
            });

            const result = await CodeService.saveCode(userId, newCode, language);

            expect(result).toEqual({ success: true });

            // updater 함수 확인
            const updater = sessionStoreRepository.updateCode.mock.calls[0][1];
            const codeEntity = Code.create({ userId, cachedCode });
            const updated = updater(codeEntity);

            expect(updated.currentCode).toBe(newCode);
            expect(updated.diff).toContain("-"); // 삭제된 내용이 diff에 포함되어야 함
        });

        it("should update existing Code correctly", async () => {
            const userId = "user1";
            const existingCode = "old code";
            const cachedCode = "a";
            const newCode = "ab";
            const language = "javascript";

            jest.spyOn(sessionStoreRepository, "updateCode").mockImplementation(async (userId, updater) => {
                const codeEntity = Code.create({ 
                    userId, 
                    currentCode: existingCode,
                    cachedCode 
                });
                const updated = updater(codeEntity);
                return updated;
            });

            const result = await CodeService.saveCode(userId, newCode, language);

            expect(result).toEqual({ success: true });

            // updater 함수 확인
            const updater = sessionStoreRepository.updateCode.mock.calls[0][1];
            const codeEntity = Code.create({ 
                userId, 
                currentCode: existingCode,
                cachedCode 
            });
            const updated = updater(codeEntity);

            expect(updated.currentCode).toBe(newCode);
            expect(updated.cachedCode).toBe(cachedCode);
            expect(updated.language).toBe(language);
            expect(updated.diff).not.toBe(""); // diff가 계산되어야 함
        });
    });
});
