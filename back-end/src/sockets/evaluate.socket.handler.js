import {
  parseAndValidateMessage,
  sendErrorMessage,
  sendMessage,
} from "../utils/socket.utils.js";

export const evaluateSocketHandler = (wss, ws) => {
  ws.on("message", async (data) => {
    try {
      const { message } = parseAndValidateMessage(data);
      if (message.type === "evaluate:test-request") {
        // TODO: 처리 로직 구현

        const response = {
          type: "evaluate:test-response",
          success: true,
          data: {
            result: "test passed",
          },
        };
        sendMessage(ws, response);
      } else if (message.type === "evaluate:submission-request") {
        // TODO: 처리 로직 구현

        const response = {
          type: "evaluate:submission-response",
          success: true,
          data: {
            result: "submission passed",
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
