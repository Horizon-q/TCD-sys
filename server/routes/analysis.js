const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
        SELECT 
            *
        FROM tcdAnalysis
        WHERE snpId = ?
        `;

        const analysis = await db.get(query, [id]);

        console.log('查询到的分析结果', analysis);

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: '频谱图不存在'
            });
        }

        res.json({
            success: true,
            data: analysis
        });

    } catch (error) {
        console.error('获取分析结果失败:', error);
        res.status(500).json({
            success: false,
            error: '获取分析结果失败',
            message: error.message
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const analysisData = req.body;

        const oldAnalysis = await db.get(
            'SELECT * FROM tcdAnalysis WHERE snpId = ?',
            [id]
        );

        if (!oldAnalysis) {
            return res.status(404).json({
                success: false,
                error: '未找到对应的分析记录'
            });
        }

        const {
            pId,
            velocity,
            velocity_status,
            velocity_reference,
            spectrum_disorder,
            bruit_status,
            direction_status,
            envelope_status,
            pi_status,
            stenosis_flag,
            stenosis,
            analysisFlag,
            analysis_at,
            velocity_exam,
            check_tag,
            stenosis_descri,
        } = analysisData;

        const query = `
        UPDATE tcdAnalysis
        SET
            pId = ?,
            velocity = ?,
            velocity_status = ?,
            velocity_reference = ?,
            spectrum_disorder = ?,
            bruit_status = ?,
            direction_status = ?,
            envelope_status = ?,
            pi_status = ?,
            stenosis_flag = ?,
            stenosis = ?,
            analysisFlag = ?,
            velocity_exam = ?,
            analysis_at = ?,
            check_tag=?,
            stenosis_descri = ?
        WHERE snpId = ?
        `;

        const result = await db.run(query, [
            pId,
            velocity,
            velocity_status,
            velocity_reference,
            spectrum_disorder,
            bruit_status,
            direction_status,
            envelope_status,
            pi_status,
            stenosis_flag,
            stenosis,
            analysisFlag,
            velocity_exam,
            analysis_at,
            check_tag,
            stenosis_descri,
            id,
        ]);

        if (result.changes === 0) {
            return res.status(400).json({
                success: false,
                error: '更新失败'
            });
        }

        const updatedAnalysis = await db.get(
            'SELECT * FROM tcdAnalysis WHERE snpId = ?',
            [id]
        );

        console.log('更新后的分析结果', updatedAnalysis);

        res.json({
            success: true,
            message: '分析结果更新成功',
            data: updatedAnalysis
        });

    } catch (error) {
        console.error('更新分析结果失败:', error);
        res.status(500).json({
            success: false,
            error: '更新分析结果失败',
            message: error.message
        });
    }
});

module.exports = router;