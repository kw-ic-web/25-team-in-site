import { z } from "zod";
import { ProbDetailResponseDto } from "./problem.response.dto";

const ProbListItemResponseDto = ProbDetailResponseDto.omit({
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
