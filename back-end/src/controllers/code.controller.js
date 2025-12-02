import { CodeTokenizeRequestDto } from "../dto/code/tokenize.request.dto.js";
import { CodeTokenizeResponseDto } from "../dto/code/tokenize.response.dto.js";

export const CodeController = {
  async tokenize(req, res, next) {
    try {
      const dto = CodeTokenizeRequestDto.parse(req.body);
      const result = await req.services.tokenizer.tokenize(dto);
      // 서비스에서 이미 DTO로 변환되어 반환되므로 그대로 사용
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
