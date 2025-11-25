import { z } from "zod";
import { MAX_CODE_CHAR_LENGTH } from "../../constants/tokenizer.constants.js";

export const CodeTokenizeRequestDto = z.object({
  code: z
    .string()
    .min(1, "CODE_REQUIRED")
    .max(MAX_CODE_CHAR_LENGTH, "CODE_TOO_LARGE"),
});
