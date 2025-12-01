import { EvaluateCodeRequestDto } from "../dto/evaluation/evaluateCode.request.dto.js";
import { EvaluationService } from "../service/evaluation.service.js";

export const evaluationController = {
  async evaluate(req, res, next) {
    try {
      const dto = EvaluateCodeRequestDto.parse(req.body);
      const userId = req.user?.user_id;

      const result = await EvaluationService.evaluateCode({
        userId,
        problemId: dto.problemId,
        code: dto.code,
        language: dto.language,
        caseType: dto.mode,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
