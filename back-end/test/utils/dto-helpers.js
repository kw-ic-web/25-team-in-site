import { expect } from "@jest/globals";

export const buildQuery = (params = {}) => ({ ...params });

export const buildBody = (payload = {}) => ({ ...payload });

export const expectDtoPass = (schema, rawInput) => {
  const result = schema.safeParse(rawInput);
  if (!result.success) {
    throw new Error(
      `DTO parse should have succeeded but failed: ${result.error.message}`,
    );
  }
  return result.data;
};

export const expectDtoFail = (schema, rawInput, expectedMessage) => {
  const result = schema.safeParse(rawInput);
  expect(result.success).toBe(false);
  if (expectedMessage) {
    const messages = result.error.issues.map((issue) => issue.message).join(" ");
    expect(messages).toContain(expectedMessage);
  }
  return result.error;
};


