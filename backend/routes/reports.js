// routes/reports.js
const express = require('express');
const router = express.Router();
const pool = require('../db_config');

// C (Create): 사용자 제보 등록 (POST /api/reports)
router.post('/', async (req, res) => {
    // 실제는 인증 미들웨어를 통해 user_id를 req.user.id에서 가져와야 함 (임시로 body 사용)
    const reporter_user_id = req.body.user_id || 1; 
    const { title, gu_name, description, photo_path } = req.body;
    
    if (!title || !gu_name || !description) {
        return res.status(400).send('제목, 지역명, 내용을 모두 입력하세요.');
    }

    const insertQuery = `
        INSERT INTO USER_HAZARD_REPORTS 
        (REPORTER_USER_ID, TITLE, GU_NAME, DETAIL_DESCRIPTION, PHOTO_PATH, REPORT_DATE) 
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    try {
        const [result] = await pool.query(insertQuery, [reporter_user_id, title, gu_name, description, photo_path]);
        res.status(201).send({ message: '제보가 성공적으로 등록되었습니다.', report_id: result.insertId });
    } catch (err) {
        res.status(500).send('제보 등록 오류: ' + err.message);
    }
});

// R (Read): 특정 사용자 제보 목록 조회 (GET /api/reports/:user_id)
router.get('/:user_id', async (req, res) => {
    const user_id = req.params.user_id;
    
    try {
        const [reports] = await pool.query("SELECT * FROM USER_HAZARD_REPORTS WHERE REPORTER_USER_ID = ?", [user_id]);
        res.json({ status: 'success', reports: reports });
    } catch (err) {
        res.status(500).send('제보 조회 오류: ' + err.message);
    }
});

// U (Update): 제보 수정 (PUT /api/reports/:report_id)
router.put('/:report_id', async (req, res) => {
    const report_id = req.params.report_id;
    const reporter_user_id = req.body.user_id || 1; 
    const { title, gu_name, description, photo_path } = req.body;
    
    const updateQuery = `
        UPDATE USER_HAZARD_REPORTS 
        SET TITLE = ?, DETAIL_DESCRIPTION = ?, GU_NAME = ?, PHOTO_PATH = ?
        WHERE REPORT_ID = ? AND REPORTER_USER_ID = ?
    `;

    try {
        const [result] = await pool.query(updateQuery, [title, description, gu_name, photo_path, report_id, reporter_user_id]);

        if (result.affectedRows === 0) {
            return res.status(404).send('해당 제보를 찾거나 수정할 권한이 없습니다.');
        }
        res.send({ message: `제보 ID ${report_id} 수정 완료` });
    } catch (err) {
        res.status(500).send('제보 수정 오류: ' + err.message);
    }
});

// D (Delete): 제보 삭제 (DELETE /api/reports/:report_id)
router.delete('/:report_id', async (req, res) => {
    const report_id = req.params.report_id;
    const reporter_user_id = req.body.user_id || 1; 

    try {
        const [result] = await pool.query("DELETE FROM USER_HAZARD_REPORTS WHERE REPORT_ID = ? AND REPORTER_USER_ID = ?", [report_id, reporter_user_id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).send('해당 제보를 찾거나 삭제할 권한이 없습니다.');
        }
        res.send({ message: `제보 ID ${report_id} 삭제 완료` });
    } catch (err) {
        res.status(500).send('제보 삭제 오류: ' + err.message);
    }
});

module.exports = router;