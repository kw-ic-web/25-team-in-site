import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app.js";
import config from "../../src/config/env.config.js";
import {
  initTestMongo,
  clearTestDatabase,
  closeTestMongo,
} from "./db-setup.js";
import {
  createUser,
  createProblemWithDetail,
  createSolvedRecord,
} from "./test-data.js";

export const setupTestDBHooks = () => {
  beforeAll(async () => {
    await initTestMongo();
  });

  afterEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestMongo();
  });
};

export const appRequest = () => request(app);

export const createAuthCookie = (userId) => {
  const token = jwt.sign({ user_id: userId }, config.jwtSecret, {
    noTimestamp: true,
  });
  return `token=${token}`;
};

export const createAuthenticatedUser = async (overrides = {}) => {
  const user = await createUser(overrides);
  const cookie = createAuthCookie(user.user_id);
  return { user, cookie };
};

export const seedProblemWithDetail = createProblemWithDetail;
export const seedSolvedRecord = createSolvedRecord;

export const seedSolvedProblems = async ({ user, count = 1 }) => {
  const problems = [];

  for (let i = 0; i < count; i += 1) {
    const { problem } = await createProblemWithDetail({
      problem_difficulty: (i % 5) + 1,
      problem_lang: ["JavaScript", "Python"].slice(0, (i % 2) + 1),
    });
    problems.push(problem);
    await createSolvedRecord({
      user,
      problem,
      language: "JavaScript",
    });
  }

  return problems;
};
