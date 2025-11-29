import { describe, it } from "@jest/globals";
import { CodeTokenizeRequestDto } from "../../../../src/dto/code/tokenize.request.dto.js";
import { MAX_CODE_CHAR_LENGTH } from "../../../../src/constants/tokenizer.constants.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("CodeTokenizeRequestDto", () => {
  const basePayload = { code: "console.log('hello');" };

  it("코드 문자열을 허용한다", () => {
    const result = expectDtoPass(
      CodeTokenizeRequestDto,
      buildBody(basePayload),
    );
    expect(result).toEqual(basePayload);
  });

  it("빈 문자열이면 CODE_REQUIRED 에러를 던진다", () => {
    expectDtoFail(
      CodeTokenizeRequestDto,
      buildBody({ code: "" }),
      "CODE_REQUIRED",
    );
  });

  it("최대 길이를 초과하면 CODE_TOO_LARGE 에러를 던진다", () => {
    const longCode = "a".repeat(MAX_CODE_CHAR_LENGTH + 1);
    expectDtoFail(
      CodeTokenizeRequestDto,
      buildBody({ code: longCode }),
      "CODE_TOO_LARGE",
    );
  });

  it("문자열이 아니면 INVALID_CODE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      CodeTokenizeRequestDto,
      buildBody({ code: 123 }),
      "INVALID_CODE_TYPE",
    );
  });
});
