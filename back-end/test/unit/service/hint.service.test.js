import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { HintSchema } from "../../../src/utils/validation/hint.schema.js";

const mockOpenAIClient = {
  responses: {
    parse: jest.fn(),
  },
};

const mockSendMessage = jest.fn();
const mockSendErrorMessage = jest.fn();
const mockGetHintSession = jest.fn();
const mockCreateOrResetHintSession = jest.fn();
const mockUpdateHintSessionLanguage = jest.fn();
const mockAddHintContextItem = jest.fn();
const mockUpdateHintSessionCached = jest.fn();
const mockFindProblemById = jest.fn();

jest.unstable_mockModule("../../../src/infrastructure/openaiClient.infra.js", () => ({
  openaiClient: mockOpenAIClient,
}));

jest.unstable_mockModule("../../../src/utils/socket.utils.js", () => ({
  sendMessage: mockSendMessage,
  sendErrorMessage: mockSendErrorMessage,
}));

jest.unstable_mockModule("../../../src/repository/sessionStore.repository.js", () => ({
  sessionStoreRepository: {
    getHintSession: mockGetHintSession,
    createOrResetHintSession: mockCreateOrResetHintSession,
    updateHintSessionLanguage: mockUpdateHintSessionLanguage,
    addHintContextItem: mockAddHintContextItem,
    updateHintSessionCached: mockUpdateHintSessionCached,
  },
}));

jest.unstable_mockModule("../../../src/repository/problem.repository.js", () => ({
  ProblemRepository: {
    findProblemById: mockFindProblemById,
  },
}));

const { HintService } = await import("../../../src/service/hint.service.js");
const { DEFAULT_PROMPT, VALIDATED_PROMPT } = await import(
  "../../../src/constants/openai.constants.js"
);

describe("HintService", () => {
  let mockWs;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWs = {
      readyState: 1,
      send: jest.fn(),
    };

    // 기본 문제 정보 모킹
    mockFindProblemById.mockResolvedValue({
      problem_id: "problem-1",
      problem_title: "Test Problem",
      problem_body: "문제 설명입니다.",
      problem_test_cases: ["test case 1", "test case 2"],
    });

    // HintService의 내부 상태 초기화
    HintService._HINT_INTERVAL_MAP.clear();
    HintService._PROCESSING_USERS.clear();
    HintService._WS_MAP.clear();
    HintService._DIFF_CACHED_MAP.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("_makeContext", () => {
    it("hint session이 없으면 기본 컨텍스트를 반환한다", async () => {
      mockGetHintSession.mockResolvedValue(null);

      const context = await HintService._makeContext("user-1", "problem-1");

      expect(context).toHaveLength(3);
      expect(context[0]).toEqual({ role: "system", content: DEFAULT_PROMPT });
      expect(context[1].content).toContain("문제 설명:");
      expect(context[1].content).toContain("문제 설명입니다.");
      expect(context[1].content).toContain("테스트 케이스:");
      expect(context[1].content).toContain("test case 1");
      expect(context[1].content).toContain("test case 2");
      expect(context[2]).toEqual({
        role: "user",
        content: "내 상황에 맞게 힌트를 제공해주세요.",
      });
      expect(mockFindProblemById).toHaveBeenCalledWith("problem-1");
      expect(mockGetHintSession).toHaveBeenCalledWith("user-1", "problem-1");
    });

    it("hint session이 있으면 히스토리와 현재 코드를 포함한 컨텍스트를 반환한다", async () => {
      const mockHintSession = {
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "function solve() { return 1; }",
          diff: "",
          cached: "",
        },
        context: [
          {
            hintCnt: 1,
            code: "function solve() { }",
            hint: "함수를 완성해보세요",
            cursor: [0, 0],
          },
          {
            hintCnt: 2,
            code: "function solve() { return; }",
            hint: "반환값을 추가해보세요",
            cursor: [0, 0],
          },
        ],
      };

      mockGetHintSession.mockResolvedValue(mockHintSession);

      const context = await HintService._makeContext("user-1", "problem-1");

      expect(context).toHaveLength(5);
      expect(context[0]).toEqual({ role: "system", content: DEFAULT_PROMPT });
      expect(context[1].content).toContain("문제 설명:");
      expect(context[1].content).toContain("문제 설명입니다.");
      expect(context[1].content).toContain("테스트 케이스:");
      expect(context[2]).toEqual({
        role: "user",
        content:
          '힌트 #1: 코드는 "function solve() { }"였고, 힌트는 "함수를 완성해보세요"를 제공했습니다.',
      });
      expect(context[3]).toEqual({
        role: "user",
        content:
          '힌트 #2: 코드는 "function solve() { return; }"였고, 힌트는 "반환값을 추가해보세요"를 제공했습니다.',
      });
      expect(context[4].content).toContain("현재 코드는 다음과 같습니다:");
      expect(context[4].content).toContain("```javascript");
      expect(context[4].content).toContain("function solve() { return 1; }");
    });

    it("context가 비어있으면 현재 코드만 포함한다", async () => {
      const mockHintSession = {
        userId: "user-1",
        problemId: "problem-1",
        language: "python",
        code: {
          current: "def solve(): pass",
          diff: "",
          cached: "",
        },
        context: [],
      };

      mockGetHintSession.mockResolvedValue(mockHintSession);

      const context = await HintService._makeContext("user-1", "problem-1");

      expect(context).toHaveLength(3);
      expect(context[0]).toEqual({ role: "system", content: DEFAULT_PROMPT });
      expect(context[1].content).toContain("문제 설명:");
      expect(context[1].content).toContain("문제 설명입니다.");
      expect(context[2].content).toContain("현재 코드는 다음과 같습니다:");
      expect(context[2].content).toContain("```python");
      expect(context[2].content).toContain("def solve(): pass");
    });
  });

  describe("_getChatCompletion", () => {
    it("OpenAI API를 호출하고 메시지 내용을 반환한다", async () => {
      const mockContexts = [
        { role: "system", content: "system prompt" },
        { role: "user", content: "user message" },
      ];
      // OpenAI responses.parse는 completion 객체를 반환하고, completion.output_parsed가 파싱된 결과
      const mockParsedResult = {
        level: 1,
        body: "generated hint",
      };
      const mockResponse = {
        output_parsed: mockParsedResult,
      };

      mockOpenAIClient.responses.parse.mockResolvedValue(mockResponse);

      const result = await HintService._getChatCompletion(
        mockContexts,
        HintSchema,
        "hint description",
      );

      expect(result).toEqual(mockParsedResult);
      expect(mockOpenAIClient.responses.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-5.1-codex",
          input: mockContexts,
        }),
      );
    });

    it("OpenAI API 에러 발생 시 에러를 전파한다", async () => {
      const apiError = new Error("API Error");
      mockOpenAIClient.responses.parse.mockRejectedValue(apiError);

      await expect(
        HintService._getChatCompletion([], HintSchema, "hint"),
      ).rejects.toThrow("API Error");
    });

    it("모델을 지정하면 해당 모델을 사용한다", async () => {
      const mockParsedResult = {
        level: 1,
        body: "hint",
      };
      const mockResponse = {
        output_parsed: mockParsedResult,
      };
      mockOpenAIClient.responses.parse.mockResolvedValue(mockResponse);

      const result = await HintService._getChatCompletion(
        [],
        HintSchema,
        "hint",
        "gpt-5.1-mini",
      );

      expect(result).toEqual(mockParsedResult);
      expect(mockOpenAIClient.responses.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-5.1-mini",
        }),
      );
    });
  });

  describe("generateHint", () => {
    it("problemId가 없으면 에러 메시지를 전송한다", async () => {
      await HintService.generateHint(mockWs, "user-1", "");

      expect(mockSendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:error",
        success: false,
        message: "problemId is required for hint generation",
      });
      expect(mockGetHintSession).not.toHaveBeenCalled();
    });

    it("이미 진행 중인 요청이 있으면 abort 이벤트를 전송한다", async () => {
      HintService._PROCESSING_USERS.set("user-1:problem-1", true);

      await HintService.generateHint(mockWs, "user-1", "problem-1");

      expect(mockSendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:abort",
        success: false,
      });
      expect(mockGetHintSession).not.toHaveBeenCalled();
    });

    it("세션이 없으면 새로 생성하고 힌트를 생성한다", async () => {
      mockGetHintSession.mockResolvedValue(null);
      mockCreateOrResetHintSession.mockResolvedValue({
        userId: "user-1",
        problemId: "problem-1",
        language: "js",
        code: { current: "", diff: "", cached: "" },
        context: [],
      });

      // OpenAI responses.parse는 completion 객체를 반환하고, completion.output_parsed가 파싱된 결과
      const mockHint = { level: 1, body: "힌트 내용" };
      const mockValidatedHint = { level: 1, body: "검증된 힌트" };

      mockOpenAIClient.responses.parse
        .mockResolvedValueOnce({ output_parsed: mockHint })
        .mockResolvedValueOnce({ output_parsed: mockValidatedHint });

      mockGetHintSession.mockResolvedValueOnce(null).mockResolvedValueOnce({
        userId: "user-1",
        problemId: "problem-1",
        language: "js",
        code: { current: "", diff: "", cached: "" },
        context: [],
      });

      await HintService.generateHint(mockWs, "user-1", "problem-1", "js");

      expect(mockCreateOrResetHintSession).toHaveBeenCalledWith(
        "user-1",
        "problem-1",
        "js",
      );
      expect(mockSendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:committed",
        success: true,
      });
      expect(mockAddHintContextItem).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:response",
        success: true,
        data: { level: 1, hint: "검증된 힌트" },
      });
      expect(HintService._PROCESSING_USERS.has("user-1:problem-1")).toBe(false);
    });

    it("problemId가 다르면 세션을 초기화한다", async () => {
      const existingSession = {
        userId: "user-1",
        problemId: "problem-1",
        language: "js",
        code: { current: "", diff: "", cached: "" },
        context: [],
      };

      mockGetHintSession
        .mockResolvedValueOnce(existingSession)
        .mockResolvedValueOnce({
          ...existingSession,
          problemId: "problem-2",
        });

      const mockHint = { level: 1, body: "힌트" };
      const mockValidatedHint = { level: 1, body: "검증된 힌트" };

      mockOpenAIClient.responses.parse
        .mockResolvedValueOnce({ output_parsed: mockHint })
        .mockResolvedValueOnce({ output_parsed: mockValidatedHint });

      await HintService.generateHint(mockWs, "user-1", "problem-2", "js");

      expect(mockCreateOrResetHintSession).toHaveBeenCalledWith(
        "user-1",
        "problem-2",
        "js",
      );
    });

    it("언어가 변경되면 세션 언어를 업데이트한다", async () => {
      const existingSession = {
        userId: "user-1",
        problemId: "problem-1",
        language: "js",
        code: { current: "", diff: "", cached: "" },
        context: [],
      };

      mockGetHintSession
        .mockResolvedValueOnce(existingSession)
        .mockResolvedValueOnce({
          ...existingSession,
          language: "python",
        });

      const mockHint = { level: 1, body: "힌트" };
      const mockValidatedHint = { level: 1, body: "검증된 힌트" };

      mockOpenAIClient.responses.parse
        .mockResolvedValueOnce({ output_parsed: mockHint })
        .mockResolvedValueOnce({ output_parsed: mockValidatedHint });

      await HintService.generateHint(mockWs, "user-1", "problem-1", "python");

      expect(mockUpdateHintSessionLanguage).toHaveBeenCalledWith(
        "user-1",
        "problem-1",
        "python",
      );
      expect(mockCreateOrResetHintSession).not.toHaveBeenCalled();
    });

    it("에러 발생 시 진행 중 상태를 해제한다", async () => {
      // generateHint는 여러 번 getHintSession을 호출하므로 첫 번째 호출에서 에러 발생
      mockGetHintSession.mockRejectedValueOnce(new Error("Database error"));

      await HintService.generateHint(mockWs, "user-1", "problem-1");

      expect(HintService._PROCESSING_USERS.has("user-1:problem-1")).toBe(false);
    });

    it("힌트 생성 후 context에 힌트를 추가한다", async () => {
      const existingSession = {
        userId: "user-1",
        problemId: "problem-1",
        language: "js",
        code: { current: "const x = 1;", diff: "", cached: "" },
        context: [
          { hintCnt: 1, code: "const x = 0;", hint: "이전 힌트", cursor: [0, 0] },
        ],
      };

      // 첫 번째 호출: 기존 세션 확인
      // 두 번째 호출: _makeContext 내부에서 호출
      // 세 번째 호출: 힌트 추가 전 세션 가져오기
      mockGetHintSession
        .mockResolvedValueOnce(existingSession)
        .mockResolvedValueOnce(existingSession)
        .mockResolvedValueOnce(existingSession);

      const mockHint = { level: 2, body: "새 힌트" };
      const mockValidatedHint = { level: 2, body: "검증된 새 힌트" };

      mockOpenAIClient.responses.parse
        .mockResolvedValueOnce({ output_parsed: mockHint })
        .mockResolvedValueOnce({ output_parsed: mockValidatedHint });

      await HintService.generateHint(mockWs, "user-1", "problem-1");

      // existingContext.length가 1이므로 hintCnt는 1 + 1 = 2
      // currentCode는 existingSession의 code.current인 "const x = 1;"
      expect(mockAddHintContextItem).toHaveBeenCalledWith("user-1", "problem-1", {
        hintCnt: 2,
        code: "const x = 1;",
        hint: "검증된 새 힌트",
        cursor: [0, 0],
      });
    });
  });

  describe("registerWebSocket", () => {
    it("WebSocket을 등록한다", () => {
      HintService.registerWebSocket(mockWs, "user-1");

      expect(HintService._WS_MAP.get("user-1")).toBe(mockWs);
      // WebSocket 등록 시에는 인터벌을 시작하지 않음
      expect(HintService._HINT_INTERVAL_MAP.size).toBe(0);
    });
  });

  describe("unregisterWebSocket", () => {
    it("WebSocket과 해당 유저의 모든 문제에 대한 인터벌과 진행 중 상태를 제거한다", () => {
      HintService._WS_MAP.set("user-1", mockWs);
      HintService._HINT_INTERVAL_MAP.set("user-1:problem-1", setInterval(() => {}, 1000));
      HintService._HINT_INTERVAL_MAP.set("user-1:problem-2", setInterval(() => {}, 1000));
      HintService._PROCESSING_USERS.set("user-1:problem-1", true);
      HintService._PROCESSING_USERS.set("user-1:problem-2", true);
      HintService._HINT_INTERVAL_MAP.set("user-2:problem-1", setInterval(() => {}, 1000)); // 다른 유저

      HintService.unregisterWebSocket("user-1");

      expect(HintService._WS_MAP.has("user-1")).toBe(false);
      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(false);
      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-2")).toBe(false);
      expect(HintService._PROCESSING_USERS.has("user-1:problem-1")).toBe(false);
      expect(HintService._PROCESSING_USERS.has("user-1:problem-2")).toBe(false);
      // 다른 유저의 인터벌은 유지되어야 함
      expect(HintService._HINT_INTERVAL_MAP.has("user-2:problem-1")).toBe(true);
    });
  });

  describe("newCodeCommitted", () => {
    it("인터벌이 없으면 시작하고 diff를 추적한다", async () => {
      HintService._WS_MAP.set("user-1", mockWs);
      mockGetHintSession.mockResolvedValue({
        userId: "user-1",
        problemId: "problem-1",
        code: { current: "code", diff: "diff1", cached: "cached" },
      });

      await HintService.newCodeCommitted("user-1", "problem-1");

      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(true);
      expect(HintService._DIFF_CACHED_MAP.get("user-1:problem-1")).toBe("diff1");
    });

    it("인터벌이 있으면 diff만 업데이트한다", async () => {
      HintService._WS_MAP.set("user-1", mockWs);
      const oldInterval = setInterval(() => {}, 1000);
      HintService._HINT_INTERVAL_MAP.set("user-1:problem-1", oldInterval);
      mockGetHintSession.mockResolvedValue({
        userId: "user-1",
        problemId: "problem-1",
        code: { current: "code", diff: "diff2", cached: "cached" },
      });

      await HintService.newCodeCommitted("user-1", "problem-1");

      // 인터벌은 유지되고 diff만 업데이트
      expect(HintService._HINT_INTERVAL_MAP.get("user-1:problem-1")).toBe(oldInterval);
      expect(HintService._DIFF_CACHED_MAP.get("user-1:problem-1")).toBe("diff2");
    });
  });

  describe("_clearInterval", () => {
    it("존재하는 인터벌을 제거한다", () => {
      const interval = setInterval(() => {}, 1000);
      HintService._HINT_INTERVAL_MAP.set("user-1:problem-1", interval);

      HintService._clearInterval("user-1", "problem-1");

      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(false);
    });

    it("인터벌이 없으면 아무것도 하지 않는다", () => {
      expect(() => HintService._clearInterval("user-1", "problem-1")).not.toThrow();
    });
  });

  describe("_startInterval", () => {
    it("기존 인터벌을 제거하고 새 인터벌을 시작한다", () => {
      HintService._WS_MAP.set("user-1", mockWs);
      const oldInterval = setInterval(() => {}, 1000);
      HintService._HINT_INTERVAL_MAP.set("user-1:problem-1", oldInterval);

      HintService._startInterval("user-1", "problem-1");

      expect(HintService._HINT_INTERVAL_MAP.get("user-1:problem-1")).not.toBe(oldInterval);
      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(true);
    });

    it("3분 동안 diff가 변경되지 않으면 hint:prompt를 전송하고 인터벌을 삭제한다", async () => {
      HintService._WS_MAP.set("user-1", mockWs);
      const testDiff = "test diff";
      HintService._DIFF_CACHED_MAP.set("user-1:problem-1", testDiff);
      mockGetHintSession.mockResolvedValue({
        userId: "user-1",
        problemId: "problem-1",
        code: { current: "code", diff: testDiff, cached: "cached" },
      });

      HintService._startInterval("user-1", "problem-1");

      // 3분 경과
      jest.advanceTimersByTime(HintService._HINT_INTERVAL_MS);
      
      // async 콜백이 완전히 실행되도록 대기 (여러 번 tick)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }

      expect(mockGetHintSession).toHaveBeenCalledWith("user-1", "problem-1");
      expect(mockSendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:prompt",
        success: true,
        message: "힌트가 필요하신가요?",
        problemId: "problem-1",
      });
      // 인터벌이 삭제되었는지 확인
      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(false);
    });

    it("diff가 변경되면 hint:prompt를 전송하지 않고 계속 모니터링한다", async () => {
      HintService._WS_MAP.set("user-1", mockWs);
      const oldDiff = "old diff";
      HintService._DIFF_CACHED_MAP.set("user-1:problem-1", oldDiff);
      mockGetHintSession.mockResolvedValue({
        userId: "user-1",
        problemId: "problem-1",
        code: { current: "code", diff: "new diff", cached: "cached" },
      });

      HintService._startInterval("user-1", "problem-1");

      // 3분 경과
      jest.advanceTimersByTime(HintService._HINT_INTERVAL_MS);
      
      // async 콜백이 완전히 실행되도록 대기 (여러 번 tick)
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }

      // hint:prompt가 전송되지 않아야 함
      expect(mockSendMessage).not.toHaveBeenCalledWith(mockWs, {
        type: "hint:prompt",
        success: true,
        message: "힌트가 필요하신가요?",
        problemId: "problem-1",
      });
      // 인터벌은 유지되어야 함
      expect(HintService._HINT_INTERVAL_MAP.has("user-1:problem-1")).toBe(true);
      // diff가 업데이트되었는지 확인
      expect(HintService._DIFF_CACHED_MAP.get("user-1:problem-1")).toBe("new diff");
    });
  });
});

