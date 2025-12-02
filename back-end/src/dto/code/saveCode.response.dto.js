import { z } from "zod";

export const SaveCodeResponseDto = z.object({
  success: z.boolean(),
});