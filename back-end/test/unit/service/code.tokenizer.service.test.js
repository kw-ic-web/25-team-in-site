import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CodeTokenizeRequestDto } from "../../../src/dto/code/tokenize.request.dto.js";

const encodeMock = jest.fn();
const encoderInstance = {
  encode: (...args) => encodeMock(...args),
  free: jest.fn(),
};

const getEncodingMock = jest.fn(() => encoderInstance);
const getEncodingNameMock = jest.fn(() => "mock-encoding");

jest.unstable_mockModule("tiktoken", () => ({
  get_encoding: getEncodingMock,
  get_encoding_name_for_model: getEncodingNameMock,
}));

const { TokenizerService } = await import(
  "../../../src/service/code.tokenizer.service.js"
);

describe("TokenizerService.tokenize", () => {
  beforeEach(() => {
    encodeMock.mockReset();
    getEncodingMock.mockClear();
    getEncodingNameMock.mockClear().mockReturnValue("mock-encoding");
  });

  it("코드를 토큰화하고 토큰 수를 반환한다", async () => {
    encodeMock.mockReturnValueOnce([0, 1, 2, 3]);

    const dto = CodeTokenizeRequestDto.parse({
      code: "console.log('hello');",
    });
    const result = await TokenizerService.tokenize(dto);

    expect(getEncodingNameMock).toHaveBeenCalled();
    expect(getEncodingMock).toHaveBeenCalledWith("mock-encoding");
    expect(result).toEqual({ token_count: 4 });
  });

  it("최대 토큰 수를 초과하면 예외를 던진다", async () => {
    encodeMock.mockReturnValueOnce(Array(20001).fill(0));

    const dto = CodeTokenizeRequestDto.parse({ code: "overflow" });
    await expect(TokenizerService.tokenize(dto)).rejects.toThrow(
      "허용된 토큰 수를 초과했습니다.",
    );
  });

  it("인코딩을 찾을 수 없으면 예외를 던진다", async () => {
    getEncodingNameMock.mockImplementationOnce(() => {
      throw new Error("unknown model");
    });

    const dto = CodeTokenizeRequestDto.parse({ code: "hello" });
    await expect(TokenizerService.tokenize(dto)).rejects.toThrow(
      "지원하지 않는 인코딩입니다.",
    );
  });

  it("getEncoder에서 에러 발생 시 UNSUPPORTED_ENCODING 에러를 던진다", async () => {
    getEncodingNameMock.mockReturnValueOnce("unknown-encoding");
    getEncodingMock.mockImplementationOnce(() => {
      throw new Error("encoding not found");
    });

    const dto = CodeTokenizeRequestDto.parse({ code: "hello" });
    await expect(TokenizerService.tokenize(dto)).rejects.toThrow(
      "지원하지 않는 인코딩입니다.",
    );
  });
});
