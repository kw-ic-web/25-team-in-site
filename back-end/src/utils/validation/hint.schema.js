import { z } from "zod";

export const HintSchema = z.object({
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  body: z.string().describe("hint_body"),
});