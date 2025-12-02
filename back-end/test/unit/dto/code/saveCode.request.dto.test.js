import { describe, it } from "@jest/globals";
import { SaveCodeRequestDto } from "../../../../src/dto/code/saveCode.request.dto.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("SaveCodeRequestDto", () => {
  const basePayload = {
    problemId: "problem-1",
    code: "console.log('hello');",
    language: "js",
  };

  it("코드와 언어를 허용한다", () => {
    const result = expectDtoPass(
      SaveCodeRequestDto,
      buildBody(basePayload),
    );
    expect(result).toEqual(basePayload);
  });

  it("code가 빈 문자열이어도 허용한다", () => {
    const result = expectDtoPass(
      SaveCodeRequestDto,
      buildBody({ problemId: "problem-1", code: "", language: "js" }),
    );
    expect(result.code).toBe("");
    expect(result.language).toBe("js");
  });

  it("code가 없으면 INVALID_CODE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ language: "js" }),
      "INVALID_CODE_TYPE",
    );
  });

  it("language가 없으면 INVALID_LANGUAGE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ code: "console.log('test');" }),
      "INVALID_LANGUAGE_TYPE",
    );
  });

  it("language가 enum 값이 아니면 INVALID_LANGUAGE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ code: "console.log('test');", language: "javascript" }),
      "INVALID_LANGUAGE_TYPE",
    );
  });

  it("language가 빈 문자열이면 INVALID_LANGUAGE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ code: "console.log('test');", language: "" }),
      "INVALID_LANGUAGE_TYPE",
    );
  });

  it("code가 문자열이 아니면 INVALID_CODE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ code: 123, language: "js" }),
      "INVALID_CODE_TYPE",
    );
  });

  it("language가 문자열이 아니면 INVALID_LANGUAGE_TYPE 에러를 던진다", () => {
    expectDtoFail(
      SaveCodeRequestDto,
      buildBody({ code: "console.log('test');", language: 123 }),
      "INVALID_LANGUAGE_TYPE",
    );
  });

  it("js와 py 언어를 허용한다", () => {
    const languages = ["js", "py"];
    languages.forEach((lang) => {
      const result = expectDtoPass(
        SaveCodeRequestDto,
        buildBody({ problemId: "problem-1", code: "test", language: lang }),
      );
      expect(result.language).toBe(lang);
    });
  });
});

