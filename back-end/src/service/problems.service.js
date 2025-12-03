import { ProbDetailResponseDto } from "../dto/problems/problem.response.dto.js";
import { ProbListResponseDto } from "../dto/problems/problemList.response.dto.js";
import { ProbRecommendResponseDto } from "../dto/problems/problemRecommend.response.dto.js";
import { SimilarProblemResponseDto } from "../dto/problems/problemSimilar.response.dto.js";
import { RecentSolvedListResponseDto } from "../dto/problems/problemRecentSolved.response.dto.js";
import { ProbSummaryWithStateResponseDto } from "../dto/problems/problemSummary.response.dto.js";
import { ERROR } from "../mapper/error.mapper.js";
import { ProblemRepository } from "../repository/problem.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { SolvedRepository } from "../repository/solved.repository.js";
import { normalizeStringArray } from "../utils/utils.js";

const _clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const levelDifficultyRange = [
  { min: 1, max: 2 },
  { min: 2, max: 3 },
  { min: 3, max: 4 },
  { min: 4, max: 5 },
];

export const ProblemsService = {
  async _getUserOrThrow(userId) {
    if (!userId) {
      throw ERROR.USER_NOT_FOUND();
    }

    const user = await UserRepository.findOne({ user_id: userId });
    if (!user) {
      throw ERROR.USER_NOT_FOUND();
    }
    return user;
  },

  _calculateExpectedXp(problem, user) {
    const difficulty = problem.problem_difficulty || 1;
    const successRate = _clamp(problem.problem_success_rate ?? 50, 0, 100);
    const userLevel = user?.metalevel ?? user?.user_level ?? 1;

    const baseXp = 50;
    const difficultyMultiplier = 0.8 + 0.2 * difficulty;
    const successMultiplier = 1 + Math.max(0, (70 - successRate) / 100);
    const levelGap = difficulty - userLevel;
    const levelMultiplier =
      levelGap >= 0 ? 1 + levelGap * 0.15 : 1 + levelGap * 0.05;

    return Math.max(
      10,
      Math.round(
        baseXp * difficultyMultiplier * successMultiplier * levelMultiplier,
      ),
    );
  },

  _deriveDifficultyRange(level) {
    const normalizedLevel = _clamp(level || 1, 1, levelDifficultyRange.length);
    return levelDifficultyRange[normalizedLevel - 1];
  },

  _normalizeProblem(problem) {
    if (!problem) {
      return null;
    }

    // ProblemRepository를 거친 데이터는 이미 정규화되지만,
    // SolvedRepository.populate로 가져온 데이터는 정규화되지 않을 수 있으므로
    // 안전하게 정규화를 수행 (정규화는 idempotent하므로 중복 수행해도 안전)
    return {
      ...problem,
      problem_lang: normalizeStringArray(problem.problem_lang),
    };
  },

  _buildProblemSummary(problem, user, solvedSet = new Set()) {
    const normalized = this._normalizeProblem(problem);
    if (!normalized) {
      return null;
    }

    const expectedXp = this._calculateExpectedXp(normalized, user);
    const mongoId = normalized._id ? normalized._id.toString() : undefined;
    const { _id, createdAt, ...rest } = normalized;

    return {
      ...rest,
      expected_xp: expectedXp,
      is_solved: mongoId ? solvedSet.has(mongoId) : false,
    };
  },

  _scoreRecommendations(problems, { preferLanguage, targetDifficulty }) {
    return problems
      .map((problem) => {
        let score = 0;
        const languages = normalizeStringArray(problem.problem_lang);

        if (preferLanguage && languages.includes(preferLanguage)) {
          score += 30;
        }

        const difficultyGap = Math.abs(
          (problem.problem_difficulty || 1) - targetDifficulty,
        );
        score -= difficultyGap * 8;

        const successRate = _clamp(problem.problem_success_rate ?? 50, 0, 100);
        score += Math.max(0, 70 - successRate) / 2;

        if (problem.createdAt) {
          const createdAt = new Date(problem.createdAt).getTime();
          const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
          score += Math.max(0, 30 - ageDays);
        }

        return { problem, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ problem }) => problem);
  },

  async _fetchRecommendationCandidates({
    preferLanguage,
    difficultyRange,
    solvedIds,
    desiredCount,
  }) {
    const unique = new Map();
    const _addItems = (items) => {
      items.forEach((item) => {
        if (!unique.has(item.problem_id)) {
          unique.set(item.problem_id, item);
        }
      });
    };

    const requestSets = [
      {
        languages: preferLanguage ? [preferLanguage] : [],
        difficultyRange,
      },
      {
        languages: [],
        difficultyRange,
      },
      {
        languages: [],
        difficultyRange: null,
      },
    ];

    for (const request of requestSets) {
      if (unique.size >= desiredCount * 2) {
        break;
      }

      const items = await ProblemRepository.findProblemsForRecommendations({
        ...request,
        excludeProblemIds: solvedIds,
        limit: desiredCount * 4,
      });
      _addItems(items);
    }

    return Array.from(unique.values());
  },

  async getProblemById(dto, userId) {
    const [user, problem] = await Promise.all([
      this._getUserOrThrow(userId),
      ProblemRepository.findProblemById(dto.id),
    ]);

    if (!problem) {
      throw ERROR.FAIL_TO_GET_PROB_DETAIL();
    }

    const [detail, isSolved] = await Promise.all([
      ProbDetailResponseDto.parse(problem),
      SolvedRepository.hasUserSolvedProblem(user._id, problem._id),
    ]);

    const expectedXp = this._calculateExpectedXp(detail, user);

    return {
      problem: detail,
      expectedXp,
      isSolved,
    };
  },

  async getProblemList(dto, userId) {
    const user = await this._getUserOrThrow(userId);
    const solvedIds = await SolvedRepository.findProblemObjectIdsByUser(
      user._id,
    );
    const solvedSet = new Set(
      solvedIds.map((id) => (id ? id.toString() : undefined)).filter(Boolean),
    );

    const {
      page,
      limit,
      difficulties,
      languages,
      main_category,
      sub_category,
      sort_by,
      sort_order,
      exclude_solved,
    } = dto;

    const { items, total } = await ProblemRepository.findProblems({
      page,
      limit,
      difficulties,
      languages,
      main_category,
      sub_category,
      sort_by,
      sort_order,
      excludeProblemIds: exclude_solved ? solvedIds : [],
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const parsed = ProbListResponseDto.parse({
      page,
      limit,
      totalCount: total,
      totalPages,
      problems: items,
    });

    const problemDbIds = items.map((item) =>
      item?._id ? item._id.toString() : undefined,
    );

    return {
      ...parsed,
      problems: parsed.problems.map((problem, index) => ({
        ...problem,
        expected_xp: this._calculateExpectedXp(problem, user),
        is_solved: problemDbIds[index]
          ? solvedSet.has(problemDbIds[index])
          : false,
      })),
    };
  },

  async getPersonalRecommendations(dto, userId) {
    const user = await this._getUserOrThrow(userId);
    const solvedIds = await SolvedRepository.findProblemObjectIdsByUser(
      user._id,
    );
    const solvedSet = new Set(
      solvedIds.map((id) => (id ? id.toString() : undefined)).filter(Boolean),
    );
    const preferLanguage =
      user.prefer_language && user.prefer_language !== "other"
        ? user.prefer_language
        : null;
    const difficultyRange = this._deriveDifficultyRange(
      user.metalevel ?? user.user_level ?? 1,
    );

    const candidates = await this._fetchRecommendationCandidates({
      preferLanguage,
      difficultyRange,
      solvedIds,
      desiredCount: dto.limit,
    });

    const targetDifficulty =
      (difficultyRange.min + difficultyRange.max) / 2 || 3;

    const ranked = this._scoreRecommendations(candidates, {
      preferLanguage,
      targetDifficulty,
    });

    const problems = ranked
      .slice(0, dto.limit)
      .map((problem) => this._buildProblemSummary(problem, user, solvedSet))
      .filter(Boolean);

    const validatedProblems = problems.map((problem) =>
      ProbSummaryWithStateResponseDto.parse(problem),
    );

    return ProbRecommendResponseDto.parse({
      count: validatedProblems.length,
      problems: validatedProblems,
    });
  },

  async getSimilarProblems(dto, userId) {
    const user = await this._getUserOrThrow(userId);
    const target = await ProblemRepository.findProblemById(dto.id);

    if (!target) {
      throw ERROR.FAIL_TO_GET_PROB_DETAIL();
    }

    const solvedIds = await SolvedRepository.findProblemObjectIdsByUser(
      user._id,
    );
    const solvedSet = new Set(
      solvedIds.map((id) => (id ? id.toString() : undefined)).filter(Boolean),
    );

    const similar = await ProblemRepository.findSimilarProblems(target, {
      limit: dto.limit,
      excludeIds: solvedIds,
    });

    const problems = similar
      .map((problem) => this._buildProblemSummary(problem, user, solvedSet))
      .filter(Boolean);

    const validatedProblems = problems.map((problem) =>
      ProbSummaryWithStateResponseDto.parse(problem),
    );

    return SimilarProblemResponseDto.parse({
      count: validatedProblems.length,
      problems: validatedProblems,
    });
  },

  async getRecentSolvedProblems(dto, userId) {
    const user = await this._getUserOrThrow(userId);
    const recent = await SolvedRepository.findRecentSolvedProblems(user._id, {
      limit: dto.limit,
    });

    const items = recent
      .filter((item) => item.problem_id)
      .map((item) => {
        const problemSummary = this._buildProblemSummary(
          {
            ...item.problem_id,
            _id: item.problem_id._id,
          },
          user,
          new Set(), // 빈 Set 전달 (아래에서 is_solved를 강제로 true로 설정)
        );

        if (!problemSummary) {
          return null;
        }

        // 최근 해결 문제는 정의상 항상 해결된 문제이므로 is_solved를 true로 설정
        problemSummary.is_solved = true;

        const validatedProblem =
          ProbSummaryWithStateResponseDto.parse(problemSummary);

        return {
          solved_id: item.solved_id,
          solved_at: item.createdAt,
          runtime_ms: item.solved_runtime ?? null,
          memory_kb: item.solved_memory_usage ?? null,
          feedback: item.solved_feedback ?? null,
          problem: validatedProblem,
        };
      })
      .filter(Boolean);

    return RecentSolvedListResponseDto.parse({
      count: items.length,
      items,
    });
  },
};
