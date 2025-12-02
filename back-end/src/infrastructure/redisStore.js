import Redis from "ioredis";
import env from "../config/env.config.js";

export class RedisStore {
  #client;

  constructor(options = {}) {
    const redisOptions = {
      url: options.url || env.redis.url,
      username: options.username ?? env.redis.username,
      password: options.password ?? env.redis.password,
      db: options.db ?? env.redis.db,
    };

    const ioredisOptions = {
      db: redisOptions.db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    };

    if (redisOptions.username) {
      ioredisOptions.username = redisOptions.username;
    }
    if (redisOptions.password) {
      ioredisOptions.password = redisOptions.password;
    }

    this.#client = new Redis(redisOptions.url, ioredisOptions);

    this.#client.on("error", (error) => {
      console.error("[RedisStore] Connection error:", error);
    });
  }

  async #ensureConnection() {
    /**
     * ioredis status 참고:
     * "end", "wait", "connecting", "connect", "ready", "close", "reconnecting"
     */

    // 이미 연결되었거나 연결 시도 중이면 재연결 불필요
    if (
      this.#client.status === "ready" ||
      this.#client.status === "connecting" ||
      this.#client.status === "connect" ||
      this.#client.status === "reconnecting"
    ) {
      return;
    }

    // 그 외 상태(end, close, wait 등) → connect 가능
    await this.#client.connect();
  }

  async get(key) {
    await this.#ensureConnection();
    return this.#client.get(key);
  }

  async set(key, value, ttlMs) {
    await this.#ensureConnection();
    const payload =
      typeof value === "string" || value instanceof Buffer
        ? value
        : JSON.stringify(value);

    if (ttlMs) {
      await this.#client.set(key, payload, "PX", ttlMs);
    } else {
      await this.#client.set(key, payload);
    }
    return true;
  }

  async delete(key) {
    await this.#ensureConnection();
    await this.#client.del(key);
  }

  async update(key, updater, ttlMs) {
    await this.#ensureConnection();
    const current = await this.#client.get(key);
    const next = await updater(current);
    if (next === null || next === undefined) {
      await this.delete(key);
      return null;
    }
    await this.set(key, next, ttlMs);
    return next;
  }

  async hgetall(key) {
    await this.#ensureConnection();
    const hash = await this.#client.hgetall(key);
    if (!hash || Object.keys(hash).length === 0) {
      return null;
    }
    return hash;
  }

  async hmset(key, values, ttlMs) {
    await this.#ensureConnection();
    const pipeline = this.#client.multi();
    if (values && Object.keys(values).length > 0) {
      pipeline.hset(key, values);
    } else {
      pipeline.del(key);
    }
    if (ttlMs) {
      pipeline.pexpire(key, ttlMs);
    }
    await pipeline.exec();
    return true;
  }

  async quit() {
    if (this.#client && this.#client.status !== "end") {
      await this.#client.quit();
    }
  }

  async disconnect() {
    if (this.#client) {
      this.#client.disconnect();
    }
  }
}