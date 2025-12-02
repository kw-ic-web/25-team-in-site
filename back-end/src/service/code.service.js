import {
  SaveCodeResponseDto,
} from "../dto/code/saveCode.response.dto.js";
import { NewCodeCommittedRequestDto } from "../dto/hint/newCodeCommitted.request.dto.js";
import { sessionStoreRepository } from "../repository/sessionStore.repository.js";
import { HintService } from "./hint.service.js";

export const CodeService = {
  async saveCode(userId, problemId, code, language) {
    // HintSession에 코드 저장
    await sessionStoreRepository.updateHintSessionCode(
      userId,
      problemId,
      code,
      language,
    );

    // 코드 업데이트 시 힌트 인터벌 초기화
    const hintDto = NewCodeCommittedRequestDto.parse({ userId, problemId });
    await HintService.newCodeCommitted(hintDto);
    return SaveCodeResponseDto.parse({ success: true });
  }
}
