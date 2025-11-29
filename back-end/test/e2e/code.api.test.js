import { describe, it, expect } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
} from "../utils/test-helpers.js";

setupTestDBHooks();

describe("Code API", () => {
  it("POST /api/v1/code/tokenize", async () => {
    const { cookie } = await createAuthenticatedUser({
      user_id: `code_user_${Date.now()}`,
    });

    const res = await appRequest()
      .post("/api/v1/code/tokenize")
      .set("Cookie", cookie)
      .send({ code: "console.log('token');" });

    expect(res.status).toBe(200);
    expect(res.body.token_count).toBeGreaterThan(0);
  });

  it("유효하지 않은 요청은 400을 반환한다", async () => {
    const { cookie } = await createAuthenticatedUser({
      user_id: `code_user_invalid_${Date.now()}`,
    });

    const res = await appRequest()
      .post("/api/v1/code/tokenize")
      .set("Cookie", cookie)
      .send({ code: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  describe("인증 실패", () => {
    it("토큰 없이 접근 시 401을 반환한다", async () => {
      const res = await appRequest()
        .post("/api/v1/code/tokenize")
        .send({ code: "console.log('test');" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });

    it("잘못된 토큰으로 접근 시 401을 반환한다", async () => {
      const res = await appRequest()
        .post("/api/v1/code/tokenize")
        .set("Cookie", "token=invalid-token")
        .send({ code: "console.log('test');" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("인증 정보가 올바르지 않습니다.");
    });
  });

  // 토큰 수 초과 테스트는 단위 테스트에서 이미 커버됨
  // E2E에서는 코드 길이 제한(MAX_CODE_CHAR_LENGTH)으로 인해
  // 실제 토큰 수 초과를 테스트하기 어려움
});

