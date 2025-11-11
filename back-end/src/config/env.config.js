import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const rootDir = process.cwd();
const devEnvPath = path.resolve(rootDir, "development.env");
const prodEnvPath = path.resolve(rootDir, "production.env");

const envFilePath = fs.existsSync(devEnvPath) ? devEnvPath : prodEnvPath;
const envLabel = envFilePath === devEnvPath ? "development" : "production";

dotenv.config({ path: envFilePath });

export default {
  env: envLabel,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
};
