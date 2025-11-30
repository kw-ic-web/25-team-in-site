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
  const problemId = searchParams.get("problemId") ?? "";

  const [problem, setProblem] = useState<any>(null);
  const [detailError, setDetailError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [languagePresets, setLanguagePresets] = useState<any[]>([]);
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");

  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } catch {
        setDetailError("문제 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProblem();
  }, [problemId]);

  useEffect(() => {
    if (!languagePresets.length) return;
    setLanguage(languagePresets[0].value);
    setCode(languagePresets[0].starter);
  }, [languagePresets]);

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(languagePresets.find((l) => l.value === newLang).starter);
  };

  const handleReset = () => {
    const preset = languagePresets.find((l) => l.value === language);
    if (preset) setCode(preset.starter);
  };

  const handleGetHint = async () => {
    if (!problemId) return;
    setIsHintLoading(true);
    try {
      const res = await apiClient.get(`/problems/${problemId}/hint`);
      setHint(res.data?.hint ?? "힌트를 불러올 수 없습니다.");
    } catch {
      setHint("힌트를 가져오는 데 실패했습니다.");
    } finally {
      setIsHintLoading(false);
    }
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

  return (
    <div className="solve-page">
      {/* (1,1) 문제 */}
      <section className="solve-page__problem panel">
        <header className="panel-title">문제</header>
        <div className="panel-content scroll">
          {isLoading ? (
            <p>로드 중...</p>
          ) : (
            <>
              <h2>{problem?.title}</h2>
              <pre className="problem-text">{problem?.description}</pre>
            </>
          )}
        </div>
      </section>

      {/* (1,2)(2,2) 코드 */}
      <section className="solve-page__workspace panel">
        <header className="panel-title code-title">
          코드
          <div className="code-buttons-header">
            <button
              className="run-button"
              onClick={handleRun}
              disabled={isRunning || isLoading}
            >
              {isRunning ? "실행 중..." : "실행하기"}
            </button>

            <button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
              {isSubmitting ? "제출 중..." : "제출하기"}
            </button>
          </div>
        </header>

        <div className="panel-content scroll code-area">
          <div className="workspace-controls">
            <select
              className="select-language"
              value={language}
              onChange={handleLanguageChange}
            >
              {languagePresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            <button className="btn-reset" onClick={handleReset}>
              초기화
            </button>
          </div>

          <IDEEditor value={code} onChange={setCode} language={language} />
        </div>
      </section>

      {/* (2,1) 힌트 */}
      <section className="solve-page__hint panel">
        <header className="panel-title">
          힌트
          {!hint && (
            <button
              className="btn-hint-generate"
              onClick={handleGetHint}
              disabled={isHintLoading}
            >
              {isHintLoading ? "생성 중..." : "힌트 생성하기"}
            </button>
          )}
        </header>
        <div className="panel-content scroll">
          {hint ? (
            <pre className="hint-text">{hint}</pre>
          ) : (
            <p>힌트를 불러오세요.</p>
          )}
        </div>
      </section>

      {/* (3,1-2) 실행결과 */}
      <section className="solve-page__result panel">
        <header className="panel-title">실행 결과</header>
        <div className="panel-content scroll">
          {result ? <pre>{result}</pre> : <p>아직 실행 결과 없음</p>}
        </div>
      </section>
    </div>
  );
}
