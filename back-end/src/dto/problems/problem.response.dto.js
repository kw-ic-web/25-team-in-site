import { z } from "zod";

export const ProbDetailResponseDto = z.object({
  problem_id: z.string("FAIL_TO_GET_PROB_DETAIL"),
  problem_title: z
    .string("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_difficulty: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL")
    .max(5, "FAIL_TO_GET_PROB_DETAIL"),
  problem_lang: z
    .array(z.string(), "FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_main_category: z
    .array(z.string(), "FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_sub_category: z
    .array(z.string(), "FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_success_rate: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .min(0, "FAIL_TO_GET_PROB_DETAIL")
    .max(100, "FAIL_TO_GET_PROB_DETAIL"),
  problem_body: z
    .string("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_attachment_urls: z.array(z.string(), "FAIL_TO_GET_PROB_DETAIL"),
  problem_test_cases: z.array(z.string(), "FAIL_TO_GET_PROB_DETAIL").optional(),
  problem_time_limit: z.number("FAIL_TO_GET_PROB_DETAIL").optional(),
  problem_memory_limit: z.number("FAIL_TO_GET_PROB_DETAIL").optional(),
});
