// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { initDB } = require('./db/db_setup');

// 라우트 모듈 불러오기
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 라우트 연결
// 모든 API 엔드포인트는 '/api' 접두사를 사용합니다.
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportsRoutes);

// 기본 라우트 (서버 상태 확인용)
app.get('/', (req, res) => {
    res.send('시민 참여형 교통 위험 분석 시스템 백엔드 실행 중');
});

// 서버 실행
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n🎉 Server running on http://localhost:${PORT}`);
            console.log(`- 인증 API: http://localhost:${PORT}/api/auth/login`);
            console.log(`- 분석 API: http://localhost:${PORT}/api/analysis/top_hotspots`);
        });
    })
    .catch((error) => {
        // 🚨 이 부분이 실행되어야 합니다.
        console.error("=========================================");
        console.error("❌ 서버 시작 실패: DB 초기화 오류로 인한 충돌");
        console.error("오류 내용:", error); 
        console.error("=========================================");
        process.exit(1);
    });