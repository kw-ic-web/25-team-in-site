import { ZodError } from "zod";
import {
  parseAndValidateMessage,
  sendErrorMessage,
  sendMessage,
} from "../utils/socket.utils.js";
import { EvaluateCodeRequestDto } from "../dto/evaluation/evaluateCode.request.dto.js";
import { EvaluationService } from "../service/evaluation.service.js";
import { ERROR } from "../mapper/error.mapper.js";

const SOCKET_EVALUATE_DTO = EvaluateCodeRequestDto.omit({ mode: true });

const MESSAGE_CONFIG = {
  "evaluate:test-request": {
    caseType: "test",
    responseType: "evaluate:test-response",
  },
  "evaluate:submission-request": {
    caseType: "submission",
    responseType: "evaluate:submission-response",
  },
};

export const evaluateSocketHandler = (wss, ws) => {
  ws.on("message", async (data) => {
    try {
      const { message } = parseAndValidateMessage(data);
      const config = MESSAGE_CONFIG[message.type];
      if (!config) {
        sendErrorMessage(
          ws,
          `Unknown message type: ${message.type}`,
        );
        return;
      }

      const payload = SOCKET_EVALUATE_DTO.parse(message.data ?? {});
      const result = await EvaluationService.evaluateCode({
        userId: ws.userId,
        problemId: payload.problemId,
        code: payload.code,
        language: payload.language,
        caseType: config.caseType,
      });

      sendMessage(ws, {
        type: config.responseType,
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues?.[0];
        const errorCode = issue?.message;
        const mappedMessage =
          (errorCode &&
            typeof ERROR[errorCode] === "function" &&
            ERROR[errorCode]().message) ||
          errorCode ||
          "Invalid payload";

        sendErrorMessage(ws, mappedMessage);
        return;
      }

      sendErrorMessage(
        ws,
        error.message || "Internal server error",
      );
    }
  });
};
