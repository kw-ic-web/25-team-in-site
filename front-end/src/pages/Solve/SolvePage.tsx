import { ChangeEvent, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./SolvePage.css";
import apiClient from "../../api/client";
import IDEEditor from "../../components/IDEEditer/IDEEditer";
import { useRef } from "react";

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

const API_PATH_PREFIX_REGEX = /\/api\/?v1?\/?$/;
const DEFAULT_HINT_WS_PORT = import.meta.env.VITE_HINT_WS_URL || "20992";
const DEFAULT_HINT_WS_PATH = "/ws/hint";

const DEFAULT_EVALUATE_WS_PORT =
  import.meta.env.VITE_EVALUATE_WS_URL || "20992";
const DEFAULT_EVALUATE_WS_PATH = "/ws/evaluate";

function buildHintWebSocketUrl(token: string | null): string {
  const explicitWsEndpoint = import.meta.env.VITE_HINT_WS_URL;
  const hostCandidate =
    explicitWsEndpoint ||
    import.meta.env.VITE_API_PROXY ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

  const url = new URL(hostCandidate, window.location.origin);
  const isSecurePage = window.location.protocol === "https:";
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  if (isHttp) {
    url.protocol = url.protocol === "https:" || isSecurePage ? "wss:" : "ws:";
  } else if (url.protocol === "ws:" && isSecurePage) {
    url.protocol = "wss:";
  }

  if (!explicitWsEndpoint) {
    const trimmedPath = url.pathname
      .replace(API_PATH_PREFIX_REGEX, "")
      .replace(/\/$/, "");
    url.pathname = `${trimmedPath}${DEFAULT_HINT_WS_PATH}`.replace(
      /^\/{2,}/,
      "/"
    );
    url.port = DEFAULT_HINT_WS_PORT;
    url.search = "";
  }

  url.hash = "";
  url.searchParams.delete("token");
  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}

function buildEvaluateWebSocketUrl(token: string | null): string {
  const explicitWsEndpoint = import.meta.env.VITE_EVALUATE_WS_URL;
  const hostCandidate =
    explicitWsEndpoint ||
    import.meta.env.VITE_API_PROXY ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

  const url = new URL(hostCandidate, window.location.origin);
  const isSecurePage = window.location.protocol === "https:";
  const isHttp = url.protocol === "http:" || url.protocol === "https:";
  if (isHttp) {
    url.protocol = url.protocol === "https:" || isSecurePage ? "wss:" : "ws:";
  } else if (url.protocol === "ws:" && isSecurePage) {
    url.protocol = "wss:";
  }

  if (!explicitWsEndpoint) {
    const trimmedPath = url.pathname
      .replace(API_PATH_PREFIX_REGEX, "")
      .replace(/\/$/, "");
    url.pathname = `${trimmedPath}${DEFAULT_EVALUATE_WS_PATH}`.replace(
      /^\/{2,}/,
      "/"
    );
    url.port = DEFAULT_EVALUATE_WS_PORT;
    url.search = "";
  }

  url.hash = "";
  url.searchParams.delete("token");
  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}

export default function SolvePage() {
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get("problemId") ?? "";

  const navigate = useNavigate();

  const [problem, setProblem] = useState<any>(null);
  const [detailError, setDetailError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [languagePresets, setLanguagePresets] = useState<any[]>([]);
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");

  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintAvailable, setHintAvailable] = useState(false);

  const [result, setResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsEvalRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const [didSubmit, setDidSubmit] = useState(false);

  const isSaving = useRef(false);

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
          mapped.languages.map((lang: string) => {
            const norm =
              lang.toLowerCase() === "python"
                ? "py"
                : lang.toLowerCase() === "javascript"
                ? "js"
                : lang.toLowerCase();
            return {
              label: norm.toUpperCase(),
              value: norm,
            };
          })
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

  const handleGetHint = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("힌트 서버와 연결되지 않았습니다.");
      return;
    }
    setIsHintLoading(true);
    setHint(null);
    setHintAvailable(false);

    wsRef.current.send(
      JSON.stringify({
        type: "hint:request",
        problemId,
        language,
      })
    );
  };

  const handleRun = () => {
    if (!wsEvalRef.current || wsEvalRef.current.readyState !== WebSocket.OPEN) {
      alert("실행 서버와 연결되지 않았습니다.");
      return;
    }
    setIsRunning(true);
    setResult(null);

    wsEvalRef.current.send(
      JSON.stringify({
        type: "evaluate:test-request",
        data: {
          problemId,
          code,
          language,
        },
      })
    );
  };

  const handleSubmit = () => {
    if (!wsEvalRef.current || wsEvalRef.current.readyState !== WebSocket.OPEN) {
      alert("제출 서버와 연결되지 않았습니다.");
      return;
    }
    setIsSubmitting(true);
    setResult(null);

    wsEvalRef.current.send(
      JSON.stringify({
        type: "evaluate:submission-request",
        data: {
          problemId,
          code,
          language,
        },
      })
    );
  };

  useEffect(() => {
    if (!problemId || !language) return;

    const interval = setInterval(async () => {
      if (isSaving.current) return;
      if (!code || !code.trim() || !language) return;

      isSaving.current = true;
      try {
        await apiClient.post("/code", {
          code,
          language,
          problemId,
        });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "";
        if (msg.includes("Connection is closed")) {
          console.warn("WS 종료로 인한 /code 무시");
          return;
        }
        console.error("/code error:", msg);
      } finally {
        isSaving.current = false;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [problemId, language, code]);

  // 코드 저장 로직 그대로 유지

  function connectWS(cancelledRef: { current: boolean }) {
    const token = localStorage.getItem("accessToken");
    const wsUrl = buildHintWebSocketUrl(token);
    wsRef.current = new WebSocket(wsUrl);
    console.info("[hint-ws] connecting", wsUrl);

    wsRef.current.onopen = () => {
      console.log("WS 연결 완료");
    };

    wsRef.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log("WS 메시지 수신:", data);

        if (data.type === "hint:prompt") {
          console.log("힌트 사용 가능");
          setHintAvailable(true);
          setIsHintLoading(false);
        }

        if (data.type === "hint:committed") {
          console.log("힌트 처리 중...");
          setHintAvailable(false);
        }

        if (data.type === "hint:response") {
          console.log("힌트 도착");
          setHintAvailable(false);
          setIsHintLoading(false);
          setHint(data.data.hint);
        }

        if (data.type === "hint:abort") {
          console.log("힌트 ABORT");
          setIsHintLoading(false);
        }
      } catch {
        console.warn("WS 메시지 JSON 파싱 오류");
      }
    };

    wsRef.current.onerror = (err) => {
      console.error("[hint-ws] 오류", err);
    };

    wsRef.current.onclose = (event) => {
      console.warn("[hint-ws] 연결 종료");
      setHintAvailable(false);
      if (cancelledRef.current) return;
      reconnectTimerRef.current = window.setTimeout(
        () => connectWS(cancelledRef),
        3000
      );
    };
  }

  function connectEvalWS(cancelledRef: { current: boolean }) {
    const token = localStorage.getItem("accessToken");
    const wsUrl = buildEvaluateWebSocketUrl(token);
    wsEvalRef.current = new WebSocket(wsUrl);
    console.info("[eval-ws] connecting", wsUrl);

    wsEvalRef.current.onopen = () => {
      console.log("evaluate WS 연결 완료");
    };

    wsEvalRef.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log("WS 평가 수신:", data);

        if (data.type === "evaluate:test-response") {
          setIsRunning(false);

          if (data.data?.results?.length) {
            const outputs = data.data.results.map((r) => r.actualOutput);
            setResult(outputs.join("\n"));
          } else {
            setResult("⚠ 결과 없음");
          }
        }
        if (data.type === "evaluate:submission-response") {
          setIsSubmitting(false);

          const submission = data.data;
          if (!submission) {
            setResult("⚠ 제출 결과를 받지 못했습니다.");
            return;
          }

          // 모든 테스트 케이스를 통과해야 제출 성공
          if (submission.passed === true) {
            setResult(`🎉 모든 ${submission.totalCases}개 테스트 케이스 통과!`);
            setDidSubmit(true);
          } else {
            // 제출 실패 — 하나라도 틀림
            const results = submission.results || [];
            const failedCases = results.filter((r: any) => !r.isPassed);

            let msg = `❌ 제출 실패: ${failedCases.length}개 테스트 실패\n\n`;

            failedCases.slice(0, 5).forEach((r: any) => {
              msg += `CASE #${r.caseId} → actualOutput: ${r.actualOutput}\n`;
            });

            if (failedCases.length > 5) {
              msg += `... 그 외 ${failedCases.length - 5}개 케이스 실패`;
            }

            setResult(msg);
            setDidSubmit(false); // 이게 중요!
          }
        }
        if (data.type === "error") {
          setIsRunning(false);
          setIsSubmitting(false);
          setResult(`❗ ${data.message}`);
        }
      } catch {
        console.warn("평가 메시지 JSON 파싱 오류");
      }
    };

    wsEvalRef.current.onerror = (err) => {
      console.error("[eval-ws] 오류", err);
    };

    wsEvalRef.current.onclose = () => {
      console.warn("[eval-ws] 연결 종료");
      if (cancelledRef.current) return;
      reconnectTimerRef.current = window.setTimeout(
        () => connectEvalWS(cancelledRef),
        3000
      );
    };
  }

  useEffect(() => {
    if (!problemId || !language) return;
    const cancelledRef = { current: false };
    connectWS(cancelledRef);
    connectEvalWS(cancelledRef);
    return () => {
      cancelledRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsEvalRef.current?.close();
    };
  }, [problemId, language]);

  useEffect(() => {
    if (didSubmit) {
      navigate("/home");
    }
  }, [didSubmit]);

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
          <span>코드</span>

          <div className="code-header-buttons">
            {/* 언어 선택 */}
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

            {/* 초기화 */}
            <button className="btn-reset" onClick={handleReset}>
              초기화
            </button>

            {/* 실행 */}
            <button
              className="btn-run"
              onClick={handleRun}
              disabled={isRunning || isLoading}
            >
              {isRunning ? "실행 중..." : "실행"}
            </button>

            {/* 제출 */}
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "제출 중..." : "제출"}
            </button>
          </div>
        </header>

        {/* code 영역 바디는 IDEEditor만 */}
        <div className="panel-content code-editor-pane scroll">
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
              disabled={isHintLoading || !hintAvailable}
            >
              {isHintLoading
                ? "생성 중..."
                : hintAvailable
                ? "힌트 생성하기"
                : "힌트 대기중..."}
            </button>
          )}
        </header>
        <div className="panel-content scroll">
          {hint ? (
            <pre className="hint-text">{hint}</pre>
          ) : (
            <p>힌트가 아직 없습니다.</p>
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
