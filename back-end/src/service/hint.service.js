import { openaiClient } from "../infrastructure/openaiClient.infra.js";
import { zodTextFormat } from "openai/helpers/zod";
import {
  DEFAULT_PROMPT,
  VALIDATED_PROMPT,
} from "../constants/openai.constants.js";
import { sendErrorMessage, sendMessage } from "../utils/socket.utils.js";
import { HintSchema } from "../utils/validation/hint.schema.js";
import { sessionStoreRepository } from "../repository/sessionStore.repository.js";

export const HintService = {
  _HINT_INTERVAL_MS: 1000 * 60 * 3,
  _HINT_INTERVAL_MAP: new Map(), // userId:problemId -> interval(callback)
  _PROCESSING_USERS: new Map(), // userId:problemId -> true (진행 중인 힌트 생성 요청 추적)
  _WS_MAP: new Map(), // userId -> ws (WebSocket 연결 저장)

  _makeKey(userId, problemId) {
    return `${userId}:${problemId}`;
  },

  async _makeContext(userId, problemId) {
    // 저장된 hint session 불러오기
    const hintSession = await sessionStoreRepository.getHintSession(
      userId,
      problemId,
    );
    
    if (!hintSession) {
      // hint session이 없으면 기본 컨텍스트 반환
      return [
        { role: "system", content: DEFAULT_PROMPT },
        { role: "user", content: "내 상황에 맞게 힌트를 제공해주세요." },
      ];
    }

    const { language, code, context } = hintSession;
    const currentCode = code.current || "";

    // 시스템 프롬프트와 힌트 히스토리로 컨텍스트 구성
    const contexts = [{ role: "system", content: DEFAULT_PROMPT }];

    // 힌트 히스토리 추가
    for (const item of context) {
      contexts.push({
        role: "user",
        content: `힌트 #${item.hintCnt}: 코드는 "${item.code}"였고, 힌트는 "${item.hint}"를 제공했습니다.`,
      });
    }

    // 현재 상황 추가
    contexts.push({
      role: "user",
      content: `현재 코드는 다음과 같습니다:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n내 상황에 맞게 힌트를 제공해주세요.`,
    });

    return contexts;
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

      return completion.output_parsed;
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  },

  async generateHint(ws, userId, problemId, language = "") {
    if (!problemId) {
      sendMessage(ws, {
        type: "hint:error",
        success: false,
        message: "problemId is required for hint generation",
      });
      return;
    }
    const key = this._makeKey(userId, problemId);
    // 이미 진행 중인 요청이 있으면 abort 이벤트 전송
    if (this._PROCESSING_USERS.has(key)) {
      sendMessage(ws, { type: "hint:abort", success: false });
      return;
    }

    try {
      // 진행 중 상태로 표시
      this._PROCESSING_USERS.set(key, true);

      // problemId가 다르면 hintSession 초기화
      const existingSession = await sessionStoreRepository.getHintSession(
        userId,
        problemId,
      );
      if (existingSession && existingSession.problemId !== problemId) {
        // 새로운 문제로 변경되었으므로 세션 초기화
        await sessionStoreRepository.createOrResetHintSession(
          userId,
          problemId,
          language,
        );
      } else if (!existingSession) {
        // 세션이 없으면 새로 생성
        await sessionStoreRepository.createOrResetHintSession(
          userId,
          problemId,
          language,
        );
      } else if (language && existingSession.language !== language) {
        // 언어가 변경되었으면 업데이트
        await sessionStoreRepository.updateHintSessionLanguage(
          userId,
          problemId,
          language,
        );
      }

      sendMessage(ws, { type: "hint:committed", success: true });
      const context = await this._makeContext(userId, problemId);
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

      // 힌트 context 저장
      const hintSession = await sessionStoreRepository.getHintSession(
        userId,
        problemId,
      );
      const currentCode = hintSession?.code.current || "";
      const existingContext = hintSession?.context || [];
      const hintCnt = existingContext.length + 1;

      await sessionStoreRepository.addHintContextItem(
        userId,
        problemId,
        {
          hintCnt,
          code: currentCode,
          hint: validatedHint.body,
          cursor: [0, 0], // TODO: 실제 커서 위치 정보 추가
        },
      );

      sendMessage(ws, {
        type: "hint:response",
        success: true,
        data: { level: validatedHint.level, hint: validatedHint.body },
      });
    } catch (error) {
      sendErrorMessage(ws, "힌트 생성 중 오류가 발생했습니다.");
    } finally {
      // 완료 후 진행 중 상태 해제
      this._PROCESSING_USERS.delete(key);
    }
  },

  _clearInterval(userId, problemId) {
    const key = this._makeKey(userId, problemId);
    const existingInterval = this._HINT_INTERVAL_MAP.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
      this._HINT_INTERVAL_MAP.delete(key);
    }
  },

  _startInterval(userId, problemId) {
    const key = this._makeKey(userId, problemId);
    // 기존 인터벌이 있으면 제거
    this._clearInterval(userId, problemId);

    // 새 인터벌 시작
    const interval = setInterval(() => {
      const ws = this._WS_MAP.get(userId);
      if (ws && ws.readyState === 1) {
        // WebSocket이 열려있으면 hint 필요한지 묻기
        sendMessage(ws, {
          type: "hint:prompt",
          success: true,
          message: "힌트가 필요하신가요?",
          problemId,
        });
      } else {
        // WebSocket이 없거나 닫혀있으면 인터벌 제거
        this._clearInterval(userId, problemId);
      }
    }, this._HINT_INTERVAL_MS);

    this._HINT_INTERVAL_MAP.set(key, interval);
  },

  registerWebSocket(ws, userId) {
    this._WS_MAP.set(userId, ws);
    // WebSocket 등록 시에는 인터벌을 시작하지 않음
    // 코드 커밋 시에만 인터벌이 시작됨
  },

  unregisterWebSocket(userId) {
    // 해당 유저의 모든 문제에 대한 인터벌과 진행 상태 정리
    const keysToDelete = [];
    for (const key of this._HINT_INTERVAL_MAP.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      const interval = this._HINT_INTERVAL_MAP.get(key);
      if (interval) {
        clearInterval(interval);
      }
      this._HINT_INTERVAL_MAP.delete(key);
    }

    // 진행 중 상태도 정리
    const processingKeysToDelete = [];
    for (const key of this._PROCESSING_USERS.keys()) {
      if (key.startsWith(`${userId}:`)) {
        processingKeysToDelete.push(key);
      }
    }
    for (const key of processingKeysToDelete) {
      this._PROCESSING_USERS.delete(key);
    }

    this._WS_MAP.delete(userId);
  },

  async newCodeCommitted(userId, problemId) {
    // 코드 업데이트 시 해당 문제의 인터벌 초기화
    this._startInterval(userId, problemId);
  },
};
