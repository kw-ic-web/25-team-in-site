import { z } from "zod";

export const CodeTokenizeResponseDto = z.object({
  token_count: z.number().int().min(0),
});

