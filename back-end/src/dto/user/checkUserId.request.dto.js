import { z } from "zod";

export const CheckUserIdDto = z.object({
  user_id: z
    .string()
    .trim()
    .min(3, "INVALID_ID_FORMAT")
    .max(50, "INVALID_ID_FORMAT")
    .regex(/^[a-zA-Z0-9_-]+$/, "INVALID_ID_FORMAT"),
});
