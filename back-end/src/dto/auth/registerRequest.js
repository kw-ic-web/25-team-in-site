import { z } from "zod";

export const RegisterRequestDto = z.object({
  user_id: z.string().min(3, "INVALID_REGISTER_REQUEST"),
  email: z.email("INVALID_EMAIL_FORMAT").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "INVALID_REGISTER_REQUEST")
    .max(128, "INVALID_REGISTER_REQUEST"),
});
