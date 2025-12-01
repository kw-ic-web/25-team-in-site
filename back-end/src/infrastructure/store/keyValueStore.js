/**
 * Abstract interface for Key-Value Store
 * @interface
 */
export class KeyValueStore {
    async get(key) {
        throw new Error("Method 'get' must be implemented.");
    }

    async set(key, value, ttlMs) {
        throw new Error("Method 'set' must be implemented.");
    }

    async delete(key) {
        throw new Error("Method 'delete' must be implemented.");
    }

    async update(key, updater, ttlMs) {
        throw new Error("Method 'update' must be implemented.");
    }
}
