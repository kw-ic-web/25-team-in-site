import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const rootDir = process.cwd();
const devEnvPath = path.resolve(rootDir, "development.env");
const prodEnvPath = path.resolve(rootDir, "production.env");

const envFilePath = fs.existsSync(devEnvPath) ? devEnvPath : prodEnvPath;
const envLabel = process.env.NODE_ENV === "test"
  ? "test"
  : envFilePath === devEnvPath
    ? "development"
    : "production";

dotenv.config({ path: envFilePath });

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not set");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

const defaultRedisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const defaultRedisDb = Number(process.env.REDIS_DB ?? 0);
const defaultRedisTestDb = Number(process.env.REDIS_DB_TEST ?? 1);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisUsername = process.env.REDIS_USERNAME || undefined;

const resolvedRedisDb = envLabel === "test" ? defaultRedisTestDb : defaultRedisDb;

export default {
  env: envLabel,
  port: Number(process.env.PORT) || 20991, // 없을시 Development 환경으로 배포.
  databaseUrl: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  redis: {
    url: defaultRedisUrl,
    username: redisUsername,
    password: redisPassword,
    db: resolvedRedisDb,
    defaultDb: defaultRedisDb,
    testDb: defaultRedisTestDb,
  },
};
