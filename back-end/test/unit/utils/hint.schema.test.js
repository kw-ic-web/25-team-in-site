import { describe, it, expect } from "@jest/globals";
import { HintSchema } from "../../../src/utils/validation/hint.schema.js";

describe("HintSchema", () => {
  describe("유효한 데이터 검증", () => {
    it("level 1과 body를 포함한 유효한 데이터를 통과시킨다", () => {
      const data = {
        level: 1,
        body: "힌트 내용입니다.",
      };

      const result = HintSchema.parse(data);

      expect(result).toEqual(data);
    });

    it("level 5와 body를 포함한 유효한 데이터를 통과시킨다", () => {
      const data = {
        level: 5,
        body: "고급 힌트 내용입니다.",
      };

      const result = HintSchema.parse(data);

      expect(result).toEqual(data);
    });

    it("모든 유효한 level (1-5)을 허용한다", () => {
      for (let level = 1; level <= 5; level++) {
        const data = {
          level,
          body: `Level ${level} 힌트`,
        };

        expect(() => HintSchema.parse(data)).not.toThrow();
      }
    });

    it("긴 body 문자열을 허용한다", () => {
      const longBody = "a".repeat(1000);
      const data = {
        level: 2,
        body: longBody,
      };

      const result = HintSchema.parse(data);

      expect(result.body).toBe(longBody);
    });

    it("빈 문자열 body를 허용한다", () => {
      const data = {
        level: 1,
        body: "",
      };

      const result = HintSchema.parse(data);

      expect(result.body).toBe("");
    });
  });

  describe("유효하지 않은 데이터 검증", () => {
    it("level이 없으면 에러를 던진다", () => {
      const data = {
        body: "힌트 내용",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("body가 없으면 에러를 던진다", () => {
      const data = {
        level: 1,
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("level이 0이면 에러를 던진다", () => {
      const data = {
        level: 0,
        body: "힌트",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("level이 6이면 에러를 던진다", () => {
      const data = {
        level: 6,
        body: "힌트",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("level이 음수이면 에러를 던진다", () => {
      const data = {
        level: -1,
        body: "힌트",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("level이 문자열이면 에러를 던진다", () => {
      const data = {
        level: "1",
        body: "힌트",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("level이 소수점이면 에러를 던진다", () => {
      const data = {
        level: 1.5,
        body: "힌트",
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("body가 문자열이 아니면 에러를 던진다", () => {
      const data = {
        level: 1,
        body: 123,
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("body가 null이면 에러를 던진다", () => {
      const data = {
        level: 1,
        body: null,
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("body가 배열이면 에러를 던진다", () => {
      const data = {
        level: 1,
        body: ["힌트"],
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("body가 객체이면 에러를 던진다", () => {
      const data = {
        level: 1,
        body: { hint: "힌트" },
      };

      expect(() => HintSchema.parse(data)).toThrow();
    });

    it("추가 필드가 있어도 통과한다 (zod의 기본 동작)", () => {
      const data = {
        level: 1,
        body: "힌트",
        extra: "field",
      };

      const result = HintSchema.parse(data);

      expect(result.level).toBe(1);
      expect(result.body).toBe("힌트");
    });
  });

  describe("safeParse", () => {
    it("유효한 데이터는 success: true를 반환한다", () => {
      const data = {
        level: 1,
        body: "힌트",
      };

      const result = HintSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it("유효하지 않은 데이터는 success: false를 반환한다", () => {
      const data = {
        level: 0,
        body: "힌트",
      };

      const result = HintSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});

