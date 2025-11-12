import { z } from "zod";

export const CheckUserIdDto = z.object({
  user_id: z
    .string()
    .min(3, "INVALID_REGISTER_REQUEST")
    .max(50, "INVALID_REGISTER_REQUEST"),
});
