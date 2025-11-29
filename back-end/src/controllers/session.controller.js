import {
    CreateSessionRequestDto,
    UpdateSessionRequestDto,
} from "../dto/session/session.dto.js";

export const SessionController = {
    async createSession(req, res, next) {
        try {
            const dto = CreateSessionRequestDto.parse(req.body);
            const session = await req.services.session.createSession(dto);
            res.status(201).json(session);
        } catch (error) {
            next(error);
        }
    },

    async getSession(req, res, next) {
        try {
            const { userId } = req.params;
            const session = await req.services.session.getSession(userId);
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }
            res.json(session);
        } catch (error) {
            next(error);
        }
    },

    async updateSession(req, res, next) {
        try {
            const { userId } = req.params;
            const dto = UpdateSessionRequestDto.parse(req.body);
            const session = await req.services.session.updateSessionData(
                userId,
                dto,
            );
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }
            res.json(session);
        } catch (error) {
            next(error);
        }
    },

    async deleteSession(req, res, next) {
        try {
            const { userId } = req.params;
            await req.services.session.deleteSession(userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};
