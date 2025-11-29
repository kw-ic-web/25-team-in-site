import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SessionStoreRepository } from "../../../src/repository/sessionStore.repository.js";
import { Session } from "../../../src/entity/session.entity.js";
import { SESSION_TTL_MS } from "../../../src/constants/session.constants.js";

const createStoreDouble = () => ({
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
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
    store.get.mockResolvedValue(record);

    const session = await repository.getSession("user-1");

    expect(store.get).toHaveBeenCalledWith("user-1");
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
      "user-2",
      session.toRecord(),
      SESSION_TTL_MS,
    );
  });

  it("updateSession은 updater 결과를 세션으로 반환한다", async () => {
    const existing = Session.create({
      userId: "user-3",
      data: { count: 1 },
    });
    store.update.mockImplementation(async (key, handler) => {
      expect(key).toBe("user-3");
      return handler(existing.toRecord());
    });

    const updated = await repository.updateSession("user-3", (session) =>
      session.withData({ count: session.data.count + 1 }),
    );

    expect(store.update).toHaveBeenCalledWith(
      "user-3",
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
      handler(existing.toRecord()),
    );

    const updated = await repository.updateSession("user-5", () => null);

    expect(updated).toBeNull();
  });

  it("deleteSession은 저장소에서 키를 삭제한다", async () => {
    await repository.deleteSession("user-6");

    expect(store.delete).toHaveBeenCalledWith("user-6");
  });
});

