import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL_TEST ||
  process.env.REDIS_URL ||
  "redis://127.0.0.1:6379";
const redisDb = Number(process.env.REDIS_DB_TEST ?? 1);

const redisClient = new Redis(redisUrl, {
  db: redisDb,
  username: process.env.REDIS_USERNAME || undefined,
  password: process.env.REDIS_PASSWORD || undefined,
});

beforeAll(async () => {
  await redisClient.select(redisDb);
  await redisClient.flushdb();
});

afterEach(async () => {
  await redisClient.flushdb();
});

afterAll(async () => {
  await redisClient.quit();
});

