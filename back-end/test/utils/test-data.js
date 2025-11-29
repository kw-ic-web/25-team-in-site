import { randomUUID } from "crypto";
import { User } from "../../src/entity/user.entity.js";
import { Problem } from "../../src/entity/problem.entity.js";
import { ProblemDetail } from "../../src/entity/problemDetail.entity.js";
import { Solved } from "../../src/entity/solved.entity.js";

const uniqueSuffix = () => randomUUID().split("-")[0];

export const buildUser = (overrides = {}) => {
  const suffix = uniqueSuffix();
  return {
    user_id: `test_user_${suffix}`,
    user_pw: "Password123!",
    user_email: `test_${suffix}@example.com`,
    prefer_language: "py",
    purpose: "learn",
    metalevel: 3,
    ...overrides,
  };
};

export const createUser = async (overrides = {}) => {
  const userData = buildUser(overrides);
  return User.create(userData);
};

export const buildProblem = (overrides = {}) => {
  const suffix = uniqueSuffix();
  return {
    problem_source_id: overrides.problem_source_id ?? `SRC-${suffix}`,
    problem_title: overrides.problem_title ?? `테스트 문제 ${suffix}`,
    problem_difficulty: overrides.problem_difficulty ?? 2,
    problem_lang: overrides.problem_lang ?? ["JavaScript"],
    problem_main_category: overrides.problem_main_category ?? ["Algorithm"],
    problem_sub_category: overrides.problem_sub_category ?? ["Sorting"],
    problem_success_rate: overrides.problem_success_rate ?? 42,
    ...overrides,
  };
};

export const createProblemWithDetail = async (overrides = {}) => {
  const problem = await Problem.create(buildProblem(overrides));

  const detail = await ProblemDetail.create({
    problem_id: problem._id,
    problem_body:
      overrides.problem_body ?? `<p>테스트 문제 본문 ${problem.problem_id}</p>`,
    problem_attachment_urls: overrides.problem_attachment_urls ?? [],
    problem_test_cases: overrides.problem_test_cases ?? ["1 2", "3 4"],
    problem_time_limit: overrides.problem_time_limit ?? 2000,
    problem_memory_limit: overrides.problem_memory_limit ?? 256,
  });

  return { problem, detail };
};

export const createSolvedRecord = async ({
  user,
  problem,
  language = "JavaScript",
  solved_code = "console.log('hello');",
  solved_runtime = 120,
  solved_memory_usage = 64,
} = {}) => {
  if (!user?._id || !problem?._id) {
    throw new Error("user and problem must be provided");
  }

  return Solved.create({
    user_id: user._id,
    problem_id: problem._id,
    language,
    solved_code,
    solved_runtime,
    solved_memory_usage,
  });
};

