import { KeyValueStore } from "./keyValueStore.js";

export class InMemoryStore extends KeyValueStore {
  constructor() {
    super();
    this.store = new Map();
    this.timeouts = new Map();
  }

  async get(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, ttlMs) {
    this.store.set(key, value);

    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    if (ttlMs) {
      const timeout = setTimeout(() => {
        this.store.delete(key);
        this.timeouts.delete(key);
      }, ttlMs);
      this.timeouts.set(key, timeout);
    }
  }

  async delete(key) {
    this.store.delete(key);
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  async update(key, updater, ttlMs) {
    // In a single-process Node.js environment, this is "atomic" enough for now.
    // For Redis, the same contract can be implemented with WATCH/MULTI/EXEC or Lua scripts.
    const prev = this.store.has(key) ? this.store.get(key) : null;
    const next = updater(prev);

    if (next === null || next === undefined) {
      await this.delete(key);
      return null;
    }

    await this.set(key, next, ttlMs);
    return next;
  }
}
