import { ProbDetailRequestDto } from "../dto/problems/problem.request.dto.js";
import { ProbListRequestDto } from "../dto/problems/problemList.request.dto.js";

export const problemsController = {
  async getProblemDetail(req, res, next) {
    try {
      const dto = ProbDetailRequestDto.parse({ id: req.params.id });
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
  async getProblems(req, res, next) {
    try {
      const dto = ProbListRequestDto.parse({ ...req.query });

      const responseDto = await req.services.problems.getProblemList(dto);

      res.status(200).json({
        pagination: {
          page: responseDto.page,
          limit: responseDto.limit,
          total_count: responseDto.totalCount,
          total_pages: responseDto.totalPages,
        },
        problems: responseDto.problems.map((problem) => ({
          id: problem.problem_id,
          difficulty: problem.problem_difficulty,
          language: problem.problem_lang,
          main_category: problem.problem_main_category,
          sub_category: problem.problem_sub_category,
          success_rate: problem.problem_success_rate,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
};
