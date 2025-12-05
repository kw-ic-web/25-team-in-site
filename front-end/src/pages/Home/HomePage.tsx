import { useEffect, useState } from "react";
import apiClient from "../../api/client";
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



export default function HomePage() {
  // API 데이터
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 관련 상태
  const [inputQuery, setInputQuery] = useState(""); // 입력 중인 검색어
  const [query, setQuery] = useState(""); // 실제 검색에 사용할 검색어
  const [sortKey, setSortKey] = useState<"latest" | "acc" | "diff">("latest");
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [solvedOnly, setSolvedOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const navigate = useNavigate();

  //  /api/v1/problems API 연동
  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);

        const params: any = {
          page,
          limit: pageSize,
        };

        // 검색어가 있으면 서버로 전달
        if (query.trim()) {
          params.search = query.trim();
        }

        // 난이도 필터가 있으면 서버로 전달
        if (selectedLevels.size > 0) {
          params.difficulties = Array.from(selectedLevels).join(",");
        }

        const res = await apiClient.get("/problems", { params });

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
          setTotalPage(res.data.pagination?.total_pages ?? 1);
          setTotalCount(res.data.pagination?.total_count ?? 0);
        }
      } catch (err) {
        console.error(err);
        setError("문제 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, [page, query, selectedLevels]);

  const handleSearch = () => {
    setQuery(inputQuery);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleLevel = (n: number) =>
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      setPage(1);
      return next;
    });

  const pageCount = totalPage;
  const current = problems; // 서버에서 이미 페이징된 데이터를 받으므로 전체가 current

  // 검색어나 난이도 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setPage(1);
  }, [query, selectedLevels]);

  if (loading) return <div className="home">문제를 불러오는 중...</div>;
  if (error) return <div className="home">{error}</div>;

  const recommendedProblem = problems[0];
  const expectedSolveTime = "30분";

  return (
    <div className="home">
      {/* --- 좌측 필터 영역 --- */}
      <aside className="home__sidebar">
        <section className="home-card home-card--emph">
          <header className="home-card__header">
            <h3>출석 현황 <span style={{ color: "#999", fontSize: "0.9em", fontWeight: "normal" }}>준비중</span></h3>
          </header>
          <div className="attendance">
            <span className="attendance__label">현재 연속 출석</span>
            <strong className="attendance__days">23일 차</strong>
          </div>
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
              <span>{totalCount}</span>
            </div>

            <div className="searchbar" style={{ display: "flex", gap: "8px" }}>
              <input
                type="search"
                placeholder="문제 검색"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="btn-primary"
                style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
              >
                검색
              </button>
            </div>
          </div>

          <div className="filters-bar">
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
                    {(p.tags || []).map((t) => (
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

          {(() => {
            const maxVisiblePages = 8;
            const startPage = Math.max(1, Math.min(page - Math.floor(maxVisiblePages / 2), pageCount - maxVisiblePages + 1));
            const endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);
            
            return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
              <button
                key={p}
                className={`page ${p === page ? "is-active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ));
          })()}

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
            <h3>랭킹 <span style={{ color: "#999", fontSize: "0.9em", fontWeight: "normal" }}>준비중</span></h3>
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
