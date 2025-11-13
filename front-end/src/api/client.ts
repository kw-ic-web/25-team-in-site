import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";

// 환경 변수 기반 API 주소
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // headers 객체가 존재하지 않으면 새로 생성
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn("인증 만료 — 로그인 페이지로 이동 필요");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
