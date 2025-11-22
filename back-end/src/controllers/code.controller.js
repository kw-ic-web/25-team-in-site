import { CodeTokenizeRequestDto } from "../dto/code/tokenize.request.dto.js";

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
};
