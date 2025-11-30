import { z } from "zod";

export const SaveCodeRequestDto = z.object({
  code: z.string(),
  language: z.string(),
});

export const GetHintRequestDto = z.object({
  code: z.string(),
  language: z.string(),
});

