import { z } from "zod";

// 목록/추천/최근 해결 등에서 사용하는 문제 요약 DTO
// ※ main/sub 카테고리는 DB에 배열로도 들어올 수 있어서 string | string[] 모두 허용
export const ProbSummaryResponseDto = z.object({
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
    .union([z.string(), z.array(z.string())], "FAIL_TO_GET_PROB_DETAIL")
    .optional(),
  problem_sub_category: z
    .union([z.string(), z.array(z.string())], "FAIL_TO_GET_PROB_DETAIL")
    .optional(),
  problem_success_rate: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .min(0, "FAIL_TO_GET_PROB_DETAIL")
    .max(100, "FAIL_TO_GET_PROB_DETAIL"),
});

// expected_xp, is_solved 등을 포함한 문제 요약(상태 포함) DTO
export const ProbSummaryWithStateResponseDto = ProbSummaryResponseDto.extend({
  expected_xp: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .nonnegative("FAIL_TO_GET_PROB_DETAIL"),
  is_solved: z.boolean("FAIL_TO_GET_PROB_DETAIL"),
});
