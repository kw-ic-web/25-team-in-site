import { describe, it, expect } from "@jest/globals";
import { SimilarProblemRequestDto } from "../../../../src/dto/problems/problemSimilar.request.dto.js";
import {
  buildQuery,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

const validId = "018f1d40-5c40-7c60-ace2-dad9b0400559";

describe("SimilarProblemRequestDto", () => {
  it("ID와 limit을 파싱한다", () => {
    const parsed = expectDtoPass(
      SimilarProblemRequestDto,
      buildQuery({ id: validId, limit: 10 }),
    );
    expect(parsed).toEqual({ id: validId, limit: 10 });
  });

  it("limit을 생략하면 기본 5를 사용한다", () => {
    const parsed = expectDtoPass(
      SimilarProblemRequestDto,
      buildQuery({ id: validId }),
    );
    expect(parsed.limit).toBe(5);
  });

  it("ID가 잘못되면 실패한다", () => {
    expectDtoFail(
      SimilarProblemRequestDto,
      buildQuery({ id: "bad" }),
      "INVALID_PROB_ID",
    );
  });

  it("limit이 20을 초과하면 실패한다", () => {
    expectDtoFail(
      SimilarProblemRequestDto,
      buildQuery({ id: validId, limit: 21 }),
    );
  });

  it("limit이 1 미만이면 실패한다", () => {
    expectDtoFail(
      SimilarProblemRequestDto,
      buildQuery({ id: validId, limit: 0 }),
    );
  });

  it("limit이 정확히 1 (최소값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      SimilarProblemRequestDto,
      buildQuery({ id: validId, limit: 1 }),
    );
    expect(parsed.limit).toBe(1);
  });

  it("limit이 정확히 20 (최대값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      SimilarProblemRequestDto,
      buildQuery({ id: validId, limit: 20 }),
    );
    expect(parsed.limit).toBe(20);
  });
});
