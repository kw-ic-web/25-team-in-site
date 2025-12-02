import { describe, it, expect } from "@jest/globals";
import { CheckUserIdDto } from "../../../../src/dto/user/checkUserId.request.dto.js";
import {
  buildBody,
  expectDtoFail,
  expectDtoPass,
} from "../../../utils/dto-helpers.js";

describe("CheckUserIdDto", () => {
  const basePayload = { user_id: "valid_id" };

  it("올바른 아이디를 허용한다", () => {
    const parsed = expectDtoPass(CheckUserIdDto, buildBody(basePayload));
    expect(parsed.user_id).toBe("valid_id");
  });

  it("아이디 길이가 3 미만이면 실패한다", () => {
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: "ab" }),
      "INVALID_ID_FORMAT",
    );
  });

  it("특수 문자를 포함하면 실패한다", () => {
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: "invalid!*" }),
      "INVALID_ID_FORMAT",
    );
  });

  it("user_id가 50자를 초과하면 INVALID_ID_FORMAT 에러를 던진다", () => {
    const longUserId = "a".repeat(51);
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: longUserId }),
      "INVALID_ID_FORMAT",
    );
  });

  it("user_id가 정확히 3자(최소값)인 경우를 허용한다", () => {
    const parsed = expectDtoPass(CheckUserIdDto, buildBody({ user_id: "abc" }));
    expect(parsed.user_id).toBe("abc");
  });

  it("user_id가 정확히 50자(최대값)인 경우를 허용한다", () => {
    const maxLengthUserId = "a".repeat(50);
    const parsed = expectDtoPass(
      CheckUserIdDto,
      buildBody({ user_id: maxLengthUserId }),
    );
    expect(parsed.user_id).toBe(maxLengthUserId);
  });

  it("user_id에 언더스코어(_)가 포함된 경우를 허용한다", () => {
    const parsed = expectDtoPass(
      CheckUserIdDto,
      buildBody({ user_id: "user_name" }),
    );
    expect(parsed.user_id).toBe("user_name");
  });

  it("user_id에 하이픈(-)이 포함된 경우를 허용한다", () => {
    const parsed = expectDtoPass(
      CheckUserIdDto,
      buildBody({ user_id: "user-name" }),
    );
    expect(parsed.user_id).toBe("user-name");
  });

  it("user_id가 공백만 있는 경우(trim 후 빈 문자열) 실패한다", () => {
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: "   " }),
      "INVALID_ID_FORMAT",
    );
  });

  it("user_id가 null인 경우 실패한다", () => {
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: null }),
      "INVALID_ID_FORMAT",
    );
  });

  it("user_id가 undefined인 경우 실패한다", () => {
    expectDtoFail(
      CheckUserIdDto,
      buildBody({ user_id: undefined }),
      "INVALID_ID_FORMAT",
    );
  });
});
