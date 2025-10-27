import { Fragment, useMemo } from "react";
import "./MyPage.css";
import { useMyPageSummary } from "./useMyPageSummary";

export default function MyPage() {
  const { data, isLoading, error } = useMyPageSummary();

  const donutStyle = useMemo(() => {
    if (!data) return undefined;
    const segments = data.levelSuccess.reduce(
      (acc, segment) => {
        const start = acc.offset;
        const end = start + segment.percent;
        acc.offset = end;
        acc.stops.push(`${segment.color} ${start}% ${end}%`);
        return acc;
      },
      { offset: 0, stops: [] as string[] }
    );

    return { background: `conic-gradient(${segments.stops.join(", ")})` };
  }, [data]);

  const levelUsageChart = useMemo(() => {
    if (!data) return null;
    const { levelUsage } = data;
    const maxValue = Math.max(...levelUsage.map((point) => point.count), 0);
    if (!maxValue) return null;

    const chartHeight = 60;
    const chartWidth = 120;
    const yPadding = 8;

    const points = levelUsage.map((point, index) => {
      const x =
        levelUsage.length === 1
          ? chartWidth / 2
          : (index / (levelUsage.length - 1)) * chartWidth;
      const valueRatio = point.count / maxValue;
      const y = chartHeight - valueRatio * (chartHeight - yPadding) - yPadding;
      return { x, y };
    });

    const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

    const areaPath = [
      `M0 ${chartHeight}`,
      points.map((point) => `L${point.x} ${point.y}`).join(" "),
      `L${chartWidth} ${chartHeight}`,
      "Z",
    ].join(" ");

    return { polylinePoints, areaPath, maxValue, chartHeight, chartWidth };
  }, [data]);

  if (isLoading) {
    return (
      <div className="mypage__state">
        <span>마이페이지 정보를 불러오는 중입니다...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mypage__state mypage__state--error">
        <span>마이페이지 정보를 가져오지 못했어요.</span>
        <span>{error.message}</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const averageHintUsage =
    data.levelUsage.length > 0
      ? Math.round(
          data.levelUsage.reduce((acc, point) => acc + point.count, 0) /
            data.levelUsage.length
        )
      : 0;

  return (
    <div className="mypage">
      <aside className="mypage__sidebar">
        <article className="mypage-card mypage-card--profile">
          <div className="profile-card">
            <div className="profile-card__header">
              <div className="profile-card__avatar" aria-hidden="true">
                <span>{data.profile.avatarInitial}</span>
              </div>
              <div className="profile-card__meta">
                <h2>{data.profile.nickname}</h2>
                <div className="profile-card__stats" aria-label="프로필 요약">
                  <span className="profile-card__level">{data.profile.level}레벨</span>
                  <span className="profile-card__divider" aria-hidden="true">
                    |
                  </span>
                  <span className="profile-card__rank">
                    <span className="profile-card__rank-icon" aria-hidden="true">
                      🏅
                    </span>
                    {data.profile.rank}위
                  </span>
                  <span className="profile-card__divider" aria-hidden="true">
                    |
                  </span>
                  <span className="profile-card__xp">{data.profile.xp}xp</span>
                </div>
                <p className="profile-card__streak">
                  {data.profile.streakDays}일 연속 학습중
                </p>
                <p className="profile-card__subtext">
                  이번 주 학습 {data.profile.weeklySolved}회 · {data.profile.lastActive}
                </p>
              </div>
            </div>
            <button type="button" className="profile-card__action">
              프로필 수정하기
            </button>
          </div>
          <div className="profile-card__languages">
            <h3>사용 언어</h3>
            <div className="profile-card__chips">
              {data.profile.languageTags.map((tag) => (
                <span key={tag} className="profile-card__chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="mypage-card">
          <header className="mypage-card__header">
            <h3>9명의 친구</h3>
            <button type="button" className="mypage-card__link">
              전체보기
            </button>
          </header>
          <ul className="friends-list">
            {data.friends.items.map((friend) => (
              <li key={friend.id} className="friends-list__item">
                <div className="friends-list__avatar" aria-hidden="true" />
                <div className="friends-list__meta">
                  <span className="friends-list__name">{friend.name}</span>
                  <span className="friends-list__xp">{friend.xp}xp</span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="mypage-card">
          <header className="mypage-card__header">
            <h3>친구 추가</h3>
          </header>
          <div className="friend-search">
            <input type="search" placeholder="아이디 검색" aria-label="친구 아이디 검색" />
          </div>
          <div className="friend-recommend">
            <h4>추천 아이디</h4>
            <ul>
              {data.recommendedFriends.map((friend) => (
                <li key={friend.id}>
                  <span>{friend.name}</span>
                  <span>{friend.xp}xp</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </aside>

      <section className="mypage__content">
        <div className="mypage__grid">
          <article className="mypage-card">
            <header className="mypage-card__header">
              <h3>사용 언어 비중</h3>
            </header>
            <div className="language-usage">
              {data.languages.map((language) => (
                <div key={language.id} className="language-usage__item">
                  <div className="language-usage__meta">
                    <span>{language.label}</span>
                    <span>{language.percent}%</span>
                  </div>
                  <div className="language-usage__bar">
                    <div
                      className="language-usage__fill"
                      style={{
                        width: `${language.percent}%`,
                        background: language.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="mypage-card">
            <header className="mypage-card__header">
              <h3>활동 뱃지</h3>
            </header>
            <div className="badge-list">
              {data.badges.map((badge) => (
                <div key={badge.id} className="badge-list__item">
                  <span className="badge-list__icon" aria-hidden="true">
                    {badge.icon}
                  </span>
                  <div>
                    <span className="badge-list__label">{badge.label}</span>
                    <p>{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="mypage-card">
            <header className="mypage-card__header">
              <h3>레벨 별 평균 힌트 사용 횟수</h3>
            </header>
            <div className="chart">
              {levelUsageChart ? (
                <Fragment>
                  <svg
                    viewBox={`0 0 ${levelUsageChart.chartWidth} ${levelUsageChart.chartHeight}`}
                    role="img"
                    aria-label="레벨별 평균 힌트 사용 추세"
                  >
                    <defs>
                      <linearGradient
                        id="mypageChartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="rgba(111, 108, 251, 0.4)" />
                        <stop offset="100%" stopColor="rgba(111, 108, 251, 0)" />
                      </linearGradient>
                    </defs>
                    <path d={levelUsageChart.areaPath} className="chart__area" />
                    <polyline
                      points={levelUsageChart.polylinePoints}
                      className="chart__line"
                    />
                  </svg>
                  <div className="chart__labels">
                    {data.levelUsage.map((point) => (
                      <span key={point.level}>{point.level}</span>
                    ))}
                  </div>
                  <div className="chart__hint">
                    문제당 평균 힌트 사용 횟수{" "}
                    <strong>{averageHintUsage}</strong>
                  </div>
                </Fragment>
              ) : (
                <p className="chart__empty">데이터가 없습니다.</p>
              )}
            </div>
          </article>

          <article className="mypage-card">
            <header className="mypage-card__header">
              <h3>레벨 별 성공률</h3>
            </header>
            <div className="donut">
              <div className="donut__graph" style={donutStyle}>
                <div className="donut__hole">
                  <span>성공률</span>
                  <strong>
                    {data.levelSuccess.reduce((acc, cur) => acc + cur.percent, 0)}%
                  </strong>
                </div>
              </div>
              <ul className="donut__legend">
                {data.levelSuccess.map((segment) => (
                  <li key={segment.level}>
                    <span
                      className="donut__legend-dot"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="donut__legend-label">{segment.level}</span>
                    <span className="donut__legend-value">{segment.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="mypage-card mypage-card--wide">
            <header className="mypage-card__header">
              <h3>활동 히트맵</h3>
              <button type="button" className="mypage-card__selector" aria-haspopup="listbox">
                전체
              </button>
            </header>
            <div className="heatmap">
              {data.heatmap.months.map((month) => (
                <div key={month.month} className="heatmap__month">
                  <div
                    className="heatmap__matrix"
                    role="grid"
                    aria-label={`${month.month} 활동 히트맵`}
                  >
                    {month.matrix.map((row, rowIndex) =>
                      row.map((value, columnIndex) => (
                        <span
                          key={`${month.month}-${rowIndex}-${columnIndex}`}
                          role="gridcell"
                          aria-label={`${month.month} ${rowIndex + 1}주차 ${columnIndex + 1}일 활동도 ${value}`}
                          className={`heatmap__cell heatmap__cell--${value}`}
                        />
                      ))
                    )}
                  </div>
                  <span className="heatmap__label">{month.month}</span>
                </div>
              ))}
            </div>
            <div className="heatmap__legend">
              <span>적음</span>
              <div className="heatmap__legend-scale" role="presentation">
                {Array.from({ length: data.heatmap.scale + 1 }, (_, level) => (
                  <span
                    key={level}
                    className={`heatmap__cell heatmap__cell--${level}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span>많음</span>
            </div>
            <footer className="heatmap__footer">
              {data.summaryStats.map((stat) => (
                <div key={stat.id} className="heatmap__stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </footer>
          </article>
        </div>
      </section>
    </div>
  );
}
