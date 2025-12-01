import * as Diff from "diff";
import {
    SaveCodeResponseDto,
} from "../dto/code/saveCode.response.dto.js";
import { sessionStoreRepository } from "../repository/sessionStore.repository.js";

export const CodeService = {
  async saveCode(userId, code, language) {
    await sessionStoreRepository.updateCode(userId, (codeEntity) => {
      const cachedCode = codeEntity.cachedCode || "";
      const diff = cachedCode ? Diff.createPatch("code", cachedCode, code, "", "") : "";

      const updated = codeEntity.updateCode(code, language);
      
      return updated.setDiff(diff);
    });

    //TODO: Hint 서비스 함수 호출(타미어 초기화)
    return SaveCodeResponseDto.parse({ success: true });
  }
}
