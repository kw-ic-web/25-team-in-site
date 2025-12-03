const normalizeLineEndings = (value = "") => {
  return value.replace(/\r\n/g, "\n");
};

const normalizeCaseContent = (value) => {
  if (typeof value !== "string") {
    return value === undefined || value === null ? "" : String(value);
  }
  return normalizeLineEndings(value);
};

export const parseTestCase = (rawCase, index = 0) => {
  if (rawCase === null || rawCase === undefined) {
    return null;
  }

  if (typeof rawCase === "string") {
    // JSON 문자열 형식: "{\"input\":\"...\",\"output\":\"...\"}"
    const trimmed = rawCase.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(rawCase);
        if (typeof parsed === "object" && parsed !== null) {
          if (
            Object.prototype.hasOwnProperty.call(parsed, "input") &&
            Object.prototype.hasOwnProperty.call(parsed, "output")
          ) {
            return {
              id: index + 1,
              input: normalizeCaseContent(parsed.input),
              expectedOutput: normalizeCaseContent(parsed.output),
            };
          }
        }
      } catch {
        // JSON 파싱 실패 시 input만 있는 것으로 처리
      }
    }

    // JSON 형식이 아니거나 파싱 실패한 경우, 단순 문자열로 처리 (output 없음)
    return {
      id: index + 1,
      input: normalizeCaseContent(rawCase),
      expectedOutput: "",
    };
  }

  // 객체 형식
  if (typeof rawCase === "object") {
    let inputCandidate =
      rawCase.input ??
      rawCase.in ??
      rawCase.sample_input ??
      rawCase.case_input ??
      "";
    let outputCandidate =
      rawCase.output ??
      rawCase.expected ??
      rawCase.sample_output ??
      rawCase.case_output ??
      "";

    // inputCandidate가 JSON 문자열이고 그 안에 input과 output이 모두 있는 경우 처리
    if (
      typeof inputCandidate === "string" &&
      inputCandidate.trim().startsWith("{")
    ) {
      try {
        const parsed = JSON.parse(inputCandidate);
        if (typeof parsed === "object" && parsed !== null) {
          if (
            Object.prototype.hasOwnProperty.call(parsed, "input") &&
            Object.prototype.hasOwnProperty.call(parsed, "output")
          ) {
            inputCandidate = parsed.input;
            outputCandidate = parsed.output;
          }
        }
      } catch {
        // JSON 파싱 실패 시 기존 inputCandidate 사용
      }
    }

    return {
      id: rawCase.id ?? index + 1,
      input: normalizeCaseContent(inputCandidate),
      expectedOutput: normalizeCaseContent(outputCandidate),
    };
  }

  // 기타 타입은 문자열로 변환하여 input으로 사용
  return {
    id: index + 1,
    input: normalizeCaseContent(String(rawCase)),
    expectedOutput: "",
  };
};

/**
 * 테스트케이스 배열 파싱
 * @param {Array<string|object>} testCases - 파싱할 테스트케이스 배열
 * @returns {Array<{id: number, input: string, expectedOutput: string}>}
 */
export const parseTestCases = (testCases = []) => {
  if (!Array.isArray(testCases)) {
    return [];
  }

  return testCases
    .map((rawCase, index) => parseTestCase(rawCase, index))
    .filter(Boolean);
};

/**
 * 문제 객체에서 테스트케이스 파싱
 * @param {object} problem - 문제 객체
 * @param {string} caseType - 케이스 타입 ('test' | 'evaluate' | 'all')
 * @returns {{
 *   test?: Array<{id: number, input: string, expectedOutput: string}>,
 *   evaluate?: Array<{id: number, input: string, expectedOutput: string}>
 * }}
 */
export const parseProblemTestCases = (problem = {}, caseType = "all") => {
  const result = {};

  if (caseType === "test" || caseType === "all") {
    const testCases = Array.isArray(problem.problem_test_cases)
      ? problem.problem_test_cases
      : [];
    result.test = parseTestCases(testCases);
  }

  if (caseType === "evaluate" || caseType === "all") {
    const evaluateCases = Array.isArray(problem.problem_evaluate_cases)
      ? problem.problem_evaluate_cases
      : [];
    result.evaluate = parseTestCases(evaluateCases);
  }

  return result;
};

/**
 * 파싱된 케이스를 읽기 쉬운 형식으로 포맷팅
 * @param {Array<{id: number, input: string, expectedOutput: string}>} cases
 * @returns {string}
 */
export const formatParsedCases = (cases = []) => {
  if (!Array.isArray(cases) || cases.length === 0) {
    return "테스트케이스가 없습니다.";
  }

  return cases
    .map((testCase, index) => {
      const { id, input, expectedOutput } = testCase;
      const inputLines = input.split("\n").length;
      const outputLines = expectedOutput.split("\n").length;

      return `[케이스 #${id}]
입력 (${inputLines}줄):
${input || "(비어있음)"}
${expectedOutput ? `출력 (${outputLines}줄):\n${expectedOutput}` : "(출력 없음)"}
---`;
    })
    .join("\n\n");
};

