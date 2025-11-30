import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./SolvePage.css";

import apiClient from "../../api/client";
import IDEEditor from "../../components/IDEEditer/IDEEditer";

function htmlToPrettyText(html: string): string {
  let text = html;

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|div|h[1-6]|section|article)>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");
  text = text.replace(/[ \t]+\n/g, "\n");

  return text.trim();
}

export default function SolvePage() {
  const [searchParams] = useSearchParams();
  const rawProblemId = searchParams.get("problemId");

  const [problem, setProblem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  const [languagePresets, setLanguagePresets] = useState<any[]>([]);
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 힌트 관련 상태
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  const problemId = rawProblemId ?? "";

  // 문제 상세 조회
  useEffect(() => {
    if (!problemId) return;

    async function fetchProblem() {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/problems/${problemId}`);

        const p = res.data;

        const parsedTestCases =
          p.test_cases
            ?.map((tc: string) => {
              try {
                return JSON.parse(tc);
              } catch {
                return null;
              }
            })
            .filter(Boolean) ?? [];

        const mapped = {
          id: p.id,
          title: p.title,
          description: htmlToPrettyText(p.body),
          difficulty: p.difficulty,
          languages: p.language ?? ["python"],
          testCases: parsedTestCases,
        };

        setProblem(mapped);

        setLanguagePresets(
          mapped.languages.map((lang: string) => ({
            label: lang.toUpperCase(),
            value: lang,
            starter: `// write your code here\n// language: ${lang}\n`,
          }))
        );
      } catch (err) {
        console.error(err);
        setDetailError("문제 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProblem();
  }, [problemId]);

  // 언어 초기 세팅
  useEffect(() => {
    if (languagePresets.length === 0) return;

    const first = languagePresets[0];
    setLanguage(first.value);
    setCode(first.starter);
  }, [languagePresets]);

  const currentLanguage = useMemo(
    () => languagePresets.find((preset) => preset.value === language),
    [language, languagePresets]
  );

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const preset = languagePresets.find((item) => item.value === next);

    setLanguage(next);
    if (preset) setCode(preset.starter);
  };

  const handleReset = () => {
    if (currentLanguage) setCode(currentLanguage.starter);
  };

  const handleRun = async () => {
    if (!language) return;

    setIsRunning(true);
    setResult(null);

    try {
      const res = await apiClient.post(`/problems/${problemId}/run`, {
        language,
        code,
      });

      setResult(res.data.output);
    } catch (e: any) {
      setResult(`⚠ 실행 오류\n${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!language) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await apiClient.post(`/problems/${problemId}/submit`, {
        language,
        code,
      });

      setResult(res.data.output);
    } catch (e: any) {
      setResult(`⚠ 제출 오류\n${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 힌트 가져오기
  const handleGetHint = async () => {
    if (!problemId) return;

    setIsHintLoading(true);
    try {
      const res = await apiClient.get(`/problems/${problemId}/hint`);
      setHint(res.data?.hint ?? "힌트를 불러올 수 없습니다.");
    } catch (e) {
      setHint("힌트를 가져오는 데 실패했습니다.");
    } finally {
      setIsHintLoading(false);
    }
  };

  return (
    <div className="solve-page">
      {/* 왼쪽 컬럼: 문제 + 힌트 */}
      <div className="solve-page__left">
        {/* 문제 영역 */}
        <section className="solve-page__problem">
          <header className="problem-header">
            <div>
              <p className="problem-header__tag">레벨 {problem?.difficulty}</p>
              <h1 className="problem-header__title">{problem?.title}</h1>
            </div>
          </header>

          <article className="problem-section card">
            <header className="card__head">
              <h2>문제 설명</h2>
            </header>

            <div className="card__body">
              {isLoading ? (
                <p>문제를 불러오는 중...</p>
              ) : (
                <>
                  <pre className="problem-text">{problem?.description}</pre>

                  {/* ⬇ 여기서부터 입출력 형식 / 예제 */}
                  <section className="card__subsection">
                    <h3>입출력 형식</h3>
                    {problem?.testCases?.map((tc: any, i: number) => (
                      <div key={i} style={{ marginBottom: "1rem" }}>
                        <div>
                          <strong>입력 #{i + 1}</strong>
                        </div>
                        <pre>{tc.input}</pre>

                        <div>
                          <strong>출력 #{i + 1}</strong>
                        </div>
                        <pre>{tc.output}</pre>
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>
          </article>

          {detailError && <p className="solve-page__error">{detailError}</p>}

          {/* 힌트 영역 (문제 바로 아래 카드) */}
          <section className="hint-section card">
            <header className="card__head hint-header">
              <h2>힌트</h2>

              {!hint && (
                <button
                  className="btn btn--hint-small"
                  onClick={handleGetHint}
                  disabled={isHintLoading}
                >
                  {isHintLoading ? "..." : "힌트 생성하기"}
                </button>
              )}
            </header>

            <div className="card__body">
              {hint ? (
                <pre className="hint-text">{hint}</pre>
              ) : (
                <p className="hint-empty-text">힌트를 생성해보세요!</p>
              )}
            </div>
          </section>
        </section>
      </div>

      {/* 오른쪽 컬럼: 코드 영역 */}
      <section className="solve-page__workspace card workspace-card">
        <header className="workspace-card__head">
          <h2>코드</h2>
        </header>

        <div className="workspace-card__body">
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

            <button
              className="workspace-header__reset"
              onClick={handleReset}
              disabled={!currentLanguage}
            >
              초기화
            </button>
          </div>

          <div className="workspace-editor">
            <IDEEditor value={code} onChange={setCode} language={language} />
          </div>

          <footer className="workspace-footer">
            <div className="workspace-footer__buttons">
              <button
                className="btn btn--ghost"
                onClick={handleRun}
                disabled={isRunning || isLoading}
              >
                {isRunning ? "실행 중..." : "실행하기"}
              </button>

              <button
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "제출 중..." : "제출하기"}
              </button>
            </div>

            {result && (
              <div className="workspace-footer__result">
                <h3>실행 결과</h3>
                <pre>{result}</pre>
              </div>
            )}
          </footer>
        </div>
      </section>
    </div>
  );
}
