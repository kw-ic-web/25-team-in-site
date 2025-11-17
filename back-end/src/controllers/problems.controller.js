import { ProbDetailRequestDto } from "../dto/problems/problem.request.dto.js";

export const problemsController = {
  async getProblem(req, res, next) {
    try {
      const dto = ProbDetailRequestDto.parse(req.params);
      const responseDto = await req.services.problems.getProblemById(dto);

      res.status(200).json({
        difficulty: responseDto.problem_difficulty,
        language: responseDto.problem_lang,
        main_category: responseDto.problem_main_category,
        sub_category: responseDto.problem_sub_category,
        success_rate: responseDto.problem_success_rate,
        body: responseDto.problem_body,
        attachments_urls: responseDto.problem_attachment_urls,
      });
    } catch (error) {
      next(error);
    }
  },
};
