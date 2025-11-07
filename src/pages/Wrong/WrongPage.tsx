import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./WrongPage.css";

interface Problem {
  title: string;
  level: string;
  tags: string[];
  accuracy: number;
  points: string;
}

interface SimilarProblem {
  title: string;
  desc: string;
  tags: string[];
  level: string;
  time: string;
}

interface RecentSolve {
  title: string;
  time: string;
  level: string;
}

interface Stat {
  label: string;
  value: string | number;
  color: string;
}

const SolutionAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="solution-assistant">
      <button onClick={() => setIsOpen(!isOpen)} className="assistant-toggle">
        <span>도우미 어시스턴트</span>
        {isOpen ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>
      {isOpen && (
        <div className="assistant-content">
          <h4>평가 결과</h4>
          <p>코드가 효율적으로 작동합니다. ---</p>
          <h4>개선 제안</h4>
          <ul>
            <li>이중 반복문 --- 변수 초기화가 누락되어 ---</li>
            <li>변수 초기화가 누락되어 ---</li>
          </ul>
        </div>
      )}
    </div>
  );
};

const ProblemCard = ({ problem }: { problem: Problem }) => {
  return (
    <div className="problem-card">
      <div className="problem-card-main">
        <div>
          <h3>{problem.title}</h3>
          <div className="tags-container">
            <span className="level-tag">{problem.level}</span>
            {problem.tags.map((tag: string, index: number) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="problem-card-right">
          <span className="accuracy">정답률 {problem.accuracy}%</span>
          <span className="points">{problem.points}</span>
          <button className="primary-button">풀이하기</button>
        </div>
      </div>
      <SolutionAssistant />
    </div>
  );
};

// 좌측 통계 사이드바
const StatsSidebar = () => {
  const levels: string[] = ["레벨 1", "레벨 2", "레벨 3", "레벨 4", "레벨 5"];
  const stats: Stat[] = [
    { label: "총 학습 문제", value: 34, color: "stat-blue" },
    { label: "오답 문제", value: 10, color: "stat-blue" },
    { label: "재도전 문제", value: 7, color: "stat-blue" },
    { label: "재도전 성공률", value: "82%", color: "stat-blue" },
  ];

  return (
    <aside className="stats-sidebar">
      <div className="sidebar-card">
        <h3>난이도</h3>
        <div className="level-filters">
          {levels.map((level: string, index: number) => (
            <label key={index} className="level-label">
              <input
                type="checkbox"
                className="custom-checkbox"
                defaultChecked={index === 1}
              />
              <span className="level-text">{level}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="stats-cards-container">
        {stats.map((stat: Stat, index: number) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-value ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </aside>
  );
};

// 우측 추천 사이드바
const RecommendationSidebar = () => {
  const similarProblems: SimilarProblem[] = [
    {
      title: "이러이러한 문제",
      desc: "오답 문제와 아주 문제유형 유사한 패턴",
      tags: ["#알고리즘", "#알고리즘"],
      level: "레벨 1",
      time: "30분",
    },
    {
      title: "이러이러한 문제",
      desc: "오답 문제와 아주 문제유형 유사한 패턴",
      tags: ["#알고리즘", "#알고리즘"],
      level: "레벨 1",
      time: "30분",
    },
  ];

  const recentSolves: RecentSolve[] = [
    { title: "알고리즘 문제", time: "1일 전", level: "레벨 1" },
    { title: "알고리즘 문제", time: "1일 전", level: "레벨 1" },
    { title: "알고리즘 문제", time: "1일 전", level: "레벨 1" },
    { title: "알고리즘 문제", time: "1일 전", level: "레벨 1" },
    { title: "알고리즘 문제", time: "1일 전", level: "레벨 1" },
  ];

  return (
    <aside className="recommendation-sidebar">
      <div className="sidebar-card">
        <h3>유사 문제 추천</h3>
        <div className="similar-problems-list">
          {similarProblems.map((p: SimilarProblem, i: number) => (
            <div key={i} className="similar-problem-card">
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
              <div className="tags-container">
                {p.tags.map((tag: string, ti: number) => (
                  <span key={ti} className="similar-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="similar-problem-footer">
                <span className="level-tag-blue">{p.level}</span>
                <span className="time-text">예상 시간 {p.time}</span>
                <button className="challenge-button">도전</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-card recent-solves">
        <h3>최근 풀이</h3>
        <ul>
          {recentSolves.map((s: RecentSolve, i: number) => (
            <li key={i}>
              <span>{s.title}</span>
              <span className="time-text">{s.time}</span>
              <span className="level-tag-green">{s.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

// 메인 콘텐츠 필터
const MainFilters = () => (
  <div className="main-filters">
    <div className="search-bar">
      <input type="text" placeholder="문제 검색" />
      <Search size={18} className="search-icon" />
    </div>
    <div className="filter-selects">
      <select>
        <option>문제 유형</option>
      </select>
      <select>
        <option>유형별 분류</option>
      </select>
      <select>
        <option>최신순</option>
      </select>
    </div>
  </div>
);

// 페이지네이션
const Pagination = () => (
  <nav className="pagination-nav">
    <button>
      <ChevronLeft size={18} />
    </button>
    {[1, 2, 3, 4, 5].map((num: number) => (
      <button key={num} className={num === 1 ? "active" : ""}>
        {num}
      </button>
    ))}
    <button>
      <ChevronRight size={18} />
    </button>
  </nav>
);

// WrongPage 메인 컴포넌트
export default function WrongPage() {
  const mockProblems: Problem[] = [
    {
      title: "최단 경로 찾기",
      level: "레벨 2",
      tags: ["그래프", "그래프"],
      accuracy: 67,
      points: "50px",
    },
    {
      title: "최단 경로 찾기",
      level: "레벨 2",
      tags: ["그래프", "그래프"],
      accuracy: 67,
      points: "50px",
    },
    {
      title: "최단 경로 찾기",
      level: "레벨 2",
      tags: ["그래프", "그래프"],
      accuracy: 67,
      points: "50px",
    },
  ];

  return (
    <div className="wrong-page-container">
      <StatsSidebar />

      <main className="main-content">
        <h1 className="main-title">오답 풀이</h1>
        <MainFilters />
        <div className="problem-list">
          {mockProblems.map((problem: Problem, index: number) => (
            <ProblemCard key={index} problem={problem} />
          ))}
        </div>
        <Pagination />
      </main>

      <RecommendationSidebar />
    </div>
  );
}