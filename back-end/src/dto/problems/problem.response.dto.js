import { z } from "zod";

export const ProbDetailResponseDto = z.object({
  problem_id: z.string("FAIL_TO_GET_PROB_DETAIL"),
  problem_difficulty: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL")
    .max(5, "FAIL_TO_GET_PROB_DETAIL"),
  problem_lang: z
    .array(z.string(), "FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_main_category: z
    .string("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_sub_category: z
    .string("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_success_rate: z.number("FAIL_TO_GET_PROB_DETAIL"),
  problem_body: z.string().min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_attachment_urls: z.array(z.string(), "FAIL_TO_GET_PROB_DETAIL"),
});

export const ProbListItemResponseDto = ProbDetailResponseDto.omit({
  problem_body: true,
  problem_attachment_urls: true,
});

export const ProbListResponseDto = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  problems: z.array(ProbListItemResponseDto),
});
