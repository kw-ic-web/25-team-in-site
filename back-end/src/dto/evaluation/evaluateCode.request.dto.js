import { z } from "zod";

export const EvaluateCodeRequestDto = z.object({
  problemId: z.string("INVALID_PROB_ID").min(1, "INVALID_PROB_ID"),
  code: z.string("CODE_REQUIRED").min(1, "CODE_REQUIRED"),
  language: z.enum(["js", "py"], "INVALID_LANGUAGE_TYPE"),
  mode: z.enum(["test", "submission"]).default("submission"),
});
