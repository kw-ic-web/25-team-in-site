import { z } from "zod";

export const SessionDataSchema = z.object({
  problemId: z.string().optional(),
  language: z.string().optional(),
  code: z
    .object({
      full: z.string().optional(),
      diff: z.any().optional(), // Structure depends on the diff library
    })
    .optional(),
  cursor: z.tuple([z.number(), z.number()]).optional(), // [line, col]
  context: z
    .array(
      z.object({
        hintCnt: z.number().int(),
        code: z.string(),
        hint: z.string(),
        cursor: z.tuple([z.number(), z.number()]).optional(),
      }),
    )
    .optional(), // Hint History
});

export const CreateSessionRequestDto = z.object({
  userId: z.string().min(1, "USER_ID_REQUIRED"),
  data: SessionDataSchema.default({}),
});

export const UpdateSessionRequestDto = z.object({
  data: SessionDataSchema.partial(),
});

export const SessionResponseDto = z.object({
  userId: z.string(),
  data: SessionDataSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
});
