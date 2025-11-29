import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { UserController } from "../../../src/controllers/user.controller.js";

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("UserController.checkUserId", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: { user_id: "tester01" },
      services: {
        auth: {
          isIdAvailable: jest.fn().mockResolvedValue(true),
        },
      },
    };
    res = mockResponse();
    next = jest.fn();
  });

  it("아이디 사용 가능 여부를 반환한다", async () => {
    await UserController.checkUserId(req, res, next);

    expect(req.services.auth.isIdAvailable).toHaveBeenCalledWith("tester01");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ available: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("에러가 발생하면 next로 전달한다", async () => {
    const error = new Error("db error");
    req.services.auth.isIdAvailable.mockRejectedValue(error);

    await UserController.checkUserId(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("DTO 검증 실패 시 서비스를 호출하지 않는다", async () => {
    req.params.user_id = "ab";

    await UserController.checkUserId(req, res, next);

    expect(req.services.auth.isIdAvailable).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("isIdAvailable이 false를 반환하면 available: false를 반환한다", async () => {
    req.services.auth.isIdAvailable.mockResolvedValue(false);

    await UserController.checkUserId(req, res, next);

    expect(req.services.auth.isIdAvailable).toHaveBeenCalledWith("tester01");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ available: false });
    expect(next).not.toHaveBeenCalled();
  });

  it("req.params.user_id가 undefined인 경우를 처리한다", async () => {
    req.params.user_id = undefined;

    await UserController.checkUserId(req, res, next);

    expect(req.services.auth.isIdAvailable).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("req.params가 완전히 비어있는 경우를 처리한다", async () => {
    req.params = {};

    await UserController.checkUserId(req, res, next);

    expect(req.services.auth.isIdAvailable).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("UserController.getStats", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { user_id: "tester01" },
      services: {
        user: {
          getUserStats: jest.fn().mockResolvedValue({
            profile: { nickname: "tester01" },
          }),
        },
      },
    };
    res = mockResponse();
    next = jest.fn();
  });

  it("사용자 통계를 반환한다", async () => {
    await UserController.getStats(req, res, next);

    expect(req.services.user.getUserStats).toHaveBeenCalledWith("tester01");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      profile: { nickname: "tester01" },
    });
  });

  it("에러 발생 시 next로 전달한다", async () => {
    const error = new Error("boom");
    req.services.user.getUserStats.mockRejectedValue(error);

    await UserController.getStats(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("req.user가 없으면 TypeError가 발생하고 next로 전달된다", async () => {
    req.user = undefined;

    await UserController.getStats(req, res, next);

    expect(req.services.user.getUserStats).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(TypeError));
  });

  it("req.user.user_id가 null인 경우를 처리한다", async () => {
    req.user.user_id = null;

    await UserController.getStats(req, res, next);

    expect(req.services.user.getUserStats).toHaveBeenCalledWith(null);
    expect(next).not.toHaveBeenCalled();
  });

  it("req.user.user_id가 undefined인 경우를 처리한다", async () => {
    req.user.user_id = undefined;

    await UserController.getStats(req, res, next);

    expect(req.services.user.getUserStats).toHaveBeenCalledWith(undefined);
    expect(next).not.toHaveBeenCalled();
  });

  it("req.user.user_id가 빈 문자열인 경우를 처리한다", async () => {
    req.user.user_id = "";

    await UserController.getStats(req, res, next);

    expect(req.services.user.getUserStats).toHaveBeenCalledWith("");
    expect(next).not.toHaveBeenCalled();
  });
});

