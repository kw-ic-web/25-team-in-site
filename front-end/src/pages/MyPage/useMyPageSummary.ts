import { useEffect, useState } from "react";

export type LanguageUsage = {
  id: string;
  label: string;
  percent: number;
  color: string;
};

export type ActivityBadge = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type LevelUsagePoint = {
  level: string;
  count: number;
};

export type LevelSuccess = {
  level: string;
  percent: number;
  color: string;
};

export type Friend = {
  id: string;
  name: string;
  xp: number;
};

export type HeatmapMonth = {
  month: string;
  matrix: number[][];
};

export type SummaryStat = {
  id: string;
  label: string;
  value: number;
};

export type MyPageSummary = {
  profile: {
    nickname: string;
    rank: number;
    level: number;
    xp: number;
    weeklySolved: number;
    streakDays: number;
    lastActive: string;
    avatarInitial: string;
    languageTags: string[];
  };
  languages: LanguageUsage[];
  badges: ActivityBadge[];
  levelUsage: LevelUsagePoint[];
  levelSuccess: LevelSuccess[];
  friends: {
    totalCount: number;
    items: Friend[];
  };
  recommendedFriends: Friend[];
  heatmap: {
    months: HeatmapMonth[];
    scale: number;
  };
  summaryStats: SummaryStat[];
};

const mockSummary: MyPageSummary = {
  profile: {
    nickname: "아이디",
    rank: 15,
    level: 15,
    xp: 567,
    weeklySolved: 7,
    streakDays: 7,
    lastActive: "어제 학습함",
    avatarInitial: "ID",
    languageTags: ["Python", "Java", "JavaScript"],
  },
  languages: [
    { id: "python", label: "Python", percent: 56, color: "#6f6cfb" },
    { id: "java", label: "Java", percent: 24, color: "#8aa4ff" },
    { id: "js", label: "JavaScript", percent: 18, color: "#a7b8ff" },
  ],
  badges: [
    {
      id: "streak",
      label: "7일 연속 학습",
      description: "일주일 이상 꾸준히 학습을 이어갔어요!",
      icon: "🔥",
    },
    {
      id: "time",
      label: "시간 단축",
      description: "평균 풀이 시간이 20% 빨라졌어요.",
      icon: "⏱️",
    },
    {
      id: "hint",
      label: "힌트 사용",
      description: "필요할 때만 힌트를 활용했어요.",
      icon: "💡",
    },
  ],
  levelUsage: [
    { level: "레벨 1", count: 10 },
    { level: "레벨 2", count: 16 },
    { level: "레벨 3", count: 18 },
    { level: "레벨 4", count: 22 },
    { level: "레벨 5", count: 28 },
  ],
  levelSuccess: [
    { level: "레벨 1", percent: 32, color: "#A5D8FF" }, 
    { level: "레벨 2", percent: 26, color: "#B2F2BB" }, 
    { level: "레벨 3", percent: 20, color: "#FFD8A8" }, 
    { level: "레벨 4", percent: 14, color: "#FFC9C9" }, 
    { level: "레벨 5", percent: 8,  color: "#E5DBFF" }, 
  ],
  friends: {
    totalCount: 9,
    items: [
      { id: "friend-1", name: "아이디아이디", xp: 867 },
      { id: "friend-2", name: "아이디아이디", xp: 767 },
      { id: "friend-3", name: "아이디아이디", xp: 667 },
      { id: "friend-4", name: "아이디아이디", xp: 567 },
      { id: "friend-5", name: "아이디아이디", xp: 567 },
      { id: "friend-6", name: "아이디아이디", xp: 567 },
    ],
  },
  recommendedFriends: [
    { id: "rec-1", name: "아이디아이디", xp: 567 },
    { id: "rec-2", name: "아이디아이디", xp: 567 },
    { id: "rec-3", name: "아이디아이디", xp: 567 },
  ],
  heatmap: {
    months: [
      {
        month: "1월",
        matrix: [
          [0, 1, 0, 1, 0],
          [1, 2, 1, 2, 1],
          [1, 2, 1, 2, 1],
          [0, 1, 1, 1, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "2월",
        matrix: [
          [1, 2, 2, 1, 0],
          [2, 3, 2, 1, 0],
          [1, 2, 1, 1, 0],
          [0, 1, 1, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "3월",
        matrix: [
          [1, 1, 1, 1, 0],
          [2, 2, 2, 1, 0],
          [1, 1, 1, 0, 0],
          [0, 1, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "4월",
        matrix: [
          [1, 2, 2, 1, 0],
          [2, 3, 3, 1, 0],
          [1, 2, 1, 1, 0],
          [0, 1, 1, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "5월",
        matrix: [
          [1, 2, 3, 2, 1],
          [2, 3, 3, 2, 1],
          [2, 3, 2, 1, 0],
          [1, 2, 1, 0, 0],
          [0, 1, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "6월",
        matrix: [
          [1, 1, 1, 0, 0],
          [1, 1, 1, 0, 0],
          [0, 1, 0, 0, 0],
          [0, 1, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "7월",
        matrix: [
          [0, 1, 1, 2, 2],
          [0, 1, 2, 3, 2],
          [0, 1, 2, 2, 1],
          [0, 1, 1, 1, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "8월",
        matrix: [
          [1, 2, 2, 3, 3],
          [1, 2, 2, 3, 3],
          [1, 2, 1, 2, 2],
          [0, 1, 1, 1, 1],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "9월",
        matrix: [
          [2, 3, 3, 3, 3],
          [2, 3, 4, 4, 3],
          [2, 3, 3, 3, 2],
          [1, 2, 2, 2, 1],
          [0, 1, 1, 1, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "10월",
        matrix: [
          [1, 2, 3, 4, 4],
          [1, 3, 4, 4, 4],
          [1, 2, 3, 4, 3],
          [0, 1, 2, 3, 2],
          [0, 1, 1, 2, 1],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "11월",
        matrix: [
          [1, 2, 2, 2, 1],
          [1, 2, 2, 1, 0],
          [1, 1, 1, 0, 0],
          [1, 1, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
      {
        month: "12월",
        matrix: [
          [0, 0, 1, 1, 0],
          [0, 1, 1, 1, 0],
          [0, 1, 1, 1, 0],
          [0, 1, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      },
    ],
    scale: 4,
  },
  summaryStats: [
    { id: "streak", label: "연속 학습일", value: 34 },
    { id: "solved", label: "총 학습 문제", value: 34 },
    { id: "today", label: "오늘의 학습", value: 34 },
  ],
};

function fetchMyPageSummary(signal?: AbortSignal): Promise<MyPageSummary> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(mockSummary), 160);

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        },
        { once: true }
      );
    }
  });
}

export function useMyPageSummary() {
  const [data, setData] = useState<MyPageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    fetchMyPageSummary(controller.signal)
      .then((summary) => {
        setData(summary);
        setIsLoading(false);
      })
      .catch((err) => {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { data, isLoading, error };
}
