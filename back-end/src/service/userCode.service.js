import { SolvedRepository } from "../repository/solved.repository.js";
import { ProblemRepository } from "../repository/problem.repository.js";
import { OpenAIService } from "./openai.service.js";
import { Solved } from "../entity/solved.entity.js";
import * as Diff from "diff";
import { ERROR } from "../mapper/error.mapper.js";
import {
    SaveCodeResponseDto,
} from "../dto/userCode/userCode.response.dto.js";
import { storeModule, KEY_VALUE_STORE } from "../infrastructure/store/store.module.js";

export const UserCodeService = {
  async saveCode(userId, code, language) {
    const store = storeModule.resolve(KEY_VALUE_STORE);
    const statusKey = userId;

    //TODO: store에 diff 저장
    //TODO: 저장도 Repository 사용
    await store.update(statusKey, (prev) => {
      const status = prev ? JSON.parse(prev) : {};
      status.current_code = code;
      status.language = language;
      return JSON.stringify(status);
    });
    return SaveCodeResponseDto.parse({ success: true });
  }
}
