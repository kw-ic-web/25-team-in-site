import { describe, it, expect } from "@jest/globals";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import config from "../../src/config/env.config.js";
import { User } from "../../src/entity/user.entity.js";
import {
  appRequest,
  setupTestDBHooks,
} from "../utils/test-helpers.js";

setupTestDBHooks();

const buildRegisterPayload = (overrides = {}) => {
  const suffix = randomUUID().split("-")[0];
  return {
    user_id: `integration_${suffix}`,
    email: `integration_${suffix}@example.com`,
  password: "Password123!",
  language: "js",
  level: 2,
  purpose: "learn",
    ...overrides,
  };
};

describe("Auth API Integration", () => {
  it("POST /api/v1/auth/register → 사용자 생성 및 비밀번호 해시 확인", async () => {
    const payload = buildRegisterPayload();

    const res = await appRequest().post("/api/v1/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user_id: payload.user_id,
      email: payload.email.toLowerCase(),
    });
    expect(res.headers["set-cookie"]).toBeDefined();

    // 토큰 유효성 검증
    const cookieHeader = res.headers["set-cookie"][0];
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch[1];

    // JWT 토큰이 유효한지 확인
    let decoded;
    expect(() => {
      decoded = jwt.verify(token, config.jwtSecret);
    }).not.toThrow();

    // 토큰에 올바른 payload가 포함되어 있는지 확인
    expect(decoded).toMatchObject({
      user_id: payload.user_id,
    });

    const stored = await User.findOne({ user_id: payload.user_id })
      .select("+user_pw")
      .lean();
    expect(stored).toBeTruthy();
    expect(stored.user_email).toBe(payload.email.toLowerCase());
    expect(stored.user_pw).toBeDefined();
    expect(stored.user_pw).not.toBe(payload.password);

    // 비밀번호 해시 검증 강화: bcrypt로 실제 검증
    const userDoc = await User.findOne({ user_id: payload.user_id })
      .select("+user_pw");
    const isPasswordValid = await userDoc.comparePassword(payload.password);
    expect(isPasswordValid).toBe(true);

    // 해시 알고리즘 확인 (bcrypt 해시는 $2a$, $2b$, $2y$로 시작)
    expect(stored.user_pw).toMatch(/^\$2[aby]\$/);
  });

  it("POST /api/v1/auth/login → 등록한 사용자에게 토큰 발급", async () => {
    const payload = buildRegisterPayload({
      user_id: `login_${Date.now()}`,
      email: `login_${Date.now()}@example.com`,
    });
    await appRequest().post("/api/v1/auth/register").send(payload);

    const res = await appRequest().post("/api/v1/auth/login").send({
      email: payload.email.toUpperCase(),
      password: payload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      user_id: payload.user_id,
      email: payload.email.toLowerCase(),
    });
    expect(res.headers["set-cookie"]).toBeDefined();

    // 토큰 유효성 검증
    const cookieHeader = res.headers["set-cookie"][0];
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = tokenMatch[1];

    // JWT 토큰이 유효한지 확인
    let decoded;
    expect(() => {
      decoded = jwt.verify(token, config.jwtSecret);
    }).not.toThrow();

    // 토큰에 올바른 payload가 포함되어 있는지 확인
    expect(decoded).toMatchObject({
      user_id: payload.user_id,
    });
  });

  it("중복 아이디 등록 시 409를 반환한다", async () => {
    const payload = buildRegisterPayload({ user_id: "dup_user" });
    await appRequest().post("/api/v1/auth/register").send(payload);

    const dupRes = await appRequest()
      .post("/api/v1/auth/register")
      .send({
        ...payload,
        email: "another@example.com",
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toBe("이미 등록된 아이디입니다.");
  });

  it("중복 이메일 등록 시 409를 반환한다", async () => {
    const payload = buildRegisterPayload();
    await appRequest().post("/api/v1/auth/register").send(payload);

    const dupRes = await appRequest()
      .post("/api/v1/auth/register")
      .send({
        ...buildRegisterPayload(),
        email: payload.email,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toBe("이미 등록된 이메일입니다.");
  });

  it("MongoDB race condition 시 409를 반환한다", async () => {
    const payload = buildRegisterPayload({ user_id: "race_user" });
    const promises = [
      appRequest().post("/api/v1/auth/register").send(payload),
      appRequest().post("/api/v1/auth/register").send(payload),
    ];

    const results = await Promise.allSettled(promises);
    const statuses = results
      .map((r) => (r.status === "fulfilled" ? r.value.status : null))
      .filter(Boolean);

    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
    const conflictRes = results.find(
      (r) =>
        r.status === "fulfilled" &&
        (r.value.status === 409 ||
          r.value.body?.message?.includes("이미 존재합니다")),
    );
    expect(conflictRes).toBeTruthy();
  });

  describe("POST /api/v1/auth/register - DTO 검증 실패", () => {
    it("user_id가 너무 짧으면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ user_id: "ab" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });

    it("user_id가 너무 길면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({
        user_id: "a".repeat(51),
      });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });

    it("user_id에 특수문자가 포함되면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ user_id: "user@id" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
    });

    it("잘못된 이메일 형식이면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ email: "invalid-email" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("올바른 이메일 형식이 아닙니다");
    });

    it("비밀번호가 너무 짧으면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ password: "short" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("비밀번호 형식이 올바르지 않습니다");
    });

    it("비밀번호가 너무 길면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({
        password: "a".repeat(129),
      });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("비밀번호 형식이 올바르지 않습니다");
    });

    it("잘못된 language enum 값이면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ language: "ruby" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "선호하는 프로그래밍 언어가 올바르지 않습니다",
      );
    });

    it("level이 0이면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ level: 0 });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("숙련도는 1~4 사이의 정수여야 합니다");
    });

    it("level이 5이면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ level: 5 });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("숙련도는 1~4 사이의 정수여야 합니다");
    });

    it("level이 정수가 아니면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ level: 2.5 });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.name).toBe("ValidationError");
    });

    it("잘못된 purpose enum 값이면 400을 반환한다", async () => {
      const payload = buildRegisterPayload({ purpose: "unknown" });
      const res = await appRequest().post("/api/v1/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("가입 목적이 올바르지 않습니다");
    });
  });

  describe("POST /api/v1/auth/login - DTO 검증 실패", () => {
    it("잘못된 이메일 형식이면 400을 반환한다", async () => {
      const res = await appRequest().post("/api/v1/auth/login").send({
        email: "invalid-email",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("올바른 이메일 형식이 아닙니다");
    });

    it("비밀번호가 너무 짧으면 400을 반환한다", async () => {
      const res = await appRequest().post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "short",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("이메일/비밀번호를 입력하세요");
    });
  });

  describe("POST /api/v1/auth/login - 비즈니스 로직 실패", () => {
    it("존재하지 않는 사용자면 401을 반환한다", async () => {
      const res = await appRequest().post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
    });

    it("잘못된 비밀번호면 401을 반환한다", async () => {
      const payload = buildRegisterPayload();
      await appRequest().post("/api/v1/auth/register").send(payload);

      const res = await appRequest().post("/api/v1/auth/login").send({
        email: payload.email,
        password: "WrongPassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
    });
  });
});
