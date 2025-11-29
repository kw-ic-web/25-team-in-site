import { SESSION_TTL_MS } from "../constants/session.constants.js";

export class Session {
  constructor({ userId, data = {}, createdAt = new Date(), expiresAt }) {
    this.userId = userId;
    this.data = data;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  static create({ userId, data = {}, ttlMs = SESSION_TTL_MS }) {
    const now = new Date();
    return new Session({
      userId,
      data,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlMs),
    });
  }

  static fromRecord(record) {
    if (!record) return null;
    return new Session({
      userId: record.userId,
      data: record.data ?? {},
      createdAt: new Date(record.createdAt),
      expiresAt: new Date(record.expiresAt),
    });
  }

  withData(patch, ttlMs = SESSION_TTL_MS) {
    return new Session({
      userId: this.userId,
      data: {
        ...this.data,
        ...patch,
      },
      createdAt: this.createdAt,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  }

  refresh(ttlMs = SESSION_TTL_MS) {
    return new Session({
      userId: this.userId,
      data: this.data,
      createdAt: this.createdAt,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  }

  isValid(now = new Date()) {
    return now < this.expiresAt;
  }

  toRecord() {
    return {
      userId: this.userId,
      data: this.data,
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
    };
  }
}
