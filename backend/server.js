// server.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const { initDB } = require("./db/db_setup");

// 라우트 모듈
const authRoutes = require("./routes/auth");
const analysisRoutes = require("./routes/analysis");
const reportsRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// ✅ CORS 설정 (라우트보다 먼저)
// =========================
const allowedOrigins = new Set([
  "http://student20712-proj-web.s3-website.ap-northeast-2.amazonaws.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman/curl처럼 Origin 없는 요청 허용
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// ✅ 프리플라이트(OPTIONS) 요청을 여기서 즉시 처리 (app.options("*") 대체)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// =========================
// 미들웨어
// =========================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

// =========================
// 라우트
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/reports", reportsRoutes);

// 헬스체크
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// =========================
// DB 초기화
// =========================
const shouldInit = process.env.RUN_DB_INIT === "true";
if (shouldInit) {
  console.log("ℹ️ RUN_DB_INIT=true → DB 초기화 실행");
  initDB().catch((err) => console.error("❌ DB 초기화 실패:", err));
} else {
  console.log("ℹ️ RUN_DB_INIT=false → DB 초기화 생략");
}

// =========================
// 서버 실행
// =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎉 Server running on http://localhost:${PORT}`);
  console.log(`- 인증 API: http://localhost:${PORT}/api/auth/login`);
  console.log(`- 분석 API: http://localhost:${PORT}/api/analysis/top_hotspots`);
});

