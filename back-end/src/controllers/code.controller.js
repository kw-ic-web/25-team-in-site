import { CodeTokenizeRequestDto } from "../dto/code/tokenize.request.dto.js";
import { SaveCodeRequestDto } from "../dto/code/saveCode.request.dto.js";

export const CodeController = {
  async tokenize(req, res, next) {
    try {
      const dto = CodeTokenizeRequestDto.parse(req.body);
      const result = await req.services.tokenizer.tokenize(dto);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async saveCode(req, res, next) {
    try {
      const dto = SaveCodeRequestDto.parse(req.body);
      const result = await req.services.code.saveCode(req.user.user_id, dto.code, dto.language);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
