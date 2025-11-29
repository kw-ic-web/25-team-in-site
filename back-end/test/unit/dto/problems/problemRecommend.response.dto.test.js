import { describe, it } from "@jest/globals";
import { ProbRecommendResponseDto } from "../../../../src/dto/problems/problemRecommend.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import { makeProblemSummaryWithState } from "./problem.fixtures.js";

describe("ProbRecommendResponseDto", () => {
  it("추천 응답을 허용한다", () => {
    const payload = {
      count: 1,
      problems: [makeProblemSummaryWithState()],
    };
    const parsed = expectDtoPass(ProbRecommendResponseDto, payload);
    expect(parsed.count).toBe(1);
  });

  it("count가 음수면 실패한다", () => {
    const payload = {
      count: -1,
      problems: [makeProblemSummaryWithState()],
    };
    expectDtoFail(ProbRecommendResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });
});


