import { ERROR } from "../mapper/error.mapper.js";

export const parseAndValidateMessage = (data) => {
  let message;
  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw ERROR.INVALID_MESSAGE_FORMAT("Invalid JSON format");
    }
    throw ERROR.INVALID_MESSAGE_FORMAT("Failed to parse message");
  }

  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw ERROR.INVALID_MESSAGE_FORMAT("message must be an object");
  }

  if (!message.type || typeof message.type !== "string") {
    throw ERROR.INVALID_MESSAGE_FORMAT("'type' field is required");
  }
  return { message };
};

export const sendMessage = (ws, response) => {
  if (ws.readyState !== 1) {
    // WebSocket이 닫혀있으면 조용히 실패 (에러를 던지지 않음)
    return false;
  }

  try {
    ws.send(JSON.stringify(response));
    return true;
  } catch (error) {
    return false;
  }
};

export const sendErrorMessage = (ws, message) => {
  // WebSocket이 닫혀있으면 에러 메시지를 보낼 수 없으므로 조용히 실패
  if (ws.readyState !== 1) {
    return false;
  }

  return sendMessage(ws, {
    type: "error",
    success: false,
    message,
  });
};