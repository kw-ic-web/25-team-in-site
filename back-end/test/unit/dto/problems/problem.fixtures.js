export const makeProblemSummary = (overrides = {}) => ({
  problem_id: "prob-1",
  problem_title: "두 수의 합",
  problem_difficulty: 2,
  problem_lang: ["JavaScript", "Python"],
  problem_main_category: ["Array"],
  problem_sub_category: ["TwoPointers"],
  problem_success_rate: 57,
  ...overrides,
});

export const makeProblemSummaryWithState = (overrides = {}) => ({
  ...makeProblemSummary(),
  expected_xp: 120,
  is_solved: false,
  ...overrides,
});

export const makeProblemDetail = (overrides = {}) => ({
  ...makeProblemSummary(),
  problem_body: "<p>문제 설명</p>",
  problem_attachment_urls: [],
  problem_test_cases: ["1 2", "3 4"],
  problem_time_limit: 2000,
  problem_memory_limit: 256,
  ...overrides,
});
