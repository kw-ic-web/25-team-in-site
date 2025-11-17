import { ProbDetailResponseDto } from "../dto/problems/problem.response.dto.js";
import { ProbListResponseDto } from "../dto/problems/problemList.response.dto.js";
import { ERROR } from "../mapper/error.mapper.js";
import { ProblemRepository } from "../repository/problem.repository.js";

export const ProblemsService = {
  async getProblemById(dto) {
    const problem = await ProblemRepository.findProblemById(dto.id);

    if (!problem) {
      throw ERROR.FAIL_TO_GET_PROB_DETAIL();
    }

    try {
      return ProbDetailResponseDto.parse(problem);
    } catch {
      throw ERROR.FAIL_TO_GET_PROB_DETAIL();
    }
  },
  async getProblemList(dto) {
    const { items, total } = await ProblemRepository.findProblems(dto);
    const totalPages = total === 0 ? 0 : Math.ceil(total / dto.limit);

    return ProbListResponseDto.parse({
      page: dto.page,
      limit: dto.limit,
      totalCount: total,
      totalPages,
      problems: items,
    });
  },
};
