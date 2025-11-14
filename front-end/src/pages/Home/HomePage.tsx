import { useEffect, useMemo, useRef, useState } from "react";
import "./HomePage.css";
const personImg = new URL("../../assets/person.png", import.meta.url).href;

type Problem = {
  id: string;
  title: string;
  tags: string[];          // ["백준","그래프"] 등
  difficulty: number;      // 1~5
  correctness: number;     // %
  language: string;        // "JavaScript" 등
  type: "기본 문제" | "자료구조" | "알고리즘" | "응용 문제" | "실전/프로젝트형";
  kind:
    | "정렬"
    | "탐색"
    | "재귀"
    | "동적 계획법"
    | "그리디 알고리즘"
    | "백트래킹";
  solved?: boolean;        // 해결 여부
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

const TYPES = [
  "기본 문제",
  "자료구조",
  "알고리즘",
  "응용 문제",
  "실전/프로젝트형",
] as const;

const KINDS = [
  "정렬",
  "탐색",
  "재귀",
  "동적 계획법",
  "그리디 알고리즘",
  "백트래킹",
] as const;

// ----- 유틸: 바깥 클릭 닫기
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

export default function HomePage() {
  // ---------------- Mock 데이터 (API 붙이기 전까지) ----------------
  const problems: Problem[] = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: `p${i + 1}`,
        title: `최단 경로 찾기 ${i + 1}`,
        tags: ["백준", "그래프"],
        difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        correctness: 67,
        language: LANGUAGES[i % LANGUAGES.length],
        type: TYPES[i % TYPES.length],
        kind: KINDS[i % KINDS.length],
        solved: i % 4 === 0,
      })),
    []
  );

  // --------------------- UI/필터 상태 ---------------------
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"latest" | "acc" | "diff">("latest");
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [selectedType, setSelectedType] = useState<(typeof TYPES)[number] | null>(null);
  const [selectedKind, setSelectedKind] = useState<(typeof KINDS)[number] | null>(null);
  const [solvedOnly, setSolvedOnly] = useState(false);

  // 드롭다운 토글
  const [typeOpen, setTypeOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);
  const typeRef = useClickOutside<HTMLDivElement>(() => setTypeOpen(false));
  const kindRef = useClickOutside<HTMLDivElement>(() => setKindOpen(false));

  // 페이징
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // --------------------- 핸들러 ---------------------
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

  // --------------------- 필터/정렬/페이징 ---------------------
  const filtered = useMemo(() => {
    let list = [...problems];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
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
      default: // latest
        list.sort((a, b) => Number(b.id.slice(1)) - Number(a.id.slice(1)));
    }

    return list;
  }, [
    problems,
    query,
    selectedLangs,
    selectedLevels,
    selectedType,
    selectedKind,
    solvedOnly,
    sortKey,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    // 필터 바뀌면 1페이지로
    setPage(1);
  }, [query, selectedType, selectedKind, solvedOnly, sortKey]);

  // --------------------- 렌더 ---------------------
  const XP_REWARD = 50;
  const dropdownIcon = "/assets/icons/dropdown-arrow.svg";
  const recommendedProblem = problems[0];
  const expectedSolveTime = "30분";

  return (
    <div className="home">
      {/* 좌측 필터 */}
      <aside className="home__sidebar">
        <section className="home-card home-card--emph">
          <header className="home-card__header">
            <h3>출석 현황</h3>
          </header>
          <div className="attendance">
            <span className="attendance__label">현재 연속 출석</span>
            <strong className="attendance__days">23일 차</strong>
          </div>
        </section>

        <section className="home-card">
          <header className="home-card__header">
            <h3>프로그래밍 언어</h3>
          </header>
          <ul className="filter-list">
            {LANGUAGES.map((l) => (
              <li key={l} className="filter-list__item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedLangs.has(l)}
                    onChange={() => toggleLang(l)}
                  />{" "}
                  <span>{l}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-card">
          <header className="home-card__header">
            <h3>난이도</h3>
          </header>
          <ul className="filter-list">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
              <li key={n} className="filter-list__item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedLevels.has(n)}
                    onChange={() => toggleLevel(n)}
                  />{" "}
                  <span>레벨 {n}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* 중앙 목록 */}
      <section className="home__content">
        <header className="home__content-header">
          <div className="stat" aria-live="polite">
            <div className="stat__heading">
              <h2>전체 문제</h2>
              <span>{filtered.length}</span>
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

          {/* 검색 & 칩/토글 영역 */}
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
                    <img src={dropdownIcon} alt="" aria-hidden="true" className="dropdown__icon" />
              </button>
              {typeOpen && (
                <div role="menu" className="dropdown__menu">
                  <button className="dropdown__item dropdown__item--clear" onClick={clearType}>
                    전체 해제
                  </button>
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      role="menuitem"
                      className={`dropdown__item ${selectedType === t ? "is-selected" : ""}`}
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
                    <img src={dropdownIcon} alt="" aria-hidden="true" className="dropdown__icon" />
              </button>
              {kindOpen && (
                <div role="menu" className="dropdown__menu">
                  <button className="dropdown__item dropdown__item--clear" onClick={clearKind}>
                    전체 해제
                  </button>
                  {KINDS.map((k) => (
                    <button
                      key={k}
                      role="menuitem"
                      className={`dropdown__item ${selectedKind === k ? "is-selected" : ""}`}
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

            <label className="chip chip--checkbox">
              <input
                type="checkbox"
                checked={solvedOnly}
                onChange={(e) => setSolvedOnly(e.target.checked)}
              />
              <span>해결 문제만 보기</span>
            </label>

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

        <ul className="problem-list">
          {current.map((p) => (
            <li key={p.id} className="problem-item">
              <div className="problem-item__left">
                <h4 className="problem-item__title">{p.title}</h4>
                <div className="problem-item__labels">
                  <span className="pill pill--level">레벨 {p.difficulty}</span>
                </div>
                <div className="problem-item__meta">
                  {p.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                  <span>#{p.kind}</span>
                  <span>#{p.language}</span>
                </div>
              </div>
              <div className="problem-item__right">
                <span className="correctness">
                  정답률 <strong>{p.correctness}%</strong>
                </span>
                <button type="button" className="btn-primary">
                  풀어보기
                </button>
              </div>
            </li>
          ))}
          {current.length === 0 && (
            <li className="problem-item" style={{ justifyContent: "center" }}>
              조건에 맞는 문제가 없습니다.
            </li>
          )}
        </ul>

        {/* 페이지네이션 */}
        <footer className="pagination" role="navigation" aria-label="페이지네이션">
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

      {/* 우측 추천/랭킹 */}
      <aside className="home__aside">
        <section className="recommend">
          <div className="recommend__top">
            <div>
              <p className="recommend__eyebrow">오늘의 추천 문제</p>
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
                <p className="recommend__time">예상 시간: {expectedSolveTime}</p>
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
            <h3>랭킹</h3>
          </header>
          <ol className="ranking">
            {Array.from({ length: 10 }, (_, i) => ({
              rank: i + 1,
              name: "아이디아이디",
              score: 1234 - i * 7,
            })).map((r) => (
              <li key={r.rank} className="ranking__item">
                <span className={`rank rank--${r.rank <= 3 ? r.rank : "n"}`}>{r.rank}</span>

            <img
              src={personImg}
              alt="사용자 아바타"
              className="avatar avatar--sm"
            />
                <span className="name">{r.name}</span>
                <span className="score">{r.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>

          <div className="my-rank">
            <span className="my-rank__label">내 순위</span>
            <span className="my-rank__value">
              23위 <span className="muted">(667xp)</span>
            </span>
          </div>
        </section>
      </aside>
    </div>
  );
}