import { describe, it } from "@jest/globals";
import { ProbDetailResponseDto } from "../../../../src/dto/problems/problem.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import { makeProblemDetail } from "./problem.fixtures.js";

describe("ProbDetailResponseDto", () => {
  it("문제 상세 정보를 허용한다", () => {
    const detail = makeProblemDetail();
    const parsed = expectDtoPass(ProbDetailResponseDto, detail);
    expect(parsed.problem_id).toBe(detail.problem_id);
  });

  it("난이도가 범위를 벗어나면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_difficulty: 6 });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("본문이 없으면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_body: "" });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("난이도가 1 미만이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_difficulty: 0 });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("성공률이 0 미만이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_success_rate: -1 });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("성공률이 100을 초과하면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_success_rate: 101 });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("problem_lang 배열이 비어있으면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_lang: [] });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("problem_main_category 배열이 비어있으면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_main_category: [] });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("problem_sub_category 배열이 비어있으면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const detail = makeProblemDetail({ problem_sub_category: [] });
    expectDtoFail(ProbDetailResponseDto, detail, "FAIL_TO_GET_PROB_DETAIL");
  });
});


