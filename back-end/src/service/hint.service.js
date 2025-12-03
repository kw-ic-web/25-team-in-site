import { openaiClient } from "../infrastructure/openaiClient.infra.js";
import { zodTextFormat } from "openai/helpers/zod";
import {
  DEFAULT_PROMPT,
  VALIDATED_PROMPT,
  L5_FEEDBACK_PROMPT,
} from "../constants/openai.constants.js";
import { sendErrorMessage, sendMessage } from "../utils/socket.utils.js";
import { HintSchema, L5FeedbackSchema } from "../utils/validation/hint.schema.js";
import { sessionStoreRepository } from "../repository/sessionStore.repository.js";
import { ProblemRepository } from "../repository/problem.repository.js";

export const HintService = {
  _HINT_INTERVAL_MS: 1000 * 30, // 3분
  _HINT_INTERVAL_MAP: new Map(), // userId:problemId -> interval(callback)
  _PROCESSING_USERS: new Map(), // userId:problemId -> true (진행 중인 힌트 생성 요청 추적)
  _WS_MAP: new Map(), // userId -> ws (WebSocket 연결 저장)
  _DIFF_CACHED_MAP: new Map(), // userId:problemId -> 마지막 diff 값 (diff 변경 추적용)

  _makeKey(userId, problemId) {
    return `${userId}:${problemId}`;
  },

  _getResultMetric(results = [], field) {
    if (!Array.isArray(results) || !field) {
      return null;
    }
    let metric = null;
    for (const result of results) {
      const value = result?.[field];
      if (typeof value === "number" && Number.isFinite(value)) {
        metric = metric === null ? value : Math.max(metric, value);
      }
    }
    return metric;
  },

  _buildL5FeedbackContext({
    problem,
    evaluationSummary,
    language,
    sourceCode,
  }) {
    const totalCases = evaluationSummary?.totalCases ?? 0;
    const results = Array.isArray(evaluationSummary?.results)
      ? evaluationSummary.results
      : [];
    const passedCases = results.filter((result) => result?.isPassed).length;
    const score = evaluationSummary?.score ?? 0;
    const maxExecution = this._getResultMetric(
      evaluationSummary?.results,
      "executionTime",
    );
    const maxMemory = this._getResultMetric(
      evaluationSummary?.results,
      "memoryUsage",
    );
    const problemBody = problem?.problem_body ?? "";
    const codeSnippet = sourceCode ?? "";
    const categories = [
      problem?.problem_main_category,
      problem?.problem_sub_category,
    ]
      .filter(Boolean)
      .join(" / ");

    const formattedScore =
      typeof score === "number" ? score.toFixed(1) : String(score);
    const languageLabel = language || "unknown";

    return `
[문제 정보]
- 문제 ID: ${problem?.problem_id || problem?._id || "알 수 없음"}
- 제목: ${problem?.problem_title ?? "제목 정보 없음"}
- 난이도: ${problem?.problem_difficulty ?? "미정"}
- 카테고리: ${categories || "카테고리 정보 없음"}

[문제 설명 요약]
${problemBody || "문제 설명 데이터가 제공되지 않았습니다."}

[평가 요약]
- 테스트 케이스: 총 ${totalCases}개 / 통과 ${passedCases}개
- 점수: ${formattedScore}
- 실행 시간 제한: ${evaluationSummary?.timeLimitMs ?? "정보 없음"} ms
- 최대 실행 시간: ${maxExecution ?? "정보 없음"} ms
- 메모리 제한: ${evaluationSummary?.memoryLimitBytes ?? "정보 없음"} bytes
- 측정된 최대 메모리: ${maxMemory ?? "정보 없음"} bytes
- 사용 언어: ${languageLabel}

[제출 코드]
\`\`\`${languageLabel}
${codeSnippet || "/* 코드가 비어 있습니다. */"}
\`\`\`
`;
  },

  _formatL5FeedbackResponse(feedback) {
    if (!feedback) return null;

    const summaryLines = (feedback.keyPoints || []).map(
      (point, index) => `- 요약 ${index + 1}: ${point.trim()}`,
    );
    const trimmedReport = feedback.report?.trim() ?? "";

    return [...summaryLines, "", trimmedReport].join("\n").trim();
  },

  async _makeContext(userId, problemId) {
    // 문제 정보 가져오기
    const problem = await ProblemRepository.findProblemById(problemId);

    // 저장된 hint session 불러오기
    const hintSession = await sessionStoreRepository.getHintSession(
      userId,
      problemId,
    );

    // 시스템 프롬프트와 힌트 히스토리로 컨텍스트 구성
    const contexts = [{ role: "system", content: DEFAULT_PROMPT }];

    // 문제 정보 추가 (problem body와 testcase)
    if (problem) {
      let problemContent = `문제 설명:\n${problem.problem_body || ""}\n\n`;

      if (problem.problem_test_cases && problem.problem_test_cases.length > 0) {
        problemContent += `테스트 케이스:\n${problem.problem_test_cases.join("\n")}\n\n`;
      }

      contexts.push({
        role: "user",
        content: problemContent,
      });
    }

    if (!hintSession) {
      // hint session이 없으면 기본 컨텍스트 반환
      contexts.push({
        role: "user",
        content: "내 상황에 맞게 힌트를 제공해주세요.",
      });
      return contexts;
    }

    const { language, code, context } = hintSession;
    const currentCode = code.current || "";

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
        "Hint_to_deliver_to_the_user",
      );

      const validatedContext = [
        { role: "system", content: VALIDATED_PROMPT },
        { role: "user", content: hint.body || JSON.stringify(hint) },
      ];
      const validatedHint = await this._getChatCompletion(
        validatedContext,
        HintSchema,
        "A_hint_with_the_correct_code_removed",
        "gpt-5-mini",
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

      // 힌트 생성 시점의 코드를 cached로 업데이트 (다음 코드 저장 시 diff 생성용)
      await sessionStoreRepository.updateHintSessionCached(
        userId,
        problemId,
        currentCode,
      );

      // 힌트 사용 시 인터벌 다시 시작 (diff 검증 계속)
      // 인터벌이 없으면 시작 (_startInterval 내부에서 diff 초기화)
      if (!this._HINT_INTERVAL_MAP.has(key)) {
        await this._startInterval(userId, problemId);
      } else {
        // 인터벌이 이미 있으면 diff를 다시 초기화하여 새로운 추적 시작
        const hintSessionAfterUpdate = await sessionStoreRepository.getHintSession(
          userId,
          problemId,
        );
        const updatedDiff = hintSessionAfterUpdate?.code?.diff || "";
        this._DIFF_CACHED_MAP.set(key, updatedDiff);
      }

      sendMessage(ws, {
        type: "hint:response",
        success: true,
        data: { level: validatedHint.level, hint: validatedHint.body },
      });
    } catch (error) {
      console.error("HintService Error:", error);
      sendErrorMessage(ws, "힌트 생성 중 오류가 발생했습니다.");
    } finally {
      // 완료 후 진행 중 상태 해제
      this._PROCESSING_USERS.delete(key);
    }
  },

  async generateSolvedFeedback({
    userId,
    problem,
    evaluationSummary,
    language,
    sourceCode,
  }) {
    try {
      const context = this._buildL5FeedbackContext({
        problem,
        evaluationSummary,
        language,
        sourceCode,
      });

      const completion = await this._getChatCompletion(
        [
          { role: "system", content: L5_FEEDBACK_PROMPT },
          { role: "user", content: context },
        ],
        L5FeedbackSchema,
        "L5_feedback_report",
      );

      return this._formatL5FeedbackResponse(completion);
    } catch (error) {
      console.error("[HintService] Failed to generate L5 feedback", {
        userId,
        problemId: problem?._id || problem?.problem_id,
      }, error);
      return null;
    }
  },

  _clearInterval(userId, problemId) {
    const key = this._makeKey(userId, problemId);
    const existingInterval = this._HINT_INTERVAL_MAP.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
      this._HINT_INTERVAL_MAP.delete(key);
    }
    // diff_cached_map은 유지 (힌트 사용 시 다시 시작할 때 사용)
  },

  async _startInterval(userId, problemId) {
    const key = this._makeKey(userId, problemId);
    // 기존 인터벌이 있으면 제거
    this._clearInterval(userId, problemId);

    // 인터벌 시작 시점의 diff를 초기화 (3분 동안 변경되지 않았는지 확인하기 위해)
    const hintSession = await sessionStoreRepository.getHintSession(
      userId,
      problemId,
    );
    
    // hintSession이 없으면 인터벌을 시작하지 않음
    if (!hintSession) {
      return;
    }
    
    const initialDiff = hintSession.code?.diff || "";
    if (!this._DIFF_CACHED_MAP.has(key)) {
      this._DIFF_CACHED_MAP.set(key, initialDiff);
    }

    // 새 인터벌 시작 (3분마다 diff 확인)
    const interval = setInterval(async () => {
      try {
        const ws = this._WS_MAP.get(userId);
        if (!ws || ws.readyState !== 1) {
          // WebSocket이 없거나 닫혀있으면 인터벌 제거
          this._clearInterval(userId, problemId);
          return;
        }

        // 현재 diff 가져오기
        const currentHintSession = await sessionStoreRepository.getHintSession(
          userId,
          problemId,
        );
        const currentDiff = currentHintSession?.code?.diff || "";
        const cachedDiff = this._DIFF_CACHED_MAP.get(key) || "";

        // diff가 변경되지 않았으면 (3분 동안 동일)
        if (currentDiff === cachedDiff && currentDiff !== "") {
          // hint:prompt 전송
          sendMessage(ws, {
            type: "hint:prompt",
            success: true,
            message: "힌트가 필요하신가요?",
            problemId,
          });
          // 인터벌 삭제 (더 이상 보내지 않음)
          this._clearInterval(userId, problemId);
        } else if (currentDiff !== cachedDiff) {
          // diff가 변경되었으면 cached diff 업데이트하고 계속 모니터링
          this._DIFF_CACHED_MAP.set(key, currentDiff);
        }
      } catch (error) {
        console.error(
          `[HintService] Interval error for ${key}:`,
          error,
        );
        // 에러 발생 시 인터벌 제거 (무한 루프 방지)
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

    // diff_cached_map도 정리
    const diffKeysToDelete = [];
    for (const key of this._DIFF_CACHED_MAP.keys()) {
      if (key.startsWith(`${userId}:`)) {
        diffKeysToDelete.push(key);
      }
    }
    for (const key of diffKeysToDelete) {
      this._DIFF_CACHED_MAP.delete(key);
    }

    this._WS_MAP.delete(userId);
  },

  async newCodeCommitted(dto) {
    const { userId, problemId } = dto;
    // 코드 업데이트 시 diff 확인 및 인터벌 관리
    const key = this._makeKey(userId, problemId);

    // 인터벌이 없으면 시작 (diff 검증 시작)
    // _startInterval 내부에서 diff를 초기화하므로 여기서는 업데이트하지 않음
    if (!this._HINT_INTERVAL_MAP.has(key)) {
      await this._startInterval(userId, problemId);
      return;
    }

    // 인터벌이 이미 있으면 diff가 변경되었는지 확인하고 업데이트
    // 클라이언트가 10초마다 요청을 보내므로, 코드가 변경되지 않아도 호출될 수 있음
    // diff가 변경되었으면 캐시를 업데이트하여 인터벌의 3분 카운트를 리셋
    const hintSession = await sessionStoreRepository.getHintSession(
      userId,
      problemId,
    );
    const currentDiff = hintSession?.code?.diff || "";
    const cachedDiff = this._DIFF_CACHED_MAP.get(key) || "";
    
    if (currentDiff !== cachedDiff) {
      // diff가 변경되었으면 cached diff 업데이트 (인터벌 내부에서 3분 카운트 리셋)
      this._DIFF_CACHED_MAP.set(key, currentDiff);
    }
  },
};
