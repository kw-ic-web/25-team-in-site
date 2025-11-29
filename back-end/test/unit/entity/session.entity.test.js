import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Session } from "../../../src/entity/session.entity.js";
import { SESSION_TTL_MS } from "../../../src/constants/session.constants.js";

describe("Session entity", () => {
  const baseDate = new Date("2024-01-01T00:00:00.000Z");

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("create는 기본 TTL과 데이터를 적용한다", () => {
    const session = Session.create({
      userId: "user-1",
      data: { role: "member" },
    });

    expect(session.userId).toBe("user-1");
    expect(session.data).toEqual({ role: "member" });
    expect(session.createdAt.toISOString()).toBe(baseDate.toISOString());
    expect(session.expiresAt.getTime() - session.createdAt.getTime()).toBe(
      SESSION_TTL_MS,
    );
  });

  it("create는 전달된 ttlMs를 우선한다", () => {
    const session = Session.create({
      userId: "user-ttl",
      ttlMs: 5000,
    });

    expect(session.expiresAt.getTime()).toBe(baseDate.getTime() + 5000);
  });

  it("fromRecord는 유효한 레코드를 세션으로 복원한다", () => {
    const original = Session.create({
      userId: "user-2",
      data: { token: "abc" },
      ttlMs: 1000,
    });

    const restored = Session.fromRecord(original.toRecord());

    expect(restored).toBeInstanceOf(Session);
    expect(restored.userId).toBe(original.userId);
    expect(restored.data).toEqual(original.data);
    expect(restored.expiresAt.getTime()).toBe(original.expiresAt.getTime());
  });

  it("fromRecord는 날짜가 잘못되면 null을 반환한다", () => {
    const record = {
      userId: "broken",
      data: {},
      createdAt: "not-a-date",
      expiresAt: "still-not-a-date",
    };

    expect(Session.fromRecord(record)).toBeNull();
    expect(Session.fromRecord(null)).toBeNull();
  });

  it("withData는 데이터를 병합하고 TTL을 갱신한다", () => {
    const baseSession = Session.create({
      userId: "user-3",
      data: { score: 1 },
    });

    const nextMoment = new Date("2024-01-01T03:00:00.000Z");
    jest.setSystemTime(nextMoment);

    const patched = baseSession.withData({ badge: "gold" }, 2000);

    expect(patched.data).toEqual({ score: 1, badge: "gold" });
    expect(patched.createdAt).toBe(baseSession.createdAt);
    expect(patched.expiresAt.getTime()).toBe(nextMoment.getTime() + 2000);
  });

  it("refresh는 데이터 유지한 채 만료 시간을 연장한다", () => {
    const baseSession = Session.create({
      userId: "user-4",
      data: { count: 1 },
    });

    const refreshedMoment = new Date("2024-01-02T00:00:00.000Z");
    jest.setSystemTime(refreshedMoment);

    const refreshed = baseSession.refresh(3000);

    expect(refreshed.data).toEqual(baseSession.data);
    expect(refreshed.createdAt).toBe(baseSession.createdAt);
    expect(refreshed.expiresAt.getTime()).toBe(
      refreshedMoment.getTime() + 3000,
    );
  });

  it("isValid는 만료 여부를 판단한다", () => {
    const session = new Session({
      userId: "user-5",
      data: {},
      createdAt: baseDate,
      expiresAt: new Date(baseDate.getTime() + 1000),
    });

    expect(session.isValid(baseDate)).toBe(true);
    expect(session.isValid(new Date(baseDate.getTime() + 999))).toBe(true);
    expect(session.isValid(new Date(baseDate.getTime() + 1000))).toBe(false);
  });

  it("toRecord는 ISO 문자열을 반환한다", () => {
    const session = Session.create({
      userId: "user-6",
      data: { lang: "js" },
      ttlMs: 2500,
    });

    const record = session.toRecord();

    expect(record).toEqual({
      userId: "user-6",
      data: { lang: "js" },
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    });
  });

  it("withData는 code.diff를 포함한 복잡한 데이터 구조를 처리한다", () => {
    const baseSession = Session.create({
      userId: "user-7",
      data: {
        code: {
          full: "const x = 1;",
          diff: null,
        },
      },
    });

    const nextMoment = new Date("2024-01-01T04:00:00.000Z");
    jest.setSystemTime(nextMoment);

    const mockDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const patched = baseSession.withData(
      {
        code: {
          full: "const x = 2;",
          diff: mockDiff,
        },
      },
      2000,
    );

    expect(patched.data.code.full).toBe("const x = 2;");
    expect(patched.data.code.diff).toBe(mockDiff);
    expect(patched.expiresAt.getTime()).toBe(nextMoment.getTime() + 2000);
  });

  it("fromRecord는 code.diff를 포함한 레코드를 복원한다", () => {
    const mockDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const original = Session.create({
      userId: "user-8",
      data: {
        code: {
          full: "const x = 2;",
          diff: mockDiff,
        },
      },
      ttlMs: 1000,
    });

    const restored = Session.fromRecord(original.toRecord());

    expect(restored).toBeInstanceOf(Session);
    expect(restored.userId).toBe(original.userId);
    expect(restored.data.code.full).toBe("const x = 2;");
    expect(restored.data.code.diff).toBe(mockDiff);
  });
});

