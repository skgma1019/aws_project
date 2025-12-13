// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { initDB } = require("./db/db_setup");
const path = require("path");
const shouldInit = process.env.RUN_DB_INIT === "true";
require("dotenv").config({
	path: path.resolve(__dirname, ".env"),
});
// 라우트 모듈 불러오기
const authRoutes = require("./routes/auth");
const analysisRoutes = require("./routes/analysis");
const reportsRoutes = require("./routes/reports");

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
// 라우트 연결
// 모든 API 엔드포인트는 '/api' 접두사를 사용합니다.
app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/reports", reportsRoutes);

// 기본 라우트 (HTML 파일 서빙으로 변경)
app.get("/", (req, res) => {
res.status(200).json({ok: true, service: "backend", time: new Date() });
});

// 서버 실행
const startServer = () => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🎉 Server running on http://localhost:${PORT}`);
    console.log(`- 인증 API: http://localhost:${PORT}/api/auth/login`);
    console.log(`- 분석 API: http://localhost:${PORT}/api/analysis/top_hotspots`);
  });
};

if (shouldInit) {
  initDB()
    .then(startServer)
    .catch((error) => {
      console.error("=========================================");
      console.error("❌ 서버 시작 실패: DB 초기화 오류로 인한 충돌");
      console.error("오류 내용:", error);
      console.error("=========================================");
      process.exit(1);
    });
} else {
  console.log("ℹ️ RUN_DB_INIT=false → DB 초기화 생략");
  startServer();
}

