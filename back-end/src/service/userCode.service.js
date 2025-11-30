import { SolvedRepository } from "../repository/solved.repository.js";
import { ProblemRepository } from "../repository/problem.repository.js";
import { OpenAIService } from "./openai.service.js";
import { Solved } from "../entity/solved.entity.js";
import * as Diff from "diff";
import { ERROR } from "../mapper/error.mapper.js";
import {
    SaveCodeResponseDto,
    GetHintResponseDto,
} from "../dto/userCode/userCode.response.dto.js";
import { storeModule, KEY_VALUE_STORE } from "../infrastructure/store/store.module.js";


export const UserCodeService = {
    async saveCode(userId, problemId, dto) {
        const problem = await ProblemRepository.findProblemById(problemId);
        if (!problem) {
            throw ERROR.FAIL_TO_GET_PROB_DETAIL();
        }

        let solved = await SolvedRepository.findByUserIdAndProblemId(
            userId,
            problem._id
        );

        // Business Logic: Calculate Diff
        let diff = "";
        if (solved) {
            const previousCode = solved.solved_code || "";
            const diffResult = Diff.createPatch(
                "code",
                previousCode,
                dto.code,
                "old",
                "new"
            );
            diff = diffResult;
        } else {
            solved = new Solved({
                user_id: userId,
                problem_id: problem._id,
                language: dto.language,
            });
        }

        // Business Logic: Update Entity
        solved.solved_code = dto.code;
        solved.solved_diff = diff; // Save the calculated diff
        solved.language = dto.language; // Update language if changed

        // Persistence: Delegate to Repository (Entity)
        await SolvedRepository.save(solved);

        // Persistence: Save Status to Store (Transient)
        const store = storeModule.resolve(KEY_VALUE_STORE);
        const statusKey = `code_status:${userId}:${problemId}`;

        await store.update(statusKey, (prev) => {
            const status = prev ? JSON.parse(prev) : {};
            status.current_code = dto.code;
            status.diff = diff;
            return JSON.stringify(status);
        });

        return SaveCodeResponseDto.parse({ success: true });
    },

    async getHint(userId, problemId, dto) {
        const problem = await ProblemRepository.findProblemById(problemId);
        if (!problem) {
            throw ERROR.FAIL_TO_GET_PROB_DETAIL();
        }

        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful coding tutor. Provide a hint for the user's code without giving away the full solution. Focus on logic and syntax errors.",
            },
            {
                role: "user",
                content: `Problem: ${problem.problem_title}\nDescription: ${problem.problem_body}\n\nUser Code:\n\`\`\`${dto.language}\n${dto.code}\n\`\`\`\n\nPlease provide a hint.`,
            },
        ];

        // Update last_hint_code in Store
        const store = storeModule.resolve(KEY_VALUE_STORE);
        const statusKey = `code_status:${userId}:${problemId}`;

        await store.update(statusKey, (prev) => {
            const status = prev ? JSON.parse(prev) : {};
            status.last_hint_code = dto.code;
            return JSON.stringify(status);
        });

        const hint = await OpenAIService.getChatCompletion(messages);
        return GetHintResponseDto.parse({ hint });
    },

    async getHistory(userId, problemId) {
        // Return current status from store
        const store = storeModule.resolve(KEY_VALUE_STORE);
        const statusKey = `code_status:${userId}:${problemId}`;
        const statusJson = await store.get(statusKey);
        return statusJson ? [JSON.parse(statusJson)] : [];
    },
};
