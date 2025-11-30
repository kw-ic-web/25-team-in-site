import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const parseAndValidateMessage = jest.fn();
const sendMessage = jest.fn();
const sendErrorMessage = jest.fn();

jest.unstable_mockModule("../../../src/utils/socket.utils.js", () => ({
  parseAndValidateMessage,
  sendMessage,
  sendErrorMessage,
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

    expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  describe("hint:request 메시지 처리", () => {
    it("hint:request 메시지를 받으면 hint:response를 전송한다", async () => {
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
          data: { cursorPosition: [1, 2] },
        }),
      );

      parseAndValidateMessage.mockReturnValue({
        message: {
          type: "hint:request",
          data: { cursorPosition: [1, 2] },
        },
      });

      await messageHandler(messageData);

      expect(sendMessage).toHaveBeenCalledWith(mockWs, {
        type: "hint:response",
        success: true,
        data: {
          level: 1,
          hint: "hint ready",
        },
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
        message: { type: "hint:request" },
      });

      const sendError = new Error("Send failed");
      sendMessage.mockImplementation(() => {
        throw sendError;
      });

      await messageHandler(Buffer.from(JSON.stringify({ type: "hint:request" })));

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Send failed",
      );
    });

    it("에러 메시지가 없으면 기본 메시지를 사용한다", async () => {
      let messageHandler;
      mockWs.on.mockImplementation((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      hintSocketHandler(mockWss, mockWs);

      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = undefined;
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

