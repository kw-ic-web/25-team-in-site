import { sessionStoreRepository } from "../repository/sessionStore.repository.js";
import { Session } from "../entity/session.entity.js";
import { SessionResponseDto } from "../dto/session/session.dto.js";
import { SESSION_TTL_MS } from "../constants/session.constants.js";

export class SessionService {
  constructor(repository = sessionStoreRepository) {
    this.repository = repository;
  }

  async createSession(createSessionDto) {
    const existingSession = await this.repository.getSession(
      createSessionDto.userId,
    );
    const session = existingSession
      ? existingSession.withData(createSessionDto.data, SESSION_TTL_MS)
      : Session.create({
          userId: createSessionDto.userId,
          data: createSessionDto.data,
          ttlMs: SESSION_TTL_MS,
        });

    await this.repository.saveSession(session);
    return this.#toResponse(session);
  }

  async getSession(userId) {
    const refreshed = await this.repository.updateSession(
      userId,
      (existing) => {
        if (!existing) return null;
        return existing.refresh(SESSION_TTL_MS);
      },
    );

    if (!refreshed) return null;
    return this.#toResponse(refreshed);
  }

  async updateSessionData(userId, updateDto) {
    const updatedSession = await this.repository.updateSession(
      userId,
      (existing) => {
        if (!existing) return null;
        return existing.withData(updateDto.data, SESSION_TTL_MS);
      },
    );

    if (!updatedSession) return null;
    return this.#toResponse(updatedSession);
  }

  async deleteSession(userId) {
    await this.repository.deleteSession(userId);
  }

  #toResponse(session) {
    return SessionResponseDto.parse(session.toRecord());
  }
}

export const sessionService = new SessionService();
