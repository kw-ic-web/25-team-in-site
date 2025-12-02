import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

const hintSocketHandler = jest.fn();
const evaluateSocketHandler = jest.fn();
const sendErrorMessage = jest.fn();

jest.unstable_mockModule("../../../src/sockets/hint.socket.handler.js", () => ({
  hintSocketHandler,
}));

jest.unstable_mockModule(
  "../../../src/sockets/evaluate.socket.handler.js",
  () => ({
    evaluateSocketHandler,
  }),
);

jest.unstable_mockModule("../../../src/utils/socket.utils.js", () => ({
  sendErrorMessage,
}));

const { setupSocketHandlers } = await import("../../../src/sockets/index.js");

describe("setupSocketHandlers", () => {
  let mockWss;
  let mockWs;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWs = {
      on: jest.fn(),
      close: jest.fn(),
      terminate: jest.fn(),
      ping: jest.fn(),
      userId: "test-user",
      isAlive: true,
    };

    mockReq = {
      userId: "test-user",
      url: "/ws/hint",
      headers: {
        host: "localhost:3000",
      },
    };

    mockWss = {
      on: jest.fn(),
      clients: new Set([mockWs]),
    };

    intervalCleanup = null;
  });

  afterEach(() => {
    // wss의 close 핸들러 호출하여 인터벌 정리
    // setupSocketHandlers가 호출된 경우에만 close 핸들러가 등록됨
    const closeHandler = mockWss.on.mock.calls.find(
      (call) => call[0] === "close",
    )?.[1];
    if (closeHandler) {
      closeHandler();
    }
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  it("connection 이벤트 핸들러를 등록한다", () => {
    setupSocketHandlers(mockWss);
    expect(mockWss.on).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  describe("연결 처리", () => {
    it("유효한 /hint 경로로 연결 시 hintSocketHandler를 호출한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      expect(hintSocketHandler).toHaveBeenCalledWith(mockWss, mockWs);
      expect(mockWs.userId).toBe("test-user");
    });

    it("유효한 /evaluate 경로로 연결 시 evaluateSocketHandler를 호출한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      mockReq.url = "/ws/evaluate";
      connectionHandler(mockWs, mockReq);

      expect(evaluateSocketHandler).toHaveBeenCalledWith(mockWss, mockWs);
      expect(mockWs.userId).toBe("test-user");
    });

    it("유효하지 않은 경로로 연결 시 WebSocket을 닫는다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      mockReq.url = "/ws/invalid";
      connectionHandler(mockWs, mockReq);

      expect(mockWs.close).toHaveBeenCalledWith(1008, "Invalid path");
      expect(hintSocketHandler).not.toHaveBeenCalled();
      expect(evaluateSocketHandler).not.toHaveBeenCalled();
    });

    it("URL 파싱 실패 시 WebSocket을 닫는다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      // URL 생성자를 모킹하여 에러를 발생시킴
      const originalURL = global.URL;
      global.URL = jest.fn().mockImplementation(() => {
        throw new TypeError("Invalid URL");
      });

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();

      connectionHandler(mockWs, mockReq);

      expect(mockWs.close).toHaveBeenCalledWith(1008, "Invalid URL");
      expect(consoleErrorSpy).toHaveBeenCalled();

      // 원래 URL 복원
      global.URL = originalURL;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("이벤트 핸들러 등록", () => {
    it("close 이벤트 핸들러를 등록한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      expect(mockWs.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("error 이벤트 핸들러를 등록한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      expect(mockWs.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("pong 이벤트 핸들러를 등록한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      expect(mockWs.on).toHaveBeenCalledWith("pong", expect.any(Function));
    });

    it("error 이벤트 발생 시 sendErrorMessage를 호출한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      const errorHandler = mockWs.on.mock.calls.find(
        (call) => call[0] === "error",
      )[1];

      const error = new Error("Test error");
      errorHandler(error);

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Test error",
      );
    });

    it("error 이벤트에서 메시지가 없으면 기본 메시지를 사용한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      const errorHandler = mockWs.on.mock.calls.find(
        (call) => call[0] === "error",
      )[1];

      const error = new Error();
      error.message = undefined;
      errorHandler(error);

      expect(sendErrorMessage).toHaveBeenCalledWith(
        mockWs,
        "Internal server error",
      );
    });

    it("pong 이벤트 발생 시 isAlive를 true로 설정한다", () => {
      setupSocketHandlers(mockWss);
      const connectionHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "connection",
      )[1];

      connectionHandler(mockWs, mockReq);

      const pongHandler = mockWs.on.mock.calls.find(
        (call) => call[0] === "pong",
      )[1];

      mockWs.isAlive = false;
      pongHandler();

      expect(mockWs.isAlive).toBe(true);
    });
  });

  describe("연결 유지 (핑/퐁)", () => {
    it("인터벌이 설정되어 주기적으로 핑을 보낸다", () => {
      setupSocketHandlers(mockWss);

      jest.advanceTimersByTime(30000);

      expect(mockWs.isAlive).toBe(false);
      expect(mockWs.ping).toHaveBeenCalled();
    });

    it("isAlive가 false인 연결을 종료한다", () => {
      mockWs.isAlive = false;

      setupSocketHandlers(mockWss);

      jest.advanceTimersByTime(30000);

      expect(mockWs.terminate).toHaveBeenCalled();
      expect(mockWs.ping).not.toHaveBeenCalled();
    });

    it("연결이 닫히면 인터벌을 정리한다", () => {
      const result = setupSocketHandlers(mockWss);

      const closeHandler = mockWss.on.mock.calls.find(
        (call) => call[0] === "close",
      )[1];

      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      closeHandler();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  it("WebSocketServer를 반환한다", () => {
    const result = setupSocketHandlers(mockWss);

    expect(result).toBe(mockWss);
  });
});

