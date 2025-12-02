import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionStoreRepository } from "../../../src/repository/sessionStore.repository.js";
import { Session } from "../../../src/entity/session.entity.js";
import { HintSession } from "../../../src/entity/hintSession.entity.js";
import { SESSION_TTL_MS } from "../../../src/constants/session.constants.js";

const createStoreDouble = () => ({
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hgetall: jest.fn(),
  hmset: jest.fn(),
});

describe("SessionStoreRepository", () => {
  let store;
  let repository;

  beforeEach(() => {
    store = createStoreDouble();
    repository = new SessionStoreRepository(store);
  });

  it("getSession은 저장된 레코드를 세션으로 반환한다", async () => {
    const record = Session.create({ userId: "user-1" }).toRecord();
    store.get.mockResolvedValue(JSON.stringify(record));

    const session = await repository.getSession("user-1");

    expect(store.get).toHaveBeenCalledWith("session:user-1");
    expect(session).toBeInstanceOf(Session);
    expect(session.userId).toBe("user-1");
  });

  it("getSession은 레코드가 없으면 null을 반환한다", async () => {
    store.get.mockResolvedValue(null);

    const session = await repository.getSession("missing");

    expect(session).toBeNull();
  });

  it("saveSession은 TTL과 함께 레코드를 저장한다", async () => {
    const session = Session.create({
      userId: "user-2",
      data: { role: "admin" },
    });

    await repository.saveSession(session);

    expect(store.set).toHaveBeenCalledWith(
      "session:user-2",
      JSON.stringify(session.toRecord()),
      SESSION_TTL_MS,
    );
  });

  it("updateSession은 updater 결과를 세션으로 반환한다", async () => {
    const existing = Session.create({
      userId: "user-3",
      data: { count: 1 },
    });
    store.update.mockImplementation(async (key, handler) => {
      expect(key).toBe("session:user-3");
      return handler(JSON.stringify(existing.toRecord()));
    });

    const updated = await repository.updateSession("user-3", (session) =>
      session.withData({ count: session.data.count + 1 }),
    );

    expect(store.update).toHaveBeenCalledWith(
      "session:user-3",
      expect.any(Function),
      SESSION_TTL_MS,
    );
    expect(updated).toBeInstanceOf(Session);
    expect(updated.data.count).toBe(2);
  });

  it("updateSession은 레코드가 없으면 null을 반환한다", async () => {
    store.update.mockImplementation(async (key, handler) => handler(null));

    const updated = await repository.updateSession("user-4", (session) =>
      session.withData({ value: "noop" }),
    );

    expect(updated).toBeNull();
  });

  it("updateSession에서 updater가 null을 반환하면 세션이 제거된다", async () => {
    const existing = Session.create({ userId: "user-5" });
    store.update.mockImplementation(async (key, handler) =>
      handler(JSON.stringify(existing.toRecord())),
    );

    const updated = await repository.updateSession("user-5", () => null);

    expect(updated).toBeNull();
  });

  it("deleteSession은 저장소에서 키를 삭제한다", async () => {
    await repository.deleteSession("user-6");

    expect(store.delete).toHaveBeenCalledWith("session:user-6");
  });

  it("getSession은 code.diff를 포함한 세션을 반환한다", async () => {
    const mockDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const session = Session.create({
      userId: "user-7",
      data: {
        code: {
          full: "const x = 2;",
          diff: mockDiff,
        },
      },
    });
    const record = session.toRecord();
    store.get.mockResolvedValue(JSON.stringify(record));

    const retrieved = await repository.getSession("user-7");

    expect(store.get).toHaveBeenCalledWith("session:user-7");
    expect(retrieved).toBeInstanceOf(Session);
    expect(retrieved.userId).toBe("user-7");
    expect(retrieved.data.code.full).toBe("const x = 2;");
    expect(retrieved.data.code.diff).toBe(mockDiff);
  });

  it("saveSession은 code.diff를 포함한 세션을 저장한다", async () => {
    const mockDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const session = Session.create({
      userId: "user-8",
      data: {
        code: {
          full: "const x = 2;",
          diff: mockDiff,
        },
      },
    });

    await repository.saveSession(session);

    expect(store.set).toHaveBeenCalledWith(
      "session:user-8",
      JSON.stringify(session.toRecord()),
      SESSION_TTL_MS,
    );
    const savedRecord = store.set.mock.calls[0][1];
    expect(savedRecord.data.code.diff).toBe(mockDiff);
  });

  it("updateSession은 code.diff를 포함한 세션을 업데이트한다", async () => {
    const existingDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const existing = Session.create({
      userId: "user-9",
      data: {
        code: {
          full: "const x = 2;",
          diff: existingDiff,
        },
      },
    });
    store.update.mockImplementation(async (key, handler) => {
      expect(key).toBe("user-9");
      return handler(existing.toRecord());
    });

    const newDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 2;\n+const x = 3;";
    const updated = await repository.updateSession("user-9", (session) =>
      session.withData({
        code: {
          full: "const x = 3;",
          diff: newDiff,
        },
      }),
    );

    expect(store.update).toHaveBeenCalledWith(
      "user-9",
      expect.any(Function),
      SESSION_TTL_MS,
    );
    expect(updated).toBeInstanceOf(Session);
    expect(updated.data.code.full).toBe("const x = 3;");
    expect(updated.data.code.diff).toBe(newDiff);
  });

  describe("Hint session methods", () => {
    it("createOrResetHintSession은 Redis Hash에 세션을 저장한다", async () => {
      store.hmset.mockResolvedValue(true);

      const hintSession = await repository.createOrResetHintSession(
        "user-10",
        "problem-1",
        "js",
      );

      expect(store.hmset).toHaveBeenCalledWith(
        "user-10:problem-1",
        expect.objectContaining({
          problemId: "problem-1",
          language: "js",
        }),
        SESSION_TTL_MS,
      );
      expect(hintSession).toBeInstanceOf(HintSession);
      expect(hintSession.problemId).toBe("problem-1");
    });

    it("getHintSession은 Hash 데이터를 HintSession으로 반환한다", async () => {
      store.hgetall.mockResolvedValue({
        problemId: "problem-2",
        language: "js",
        "code.current": "console.log('test');",
        "code.diff": "",
        "code.cached": "",
        context: JSON.stringify([{ hintCnt: 1, code: "c", hint: "h" }]),
      });

      const hintSession = await repository.getHintSession(
        "user-11",
        "problem-2",
      );

      expect(store.hgetall).toHaveBeenCalledWith("user-11:problem-2");
      expect(hintSession).toBeInstanceOf(HintSession);
      expect(hintSession.context).toHaveLength(1);
    });

    it("updateHintSessionCode는 저장소에 Hash를 기록한다", async () => {
      const getSpy = jest
        .spyOn(repository, "getHintSession")
        .mockResolvedValue(
          new HintSession({
            userId: "user-12",
            problemId: "problem-3",
            language: "js",
            code: { current: "old", diff: "", cached: "" },
            context: [],
          }),
        );

      store.hmset.mockResolvedValue(true);

      await repository.updateHintSessionCode(
        "user-12",
        "problem-3",
        "new",
        "js",
      );

      expect(getSpy).toHaveBeenCalledWith("user-12", "problem-3");
      expect(store.hmset).toHaveBeenCalledWith(
        "user-12:problem-3",
        expect.objectContaining({
          "code.current": "new",
        }),
        SESSION_TTL_MS,
      );
    });

    it("addHintContextItem은 컨텍스트를 추가한다", async () => {
      jest.spyOn(repository, "getHintSession").mockResolvedValue(
        new HintSession({
          userId: "user-13",
          problemId: "problem-4",
          language: "js",
          code: { current: "code", diff: "", cached: "" },
          context: [],
        }),
      );
      store.hmset.mockResolvedValue(true);

      await repository.addHintContextItem("user-13", "problem-4", {
        hintCnt: 1,
        code: "code",
        hint: "hint",
        cursor: [0, 0],
      });

      expect(store.hmset).toHaveBeenCalledWith(
        "user-13:problem-4",
        expect.objectContaining({
          context: expect.stringContaining('"hintCnt":1'),
        }),
        SESSION_TTL_MS,
      );
    });
  });
});

