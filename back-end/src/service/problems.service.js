import { ERROR } from "../mapper/error.mapper.js";
import { ProblemRepository } from "../repository/problem.repository.js";

export const ProblemsService = {
  async getProblemById(dto) {
    const responseDto = await ProblemRepository.findProblemById(dto.id)
      .then((prob) => {
        return ProbDetailRequestDto.parse(prob);
      })
      .catch(() => {
        throw ERROR.FAIL_TO_GET_PROB_DETAIL;
      });
    return responseDto;
  },
};
