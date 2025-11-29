import { InMemoryStore } from "./inMemoryStore.js";

export const STORE_TOKENS = {
  KEY_VALUE_STORE: Symbol("KEY_VALUE_STORE"),
};

class StoreModuleRegistry {
  constructor() {
    this.providers = new Map();
    this.providers.set(STORE_TOKENS.KEY_VALUE_STORE, new InMemoryStore());
  }

  /**
   * Register a provider for a given token.
   * Easily swappable to Redis by registering a RedisStore instead.
   * @param {symbol} token
   * @param {import("./keyValueStore.js").KeyValueStore} provider
   */
  register(token, provider) {
    this.providers.set(token, provider);
  }

  /**
   * Resolve a provider by token.
   * @param {symbol} token
   * @returns {import("./keyValueStore.js").KeyValueStore}
   */
  resolve(token) {
    if (!this.providers.has(token)) {
      throw new Error(`No provider registered for token ${String(token)}`);
    }
    return this.providers.get(token);
  }
}

export const storeModule = new StoreModuleRegistry();
export const StoreModule = storeModule;
export const KEY_VALUE_STORE = STORE_TOKENS.KEY_VALUE_STORE;
