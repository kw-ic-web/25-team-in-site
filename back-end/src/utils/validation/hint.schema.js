import { z } from "zod";

export const HintSchema = z.object({
  level: z.enum([1, 2, 3, 4, 5]),
  body: z.string().describe("힌트 본문"),
});