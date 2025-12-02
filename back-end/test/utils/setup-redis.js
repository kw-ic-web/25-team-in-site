import Redis from "ioredis";
import env from "../../src/config/env.config.js";

// env.config.js가 이미 development.env를 로드하므로 그대로 사용
const redisUrl =
  process.env.REDIS_URL_TEST || env.redis.url || "redis://127.0.0.1:6379";
const redisDb = Number(process.env.REDIS_DB_TEST ?? env.redis.testDb ?? 1);

const ioredisOptions = {
  db: redisDb,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: () => null, // 재시도 안 함
};

// username이 있으면만 추가
if (env.redis.username || process.env.REDIS_USERNAME) {
  ioredisOptions.username =
    process.env.REDIS_USERNAME || env.redis.username;
}

// password가 있으면만 추가
if (env.redis.password || process.env.REDIS_PASSWORD) {
  ioredisOptions.password =
    process.env.REDIS_PASSWORD || env.redis.password;
}

const redisClient = new Redis(redisUrl, ioredisOptions);

let isRedisAvailable = false;

beforeAll(async () => {
  try {
    await redisClient.connect();
    await redisClient.select(redisDb);
    await redisClient.flushdb();
    isRedisAvailable = true;
  } catch (error) {
    console.warn(
      "[setup-redis] Redis 연결 실패. Redis를 사용하는 테스트는 스킵됩니다:",
      error.message,
    );
    isRedisAvailable = false;
  }
});

afterEach(async () => {
  if (isRedisAvailable) {
    try {
      await redisClient.flushdb();
    } catch (error) {
      // 무시
    }
  }
});

afterAll(async () => {
  if (redisClient) {
    try {
      // 모든 연결을 강제로 종료
      if (redisClient.status === "ready" || redisClient.status === "connecting") {
        await redisClient.quit();
      }
      redisClient.disconnect();
    } catch (error) {
      // 무시
    }
  }
  
  // 추가로 sessionStoreRepository의 RedisStore도 종료
  try {
    const { sessionStoreRepository } = await import(
      "../../src/repository/sessionStore.repository.js"
    );
    if (sessionStoreRepository && sessionStoreRepository.store) {
      await sessionStoreRepository.store.disconnect();
    }
  } catch (error) {
    // 무시
  }
});

