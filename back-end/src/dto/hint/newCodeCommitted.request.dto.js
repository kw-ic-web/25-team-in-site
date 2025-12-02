import { z } from "zod";

export const NewCodeCommittedRequestDto = z.object({
    userId: z.string(),
    problemId: z.string(),
});
