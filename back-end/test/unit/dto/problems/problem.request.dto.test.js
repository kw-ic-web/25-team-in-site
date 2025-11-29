import { describe, it } from "@jest/globals";
import { ProbDetailRequestDto } from "../../../../src/dto/problems/problem.request.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";

describe("ProbDetailRequestDto", () => {
  const validId = "018f1d40-5c40-7c60-ace2-dad9b0400559";

  it("UUIDv7 형식의 ID를 허용한다", () => {
    const result = expectDtoPass(ProbDetailRequestDto, { id: validId });
    expect(result.id).toBe(validId);
  });

  it("잘못된 ID면 INVALID_PROB_ID 에러를 던진다", () => {
    expectDtoFail(ProbDetailRequestDto, { id: "123" }, "INVALID_PROB_ID");
  });
});
