const mysql = require("mysql2/promise");

// MySQL 접속 정보를 여기에 설정하세요.
const pool = mysql.createPool({
  host: "localhost:3306", // MySQL 서버 주소
  user: "root", // MySQL 사용자 이름
  password: "1234", // MySQL 비밀번호
  database: "accident", // 위에서 생성한 DB 이름
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
