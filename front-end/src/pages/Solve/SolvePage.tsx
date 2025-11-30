import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./SolvePage.css";

import apiClient from "../../api/client";
import IDEEditor from "../../components/IDEEditer/IDEEditer";

function htmlToPrettyText(html: string): string {
  let text = html;

  // 1) 줄바꿈 태그를 개행으로
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 2) 문단/블록 태그 뒤에는 줄바꿈
  text = text.replace(/<\/(p|div|h[1-6]|section|article)>/gi, "\n");

  // 3) 리스트 항목은 • 로 표시
  text = text.replace(/<li[^>]*>/gi, "• ");

  // 4) 나머지 모든 태그 제거
  text = text.replace(/<[^>]+>/g, "");

  // 5) 너무 많은 연속 개행 정리 (3줄 이상 → 2줄)
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n");

  // 6) 줄 끝 공백 정리
  text = text.replace(/[ \t]+\n/g, "\n");

  // 7) 앞뒤 공백 제거
  return text.trim();
}

export default function SolvePage() {
  const [searchParams] = useSearchParams();
  const rawProblemId = searchParams.get("problemId");

  /** 상세 문제 데이터 */
  const [problem, setProblem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailError, setDetailError] = useState("");

  /** 언어 / 코드 / 결과 */
  const [languagePresets, setLanguagePresets] = useState<any[]>([]);
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemId = rawProblemId ?? "";

  /** 문제 상세 API 호출 */
  useEffect(() => {
    if (!problemId) return;

    async function fetchProblem() {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/problems/${problemId}`);

        const p = res.data;

        // test_cases 파싱
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

  /** 언어 프리셋 적용 */
  useEffect(() => {
    if (languagePresets.length === 0) return;

    const first = languagePresets[0];
    setLanguage(first.value);
    setCode(first.starter);
  }, [languagePresets]);

  /** 현재 선택된 언어 구조 */
  const currentLanguage = useMemo(
    () => languagePresets.find((preset) => preset.value === language),
    [language, languagePresets]
  );

  /** 언어 변경 */
  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const preset = languagePresets.find((item) => item.value === next);

    setLanguage(next);
    if (preset) setCode(preset.starter);
  };

  /** 초기화 */
  const handleReset = () => {
    if (currentLanguage) setCode(currentLanguage.starter);
  };

  /** 실행 */
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

  /** 제출 */
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

  return (
    <div className="solve-page">
      {/* ------------------------------ */}
      {/* 좌측 문제 설명 영역 */}
      {/* ------------------------------ */}
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

                <section className="card__subsection">
                  <h3>입출력 예제</h3>
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
      </section>

      {/* ------------------------------ */}
      {/* 우측 IDE + 실행/제출 영역 */}
      {/* ------------------------------ */}
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

            <button
              className="workspace-header__reset"
              onClick={handleReset}
              disabled={!currentLanguage}
            >
              초기화
            </button>
          </div>

          {/* IDE */}
          <div className="workspace-editor">
            <IDEEditor value={code} onChange={setCode} language={language} />
          </div>

          {/* 실행 / 제출 버튼 */}
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

            {/* 실행 결과 */}
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
