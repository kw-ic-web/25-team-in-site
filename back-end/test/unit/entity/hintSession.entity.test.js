import { describe, it, expect } from "@jest/globals";
import { HintSession } from "../../../src/entity/hintSession.entity.js";

describe("HintSession entity", () => {
  describe("constructor", () => {
    it("기본값으로 HintSession을 생성한다", () => {
      const session = new HintSession({ userId: "user-1" });

      expect(session.userId).toBe("user-1");
      expect(session.problemId).toBe("");
      expect(session.language).toBe("");
      expect(session.code).toEqual({ current: "", diff: "", cached: "" });
      expect(session.context).toEqual([]);
    });

    it("모든 필드를 지정하여 HintSession을 생성한다", () => {
      const session = new HintSession({
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "const x = 1;",
          diff: "diff content",
          cached: "cached content",
        },
        context: [{ hintCnt: 1, code: "code", hint: "hint", cursor: [0, 0] }],
      });

      expect(session.userId).toBe("user-1");
      expect(session.problemId).toBe("problem-1");
      expect(session.language).toBe("javascript");
      expect(session.code.current).toBe("const x = 1;");
      expect(session.code.diff).toBe("diff content");
      expect(session.code.cached).toBe("cached content");
      expect(session.context).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("기본값으로 HintSession을 생성한다", () => {
      const session = HintSession.create({ userId: "user-1" });

      expect(session).toBeInstanceOf(HintSession);
      expect(session.userId).toBe("user-1");
      expect(session.problemId).toBe("");
      expect(session.language).toBe("");
      expect(session.code).toEqual({ current: "", diff: "", cached: "" });
      expect(session.context).toEqual([]);
    });

    it("모든 필드를 지정하여 HintSession을 생성한다", () => {
      const code = { current: "code", diff: "diff", cached: "cached" };
      const context = [{ hintCnt: 1, code: "c", hint: "h", cursor: [0, 0] }];

      const session = HintSession.create({
        userId: "user-1",
        problemId: "problem-1",
        language: "python",
        code,
        context,
      });

      expect(session.userId).toBe("user-1");
      expect(session.problemId).toBe("problem-1");
      expect(session.language).toBe("python");
      expect(session.code).toEqual(code);
      expect(session.context).toEqual(context);
    });

    it("code가 없으면 기본값을 사용한다", () => {
      const session = HintSession.create({ userId: "user-1" });

      expect(session.code).toEqual({ current: "", diff: "", cached: "" });
    });
  });

  describe("fromRecord", () => {
    it("유효한 레코드로 HintSession을 복원한다", () => {
      const record = {
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "const x = 1;",
          diff: "diff",
          cached: "cached",
        },
        context: [{ hintCnt: 1, code: "code", hint: "hint", cursor: [0, 0] }],
      };

      const session = HintSession.fromRecord(record);

      expect(session).toBeInstanceOf(HintSession);
      expect(session.userId).toBe("user-1");
      expect(session.problemId).toBe("problem-1");
      expect(session.language).toBe("javascript");
      expect(session.code).toEqual(record.code);
      expect(session.context).toEqual(record.context);
    });

    it("null이나 undefined 레코드는 null을 반환한다", () => {
      expect(HintSession.fromRecord(null)).toBeNull();
      expect(HintSession.fromRecord(undefined)).toBeNull();
    });

    it("부분적인 필드가 없어도 기본값으로 처리한다", () => {
      const record = {
        userId: "user-1",
      };

      const session = HintSession.fromRecord(record);

      expect(session.problemId).toBe("");
      expect(session.language).toBe("");
      expect(session.code).toEqual({ current: "", diff: "", cached: "" });
      expect(session.context).toEqual([]);
    });

    it("context가 배열이 아니면 빈 배열로 처리한다", () => {
      const record = {
        userId: "user-1",
        context: "not an array",
      };

      const session = HintSession.fromRecord(record);

      expect(session.context).toEqual([]);
    });
  });

  describe("updateCode", () => {
    it("코드와 언어를 업데이트한다", () => {
      const session = new HintSession({
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "const x = 1;",
          diff: "old diff",
          cached: "cached code",
        },
        context: [],
      });

      const updated = session.updateCode("const y = 2;", "python");

      expect(updated).toBeInstanceOf(HintSession);
      expect(updated.code.current).toBe("const y = 2;");
      expect(updated.code.diff).toBe("old diff");
      expect(updated.code.cached).toBe("cached code");
      expect(updated.language).toBe("python");
      expect(updated.userId).toBe("user-1");
      expect(updated.problemId).toBe("problem-1");
    });

    it("언어를 지정하지 않으면 기존 언어를 유지한다", () => {
      const session = new HintSession({
        userId: "user-1",
        language: "javascript",
        code: { current: "old", diff: "", cached: "" },
      });

      const updated = session.updateCode("new code");

      expect(updated.language).toBe("javascript");
      expect(updated.code.current).toBe("new code");
    });

    it("cached 코드가 없으면 빈 문자열을 사용한다", () => {
      const session = new HintSession({
        userId: "user-1",
        code: { current: "", diff: "", cached: "" },
      });

      const updated = session.updateCode("new code");

      expect(updated.code.cached).toBe("");
    });
  });

  describe("setDiff", () => {
    it("diff를 설정한다", () => {
      const session = new HintSession({
        userId: "user-1",
        code: {
          current: "const x = 1;",
          diff: "old diff",
          cached: "cached",
        },
      });

      const updated = session.setDiff("new diff");

      expect(updated).toBeInstanceOf(HintSession);
      expect(updated.code.diff).toBe("new diff");
      expect(updated.code.current).toBe("const x = 1;");
      expect(updated.code.cached).toBe("cached");
    });

    it("diff가 null이면 빈 문자열로 설정한다", () => {
      const session = new HintSession({
        userId: "user-1",
        code: { current: "code", diff: "old", cached: "cached" },
      });

      const updated = session.setDiff(null);

      expect(updated.code.diff).toBe("");
    });
  });

  describe("updateCachedCode", () => {
    it("cached 코드를 업데이트한다", () => {
      const session = new HintSession({
        userId: "user-1",
        code: {
          current: "const x = 1;",
          diff: "diff",
          cached: "old cached",
        },
      });

      const updated = session.updateCachedCode("new cached");

      expect(updated).toBeInstanceOf(HintSession);
      expect(updated.code.cached).toBe("new cached");
      expect(updated.code.current).toBe("const x = 1;");
      expect(updated.code.diff).toBe("diff");
    });
  });

  describe("addContextItem", () => {
    it("context에 새로운 항목을 추가한다", () => {
      const session = new HintSession({
        userId: "user-1",
        context: [
          { hintCnt: 1, code: "code1", hint: "hint1", cursor: [0, 0] },
        ],
      });

      const newItem = {
        hintCnt: 2,
        code: "code2",
        hint: "hint2",
        cursor: [1, 1],
      };

      const updated = session.addContextItem(newItem);

      expect(updated).toBeInstanceOf(HintSession);
      expect(updated.context).toHaveLength(2);
      expect(updated.context[0]).toEqual({
        hintCnt: 1,
        code: "code1",
        hint: "hint1",
        cursor: [0, 0],
      });
      expect(updated.context[1]).toEqual(newItem);
    });

    it("기존 context를 변경하지 않는다", () => {
      const originalContext = [
        { hintCnt: 1, code: "code1", hint: "hint1", cursor: [0, 0] },
      ];
      const session = new HintSession({
        userId: "user-1",
        context: originalContext,
      });

      session.addContextItem({
        hintCnt: 2,
        code: "code2",
        hint: "hint2",
        cursor: [1, 1],
      });

      expect(session.context).toHaveLength(1);
    });
  });

  describe("toRecord", () => {
    it("HintSession을 레코드로 변환한다", () => {
      const session = new HintSession({
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "const x = 1;",
          diff: "diff",
          cached: "cached",
        },
        context: [{ hintCnt: 1, code: "code", hint: "hint", cursor: [0, 0] }],
      });

      const record = session.toRecord();

      expect(record).toEqual({
        userId: "user-1",
        problemId: "problem-1",
        language: "javascript",
        code: {
          current: "const x = 1;",
          diff: "diff",
          cached: "cached",
        },
        context: [{ hintCnt: 1, code: "code", hint: "hint", cursor: [0, 0] }],
      });
    });

    it("기본값으로 생성된 세션도 레코드로 변환한다", () => {
      const session = HintSession.create({ userId: "user-1" });
      const record = session.toRecord();

      expect(record).toEqual({
        userId: "user-1",
        problemId: "",
        language: "",
        code: { current: "", diff: "", cached: "" },
        context: [],
      });
    });
  });

  describe("불변성", () => {
    it("updateCode는 새로운 인스턴스를 반환한다", () => {
      const session = new HintSession({
        userId: "user-1",
        code: { current: "old", diff: "", cached: "" },
      });

      const updated = session.updateCode("new");

      expect(updated).not.toBe(session);
      expect(session.code.current).toBe("old");
      expect(updated.code.current).toBe("new");
    });

    it("addContextItem은 새로운 인스턴스를 반환한다", () => {
      const session = new HintSession({
        userId: "user-1",
        context: [],
      });

      const updated = session.addContextItem({
        hintCnt: 1,
        code: "code",
        hint: "hint",
        cursor: [0, 0],
      });

      expect(updated).not.toBe(session);
      expect(session.context).toHaveLength(0);
      expect(updated.context).toHaveLength(1);
    });
  });
});

