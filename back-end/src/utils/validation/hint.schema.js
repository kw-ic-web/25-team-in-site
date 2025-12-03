import { z } from "zod";

export const HintSchema = z.object({
  level: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  body: z.string().describe("hint_body"),
});

export const L5FeedbackSchema = z.object({
  keyPoints: z
    .array(z.string().min(1))
    .length(5)
    .describe("다섯 개의 핵심 bullet을 포함하는 요약"),
  report: z.string().describe("Markdown 형식의 중간 길이 L5 피드백 본문"),
});