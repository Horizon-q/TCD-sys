// components/SpectrumManager.jsx
//频谱图管理界面
import {
    Card,
    Empty,
    Image,
    Input,
    Layout,
    Pagination,
    Space,
    Spin,
    Tag
} from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useSpectrumData } from '../context/SpectrumDataContext';

const { Search } = Input;
const { Sider, Content } = Layout;

const ManagerContainer = styled.div`
  padding: 0;
`;

const HeaderSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
`;

const ContentSection = styled.div`
  display: flex;
  height: calc(100vh - 120px);
`;

const FilterSider = styled(Sider)`
  background: white;
  padding: 16px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
`;

const SpectrumContent = styled(Content)`
  padding: 0 20px;
  overflow-y: auto;
`;

const SpectrumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const SpectrumCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  } 
`;

const PatientInfo = styled.div`
  margin-top: 12px;
  font-size: 12px;
`;

const StatusTag = styled(Tag)`
  margin-top: 8px;
  font-size: 11px;
`;


// 工具函数
const utils = {
    // 血管名称映射
    // vesselMap: {
    //     mca: '大脑中动脉',
    //     aca: '大脑前动脉',
    //     pca: '大脑后动脉',
    //     va: '椎动脉',
    //     ba: '基底动脉',
    // },

    // 频谱形态名称映射
    spectrumTypeMap: {
        peak_delay: '峰时延迟',
        round_blunt: '圆钝',
        high_resistance: '高阻',
        low_resistance: '低阻',
        steal: '窃血',
        vortex: '涡流',
        turbulence: '湍流',
        normal: '正常',
        other: '其他'
    },
    confidenceMap: {
        "certain": '特征明确',
        "uncertain": '存在疑问',
        "indeterminate": '难以结论'
    },
    qualityMap: {
        "excellent": '特征清晰',
        'good': '特征基本可见',
        "poor": '判断困难',
        "invalid": ' 需重新采集',
    },


    getVesselName: (vessel) => vessel,

    getSpectrumTypeNames: (types) => types.map(type => utils.spectrumTypeMap[type]).join(', '),

    getSpectrumConfidence: (confidence) => utils.confidenceMap[confidence],

    getSpectrumQuality: (quality) => utils.qualityMap[quality],

    getStatusTag: (spectrum) => {
        const statusMap = [
            { color: 'red', text: '未标注' }, // unannotated
            { color: 'blue', text: '已标注' }, // annotated
            { color: 'orange', text: '有争议' }, // controversial
            { color: 'green', text: '已审核' },// reviewed
        ]

        const statusInfo = statusMap[spectrum.annotationStatus - 1];
        return <StatusTag color={statusInfo.color}>{statusInfo.text}</StatusTag>;
    },

    // 图片渲染函数
    renderImage: (spectrum) => {
        if (!spectrum.url?.trim()) {
            return (
                <div style={{
                    height: 180,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                }}>
                    无图片
                </div>
            );
        }

        return (
            <Image
                alt="频谱图"
                src={spectrum.url}
                height={180}
                style={{ objectFit: 'cover' }}
                preview={false}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                crossOrigin="anonymous"
            />
        );
    }
};

const SpectrumManager = ({ }) => {

    const [localSearchText, setLocalSearchText] = useState('');
    const { setCurrentPage, setCurrentPageType, spectrums, pagination, setCurrentImage, setCurrentIndex, setSearchText, loading, PAGE_TYPES } = useSpectrumData();


    const handleImageSelect = (image) => {
        console.log('点击了图片', image);
        // 计算全局索引：前面所有页的数据量 + 当前页的索引
        const globalIndex = (pagination.page - 1) * pagination.pageSize +
            spectrums.findIndex(s => s.id === image.id);

        console.log(`点击了图片，全局索引（从1开始），即第【${globalIndex + 1}】张图片`);

        // 注意初始化管理系统的页码
        setCurrentPage(1);
        // 切换页面
        setCurrentPageType(PAGE_TYPES.ANNOTATION);
        setCurrentIndex(globalIndex + 1);
        setCurrentImage(image);
    };

    // 执行搜索逻辑
    const handleSearch = (value) => {
        setSearchText(value);
    };
    return (
        <ManagerContainer>
            <HeaderSection>
                <Space>
                    <Search
                        placeholder="搜索患者ID或姓名"
                        value={localSearchText}
                        onChange={(e) => setLocalSearchText(e.target.value)} // 仅更新输入框状态，不执行搜索
                        onSearch={handleSearch} // 按回车键或点击搜索图标时触发
                        style={{ width: 300 }}
                    />
                </Space>
            </HeaderSection>

            <ContentSection>

                <SpectrumContent>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                                共找到 {pagination.total} 个频谱图
                            </div>

                            <SpectrumGrid>
                                {spectrums.map(spectrum => (
                                    <SpectrumCard
                                        key={spectrum.id}
                                        onClick={() => handleImageSelect(spectrum)}
                                        cover={utils.renderImage(spectrum)}
                                    >
                                        <PatientInfo>
                                            <div><strong>snpID:</strong> {spectrum.id}</div>
                                            <div><strong>patID:</strong> {spectrum.patientId}</div>
                                            <div><strong>姓名:</strong> {spectrum.patientName}</div>
                                            <div><strong>年龄:</strong> {spectrum.age}岁</div>
                                            <div><strong>性别:</strong> {spectrum.gender === 'male' ? '男性' : '女性'}</div>
                                            <div><strong>血管:</strong> {utils.getVesselName(spectrum.vessel)}</div>
                                            {/* <div><strong>部位:</strong> {spectrum.direction === 'U' ? '朝向探头' : '背离探头'}</div> */}
                                            {spectrum.confidence?.length > 0 && (
                                                <div><strong>标注置信度:</strong> {utils.getSpectrumConfidence(spectrum.confidence)}</div>
                                            )}

                                            {spectrum.causes?.length > 0 && (
                                                <div><strong>频谱形态:</strong> {utils.getSpectrumTypeNames(spectrum.causes)}</div>
                                            )}

                                            {spectrum.quality?.length > 0 && (
                                                <div><strong>频谱质量:</strong> {utils.getSpectrumQuality(spectrum.quality)}</div>
                                            )}
                                            {utils.getStatusTag(spectrum)}

                                        </PatientInfo>
                                    </SpectrumCard>
                                ))}
                            </SpectrumGrid>

                            {spectrums.length === 0 && (
                                <Empty description="未找到匹配的频谱图" />
                            )}

                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <Pagination
                                    current={pagination.page}
                                    total={pagination.total}
                                    pageSize={pagination.pageSize}
                                    onChange={setCurrentPage}
                                />
                            </div>
                        </>
                    )}
                </SpectrumContent>
            </ContentSection>
        </ManagerContainer>
    );
};

export default SpectrumManager;