import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { AuthController } from "../../../src/controllers/auth.controller.js";

const buildResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("AuthController.register", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {
        user_id: "tester01",
        email: "tester01@example.com",
        password: "Password123!",
        language: "js",
        level: 2,
        purpose: "learn",
      },
      services: {
        auth: {
          register: jest.fn().mockResolvedValue({
            user_id: "tester01",
            email: "tester01@example.com",
            token: "token-xyz",
          }),
        },
      },
    };
    res = buildResponse();
    next = jest.fn();
  });

  it("회원가입 성공 시 토큰을 쿠키로 전달한다", async () => {
    await AuthController.register(req, res, next);

    expect(req.services.auth.register).toHaveBeenCalledWith({
      user_id: "tester01",
      email: "tester01@example.com",
      password: "Password123!",
      language: "js",
      level: 2,
      purpose: "learn",
    });
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-xyz",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user_id: "tester01",
      email: "tester01@example.com",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("서비스에서 에러가 발생하면 next로 전달한다", async () => {
    const error = new Error("boom");
    req.services.auth.register.mockRejectedValue(error);

    await AuthController.register(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("DTO 검증 실패 시 서비스를 호출하지 않고 next로 전달한다", async () => {
    req.body.email = "invalid-email";

    await AuthController.register(req, res, next);

    expect(req.services.auth.register).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("production 환경에서 secure 쿠키 옵션을 설정한다", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await AuthController.register(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-xyz",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("development 환경에서 secure 쿠키 옵션을 false로 설정한다", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    await AuthController.register(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-xyz",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});

describe("AuthController.login", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {
        email: "tester01@example.com",
        password: "Password123!",
      },
      services: {
        auth: {
          login: jest.fn().mockResolvedValue({
            user_id: "tester01",
            email: "tester01@example.com",
            token: "token-login",
          }),
        },
      },
    };
    res = buildResponse();
    next = jest.fn();
  });

  it("로그인 성공 시 토큰 쿠키를 설정한다", async () => {
    await AuthController.login(req, res, next);

    expect(req.services.auth.login).toHaveBeenCalledWith({
      email: "tester01@example.com",
      password: "Password123!",
    });
    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-login",
      expect.objectContaining({
        httpOnly: true,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user_id: "tester01",
      email: "tester01@example.com",
    });
  });

  it("로그인 실패 시 next로 에러를 전달한다", async () => {
    const error = new Error("invalid");
    req.services.auth.login.mockRejectedValue(error);

    await AuthController.login(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("로그인 DTO 검증 실패 시 서비스를 호출하지 않는다", async () => {
    req.body.password = "short";

    await AuthController.login(req, res, next);

    expect(req.services.auth.login).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("production 환경에서 secure 쿠키 옵션을 설정한다", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await AuthController.login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-login",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it("development 환경에서 secure 쿠키 옵션을 false로 설정한다", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    await AuthController.login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "token",
      "token-login",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});

