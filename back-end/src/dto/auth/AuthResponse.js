import { z } from "zod";

export const AuthResponseDto = z.object({
  user_id: z.string(),
  email: z.email(),
  token: z.string(),
});
