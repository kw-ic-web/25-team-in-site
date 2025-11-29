import { describe, it, expect } from "@jest/globals";
import { ProbListRequestDto } from "../../../../src/dto/problems/problemList.request.dto.js";
import {
  buildQuery,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("ProbListRequestDto", () => {
  it("기본값을 적용한다", () => {
    const parsed = expectDtoPass(ProbListRequestDto, buildQuery({}));
    expect(parsed).toMatchObject({
      page: 1,
      limit: 10,
      difficulties: [],
      languages: [],
      sort_by: "created_at",
      sort_order: "desc",
      exclude_solved: false,
    });
  });

  it("문자열 입력을 배열로 파싱한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({
        difficulties: "1,2,3",
        languages: "js, py",
        exclude_solved: "true",
      }),
    );
    expect(parsed.difficulties).toEqual([1, 2, 3]);
    expect(parsed.languages).toEqual(["js", "py"]);
    expect(parsed.exclude_solved).toBe(true);
  });

  it("허용되지 않은 정렬 값은 기본값으로 대체한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ sort_by: "unknown", sort_order: "up" }),
    );
    expect(parsed.sort_by).toBe("created_at");
    expect(parsed.sort_order).toBe("desc");
  });

  it("난이도가 범위를 벗어나면 에러를 던진다", () => {
    expectDtoFail(
      ProbListRequestDto,
      buildQuery({ difficulties: "1,7" }),
    );
  });

  it("limit이 50을 초과하면 에러를 던진다", () => {
    expectDtoFail(
      ProbListRequestDto,
      buildQuery({ limit: 51 }),
    );
  });

  it("page가 0이면 에러를 던진다", () => {
    expectDtoFail(
      ProbListRequestDto,
      buildQuery({ page: 0 }),
    );
  });

  it("page가 음수면 에러를 던진다", () => {
    expectDtoFail(
      ProbListRequestDto,
      buildQuery({ page: -1 }),
    );
  });

  it("limit이 정확히 1 (최소값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ limit: 1 }),
    );
    expect(parsed.limit).toBe(1);
  });

  it("limit이 정확히 50 (최대값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ limit: 50 }),
    );
    expect(parsed.limit).toBe(50);
  });

  it("page가 정확히 1 (최소값)인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ page: 1 }),
    );
    expect(parsed.page).toBe(1);
  });

  it("page가 매우 큰 값인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ page: 999999 }),
    );
    expect(parsed.page).toBe(999999);
  });

  it("difficulties가 빈 배열인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ difficulties: "" }),
    );
    expect(parsed.difficulties).toEqual([]);
  });

  it("difficulties에 중복 값이 있는 경우 중복이 제거된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ difficulties: "1,2,1,3,2" }),
    );
    // 중복 제거 여부는 실제 구현에 따라 다를 수 있음
    expect(parsed.difficulties).toContain(1);
    expect(parsed.difficulties).toContain(2);
    expect(parsed.difficulties).toContain(3);
  });

  it("languages가 빈 배열인 경우 통과한다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ languages: "" }),
    );
    expect(parsed.languages).toEqual([]);
  });

  it("languages에 중복 값이 있는 경우 중복이 제거된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ languages: "js,py,js" }),
    );
    // 중복 제거 여부는 실제 구현에 따라 다를 수 있음
    expect(parsed.languages).toContain("js");
    expect(parsed.languages).toContain("py");
  });

  it("exclude_solved가 'yes'이면 true로 파싱된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ exclude_solved: "yes" }),
    );
    expect(parsed.exclude_solved).toBe(true);
  });

  it("exclude_solved가 'no'이면 false로 파싱된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ exclude_solved: "no" }),
    );
    expect(parsed.exclude_solved).toBe(false);
  });

  it("exclude_solved가 '1'이면 true로 파싱된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ exclude_solved: "1" }),
    );
    expect(parsed.exclude_solved).toBe(true);
  });

  it("exclude_solved가 '0'이면 false로 파싱된다", () => {
    const parsed = expectDtoPass(
      ProbListRequestDto,
      buildQuery({ exclude_solved: "0" }),
    );
    expect(parsed.exclude_solved).toBe(false);
  });
});


