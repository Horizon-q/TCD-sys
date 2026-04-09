// components/AppSider.js
// 左侧目录栏
import { Button, InputNumber, Space, Tag, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useSpectrumData } from '../context/SpectrumDataContext';
import { getDefaultFilters } from '../services/spectrumService';
import ClassificationFilter from './ClassificationFilter';

const { Title } = Typography;

const SiderContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1890ff;
`;

const SiderHeader = styled.div`
  padding: 20px 20px 0;
`;

const SiderTitle = styled(Title)`
  color: white !important;
  margin-bottom: 20px !important;
  text-align: center;
`;

const SiderBody = styled.div`
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const NavigationSection = styled.div`
  margin-bottom: 20px;
  padding: 0 20px;
`;

const ProgressSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const PatientInfoSection = styled.div`
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const NavButton = styled(Button)`
  height: 50px;
  font-size: 16px;
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.3s ease;

  /* 默认状态 */
  &.ant-btn-default {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      color: white;
    }
  }

  /* 统一激活状态：绿色 */
  &.active {
    background: #52c41a !important;
    border-color: #52c41a !important;
    color: white !important;

    &:hover,
    &:focus {
      background: #73d13d !important;
      border-color: #73d13d !important;
      color: white !important;
    }
  }
`;

const StatusTag = styled(Tag)`
  margin-top: 8px;
  font-size: 11px;
`;

// 工具函数
const utils = {
  getStatusTag: (spectrum) => {
    const statusMap = [
      { color: 'red', text: '未标注' },
      { color: 'blue', text: '已标注' },
      { color: 'orange', text: '有争议' },
      { color: 'green', text: '已审核' },
    ];
    const statusInfo = statusMap[spectrum.annotationStatus - 1];
    return <StatusTag color={statusInfo.color}>{statusInfo.text}</StatusTag>;
  },
};

const AppSider = () => {
  const {
    setCurrentPage,
    PAGE_TYPES,
    currentPageType,
    setCurrentPageType,
    currentIndex,
    setCurrentIndex,
    currentImage,
    filters,
    setSearchText,
    setFilters,
    annotatedSize,
    setAnnotatedSize,
  } = useSpectrumData();

  const handleResetFilters = () => {
    setFilters(getDefaultFilters());
    setSearchText('');
    setCurrentIndex(1);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    console.log('处理筛选条件变化', newFilters);
    setFilters(newFilters);
    setCurrentIndex(1);
    setCurrentPage(1);
    setSearchText('');
  };

  return (
    <SiderContainer>
      <SiderHeader>
        <SiderTitle level={4}>经颅多普勒频谱图打标系统</SiderTitle>

        <NavigationSection>
          <Space direction="vertical" style={{ width: '100%' }}>
            <NavButton
              block
              size="large"
              className={currentPageType === PAGE_TYPES.ANNOTATION ? 'active' : ''}
              onClick={() => setCurrentPageType(PAGE_TYPES.ANNOTATION)}
              icon={<span>📝</span>}
            >
              频谱图标注
            </NavButton>

            <NavButton
              block
              size="large"
              className={currentPageType === PAGE_TYPES.AGENT ? 'active' : ''}
              onClick={() => setCurrentPageType(PAGE_TYPES.AGENT)}
              icon={<span>🤖</span>}
            >
              大模型分析
            </NavButton>

            <NavButton
              block
              size="large"
              className={currentPageType === PAGE_TYPES.MANAGEMENT ? 'active' : ''}
              onClick={() => setCurrentPageType(PAGE_TYPES.MANAGEMENT)}
              icon={<span>📊</span>}
            >
              频谱图管理
            </NavButton>
          </Space>
        </NavigationSection>
      </SiderHeader>

      <SiderBody>
        {/* 只在标注页面显示患者信息 */}
        {currentPageType === PAGE_TYPES.ANNOTATION && (
          <>
            {currentImage.id && (
              <PatientInfoSection>
                <h4 style={{ color: 'white', marginBottom: '12px' }}>患者信息</h4>
                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.5' }}>
                  <p style={{ margin: '4px 0' }}>
                    <strong>快照ID:</strong> {currentImage.id}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>患者ID:</strong> {currentImage.patientId}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>姓名:</strong> {currentImage.patientName}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>年龄:</strong> {currentImage.age}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>性别:</strong> {currentImage.gender === 'male' ? '男性' : '女性'}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>血管:</strong> {currentImage.vessel?.toUpperCase()}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>方向:</strong> {currentImage.direction === 'U' ? '朝向探头' : '背离探头'}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>标注状态:</strong> {utils.getStatusTag(currentImage)}
                  </p>
                </div>
              </PatientInfoSection>
            )}
          </>
        )}

        <ProgressSection>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4 style={{ color: 'white', margin: 0 }}>标注进度</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'white', fontSize: '12px' }}>数量:</span>
              <InputNumber
                size="small"
                value={annotatedSize}
                onChange={(value) => setAnnotatedSize(value || 10)}
                min={1}
                max={100000}
                style={{ width: 60 }}
                controls={false}
              />
              <Button
                size="small"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                }}
              >
                刷新
              </Button>
            </div>
          </div>

          <p style={{ color: 'white', margin: 0, fontSize: '14px' }}>
            {annotatedSize > 0 ? `当前: ${currentIndex} / ${annotatedSize}` : '无匹配图片'}
          </p>
        </ProgressSection>

        <ClassificationFilter
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          showActions={true}
        />
      </SiderBody>
    </SiderContainer>
  );
};

export default AppSider;