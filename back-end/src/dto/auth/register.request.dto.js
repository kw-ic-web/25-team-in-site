import { z } from "zod";

export const RegisterRequestDto = z.object({
  user_id: z
    .string()
    .min(3, "INVALID_REGISTER_REQUEST")
    .max(50, "INVALID_REGISTER_REQUEST"),
  email: z.email("INVALID_EMAIL_FORMAT").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "INVALID_REGISTER_REQUEST")
    .max(128, "INVALID_REGISTER_REQUEST"),
  language: z.enum(["py", "js", "cpp", "other"], "INVALID_LANGUAGE"),
  level: z
    .number()
    .int()
    .min(1, "INVALID_LEVEL_RANGE")
    .max(4, "INVALID_LEVEL_RANGE"),
  purpose: z.enum(["prob", "proj", "learn"], "INVALID_PURPOSE"), //TODO: ENUM 커스텀 에러
});
