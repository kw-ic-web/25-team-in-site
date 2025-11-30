export class Code {
  constructor({ userId, currentCode = "", cachedCode = "", language = "", diff = "" }) {
    this.userId = userId;
    this.currentCode = currentCode;
    this.cachedCode = cachedCode; // 마지막 힌트 요청 시 사용한 코드
    this.language = language;
    this.diff = diff; // cachedCode에서 currentCode로 변경된 내용 (단일 문자열)
  }

  static create({ userId, currentCode = "", cachedCode = "", language = "" }) {
    return new Code({
      userId,
      currentCode,
      cachedCode,
      language,
      diff: "",
    });
  }

  static fromRecord(record) {
    if (!record) return null;
    return new Code({
      userId: record.userId,
      currentCode: record.currentCode ?? "",
      cachedCode: record.cachedCode ?? "",
      language: record.language ?? "",
      diff: record.diff ?? "",
    });
  }

  setDiff(diff) {
    return new Code({
      userId: this.userId,
      currentCode: this.currentCode,
      cachedCode: this.cachedCode,
      language: this.language,
      diff: diff || "",
    });
  }

  updateCode(newCode, newLanguage) {
    return new Code({
      userId: this.userId,
      currentCode: newCode,
      cachedCode: this.cachedCode,
      language: newLanguage,
      diff: this.diff,
    });
  }

  updateCachedCode(cachedCode) {
    return new Code({
      userId: this.userId,
      currentCode: this.currentCode,
      cachedCode: cachedCode,
      language: this.language,
      diff: this.diff,
    });
  }

  toRecord() {
    return {
      userId: this.userId,
      currentCode: this.currentCode,
      cachedCode: this.cachedCode,
      language: this.language,
      diff: this.diff,
    };
  }
}

