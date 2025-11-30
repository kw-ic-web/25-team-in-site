import { hintSocketHandler } from "./hint.socket.handler.js";
import { evaluateSocketHandler } from "./evaluate.socket.handler.js";
import { sendErrorMessage } from "../utils/socket.utils.js";

export const setupSocketHandlers = (wss) => {
  wss.on("connection", async (ws, req) => {
    const { userId } = req;

    let path;
    try {
      const host = req.headers.host;
      path = new URL(req.url, `http://${host}`).pathname;
    } catch (error) {
      console.error(`[WebSocket] Failed to parse URL: ${req.url}`, error);
      ws.close(1008, "Invalid URL");
      return;
    }

    ws.userId = userId;

    switch (path) {
      case "/hint":
        hintSocketHandler(wss, ws);
        break;
      case "/evaluate":
        evaluateSocketHandler(wss, ws);
        break;
      default:
        ws.close(1008, "Invalid path");
        break;
    }

    // 연결 해제 이벤트
    ws.on("close", (code, reason) => {
      // TODO: 연결 해제 이벤트 처리 (유저 세션 삭제 등)
    });

    // 에러 이벤트
    ws.on("error", (error) => {
      sendErrorMessage(ws, error.message || "Internal server error");
      // TODO: 에러 이벤트 처리 (유저 세션 삭제 등)
    });

    // 연결 유지(핑퐁)
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  // 연결 유지를 위한 핑/퐁 인터벌
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        //TODO: 유저 세션 삭제 처리
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
};
