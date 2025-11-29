import { describe, it, expect } from "@jest/globals";
import { appRequest, setupTestDBHooks } from "../utils/test-helpers.js";

setupTestDBHooks();

describe("Auth API", () => {
  it("POST /api/v1/auth/register", async () => {
    const payload = {
      user_id: `e2e_reg_${Date.now()}`,
      email: `E2E_Reg_${Date.now()}@Example.com`,
      password: "Password123!",
      language: "js",
      level: 2,
      purpose: "learn",
    };

    const res = await appRequest().post("/api/v1/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body).toMatchObject({
      user_id: payload.user_id,
      email: payload.email.toLowerCase(),
    });
  });

  it("POST /api/v1/auth/login", async () => {
    const id = `e2e_login_${Date.now()}`;
    const email = `${id}@Example.com`;
    const password = "Password123!";
    await appRequest().post("/api/v1/auth/register").send({
      user_id: id,
      email,
      password,
      language: "js",
      level: 2,
      purpose: "learn",
    });

    const res = await appRequest().post("/api/v1/auth/login").send({
      email: email.toUpperCase(),
      password,
    });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body).toMatchObject({
      user_id: id,
      email: email.toLowerCase(),
    });
  });

  it("POST /api/v1/auth/register - DTO 검증 실패 시 400을 반환한다", async () => {
    const res = await appRequest().post("/api/v1/auth/register").send({
      user_id: "ab", // 너무 짧음
      email: "test@example.com",
      password: "Password123!",
      language: "js",
      level: 2,
      purpose: "learn",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("아이디 형식이 올바르지 않습니다");
  });

  it("POST /api/v1/auth/login - 잘못된 이메일/비밀번호 시 401을 반환한다", async () => {
    const res = await appRequest().post("/api/v1/auth/login").send({
      email: "nonexistent@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
  });

  it("POST /api/v1/auth/register - 중복 아이디 등록 시 409를 반환한다", async () => {
    const id = `e2e_dup_${Date.now()}`;
    const payload = {
      user_id: id,
      email: `e2e_dup_${Date.now()}@example.com`,
      password: "Password123!",
      language: "js",
      level: 2,
      purpose: "learn",
    };

    await appRequest().post("/api/v1/auth/register").send(payload);

    const dupRes = await appRequest()
      .post("/api/v1/auth/register")
      .send({
        ...payload,
        email: `another_${Date.now()}@example.com`,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toBe("이미 등록된 아이디입니다.");
  });
});
