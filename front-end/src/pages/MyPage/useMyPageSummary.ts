import { useEffect, useState } from "react";
import axios from "axios";
import apiClient from "../../api/client";

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
  avatarImage?: string | null;
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
    avatarImage?: string | null;
    bio: string;
    preferLanguage: string;
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

const purposeBioMap: Record<string, string> = {
  test: "알고리즘 / 코딩 테스트 문제 풀이에 집중하고 있어요.",
  project: "학교 과제나 개인 프로젝트를 완성도 있게 만들고 있어요.",
  hobby: "프로그래밍을 취미와 교양으로 즐기고 있어요.",
  competition: "대회용 프로그래밍 문제 풀이를 연습하고 있어요.",
};

const languageLabelMap: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  ex: "Etc",
};

const languagePalette = ["#6f6cfb", "#8aa4ff", "#a7b8ff", "#70d6ff", "#9ad5b0"];

type UserStatsResponse = {
  profile: {
    nickname: string;
    avatarImage?: string;
    bio?: string;
    level?: number;
    xp?: number;
    preferLanguage?: string;
    totalSolved?: number;
    rank?: number | string;
  };
  stats?: {
    streak?: number;
    todaySolved?: number;
    thisWeekSolved?: number;
    mostUsedLanguage?: string;
  };
  badges?: {
    id: string;
    label: string;
    description?: string;
    icon?: string;
  }[];
  friends?: {
    totalCount?: number;
    items?: Friend[];
  };
  recommendedFriends?: Friend[];
  levelDistribution?: Record<string, number>;
  languageDistribution?: Record<string, number>;
  heatmap?: {
    months?: HeatmapMonth[];
    scale?: number;
  };
};


const START_SURVEY_STORAGE_KEY = "startSurvey";

function readStartSurvey():
  | {
      language?: string;
      purpose?: string;
    }
  | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(START_SURVEY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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
    avatarImage: null,
    bio: purposeBioMap.test,
    preferLanguage: "Python",
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
      { id: "friend-1", name: "아이디아이디", xp: 867, avatarImage: null },
      { id: "friend-2", name: "아이디아이디", xp: 767, avatarImage: null },
      { id: "friend-3", name: "아이디아이디", xp: 667, avatarImage: null },
      { id: "friend-4", name: "아이디아이디", xp: 567, avatarImage: null },
      { id: "friend-5", name: "아이디아이디", xp: 567, avatarImage: null },
      { id: "friend-6", name: "아이디아이디", xp: 567, avatarImage: null },
    ],
  },
  recommendedFriends: [
    { id: "rec-1", name: "아이디아이디", xp: 567, avatarImage: null },
    { id: "rec-2", name: "아이디아이디", xp: 567, avatarImage: null },
    { id: "rec-3", name: "아이디아이디", xp: 567, avatarImage: null },
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

function buildLanguageUsage(dist?: Record<string, number>): LanguageUsage[] {
  if (!dist) return mockSummary.languages;
  const entries = Object.entries(dist);
  const total = entries.reduce((acc, [, count]) => acc + count, 0);
  if (!total) return mockSummary.languages;

  return entries.map(([id, count], idx) => ({
    id,
    label: languageLabelMap[id] ?? id,
    percent: Math.round((count / total) * 100),
    color: languagePalette[idx % languagePalette.length],
  }));
}

function buildLevelUsage(dist?: Record<string, number>): LevelUsagePoint[] {
  if (!dist) return mockSummary.levelUsage;
  const usage = Object.entries(dist)
    .map(([level, count]) => ({
      level: `레벨 ${level}`,
      count,
    }))
    .sort((a, b) => a.level.localeCompare(b.level, "ko", { numeric: true }));
  return usage.length ? usage : mockSummary.levelUsage;
}

function buildLevelSuccess(dist?: Record<string, number>): LevelSuccess[] {
  if (!dist) return mockSummary.levelSuccess;
  const entries = Object.entries(dist);
  const total = entries.reduce((acc, count) => acc + count[1], 0);
  if (!total) return mockSummary.levelSuccess;

  const success = entries
    .map(([level, count], idx) => ({
      level: `레벨 ${level}`,
      percent: Math.round((count / total) * 100),
      color: languagePalette[idx % languagePalette.length],
    }))
    .sort((a, b) => a.level.localeCompare(b.level, "ko", { numeric: true }));
  return success.length ? success : mockSummary.levelSuccess;
}

function deriveLanguageTags(preferLanguage: string, languages: LanguageUsage[]) {
  const tags = [preferLanguage, ...languages.map((lang) => lang.label)];
  return Array.from(new Set(tags)).slice(0, 5);
}

function toActivityBadges(badges?: UserStatsResponse["badges"]): ActivityBadge[] {
  if (!badges || badges.length === 0) return mockSummary.badges;
  return badges.map((badge) => ({
    id: badge.id,
    label: badge.label,
    description: badge.description ?? "",
    icon: badge.icon ?? "🏅",
  }));
}

function resolveAvatarUrl(path: string | undefined, base: string): string | null {
  if (!path) return null;
  try {
    return new URL(path, base).toString();
  } catch {
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return null;
    }
  }
}

function mapUserStatsToSummary(
  apiData: UserStatsResponse,
  surveyFallback: ReturnType<typeof readStartSurvey>
): MyPageSummary {
  const apiBase =
    import.meta.env.VITE_API_PROXY ||
    import.meta.env.VITE_API_URL?.replace(/\/api\/?v1?\/?$/, "") ||
    (apiClient.defaults.baseURL && apiClient.defaults.baseURL.startsWith("http")
      ? apiClient.defaults.baseURL
      : window.location.origin);

  const preferLanguage =
    apiData.profile?.preferLanguage ??
    (surveyFallback?.language && languageLabelMap[surveyFallback.language]) ??
    mockSummary.profile.preferLanguage;

  const bio =
    apiData.profile?.bio ??
    (surveyFallback?.purpose && purposeBioMap[surveyFallback.purpose]) ??
    mockSummary.profile.bio;

  const languages = buildLanguageUsage(apiData.languageDistribution);
  const levelUsage = buildLevelUsage(apiData.levelDistribution);
  const levelSuccess = buildLevelSuccess(apiData.levelDistribution);

  const nickname = apiData.profile?.nickname ?? mockSummary.profile.nickname;
  const avatarInitial = nickname.slice(0, 2).toUpperCase() || mockSummary.profile.avatarInitial;
  const levelForAvatar = apiData.profile?.level ?? mockSummary.profile.level ?? 1;
  const resolvedAvatar =
    resolveAvatarUrl(apiData.profile?.avatarImage, apiBase) ||
    resolveAvatarUrl(`/images/level/${levelForAvatar}.png`, apiBase);
  const avatarImage = resolvedAvatar;
  const defaultFriendAvatar = resolveAvatarUrl("/images/level/1.png", apiBase);

  const summaryStats: SummaryStat[] = [
    { id: "streak", label: "연속 학습일", value: apiData.stats?.streak ?? mockSummary.profile.streakDays },
    { id: "solved", label: "총 학습 문제", value: apiData.profile?.totalSolved ?? mockSummary.summaryStats[1].value },
    { id: "today", label: "오늘의 학습", value: apiData.stats?.todaySolved ?? mockSummary.summaryStats[2].value },
  ];

  return {
    ...mockSummary,
    profile: {
      ...mockSummary.profile,
      nickname,
      rank: Number(apiData.profile?.rank ?? mockSummary.profile.rank) || mockSummary.profile.rank,
      level: apiData.profile?.level ?? mockSummary.profile.level,
      xp: apiData.profile?.xp ?? mockSummary.profile.xp,
      weeklySolved: apiData.stats?.thisWeekSolved ?? mockSummary.profile.weeklySolved,
      streakDays: apiData.stats?.streak ?? mockSummary.profile.streakDays,
      lastActive: mockSummary.profile.lastActive,
      avatarInitial,
      avatarImage,
      bio,
      preferLanguage,
      languageTags: deriveLanguageTags(preferLanguage, languages),
    },
    languages,
    badges: toActivityBadges(apiData.badges),
    levelUsage,
    levelSuccess,
    friends: {
      totalCount: apiData.friends?.totalCount ?? mockSummary.friends.totalCount,
      items:
        apiData.friends?.items?.length
          ? apiData.friends.items.map((friend) => ({
              ...friend,
              avatarImage: resolveAvatarUrl(friend.avatarImage ?? undefined, apiBase) ?? defaultFriendAvatar,
            }))
          : mockSummary.friends.items.map((friend) => ({
              ...friend,
              avatarImage: defaultFriendAvatar,
            })),
    },
    recommendedFriends:
      apiData.recommendedFriends?.length
        ? apiData.recommendedFriends.map((friend) => ({
            ...friend,
            avatarImage: resolveAvatarUrl(friend.avatarImage ?? undefined, apiBase) ?? defaultFriendAvatar,
          }))
        : mockSummary.recommendedFriends.map((friend) => ({
            ...friend,
            avatarImage: defaultFriendAvatar,
          })),
    heatmap: apiData.heatmap?.months
      ? {
          months: apiData.heatmap.months,
          scale: apiData.heatmap.scale ?? mockSummary.heatmap.scale,
        }
      : mockSummary.heatmap,
    summaryStats,
  };
}

async function fetchMyPageSummary(signal?: AbortSignal): Promise<MyPageSummary> {
  const survey = readStartSurvey();
  const response = await apiClient.get<UserStatsResponse>("/user/stats", { signal });
  return mapUserStatsToSummary(response.data, survey);
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
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if ((err as DOMException)?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { data, isLoading, error };
}
