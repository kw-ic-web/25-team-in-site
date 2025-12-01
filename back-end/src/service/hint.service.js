import { openaiClient } from "../infrastructure/openaiClient.infra.js";
import { zodTextFormat } from "openai/helpers/zod";
import {
  DEFAULT_PROMPT,
  VALIDATED_PROMPT,
} from "../constants/openai.constants.js";
import { sendMessage } from "../utils/socket.utils.js";
import { HintSchema } from "../utils/validation/hint.schema.js";

export const HintService = {
  _HINT_INTERVAL_MS: 1000 * 60 * 3,
  _HINT_INTERVAL_MAP: new Map(), //userId -> interval(callback), 연결 해제시 해당 interval 정리하기!


  async _makeContext(userId) {
    //TODO: 세션에서 코드와 언어 및 문제 정보 가져오기
    return [
      { role: "system", content: DEFAULT_PROMPT },
      { role: "user", content: "내 상황에 맞게 힌트 제공해줘"}, // 임시 프롬프트
    ];
  },

  async _getChatCompletion(contexts, schema, schemaHint, model = "gpt-5.1-codex") {
    try {
      const completion = await openaiClient.responses.parse({
        model,
        input: contexts,
        text: {
          format: zodTextFormat(schema, schemaHint),
        },
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  },

  async generateHint(ws, userId) {
    sendMessage(ws, { type: "hint:committed", success: true });
    const context = await this._makeContext(userId);
    const hint = await this._getChatCompletion(
      context,
      HintSchema,
      "사용자에게 전달할 힌트",
    );

    const validatedContext = [
      { role: "system", content: VALIDATED_PROMPT },
      { role: "user", content: hint },
    ];
    const validatedHint = await this._getChatCompletion(
      validatedContext,
      HintSchema,
      "사용자에게 전달할 '정답 코드가 삭제된' 힌트(psudo code는 허용)",
      "gpt-5.1-mini",
    );
    sendMessage(ws, { type: "hint:response", success: true, data: {level: validatedHint.level, hint: validatedHint.body } });
  },

  async newCodeCommitted(userId) {
    //TODO: 새로운 커밋 들어왔을 때, interval 초기화
  }
};
