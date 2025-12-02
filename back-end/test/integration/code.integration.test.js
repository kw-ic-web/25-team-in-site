import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  appRequest,
  setupTestDBHooks,
  createAuthenticatedUser,
} from "../utils/test-helpers.js";
import { sessionStoreRepository } from "../../src/repository/sessionStore.repository.js";

setupTestDBHooks();

describe("Code API Integration", () => {
  let cookie;
  let user;

  beforeEach(async () => {
    const created = await createAuthenticatedUser({
      user_id: `code_integration_${Date.now()}`,
    });
    user = created.user;
    cookie = created.cookie;
  });

  it("POST /api/v1/code/ → 코드를 저장하고 이후 조회 가능하다", async () => {
    const code = "console.log('integration test');";
    const language = "js";
    const problemId = "integration-problem-1";

    // 코드 저장
    const saveRes = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", cookie)
      .send({ problemId, code, language });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);

    // 저장된 코드 조회
    const savedSession = await sessionStoreRepository.getHintSession(
      user.user_id,
      problemId,
    );
    expect(savedSession).not.toBeNull();
    expect(savedSession.code.current).toBe(code);
    expect(savedSession.language).toBe(language);
    expect(savedSession.userId).toBe(user.user_id);
  });

  it("POST /api/v1/code/ → 코드를 여러 번 저장하면 diff가 계산된다", async () => {
    const firstCode = "console.log('first');";
    const secondCode = "console.log('second');";
    const language = "js";
    const problemId = "integration-problem-2";

    // 첫 번째 코드 저장
    const firstRes = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", cookie)
      .send({ problemId, code: firstCode, language });

    expect(firstRes.status).toBe(200);

    // 두 번째 코드 저장 (cachedCode가 설정되지 않았으므로 diff는 빈 문자열)
    const secondRes = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", cookie)
      .send({ problemId, code: secondCode, language });

    expect(secondRes.status).toBe(200);

    // 저장된 코드 확인
    const savedSession = await sessionStoreRepository.getHintSession(
      user.user_id,
      problemId,
    );
    expect(savedSession.code.current).toBe(secondCode);
    expect(savedSession.language).toBe(language);
    expect(savedSession.code.diff).toBe("");
  });

  it("POST /api/v1/code/ → js와 py 언어를 저장할 수 있다", async () => {
    const languages = ["js", "py"];
    const baseProblemId = "integration-problem-lang";

    for (const lang of languages) {
      const code = `// ${lang} code`;
      const problemId = `${baseProblemId}-${lang}`;
      const res = await appRequest()
        .post("/api/v1/code/")
        .set("Cookie", cookie)
        .send({ problemId, code, language: lang });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const savedSession = await sessionStoreRepository.getHintSession(
        user.user_id,
        problemId,
      );
      expect(savedSession.language).toBe(lang);
      expect(savedSession.code.current).toBe(code);
    }
  });

  it("POST /api/v1/code/ → 빈 코드도 저장할 수 있다", async () => {
    const problemId = "integration-problem-empty";
    const res = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", cookie)
      .send({ problemId, code: "", language: "js" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const savedSession = await sessionStoreRepository.getHintSession(
      user.user_id,
      problemId,
    );
    expect(savedSession.code.current).toBe("");
    expect(savedSession.language).toBe("js");
  });

  it("POST /api/v1/code/ → 여러 사용자가 각각 코드를 저장할 수 있다", async () => {
    const user1 = await createAuthenticatedUser({
      user_id: `code_user1_${Date.now()}`,
    });
    const user2 = await createAuthenticatedUser({
      user_id: `code_user2_${Date.now()}`,
    });

    const code1 = "console.log('user1');";
    const code2 = "console.log('user2');";

    // 사용자 1 코드 저장
    const res1 = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", user1.cookie)
      .send({ problemId: "problem-user1", code: code1, language: "js" });

    expect(res1.status).toBe(200);

    // 사용자 2 코드 저장
    const res2 = await appRequest()
      .post("/api/v1/code/")
      .set("Cookie", user2.cookie)
      .send({ problemId: "problem-user2", code: code2, language: "py" });

    expect(res2.status).toBe(200);

    // 각 사용자의 코드가 독립적으로 저장되었는지 확인
    const savedCode1 = await sessionStoreRepository.getHintSession(
      user1.user.user_id,
      "problem-user1",
    );
    const savedCode2 = await sessionStoreRepository.getHintSession(
      user2.user.user_id,
      "problem-user2",
    );

    expect(savedCode1.code.current).toBe(code1);
    expect(savedCode1.language).toBe("js");
    expect(savedCode2.code.current).toBe(code2);
    expect(savedCode2.language).toBe("py");
  });
});

