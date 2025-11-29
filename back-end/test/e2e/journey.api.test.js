import { describe, it, expect } from "@jest/globals";
import { randomUUID } from "crypto";
import {
  appRequest,
  setupTestDBHooks,
  seedProblemWithDetail,
  seedSolvedRecord,
} from "../utils/test-helpers.js";
import { User } from "../../src/entity/user.entity.js";

setupTestDBHooks();

describe("사용자 여정 E2E", () => {
  it("회원가입 → 로그인 → 문제 조회 → 통계 확인 플로우를 수행한다", async () => {
    const suffix = randomUUID().split("-")[0];
    const registerPayload = {
      user_id: `journey_${suffix}`,
      email: `journey_${suffix}@example.com`,
      password: "Password123!",
      language: "js",
      level: 2,
      purpose: "learn",
    };

    const registerRes = await appRequest()
      .post("/api/v1/auth/register")
      .send(registerPayload);
    expect(registerRes.status).toBe(201);
    const registerCookie = registerRes.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("token="),
    );

    const loginRes = await appRequest()
      .post("/api/v1/auth/login")
      .send({
        email: registerPayload.email.toUpperCase(),
        password: registerPayload.password,
      });
    expect(loginRes.status).toBe(200);
    const authCookie =
      loginRes.headers["set-cookie"]?.find((cookie) =>
        cookie.startsWith("token="),
      ) ?? registerCookie;

    const user = await User.findOne({ user_id: registerPayload.user_id });
    const seededProblem = await seedProblemWithDetail({
      problem_difficulty: 2,
      problem_lang: ["JavaScript"],
    });
    await seedSolvedRecord({
      user,
      problem: seededProblem.problem,
      language: "JavaScript",
    });

    const problemsRes = await appRequest()
      .get("/api/v1/problems?page=1&limit=5")
      .set("Cookie", authCookie);
    expect(problemsRes.status).toBe(200);
    expect(problemsRes.body.problems.length).toBeGreaterThan(0);

    const statsRes = await appRequest()
      .get("/api/v1/user/stats")
      .set("Cookie", authCookie);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.profile.nickname).toBe(registerPayload.user_id);
    expect(statsRes.body.profile.totalSolved).toBeGreaterThanOrEqual(1);
  });
});


