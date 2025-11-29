import { describe, it } from "@jest/globals";
import {
  ProbSummaryResponseDto,
  ProbSummaryWithStateResponseDto,
} from "../../../../src/dto/problems/problemSummary.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import {
  makeProblemSummary,
  makeProblemSummaryWithState,
} from "./problem.fixtures.js";

describe("ProbSummaryResponseDto", () => {
  it("문제 요약 응답을 허용한다", () => {
    const summary = makeProblemSummary();
    const parsed = expectDtoPass(ProbSummaryResponseDto, summary);
    expect(parsed.problem_id).toBe(summary.problem_id);
  });

  it("난이도가 0이면 실패한다", () => {
    const summary = makeProblemSummary({ problem_difficulty: 0 });
    expectDtoFail(ProbSummaryResponseDto, summary, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("난이도가 1 미만이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const summary = makeProblemSummary({ problem_difficulty: -1 });
    expectDtoFail(ProbSummaryResponseDto, summary, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("성공률이 0 미만이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const summary = makeProblemSummary({ problem_success_rate: -1 });
    expectDtoFail(ProbSummaryResponseDto, summary, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("성공률이 100을 초과하면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const summary = makeProblemSummary({ problem_success_rate: 101 });
    expectDtoFail(ProbSummaryResponseDto, summary, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("problem_lang 배열이 비어있으면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const summary = makeProblemSummary({ problem_lang: [] });
    expectDtoFail(ProbSummaryResponseDto, summary, "FAIL_TO_GET_PROB_DETAIL");
  });
});

describe("ProbSummaryWithStateResponseDto", () => {
  it("상태가 포함된 요약 응답을 허용한다", () => {
    const summary = makeProblemSummaryWithState();
    const parsed = expectDtoPass(ProbSummaryWithStateResponseDto, summary);
    expect(parsed.expected_xp).toBe(120);
    expect(parsed.is_solved).toBe(false);
  });

  it("expected_xp가 음수면 실패한다", () => {
    const summary = makeProblemSummaryWithState({ expected_xp: -1 });
    expectDtoFail(
      ProbSummaryWithStateResponseDto,
      summary,
      "FAIL_TO_GET_PROB_DETAIL",
    );
  });
});
