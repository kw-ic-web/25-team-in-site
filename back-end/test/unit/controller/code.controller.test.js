import { describe, it, expect, jest } from "@jest/globals";
import { CodeController } from "../../../src/controllers/code.controller.js";

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("CodeController.tokenize", () => {
  it("코드를 토큰화하여 반환한다", async () => {
    const req = {
      body: { code: "console.log('hello');" },
      services: {
        tokenizer: {
          tokenize: jest.fn().mockResolvedValue({ token_count: 3 }),
        },
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await CodeController.tokenize(req, res, next);

    expect(req.services.tokenizer.tokenize).toHaveBeenCalledWith({
      code: "console.log('hello');",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token_count: 3 });
    expect(next).not.toHaveBeenCalled();
  });

  it("서비스 에러 발생 시 next로 전달한다", async () => {
    const error = new Error("tokenize failed");
    const req = {
      body: { code: "print('hi')" },
      services: {
        tokenizer: {
          tokenize: jest.fn().mockRejectedValue(error),
        },
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await CodeController.tokenize(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("DTO 검증 실패 시 서비스를 호출하지 않는다", async () => {
    const req = {
      body: { code: "" },
      services: {
        tokenizer: {
          tokenize: jest.fn(),
        },
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await CodeController.tokenize(req, res, next);

    expect(req.services.tokenizer.tokenize).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

