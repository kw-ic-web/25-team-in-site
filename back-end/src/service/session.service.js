import { createTwoFilesPatch } from "diff";
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

                // Generate diff if code is being updated
                let newDiff = existing.data.code?.diff;
                if (
                    updateDto.data?.code?.full &&
                    existing.data.code?.full &&
                    updateDto.data.code.full !== existing.data.code.full
                ) {
                    // Create a unified diff
                    // createTwoFilesPatch(fileName, fileName, oldStr, newStr)
                    newDiff = createTwoFilesPatch(
                        "code",
                        "code",
                        existing.data.code.full,
                        updateDto.data.code.full,
                    );
                }

                // Merge data
                const newData = {
                    ...existing.data,
                    ...updateDto.data,
                    code: {
                        ...existing.data.code,
                        ...updateDto.data?.code,
                        diff: newDiff, // Update diff
                    },
                };

                return existing.withData(newData, SESSION_TTL_MS);
            },
        );

        if (updatedSession) return this.#toResponse(updatedSession);
        return null;
    }

    async deleteSession(userId) {
        await this.repository.deleteSession(userId);
    }

    #toResponse(session) {
        return SessionResponseDto.parse(session.toRecord());
    }
}

export const sessionService = new SessionService();
