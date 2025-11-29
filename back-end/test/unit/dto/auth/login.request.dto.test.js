import { describe, it, expect } from "@jest/globals";
import { LoginRequestDto } from "../../../../src/dto/auth/login.request.dto.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("LoginRequestDto", () => {
  const basePayload = {
    email: "Tester@Example.com",
    password: "Password123!",
  };

  it("유효한 입력을 파싱하고 이메일을 소문자로 변환한다", () => {
    const result = expectDtoPass(LoginRequestDto, buildBody(basePayload));
    expect(result).toEqual({
      email: "tester@example.com",
      password: "Password123!",
    });
  });

  it("잘못된 이메일이면 INVALID_EMAIL_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, email: "tester" }),
      "INVALID_EMAIL_FORMAT",
    );
  });

  it("짧은 비밀번호면 INVALID_LOGIN_REQUEST 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, password: "short" }),
      "INVALID_LOGIN_REQUEST",
    );
  });

  it("비밀번호가 128자이면 유효하다", () => {
    const longPassword = "a".repeat(128);
    const parsed = expectDtoPass(
      LoginRequestDto,
      buildBody({ ...basePayload, password: longPassword }),
    );
    expect(parsed.password).toBe(longPassword);
  });

  it("비밀번호가 129자이면 INVALID_LOGIN_REQUEST 에러를 던진다", () => {
    const longPassword = "a".repeat(129);
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, password: longPassword }),
      "INVALID_LOGIN_REQUEST",
    );
  });

  it("빈 문자열 비밀번호면 INVALID_LOGIN_REQUEST 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, password: "" }),
      "INVALID_LOGIN_REQUEST",
    );
  });

  it("공백만 있는 비밀번호면 INVALID_LOGIN_REQUEST 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, password: "   " }),
      "INVALID_LOGIN_REQUEST",
    );
  });

  it("빈 문자열 이메일이면 INVALID_EMAIL_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, email: "" }),
      "INVALID_EMAIL_FORMAT",
    );
  });

  it("공백만 있는 이메일이면 INVALID_EMAIL_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      LoginRequestDto,
      buildBody({ ...basePayload, email: "   " }),
      "INVALID_EMAIL_FORMAT",
    );
  });
});
