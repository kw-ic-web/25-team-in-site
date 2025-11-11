import { z } from "zod";

export const ProbDetailRequestDto = z.object({
  problem_lang: z.string("FAIL_TO_GET_PROB_DETAIL"), //TODO?: ENUM으로 바꾸기?
  problem_body: z.string().min(1, "FAIL_TO_GET_PROB_DETAIL"),
  problem_attachment_urls: z.array(z.string(), "FAIL_TO_GET_PROB_DETAIL"),
});
