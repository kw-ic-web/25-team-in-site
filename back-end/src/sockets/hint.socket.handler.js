import {
  parseAndValidateMessage,
  sendErrorMessage,
} from "../utils/socket.utils.js";
import { HintService } from "../service/hint.service.js";

export const hintSocketHandler = (wss, ws) => {
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
};
