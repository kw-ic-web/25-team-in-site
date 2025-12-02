export class HintSession {
  constructor({
    userId,
    problemId = "",
    language = "",
    code = { current: "", diff: "", cached: "" },
    context = [],
  }) {
    this.userId = userId;
    this.problemId = problemId;
    this.language = language;
    this.code = code;
    this.context = context;
  }

  static create({ userId, problemId = "", language = "", code, context = [] }) {
    return new HintSession({
      userId,
      problemId,
      language,
      code: code || { current: "", diff: "", cached: "" },
      context,
    });
  }

  static fromRecord(record) {
    if (!record) return null;
    return new HintSession({
      userId: record.userId,
      problemId: record.problemId ?? "",
      language: record.language ?? "",
      code: record.code ?? { current: "", diff: "", cached: "" },
      context: Array.isArray(record.context) ? record.context : [],
    });
  }

  updateCode(newCode, newLanguage) {
    const cachedCode = this.code.cached || "";
    return new HintSession({
      userId: this.userId,
      problemId: this.problemId,
      language: newLanguage || this.language,
      code: {
        current: newCode,
        diff: this.code.diff,
        cached: cachedCode,
      },
      context: this.context,
    });
  }

  setDiff(diff) {
    return new HintSession({
      userId: this.userId,
      problemId: this.problemId,
      language: this.language,
      code: {
        current: this.code.current,
        diff: diff || "",
        cached: this.code.cached,
      },
      context: this.context,
    });
  }

  updateCachedCode(cachedCode) {
    return new HintSession({
      userId: this.userId,
      problemId: this.problemId,
      language: this.language,
      code: {
        current: this.code.current,
        diff: this.code.diff,
        cached: cachedCode,
      },
      context: this.context,
    });
  }

  addContextItem(hintContextItem) {
    return new HintSession({
      userId: this.userId,
      problemId: this.problemId,
      language: this.language,
      code: this.code,
      context: [...this.context, hintContextItem],
    });
  }

  toRecord() {
    return {
      userId: this.userId,
      problemId: this.problemId,
      language: this.language,
      code: this.code,
      context: this.context,
    };
  }
}

