import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../api/client";
import { getChoseong } from "es-hangul";
import "./HomePage.css";

import { useNavigate } from "react-router-dom";

const personImg = new URL("../../assets/person.png", import.meta.url).href;

export type Problem = {
  id: string;
  title: string;
  tags: string[];
  difficulty: number;
  correctness: number;
  language: string;
  type: string;
  kind: string;
  solved: boolean;
};

// ESLint unused-vars 경고 해결 → export를 붙인다
export const LANGUAGES = [
  "HTML",
  "JavaScript",
  "CSS",
  "Java",
  "C",
  "C++",
  "Python",
  "MySQL",
] as const;

export const TYPES = ["기본 문제", "자료구조", "알고리즘"] as const;

export const KINDS = [
  "정렬",
  "탐색",
  "재귀",
  "동적 계획법",
  "그리디 알고리즘",
  "백트래킹",
] as const;

// 공백 제거 + 소문자 변환용 유틸
const normalize = (text: string) => text.replace(/\s+/g, "").toLowerCase();

// 외부 클릭 감지
function useClickOutside<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

export default function HomePage() {
  // API 데이터
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //  /api/v1/problems API 연동
  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);

        const res = await apiClient.get("/problems", {
          params: {
            page,
            limit: pageSize,
            // TODO: 필터 파라미터도 함께 전달 필요
          },
        });

        const list = res.data.problems;

        if (!Array.isArray(list)) {
          console.error("문제 데이터가 배열이 아닙니다:", res.data);
          setError("서버 응답 형식이 올바르지 않습니다.");
          return;
        }

        // 백엔드 응답 → 프론트 구조로 변환
        const normalized = list.map((p: any, i: number) => ({
          id: p.id ?? `p${i + 1}`,
          title: p.title,
          tags: [],
          difficulty: p.difficulty ?? 1,
          correctness: p.success_rate ?? 0,
          language: Array.isArray(p.language)
            ? p.language[0] ?? "기타"
            : "기타",
          type: p.main_category ?? "기본 문제",
          kind: p.sub_category ?? "기타",
          solved: false,
        }));

        setProblems(normalized);
        if (res.data.pagination) {
          setTotalPage(res.data.pagination.total_pages);
        }
      } catch (err) {
        console.error(err);
        setError("문제 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, [page]);

  // 필터 관련 상태
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"latest" | "acc" | "diff">("latest");
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<string | null>(null);
  const [solvedOnly, setSolvedOnly] = useState(false);

  const [typeOpen, setTypeOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);

  const typeRef = useClickOutside<HTMLDivElement>(() => setTypeOpen(false));
  const kindRef = useClickOutside<HTMLDivElement>(() => setKindOpen(false));

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const pageSize = 8;

  const navigate = useNavigate();

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

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let list = [...problems];

    if (query.trim()) {
      const raw = query.trim();
      const normalizedQuery = normalize(raw); // 공백 제거 + 소문자
      const rawNoSpace = raw.replace(/\s+/g, "");
      const queryChoseong = getChoseong(raw).replace(/\s+/g, "");
      const hasChoseong = queryChoseong.length > 0;

      list = list.filter((p) => {
        const title = p.title;
        const normalizedTitle = normalize(title);
        const titleChoseong = getChoseong(title).replace(/\s+/g, "");

        return (
          // 1) 공백 무시한 일반 검색
          //    "최단경로찾기1" -> "최단 경로 찾기 1" 매칭 가능
          normalizedTitle.includes(normalizedQuery) ||
          // 2) 초성 직접 입력: "ㅊㄷㄱ" 입력 시
          titleChoseong.includes(rawNoSpace) ||
          // 3) 입력을 초성으로 바꿔서 비교: "최단경로" -> "ㅊㄷㄱㄹ"
          (hasChoseong && titleChoseong.includes(queryChoseong))
        );
      });
    }

    if (selectedLangs.size)
      list = list.filter((p) => selectedLangs.has(p.language));

    if (selectedLevels.size)
      list = list.filter((p) => selectedLevels.has(p.difficulty));

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
        list.sort((a, b) => {
          const aId = Number((a.id || "").toString().replace(/\D/g, "")) || 0;
          const bId = Number((b.id || "").toString().replace(/\D/g, "")) || 0;
          return bId - aId;
        });
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

  const pageCount = totalPage;
  const current = problems; // 서버에서 이미 페이징된 데이터를 받으므로 전체가 current

  useEffect(() => {
    setPage(1);
  }, [query, selectedType, selectedKind, solvedOnly, sortKey]);

  if (loading) return <div className="home">문제를 불러오는 중...</div>;
  if (error) return <div className="home">{error}</div>;

  const dropdownIcon = "/assets/icons/dropdown-arrow.svg";
  const recommendedProblem = problems[0];
  const expectedSolveTime = "30분";

  return (
    <div className="home">
      {/* --- 좌측 필터 영역 --- */}
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
                  />
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
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="filter-list__item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedLevels.has(n)}
                    onChange={() => toggleLevel(n)}
                  />
                  <span>레벨 {n}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* --- 중앙 콘텐츠 영역 --- */}
      <section className="home__content">
        <header className="home__content-header">
          <div className="stat">
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
              />
            </div>
          </div>

          <div className="filters-bar">
            {/* 문제 유형 */}
            <div className="chip dropdown" ref={typeRef}>
              <button
                type="button"
                className="dropdown__trigger"
                aria-expanded={typeOpen}
                onClick={() => {
                  setTypeOpen((v) => !v);
                  setKindOpen(false);
                }}
              >
                문제 유형 {selectedType ? `: ${selectedType}` : ""}
                <img src={dropdownIcon} className="dropdown__icon" />
              </button>

              {typeOpen && (
                <div className="dropdown__menu">
                  <button
                    className="dropdown__item dropdown__item--clear"
                    onClick={() => setSelectedType(null)}
                  >
                    전체 해제
                  </button>
                  {TYPES.map((t) => (
                    <button
                      key={t}
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

            {/* 문제 세부 유형 */}
            <div className="chip dropdown" ref={kindRef}>
              <button
                type="button"
                className="dropdown__trigger"
                aria-expanded={kindOpen}
                onClick={() => {
                  setKindOpen((v) => !v);
                  setTypeOpen(false);
                }}
              >
                유형별 분류 {selectedKind ? `: ${selectedKind}` : ""}
                <img src={dropdownIcon} className="dropdown__icon" />
              </button>

              {kindOpen && (
                <div className="dropdown__menu">
                  <button
                    className="dropdown__item dropdown__item--clear"
                    onClick={() => setSelectedKind(null)}
                  >
                    전체 해제
                  </button>
                  {KINDS.map((k) => (
                    <button
                      key={k}
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

            {/* 해결된 문제 필터 */}
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
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              <option value="latest">최신순</option>
              <option value="acc">정답률 높은 순</option>
              <option value="diff">난이도 낮은 순</option>
            </select>
          </div>
        </header>

        {/* 문제 목록 */}
        <ul className="problem-list">
          {current.map((p) => {
            const xp = p.difficulty * 25;

            return (
              <li key={p.id} className="problem-item">
                <div className="problem-item__left">
                  <div className="problem-item__top">
                    <h4 className="problem-item__title">{p.title}</h4>
                    <span className="correctness">정답률 {p.correctness}%</span>
                  </div>

                  <div className="problem-item__labels">
                    <span className="pill pill--level">
                      레벨 {p.difficulty}
                    </span>
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
                  <span className="xp-badge">{xp}xp</span>
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/solve?problemId=${p.id}`)}
                  >
                    풀이하기
                  </button>{" "}
                </div>
              </li>
            );
          })}

          {current.length === 0 && (
            <li className="problem-item" style={{ justifyContent: "center" }}>
              조건에 맞는 문제가 없습니다.
            </li>
          )}
        </ul>

        {/* 페이지네이션 */}
        <footer className="pagination">
          <button
            className="page"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>

          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`page ${p === page ? "is-active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="page"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </button>
        </footer>
      </section>

      {/* --- 우측 추천/랭킹 영역 --- */}
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
                <p className="recommend__time">
                  예상 시간: {expectedSolveTime}
                </p>

                <div className="recommend__tags">
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

              <button
                className="recommend__cta"
                onClick={() => {
                  if (recommendedProblem?.id) {
                    navigate(`/solve?problemId=${recommendedProblem.id}`);
                  }
                }}
              >
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
                <span className={`rank rank--${r.rank <= 3 ? r.rank : "n"}`}>
                  {r.rank}
                </span>
                <img src={personImg} className="avatar avatar--sm" />
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
