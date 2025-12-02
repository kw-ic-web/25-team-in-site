import { describe, it, expect } from "@jest/globals";
import { SaveCodeResponseDto } from "../../../../src/dto/code/saveCode.response.dto.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("SaveCodeResponseDto", () => {
  it("success가 true인 응답을 허용한다", () => {
    const result = expectDtoPass(
      SaveCodeResponseDto,
      buildBody({ success: true }),
    );
    expect(result).toEqual({ success: true });
  });

  it("success가 false인 응답을 허용한다", () => {
    const result = expectDtoPass(
      SaveCodeResponseDto,
      buildBody({ success: false }),
    );
    expect(result).toEqual({ success: false });
  });

  it("success가 없으면 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeResponseDto,
      buildBody({}),
      "Invalid input",
    );
  });

  it("success가 boolean이 아니면 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeResponseDto,
      buildBody({ success: "true" }),
      "Invalid input",
    );
  });

  it("추가 필드는 무시된다", () => {
    const result = expectDtoPass(
      SaveCodeResponseDto,
      buildBody({ success: true, extra: "field" }),
    );
    expect(result).toEqual({ success: true });
    expect(result.extra).toBeUndefined();
  });
});

