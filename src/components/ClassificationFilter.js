import {
  CheckOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Card, Checkbox, Divider, Modal, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

const { Option } = Select;

const FilterTriggerWrap = styled.div`
  display: flex;
  justify-content: center;
  margin: 8px 0 12px;
`;

const FilterModalContent = styled.div`
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
`;

const FilterCard = styled(Card)`
  margin-bottom: 0;
  border-radius: 10px;

  .ant-card-head {
    background: #fafafa;
    padding: 0 12px;
    min-height: 40px;

    .ant-card-head-title {
      font-size: 14px;
      font-weight: bold;
      padding: 8px 0;
    }
  }

  .ant-card-body {
    padding: 14px 14px 12px;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: #1890ff;
  font-size: 13px;
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const CountWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 12px;
`;

const InlineHint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: #999;
`;

const ClassificationFilter = ({
  filters,
  onChange,
  onReset,
  filterConfig = {},
  showActions = true,
  buttonText = '高级筛选',
}) => {
  const [internalFilters, setInternalFilters] = useState(filters || {});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setInternalFilters(filters || {});
  }, [filters]);

  const defaultFilterConfig = {
    vessels: [
      { value: 'mca', label: '大脑中动脉(MCA)' },
      { value: 'aca', label: '大脑前动脉(ACA)' },
      { value: 'pca', label: '大脑后动脉(PCA)' },
      { value: 'va', label: '椎动脉(VA)' },
      { value: 'ba', label: '基底动脉(BA)' },
    ],

    ageGroups: [
      { value: 'child', label: '儿童(0-12岁)' },
      { value: 'teen', label: '青少年(13-18岁)' },
      { value: 'adult', label: '成人(19-59岁)' },
      { value: 'elder', label: '老年(60岁以上)' },
    ],

    genders: [
      { value: 'male', label: '男性' },
      { value: 'female', label: '女性' },
    ],

    annotationStatus: [
      { value: 1, label: '未标注' },
      { value: 2, label: '已标注' },
      { value: 3, label: '已审核' },
      { value: 4, label: '有争议' },
    ],

    analysisCheckStatus: [
      { value: 1, label: '已检查' },
      { value: 0, label: '未检查' },
    ],

    stenosis_flag: [
      { value: '是', label: '是' },
      { value: '否', label: '否' },
      { value: '疑似是', label: '疑似是' },
    ],

    stenosis_degree: [
      { value: '轻度', label: '轻度' },
      { value: '轻中度', label: '轻中度' },
      { value: '中度', label: '中度' },
      { value: '中重度', label: '中重度' },
      { value: '重度', label: '重度' },
      { value: '无明确程度', label: '无明确程度' },
    ],

    causeFields: [
      { key: 'peak_delay', label: '峰时延迟频谱' },
      { key: 'round_blunt', label: '圆钝频谱' },
      { key: 'high_resistance', label: '高阻力频谱' },
      { key: 'low_resistance', label: '低阻力频谱' },
      { key: 'steal_blood', label: '窃血频谱' },
      { key: 'vortex', label: '涡流频谱' },
      { key: 'turbulence', label: '湍流频谱' },
      { key: 'other', label: '其他异常情况' },
      { key: 'normal_spectrum', label: '正常频谱' },
    ],

    noise_level: [
      { value: 4, label: '1级 - 无噪音，背景干净，基线平稳' },
      { value: 3, label: '2级 - 轻微噪音，少量杂波' },
      { value: 2, label: '3级 - 中度噪音，杂波部分遮挡频谱' },
      { value: 1, label: '4级 - 重度噪音，几乎无信号' },
    ],

    envelope_quality: [
      { value: 4, label: '1级 - 完美包络，完美贴合' },
      { value: 3, label: '2级 - 良好包络，局部轻微偏移' },
      { value: 2, label: '3级 - 一般包络，多处偏移或断裂' },
      { value: 1, label: '4级 - 差包络，无法判断' },
    ],

    laminar_flow_status: [
      { value: 4, label: '1级 - 标准层流，窄带、频窗完整' },
      { value: 3, label: '2级 - 轻度非层流，频窗略宽，层流结构基本存在' },
      { value: 2, label: '3级 - 中度非层流，频窗部分填充，层流结构受损' },
      { value: 1, label: '4级 - 明显非层流，频谱增宽，频窗消失，形态不规则' },
    ],

    hasOtherDescription: [
      { value: 1, label: '有其他说明' },
      { value: 0, label: '无其他说明' },
    ],
  };

  const config = { ...defaultFilterConfig, ...filterConfig };

  const normalizeArrayField = (value) => {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === '') return [];
    return [value];
  };

  const normalizedFilters = useMemo(() => {
    const next = { ...internalFilters };

    Object.keys(next).forEach((key) => {
      next[key] = normalizeArrayField(next[key]);
    });

    return next;
  }, [internalFilters]);

  const selectedCauseValues = useMemo(() => {
    return config.causeFields
      .filter(
        (item) =>
          Array.isArray(normalizedFilters[item.key]) &&
          normalizedFilters[item.key].length > 0
      )
      .map((item) => item.key);
  }, [normalizedFilters, config.causeFields]);

  const isOnlyUnannotated = () => {
    const status = normalizedFilters.annotationStatus || [];
    return status.length === 1 && status.includes(1);
  };

  const handleInternalFilterChange = (filterType, value) => {
    const nextValue = Array.isArray(value) ? value : normalizeArrayField(value);

    const newFilters = {
      ...normalizedFilters,
      [filterType]: nextValue,
    };

    if (filterType === 'annotationStatus') {
      const isNowUnannotated = nextValue.length === 1 && nextValue.includes(1);

      if (isNowUnannotated) {
        config.causeFields.forEach((item) => {
          newFilters[item.key] = [];
        });

        // 只隐藏并清空频谱质量/形态相关筛选
        // 是否狭窄、狭窄程度不再清空，保持始终可筛选
        newFilters.noise_level = [];
        newFilters.envelope_quality = [];
        newFilters.laminar_flow_status = [];
        newFilters.hasOtherDescription = [];
      }
    }

    setInternalFilters(newFilters);
  };

  const handleCauseSelectChange = (selectedKeys) => {
    const newFilters = { ...normalizedFilters };

    config.causeFields.forEach((item) => {
      newFilters[item.key] = selectedKeys.includes(item.key) ? [1] : [];
    });

    setInternalFilters(newFilters);
  };

  const handleApply = () => {
    onChange?.(normalizedFilters);
    setVisible(false);
  };

  const handleReset = () => {
    const resetFilters = {};

    Object.keys(normalizedFilters).forEach((key) => {
      resetFilters[key] = [];
    });

    resetFilters.vessels = [];
    resetFilters.ageGroups = [];
    resetFilters.genders = [];
    resetFilters.annotationStatus = [];
    resetFilters.analysisCheckStatus = [];

    resetFilters.stenosis_flag = [];
    resetFilters.stenosis_degree = [];

    resetFilters.noise_level = [];
    resetFilters.envelope_quality = [];
    resetFilters.laminar_flow_status = [];
    resetFilters.hasOtherDescription = [];

    config.causeFields.forEach((item) => {
      resetFilters[item.key] = [];
    });

    setInternalFilters(resetFilters);
    onReset?.(resetFilters);
  };

  const renderSelectFilter = (type, title, options, mode = 'multiple') => (
    <FilterSection>
      <SectionTitle>{title}</SectionTitle>
      <Select
        mode={mode}
        placeholder={`选择${title}`}
        value={normalizedFilters[type] || []}
        onChange={(value) => handleInternalFilterChange(type, value)}
        style={{ width: '100%' }}
        allowClear
        showSearch
        optionFilterProp="children"
        size="small"
        maxTagCount="responsive"
      >
        {options.map((option) => (
          <Option key={String(option.value)} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </FilterSection>
  );

  const renderCauseSelectFilter = () => (
    <FilterSection>
      <SectionTitle>频谱形态</SectionTitle>
      <Select
        mode="multiple"
        placeholder="选择频谱形态"
        value={selectedCauseValues}
        onChange={handleCauseSelectChange}
        style={{ width: '100%' }}
        allowClear
        showSearch
        optionFilterProp="children"
        size="small"
        maxTagCount="responsive"
      >
        {config.causeFields.map((item) => (
          <Option key={item.key} value={item.key}>
            {item.label}
          </Option>
        ))}
      </Select>
    </FilterSection>
  );

  const renderCheckboxFilter = (type, title, options) => (
    <FilterSection>
      <SectionTitle>{title}</SectionTitle>
      <Checkbox.Group
        value={normalizedFilters[type] || []}
        onChange={(value) => handleInternalFilterChange(type, value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size={4}>
          {options.map((option) => (
            <Checkbox
              key={String(option.value)}
              value={option.value}
              style={{ fontSize: '12px' }}
            >
              {option.label}
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
    </FilterSection>
  );

  const selectedCount = Object.entries(normalizedFilters).reduce((sum, [, arr]) => {
    return sum + (Array.isArray(arr) ? arr.length : 0);
  }, 0);

  const showSpectrumFilters = !isOnlyUnannotated();

  return (
    <>
      <FilterTriggerWrap>
        <Button
          type="default"
          icon={<FilterOutlined />}
          onClick={() => setVisible(true)}
        >
          {buttonText}
          {selectedCount > 0 ? `（${selectedCount}）` : ''}
        </Button>
      </FilterTriggerWrap>

      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        centered
        destroyOnHidden={false}
        width={720}
        title={null}
      >
        <FilterModalContent>
          <FilterCard
            title={
              <span>
                <FilterOutlined /> 高级筛选
              </span>
            }
            size="small"
          >
            <Space direction="vertical" style={{ width: '100%' }} size={0}>
              {renderSelectFilter('vessels', '血管分类', config.vessels)}
              {renderCheckboxFilter('ageGroups', '年龄分组', config.ageGroups)}
              {renderCheckboxFilter('genders', '性别', config.genders)}

              <Divider style={{ margin: '8px 0' }} />

              {renderCheckboxFilter(
                'annotationStatus',
                '标注状态',
                config.annotationStatus
              )}

              {renderCheckboxFilter(
                'analysisCheckStatus',
                '是否检查分析结果',
                config.analysisCheckStatus
              )}

              <Divider style={{ margin: '8px 0' }} />

              {renderCheckboxFilter(
                'stenosis_flag',
                '是否狭窄',
                config.stenosis_flag
              )}

              {renderSelectFilter(
                'stenosis_degree',
                '狭窄程度',
                config.stenosis_degree
              )}

              {isOnlyUnannotated() && (
                <InlineHint>
                  当前仅筛选“未标注”，已自动隐藏频谱形态、噪音等级、包络线质量、层流状态等标注质量相关筛选项。
                </InlineHint>
              )}

              {showSpectrumFilters && (
                <>
                  <Divider style={{ margin: '8px 0' }} />

                  {renderCauseSelectFilter()}

                  {renderSelectFilter(
                    'noise_level',
                    '噪音等级',
                    config.noise_level
                  )}

                  {renderSelectFilter(
                    'envelope_quality',
                    '包络线质量',
                    config.envelope_quality
                  )}

                  {renderSelectFilter(
                    'laminar_flow_status',
                    '层流状态',
                    config.laminar_flow_status
                  )}

                  <Divider style={{ margin: '8px 0' }} />
                </>
              )}

              {showActions && (
                <FilterActions>
                  <ActionButtons>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                    >
                      重置
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={handleApply}
                    >
                      应用
                    </Button>
                  </ActionButtons>

                  <CountWrap>
                    {selectedCount > 0 && <Tag color="blue">{selectedCount}</Tag>}
                    <span>已选 {selectedCount} 项</span>
                  </CountWrap>
                </FilterActions>
              )}
            </Space>
          </FilterCard>
        </FilterModalContent>
      </Modal>
    </>
  );
};

export default ClassificationFilter;