// routes/analysis.js
const express = require('express');
const router = express.Router();
const pool = require('../db_config'); // MySQL DB 연결 풀

// 종합 위험 지수 계산 및 상위 10개 지역 반환 (GET /api/analysis/top_hotspots)
router.get('/top_hotspots', async (req, res) => {
    // MySQL 쿼리: 새로운 컬럼명(death_count, accident_count, casualty_count)을 사용하여 위험 지수를 계산합니다.
    const query = `
        SELECT 
            fid AS HOTSPOT_ID, 
            city_district_name AS GU_NAME, 
            spot_name AS LOCATION_NAME, 
            latitude AS LATITUDE, 
            longitude AS LONGITUDE,
            death_count, 
            accident_count,
            casualty_count,
            -- 위험 지수 계산: 사망자(10), 사고건수(5), 사상자(1) 가중치 부여
            (death_count * 10) + (accident_count * 5) + (casualty_count * 1) AS total_risk_index,
            (CASE 
                WHEN (death_count * 10) + (accident_count * 5) + (casualty_count * 1) >= 500 THEN '위험'
                WHEN (death_count * 10) + (accident_count * 5) + (casualty_count * 1) >= 300 THEN '경계'
                ELSE '주의'
            END) AS calculated_risk_level
        FROM ACCIDENT_HOTSPOTS
        ORDER BY total_risk_index DESC
        LIMIT 10;
    `;
    
    try {
        const [hotspots] = await pool.query(query);

        // 결과에서 위험 등급 목록을 추출하여 조언을 가져옵니다.
        const riskLevels = [...new Set(hotspots.map(h => h.calculated_risk_level))];
        if (riskLevels.length === 0) {
            return res.json({ status: 'success', hotspots: hotspots });
        }
        
        // SAFETY_MEASURES 테이블에서 위험 등급별 조언을 가져옵니다.
        const adviceQuery = `SELECT RISK_LEVEL, DETAIL_ADVICE FROM SAFETY_MEASURES WHERE RISK_LEVEL IN (?)`;
        const [adviceRows] = await pool.query(adviceQuery, [riskLevels]);

        const adviceMap = adviceRows.reduce((map, row) => {
            map[row.RISK_LEVEL] = row.DETAIL_ADVICE;
            return map;
        }, {});
        
        // 최종 결과에 안전 조언을 매핑합니다.
        const finalHotspots = hotspots.map(h => ({
            ...h,
            safety_advice: adviceMap[h.calculated_risk_level] || '일반적인 안전 수칙 준수 필요'
        }));
        
        res.json({ status: 'success', hotspots: finalHotspots });
    } catch (err) {
        console.error("Analysis Top Hotspots Error:", err);
        res.status(500).send('분석 쿼리 실행 오류: ' + err.message);
    }
});


// 인근 지역 검색 API (GET /api/analysis/nearby_hotspots)
router.get('/nearby_hotspots', async (req, res) => {
    // 쿼리 파라미터에서 위도(lat), 경도(lon), 검색 반경(radius)을 가져옵니다.
    const { lat, lon, radius = 0.01 } = req.query; // radius는 대략 1km 반경 (경위도에 따라 달라짐)

    if (!lat || !lon) {
        return res.status(400).send('위도(lat)와 경도(lon) 정보가 필요합니다.');
    }

    try {
        // 컬럼명 변경 적용: latitude, longitude를 사용하여 위치 기반 검색
        const [hotspots] = await pool.query(`
            SELECT 
                fid AS HOTSPOT_ID, city_district_name AS GU_NAME, spot_name AS LOCATION_NAME, latitude AS LATITUDE, longitude AS LONGITUDE,
                death_count, accident_count, casualty_count
            FROM ACCIDENT_HOTSPOTS
            WHERE 
                latitude BETWEEN ? - ? AND ? + ? AND
                longitude BETWEEN ? - ? AND ? + ?
            ORDER BY accident_count DESC
        `, [
            parseFloat(lat), parseFloat(radius), parseFloat(lat), parseFloat(radius),
            parseFloat(lon), parseFloat(radius), parseFloat(lon), parseFloat(radius)
        ]);

        res.json({ status: 'success', nearby_hotspots: hotspots });
    } catch (err) {
        console.error("Analysis Nearby Hotspots Error:", err);
        res.status(500).send('인근 지역 검색 오류: ' + err.message);
    }
});

module.exports = router;