import { Problem } from "../entity/problem.entity.js";
import { ProblemDetail } from "../entity/problemDetail.entity.js";

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const normalizeProblemDoc = (problem = {}) => ({
  ...problem,
  problem_lang: normalizeStringArray(problem.problem_lang),
});

const mergeProblemDetail = (problem, problemDetail) => {
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

  const normalizedDetailAttachments =
    normalizeStringArray(problem_attachment_urls);
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

export const ProblemRepository = {
  async findProblemById(id) {
    const probInfo = await Problem.findOne({ problem_id: id }).lean();

    if (!probInfo) {
      return null;
    }

    const probDetail = await ProblemDetail.findOne({
      problem_id: probInfo._id,
    }).lean();

    const normalizedProbInfo = normalizeProblemDoc(probInfo);
    const detailFields = mergeProblemDetail(normalizedProbInfo, probDetail);

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
  }) {
    const filter = {};

    if (difficulties?.length) {
      filter.problem_difficulty = { $in: difficulties };
    }

    if (languages?.length) {
      filter.problem_lang = { $in: languages };
    }

    if (main_category) {
      filter.problem_main_category = main_category;
    }

    if (sub_category) {
      filter.problem_sub_category = sub_category;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Problem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          problem_id: 1,
          problem_difficulty: 1,
          problem_lang: 1,
          problem_main_category: 1,
          problem_sub_category: 1,
          problem_success_rate: 1,
        })
        .lean(),
      Problem.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => normalizeProblemDoc(item)),
      total,
    };
  },
};
