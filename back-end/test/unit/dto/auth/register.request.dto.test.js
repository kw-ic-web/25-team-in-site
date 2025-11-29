import { describe, it, expect } from "@jest/globals";
import { RegisterRequestDto } from "../../../../src/dto/auth/register.request.dto.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("RegisterRequestDto", () => {
  const basePayload = {
    user_id: "tester01",
    email: "Tester01@Example.Com",
    password: "Password123!",
    language: "js",
    level: 2,
    purpose: "learn",
  };

  it("유효한 입력을 파싱하고 이메일을 소문자로 변환한다", () => {
    const parsed = expectDtoPass(RegisterRequestDto, buildBody(basePayload));
    expect(parsed).toMatchObject({
      user_id: "tester01",
      email: "tester01@example.com",
      language: "js",
      level: 2,
      purpose: "learn",
    });
  });

  it("아이디 형식이 잘못되면 INVALID_ID_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: "ab" }),
      "INVALID_ID_FORMAT",
    );
  });

  it("이메일 형식이 잘못되면 INVALID_EMAIL_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, email: "invalid-email" }),
      "INVALID_EMAIL_FORMAT",
    );
  });

  it("허용되지 않은 언어면 INVALID_LANGUAGE 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, language: "ruby" }),
      "INVALID_LANGUAGE",
    );
  });

  it("비밀번호가 128자를 초과하면 INVALID_PASSWORD_FORMAT 에러를 던진다", () => {
    const longPassword = "a".repeat(129);
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, password: longPassword }),
      "INVALID_PASSWORD_FORMAT",
    );
  });

  it("level이 1 미만이면 INVALID_LEVEL_RANGE 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, level: 0 }),
      "INVALID_LEVEL_RANGE",
    );
  });

  it("level이 4를 초과하면 INVALID_LEVEL_RANGE 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, level: 5 }),
      "INVALID_LEVEL_RANGE",
    );
  });

  it("허용되지 않은 purpose면 INVALID_PURPOSE 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, purpose: "invalid" }),
      "INVALID_PURPOSE",
    );
  });

  it("user_id가 50자를 초과하면 INVALID_ID_FORMAT 에러를 던진다", () => {
    const longUserId = "a".repeat(51);
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: longUserId }),
      "INVALID_ID_FORMAT",
    );
  });

  it("비밀번호가 7자이면 INVALID_PASSWORD_FORMAT 에러를 던진다", () => {
    expectDtoFail(
      RegisterRequestDto,
      buildBody({ ...basePayload, password: "Pass123" }),
      "INVALID_PASSWORD_FORMAT",
    );
  });

  it("비밀번호가 8자이면 유효하다", () => {
    const parsed = expectDtoPass(
      RegisterRequestDto,
      buildBody({ ...basePayload, password: "Password" }),
    );
    expect(parsed.password).toBe("Password");
  });

  it("user_id가 3자이면 유효하다", () => {
    const parsed = expectDtoPass(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: "abc" }),
    );
    expect(parsed.user_id).toBe("abc");
  });

  it("user_id가 50자이면 유효하다", () => {
    const longUserId = "a".repeat(50);
    const parsed = expectDtoPass(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: longUserId }),
    );
    expect(parsed.user_id).toBe(longUserId);
  });

  it("user_id에 언더스코어(_)가 포함되어도 유효하다", () => {
    const parsed = expectDtoPass(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: "user_id_123" }),
    );
    expect(parsed.user_id).toBe("user_id_123");
  });

  it("user_id에 하이픈(-)이 포함되어도 유효하다", () => {
    const parsed = expectDtoPass(
      RegisterRequestDto,
      buildBody({ ...basePayload, user_id: "user-id-123" }),
    );
    expect(parsed.user_id).toBe("user-id-123");
  });
});


