// db/db_setup.js
const pool = require('../db_config');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = path.join(__dirname, '../data_manage/dataset.csv');
const DDL_FILE = path.join(__dirname, '../db_schema.sql');

/**
 * DB 초기화, 테이블 생성, 초기 데이터 삽입을 처리합니다.
 */
async function initDB() {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 테이블 생성 DDL 실행 (모든 테이블 구조 확인)
        const DDL = fs.readFileSync(DDL_FILE, 'utf-8');

        // 🚨 쿼리 분리 로직 추가 🚨
        const queries = DDL.split(';')
                           // 보이지 않는 공백, 탭, 줄바꿈 문자를 제거합니다.
                           .map(query => query.replace(/\r\n|\n|\r|\t/g, ' ').trim())
                           .filter(query => query.length > 0);

        for (const trimmedQuery of queries) {
            await connection.query(trimmedQuery);
        }
        // 🚨 쿼리 분리 로직 끝 🚨

        console.log("✅ MySQL 테이블 구조 확인 완료.");

         // 2. SAFETY_MEASURES 초기 데이터 삽입
         await insertSafetyMeasures(connection);

        // 3. CSV 데이터 로드 및 HOTSPOTS 테이블에 삽입 (데이터 존재 여부 확인 후 실행)
        await loadCSVData(connection);
        
    } catch (error) {
        console.error("❌ DB 초기화 중 오류 발생:", error);
        throw error; 
    } finally {
        if (connection) connection.release();
    }
}

/**
 * SAFETY_MEASURES 테이블에 초기 조언 데이터를 삽입합니다. (데이터가 없을 때만)
 */
async function insertSafetyMeasures(connection) {
    const [rows] = await connection.query("SELECT COUNT(*) AS count FROM SAFETY_MEASURES");
    if (rows[0].count === 0) {
        const measures = [
            ['위험', '교차로 개선 및 단속 강화', '사망자 수에 집중하여 긴급 안전 대책 발동이 필요합니다. 주요 교차로 단속을 강화하세요.'],
            ['경계', '특정 지역 안전 캠페인 실시', '사고 다발 지역을 중심으로 보행자 및 운전자 안전 캠페인을 주기적으로 실시해야 합니다.'],
            ['주의', '교통안전 교육 확대', '현재는 안정적이지만, 모든 주민 대상 교통 안전 교육을 연 2회 이상 의무적으로 실시해야 합니다.']
        ];
        const insertQuery = "INSERT INTO SAFETY_MEASURES (RISK_LEVEL, RECOMMENDATION_TYPE, DETAIL_ADVICE) VALUES ?";
        
        await connection.query(insertQuery, [measures]);
        console.log("✅ SAFETY_MEASURES 초기 데이터 삽입 완료.");
    } else {
        console.log("✅ SAFETY_MEASURES 데이터 이미 존재.");
    }
}

/**
 * CSV 파일을 읽어 ACCIDENT_HOTSPOTS 테이블에 데이터를 삽입합니다.
 */
async function loadCSVData(connection) {
    // 💡 1. 데이터가 이미 존재하는지 확인: 데이터가 있다면 즉시 종료 (빠른 서버 실행)
    const [checkRows] = await connection.query("SELECT COUNT(*) AS count FROM ACCIDENT_HOTSPOTS");
    if (checkRows[0].count > 0) {
        console.log("✅ ACCIDENT_HOTSPOTS 테이블에 데이터가 이미 존재합니다. CSV 로드를 건너뛰고 서버를 빠르게 시작합니다.");
        return; 
    }
    
    // --- 데이터가 존재하지 않을 경우에만 아래 로직 실행 (첫 실행 시에만) ---

    if (!fs.existsSync(CSV_FILE)) {
        console.warn("⚠️ CSV 파일이 없습니다. 데이터 로드를 건너뜁니다.");
        return;
    }

    const results = [];
    await new Promise((resolve, reject) => {
        // 인코딩 문제 해결을 위해 'utf-8-sig' 사용
        fs.createReadStream(CSV_FILE)
            .pipe(csv({ encoding: 'utf-8-sig' })) 
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    try {
        // 사용자님이 정의한 원본 컬럼 구조에 맞게 INSERT 쿼리 구성
        const insertQuery = `
            INSERT INTO ACCIDENT_HOTSPOTS 
            (fid, id, legal_dong_code, spot_code, city_district_name, spot_name, 
             accident_count, casualty_count, death_count, severe_injury_count, 
             minor_injury_count, reported_injury_count, longitude, latitude, polygon_geom) 
            VALUES ?
        `;

        const dataToInsert = results.map(row => {
            // DB 컬럼 구조에 맞게 매핑
            return [
                parseInt(row['사고다발지fid']), 
                parseInt(row['사고다발지id']),
                row['법정동코드'],
                row['지점코드'],
                row['시도시군구명'],
                row['지점명'],
                parseInt(row['사고건수']),
                parseInt(row['사상자수']),
                parseInt(row['사망자수']),
                parseInt(row['중상자수']),
                parseInt(row['경상자수']),
                parseInt(row['부상신고자수']),
                parseFloat(row['경도']),
                parseFloat(row['위도']),
                row['다발지역폴리곤']
            ];
        });

        if (dataToInsert.length > 0) {
            await connection.query(insertQuery, [dataToInsert]);
            console.log(`✅ ${results.length}개 사고 다발 지역 데이터 로드 완료.`);
        } else {
            console.log("⚠️ CSV에 삽입할 데이터가 없습니다.");
        }

    } catch (error) {
        console.error("❌ CSV 데이터 로드 중 오류 발생:", error);
        throw error;
    }
}

module.exports = { initDB };