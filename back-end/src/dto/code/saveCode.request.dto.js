import { z } from "zod";

export const SaveCodeRequestDto = z.object({
  code: z.string("INVALID_CODE_TYPE"),
  language: z.enum(["js", "py"], "INVALID_LANGUAGE_TYPE"),
});