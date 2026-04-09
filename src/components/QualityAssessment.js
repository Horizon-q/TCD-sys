import { Badge, Card, Input, Radio } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useKeyboardNav } from '../context/KeyboardNavContext';

const StyledCard = styled(Card)`
  margin-bottom: 0 !important;
  border-radius: 8px !important;

  ${props => props.active && `
    border: 2px solid #1890ff;
    box-shadow: 0 0 8px rgba(24, 144, 255, 0.22);
  `}

  .ant-card-head {
    min-height: 42px !important;
    padding: 0 12px !important;
  }

  .ant-card-head-title {
    padding: 8px 0 !important;
    font-size: 16px !important;
  }

  .ant-card-body {
    padding: 10px 12px !important;
  }
`;

const KeyHint = styled.span`
  margin-left: 6px;
  color: #888;
  font-size: 12px;
`;

const CategoryTitle = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
  color: #1890ff;
  font-size: 15px;
  line-height: 1.3;
`;

const SectionBlock = styled.div`
  margin-bottom: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid ${props => (props.$highlight ? '#1677ff' : 'transparent')};
  background: ${props => (props.$highlight ? '#f0f7ff' : 'transparent')};
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 14px;
`;

const OptionItem = styled.div`
  min-height: 30px;
  display: flex;
  align-items: flex-start;

  .ant-radio-wrapper {
    font-size: 14px !important;
    line-height: 1.35 !important;
    margin-inline-end: 0 !important;
  }

  .ant-radio {
    margin-top: 2px;
  }
`;

const CompactTextArea = styled(Input.TextArea)`
  font-size: 14px !important;
`;

const numberToLevelValue = {
  '1': '4',
  '2': '3',
  '3': '2',
  '4': '1',
};

const FIELD_INDEX = {
  NOISE: 0,
  ENVELOPE: 1,
  LAMINAR: 2,
  REMARK: 3,
};

const MAX_FIELD_INDEX = 3;

const QualityAssessment = ({ id, value, onChange }) => {
  const { activeStep, setActiveStep } = useKeyboardNav();
  const isActive = activeStep === 0;

  const [activeFieldIndex, setActiveFieldIndex] = useState(FIELD_INDEX.NOISE);
  const cardRef = useRef(null);
  const textAreaRef = useRef(null);

  const handleNoiseChange = (e) => {
    onChange({ ...value, noise_level: e.target.value });
  };

  const handleEnvelopeChange = (e) => {
    onChange({ ...value, envelope_quality: e.target.value });
  };

  const handleLaminarChange = (e) => {
    onChange({ ...value, laminar_flow_status: e.target.value });
  };

  const handleNoteChange = (e) => {
    onChange({ ...value, spectrum_quality_remark: e.target.value });
  };

  const selectByNumber = (key) => {
    const mappedValue = numberToLevelValue[key];
    if (!mappedValue) return;

    if (activeFieldIndex === FIELD_INDEX.NOISE) {
      onChange({ ...value, noise_level: mappedValue });
      return;
    }

    if (activeFieldIndex === FIELD_INDEX.ENVELOPE) {
      onChange({ ...value, envelope_quality: mappedValue });
      return;
    }

    if (activeFieldIndex === FIELD_INDEX.LAMINAR) {
      onChange({ ...value, laminar_flow_status: mappedValue });
      return;
    }

    // REMARK 分组不处理数字键
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;

      const target = e.target;
      const isTypingElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      // 正在输入备注时，不响应页面快捷键
      if (isTypingElement) {
        return;
      }

      if (e.key === 'ArrowUp') {
        setActiveFieldIndex((prev) => Math.max(0, prev - 1));
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        setActiveFieldIndex((prev) => Math.min(MAX_FIELD_INDEX, prev + 1));
        e.preventDefault();
        return;
      }

      if (['1', '2', '3', '4'].includes(e.key)) {
        selectByNumber(e.key);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, activeFieldIndex, value]);

  const handleFocus = () => {
    setActiveStep(0);
  };

  return (
    <StyledCard
      id={id}
      ref={cardRef}
      title={
        <Badge dot={isActive} color="blue">
          步骤一：质量评估
          <KeyHint>(↑/↓ 选择分组，1/2/3/4 选择选项)</KeyHint>
        </Badge>
      }
      variant="outlined"
      active={isActive}
      tabIndex={0}
      onFocus={handleFocus}
    >
      <SectionBlock $highlight={isActive && activeFieldIndex === FIELD_INDEX.NOISE}>
        <CategoryTitle>噪音等级</CategoryTitle>
        <Radio.Group
          value={value.noise_level}
          onChange={handleNoiseChange}
          style={{ width: '100%' }}
        >
          <OptionGrid>
            <OptionItem>
              <Radio value="4">无噪音，背景干净，基线平稳 <KeyHint>(1)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="3">轻微噪音，少量杂波 <KeyHint>(2)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="2">中度噪音，杂波部分遮挡频谱 <KeyHint>(3)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="1">重度噪音，几乎无信号 <KeyHint>(4)</KeyHint></Radio>
            </OptionItem>
          </OptionGrid>
        </Radio.Group>
      </SectionBlock>

      <SectionBlock $highlight={isActive && activeFieldIndex === FIELD_INDEX.ENVELOPE}>
        <CategoryTitle>包络线质量</CategoryTitle>
        <Radio.Group
          value={value.envelope_quality}
          onChange={handleEnvelopeChange}
          style={{ width: '100%' }}
        >
          <OptionGrid>
            <OptionItem>
              <Radio value="4">完美包络，完美贴合 <KeyHint>(1)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="3">良好包络，局部轻微偏移 <KeyHint>(2)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="2">一般包络，多处偏移或断裂 <KeyHint>(3)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="1">差包络，无法判断 <KeyHint>(4)</KeyHint></Radio>
            </OptionItem>
          </OptionGrid>
        </Radio.Group>
      </SectionBlock>

      <SectionBlock $highlight={isActive && activeFieldIndex === FIELD_INDEX.LAMINAR}>
        <CategoryTitle>层流状态</CategoryTitle>
        <Radio.Group
          value={value.laminar_flow_status}
          onChange={handleLaminarChange}
          style={{ width: '100%' }}
        >
          <OptionGrid>
            <OptionItem>
              <Radio value="4">标准层流，窄带、频窗完整 <KeyHint>(1)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="3">轻度非层流，频窗略宽 <KeyHint>(2)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="2">中度非层流，频窗部分填充 <KeyHint>(3)</KeyHint></Radio>
            </OptionItem>
            <OptionItem>
              <Radio value="1">明显非层流，频窗消失 <KeyHint>(4)</KeyHint></Radio>
            </OptionItem>
          </OptionGrid>
        </Radio.Group>
      </SectionBlock>

      <SectionBlock $highlight={isActive && activeFieldIndex === FIELD_INDEX.REMARK}>
        <CategoryTitle>质量备注</CategoryTitle>
        <CompactTextArea
          rows={2}
          value={value.spectrum_quality_remark}
          onChange={handleNoteChange}
          placeholder="请输入质量相关备注"
          ref={textAreaRef}
        />
      </SectionBlock>
    </StyledCard>
  );
};

export default QualityAssessment;