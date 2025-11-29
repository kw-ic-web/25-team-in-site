/**
 * Abstract interface for Key-Value Store
 * @interface
 */
export class KeyValueStore {
    /**
     * Get a value by key
     * @param {string} key
     * @returns {Promise<any | null>}
     */
    async get(key) {
        throw new Error("Method 'get' must be implemented.");
    }

    /**
     * Set a value by key
     * @param {string} key
     * @param {any} value
     * @param {number} [ttlMs] - Time to live in milliseconds
     * @returns {Promise<void>}
     */
    async set(key, value, ttlMs) {
        throw new Error("Method 'set' must be implemented.");
    }

    /**
     * Delete a value by key
     * @param {string} key
     * @returns {Promise<void>}
     */
    async delete(key) {
        throw new Error("Method 'delete' must be implemented.");
    }

    /**
     * Atomically update a value
     * @param {string} key
     * @param {(prev: any | null) => any} updater
     * @param {number} [ttlMs]
     * @returns {Promise<any>}
     */
    async update(key, updater, ttlMs) {
        throw new Error("Method 'update' must be implemented.");
    }
}
