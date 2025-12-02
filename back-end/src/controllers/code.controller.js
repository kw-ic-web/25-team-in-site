import { SaveCodeRequestDto } from "../dto/code/saveCode.request.dto.js";
import { ERROR } from "../mapper/error.mapper.js";

export const CodeController = {
  async saveCode(req, res, next) {
    try {
      const dto = SaveCodeRequestDto.parse(req.body);
      if (!req.user?.user_id) {
        throw ERROR.INVALID_LOGIN_INFO();
      }
      const result = await req.services.code.saveCode(
        req.user.user_id,
        dto.problemId,
        dto.code,
        dto.language,
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
