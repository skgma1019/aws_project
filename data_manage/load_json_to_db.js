// load_json_to_db.js (최종, 영문 컬럼 버전)

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise'); 

// ----------------- 🛠️ 설정 변수 🛠️ -----------------
const JSON_FILE_PATH = 'dataset_converted.json';
const TABLE_NAME = 'ACCIDENT_HOTSPOTS';

// 💡 JSON 파일의 영문 키 이름과 정확히 일치하도록 수정
const COLUMN_NAMES = [
    'fid', 'id', 'legal_dong_code', 'spot_code', 'city_district_name', 'spot_name', 
    'accident_count', 'casualty_count', 'death_count', 'severe_injury_count', 
    'minor_injury_count', 'reported_injury_count', 'longitude', 'latitude', 
    'polygon_geom'
];

// ❗❗ MySQL 연결 정보 ❗❗ (반드시 본인의 정보로 수정)
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '1234', // <-- 비밀번호 정확히 수정!
    database: 'accident',
    port: 3306,
    charset: 'utf8mb4'
};
// ----------------------------------------------------


async function loadJsonToMysql() {
    let connection;
    console.log(`작업 시작: '${JSON_FILE_PATH}' 파일을 MySQL DB에 저장합니다.`);

    // 1. JSON 파일 읽기
    const filePath = path.resolve(__dirname, JSON_FILE_PATH);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ 오류: JSON 파일을 찾을 수 없습니다. 경로를 확인해주세요: ${filePath}`);
        return;
    }
    
    let jsonData;
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        jsonData = JSON.parse(fileContent);
        console.log(`✅ JSON 파일 불러오기 성공. 총 ${jsonData.length}개 레코드 준비.`);
    } catch (e) {
        console.error('❌ JSON 파일 파싱 중 오류 발생:', e.message);
        return;
    }

    // 2. MySQL 연결
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ 데이터베이스 연결 성공!');
    } catch (e) {
        console.error('❌ 데이터베이스 연결 오류:', e.message);
        return;
    }

    // 3. 데이터베이스 작업
    try {
        // 3-1. 기존 테이블 삭제
        await connection.execute(`DROP TABLE IF EXISTS ${TABLE_NAME}`);
        console.log(`✅ 기존 테이블 '${TABLE_NAME}' 삭제 완료.`);

        // 3-2. 테이블 생성 쿼리 (createTableQuery 변수 정의)
        const createTableQuery = `
            CREATE TABLE ${TABLE_NAME} (
                fid BIGINT PRIMARY KEY,
                id BIGINT,
                legal_dong_code VARCHAR(20),
                spot_code VARCHAR(20),
                city_district_name VARCHAR(50),
                spot_name VARCHAR(255),
                accident_count INT,
                casualty_count INT,
                death_count INT,
                severe_injury_count INT,
                minor_injury_count INT,
                reported_injury_count INT,
                longitude DECIMAL(15, 12),
                latitude DECIMAL(15, 12),
                polygon_geom TEXT
            );
        `;
        // 이 줄에서 변수가 정의되고 실행됩니다.
        await connection.execute(createTableQuery); 
        console.log(`✅ 새 테이블 '${TABLE_NAME}' 생성 완료.`);

        // 3-3. 대량 삽입 쿼리 준비
        const valuesToInsert = jsonData.map(record => {
            return COLUMN_NAMES.map(col => {
                const value = record[col];
                // Null 값 처리: Node.js undefined/null을 MySQL NULL로
                return (value === undefined || value === null) ? null : value;
            });
        });
        
        // 3-4. executemany로 대량 삽입 실행
        const columns = COLUMN_NAMES.join(', '); // 영문 컬럼명이므로 백틱 불필요
        const insertQuery = `INSERT INTO ${TABLE_NAME} (${columns}) VALUES ?`;
        
        // connection.query(insertQuery, [valuesToInsert]); 형태로 배열의 배열을 전달
        const [result] = await connection.query(insertQuery, [valuesToInsert]);

        console.log(`\n🎉 성공! 데이터 총 ${result.affectedRows}개 행이 MySQL에 저장되었습니다.`);

    } catch (e) {
        console.error('\n❌ 데이터 삽입 중 최종 오류 발생:', e.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('✅ 데이터베이스 연결 종료.');
        }
    }
}

loadJsonToMysql();