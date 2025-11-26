import { useEffect, useState } from "react";
import {
  solveApi,
  type LanguagePreset,
  type ProblemDetail,
} from "../../shared/api/solve";

export const fallbackProblem: ProblemDetail = {
  id: "sample-problem",
  title: "알고리즘 문제: 가장 많이 등장한 숫자 찾기",
  difficulty: "Lv. 1 · 구현",
  timeLimit: "2초",
  memoryLimit: "512MB",
  description:
    "정수로 이루어진 배열이 주어졌을 때, 가장 많이 등장한 숫자를 찾아 반환하는 함수를 작성하세요. 만약 가장 많이 등장한 숫자가 여러 개라면, 그 중 가장 작은 숫자를 반환하세요.",
  inputSpec:
    "정수 배열 nums가 주어집니다. (1 ≤ nums.length ≤ 10^5, -10^9 ≤ nums[i] ≤ 10^9)",
  outputSpec: "가장 많이 등장한 숫자 하나를 반환합니다.",
  hints: [
    "각 숫자가 몇 번 등장했는지 세어야 합니다.",
    "자료 구조를 사용하여 각 숫자의 등장 횟수를 저장해 보세요. (예: Java의 HashMap, Python의 Dictionary)",
  ],
};

export const defaultLanguagePresets: LanguagePreset[] = [
  {
    label: "JavaScript",
    value: "javascript",
    starter: `function solution(input) {
  const [a, b] = input.trim().split(" ").map(Number);
  return (a + b).toString();
}

console.log(solution(require("fs").readFileSync(0, "utf-8")));`,
  },
  {
    label: "Python",
    value: "python",
    starter: `import sys

def solution(raw: str) -> str:
    a, b = map(int, raw.split())
    return str(a + b)

if __name__ == "__main__":
    data = sys.stdin.read().strip()
    print(solution(data))`,
  },
  {
    label: "TypeScript",
    value: "typescript",
    starter: `const input = Deno.readTextFileSync("/dev/stdin").trim();
const [a, b] = input.split(" ").map(Number);
console.log(a + b);`,
  },
];

export function useSolveProblem(problemId?: string | null) {
  const [problem, setProblem] = useState<ProblemDetail>(fallbackProblem);
  const [languagePresets, setLanguagePresets] = useState<LanguagePreset[]>(
    defaultLanguagePresets,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProblem = async () => {
      if (!problemId) {
        setProblem(fallbackProblem);
        setLanguagePresets(defaultLanguagePresets);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await solveApi.fetchProblem(problemId);
        if (!isMounted) return;

        setProblem(data);
        setLanguagePresets(
          data.languagePresets && data.languagePresets.length > 0
            ? data.languagePresets
            : defaultLanguagePresets,
        );
      } catch (fetchError) {
        if (!isMounted) return;
        setProblem(fallbackProblem);
        setLanguagePresets(defaultLanguagePresets);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "문제를 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchProblem();

    return () => {
      isMounted = false;
    };
  }, [problemId]);

  return { problem, languagePresets, isLoading, error };
}
