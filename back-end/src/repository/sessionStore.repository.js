import {
  KEY_VALUE_STORE,
  StoreModule,
} from "../infrastructure/store/store.module.js";
import { SESSION_TTL_MS } from "../constants/session.constants.js";
import { Session } from "../entity/session.entity.js";
import { Code } from "../entity/code.entity.js";

export class SessionStoreRepository {
  constructor(store = StoreModule.resolve(KEY_VALUE_STORE)) {
    this.store = store;
    this.ttlMs = SESSION_TTL_MS;
  }

  async getSession(userId) {
    const record = await this.store.get(userId);
    if (!record) return null;
    return Session.fromRecord(record);
  }

  async saveSession(session) {
    await this.store.set(
      session.userId,
      session.toRecord(),
      this.ttlMs,
    );
  }

  async updateSession(userId, updater) {
    const updated = await this.store.update(
      userId,
      (prev) => {
        if (!prev) return null;
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
    await this.store.delete(userId);
  }

  async getCode(userId) {
    const record = await this.store.get(userId);
    if (!record) return null;
    const parsed = typeof record === "string" ? JSON.parse(record) : record;
    return Code.fromRecord(parsed);
  }

  async saveCode(code) {
    await this.store.set(
      code.userId,
      JSON.stringify(code.toRecord()),
    );
  }

  async updateCode(userId, updater) {
    const updated = await this.store.update(
      userId,
      (prev) => {
        const parsed = prev ? (typeof prev === "string" ? JSON.parse(prev) : prev) : null;
        const entity = parsed ? Code.fromRecord(parsed) : Code.create({ userId });
        const next = updater(entity);
        if (!next) return null;
        return JSON.stringify(next.toRecord());
      },
    );

    if (!updated) return null;
    const parsed = typeof updated === "string" ? JSON.parse(updated) : updated;
    return Code.fromRecord(parsed);
  }

  async deleteCode(userId) {
    await this.store.delete(userId);
  }
}

export const sessionStoreRepository = new SessionStoreRepository();
