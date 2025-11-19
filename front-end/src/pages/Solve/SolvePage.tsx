import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./SolvePage.css";
import { solveApi } from "../../shared/api/solve";
import { fallbackProblem, useSolveProblem } from "./useSolveProblem";

import IDEEditor from "../../components/IDEEditer/IDEEditer"; // ★ IDE 추가

export default function SolvePage() {
  const [searchParams] = useSearchParams();
  const rawProblemId = searchParams.get("problemId");

  const { problem, languagePresets, isLoading, error } =
    useSolveProblem(rawProblemId);

  const problemId = rawProblemId ?? problem?.id ?? fallbackProblem.id;

  const [language, setLanguage] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /** 언어 Preset 변경 시 starter 자동 반영 */
  useEffect(() => {
    if (!languagePresets || languagePresets.length === 0) {
      setLanguage("");
      setCode("");
      return;
    }

    const initialPreset = languagePresets[0];
    setLanguage(initialPreset.value);
    setCode(initialPreset.starter);
  }, [languagePresets, problem?.id]);

  /** 문제 ID 변경 시 실행 결과 초기화 */
  useEffect(() => {
    setResult(null);
  }, [problem?.id]);

  const currentLanguage = useMemo(
    () => languagePresets.find((preset) => preset.value === language),
    [language, languagePresets]
  );

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    const preset = languagePresets.find((item) => item.value === next);

    setLanguage(next);
    if (preset) setCode(preset.starter);
  };

  const handleReset = () => {
    if (currentLanguage) setCode(currentLanguage.starter);
  };

  const handleRun = async () => {
    if (language.trim().length === 0) return;

    setIsRunning(true);
    setResult(null);

    try {
      const response = await solveApi.run(problemId, { language, code });

      setResult(
        response.passed
          ? `✅ 샘플 테스트 통과\n${response.stdout}`
          : `❌ 샘플 테스트 실패\n${response.stderr ?? response.stdout}`
      );
    } catch (runError: unknown) {
      const message =
        runError instanceof Error ? runError.message : "알 수 없는 오류";
      setResult(`⚠️ 실행 오류: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (language.trim().length === 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await solveApi.submit(problemId, { language, code });

      const prefix =
        response.status === "accepted"
          ? "✅ 정답입니다!"
          : response.status === "rejected"
          ? "❌ 오답입니다."
          : "⏳ 채점 중입니다.";

      setResult(`${prefix}\n${response.message}`);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : "알 수 없는 오류";
      setResult(`⚠️ 제출 오류: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="solve-page">
      {/* 문제 설명 영역 */}
      <section className="solve-page__problem">
        <header className="problem-header">
          <div>
            <p className="problem-header__tag">{problem?.difficulty}</p>
            <h1 className="problem-header__title">{problem?.title}</h1>
          </div>

          <dl className="problem-meta">
            <div>
              <dt>시간 제한</dt>
              <dd>{problem?.timeLimit}</dd>
            </div>
            <div>
              <dt>메모리 제한</dt>
              <dd>{problem?.memoryLimit}</dd>
            </div>
          </dl>
        </header>

        {/* 문제 본문 */}
        <article className="problem-section card">
          <header className="card__head">
            <h2>문제 설명</h2>
          </header>

          <div className="card__body">
            {isLoading ? (
              <p>문제를 불러오는 중입니다...</p>
            ) : (
              <>
                <p>{problem?.description}</p>
                <section className="card__subsection">
                  <h3>입력 형식</h3>
                  <p>{problem?.inputSpec}</p>
                </section>
                <section className="card__subsection">
                  <h3>출력 형식</h3>
                  <p>{problem?.outputSpec}</p>
                </section>
              </>
            )}
          </div>
        </article>

        {/* 힌트 */}
        <section className="hint-card card">
          <header className="card__head">
            <h2>힌트</h2>
          </header>

          <div className="hint-card__body">
            {isLoading ? (
              <p>힌트를 불러오는 중입니다...</p>
            ) : (
              problem?.hints?.map((hint: string, index: number) => (
                <p key={`hint-${index}`}>{hint}</p>
              ))
            )}
          </div>
        </section>

        {error ? (
          <p className="solve-page__error">
            서버에서 문제를 가져오지 못했습니다. 다시 시도해 주세요.
            <br />
            {error}
          </p>
        ) : null}
      </section>

      {/* IDE + 제출 영역 */}
      <section className="solve-page__workspace card workspace-card">
        <header className="workspace-card__head">
          <h2>코드</h2>
        </header>

        <div className="workspace-card__body">
          {/* 언어 선택 */}
          <div className="workspace-card__controls">
            <div>
              <p className="workspace-header__label">풀이 언어</p>
              <select
                className="workspace-header__select"
                value={language}
                onChange={handleLanguageChange}
                disabled={languagePresets.length === 0}
              >
                {languagePresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 초기화 버튼 */}
            <button
              type="button"
              className="workspace-header__reset"
              onClick={handleReset}
              disabled={!currentLanguage}
            >
              초기화
            </button>
          </div>

          {/* CodeMirror IDE 영역 */}
          <div className="workspace-editor">
            <IDEEditor value={code} onChange={setCode} language={language} />
          </div>

          {/* 버튼 + 결과 */}
          <footer className="workspace-footer">
            <div className="workspace-footer__buttons">
              <button
                type="button"
                onClick={handleRun}
                className="btn btn--ghost"
                disabled={isRunning || isLoading}
              >
                {isRunning ? "실행 중..." : "테스트 실행"}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn--primary"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "제출 중..." : "제출하기"}
              </button>
            </div>

            {result && <div className="workspace-footer__result">{result}</div>}
          </footer>
        </div>
      </section>
    </div>
  );
}
