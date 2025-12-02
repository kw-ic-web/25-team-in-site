import { describe, it } from "@jest/globals";
import { AuthResponseDto } from "../../../../src/dto/auth/auth.response.dto.js";
import { expectDtoFail, expectDtoPass } from "../../../utils/dto-helpers.js";

describe("AuthResponseDto", () => {
  const baseResponse = {
    user_id: "tester01",
    email: "tester01@example.com",
    token: "token-123",
  };

  it("정상 응답을 허용한다", () => {
    const result = expectDtoPass(AuthResponseDto, baseResponse);
    expect(result).toEqual(baseResponse);
  });

  it("이메일이 잘못되면 실패한다", () => {
    expectDtoFail(
      AuthResponseDto,
      { ...baseResponse, email: "invalid" },
      "Invalid email",
    );
  });
});
