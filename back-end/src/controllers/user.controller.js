import { CheckUserIdDto } from "../dto/user/checkUserId.request.dto.js";
import { UserService } from "../service/user.service.js";

export const UserController = {
  async checkUserId(req, res, next) {
    try {
      const { user_id } = CheckUserIdDto.parse(req.params);
      const available = await req.services.auth.isIdAvailable(user_id);
      res.status(200).json({
        available,
      });
    } catch (e) {
      next(e);
    }
  },

  async getStats(req, res, next) {
    try {
      const userId = req.user.user_id;
      const stats = await UserService.getUserStats(userId);
      res.status(200).json(stats);
    } catch (e) {
      next(e);
    }
  },
};
