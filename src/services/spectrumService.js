// services/spectrumService.js

// 模拟数据生成函数
const generateMockSpectrums = (count = 25) => {
    const stenosisFlags = ['是', '否', '疑似是'];
    const stenosisDegrees = ['轻度', '轻中度', '中度', '中重度', '重度', '无明确程度'];

    return Array.from({ length: count }, (_, index) => {
        const causeKeys = getRandomSpectrumTypes();

        const baseCauseFields = {
            peak_delay: null,
            round_blunt: null,
            high_resistance: null,
            low_resistance: null,
            steal_blood: null,
            vortex: null,
            turbulence: null,
            other: null,
            normal_spectrum: null,
        };

        causeKeys.forEach((key) => {
            if (key in baseCauseFields) {
                baseCauseFields[key] = 1;
            }
        });

        return {
            id: index + 1,
            url: `/images/spectrum/sample (${index + 1}).bmp`,
            patientId: `P202300${String(index + 1).padStart(3, '0')}`,
            patientName: `患者${index + 1}`,
            age: Math.floor(index * 2) + 5,
            gender: Math.random() > 0.5 ? 'female' : 'male',
            vessel: ['mca', 'aca', 'pca', 'va', 'ba'][index % 5],
            direction: index % 2 === 0 ? 'U' : 'L',
            peakVelocity: Math.random() * 100,
            diastolicVelocity: Math.random() * 100,
            annotationStatus: Math.floor(Math.random() * 4) + 1,

            noise_level: [1, 4, 7, 10][index % 4],
            envelope_quality: [1, 4, 7, 10][(index + 1) % 4],
            laminar_flow_status: [1, 4, 7, 10][(index + 2) % 4],

            // 新增：是否狭窄、狭窄程度，保持中文值
            stenosis_flag: stenosisFlags[index % stenosisFlags.length],
            stenosis_degree: stenosisDegrees[index % stenosisDegrees.length],

            spectrum_quality_remark: 'HAHA',
            otherCause: 'HEHE',
            specialNote: 'HIHI',
            annotatedAt: '',
            annotated: Math.random() > 0.3,

            ...baseCauseFields,
        };
    });
};

// 随机生成频谱形态
const getRandomSpectrumTypes = () => {
    const allTypes = [
        'peak_delay',
        'round_blunt',
        'high_resistance',
        'low_resistance',
        'steal_blood',
        'vortex',
        'turbulence',
        'other',
        'normal_spectrum',
    ];
    const count = Math.floor(Math.random() * 3) + 1;
    return allTypes.sort(() => 0.5 - Math.random()).slice(0, count);
};

// 辅助函数：根据年龄获取分组
const getAgeGroup = (age) => {
    if (age <= 12) return 'child';
    if (age <= 18) return 'teen';
    if (age <= 59) return 'adult';
    return 'elder';
};

const CAUSE_FILTER_KEYS = [
    'peak_delay',
    'round_blunt',
    'high_resistance',
    'low_resistance',
    'steal_blood',
    'vortex',
    'turbulence',
    'other',
    'normal_spectrum',
];

const hasSelectedCauseFilter = (filters) => {
    return CAUSE_FILTER_KEYS.some((key) => Array.isArray(filters[key]) && filters[key].length > 0);
};

// 数据筛选函数
const applyFilters = (spectrums, filters) => {
    let result = [...spectrums];
    console.log('result', result);

    // 血管筛选
    if (filters.vessels?.length > 0) {
        result = result.filter((spectrum) =>
            filters.vessels.includes(spectrum.vessel)
        );
    }

    // 年龄分组筛选
    if (filters.ageGroups?.length > 0) {
        result = result.filter((spectrum) => {
            const ageGroup = getAgeGroup(spectrum.age);
            return filters.ageGroups.includes(ageGroup);
        });
    }

    // 性别筛选
    if (filters.genders?.length > 0) {
        result = result.filter((spectrum) =>
            filters.genders.includes(spectrum.gender)
        );
    }

    // 标注状态筛选
    if (filters.annotationStatus?.length > 0) {
        result = result.filter((spectrum) => {
            return filters.annotationStatus.includes(spectrum.annotationStatus);
        });
    }

    // 新增：是否狭窄筛选，保持中文值
    if (filters.stenosis_flag?.length > 0) {
        result = result.filter((spectrum) => {
            if (spectrum.stenosis_flag === undefined || spectrum.stenosis_flag === null) return false;
            return filters.stenosis_flag.includes(spectrum.stenosis_flag);
        });
    }

    // 新增：狭窄程度筛选，保持中文值
    if (filters.stenosis_degree?.length > 0) {
        result = result.filter((spectrum) => {
            if (spectrum.stenosis_degree === undefined || spectrum.stenosis_degree === null) return false;
            return filters.stenosis_degree.includes(spectrum.stenosis_degree);
        });
    }

    // 频谱形态筛选（独立字段）
    if (hasSelectedCauseFilter(filters)) {
        result = result.filter((spectrum) => {
            return CAUSE_FILTER_KEYS.some((key) => {
                const selectedValues = filters[key];
                if (!Array.isArray(selectedValues) || selectedValues.length === 0) return false;

                const fieldValue = spectrum[key];
                if (fieldValue === undefined || fieldValue === null || fieldValue === '') return false;

                return selectedValues.includes(fieldValue);
            });
        });
    }

    // 噪音等级筛选
    if (filters.noise_level?.length > 0) {
        result = result.filter((spectrum) => {
            if (spectrum.noise_level === undefined || spectrum.noise_level === null) return false;
            return filters.noise_level.includes(spectrum.noise_level);
        });
    }

    // 包络线质量筛选
    if (filters.envelope_quality?.length > 0) {
        result = result.filter((spectrum) => {
            if (spectrum.envelope_quality === undefined || spectrum.envelope_quality === null) return false;
            return filters.envelope_quality.includes(spectrum.envelope_quality);
        });
    }

    // 层流状态筛选
    if (filters.laminar_flow_status?.length > 0) {
        result = result.filter((spectrum) => {
            if (spectrum.laminar_flow_status === undefined || spectrum.laminar_flow_status === null) return false;
            return filters.laminar_flow_status.includes(spectrum.laminar_flow_status);
        });
    }

    console.log('筛选结果:', {
        总数量: spectrums.length,
        筛选后数量: result.length,
        筛选条件: filters
    });

    return result;
};

// 更新标注数据
const updateAnnotation = (spectrums, imageId, annotationData) => {
    return spectrums.map((spectrum) =>
        spectrum.id === imageId
            ? {
                ...spectrum,
                annotated: true,
                annotationStatus: annotationData.annotationStatus ?? spectrum.annotationStatus,

                noise_level: annotationData.noise_level ?? spectrum.noise_level,
                envelope_quality: annotationData.envelope_quality ?? spectrum.envelope_quality,
                laminar_flow_status: annotationData.laminar_flow_status ?? spectrum.laminar_flow_status,
                spectrum_quality_remark: annotationData.spectrum_quality_remark ?? spectrum.spectrum_quality_remark,
                abnormal_spectrum: annotationData.abnormal_spectrum ?? spectrum.abnormal_spectrum,
                normal_spectrum: annotationData.normal_spectrum ?? spectrum.normal_spectrum,

                peak_delay: annotationData.peak_delay ?? spectrum.peak_delay,
                round_blunt: annotationData.round_blunt ?? spectrum.round_blunt,
                high_resistance: annotationData.high_resistance ?? spectrum.high_resistance,
                low_resistance: annotationData.low_resistance ?? spectrum.low_resistance,
                steal_blood: annotationData.steal_blood ?? spectrum.steal_blood,
                vortex: annotationData.vortex ?? spectrum.vortex,
                turbulence: annotationData.turbulence ?? spectrum.turbulence,
                other: annotationData.other ?? spectrum.other,

                other_cause: annotationData.other_cause ?? spectrum.other_cause,
                cause_description: annotationData.cause_description ?? spectrum.cause_description,

                // 新增：是否狭窄、狭窄程度，保持中文值
                stenosis_flag: annotationData.stenosis_flag ?? spectrum.stenosis_flag,
                stenosis_degree: annotationData.stenosis_degree ?? spectrum.stenosis_degree,

                annotatedAt: annotationData.annotatedAt ?? spectrum.annotatedAt,
            }
            : spectrum
    );
};

// 获取默认筛选条件
const getDefaultFilters = () => ({
    vessels: [],
    ageGroups: [],
    genders: [],
    pathologyTypes: [],
    annotationStatus: [1], // 默认只显示未标注的

    // 新增：默认筛选项
    stenosis_flag: [],
    stenosis_degree: [],

    peak_delay: [],
    round_blunt: [],
    high_resistance: [],
    low_resistance: [],
    steal_blood: [],
    vortex: [],
    turbulence: [],
    other: [],
    normal_spectrum: [],

    noise_level: [],
    envelope_quality: [],
    laminar_flow_status: [],
});

// 获取默认表单数据
const getDefaultFormData = () => ({
    noise_level: null,
    envelope_quality: null,
    laminar_flow_status: null,
    spectrum_quality_remark: null,
    abnormal_spectrum: null,
    normal_spectrum: null,
    peak_delay: null,
    round_blunt: null,
    high_resistance: null,
    low_resistance: null,
    steal_blood: null,
    vortex: null,
    turbulence: null,
    other: null,
    other_cause: null,
    cause_description: null,

    // 新增：默认表单字段
    stenosis_flag: null,
    stenosis_degree: null,

    annotationStatus: null,
    annotatedAt: null
});

// 获取默认图片数据
const getDefaultImage = () => ({
    id: 0,
    url: '',
    patientId: '',
    patientName: '无匹配图片',
    age: 0,
    gender: 'male',
    vessel: '',
    direction: '',
    depth: 0,
    annotation: null,

    // 新增：默认图片字段
    stenosis_flag: null,
    stenosis_degree: null,
});

// API 模拟函数
const spectrumAPI = {
    // 获取所有频谱图数据
    getAllSpectrums: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            // 添加筛选参数
            if (filters.vessels?.length) {
                filters.vessels.forEach((item) => queryParams.append('vesselGroup', item));
            }
            if (filters.genders?.length) {
                filters.genders.forEach((item) => queryParams.append('genderGroup', item));
            }
            if (filters.ageGroups?.length) {
                filters.ageGroups.forEach((item) => queryParams.append('ageGroup', item));
            }
            if (filters.annotationStatus?.length) {
                filters.annotationStatus.forEach((item) => queryParams.append('annotationStatusGroup', item));
            }

            // 新增：是否狭窄筛选参数，保持中文值
            if (filters.stenosis_flag?.length) {
                filters.stenosis_flag.forEach((item) => queryParams.append('stenosis_flag', item));
            }

            // 新增：狭窄程度筛选参数，保持中文值
            if (filters.stenosis_degree?.length) {
                filters.stenosis_degree.forEach((item) => queryParams.append('stenosis_degree', item));
            }

            CAUSE_FILTER_KEYS.forEach((key) => {
                if (filters[key]?.length) {
                    filters[key].forEach((item) => queryParams.append(`${key}Group`, item));
                }
            });

            if (filters.noise_level?.length) {
                filters.noise_level.forEach((item) => queryParams.append('noiseLevelGroup', item));
            }
            if (filters.envelope_quality?.length) {
                filters.envelope_quality.forEach((item) => queryParams.append('envelopeQualityGroup', item));
            }
            if (filters.laminar_flow_status?.length) {
                filters.laminar_flow_status.forEach((item) => queryParams.append('laminarFlowStatusGroup', item));
            }

            const response = await fetch(`http://localhost:3001/api/spectrum?${queryParams}`);
            const result = await response.json();

            if (result.success) {
                result.data.forEach((item) => {
                    item.url = `http://localhost:3001${item.url}`;
                });
                console.log('API调用成功', result);
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('API调用失败，使用模拟数据:', error);
            return generateMockSpectrums(25);
        }
    },

    // 获取频谱图数据
    getSpectrums: async (options = {}) => {
        try {
            const {
                filters = {},
                page = 1,
                pageSize = 8,
                totalLimit = 1000,
                searchText = ''
            } = options;

            const queryParams = new URLSearchParams();

            queryParams.append('page', page);
            queryParams.append('pageSize', pageSize);
            queryParams.append('totalLimit', totalLimit);
            queryParams.append('searchText', searchText);

            console.log("本次的筛选参数为：", filters);

            // 添加筛选参数（支持多选）
            if (filters.vessels?.length) {
                filters.vessels.forEach((item) => queryParams.append('vesselGroup', item));
            }
            if (filters.genders?.length) {
                filters.genders.forEach((item) => queryParams.append('genderGroup', item));
            }
            if (filters.ageGroups?.length) {
                filters.ageGroups.forEach((item) => queryParams.append('ageGroup', item));
            }
            if (filters.annotationStatus?.length) {
                filters.annotationStatus.forEach((item) => queryParams.append('annotationStatusGroup', item));
            }

            if (filters.analysisCheckStatus?.length === 1) {
                filters.analysisCheckStatus.forEach((item) => queryParams.append('analysisCheckStatus', item));
            }

            // 新增：是否狭窄筛选参数，保持中文值
            if (filters.stenosis_flag?.length) {
                filters.stenosis_flag.forEach((item) => queryParams.append('stenosis_flag', item));
            }

            // 新增：狭窄程度筛选参数，保持中文值
            if (filters.stenosis_degree?.length) {
                filters.stenosis_degree.forEach((item) => queryParams.append('stenosis_degree', item));
            }

            CAUSE_FILTER_KEYS.forEach((key) => {
                if (filters[key]?.length) {
                    filters[key].forEach((item) => queryParams.append(`${key}Group`, item));
                }
            });

            if (filters.noise_level?.length) {
                filters.noise_level.forEach((item) => queryParams.append('noiseLevelGroup', item));
            }
            if (filters.envelope_quality?.length) {
                filters.envelope_quality.forEach((item) => queryParams.append('envelopeQualityGroup', item));
            }
            if (filters.laminar_flow_status?.length) {
                filters.laminar_flow_status.forEach((item) => queryParams.append('laminarFlowStatusGroup', item));
            }

            const response = await fetch(`http://localhost:3001/api/spectrum?${queryParams}`);
            const result = await response.json();

            if (result.success) {
                result.data.forEach((item) => {
                    item.url = `http://localhost:3001${item.url}`;
                });
                console.log('频谱图数据获取成功', result);
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('API调用失败，使用模拟数据:', error);
            return generateMockSpectrums(25);
        }
    },

    // 保存标注数据
    saveAnnotation: async (imageId, annotationData) => {
        try {
            const response = await fetch(`http://localhost:3001/api/spectrum/${imageId}/annotations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(annotationData),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('保存标注失败:', error);
            return { success: false, error: error.message };
        }
    }
};

export {
    applyFilters, generateMockSpectrums, getAgeGroup,
    getDefaultFilters,
    getDefaultFormData,
    getDefaultImage,
    spectrumAPI, updateAnnotation
};