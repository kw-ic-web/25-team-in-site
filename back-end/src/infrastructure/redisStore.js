import Redis from "ioredis";
import env from "../config/env.config.js";
export class RedisStore {
  #client;
  #isConnected;

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

    // username이 있으면만 추가
    if (redisOptions.username) {
      ioredisOptions.username = redisOptions.username;
    }

    // password가 있으면만 추가
    if (redisOptions.password) {
      ioredisOptions.password = redisOptions.password;
    }

    this.#client = new Redis(redisOptions.url, ioredisOptions);
    this.#client.on("error", (error) => {
      console.error("[RedisStore] Connection error:", error);
    });
    this.#isConnected = false;
  }

  async #ensureConnection() {
    if (this.#isConnected) return;
    if (this.#client.status === "ready") {
      this.#isConnected = true;
      return;
    }
    await this.#client.connect();
    this.#isConnected = true;
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
    this.#isConnected = false;
  }

  async disconnect() {
    if (this.#client) {
      this.#client.disconnect();
      this.#isConnected = false;
    }
  }
}

