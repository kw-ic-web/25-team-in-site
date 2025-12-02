import * as Diff from "diff";
import { RedisStore } from "../infrastructure/store/redisStore.js";
import { SESSION_TTL_MS } from "../constants/session.constants.js";
import { Session } from "../entity/session.entity.js";
import { HintSession } from "../entity/hintSession.entity.js";

const CODE_CURRENT_FIELD = "code.current";
const CODE_DIFF_FIELD = "code.diff";
const CODE_CACHED_FIELD = "code.cached";
const CONTEXT_FIELD = "context";

const defaultStore = new RedisStore();

export class SessionStoreRepository {
  constructor(store = defaultStore) {
    this.store = store;
    this.ttlMs = SESSION_TTL_MS;
  }

  #sessionKey(userId) {
    return `session:${userId}`;
  }

  #hintKey(userId, problemId) {
    if (!problemId) {
      throw new Error("problemId is required to build hint session key");
    }
    return `${userId}:${problemId}`;
  }

  async getSession(userId) {
    const record = await this.store.get(this.#sessionKey(userId));
    if (!record) return null;
    const parsed = typeof record === "string" ? JSON.parse(record) : record;
    return Session.fromRecord(parsed);
  }

  async saveSession(session) {
    await this.store.set(
      this.#sessionKey(session.userId),
      JSON.stringify(session.toRecord()),
      this.ttlMs,
    );
  }

  async updateSession(userId, updater) {
    const key = this.#sessionKey(userId);
    const updatedPayload = await this.store.update(
      key,
      (prev) => {
        if (!prev) return null;
        const parsed = typeof prev === "string" ? JSON.parse(prev) : prev;
        const entity = Session.fromRecord(parsed);
        const next = updater(entity);
        if (!next) return null;
        return JSON.stringify(next.toRecord());
      },
      this.ttlMs,
    );

    if (!updatedPayload) return null;
    const parsed =
      typeof updatedPayload === "string"
        ? JSON.parse(updatedPayload)
        : updatedPayload;
    return Session.fromRecord(parsed);
  }

  async deleteSession(userId) {
    await this.store.delete(this.#sessionKey(userId));
  }

  async getHintSession(userId, problemId) {
    const key = this.#hintKey(userId, problemId);
    const hash = await this.store.hgetall(key);
    return this.#deserializeHintSession(userId, problemId, hash);
  }

  async createOrResetHintSession(userId, problemId, language) {
    const hintSession = HintSession.create({ userId, problemId, language });
    await this.#writeHintSession(userId, problemId, hintSession);
    return hintSession;
  }

  async updateHintSessionCode(userId, problemId, code, language) {
    const existing = await this.getHintSession(userId, problemId);
    const cachedCode = existing?.code?.cached || "";
    const diff = cachedCode
      ? Diff.createPatch("code", cachedCode, code, "", "")
      : "";

    const updated = new HintSession({
      userId,
      problemId,
      language: language || existing?.language || "",
      code: {
        current: code,
        diff,
        cached: cachedCode,
      },
      context: existing?.context || [],
    });

    await this.#writeHintSession(userId, problemId, updated);
    return updated;
  }

  async updateHintSessionLanguage(userId, problemId, language) {
    const existing = await this.getHintSession(userId, problemId);
    const updated = new HintSession({
      userId,
      problemId,
      language,
      code: existing?.code || { current: "", diff: "", cached: "" },
      context: existing?.context || [],
    });

    await this.#writeHintSession(userId, problemId, updated);
    return updated;
  }

  async addHintContextItem(userId, problemId, hintContextItem) {
    const session =
      (await this.getHintSession(userId, problemId)) ||
      HintSession.create({ userId, problemId });
    const updated = session.addContextItem(hintContextItem);
    await this.#writeHintSession(userId, problemId, updated);
    return updated;
  }

  async #writeHintSession(userId, problemId, hintSession) {
    const record =
      hintSession instanceof HintSession
        ? hintSession.toRecord()
        : hintSession;
    await this.store.hmset(
      this.#hintKey(userId, problemId),
      this.#serializeHintSession(record),
      this.ttlMs,
    );
  }

  #serializeHintSession(record) {
    return {
      problemId: record.problemId ?? "",
      language: record.language ?? "",
      [CODE_CURRENT_FIELD]: record.code?.current ?? "",
      [CODE_DIFF_FIELD]: record.code?.diff ?? "",
      [CODE_CACHED_FIELD]: record.code?.cached ?? "",
      [CONTEXT_FIELD]: JSON.stringify(record.context ?? []),
    };
  }

  #deserializeHintSession(userId, problemId, hash) {
    if (!hash) return null;
    let context = [];
    if (hash[CONTEXT_FIELD]) {
      try {
        context = JSON.parse(hash[CONTEXT_FIELD]);
      } catch {
        context = [];
      }
    }

    return new HintSession({
      userId,
      problemId: hash.problemId ?? problemId ?? "",
      language: hash.language ?? "",
      code: {
        current: hash[CODE_CURRENT_FIELD] ?? "",
        diff: hash[CODE_DIFF_FIELD] ?? "",
        cached: hash[CODE_CACHED_FIELD] ?? "",
      },
      context,
    });
  }
}

export const sessionStoreRepository = new SessionStoreRepository();
