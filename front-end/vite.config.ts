import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// vite proxy + babel-react-compiler 함께 동작 버전
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_API_PROXY ||
    env.VITE_API_URL?.replace(/\/api\/?v1?\/?$/, "") ||
    "http://team09-api.kwweb.org/";

  const config: ReturnType<typeof defineConfig> = {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
    ],
  };

  // 개발 서버에서만 proxy 설정 (빌드 시에는 proxy 불필요)
  if (command === "serve") {
    config.server = {
      port: 5173, // 개발 서버 포트
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path,
        },
        "/ws": {
          target: "ws://team09-api.kwweb.org:20991",
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // 경로 그대로 유지
        },
      },
    };
  }

  return config;
});
