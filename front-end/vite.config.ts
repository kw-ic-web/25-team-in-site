import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// vite proxy + babel-react-compiler 함께 동작 버전
export default defineConfig({
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
        target: "http://43.201.106.151:3000", // backend 루트까지만
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
