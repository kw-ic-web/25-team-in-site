import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { createTwoFilesPatch } from "diff";
import { SessionService } from "../../../src/service/session.service.js";
import { SessionStoreRepository } from "../../../src/repository/sessionStore.repository.js";
import { Session } from "../../../src/entity/session.entity.js";
import { SESSION_TTL_MS } from "../../../src/constants/session.constants.js";

const createRepositoryMock = () => ({
  getSession: jest.fn(),
  saveSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
});

describe("SessionService.createSession", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new SessionService(repository);
    jest.restoreAllMocks();
  });

  it("기존 세션이 없으면 새 세션을 생성한다", async () => {
    repository.getSession.mockResolvedValue(null);
    repository.saveSession.mockResolvedValue(undefined);

    const createDto = {
      userId: "user-1",
      data: { role: "member" },
    };

    const result = await service.createSession(createDto);

    expect(repository.getSession).toHaveBeenCalledWith("user-1");
    expect(repository.saveSession).toHaveBeenCalled();
    const savedSession = repository.saveSession.mock.calls[0][0];
    expect(savedSession).toBeInstanceOf(Session);
    expect(savedSession.userId).toBe("user-1");
    expect(savedSession.data).toEqual({ role: "member" });
    expect(result).toBeDefined();
  });

  it("기존 세션이 있으면 데이터를 병합한다", async () => {
    const existingSession = Session.create({
      userId: "user-2",
      data: { role: "admin", count: 1 },
    });
    repository.getSession.mockResolvedValue(existingSession);
    repository.saveSession.mockResolvedValue(undefined);

    const createDto = {
      userId: "user-2",
      data: { count: 2 },
    };

    const result = await service.createSession(createDto);

    expect(repository.saveSession).toHaveBeenCalled();
    const savedSession = repository.saveSession.mock.calls[0][0];
    expect(savedSession.data).toEqual({ role: "admin", count: 2 });
    expect(result).toBeDefined();
  });
});

describe("SessionService.getSession", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new SessionService(repository);
    jest.restoreAllMocks();
  });

  it("세션을 조회하고 TTL을 갱신한다", async () => {
    const existingSession = Session.create({
      userId: "user-3",
      data: { token: "abc" },
    });
    repository.updateSession.mockResolvedValue(existingSession);

    const result = await service.getSession("user-3");

    expect(repository.updateSession).toHaveBeenCalledWith(
      "user-3",
      expect.any(Function),
    );
    expect(result).toBeDefined();
  });

  it("세션이 없으면 null을 반환한다", async () => {
    repository.updateSession.mockResolvedValue(null);

    const result = await service.getSession("missing");

    expect(result).toBeNull();
  });
});

describe("SessionService.updateSessionData", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new SessionService(repository);
    jest.restoreAllMocks();
  });

  it("코드가 변경되면 diff를 생성한다", async () => {
    const oldCode = "const x = 1;";
    const newCode = "const x = 2;";
    const existingSession = Session.create({
      userId: "user-4",
      data: {
        code: {
          full: oldCode,
          diff: null,
        },
      },
    });

    repository.updateSession.mockImplementation(async (userId, updater) => {
      const updated = updater(existingSession);
      return updated;
    });

    const updateDto = {
      data: {
        code: {
          full: newCode,
        },
      },
    };

    const result = await service.updateSessionData("user-4", updateDto);

    expect(repository.updateSession).toHaveBeenCalledWith(
      "user-4",
      expect.any(Function),
    );
    expect(result).toBeDefined();
    const updatedSession = repository.updateSession.mock.calls[0][1](
      existingSession,
    );
    expect(updatedSession.data.code.full).toBe(newCode);
    expect(updatedSession.data.code.diff).toBeTruthy();
    // 실제 createTwoFilesPatch로 생성된 diff와 동일한지 확인
    const expectedDiff = createTwoFilesPatch("code", "code", oldCode, newCode);
    expect(updatedSession.data.code.diff).toBe(expectedDiff);
  });

  it("코드가 변경되지 않으면 기존 diff를 유지한다", async () => {
    const existingDiff = "--- code\n+++ code\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;";
    const existingSession = Session.create({
      userId: "user-5",
      data: {
        code: {
          full: "const x = 2;",
          diff: existingDiff,
        },
      },
    });

    repository.updateSession.mockImplementation(async (userId, updater) => {
      const updated = updater(existingSession);
      return updated;
    });

    const updateDto = {
      data: {
        code: {
          full: "const x = 2;", // 동일한 코드
        },
      },
    };

    const result = await service.updateSessionData("user-5", updateDto);

    const updatedSession = repository.updateSession.mock.calls[0][1](
      existingSession,
    );
    expect(updatedSession.data.code.diff).toBe(existingDiff);
    expect(result).toBeDefined();
  });

  it("기존 코드가 없으면 diff를 생성하지 않는다", async () => {
    const existingSession = Session.create({
      userId: "user-6",
      data: {},
    });

    repository.updateSession.mockImplementation(async (userId, updater) => {
      const updated = updater(existingSession);
      return updated;
    });

    const updateDto = {
      data: {
        code: {
          full: "const x = 1;",
        },
      },
    };

    const result = await service.updateSessionData("user-6", updateDto);

    const updatedSession = repository.updateSession.mock.calls[0][1](
      existingSession,
    );
    expect(updatedSession.data.code.full).toBe("const x = 1;");
    expect(updatedSession.data.code.diff).toBeUndefined();
    expect(result).toBeDefined();
  });

  it("code.diff를 포함한 복잡한 데이터를 업데이트한다", async () => {
    const oldCode = "const x = 2;";
    const newCode = "const x = 3;";
    const existingDiff = createTwoFilesPatch("code", "code", "const x = 1;", oldCode);
    const existingSession = Session.create({
      userId: "user-7",
      data: {
        code: {
          full: oldCode,
          diff: existingDiff,
        },
        otherData: "value",
      },
    });

    repository.updateSession.mockImplementation(async (userId, updater) => {
      const updated = updater(existingSession);
      return updated;
    });

    const updateDto = {
      data: {
        code: {
          full: newCode,
        },
        otherData: "updated",
      },
    };

    const result = await service.updateSessionData("user-7", updateDto);

    const updatedSession = repository.updateSession.mock.calls[0][1](
      existingSession,
    );
    expect(updatedSession.data.code.full).toBe(newCode);
    expect(updatedSession.data.code.diff).toBeTruthy();
    // 실제 createTwoFilesPatch로 생성된 diff와 동일한지 확인
    const expectedDiff = createTwoFilesPatch("code", "code", oldCode, newCode);
    expect(updatedSession.data.code.diff).toBe(expectedDiff);
    expect(updatedSession.data.otherData).toBe("updated");
    expect(result).toBeDefined();
  });

  it("세션이 없으면 null을 반환한다", async () => {
    repository.updateSession.mockResolvedValue(null);

    const updateDto = {
      data: { code: { full: "new code" } },
    };

    const result = await service.updateSessionData("missing", updateDto);

    expect(result).toBeNull();
  });
});

describe("SessionService.deleteSession", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new SessionService(repository);
    jest.restoreAllMocks();
  });

  it("세션을 삭제한다", async () => {
    repository.deleteSession.mockResolvedValue(undefined);

    await service.deleteSession("user-8");

    expect(repository.deleteSession).toHaveBeenCalledWith("user-8");
  });
});

