import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const parseAndValidateMessage = jest.fn();
const sendMessage = jest.fn();
const sendErrorMessage = jest.fn();
const evaluateCode = jest.fn();

jest.unstable_mockModule("../../../src/utils/socket.utils.js", () => ({
  parseAndValidateMessage,
  sendMessage,
  sendErrorMessage,
}));

jest.unstable_mockModule(
  "../../../src/service/evaluation.service.js",
  () => ({
    EvaluationService: {
      evaluateCode,
    },
  }),
);

const { evaluateSocketHandler } = await import(
  "../../../src/sockets/evaluate.socket.handler.js"
);

describe("evaluateSocketHandler", () => {
  let mockWs;
  let mockWss;

  beforeEach(() => {
    jest.clearAllMocks();
    evaluateCode.mockReset();
    evaluateCode.mockResolvedValue({
      success: true,
      results: [],
    });

    mockWs = {
      on: jest.fn(),
      readyState: 1,
      send: jest.fn(),
      userId: "test-user",
    };

    mockWss = {
      clients: new Set([mockWs]),
    };

    parseAndValidateMessage.mockImplementation((data) => {
      const message = JSON.parse(data.toString());
      return { message };
    });
  });

  it("message 이벤트 핸들러를 등록한다", () => {
    evaluateSocketHandler(mockWss, mockWs);

    expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  describe("evaluate:test-request 메시지 처리", () => {
    it("evaluate:test-request 메시지를 받으면 evaluate:test-response를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      const payload = {
        problemId: "prob-1",
        code: "test code",
        language: "js",
      };

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "evaluate:test-request",
          data: payload,
        },
      });

      const evaluateResult = {
        success: true,
        caseType: "test",
        totalCases: 1,
        results: [],
      };
      evaluateCode.mockResolvedValue(evaluateResult);

      await messageHandler(
        Buffer.from(JSON.stringify({ type: "evaluate:test-request" })),
      );

      expect(evaluateCode).toHaveBeenCalledWith({
        userId: "test-user",
        problemId: "prob-1",
        code: "test code",
        language: "js",
        caseType: "test",
      });
      expect(sendMessage).toHaveBeenCalledWith(mockWs, {
        type: "evaluate:test-response",
        success: true,
        data: evaluateResult,
      });
    });
  });

  describe("evaluate:submission-request 메시지 처리", () => {
    it("evaluate:submission-request 메시지를 받으면 evaluate:submission-response를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      const payload = {
        problemId: "prob-2",
        code: "submission code",
        language: "py",
      };

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "evaluate:submission-request",
          data: payload,
        },
      });

      const evaluateResult = {
        success: true,
        caseType: "submission",
        totalCases: 3,
        results: [],
      };
      evaluateCode.mockResolvedValue(evaluateResult);

      await messageHandler(
        Buffer.from(JSON.stringify({ type: "evaluate:submission-request" })),
      );

      expect(evaluateCode).toHaveBeenCalledWith({
        userId: "test-user",
        problemId: "prob-2",
        code: "submission code",
        language: "py",
        caseType: "submission",
      });
      expect(sendMessage).toHaveBeenCalledWith(mockWs, {
        type: "evaluate:submission-response",
        success: true,
        data: evaluateResult,
      });
    });
  });

  describe("알 수 없는 메시지 타입 처리", () => {
    it("알 수 없는 메시지 타입이면 에러 메시지를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      const messageData = Buffer.from(
        JSON.stringify({ type: "unknown:type" }),
      );

      parseAndValidateMessage.mockReturnValue({
        message: { type: "unknown:type" },
      });

      await messageHandler(messageData);

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Unknown message type: unknown:type",
      );
    });
  });

  describe("에러 처리", () => {
    it("메시지 파싱 실패 시 에러 메시지를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      const parseError = new Error("Invalid message format");
      parseAndValidateMessage.mockImplementation(() => {
        throw parseError;
      });

      await messageHandler(Buffer.from("invalid"));

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Invalid message format",
      );
    });

    it("일반 에러 발생 시 에러 메시지를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "evaluate:test-request",
          data: {
            problemId: "prob-3",
            code: "console.log(1)",
            language: "js",
          },
        },
      });

      const sendError = new Error("Send failed");
      sendMessage.mockImplementation(() => {
        throw sendError;
      });

      await messageHandler(
        Buffer.from(JSON.stringify({ type: "evaluate:test-request" })),
      );

      expect(sendErrorMessage).toHaveBeenCalledWith(mockWs, "Send failed");
    });

    it("에러 메시지가 없으면 기본 메시지를 사용한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      evaluateSocketHandler(mockWss, mockWs);

      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;

      parseAndValidateMessage.mockImplementation(() => {
        throw errorWithoutMessage;
      });

      await messageHandler(Buffer.from("invalid"));

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Internal server error",
      );
    });
  });
});

