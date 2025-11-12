export type LanguagePreset = {
  label: string;
  value: string;
  starter: string;
};

export interface ProblemDetail {
  id: string;
  title: string;
  difficulty: string;
  timeLimit: string;
  memoryLimit: string;
  description: string;
  inputSpec: string;
  outputSpec: string;
  hints: string[];
  languagePresets?: LanguagePreset[];
}

export interface RunRequestBody {
  language: string;
  code: string;
}

export interface RunResponse {
  passed: boolean;
  stdout: string;
  stderr?: string;
}

export interface SubmitResponse {
  status: "accepted" | "rejected" | "pending";
  message: string;
}

async function request<TResponse>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  return (await response.json()) as TResponse;
}

export const solveApi = {
  async fetchProblem(problemId: string) {
    return request<ProblemDetail>(`/api/problems/${problemId}`);
  },

  async run(problemId: string, body: RunRequestBody) {
    return request<RunResponse>(`/api/problems/${problemId}/run`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async submit(problemId: string, body: RunRequestBody) {
    return request<SubmitResponse>(`/api/problems/${problemId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
