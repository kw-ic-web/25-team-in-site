import { z } from "zod";
import { ProbDetailRequestDto } from "./problem.request.dto.js";

export const SimilarProblemRequestDto = ProbDetailRequestDto.extend({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
