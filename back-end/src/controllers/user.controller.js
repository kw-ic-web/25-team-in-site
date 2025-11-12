import { CheckUserIdDto } from "../dto/user/checkUserId.request.dto.js";

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
};
