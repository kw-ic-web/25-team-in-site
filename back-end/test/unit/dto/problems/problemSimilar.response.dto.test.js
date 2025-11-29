import { describe, it } from "@jest/globals";
import { SimilarProblemResponseDto } from "../../../../src/dto/problems/problemSimilar.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import { makeProblemSummaryWithState } from "./problem.fixtures.js";

describe("SimilarProblemResponseDto", () => {
  it("유효한 응답을 허용한다", () => {
    const payload = {
      count: 1,
      problems: [makeProblemSummaryWithState()],
    };
    expectDtoPass(SimilarProblemResponseDto, payload);
  });

  it("problems 배열이 비어 있으면 허용하지만 count와 일치하는지 확인한다", () => {
    const payload = {
      count: 0,
      problems: [],
    };
    const parsed = expectDtoPass(SimilarProblemResponseDto, payload);
    expect(parsed.count).toBe(0);
  });

  it("count가 음수면 실패한다", () => {
    const payload = {
      count: -1,
      problems: [makeProblemSummaryWithState()],
    };
    expectDtoFail(SimilarProblemResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });
});


