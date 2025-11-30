import { z } from "zod";

export const SaveCodeResponseDto = z.object({
  success: z.boolean(),
});

export const GetHintResponseDto = z.object({
  hint: z.string(),
});
