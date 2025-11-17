import { z } from "zod";

export const ProbDetailResponseDto = z.object({
  problem_id: z.string("FAIL_TO_GET_PROB_DETAIL"),
  problem_difficulty: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL")
    .max(5, "FAIL_TO_GET_PROB_DETAIL"),
  problem_lang: z
    .array(z.string(), "FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"), //TODO?: ENUM으로 바꾸기?
  problem_main_category: z.string("FAIL_TO_GET_PROB_DETAIL"), //TODO?: ENUM으로 바꾸기?
  problem_sub_category: z.string("FAIL_TO_GET_PROB_DETAIL"), //TODO?: ENUM으로 바꾸기?
  problem_success_rate: z.number("FAIL_TO_GET_PROB_DETAIL"),
  problem_body: z.string().min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_attachment_urls: z.array(z.string(), "FAIL_TO_GET_PROB_DETAIL"),
});
