import {
  parseAndValidateMessage,
  sendErrorMessage,
} from "../utils/socket.utils.js";
import { HintService } from "../service/hint.service.js";

export const hintSocketHandler = (wss, ws) => {
  // WebSocket 연결 시 등록
  HintService.registerWebSocket(ws, ws.userId);

  ws.on("message", async (data) => {
    try {
      const { message } = parseAndValidateMessage(data);

      if (message.type === "hint:request") {
        await HintService.generateHint(ws, ws.userId);
      } else {
        sendErrorMessage(
          ws,
          `Unknown message type: ${message.type}`,
        );
      }
    } catch (error) {
      sendErrorMessage(
        ws,
        error.message || "Internal server error",
      );
    }
  });

  // 연결 해제 시 정리
  ws.on("close", () => {
    HintService.unregisterWebSocket(ws.userId);
  });

  ws.on("error", () => {
    HintService.unregisterWebSocket(ws.userId);
  });
};
