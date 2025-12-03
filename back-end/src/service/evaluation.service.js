import Docker from "dockerode";
import { performance } from "node:perf_hooks";
import { ProblemRepository } from "../repository/problem.repository.js";
import { SolvedRepository } from "../repository/solved.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { ERROR } from "../mapper/error.mapper.js";

// Docker 인스턴스를 지연 초기화 (lazy initialization)
let dockerInstance = null;
const getDocker = () => {
  if (!dockerInstance) {
    try {
      // macOS Docker Desktop: /var/run/docker.sock 또는 ~/.docker/run/docker.sock
      // Linux: /var/run/docker.sock

      const dockerOptions = {};

      if (process.env.DOCKER_SOCKET_PATH) {
        dockerOptions.socketPath = process.env.DOCKER_SOCKET_PATH;
      } else if (process.env.DOCKER_HOST) {
        // DOCKER_HOST가 unix:// 형식인 경우 socketPath로 변환
        const dockerHost = process.env.DOCKER_HOST;
        if (dockerHost.startsWith("unix://")) {
          dockerOptions.socketPath = dockerHost.replace("unix://", "");
        }
      }

      dockerInstance = new Docker(dockerOptions);
    } catch (error) {
      console.error("[EvaluationService] Failed to initialize Docker:", error);
      throw error;
    }
  }
  return dockerInstance;
};

const DOCKER_PURGE_LOG_PREFIX = "[EvaluationService] Docker purge";
const SOLVED_LOG_PREFIX = "[EvaluationService] Solved record";
const DOCKER_PRUNE_TARGETS = [
  {
    label: "containers",
    method: "pruneContainers",
    deletedKey: "ContainersDeleted",
    args: [{}],
  },
  {
    label: "images",
    method: "pruneImages",
    deletedKey: "ImagesDeleted",
    args: [{ dangling: true }],
  },
  {
    label: "volumes",
    method: "pruneVolumes",
    deletedKey: "VolumesDeleted",
    args: [{}],
  },
  {
    label: "networks",
    method: "pruneNetworks",
    deletedKey: "NetworksDeleted",
    args: [{}],
  },
];

const CASE_TYPES = {
  TEST: "test",
  SUBMISSION: "submission",
};

const CASE_FIELD_MAP = {
  [CASE_TYPES.TEST]: "problem_test_cases",
  [CASE_TYPES.SUBMISSION]: "problem_evaluate_cases",
};

const LANGUAGE_CONFIG = {
  js: {
    aliases: ["js", "javascript", "node"],
    image: "node:18-alpine",
    extension: "js",
    cmd: ({ codeFile, inputFile }) => `node ${codeFile} < ${inputFile}`,
  },
  py: {
    aliases: ["py", "python"],
    image: "python:3.11-alpine",
    extension: "py",
    cmd: ({ codeFile, inputFile }) => `python ${codeFile} < ${inputFile}`,
  },
};

const LANGUAGE_ALIAS = Object.entries(LANGUAGE_CONFIG).reduce(
  (acc, [key, config]) => {
    config.aliases.forEach((alias) => {
      acc[alias] = key;
    });
    return acc;
  },
  {},
);

const normalizeLineEndings = (value = "") => value.replace(/\r\n/g, "\n");

const getDelayUntilNextNoon = () => {
  const now = new Date();
  const nextNoon = new Date(now);
  nextNoon.setHours(12, 0, 0, 0);
  if (nextNoon <= now) {
    nextNoon.setDate(nextNoon.getDate() + 1);
  }
  return nextNoon.getTime() - now.getTime();
};

const runDockerPurge = async () => {
  const details = [];
  let docker;
  try {
    docker = getDocker();
  } catch (error) {
    console.error(`${DOCKER_PURGE_LOG_PREFIX} failed to get Docker instance`, error);
    return;
  }

  await Promise.all(
    DOCKER_PRUNE_TARGETS.map(async ({ label, method, deletedKey, args = [] }) => {
      const dockerMethod = docker[method];
      if (typeof dockerMethod !== "function") {
        return;
      }

      try {
        const result = await dockerMethod.apply(docker, args);
        const reclaimedBytes =
          typeof result?.SpaceReclaimed === "number" ? result.SpaceReclaimed : 0;
        const deletedCount = Array.isArray(result?.[deletedKey])
          ? result[deletedKey].length
          : 0;

        details.push({
          label,
          deletedCount,
          reclaimedBytes,
        });
      } catch (error) {
        console.error(
          `${DOCKER_PURGE_LOG_PREFIX} ${label} prune failed`,
          error,
        );
        details.push({
          label,
          error: error.message,
          reclaimedBytes: 0,
          deletedCount: 0,
        });
      }
    }),
  );

  const reclaimedBytes = details.reduce(
    (acc, { reclaimedBytes: bytes = 0 }) => acc + bytes,
    0,
  );

  console.info(`${DOCKER_PURGE_LOG_PREFIX} completed`, {
    timestamp: new Date().toISOString(),
    reclaimedBytes,
    details,
  });
};

export const scheduleDailyDockerPurge = () => {
  try {
    const scheduleNext = () => {
      const delay = getDelayUntilNextNoon();
      const timer = setTimeout(() => {
        runDockerPurge()
          .catch((error) => {
            console.error(`${DOCKER_PURGE_LOG_PREFIX} run failed`, error);
          })
          .finally(scheduleNext);
      }, delay);
      if (typeof timer.unref === "function") {
        timer.unref();
      }
      console.info(`${DOCKER_PURGE_LOG_PREFIX} scheduled`, {
        nextRunInMs: delay,
      });
    };

    scheduleNext();
  } catch (error) {
    console.error(`${DOCKER_PURGE_LOG_PREFIX} initialization failed`, error);
  }
};

export const EvaluationService = {
  get _docker() {
    return getDocker();
  },
  _DEFAULT_TIMEOUT_MS: 5000,
  _MAX_TIMEOUT_MS: 30_000,
  _DEFAULT_MEMORY_BYTES: 128 * 1024 * 1024,

  async evaluateCode({
    userId,
    problemId,
    code,
    language,
    caseType = CASE_TYPES.SUBMISSION,
  }) {
    const problem = await ProblemRepository.findProblemById(problemId);
    if (!problem) {
      throw ERROR.FAIL_TO_GET_PROB_DETAIL();
    }

    const normalizedCaseType = this._normalizeCaseType(caseType);
    const cases = this._getParsedCases(problem, normalizedCaseType);
    const limits = this._extractLimits(problem);

    if (cases.length === 0) {
      return {
        success: true,
        caseType: normalizedCaseType,
        passed: true,
        score: 100,
        totalCases: 0,
        timeLimitMs: limits.timeLimitMs,
        memoryLimitBytes: limits.memoryLimitBytes,
        results: [],
      };
    }

    const runtime = this._resolveLanguage(language);

    const results = [];
    let passedCount = 0;

    for (const testCase of cases) {
      try {
        const { output, executionTime, memoryUsage } =
          await this._executeInDocker(code, runtime, testCase.input, limits);

        const isPassed = this._compareOutput(output, testCase.expectedOutput);
        if (isPassed) {
          passedCount++;
        }

        results.push({
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: output,
          isPassed,
          executionTime,
          memoryUsage,
          error: false,
        });
      } catch (error) {
        results.push({
          caseId: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: error.message,
          isPassed: false,
          executionTime: null,
          memoryUsage: null,
          error: true,
        });
      }
    }

    const evaluationSummary = {
      success: true,
      caseType: normalizedCaseType,
      totalCases: cases.length,
      passed: passedCount === cases.length,
      score: (passedCount / cases.length) * 100,
      timeLimitMs: limits.timeLimitMs,
      memoryLimitBytes: limits.memoryLimitBytes,
      results,
    };

    try {
      await this._recordSolvedIfNeeded({
        userId,
        problem,
        evaluationSummary,
        runtimeKey: runtime.key,
        sourceCode: code,
      });
    } catch (error) {
      console.error(`${SOLVED_LOG_PREFIX} failed`, error);
    }

    return evaluationSummary;
  },

  _normalizeCaseType(caseType) {
    if (caseType === CASE_TYPES.TEST) {
      return CASE_TYPES.TEST;
    }
    return CASE_TYPES.SUBMISSION;
  },

  _getParsedCases(problem, caseType) {
    const field =
      CASE_FIELD_MAP[caseType] ?? CASE_FIELD_MAP[CASE_TYPES.SUBMISSION];
    const rawCases = Array.isArray(problem[field]) ? problem[field] : [];

    return rawCases
      .map((rawCase, index) => this._parseCase(rawCase, index))
      .filter(Boolean);
  },

  _parseCase(rawCase, index) {
    if (rawCase === null || rawCase === undefined) {
      return null;
    }

    if (typeof rawCase === "string") {
      const parts = rawCase.split(":::");
      const [inputPart = "", ...rest] = parts;
      const expectedPart = rest.join(":::");

      return {
        id: index + 1,
        input: this._normalizeCaseContent(inputPart),
        expectedOutput: this._normalizeCaseContent(expectedPart),
      };
    }

    if (typeof rawCase === "object") {
      const inputCandidate =
        rawCase.input ??
        rawCase.in ??
        rawCase.sample_input ??
        rawCase.case_input ??
        "";
      const outputCandidate =
        rawCase.output ??
        rawCase.expected ??
        rawCase.sample_output ??
        rawCase.case_output ??
        "";

      return {
        id: rawCase.id ?? index + 1,
        input: this._normalizeCaseContent(inputCandidate),
        expectedOutput: this._normalizeCaseContent(outputCandidate),
      };
    }

    return {
      id: index + 1,
      input: this._normalizeCaseContent(String(rawCase)),
      expectedOutput: "",
    };
  },

  _normalizeCaseContent(value) {
    if (typeof value !== "string") {
      return value === undefined || value === null ? "" : String(value);
    }
    return normalizeLineEndings(value);
  },

  _resolveLanguage(language) {
    const normalized = (language || "").toString().toLowerCase();
    const key = LANGUAGE_ALIAS[normalized];
    if (!key || !LANGUAGE_CONFIG[key]) {
      throw ERROR.INVALID_LANGUAGE();
    }
    return { key, ...LANGUAGE_CONFIG[key] };
  },

  _extractLimits(problem = {}) {
    const timeLimitMs = this._parseTimeLimit(problem.problem_time_limit);
    const memoryLimitBytes = this._parseMemoryLimit(
      problem.problem_memory_limit,
    );
    return { timeLimitMs, memoryLimitBytes };
  },

  _parseTimeLimit(raw) {
    const fallback = this._DEFAULT_TIMEOUT_MS;

    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      if (raw <= 30) {
        return raw * 1000;
      }
      return raw;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) {
        return fallback;
      }
      const match = trimmed.match(/([\d.]+)/);
      if (!match) {
        return fallback;
      }
      const value = parseFloat(match[1]);
      if (!Number.isFinite(value) || value <= 0) {
        return fallback;
      }

      if (/ms|밀리/i.test(trimmed)) {
        return value;
      }
      if (/s|sec|초/i.test(trimmed)) {
        return value * 1000;
      }

      return value <= 30 ? value * 1000 : value;
    }

    return fallback;
  },

  _parseMemoryLimit(raw) {
    const fallback = this._DEFAULT_MEMORY_BYTES;

    const ensurePositive = (value) =>
      value && Number.isFinite(value) && value > 0 ? value : fallback;

    if (typeof raw === "number") {
      if (!Number.isFinite(raw) || raw <= 0) {
        return fallback;
      }
      if (raw < 1024) {
        return raw * 1024 * 1024;
      }
      if (raw < 1024 * 1024) {
        return raw * 1024;
      }
      return raw;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) {
        return fallback;
      }
      const match = trimmed.match(/([\d.]+)/);
      if (!match) {
        return fallback;
      }
      const value = parseFloat(match[1]);
      if (!Number.isFinite(value) || value <= 0) {
        return fallback;
      }

      if (/g|gb|기가/i.test(trimmed)) {
        return ensurePositive(value * 1024 * 1024 * 1024);
      }
      if (/m|mb|메가/i.test(trimmed)) {
        return ensurePositive(value * 1024 * 1024);
      }
      if (/k|kb|킬로/i.test(trimmed)) {
        return ensurePositive(value * 1024);
      }
      if (/b|byte|바이트/i.test(trimmed)) {
        return ensurePositive(value);
      }

      return ensurePositive(value * 1024 * 1024);
    }

    return fallback;
  },

  _normalizeOutput(output) {
    if (typeof output !== "string") {
      return "";
    }
    return normalizeLineEndings(output).trim();
  },

  _compareOutput(actual, expected) {
    return this._normalizeOutput(actual) === this._normalizeOutput(expected);
  },

  _parseLogBuffer(buffer) {
    if (!buffer) {
      return "";
    }

    let output = "";
    let offset = 0;

    while (offset + 8 <= buffer.length) {
      const payloadSize = buffer.readUInt32BE(offset + 4);
      offset += 8;

      if (offset + payloadSize > buffer.length) {
        break;
      }

      const payload = buffer.subarray(offset, offset + payloadSize);
      output += payload.toString();
      offset += payloadSize;
    }

    return output;
  },

  async _executeInDocker(code, runtime, input, limits) {
    const memoryLimit = limits.memoryLimitBytes || this._DEFAULT_MEMORY_BYTES;
    const timeLimit = Math.min(
      Math.max(limits.timeLimitMs || this._DEFAULT_TIMEOUT_MS, 100),
      this._MAX_TIMEOUT_MS,
    );

    const codeFile = `/tmp/run.${runtime.extension || runtime.key || "tmp"}`;
    const inputFile = "/tmp/input.txt";

    // Encode Code and Input to Base64 to avoid shell escaping issues
    const codeB64 = Buffer.from(code).toString("base64");
    const inputB64 = Buffer.from(input || "").toString("base64");

    const runtimeCmd =
      typeof runtime.cmd === "function"
        ? runtime.cmd({ codeFile, inputFile })
        : null;
    if (!runtimeCmd) {
      throw ERROR.INVALID_LANGUAGE();
    }

    // Construct shell command to decode and run
    // 1. Decode code to /tmp/run.<ext>
    // 2. Decode input to /tmp/input.txt
    // 3. Execute language-specific command (e.g., node /tmp/run.js < /tmp/input.txt)
    const setupScript = [
      "set -eu",
      `echo "${codeB64}" | base64 -d > ${codeFile}`,
      `echo "${inputB64}" | base64 -d > ${inputFile}`,
      runtimeCmd,
    ].join(" && ");

    const shellCmd = ["sh", "-c", setupScript];

    const container = await this._docker.createContainer({
      Image: runtime.image,
      Cmd: shellCmd,
      Tty: false,
      OpenStdin: false, // No need to attach stdin anymore
      StdinOnce: false,
      HostConfig: {
        Memory: memoryLimit,
        NetworkMode: "none",
        CpuShares: 256,
        PidsLimit: 64,
        NanoCpus: 1_000_000_000, // limit to ~1 CPU
      },
    });

    await container.start();

    let waitResult;
    const waitPromise = container.wait().then((result) => {
      waitResult = result;
      return result;
    });
    let timeoutHandle;
    const timeoutError = new Error("Time Limit Exceeded");
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        container.kill().catch(() => {});
        reject(timeoutError);
      }, timeLimit);
    });

    const startedAt = performance.now();
    let parsedOutput = "";
    let elapsed = 0;
    let containerRemoved = false;
    try {
      await Promise.race([waitPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);

      elapsed = performance.now() - startedAt;
      const logsBuffer = await container.logs({
        stdout: true,
        stderr: true,
      });
      parsedOutput = this._parseLogBuffer(logsBuffer);
      await container.remove({ force: true });
      containerRemoved = true;
    } catch (error) {
      clearTimeout(timeoutHandle);
      let errorLogs = "";

      if (!containerRemoved) {
        try {
          const logsBuffer = await container.logs({
            stdout: true,
            stderr: true,
          });
          errorLogs = this._parseLogBuffer(logsBuffer);
        } catch {
          // ignore
        }
      }

      try {
        await container.kill();
      } catch {
        // ignore
      }

      try {
        await container.remove({ force: true });
        containerRemoved = true;
      } catch {
        // ignore
      }

      if (errorLogs) {
        error.message = `${error.message}\nLogs: ${this._normalizeOutput(errorLogs)}`;
      }

      throw error;
    }

    const normalizedOutput = this._normalizeOutput(parsedOutput);

    if (waitResult && waitResult.StatusCode !== 0) {
      const runtimeError = new Error(
        `Runtime Error (exit code ${waitResult.StatusCode})`,
      );
      if (normalizedOutput) {
        runtimeError.message = `${runtimeError.message}\nLogs: ${normalizedOutput}`;
      }
      throw runtimeError;
    }

    return {
      output: normalizedOutput,
      executionTime: Math.round(elapsed),
      memoryUsage: null,
    };
  },

  _extractMetricFromResults(results = [], field) {
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

  async _recordSolvedIfNeeded({
    userId,
    problem,
    evaluationSummary,
    runtimeKey,
    sourceCode,
  }) {
    if (
      !userId ||
      !problem?._id ||
      !evaluationSummary ||
      evaluationSummary.caseType !== CASE_TYPES.SUBMISSION ||
      !evaluationSummary.passed
    ) {
      return;
    }

    const user = await UserRepository.findOne({ user_id: userId });
    if (!user?._id) {
      return;
    }

    const alreadySolved = await SolvedRepository.hasUserSolvedProblem(
      user._id,
      problem._id,
    );
    if (alreadySolved) {
      return;
    }

    const solved_runtime = this._extractMetricFromResults(
      evaluationSummary.results,
      "executionTime",
    );
    const solved_memory_usage = this._extractMetricFromResults(
      evaluationSummary.results,
      "memoryUsage",
    );

    const normalizedLanguage =
      (runtimeKey || "").toString().toLowerCase() || "unknown";

    await SolvedRepository.createSolved({
      user_id: user._id,
      problem_id: problem._id,
      language: normalizedLanguage,
      solved_code: sourceCode,
      solved_runtime,
      solved_memory_usage,
    });

    console.info(`${SOLVED_LOG_PREFIX} stored`, {
      userId: user.user_id,
      problemId: problem.problem_id || problem._id?.toString(),
    });
  },
};
