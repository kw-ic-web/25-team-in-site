import { describe, it } from "@jest/globals";
import { RecentSolvedListResponseDto } from "../../../../src/dto/problems/problemRecentSolved.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";
import { makeProblemSummaryWithState } from "./problem.fixtures.js";

describe("RecentSolvedListResponseDto", () => {
  const baseItem = {
    solved_id: "solved-1",
    solved_at: new Date(),
    runtime_ms: 120,
    memory_kb: 64,
    problem: makeProblemSummaryWithState(),
  };

  it("최근 해결 목록 응답을 허용한다", () => {
    const payload = {
      count: 1,
      items: [baseItem],
    };
    const parsed = expectDtoPass(RecentSolvedListResponseDto, payload);
    expect(parsed.items[0].problem.problem_id).toBe(
      baseItem.problem.problem_id,
    );
  });

  it("잘못된 solved_at 타입이면 실패한다", () => {
    const payload = {
      count: 1,
      items: [{ ...baseItem, solved_at: "2024-01-01" }],
    };
    expectDtoFail(
      RecentSolvedListResponseDto,
      payload,
      "FAIL_TO_GET_PROB_DETAIL",
    );
  });

  it("runtime_ms가 null이어도 허용한다", () => {
    const payload = {
      count: 1,
      items: [{ ...baseItem, runtime_ms: null }],
    };
    const parsed = expectDtoPass(RecentSolvedListResponseDto, payload);
    expect(parsed.items[0].runtime_ms).toBeNull();
  });

  it("memory_kb가 null이어도 허용한다", () => {
    const payload = {
      count: 1,
      items: [{ ...baseItem, memory_kb: null }],
    };
    const parsed = expectDtoPass(RecentSolvedListResponseDto, payload);
    expect(parsed.items[0].memory_kb).toBeNull();
  });
});
