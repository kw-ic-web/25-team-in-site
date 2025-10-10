import path from "path";
import dotenv from "dotenv";

const envFile = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envFile });

export default {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
};
