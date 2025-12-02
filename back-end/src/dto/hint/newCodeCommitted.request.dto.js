import { z } from "zod";

export const NewCodeCommittedRequestDto = z.object({
  userId: z.string({
    required_error: "userId는 필수 입력값입니다.",
    invalid_type_error: "userId는 문자열이어야 합니다.",
  }),
  problemId: z.string({
    required_error: "problemId는 필수 입력값입니다.",
    invalid_type_error: "problemId는 문자열이어야 합니다.",
  }),
});