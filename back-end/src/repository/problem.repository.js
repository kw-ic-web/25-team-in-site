import { Problem } from "../entity/problem.entity.js";
import { ProblemDetail } from "../entity/problemDetail.entity.js";
import { normalizeStringArray } from "../utils/utils.js";

// === Projection ===
const PROBLEM_SUMMARY_PROJECTION = {
  problem_id: 1,
  problem_title: 1,
  problem_difficulty: 1,
  problem_lang: 1,
  problem_main_category: 1,
  problem_sub_category: 1,
  problem_success_rate: 1,
  createdAt: 1,
};

// === Helper Functions ===
const _normalizeProblemDoc = (problem = {}) => ({
  ...problem,
  problem_lang: normalizeStringArray(problem.problem_lang),
});

const _mergeProblemDetail = (problem, problemDetail) => {
  if (!problemDetail) {
    return {
      problem_body: problem.problem_body,
      problem_attachment_urls: normalizeStringArray(
        problem.problem_attachment_urls,
      ),
    };
  }

  const {
    problem_id: _detailProblemId,
    problem_body,
    problem_attachment_urls,
    ...rest
  } = problemDetail;

  const normalizedDetailAttachments = normalizeStringArray(
    problem_attachment_urls,
  );
  const fallbackAttachments =
    normalizedDetailAttachments.length > 0
      ? normalizedDetailAttachments
      : normalizeStringArray(problem.problem_attachment_urls);

  return {
    problem_body: problem_body ?? problem.problem_body,
    problem_attachment_urls: fallbackAttachments,
    ...rest,
  };
};

const SORT_FIELD_MAP = {
  created_at: "createdAt",
  difficulty: "problem_difficulty",
  success_rate: "problem_success_rate",
};

const _buildSortOption = (sortBy, sortOrder) => {
  const sortField = SORT_FIELD_MAP[sortBy] ?? SORT_FIELD_MAP.created_at;
  const order = sortOrder === "asc" ? 1 : -1;

  const sortOption = { [sortField]: order };
  if (sortField !== "createdAt") {
    sortOption.createdAt = -1;
  }

  return sortOption;
};

const _scoreSimilarity = (problem, target) => {
  let score = 0;

  const targetMainCategories = normalizeStringArray(
    target.problem_main_category,
  );
  const problemMainCategories = normalizeStringArray(
    problem.problem_main_category,
  );
  if (targetMainCategories.length > 0 && problemMainCategories.length > 0) {
    const hasOverlap = targetMainCategories.some((cat) =>
      problemMainCategories.includes(cat),
    );
    if (hasOverlap) {
      score += 40;
    }
  }

  const targetSubCategories = normalizeStringArray(
    target.problem_sub_category,
  );
  const problemSubCategories = normalizeStringArray(
    problem.problem_sub_category,
  );
  if (targetSubCategories.length > 0 && problemSubCategories.length > 0) {
    const hasOverlap = targetSubCategories.some((cat) =>
      problemSubCategories.includes(cat),
    );
    if (hasOverlap) {
      score += 25;
    }
  }

  const targetLangs = normalizeStringArray(target.problem_lang);
  if (targetLangs.length) {
    const overlap = problem.problem_lang.filter((lang) =>
      targetLangs.includes(lang),
    ).length;
    score += overlap * 10;
  }

  const difficultyGap = Math.abs(
    (problem.problem_difficulty || 1) - (target.problem_difficulty || 1),
  );
  score -= difficultyGap * 8;

  const successRateGap = Math.abs(
    (problem.problem_success_rate ?? 50) -
      (target.problem_success_rate ?? 50),
  );
  score -= successRateGap / 10;

  return score;
};

// === Repository ===
export const ProblemRepository = {
  async findProblemById(id) {
    const probInfo = await Problem.findOne({ problem_id: id }).lean();

    if (!probInfo) {
      return null;
    }

    const probDetail = await ProblemDetail.findOne({
      problem_id: probInfo._id,
    }).lean();

    const normalizedProbInfo = _normalizeProblemDoc(probInfo);
    const detailFields = _mergeProblemDetail(normalizedProbInfo, probDetail);

    if (!detailFields.problem_body) {
      return null;
    }

    return {
      ...normalizedProbInfo,
      ...detailFields,
    };
  },
  async findProblems({
    page,
    limit,
    difficulties,
    languages,
    main_category,
    sub_category,
    excludeProblemIds = [],
    sort_by = "created_at",
    sort_order = "desc",
  }) {
    const filter = {};

    if (Array.isArray(difficulties) && difficulties.length > 0) {
      filter.problem_difficulty = { $in: difficulties };
    }

    if (Array.isArray(languages) && languages.length > 0) {
      filter.problem_lang = { $in: languages };
    }

    if (main_category) {
      filter.problem_main_category = { $in: [main_category] };
    }

    if (sub_category) {
      filter.problem_sub_category = { $in: [sub_category] };
    }

    if (Array.isArray(excludeProblemIds) && excludeProblemIds.length > 0) {
      filter._id = { $nin: excludeProblemIds };
    }

    const skip = (page - 1) * limit;
    const sort = _buildSortOption(sort_by, sort_order);

    const [items, total] = await Promise.all([
      Problem.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(PROBLEM_SUMMARY_PROJECTION)
        .lean(),
      Problem.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => _normalizeProblemDoc(item)),
      total,
    };
  },
  async findProblemsForRecommendations({
    languages = [],
    difficultyRange = null,
    excludeProblemIds = [],
    limit = 20,
  }) {
    const filter = {};

    if (Array.isArray(languages) && languages.length > 0) {
      filter.problem_lang = { $in: languages };
    }

    if (difficultyRange) {
      filter.problem_difficulty = {
        $gte: difficultyRange.min,
        $lte: difficultyRange.max,
      };
    }

    if (Array.isArray(excludeProblemIds) && excludeProblemIds.length > 0) {
      filter._id = { $nin: excludeProblemIds };
    }

    const items = await Problem.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(PROBLEM_SUMMARY_PROJECTION)
      .lean();

    return items.map((item) => _normalizeProblemDoc(item));
  },
  async findSimilarProblems(targetProblem, { limit = 5, excludeIds = [] } = {}) {
    if (!targetProblem?._id) {
      return [];
    }

    const targetDifficulty = targetProblem.problem_difficulty || 1;
    const matchClauses = [];
    const normalizedLangs = normalizeStringArray(targetProblem.problem_lang);

    const normalizedMainCategories = normalizeStringArray(
      targetProblem.problem_main_category,
    );
    if (normalizedMainCategories.length > 0) {
      matchClauses.push({
        problem_main_category: { $in: normalizedMainCategories },
      });
    }

    const normalizedSubCategories = normalizeStringArray(
      targetProblem.problem_sub_category,
    );
    if (normalizedSubCategories.length > 0) {
      matchClauses.push({
        problem_sub_category: { $in: normalizedSubCategories },
      });
    }

    if (normalizedLangs.length > 0) {
      matchClauses.push({ problem_lang: { $in: normalizedLangs } });
    }

    const filter = {
      _id: {
        $nin: [
          targetProblem._id,
          ...(excludeIds || []).filter(Boolean),
        ],
      },
      problem_difficulty: {
        $gte: Math.max(targetDifficulty - 1, 1),
        $lte: Math.min(targetDifficulty + 1, 5),
      },
    };

    if (matchClauses.length > 0) {
      filter.$or = matchClauses;
    }

    const candidates = await Problem.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .select(PROBLEM_SUMMARY_PROJECTION)
      .lean();

    const normalizedTarget = _normalizeProblemDoc(targetProblem);
    const normalizedCandidates = candidates.map((item) =>
      _normalizeProblemDoc(item),
    );

    const ranked = normalizedCandidates
      .map((problem) => ({
        ...problem,
        _score: _scoreSimilarity(problem, normalizedTarget),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...rest }) => rest);

    return ranked;
  },
};
