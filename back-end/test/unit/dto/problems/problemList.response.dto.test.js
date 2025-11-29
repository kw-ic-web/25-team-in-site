import { describe, it } from "@jest/globals";
import { ProbListResponseDto } from "../../../../src/dto/problems/problemList.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import { makeProblemDetail } from "./problem.fixtures.js";

const makeListItem = () => {
  const detail = makeProblemDetail();
  const { problem_body, problem_attachment_urls, ...rest } = detail;
  return rest;
};

describe("ProbListResponseDto", () => {
  it("문제 목록 응답을 허용한다", () => {
    const payload = {
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
      problems: [makeListItem()],
    };
    const parsed = expectDtoPass(ProbListResponseDto, payload);
    expect(parsed.problems).toHaveLength(1);
  });

  it("페이지가 1 미만이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const payload = {
      page: 0,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
      problems: [makeListItem()],
    };
    expectDtoFail(ProbListResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("limit이 0이면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const payload = {
      page: 1,
      limit: 0,
      totalCount: 0,
      totalPages: 0,
      problems: [],
    };
    expectDtoFail(ProbListResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("totalCount가 음수면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const payload = {
      page: 1,
      limit: 10,
      totalCount: -1,
      totalPages: 0,
      problems: [],
    };
    expectDtoFail(ProbListResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });

  it("totalPages가 음수면 FAIL_TO_GET_PROB_DETAIL 에러를 던진다", () => {
    const payload = {
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: -1,
      problems: [],
    };
    expectDtoFail(ProbListResponseDto, payload, "FAIL_TO_GET_PROB_DETAIL");
  });
});


