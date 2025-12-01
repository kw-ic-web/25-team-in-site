import * as Diff from "diff";
import {
    SaveCodeResponseDto,
} from "../dto/code/saveCode.response.dto.js";
import { sessionStoreRepository } from "../repository/sessionStore.repository.js";
import { HintService } from "./hint.service.js";

export const CodeService = {
  async saveCode(userId, code, language) {
    await sessionStoreRepository.updateCode(userId, (codeEntity) => {
      const cachedCode = codeEntity.cachedCode || "";
      const diff = cachedCode ? Diff.createPatch("code", cachedCode, code, "", "") : "";

      const updated = codeEntity.updateCode(code, language);
      
      return updated.setDiff(diff);
    });

    // 코드 업데이트 시 힌트 인터벌 초기화
    await HintService.newCodeCommitted(userId);
    return SaveCodeResponseDto.parse({ success: true });
  }
}
