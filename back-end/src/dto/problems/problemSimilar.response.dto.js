import { z } from "zod";
import { ProbSummaryWithStateResponseDto } from "./problemSummary.response.dto.js";

export const SimilarProblemResponseDto = z.object({
  count: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .nonnegative("FAIL_TO_GET_PROB_DETAIL"),
  problems: z.array(
    ProbSummaryWithStateResponseDto,
    "FAIL_TO_GET_PROB_DETAIL",
  ),
});

