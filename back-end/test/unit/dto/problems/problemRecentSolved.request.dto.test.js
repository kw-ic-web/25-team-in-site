import { describe, it, expect } from "@jest/globals";
import { RecentSolvedListRequestDto } from "../../../../src/dto/problems/problemRecentSolved.request.dto.js";
import {
  buildQuery,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("RecentSolvedListRequestDto", () => {
  it("기본 limit 5를 적용한다", () => {
    const parsed = expectDtoPass(
      RecentSolvedListRequestDto,
      buildQuery({}),
    );
    expect(parsed.limit).toBe(5);
  });

  it("허용 범위를 넘으면 실패한다", () => {
    expectDtoFail(
      RecentSolvedListRequestDto,
      buildQuery({ limit: 50 }),
    );
  });

  it("limit이 1 미만이면 실패한다", () => {
    expectDtoFail(
      RecentSolvedListRequestDto,
      buildQuery({ limit: 0 }),
    );
  });

  it("limit이 정확히 1 (최소값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      RecentSolvedListRequestDto,
      buildQuery({ limit: 1 }),
    );
    expect(parsed.limit).toBe(1);
  });

  it("limit이 정확히 20 (최대값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      RecentSolvedListRequestDto,
      buildQuery({ limit: 20 }),
    );
    expect(parsed.limit).toBe(20);
  });
});


