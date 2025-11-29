import { z } from "zod";
import { ProbDetailResponseDto } from "./problem.response.dto.js";

const ProbListItemResponseDto = ProbDetailResponseDto.omit({
  problem_body: true,
  problem_attachment_urls: true,
});

export const ProbListResponseDto = z.object({
  page: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .min(1, "FAIL_TO_GET_PROB_DETAIL"),
  limit: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .positive("FAIL_TO_GET_PROB_DETAIL"),
  totalCount: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .nonnegative("FAIL_TO_GET_PROB_DETAIL"),
  totalPages: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .nonnegative("FAIL_TO_GET_PROB_DETAIL"),
  problems: z.array(ProbListItemResponseDto, "FAIL_TO_GET_PROB_DETAIL"),
});
