//步骤三的页面

import { Badge, Card, Divider, Input, Radio, Space } from 'antd';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useKeyboardNav } from '../context/KeyboardNavContext';

const StyledCard = styled(Card)`
  margin-bottom: 20px;
  ${props => props.active && `
    border: 2px solid #1890ff;
    box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
  `}
`;

const CategoryTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #1890ff;
`;

const SectionTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
`;

const KeyHint = styled.span`
  margin-left: 8px;
  color: #888;
  font-size: 12px;
`;

const ConfidenceAndNotes = ({ id, value, onChange }) => {
  const { activeStep, setActiveStep } = useKeyboardNav();
  const isActive = activeStep === 2;
  const specialNoteRef = useRef(null);

  const handleConfidenceChange = (e) => {
    onChange({ ...value, confidence: e.target.value });
  };


  const handleSpecialNoteChange = (e) => {
    onChange({ ...value, specialNote: e.target.value });
  };



  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;

      // 置信度快捷键
      if (e.key === '1') {
        onChange({ ...value, confidence: 'certain' });
        e.preventDefault();
      } else if (e.key === '2') {
        onChange({ ...value, confidence: 'uncertain' });
        e.preventDefault();
      } else if (e.key === '3') {
        onChange({ ...value, confidence: 'indeterminate' });
        e.preventDefault();
      }


      // Tab键处理
      if (e.key === 'Tab' && e.shiftKey) {
        // Shift+Tab 返回上一步
        if (document.activeElement === document.getElementById(id)) {
          setActiveStep(1);
          document.getElementById('step2').focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onChange, value, id, setActiveStep]);

  // 处理焦点
  const handleFocus = () => {
    setActiveStep(2);
  };

  return (
    <StyledCard
      id={id}
      title={
        <Badge dot={isActive} color="blue">
          步骤三：置信度与备注 <KeyHint>(E)</KeyHint>
        </Badge>
      }
      variant="outlined"
      active={isActive}
      tabIndex={0}
      onFocus={handleFocus}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <CategoryTitle>标注置信度：</CategoryTitle>
          <Radio.Group value={value.confidence} onChange={handleConfidenceChange}>
            <Space direction="vertical">
              <Radio value="certain">确定 - 特征明确 <KeyHint>(1)</KeyHint></Radio>
              <Radio value="uncertain">不确定 - 存在疑问 <KeyHint>(2)</KeyHint></Radio>
              <Radio value="indeterminate">无法判断 - 难以结论 <KeyHint>(3)</KeyHint></Radio>
            </Space>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div>
          <CategoryTitle>特殊情况说明：</CategoryTitle>
          <Input.TextArea
            rows={2}
            value={value.specialNote}
            onChange={handleSpecialNoteChange}
            placeholder="请输入特殊情况说明"
            ref={specialNoteRef}
          />
        </div>
      </Space>
    </StyledCard>
  );
};

export default ConfidenceAndNotes;