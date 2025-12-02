import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const parseAndValidateMessage = jest.fn();
const sendErrorMessage = jest.fn();
const generateHint = jest.fn();
const registerWebSocket = jest.fn();
const unregisterWebSocket = jest.fn();

jest.unstable_mockModule("../../../src/utils/socket.utils.js", () => ({
  parseAndValidateMessage,
  sendErrorMessage,
}));

jest.unstable_mockModule("../../../src/service/hint.service.js", () => ({
  HintService: {
    generateHint,
    registerWebSocket,
    unregisterWebSocket,
  },
}));

const { hintSocketHandler } = await import(
  "../../../src/sockets/hint.socket.handler.js"
);

describe("hintSocketHandler", () => {
  let mockWs;
  let mockWss;

  beforeEach(() => {
    jest.clearAllMocks();

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
    hintSocketHandler(mockWss, mockWs);

    expect(registerWebSocket).toHaveBeenCalledWith(mockWs, "test-user");
    expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  describe("hint:request 메시지 처리", () => {
    it("hint:request 메시지를 처리해 HintService를 호출한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      hintSocketHandler(mockWss, mockWs);

      const messageData = Buffer.from(
        JSON.stringify({
          type: "hint:request",
          problemId: "prob-1",
          language: "js",
        }),
      );

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "hint:request",
          problemId: "prob-1",
          language: "js",
        },
      });

      await messageHandler(messageData);

      expect(generateHint).toHaveBeenCalledWith(
        mockWs,
        "test-user",
        "prob-1",
        "js",
      );
    });

    it("problemId가 없으면 에러 메시지를 전송한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      hintSocketHandler(mockWss, mockWs);

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "hint:request",
        },
      });

      await messageHandler(Buffer.from(JSON.stringify({ type: "hint:request" })));

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "'problemId' is required for hint:request",
      );
      expect(generateHint).not.toHaveBeenCalled();
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

      hintSocketHandler(mockWss, mockWs);

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

      hintSocketHandler(mockWss, mockWs);

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

      hintSocketHandler(mockWss, mockWs);

      parseAndValidateMessage.mockReturnValue({
        message: { type: "hint:request", problemId: "prob-err" },
      });

      const sendError = new Error("Send failed");
      generateHint.mockImplementation(() => {
        throw sendError;
      });

      await messageHandler(Buffer.from(JSON.stringify({ type: "hint:request" })));

      expect(sendErrorMessage).toHaveBeenCalledWith(mockWs, "Send failed");
    });

    it("에러 메시지가 없으면 기본 메시지를 사용한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      hintSocketHandler(mockWss, mockWs);

      const errorWithoutMessage = new Error('');
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

