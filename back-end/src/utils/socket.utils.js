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
    throw ERROR.FAILED_TO_SEND_MESSAGE(`WebSocket is not open (state: ${ws.readyState})`);
  }

  try {
    ws.send(JSON.stringify(response));
    return true;
  } catch (error) {
    throw ERROR.FAILED_TO_SEND_MESSAGE(error.message);
  }
};

export const sendErrorMessage = (ws, message) => {
  try {
    sendMessage(ws, {
      type: "error",
      success: false,
      message,
    });
  } catch (error) {
    throw ERROR.FAILED_TO_SEND_MESSAGE(error.message);
  }
};