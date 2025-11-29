import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const rootDir = process.cwd();
const devEnvPath = path.resolve(rootDir, "development.env");
const prodEnvPath = path.resolve(rootDir, "production.env");

const envFilePath = fs.existsSync(devEnvPath) ? devEnvPath : prodEnvPath;
const envLabel = envFilePath === devEnvPath ? "development" : "production";

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

export default {
  env: envLabel,
  port: Number(process.env.PORT) || 20991, // 없을시 Development 환경으로 배포.
  databaseUrl: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
};
