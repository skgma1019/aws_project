// frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 🚨 프록시 설정 추가
    proxy: {
      "/api": {
        target: "http://localhost:3000", // 백엔드 서버 주소
        changeOrigin: true,
        secure: false, // 로컬 환경이므로 false로 설정
      },
    },
  },
});
