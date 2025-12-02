import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import config from "../../../src/config/env.config.js";

const WebSocketServer = jest.fn();
jest.unstable_mockModule("ws", () => ({
  WebSocketServer,
}));

const { initializeWebSocket } = await import(
  "../../../src/infrastructure/socket.js"
);

describe("initializeWebSocket", () => {
  let mockHttpServer;
  let mockWss;

  beforeEach(() => {
    jest.clearAllMocks();

    mockHttpServer = {
      listen: jest.fn(),
    };

    mockWss = {
      on: jest.fn(),
      clients: new Set(),
    };

    WebSocketServer.mockImplementation(() => mockWss);
  });

  it("WebSocketServer를 생성하고 반환한다", () => {
    const result = initializeWebSocket(mockHttpServer);

    expect(WebSocketServer).toHaveBeenCalledWith({
      server: mockHttpServer,
      verifyClient: expect.any(Function),
    });
    expect(result).toBe(mockWss);
  });

  describe("verifyClient - 인증 성공", () => {
    it("유효한 토큰이 있고 /ws로 시작하는 경로면 연결을 허용한다", () => {
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: `token=${jwt.sign({ user_id: "test-user" }, config.jwtSecret)}`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(true);
      expect(mockReq.userId).toBe("test-user");
    });

    it("여러 쿠키가 있을 때 token 쿠키를 찾아서 검증한다", () => {
      const token = jwt.sign({ user_id: "test-user" }, config.jwtSecret);
      const mockReq = {
        url: "/ws/evaluate",
        headers: {
          host: "localhost:20991",
          cookie: `session=abc123; token=${token}; other=value`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(true);
      expect(mockReq.userId).toBe("test-user");
    });
  });

  describe("verifyClient - 경로 검증", () => {
    it("/ws로 시작하지 않는 경로는 연결을 거부한다", () => {
      const mockReq = {
        url: "/invalid",
        headers: {
          host: "localhost:20991",
          cookie: `token=${jwt.sign({ user_id: "test-user" }, config.jwtSecret)}`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(
        false,
        404,
        "Not Found: WebSocket path must start with /ws",
      );
    });
  });

  describe("verifyClient - 인증 실패", () => {
    it("토큰이 없으면 연결을 거부한다", () => {
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: "session=abc123",
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(
        false,
        401,
        "Unauthorized: Invalid or missing token",
      );
    });

    it("쿠키가 없으면 연결을 거부한다", () => {
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(
        false,
        401,
        "Unauthorized: Invalid or missing token",
      );
    });

    it("유효하지 않은 토큰이면 연결을 거부한다", () => {
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: "token=invalid-token",
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(
        false,
        401,
        "Unauthorized: Invalid or missing token",
      );
    });

    it("만료된 토큰이면 연결을 거부한다", () => {
      const expiredToken = jwt.sign({ user_id: "test-user" }, config.jwtSecret, {
        expiresIn: "-1h",
      });
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: `token=${expiredToken}`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(
        false,
        401,
        "Unauthorized: Invalid or missing token",
      );
    });
  });

  describe("쿠키 파싱", () => {
    it("URL 인코딩된 쿠키 값을 디코딩한다", () => {
      const token = jwt.sign({ user_id: "test-user" }, config.jwtSecret);
      const encodedToken = encodeURIComponent(token);
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: `token=${encodedToken}`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(true);
      expect(mockReq.userId).toBe("test-user");
    });

    it("공백이 있는 쿠키를 올바르게 파싱한다", () => {
      const token = jwt.sign({ user_id: "test-user" }, config.jwtSecret);
      const mockReq = {
        url: "/ws/hint",
        headers: {
          host: "localhost:20991",
          cookie: `token=${token}; other=value`,
        },
      };

      initializeWebSocket(mockHttpServer);

      const verifyClient = WebSocketServer.mock.calls[0][0].verifyClient;
      const callback = jest.fn();

      verifyClient({ req: mockReq }, callback);

      expect(callback).toHaveBeenCalledWith(true);
      expect(mockReq.userId).toBe("test-user");
    });
  });
});

