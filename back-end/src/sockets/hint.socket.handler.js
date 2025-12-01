import {
  parseAndValidateMessage,
  sendErrorMessage,
  sendMessage,
} from "../utils/socket.utils.js";

export const hintSocketHandler = (wss, ws) => {
  ws.on("message", async (data) => {
    try {
      const { message } = parseAndValidateMessage(data);

      if (message.type === "hint:request") {
        // TODO: 힌트 요청 처리 로직 구현

        const response = {
          type: "hint:response",
          success: true,
          data: {
            level: 1,
            hint: "hint ready",
          },
        };
        sendMessage(ws, response);
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
