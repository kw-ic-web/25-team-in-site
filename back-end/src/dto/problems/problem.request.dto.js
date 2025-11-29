import { z } from "zod";

export const ProbDetailRequestDto = z.object({
  id: z.uuidv7("INVALID_PROB_ID"),
});
