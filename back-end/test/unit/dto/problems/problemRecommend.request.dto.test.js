import { describe, it, expect } from "@jest/globals";
import { ProbRecommendRequestDto } from "../../../../src/dto/problems/problemRecommend.request.dto.js";
import {
  buildQuery,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("ProbRecommendRequestDto", () => {
  it("기본 limit 5를 적용한다", () => {
    const parsed = expectDtoPass(ProbRecommendRequestDto, buildQuery({}));
    expect(parsed.limit).toBe(5);
  });

  it("limit이 0이면 실패한다", () => {
    expectDtoFail(ProbRecommendRequestDto, buildQuery({ limit: 0 }));
  });

  it("limit이 20을 초과하면 실패한다", () => {
    expectDtoFail(ProbRecommendRequestDto, buildQuery({ limit: 21 }));
  });

  it("limit이 정확히 1 (최소값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbRecommendRequestDto,
      buildQuery({ limit: 1 }),
    );
    expect(parsed.limit).toBe(1);
  });

  it("limit이 정확히 20 (최대값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbRecommendRequestDto,
      buildQuery({ limit: 20 }),
    );
    expect(parsed.limit).toBe(20);
  });
});
