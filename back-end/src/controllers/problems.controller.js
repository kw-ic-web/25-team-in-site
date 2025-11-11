import { ProbDetailRequestDto } from "../dto/problems/detail.request.dto.js";

export const problemsController = {
  async getProblemDetail(req, res, next) {
    try {
      const dto = ProbDetailRequestDto.parse(req.params);
      const responseDto = await req.services.problems.getProblemById(dto);

      res.status(200).json({
        language: responseDto.problem_lang,
        body: responseDto.problem_body,
        attachments_urls: responseDto.problem_attachment_urls,
      });
    } catch (error) {
      next(error);
    }
  },
};
