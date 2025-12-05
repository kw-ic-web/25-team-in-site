import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getChoseong } from "es-hangul"; // 초성 추출
import "./WrongPage.css";
import apiClient from "../../api/client";

type Solved = {
  id: string;
  title: string;
  tags: string[];
  difficulty: number;
  correctness: number;
  language: string;
  type: "기본 문제" | "자료구조" | "알고리즘";
  kind:
    | "정렬"
    | "탐색"
    | "재귀"
    | "동적 계획법"
    | "그리디 알고리즘"
    | "백트래킹";
  solved?: boolean;
  points: string;
};

const LANGUAGES = [
  "HTML",
  "JavaScript",
  "CSS",
  "Java",
  "C",
  "C++",
  "Python",
  "MySQL",
] as const;
const TYPES = ["기본 문제", "자료구조", "알고리즘"] as const;
const KINDS = [
  "정렬",
  "탐색",
  "재귀",
  "동적 계획법",
  "그리디 알고리즘",
  "백트래킹",
] as const;

// 공백 제거 + 소문자 변환
const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase();

function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

const SolutionAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="solution-assistant" data-open={isOpen}>
      <button onClick={() => setIsOpen(!isOpen)} className="assistant-toggle">
        <span className="assistant-title">도우미 어시스턴트</span>
        <span className="assistant-toggle-text">
          {isOpen ? "닫기" : "펼쳐보기"}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {isOpen && (
        <div className="assistant-content">
          <h4>평가 결과:</h4>
          <p>코드가 깔끔하고 효율적입니다. ~~~</p>
          <h4>개선 제안</h4>
          <ul>
            <li>이로 인해 ~~~ 변수 초기화가 누락되어 ~~~~</li>
            <li>변수 초기화가 누락되어 ~~~ 이러</li>
          </ul>
        </div>
      )}
    </div>
  );
};

// --- (WrongPage 메인 컴포넌트) ---
export default function WrongPage() {
  const [solved, setSolved] = useState<Solved[]>([]);
  const [stats, setStats] = useState({
    totalSolved: 0,
    wrongProblems: 0,
    retryProblems: 0,
    retrySuccessRate: 0,
  });
  const [totalSolvedCount, setTotalSolvedCount] = useState(0);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"latest" | "acc" | "diff">("latest");
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [selectedType, setSelectedType] = useState<
    (typeof TYPES)[number] | null
  >(null);
  const [selectedKind, setSelectedKind] = useState<
    (typeof KINDS)[number] | null
  >(null);
  const [solvedOnly, setSolvedOnly] = useState(false);

  const [typeOpen, setTypeOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);
  const typeRef = useClickOutside<HTMLDivElement>(() => setTypeOpen(false));
  const kindRef = useClickOutside<HTMLDivElement>(() => setKindOpen(false));

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const pageSize = 8;

  const toggleLang = (l: string) =>
    setSelectedLangs((prev) => {
      const next = new Set(prev);
      next.has(l) ? next.delete(l) : next.add(l);
      setPage(1);
      return next;
    });

  const toggleLevel = (n: number) =>
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      setPage(1);
      return next;
    });

  const clearType = () => setSelectedType(null);
  const clearKind = () => setSelectedKind(null);

  const filtered = useMemo(() => {
    let list = [...solved];

    // 검색 (공백 무시 + 초성 검색)
    if (query.trim()) {
      const raw = query.trim();
      const normalizedQuery = normalize(raw); // 공백 제거 + 소문자
      const rawNoSpace = raw.replace(/\s+/g, "");
      const queryChoseong = getChoseong(raw).replace(/\s+/g, "");

      list = list.filter((p) => {
        const title = p.title;
        const normalizedTitle = normalize(title);
        const titleChoseong = getChoseong(title).replace(/\s+/g, "");
        const hasChoseong = queryChoseong.length > 0;

        return (
          // 1) 공백 무시 일반 검색
          normalizedTitle.includes(normalizedQuery) ||
          // 2) 초성 직접 입력 ("ㅊㄷㄱ" 등)
          titleChoseong.includes(rawNoSpace) ||
          // 3) 입력값을 초성으로 변환 후 비교
          (hasChoseong && titleChoseong.includes(queryChoseong))
        );
      });
    }

    if (selectedLangs.size) {
      list = list.filter((p) => selectedLangs.has(p.language));
    }
    if (selectedLevels.size) {
      list = list.filter((p) => selectedLevels.has(p.difficulty));
    }
    if (selectedType) list = list.filter((p) => p.type === selectedType);
    if (selectedKind) list = list.filter((p) => p.kind === selectedKind);
    if (solvedOnly) list = list.filter((p) => p.solved);

    switch (sortKey) {
      case "acc":
        list.sort((a, b) => b.correctness - a.correctness);
        break;
      case "diff":
        list.sort((a, b) => a.difficulty - b.difficulty);
        break;
      default:
        list.sort((a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1)));
    }

    return list;
  }, [
    solved,
    query,
    selectedLangs,
    selectedLevels,
    selectedType,
    selectedKind,
    solvedOnly,
    sortKey,
  ]);

    const pageCount = totalPage;
    const current = filtered;

  useEffect(() => {
    setPage(1);
  }, [query, selectedType, selectedKind, solvedOnly, sortKey]);

  useEffect(() => {
    async function getSolved() {
      try {
        const res = await apiClient.get("problems/recent/solved", {
          params: {
            page,
            limit: pageSize,
          },
        });

        const items = res.data.items ?? [];
        
        // API 응답을 Solved 타입으로 변환
        const normalized = items.map((item: any) => {
          const problem = item.problem || {};
          return {
            id: problem.id || item.solved_id || "",
            title: problem.title || "",
            tags: [],
            difficulty: problem.difficulty || 1,
            correctness: problem.success_rate || 0,
            language: Array.isArray(problem.language) 
              ? problem.language[0] || "기타"
              : problem.language || "기타",
            type: Array.isArray(problem.main_category)
              ? (problem.main_category[0] as any) || "기본 문제"
              : (problem.main_category as any) || "기본 문제",
            kind: Array.isArray(problem.sub_category)
              ? (problem.sub_category[0] as any) || "기타"
              : (problem.sub_category as any) || "기타",
            solved: problem.is_solved ?? true,
            points: problem.expected_xp?.toString() || "0",
          };
        });

        setSolved(normalized);
        
        // pagination이 있으면 사용하고, 없으면 count 기반으로 계산
        if (res.data.pagination) {
          setTotalPage(res.data.pagination.total_pages ?? 1);
          setTotalSolvedCount(res.data.pagination.total_count ?? res.data.count ?? 0);
        } else {
          const totalCount = res.data.count ?? 0;
          setTotalPage(Math.ceil(totalCount / pageSize) || 1);
          setTotalSolvedCount(totalCount);
        }
      } catch (err) {
        console.error(err);
      }
    }
    getSolved();
  }, [page]);

  useEffect(() => {
    async function getStats() {
      try {
        const res = await apiClient.get("/user/stats");
        const data = res.data;
        
        setStats({
          totalSolved: data.profile?.totalSolved ?? totalSolvedCount,
          wrongProblems: 0, // 백엔드에서 제공하지 않으면 0
          retryProblems: 0, // 백엔드에서 제공하지 않으면 0
          retrySuccessRate: 0, // 백엔드에서 제공하지 않으면 0
        });
      } catch (err) {
        console.error("통계 데이터를 불러오지 못했습니다:", err);
        // 에러 발생 시 solved 데이터 기반으로 계산
        setStats({
          totalSolved: totalSolvedCount,
          wrongProblems: 0,
          retryProblems: 0,
          retrySuccessRate: 0,
        });
      }
    }
    getStats();
  }, [totalSolvedCount]);

  const dropdownIcon = "/assets/icons/dropdown-arrow.svg";
  const recommendedProblem = solved[0];
  const expectedSolveTime = "30분";

  const recentProblems = Array.from({ length: 6 }, (_, i) => ({
    id: `recent${i + 1}`,
    title: "알고리즘 문제",
    date: "1일 전 해결",
    level: (i % 5) + 1,
  }));

  const statsData = [
    { label: "총 학습 문제", value: stats.totalSolved.toString(), style: "" },
    { label: "오답 문제", value: stats.wrongProblems.toString(), style: "stat-box__value--accent" },
    { label: "재도전 문제", value: stats.retryProblems.toString(), style: "" },
    { label: "재도전 성공률", value: stats.retrySuccessRate > 0 ? `${stats.retrySuccessRate}%` : "-", style: "stat-box__value--success" },
  ];

  return (
    <div className="home">
      <aside className="home__sidebar">
        <section className="home-card">
          <header className="home-card__header">
            <h3>난이도</h3>
          </header>
          <ul className="level-filters">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <label className="level-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={selectedLevels.has(n)}
                    onChange={() => toggleLevel(n)}
                  />
                  <span className="level-text">레벨 {n}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-card">
          <div className="stats-vertical-list">
            {statsData.map((stat) => (
              <div className="stat-box" key={stat.label}>
                <span className="stat-box__label">{stat.label}</span>
                <strong className={`stat-box__value ${stat.style}`}>
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="home__content">
        <header className="home__content-header">
          <div className="stat" aria-live="polite">
            <div className="stat__heading">
              <h2>오답 풀이</h2>
            </div>
            <div className="searchbar">
              <input
                type="search"
                placeholder="문제 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="문제 검색"
              />
            </div>
          </div>

          <div className="filters-bar">
            <div className="chip dropdown" ref={typeRef}>
              <button
                type="button"
                className="dropdown__trigger"
                aria-haspopup="menu"
                aria-expanded={typeOpen}
                onClick={() => {
                  setTypeOpen((v) => !v);
                  setKindOpen(false);
                }}
              >
                문제 유형 {selectedType ? `: ${selectedType}` : ""}
                <img
                  src={dropdownIcon}
                  alt=""
                  aria-hidden="true"
                  className="dropdown__icon"
                />
              </button>
              {typeOpen && (
                <div role="menu" className="dropdown__menu">
                  <button
                    className="dropdown__item dropdown__item--clear"
                    onClick={clearType}
                  >
                    전체 해제
                  </button>
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      role="menuitem"
                      className={`dropdown__item ${
                        selectedType === t ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedType(t);
                        setTypeOpen(false);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="chip dropdown" ref={kindRef}>
              <button
                type="button"
                className="dropdown__trigger"
                aria-haspopup="menu"
                aria-expanded={kindOpen}
                onClick={() => {
                  setKindOpen((v) => !v);
                  setTypeOpen(false);
                }}
              >
                유형별 분류 {selectedKind ? `: ${selectedKind}` : ""}
                <img
                  src={dropdownIcon}
                  alt=""
                  aria-hidden="true"
                  className="dropdown__icon"
                />
              </button>
              {kindOpen && (
                <div role="menu" className="dropdown__menu">
                  <button
                    className="dropdown__item dropdown__item--clear"
                    onClick={clearKind}
                  >
                    전체 해제
                  </button>
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      role="menuitem"
                      className={`dropdown__item ${
                        selectedKind === k ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedKind(k);
                        setKindOpen(false);
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              className="chip chip--select filters-bar__sort"
              aria-label="정렬"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              <option value="latest">최신순</option>
              <option value="acc">정답률 높은 순</option>
              <option value="diff">난이도 낮은 순</option>
            </select>
          </div>
        </header>

        <ul className="solved-list">
          {current.map((p) => (
            <li key={p.id} className="solved-item">
              <div className="solved-item__left">
                <div className="solved-item__header">
                  <h4 className="solved-item__title">
                    {p.title?.replace(/\s\d+$/, "") ?? p.title ?? ""}
                  </h4>
                  <span className="badge badge--error">힌트 4회 사용</span>
                </div>
                <div className="solved-item__labels">
                  <span className="pill pill--level">레벨 {p.difficulty}</span>
                </div>
                <div className="solved-item__meta">
                  {(p.tags || []).map((t: string, idx: number) => (
                    <span key={`${t}-${idx}`}>#{t}</span>
                  ))}
                </div>
              </div>

              <div className="solved-item__right">
                <button type="button" className="btn-primary">
                  풀이하기
                </button>
              </div>

              <SolutionAssistant />
            </li>
          ))}

          {current.length === 0 && (
            <li className="solved-item" style={{ justifyContent: "center" }}>
              조건에 맞는 문제가 없습니다.
            </li>
          )}
        </ul>

        <footer
          className="pagination"
          role="navigation"
          aria-label="페이지네이션"
        >
          <button
            type="button"
            className="page"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`page ${p === page ? "is-active" : ""}`}
              aria-current={p === page ? "page" : undefined}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="page"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
        </footer>
      </section>

      <aside className="home__aside">
        <section className="recommend">
          <div className="recommend__top">
            <div>
              <p className="recommend__eyebrow">유사 문제 추천</p>
              <h4 className="recommend__title">
                {recommendedProblem?.title ?? "추천 문제를 준비 중이에요"}
              </h4>
            </div>
          </div>
          <div className="recommend__details">
            <span className="recommend__level">
              레벨 {recommendedProblem?.difficulty ?? "-"}
            </span>
            <div className="recommend__tags-row">
              <div className="recommend__info">
                <p className="recommend__time">
                  예상 시간: {expectedSolveTime}
                </p>
                <div className="recommend__tags" aria-label="추천 문제 유형">
                  {recommendedProblem ? (
                    <>
                      <span>#{recommendedProblem.type}</span>
                      <span>#{recommendedProblem.kind}</span>
                    </>
                  ) : (
                    <span>#유형 준비 중</span>
                  )}
                </div>
              </div>
              <button type="button" className="recommend__cta">
                도전
              </button>
            </div>
          </div>
        </section>

        <section className="home-card">
          <header className="home-card__header">
            <h3>최근 푼 문제</h3>
          </header>
          <ul className="recent-list">
            {recentProblems.map((item) => (
              <li key={item.id} className="recent-item">
                <div className="recent-item__content">
                  <h4 className="recent-item__title">{item.title}</h4>
                  <span className="recent-item__date">{item.date}</span>
                </div>
                <button type="button" className="btn-recent">
                  재확인
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
