import { z } from "zod";

export const SaveCodeRequestDto = z.object({
  problemId: z
    .string("INVALID_PROBLEM_ID_TYPE")
    .min(1, "PROBLEM_ID_REQUIRED"),
  code: z.string("INVALID_CODE_TYPE"),
  language: z.enum(["js", "py"], "INVALID_LANGUAGE_TYPE"),
});