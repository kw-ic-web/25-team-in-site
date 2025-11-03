import { useMemo } from "react";
import "./HomePage.css";

type Problem = {
  id: string;
  title: string;
  tags: string[];
  difficulty: number;
  correctness: number; // percentage
};

export default function HomePage() {
  // 임시 목업 데이터 (API 연동 전까지 사용)
  const problems: Problem[] = useMemo(
    () => [
      {
        id: "p1",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
      {
        id: "p2",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
      {
        id: "p3",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
      {
        id: "p4",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
      {
        id: "p5",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
      {
        id: "p6",
        title: "최단 경로 찾기",
        tags: ["백준", "그래프"],
        difficulty: 2,
        correctness: 67,
      },
    ],
    []
  );

  const ranking = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        name: "아이디아이디",
        score: 1234,
      })),
    []
  );

  return (
    <div className="home">
      {/* 좌측 필터 */}
      <aside className="home__sidebar">
        <section className="home-card home-card--emph">
          <header className="home-card__header">
            <h3>출석 랭킹</h3>
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
            {[
              "HTML",
              "JavaScript",
              "CSS",
              "Java",
              "C",
              "C++",
              "Python",
              "MySQL",
            ].map((l) => (
              <li key={l} className="filter-list__item">
                <label>
                  <input type="checkbox" /> <span>{l}</span>
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
            {Array.from({ length: 5 }, (_, i) => `레벨 ${i + 1}`).map((l) => (
              <li key={l} className="filter-list__item">
                <label>
                  <input type="checkbox" /> <span>{l}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      {/* 중앙 목록 */}
      <section className="home__content">
        <header className="home__content-header">
          <div className="stat">
            전체 문제 <strong>671</strong>
          </div>
          <div className="searchbar">
            <input type="search" placeholder="문제 검색" />
            <div className="chips">
              <button className="chip" type="button">유형별 분류</button>
              <button className="chip" type="button">해결 전략별 보기</button>
              <select className="chip chip--select" aria-label="정렬">
                <option>최신순</option>
                <option>정답률 높은 순</option>
                <option>난이도 낮은 순</option>
              </select>
            </div>
          </div>
        </header>

        <ul className="problem-list">
          {problems.map((p) => (
            <li key={p.id} className="problem-item">
              <div className="problem-item__main">
                <h4 className="problem-item__title">{p.title}</h4>
                <div className="problem-item__meta">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                  <span className="difficulty">{p.difficulty}px</span>
                </div>
              </div>
              <div className="problem-item__right">
                <span className="correctness">정답률 {p.correctness}%</span>
                <button type="button" className="btn-primary">
                  풀어보기
                </button>
              </div>
            </li>
          ))}
        </ul>

        <footer className="pagination">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              className={`page ${p === 2 ? "is-active" : ""}`}
            >
              {p}
            </button>
          ))}
        </footer>
      </section>

      {/* 우측 추천/랭킹 */}
      <aside className="home__aside">
        <section className="recommend">
          <header className="recommend__header">오늘의 추천 문제</header>
          <div className="recommend__body">
            <div className="recommend__row">
              <span className="label">이번 달의 목표</span>
              <span className="pill pill--goal">연속 7일</span>
            </div>
            <div className="recommend__row">
              <span className="label">예상 시간</span>
              <span className="pill">5-10분</span>
            </div>
            <button type="button" className="btn-cta">도전!</button>
          </div>
        </section>

        <section className="home-card">
          <header className="home-card__header">
            <h3>랭킹</h3>
          </header>
          <ol className="ranking">
            {ranking.map((r) => (
              <li key={r.rank} className="ranking__item">
                <span className={`rank rank--${r.rank <= 3 ? r.rank : "n"}`}>
                  {r.rank}
                </span>
                <span className="name">{r.name}</span>
                <span className="score">{r.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
          <div className="my-rank">
            내 순위 <strong>23위</strong> <span className="muted">(667xp)</span>
          </div>
        </section>
      </aside>
    </div>
  );
}
