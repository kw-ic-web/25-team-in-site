import { z } from "zod";

export const LoginRequestDto = z.object({
  email: z.email("INVALID_EMAIL_FORMAT").trim().toLowerCase(),
  password: z.string().trim().min(8, "INVALID_LOGIN_REQUEST"),
});
