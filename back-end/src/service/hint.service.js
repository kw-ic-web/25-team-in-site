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
  _PROCESSING_USERS: new Map(), // userId -> true (진행 중인 힌트 생성 요청 추적)
  _WS_MAP: new Map(), // userId -> ws (WebSocket 연결 저장)


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
    // 이미 진행 중인 요청이 있으면 abort 이벤트 전송
    if (this._PROCESSING_USERS.has(userId)) {
      sendMessage(ws, { type: "hint:abort", success: false });
      return;
    }

    try {
      // 진행 중 상태로 표시
      this._PROCESSING_USERS.set(userId, true);

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
      sendMessage(ws, {
        type: "hint:response",
        success: true,
        data: { level: validatedHint.level, hint: validatedHint.body },
      });
    } finally {
      // 완료 후 진행 중 상태 해제
      this._PROCESSING_USERS.delete(userId);
    }
  },

  _clearInterval(userId) {
    const existingInterval = this._HINT_INTERVAL_MAP.get(userId);
    if (existingInterval) {
      clearInterval(existingInterval);
      this._HINT_INTERVAL_MAP.delete(userId);
    }
  },

  _startInterval(userId) {
    // 기존 인터벌이 있으면 제거
    this._clearInterval(userId);

    // 새 인터벌 시작
    const interval = setInterval(() => {
      const ws = this._WS_MAP.get(userId);
      if (ws && ws.readyState === 1) {
        // WebSocket이 열려있으면 hint 필요한지 묻기
        sendMessage(ws, {
          type: "hint:prompt",
          success: true,
          message: "힌트가 필요하신가요?",
        });
      } else {
        // WebSocket이 없거나 닫혀있으면 인터벌 제거
        this._clearInterval(userId);
      }
    }, this._HINT_INTERVAL_MS);

    this._HINT_INTERVAL_MAP.set(userId, interval);
  },

  registerWebSocket(ws, userId) {
    this._WS_MAP.set(userId, ws);
    // WebSocket 등록 시 인터벌 시작
    this._startInterval(userId);
  },

  unregisterWebSocket(userId) {
    this._clearInterval(userId);
    this._WS_MAP.delete(userId);
    this._PROCESSING_USERS.delete(userId);
  },

  async newCodeCommitted(userId) {
    // 코드 업데이트 시 인터벌 초기화
    this._startInterval(userId);
  },
};
