import { ProbDetailRequestDto } from "../dto/problems/problem.request.dto.js";
import { ProbListRequestDto } from "../dto/problems/problemList.request.dto.js";
import { ProbRecommendRequestDto } from "../dto/problems/problemRecommend.request.dto.js";
import { SimilarProblemRequestDto } from "../dto/problems/problemSimilar.request.dto.js";
import { RecentSolvedListRequestDto } from "../dto/problems/problemRecentSolved.request.dto.js";

const _transformProblemSummary = (problem) => ({
  id: problem.problem_id,
  title: problem.problem_title,
  difficulty: problem.problem_difficulty,
  language: problem.problem_lang,
  main_category: problem.problem_main_category,
  sub_category: problem.problem_sub_category,
  success_rate: problem.problem_success_rate,
  expected_xp: problem.expected_xp,
  is_solved: Boolean(problem.is_solved),
});

export const problemsController = {
  async getProblemDetail(req, res, next) {
    try {
      const dto = ProbDetailRequestDto.parse({ id: req.params.id });
      const responseDto = await req.services.problems.getProblemById(
        dto,
        req.user?.user_id,
      );
      const { problem } = responseDto;

      res.status(200).json({
        id: problem.problem_id,
        title: problem.problem_title,
        difficulty: problem.problem_difficulty,
        language: problem.problem_lang,
        main_category: problem.problem_main_category,
        sub_category: problem.problem_sub_category,
        success_rate: problem.problem_success_rate,
        body: problem.problem_body,
        attachments_urls: problem.problem_attachment_urls,
        test_cases: problem.problem_test_cases,
        time_limit: problem.problem_time_limit,
        memory_limit: problem.problem_memory_limit,
        expected_xp: responseDto.expectedXp,
        is_solved: responseDto.isSolved,
      });
    } catch (error) {
      next(error);
    }
  },
  async getProblems(req, res, next) {
    try {
      const dto = ProbListRequestDto.parse({ ...req.query });

      const responseDto = await req.services.problems.getProblemList(
        dto,
        req.user?.user_id,
      );

      res.status(200).json({
        pagination: {
          page: responseDto.page,
          limit: responseDto.limit,
          total_count: responseDto.totalCount,
          total_pages: responseDto.totalPages,
        },
        problems: responseDto.problems.map(_transformProblemSummary),
      });
    } catch (error) {
      next(error);
    }
  },
  async getPersonalRecommendations(req, res, next) {
    try {
      const dto = ProbRecommendRequestDto.parse({ ...req.query });
      const responseDto =
        await req.services.problems.getPersonalRecommendations(
          dto,
          req.user?.user_id,
        );

      res.status(200).json({
        count: responseDto.count,
        problems: responseDto.problems.map(_transformProblemSummary),
      });
    } catch (error) {
      next(error);
    }
  },
  async getSimilarProblems(req, res, next) {
    try {
      const dto = SimilarProblemRequestDto.parse({
        id: req.params.id,
        limit: req.query.limit,
      });
      const responseDto = await req.services.problems.getSimilarProblems(
        dto,
        req.user?.user_id,
      );

      res.status(200).json({
        count: responseDto.count,
        problems: responseDto.problems.map(_transformProblemSummary),
      });
    } catch (error) {
      next(error);
    }
  },
  async getRecentSolvedProblems(req, res, next) {
    try {
      const dto = RecentSolvedListRequestDto.parse({ ...req.query });
      const responseDto = await req.services.problems.getRecentSolvedProblems(
        dto,
        req.user?.user_id,
      );

      res.status(200).json({
        count: responseDto.count,
        items: responseDto.items.map((item) => ({
          solved_id: item.solved_id,
          solved_at:
            item.solved_at instanceof Date
              ? item.solved_at.toISOString()
              : item.solved_at,
          runtime_ms: item.runtime_ms,
          memory_kb: item.memory_kb,
          feedback: item.feedback,
          problem: _transformProblemSummary(item.problem),
        })),
      });
    } catch (error) {
      next(error);
    }
  },
};
