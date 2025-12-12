// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db_config');
const bcrypt = require('bcryptjs');

const saltRounds = 10;

// 회원가입 (POST /api/auth/register)
router.post('/register', async (req, res) => {
    const { login_id, name, password, email } = req.body;
    if (!login_id || !name || !password) {
        return res.status(400).send('필수 정보(ID, 이름, 비밀번호)를 입력하세요.');
    }

    try {
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const insertQuery = "INSERT INTO USERS (LOGIN_ID, NAME, PASSWORD_HASH, EMAIL, REGISTRATION_DATE) VALUES (?, ?, ?, ?, NOW())";

        const [result] = await pool.query(insertQuery, [login_id, name, passwordHash, email]);
        res.status(201).send({ message: '회원가입 성공', user_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('이미 존재하는 아이디입니다.');
        }
        res.status(500).send('회원가입 오류: ' + err.message);
    }
});

// 로그인 (POST /api/auth/login)
router.post('/login', async (req, res) => {
    const { login_id, password } = req.body;

    try {
        const [rows] = await pool.query("SELECT USER_ID, PASSWORD_HASH FROM USERS WHERE LOGIN_ID = ?", [login_id]);
        const user = rows[0];

        if (!user) return res.status(401).send('아이디가 존재하지 않습니다.');

        const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH);
        if (!isMatch) {
            return res.status(401).send('비밀번호가 일치하지 않습니다.');
        }

        // 성공 시 세션/JWT 발급 로직 추가
        res.status(200).send({ message: '로그인 성공', user_id: user.USER_ID });
    } catch (err) {
        res.status(500).send('로그인 오류: ' + err.message);
    }
});

module.exports = router;