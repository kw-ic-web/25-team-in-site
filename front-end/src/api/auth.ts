import apiClient from "./client";
import type { AxiosResponse } from "axios";

// 회원가입 요청 타입
interface RegisterData {
  user_id: string;
  email: string;
  password: string;
  language: string;
  level: number;
  purpose: string;
}

// 로그인 요청 타입
interface LoginData {
  email: string;
  password: string;
}

// 공통 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const authAPI = {
  /** 아이디 중복확인 */
  checkId: (user_id: string): Promise<AxiosResponse<{ available: boolean }>> =>
    apiClient.get(`/user/check-id/${encodeURIComponent(user_id)}`),

  /** 회원가입 */
  register: (data: RegisterData): Promise<AxiosResponse<ApiResponse<null>>> =>
    apiClient.post("/auth/register", {
      user_id: data.user_id,
      email: data.email,
      password: data.password,
      language: data.language,
      level: data.level,
      purpose: data.purpose,
    }),

  /** 로그인 (email 기반) */
  login: (
    data: LoginData
  ): Promise<AxiosResponse<ApiResponse<{ token: string }>>> =>
    apiClient.post("/auth/login", {
      email: data.email,
      password: data.password,
    }),
};
