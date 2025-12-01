import { describe, it, expect } from "@jest/globals";
import { Code } from "../../../src/entity/code.entity.js";

describe("Code entity", () => {
  it("create는 기본값으로 Code를 생성한다", () => {
    const code = Code.create({
      userId: "user-1",
    });

    expect(code.userId).toBe("user-1");
    expect(code.currentCode).toBe("");
    expect(code.cachedCode).toBe("");
    expect(code.language).toBe("");
    expect(code.diff).toBe("");
  });

  it("create는 전달된 값들을 적용한다", () => {
    const code = Code.create({
      userId: "user-2",
      currentCode: "console.log('hello')",
      cachedCode: "console.log('hi')",
      language: "javascript",
    });

    expect(code.userId).toBe("user-2");
    expect(code.currentCode).toBe("console.log('hello')");
    expect(code.cachedCode).toBe("console.log('hi')");
    expect(code.language).toBe("javascript");
    expect(code.diff).toBe("");
  });

  it("fromRecord는 유효한 레코드를 Code로 복원한다", () => {
    const original = Code.create({
      userId: "user-3",
      currentCode: "code1",
      cachedCode: "code0",
      language: "python",
    });
    original.setDiff("some diff");

    const restored = Code.fromRecord(original.toRecord());

    expect(restored).toBeInstanceOf(Code);
    expect(restored.userId).toBe(original.userId);
    expect(restored.currentCode).toBe(original.currentCode);
    expect(restored.cachedCode).toBe(original.cachedCode);
    expect(restored.language).toBe(original.language);
    expect(restored.diff).toBe(original.diff);
  });

  it("fromRecord는 null이면 null을 반환한다", () => {
    expect(Code.fromRecord(null)).toBeNull();
  });

  it("fromRecord는 누락된 필드를 기본값으로 처리한다", () => {
    const record = {
      userId: "user-4",
    };

    const code = Code.fromRecord(record);

    expect(code.userId).toBe("user-4");
    expect(code.currentCode).toBe("");
    expect(code.cachedCode).toBe("");
    expect(code.language).toBe("");
    expect(code.diff).toBe("");
  });

  it("setDiff는 diff를 설정한다", () => {
    const code = Code.create({
      userId: "user-5",
      currentCode: "code",
    });

    const updated = code.setDiff("diff string");

    expect(updated.diff).toBe("diff string");
    expect(updated.userId).toBe(code.userId);
    expect(updated.currentCode).toBe(code.currentCode);
    expect(updated.cachedCode).toBe(code.cachedCode);
  });

  it("setDiff는 빈 문자열을 전달하면 빈 문자열로 설정한다", () => {
    const code = Code.create({
      userId: "user-6",
    });
    code.setDiff("previous diff");

    const updated = code.setDiff("");

    expect(updated.diff).toBe("");
  });

  it("updateCode는 currentCode와 language를 업데이트한다", () => {
    const code = Code.create({
      userId: "user-7",
      currentCode: "old code",
      language: "javascript",
      cachedCode: "cached",
    });
    const codeWithDiff = code.setDiff("some diff");

    const updated = codeWithDiff.updateCode("new code", "python");

    expect(updated.currentCode).toBe("new code");
    expect(updated.language).toBe("python");
    expect(updated.cachedCode).toBe("cached"); // cachedCode는 유지
    expect(updated.diff).toBe("some diff"); // diff는 유지
  });

  it("updateCachedCode는 cachedCode를 업데이트한다", () => {
    const code = Code.create({
      userId: "user-8",
      currentCode: "current",
      cachedCode: "old cached",
      language: "javascript",
    });
    const codeWithDiff = code.setDiff("some diff");

    const updated = codeWithDiff.updateCachedCode("new cached");

    expect(updated.cachedCode).toBe("new cached");
    expect(updated.currentCode).toBe("current"); // currentCode는 유지
    expect(updated.language).toBe("javascript"); // language는 유지
    expect(updated.diff).toBe("some diff"); // diff는 유지
  });

  it("toRecord는 모든 필드를 포함한 객체를 반환한다", () => {
    const code = Code.create({
      userId: "user-9",
      currentCode: "code",
      cachedCode: "cached",
      language: "typescript",
    });
    const updated = code.setDiff("diff content");

    const record = updated.toRecord();

    expect(record).toEqual({
      userId: "user-9",
      currentCode: "code",
      cachedCode: "cached",
      language: "typescript",
      diff: "diff content",
    });
  });
});

