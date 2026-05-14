const express = require('express');
const router = express.Router();
const db = require('../database/db');

const CAUSE_FILTER_CONFIG = [
    { queryKey: 'peak_delayGroup', column: 'a.peak_delay' },
    { queryKey: 'round_bluntGroup', column: 'a.round_blunt' },
    { queryKey: 'high_resistanceGroup', column: 'a.high_resistance' },
    { queryKey: 'low_resistanceGroup', column: 'a.low_resistance' },
    { queryKey: 'steal_bloodGroup', column: 'a.steal_blood' },
    { queryKey: 'vortexGroup', column: 'a.vortex' },
    { queryKey: 'turbulenceGroup', column: 'a.turbulence' },
    { queryKey: 'otherGroup', column: 'a.other_cause' },
    { queryKey: 'normal_spectrumGroup', column: 'a.normal_spectrum' },
];

const getMultiValueArr = (param) => {
    if (param === undefined || param === null || param === '') return [];
    return Array.isArray(param) ? param : [param];
};

// 判断前端是否“传了这个筛选字段”
const hasFilterParam = (param) => {
    if (param === undefined || param === null) return false;
    if (Array.isArray(param)) return param.length > 0;
    if (typeof param === 'string') return param.trim() !== '';
    return true;
};

// 解析 0/1 类型筛选值
const parseZeroOneArr = (param) => {
    return getMultiValueArr(param)
        .map(v => Number(v))
        .filter(v => v === 0 || v === 1);
};

// 解析中文字符串筛选值，不做数字映射
const parseChineseStringArr = (param) => {
    return getMultiValueArr(param)
        .map(v => String(v).trim())
        .filter(v => v !== '');
};

// 获取所有频谱图数据（带分页）
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 8,
            totalLimit,
            vesselGroup,
            genderGroup,
            ageGroup,
            annotationStatusGroup,
            noiseLevelGroup,
            envelopeQualityGroup,
            laminarFlowStatusGroup,
            searchText,
            analysisCheckStatus,

            // 新增：保持中文值，不映射成数字
            stenosis_flag,
            stenosis_degree,
        } = req.query;

        console.log('接收的筛选参数:', req.query);

        const originalPage = parseInt(page, 10);
        const originalPageSize = parseInt(pageSize, 10);
        const offset = (originalPage - 1) * originalPageSize;

        console.log('🔍 检查数据库状态...');

        const tables = await db.getAllTables();
        console.log('📊 数据库中的表:', tables);

        const patientCount = await db.getTableCount('tcdPatient');
        const snapshotCount = await db.getTableCount('tcdSnapshot');
        console.log(`📈 数据统计: 患者表 ${patientCount} 条, 频谱图表 ${snapshotCount} 条`);

        let baseQuery = `
            SELECT 
                s.snpId as id,
                s.snpFileName as fileName,
                s.full_bmp_file_path as imagePath,
                s.snpVessel as vessel,
                s.snpDirection as direction,
                s.snpPeak as peakVelocity,
                s.snpDias as diastolicVelocity, 
                s.patId as patientId,
                p.patName as patientName,
                p.patGender as gender,
                p.age,
                p.department,
                a.annotationId,
                a.noise_level,
                a.envelope_quality,
                a.laminar_flow_status,
                a.spectrum_quality_remark,
                a.abnormal_spectrum,
                a.normal_spectrum,
                a.peak_delay,
                a.round_blunt,
                a.high_resistance,
                a.low_resistance,
                a.steal_blood,
                a.vortex,
                a.turbulence,
                a.other_cause,
                a.cause_description,
                a.annotationStatus,
                a.stenosis_flag,
                a.stenosis_degree,
                a.annotatedAt,
                a.check_tag as analysisCheckStatus
            FROM tcdSnapshot s
            LEFT JOIN tcdPatient p ON s.patId = p.patId
            LEFT JOIN tcdAnnotations a ON s.snpId = a.snpId
            WHERE 1=1
        `;

        const params = [];

        // 搜索文本筛选
        if (searchText && searchText.trim() !== '') {
            const trimmedSearch = searchText.trim();
            const searchTerm = `%${trimmedSearch}%`;
            const isNumericSearch = /^\d+$/.test(trimmedSearch);

            if (isNumericSearch) {
                const numericId = parseInt(trimmedSearch, 10);
                baseQuery += ` AND (s.snpId = ? OR s.patId = ?)`;
                params.push(numericId, numericId);
            } else {
                baseQuery += `
                    AND (
                        s.snpFileName LIKE ? OR
                        p.patName LIKE ? OR
                        p.department LIKE ? OR
                        a.spectrum_quality_remark LIKE ? OR
                        a.other_cause LIKE ? OR
                        a.cause_description LIKE ? OR
                        a.stenosis_flag LIKE ? OR
                        a.stenosis_degree LIKE ?
                    )
                `;
                params.push(...Array(8).fill(searchTerm));
            }
        }

        // 1. 血管筛选
        const vesselArr = getMultiValueArr(vesselGroup);
        if (vesselArr.length > 0) {
            const likeConditions = vesselArr.map(() => 's.snpVessel LIKE ?').join(' OR ');
            baseQuery += ` AND (${likeConditions})`;
            params.push(...vesselArr.map(v => `%${String(v).toUpperCase()}%`));
        }

        // 2. 性别筛选
        const genderArr = getMultiValueArr(genderGroup);
        if (genderArr.length > 0) {
            const genderMap = { male: 0, female: 1 };
            const dbGenderArr = genderArr.map(g => genderMap[g] ?? g);

            baseQuery += ` AND p.patGender IN (${dbGenderArr.map(() => '?').join(',')})`;
            params.push(...dbGenderArr);
        }

        // 3. 年龄分组筛选
        const ageGroupArr = getMultiValueArr(ageGroup);
        if (ageGroupArr.length > 0) {
            const ageConditions = [];

            ageGroupArr.forEach(group => {
                switch (group) {
                    case 'child':
                        ageConditions.push('p.age <= 12');
                        break;
                    case 'teen':
                        ageConditions.push('p.age > 12 AND p.age <= 18');
                        break;
                    case 'adult':
                        ageConditions.push('p.age > 18 AND p.age <= 59');
                        break;
                    case 'elder':
                        ageConditions.push('p.age > 59');
                        break;
                    default:
                        break;
                }
            });

            if (ageConditions.length > 0) {
                baseQuery += ` AND (${ageConditions.join(' OR ')})`;
            }
        }

        // 4. 标注状态筛选
        const statusArr = getMultiValueArr(annotationStatusGroup);
        if (statusArr.length > 0) {
            const parsedStatusArr = statusArr
                .map(s => Number(s))
                .filter(s => !Number.isNaN(s));

            if (parsedStatusArr.length > 0) {
                baseQuery += ` AND a.annotationStatus IN (${parsedStatusArr.map(() => '?').join(',')})`;
                params.push(...parsedStatusArr);
            }
        }

        // 5. 频谱形态筛选
        // 规则：只要前端传了该 queryKey，就要求数据库对应列非空且 != 0
        const causeConditions = [];

        CAUSE_FILTER_CONFIG.forEach(({ queryKey, column }) => {
            if (hasFilterParam(req.query[queryKey])) {
                causeConditions.push(`(${column} IS NOT NULL AND ${column} != 0)`);
            }
        });

        if (causeConditions.length > 0) {
            baseQuery += ` AND (${causeConditions.join(' OR ')})`;
        }

        // 6. 噪音等级筛选
        const noiseLevelArr = getMultiValueArr(noiseLevelGroup);
        if (noiseLevelArr.length > 0) {
            const parsedNoiseLevelArr = noiseLevelArr
                .map(v => Number(v))
                .filter(v => !Number.isNaN(v));

            if (parsedNoiseLevelArr.length > 0) {
                baseQuery += ` AND a.noise_level IN (${parsedNoiseLevelArr.map(() => '?').join(',')})`;
                params.push(...parsedNoiseLevelArr);
            }
        }

        // 7. 包络线质量筛选
        const envelopeQualityArr = getMultiValueArr(envelopeQualityGroup);
        if (envelopeQualityArr.length > 0) {
            const parsedEnvelopeQualityArr = envelopeQualityArr
                .map(v => Number(v))
                .filter(v => !Number.isNaN(v));

            if (parsedEnvelopeQualityArr.length > 0) {
                baseQuery += ` AND a.envelope_quality IN (${parsedEnvelopeQualityArr.map(() => '?').join(',')})`;
                params.push(...parsedEnvelopeQualityArr);
            }
        }

        // 8. 层流状态筛选
        const laminarFlowStatusArr = getMultiValueArr(laminarFlowStatusGroup);
        if (laminarFlowStatusArr.length > 0) {
            const parsedLaminarFlowStatusArr = laminarFlowStatusArr
                .map(v => Number(v))
                .filter(v => !Number.isNaN(v));

            if (parsedLaminarFlowStatusArr.length > 0) {
                baseQuery += ` AND a.laminar_flow_status IN (${parsedLaminarFlowStatusArr.map(() => '?').join(',')})`;
                params.push(...parsedLaminarFlowStatusArr);
            }
        }

        // 9. 分析检查状态筛选
        // 1 => 已检查
        // 0 => 未检查
        const analysisCheckStatusArr = parseZeroOneArr(analysisCheckStatus);

        if (analysisCheckStatusArr.length > 0) {
            const hasChecked = analysisCheckStatusArr.includes(1);
            const hasUnchecked = analysisCheckStatusArr.includes(0);

            if (hasChecked && !hasUnchecked) {
                baseQuery += ` AND a.check_tag = 1`;
            } else if (!hasChecked && hasUnchecked) {
                baseQuery += ` AND (a.check_tag = 0 OR a.check_tag IS NULL)`;
            } else if (hasChecked && hasUnchecked) {
                // 同时传 0 和 1，相当于不过滤
            }
        }

        // 10. 是否狭窄筛选
        // 注意：这里不做任何数字映射，数据库和前端都使用中文值
        // 可选值：是、否、疑似是
        const stenosisFlagArr = parseChineseStringArr(stenosis_flag);

        if (stenosisFlagArr.length > 0) {
            baseQuery += ` AND a.stenosis_flag IN (${stenosisFlagArr.map(() => '?').join(',')})`;
            params.push(...stenosisFlagArr);
        }

        // 11. 狭窄程度筛选
        // 注意：这里不做任何数字映射，数据库和前端都使用中文值
        // 可选值：轻度、轻中度、中度、中重度、重度、无明确程度
        const stenosisDegreeArr = parseChineseStringArr(stenosis_degree);

        if (stenosisDegreeArr.length > 0) {
            baseQuery += ` AND a.stenosis_degree IN (${stenosisDegreeArr.map(() => '?').join(',')})`;
            params.push(...stenosisDegreeArr);
        }

        const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) AS subquery`;

        console.log("进行查询的参数为：", params)

        const countResult = await db.get(countQuery, [...params]);
        let total = countResult ? countResult.total : 0;

        if (totalLimit && Number(totalLimit) > 0) {
            const totalLimitNum = parseInt(totalLimit, 10);
            total = Math.min(total, totalLimitNum);
        }

        console.log(`📊 查询到 ${total} 条记录`);

        if (total === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page: originalPage,
                    pageSize: originalPageSize,
                    total: 0,
                    totalPages: 0
                }
            });
        }

        const startIndex = offset;
        const endIndex = Math.min(offset + originalPageSize, total);
        const actualPageSize = endIndex - startIndex;

        if (startIndex >= total) {
            return res.json({
                success: true,
                data: [],
                pagination: {
                    page: originalPage,
                    pageSize: originalPageSize,
                    total,
                    totalPages: Math.ceil(total / originalPageSize)
                }
            });
        }

        baseQuery += ' ORDER BY s.snpId LIMIT ? OFFSET ?';
        params.push(originalPageSize, offset);

        const spectrums = await db.query(baseQuery, params);
        const actualSpectrums = spectrums.slice(0, actualPageSize);

        console.log(`✅ 成功获取 ${actualSpectrums.length} 条频谱图数据`);

        const formattedSpectrums = actualSpectrums.map(spectrum => {
            const patientName = spectrum.patientName || `患者${spectrum.patientId}`;
            const age = spectrum.age || 0;
            const gender = spectrum.gender === 1 ? 'female' : 'male';
            const formattedPath = (spectrum.imagePath || '').replace(/\\\\/g, '/').replace(/\\/g, '/');

            return {
                id: spectrum.id,
                url: `/images/spectrum/${formattedPath}`,
                filePath: formattedPath,
                patientId: spectrum.patientId,
                patientName,
                age,
                gender,
                vessel: mapVessel(spectrum.vessel),
                direction: spectrum.direction,
                peakVelocity: spectrum.peakVelocity,
                diastolicVelocity: spectrum.diastolicVelocity,
                annotationStatus: spectrum.annotationStatus,
                noise_level: spectrum.noise_level,
                envelope_quality: spectrum.envelope_quality,
                laminar_flow_status: spectrum.laminar_flow_status,
                spectrum_quality_remark: spectrum.spectrum_quality_remark,
                abnormal_spectrum: spectrum.abnormal_spectrum,
                normal_spectrum: spectrum.normal_spectrum,
                peak_delay: spectrum.peak_delay,
                round_blunt: spectrum.round_blunt,
                high_resistance: spectrum.high_resistance,
                low_resistance: spectrum.low_resistance,
                steal_blood: spectrum.steal_blood,
                vortex: spectrum.vortex,
                turbulence: spectrum.turbulence,
                other_cause: spectrum.other_cause,
                cause_description: spectrum.cause_description,

                // 新增返回字段：保持中文
                stenosis_flag: spectrum.stenosis_flag,
                stenosis_degree: spectrum.stenosis_degree,

                annotatedAt: spectrum.annotatedAt,
                analysisCheckStatus: spectrum.analysisCheckStatus
            };
        });

        res.json({
            success: true,
            data: formattedSpectrums,
            pagination: {
                page: originalPage,
                pageSize: originalPageSize,
                total,
                totalPages: Math.ceil(total / originalPageSize)
            },
            debug: {
                tables,
                counts: {
                    patients: patientCount,
                    snapshots: snapshotCount
                }
            }
        });

    } catch (error) {
        console.error('获取频谱图数据失败:', error);
        res.status(500).json({
            success: false,
            error: '获取数据失败',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 获取数据库状态信息
router.get('/debug/info', async (req, res) => {
    try {
        const tables = await db.getAllTables();
        const tableInfo = {};

        for (const table of tables) {
            const count = await db.getTableCount(table);
            const schema = await db.getTableSchema(table);
            const sampleData = await db.query(`SELECT * FROM ${table} LIMIT 5`);

            tableInfo[table] = {
                count,
                columns: schema ? schema.map(col => ({
                    name: col.name,
                    type: col.type,
                    notnull: col.notnull,
                    pk: col.pk
                })) : [],
                sample: sampleData
            };
        }

        res.json({
            success: true,
            data: tableInfo
        });
    } catch (error) {
        console.error('获取数据库信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取数据库信息失败',
            message: error.message
        });
    }
});

// 修复关联关系测试
router.get('/debug/relationships', async (req, res) => {
    try {
        const testQueries = [
            `SELECT s.snpId, s.patId, p.patName 
             FROM tcdSnapshot s 
             LEFT JOIN tcdPatient p ON s.patId = p.patId 
             LIMIT 10`,

            `SELECT COUNT(*) as patientCount FROM tcdPatient`,

            `SELECT COUNT(*) as snapshotCount FROM tcdSnapshot`,

            `SELECT COUNT(*) as orphanedCount 
             FROM tcdSnapshot s 
             LEFT JOIN tcdPatient p ON s.patId = p.patId 
             WHERE p.patId IS NULL`
        ];

        const results = {};

        for (let i = 0; i < testQueries.length; i++) {
            try {
                const result = await db.query(testQueries[i]);
                results[`query_${i}`] = {
                    sql: testQueries[i],
                    result
                };
            } catch (error) {
                results[`query_${i}`] = {
                    sql: testQueries[i],
                    error: error.message
                };
            }
        }

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('关联关系测试失败:', error);
        res.status(500).json({
            success: false,
            error: '关联关系测试失败',
            message: error.message
        });
    }
});

// 获取单个频谱图详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                s.*,
                p.patName,
                p.patGender,
                p.age,
                p.department,
                a.stenosis_flag,
                a.stenosis_degree
            FROM tcdSnapshot s
            LEFT JOIN tcdPatient p ON s.patId = p.patId
            LEFT JOIN tcdAnnotations a ON s.snpId = a.snpId
            WHERE s.snpId = ?
        `;

        const spectrum = await db.get(query, [id]);

        if (!spectrum) {
            return res.status(404).json({
                success: false,
                error: '频谱图不存在'
            });
        }

        const formattedSpectrum = {
            id: spectrum.snpId,
            url: `/images/spectrum/${spectrum.snpFileName}`,
            filePath: spectrum.full_bmp_file_path,
            patientId: spectrum.patId,
            patientName: spectrum.patName || `患者${spectrum.patId}`,
            age: spectrum.age || 0,
            gender: spectrum.patGender === 1 ? 'female' : 'male',
            vessel: spectrum.snpVessel,
            direction: spectrum.snpDirection,
            peakVelocity: spectrum.snpPeak,
            diastolicVelocity: spectrum.snpDias,

            // 新增详情字段：保持中文
            stenosis_flag: spectrum.stenosis_flag,
            stenosis_degree: spectrum.stenosis_degree
        };

        res.json({
            success: true,
            data: formattedSpectrum
        });

    } catch (error) {
        console.error('获取频谱图详情失败:', error);
        res.status(500).json({
            success: false,
            error: '获取详情失败',
            message: error.message
        });
    }
});

// 保存标注数据
router.post('/:id/annotations', async (req, res) => {
    try {
        const { id } = req.params;
        const annotationData = req.body;

        console.log(`保存标注数据 - 频谱图ID: ${id}`, annotationData);

        const existingRecord = await db.get(`
            SELECT s.snpId, a.annotationId 
            FROM tcdSnapshot s 
            LEFT JOIN tcdAnnotations a ON s.snpId = a.snpId 
            WHERE s.snpId = ?
        `, [id]);

        if (!existingRecord) {
            return res.status(404).json({
                success: false,
                error: '频谱图不存在'
            });
        }

        if (!existingRecord.annotationId) {
            return res.status(404).json({
                success: false,
                error: '标注记录不存在，无法更新'
            });
        }

        const result = await db.run(`
            UPDATE tcdAnnotations SET 
                noise_level = ?, 
                envelope_quality = ?, 
                laminar_flow_status = ?,
                spectrum_quality_remark = ?,
                abnormal_spectrum = ?,
                normal_spectrum = ?,
                peak_delay = ?,
                round_blunt = ?,
                high_resistance = ?,
                low_resistance = ?,
                steal_blood = ?,
                vortex = ?,
                turbulence = ?,
                other_cause = ?,
                cause_description = ?,
                stenosis_flag = ?,
                stenosis_degree = ?,
                annotationStatus = ?,
                annotatedAt = datetime('now')
            WHERE snpId = ?
        `, [
            annotationData.noise_level,
            annotationData.envelope_quality,
            annotationData.laminar_flow_status,
            annotationData.spectrum_quality_remark,
            annotationData.abnormal_spectrum,
            annotationData.normal_spectrum,
            annotationData.peak_delay,
            annotationData.round_blunt,
            annotationData.high_resistance,
            annotationData.low_resistance,
            annotationData.steal_blood,
            annotationData.vortex,
            annotationData.turbulence,
            annotationData.other_cause,
            annotationData.cause_description,

            // 保存时也保持中文，不做数字映射
            // stenosis_flag: 是 / 否 / 疑似是
            annotationData.stenosis_flag,

            // stenosis_degree: 轻度 / 轻中度 / 中度 / 中重度 / 重度 / 无明确程度
            annotationData.stenosis_degree,

            2,
            id
        ]);

        console.log(`更新标注记录，影响行数: ${result.changes}`);

        res.json({
            success: true,
            message: '标注数据更新成功',
            data: {
                annotationId: existingRecord.annotationId,
                snpId: id,
                ...annotationData,
                annotationStatus: 2,
                annotatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('保存标注数据失败:', error);
        res.status(500).json({
            success: false,
            error: '保存标注失败',
            message: error.message
        });
    }
});

// 工具函数：映射血管名称
function mapVessel(dbVessel) {
    return dbVessel;
}

module.exports = router;