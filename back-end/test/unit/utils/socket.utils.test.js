import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  parseAndValidateMessage,
  sendMessage,
  sendErrorMessage,
} from "../../../src/utils/socket.utils.js";
import { ERROR } from "../../../src/mapper/error.mapper.js";

describe("parseAndValidateMessage", () => {
  it("유효한 JSON 메시지를 파싱하고 반환한다", () => {
    const data = Buffer.from(
      JSON.stringify({ type: "test:request", data: { test: "value" } }),
    );

    const result = parseAndValidateMessage(data);

    expect(result).toEqual({
      message: { type: "test:request", data: { test: "value" } },
    });
  });

  it("type 필드가 있는 메시지를 반환한다", () => {
    const data = Buffer.from(JSON.stringify({ type: "hint:request" }));

    const result = parseAndValidateMessage(data);

    expect(result.message.type).toBe("hint:request");
  });

  it("유효하지 않은 JSON 형식이면 에러를 던진다", () => {
    const data = Buffer.from("invalid json");

    expect(() => parseAndValidateMessage(data)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("Invalid JSON format"),
      }),
    );
  });

  it("메시지가 객체가 아니면 에러를 던진다", () => {
    const data = Buffer.from(JSON.stringify("not an object"));

    expect(() => parseAndValidateMessage(data)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("message must be an object"),
      }),
    );
  });

  it("null 메시지면 에러를 던진다", () => {
    const data = Buffer.from(JSON.stringify(null));

    expect(() => parseAndValidateMessage(data)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("message must be an object"),
      }),
    );
  });

  it("type 필드가 없으면 에러를 던진다", () => {
    const data = Buffer.from(JSON.stringify({ data: "some data" }));

    expect(() => parseAndValidateMessage(data)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("'type' field is required"),
      }),
    );
  });

  it("type 필드가 문자열이 아니면 에러를 던진다", () => {
    const data = Buffer.from(JSON.stringify({ type: 123 }));

    expect(() => parseAndValidateMessage(data)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("'type' field is required"),
      }),
    );
  });
});

describe("sendMessage", () => {
  let mockWs;

  beforeEach(() => {
    mockWs = {
      readyState: 1, // OPEN
      send: jest.fn(),
    };
  });

  it("WebSocket이 열려있을 때 메시지를 전송한다", () => {
    const response = { type: "test:response", success: true };

    const result = sendMessage(mockWs, response);

    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(response));
    expect(result).toBe(true);
  });

  it("WebSocket이 닫혀있을 때 에러를 던진다", () => {
    mockWs.readyState = 3; // CLOSED

    expect(() => sendMessage(mockWs, { type: "test" })).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("WebSocket is not open"),
      }),
    );
  });

  it("WebSocket이 연결 중일 때 에러를 던진다", () => {
    mockWs.readyState = 0; // CONNECTING

    expect(() => sendMessage(mockWs, { type: "test" })).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("WebSocket is not open"),
      }),
    );
  });

  it("send 메서드가 실패하면 에러를 던진다", () => {
    const sendError = new Error("Send failed");
    mockWs.send = jest.fn().mockImplementation(() => {
      throw sendError;
    });

    expect(() => sendMessage(mockWs, { type: "test" })).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("Send failed"),
      }),
    );
  });
});

describe("sendErrorMessage", () => {
  let mockWs;

  beforeEach(() => {
    mockWs = {
      readyState: 1, // OPEN
      send: jest.fn(),
    };
  });

  it("에러 메시지를 올바른 형식으로 전송한다", () => {
    sendErrorMessage(mockWs, "Test error message");

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "error",
        success: false,
        message: "Test error message",
      }),
    );
  });

  it("WebSocket이 닫혀있을 때 에러를 던진다", () => {
    mockWs.readyState = 3; // CLOSED

    expect(() => sendErrorMessage(mockWs, "Error")).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("WebSocket is not open"),
      }),
    );
  });

  it("send 실패 시 에러를 던진다", () => {
    const sendError = new Error("Send failed");
    mockWs.send = jest.fn().mockImplementation(() => {
      throw sendError;
    });

    expect(() => sendErrorMessage(mockWs, "Error")).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("Send failed"),
      }),
    );
  });
});

