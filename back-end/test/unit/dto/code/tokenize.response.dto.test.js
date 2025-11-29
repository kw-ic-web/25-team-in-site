import { describe, it } from "@jest/globals";
import { CodeTokenizeResponseDto } from "../../../../src/dto/code/tokenize.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";

describe("CodeTokenizeResponseDto", () => {
  it("정상 토큰 개수를 허용한다", () => {
    const result = expectDtoPass(CodeTokenizeResponseDto, {
      token_count: 42,
    });
    expect(result.token_count).toBe(42);
  });

  it("음수 토큰 개수는 거부한다", () => {
    expectDtoFail(CodeTokenizeResponseDto, { token_count: -1 });
  });
});
