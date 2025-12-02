import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const rootDir = process.cwd();
const devEnvPath = path.resolve(rootDir, "development.env");
const prodEnvPath = path.resolve(rootDir, "production.env");
const hotfixEnvPath = path.resolve(rootDir, "hotfixTest.env");

let envFilePath;
if (fs.existsSync(devEnvPath)) {
  envFilePath = devEnvPath;
} else if (fs.existsSync(prodEnvPath)) {
  envFilePath = prodEnvPath;
} else if (fs.existsSync(hotfixEnvPath)) {
  envFilePath = hotfixEnvPath;
}

let envLabel;
if (process.env.NODE_ENV === "test") {
  envLabel = "test";
} else if (envFilePath === devEnvPath) {
  envLabel = "development";
} else if (envFilePath === prodEnvPath) {
  envLabel = "production";
} else if (envFilePath === hotfixEnvPath) {
  envLabel = "hotfix";
}

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

const resolvedRedisDb =
  envLabel === "test" ? defaultRedisTestDb : defaultRedisDb;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : envLabel === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
      ]
    : [];

export default {
  env: envLabel,
  port: Number(process.env.PORT) || 20991, // 없을시 Development 환경으로 배포.
  databaseUrl: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  cors: {
    origin: corsOrigin,
  },
  redis: {
    url: defaultRedisUrl,
    username: redisUsername,
    password: redisPassword,
    db: resolvedRedisDb,
    defaultDb: defaultRedisDb,
    testDb: defaultRedisTestDb,
  },
};
