import { z } from "zod";
import { ProbSummaryWithStateResponseDto } from "./problemSummary.response.dto.js";

const RecentSolvedItemResponseDto = z.object({
  solved_id: z.string("FAIL_TO_GET_PROB_DETAIL"),
  solved_at: z.date("FAIL_TO_GET_PROB_DETAIL"),
  runtime_ms: z.number("FAIL_TO_GET_PROB_DETAIL").nullable(),
  memory_kb: z.number("FAIL_TO_GET_PROB_DETAIL").nullable(),
  feedback: z.string("FAIL_TO_GET_PROB_DETAIL").nullable(),
  problem: ProbSummaryWithStateResponseDto,
});

export const RecentSolvedListResponseDto = z.object({
  count: z
    .number("FAIL_TO_GET_PROB_DETAIL")
    .int("FAIL_TO_GET_PROB_DETAIL")
    .nonnegative("FAIL_TO_GET_PROB_DETAIL"),
  items: z.array(RecentSolvedItemResponseDto, "FAIL_TO_GET_PROB_DETAIL"),
});

