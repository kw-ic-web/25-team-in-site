import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// vite proxy + babel-react-compiler 함께 동작 버전
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_API_PROXY ||
    env.VITE_API_URL?.replace(/\/api\/?v1?\/?$/, "") ||
    "https://team09-api.kwweb.org/";

  return {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
      },
    },
  };
});