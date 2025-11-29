import {
    KEY_VALUE_STORE,
    StoreModule,
} from "../infrastructure/store/store.module.js";
import { SESSION_TTL_MS } from "../constants/session.constants.js";
import { Session } from "../entity/session.entity.js";

export class SessionStoreRepository {
    constructor(store = StoreModule.resolve(KEY_VALUE_STORE)) {
        this.store = store;
        this.ttlMs = SESSION_TTL_MS;
    }

    #getKey(userId) {
        return userId;
    }

    async getSession(userId) {
        const record = await this.store.get(this.#getKey(userId));
        if (!record) return null;
        return Session.fromRecord(record);
    }

    async saveSession(session) {
        await this.store.set(
            this.#getKey(session.userId),
            session.toRecord(),
            this.ttlMs,
        );
    }

    async updateSession(userId, updater) {
        const updated = await this.store.update(
            this.#getKey(userId),
            (prev) => {
                const entity = Session.fromRecord(prev);
                const next = updater(entity);
                if (!next) return null;
                return next.toRecord();
            },
            this.ttlMs,
        );

        if (!updated) return null;
        return Session.fromRecord(updated);
    }

    async deleteSession(userId) {
        await this.store.delete(this.#getKey(userId));
    }
}

export const sessionStoreRepository = new SessionStoreRepository();
