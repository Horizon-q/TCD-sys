import { Badge, Card, Checkbox, Input, Radio } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const SectionTitle = styled.div`
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #1677ff;
  line-height: 1.3;
`;

const SectionBlock = styled.div`
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldBlock = styled.div`
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid ${props => (props.$highlight ? '#1677ff' : 'transparent')};
  background: ${props => (props.$highlight ? '#f0f7ff' : 'transparent')};
  transition: all 0.2s ease;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 14px;
`;

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 32px;
`;

const LeftPart = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;

  .ant-checkbox-wrapper {
    font-size: 14px !important;
    line-height: 1.35 !important;
  }
`;

const RightPart = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const StyledRadioGroup = styled(Radio.Group)`
  display: flex;
  gap: 4px;

  .ant-radio-button-wrapper {
    border-radius: 6px !important;
    margin-inline-start: 0 !important;
    min-width: 46px;
    height: 28px !important;
    line-height: 26px !important;
    text-align: center;
    padding: 0 8px;
    font-size: 13px;
  }

  .ant-radio-button-wrapper::before {
    display: none !important;
  }
`;

const OtherInputWrap = styled.div`
  margin-top: 6px;
  padding-left: 22px;

  .ant-input {
    height: 32px !important;
    font-size: 14px !important;
  }
`;

const KeyHint = styled.span`
  margin-left: 6px;
  color: #888;
  font-size: 12px;
`;

const displayOptions = [
  { level: 1, label: '1' },
  { level: 2, label: '2' },
  { level: 3, label: '3' },
];

const normalizeStoredValue = (val) => {
  const num = Number(val);
  if ([1, 2, 3].includes(num)) return num;
  return 0;
};

const FIELD_KEYS = [
  'normal_spectrum',
  'abnormal_spectrum',
  'peak_delay',
  'round_blunt',
  'high_resistance',
  'low_resistance',
  'steal_blood',
  'vortex',
  'turbulence',
  'other_cause',
];

const CauseClassification = ({ id, value, onChange }) => {
  const { activeStep, setActiveStep } = useKeyboardNav();
  const isActive = activeStep === 1;
  const otherInputRef = useRef(null);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

  const safeValue = useMemo(() => {
    const raw = value && typeof value === 'object' ? value : {};

    return {
      normal_spectrum: normalizeStoredValue(raw.normal_spectrum),
      abnormal_spectrum: normalizeStoredValue(raw.abnormal_spectrum),

      peak_delay: normalizeStoredValue(raw.peak_delay),
      round_blunt: normalizeStoredValue(raw.round_blunt),
      high_resistance: normalizeStoredValue(raw.high_resistance),
      low_resistance: normalizeStoredValue(raw.low_resistance),
      steal_blood: normalizeStoredValue(raw.steal_blood),

      vortex: normalizeStoredValue(raw.vortex),
      turbulence: normalizeStoredValue(raw.turbulence),

      other_cause: normalizeStoredValue(raw.other_cause),
      cause_description:
        typeof raw.cause_description === 'string' ? raw.cause_description : '',
    };
  }, [value]);

  const updateValue = (patch) => {
    onChange?.({
      ...safeValue,
      ...patch,
    });
  };

  const clearAbnormalFields = () => ({
    peak_delay: 0,
    round_blunt: 0,
    high_resistance: 0,
    low_resistance: 0,
    steal_blood: 0,
    vortex: 0,
    turbulence: 0,
    other_cause: 0,
    cause_description: '',
  });

  const getVisibleFieldKeys = () => {
    const baseFields = ['normal_spectrum', 'abnormal_spectrum'];

    if (safeValue.abnormal_spectrum > 0) {
      return [
        ...baseFields,
        'peak_delay',
        'round_blunt',
        'high_resistance',
        'low_resistance',
        'steal_blood',
        'vortex',
        'turbulence',
        'other_cause',
      ];
    }

    return baseFields;
  };

  const visibleFieldKeys = getVisibleFieldKeys();

  useEffect(() => {
    if (!visibleFieldKeys.includes(FIELD_KEYS[activeFieldIndex])) {
      setActiveFieldIndex(0);
    }
  }, [safeValue.abnormal_spectrum, activeFieldIndex, visibleFieldKeys]);

  const isFieldActive = (field) => {
    return isActive && visibleFieldKeys[activeFieldIndex] === field;
  };

  const toggleSpectrumField = (field) => {
    const current = safeValue[field];

    if (field === 'normal_spectrum') {
      if (current > 0) {
        updateValue({
          normal_spectrum: 0,
        });
      } else {
        updateValue({
          normal_spectrum: 3,
          abnormal_spectrum: 0,
          ...clearAbnormalFields(),
        });
      }
      return;
    }

    if (field === 'abnormal_spectrum') {
      if (current > 0) {
        updateValue({
          abnormal_spectrum: 0,
          ...clearAbnormalFields(),
        });
      } else {
        updateValue({
          normal_spectrum: 0,
          abnormal_spectrum: 3,
        });
      }
    }
  };

  const setSpectrumConfidence = (field, level) => {
    const current = safeValue[field];
    const nextValue = current === level ? 0 : level;

    if (field === 'normal_spectrum') {
      if (nextValue === 0) {
        updateValue({
          normal_spectrum: 0,
        });
      } else {
        updateValue({
          normal_spectrum: nextValue,
          abnormal_spectrum: 0,
          ...clearAbnormalFields(),
        });
      }
      return;
    }

    if (field === 'abnormal_spectrum') {
      if (nextValue === 0) {
        updateValue({
          abnormal_spectrum: 0,
          ...clearAbnormalFields(),
        });
      } else {
        updateValue({
          normal_spectrum: 0,
          abnormal_spectrum: nextValue,
        });
      }
    }
  };

  const toggleField = (field) => {
    const current = safeValue[field];

    updateValue({
      [field]: current > 0 ? 0 : 3,
    });
  };

  const setFieldConfidence = (field, level) => {
    const current = safeValue[field];
    const nextValue = current === level ? 0 : level;

    const patch = {
      [field]: nextValue,
    };

    if (field === 'other_cause' && nextValue === 0) {
      patch.cause_description = '';
    }

    updateValue(patch);
  };

  const toggleOther = (e) => {
    const checked = e?.target?.checked;

    updateValue({
      other_cause: checked ? 3 : 0,
      cause_description: checked ? safeValue.cause_description : '',
    });
  };

  const applyNumberToCurrentField = (key) => {
    const level = Number(key);
    if (![1, 2, 3].includes(level)) return;

    const currentField = visibleFieldKeys[activeFieldIndex];
    if (!currentField) return;

    if (currentField === 'normal_spectrum' || currentField === 'abnormal_spectrum') {
      setSpectrumConfidence(currentField, level);
      return;
    }

    setFieldConfidence(currentField, level);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;

      const target = e.target;
      const isTypingElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingElement) {
        return;
      }

      if (e.key === 'ArrowUp') {
        setActiveFieldIndex((prev) => Math.max(0, prev - 1));
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowDown') {
        setActiveFieldIndex((prev) => Math.min(visibleFieldKeys.length - 1, prev + 1));
        e.preventDefault();
        return;
      }

      if (['1', '2', '3'].includes(e.key)) {
        applyNumberToCurrentField(e.key);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, activeFieldIndex, visibleFieldKeys, safeValue]);

  const handleFocus = () => {
    setActiveStep?.(1);
  };

  const renderConfidenceRadios = (field) => {
    if (safeValue[field] <= 0) return null;

    return (
      <RightPart>
        <StyledRadioGroup
          value={safeValue[field]}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          {displayOptions.map((item) => (
            <Radio.Button
              key={item.level}
              value={item.level}
              onClick={() => setFieldConfidence(field, item.level)}
            >
              {item.label}
            </Radio.Button>
          ))}
        </StyledRadioGroup>
      </RightPart>
    );
  };

  const renderSpectrumConfidenceRadios = (field) => {
    if (safeValue[field] <= 0) return null;

    return (
      <RightPart>
        <StyledRadioGroup
          value={safeValue[field]}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          {displayOptions.map((item) => (
            <Radio.Button
              key={item.level}
              value={item.level}
              onClick={() => setSpectrumConfidence(field, item.level)}
            >
              {item.label}
            </Radio.Button>
          ))}
        </StyledRadioGroup>
      </RightPart>
    );
  };

  return (
    <StyledCard
      id={id}
      title={
        <Badge dot={isActive} color="blue">
          步骤二：病因分类
          <KeyHint>(↑/↓ 选择项目，1/2/3 选择置信度；重复选择可取消)</KeyHint>
        </Badge>
      }
      variant="outlined"
      active={isActive}
      tabIndex={0}
      onFocus={handleFocus}
    >
      <SectionBlock>
        <SectionTitle>频谱情况</SectionTitle>

        <OptionGrid>
          <FieldBlock $highlight={isFieldActive('normal_spectrum')}>
            <OptionRow>
              <LeftPart>
                <Checkbox
                  checked={safeValue.normal_spectrum > 0}
                  onChange={() => toggleSpectrumField('normal_spectrum')}
                >
                  正常频谱
                </Checkbox>
              </LeftPart>
              {renderSpectrumConfidenceRadios('normal_spectrum')}
            </OptionRow>
          </FieldBlock>

          <FieldBlock $highlight={isFieldActive('abnormal_spectrum')}>
            <OptionRow>
              <LeftPart>
                <Checkbox
                  checked={safeValue.abnormal_spectrum > 0}
                  onChange={() => toggleSpectrumField('abnormal_spectrum')}
                >
                  异常频谱
                </Checkbox>
              </LeftPart>
              {renderSpectrumConfidenceRadios('abnormal_spectrum')}
            </OptionRow>
          </FieldBlock>
        </OptionGrid>
      </SectionBlock>

      {safeValue.abnormal_spectrum > 0 && (
        <>
          <SectionBlock>
            <SectionTitle>包络异常</SectionTitle>

            <OptionGrid>
              <FieldBlock $highlight={isFieldActive('peak_delay')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.peak_delay > 0} onChange={() => toggleField('peak_delay')}>
                      峰时延迟
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('peak_delay')}
                </OptionRow>
              </FieldBlock>

              <FieldBlock $highlight={isFieldActive('round_blunt')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.round_blunt > 0} onChange={() => toggleField('round_blunt')}>
                      圆钝
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('round_blunt')}
                </OptionRow>
              </FieldBlock>

              <FieldBlock $highlight={isFieldActive('high_resistance')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.high_resistance > 0} onChange={() => toggleField('high_resistance')}>
                      高阻力
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('high_resistance')}
                </OptionRow>
              </FieldBlock>

              <FieldBlock $highlight={isFieldActive('low_resistance')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.low_resistance > 0} onChange={() => toggleField('low_resistance')}>
                      低阻力
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('low_resistance')}
                </OptionRow>
              </FieldBlock>

              <FieldBlock $highlight={isFieldActive('steal_blood')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.steal_blood > 0} onChange={() => toggleField('steal_blood')}>
                      窃血
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('steal_blood')}
                </OptionRow>
              </FieldBlock>
            </OptionGrid>
          </SectionBlock>

          <SectionBlock>
            <SectionTitle>血流流动异常</SectionTitle>

            <OptionGrid>
              <FieldBlock $highlight={isFieldActive('vortex')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.vortex > 0} onChange={() => toggleField('vortex')}>
                      涡流
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('vortex')}
                </OptionRow>
              </FieldBlock>

              <FieldBlock $highlight={isFieldActive('turbulence')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.turbulence > 0} onChange={() => toggleField('turbulence')}>
                      湍流
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('turbulence')}
                </OptionRow>
              </FieldBlock>
            </OptionGrid>
          </SectionBlock>

          <SectionBlock>
            <SectionTitle>其他异常情况</SectionTitle>

            <OptionGrid>
              <FieldBlock $highlight={isFieldActive('other_cause')}>
                <OptionRow>
                  <LeftPart>
                    <Checkbox checked={safeValue.other_cause > 0} onChange={toggleOther}>
                      其他异常情况
                    </Checkbox>
                  </LeftPart>
                  {renderConfidenceRadios('other_cause')}
                </OptionRow>
              </FieldBlock>
            </OptionGrid>

            {safeValue.other_cause > 0 && (
              <OtherInputWrap>
                <Input
                  ref={otherInputRef}
                  placeholder="请输入具体的异常情况"
                  value={safeValue.cause_description}
                  onChange={(e) => updateValue({ cause_description: e.target.value })}
                />
              </OtherInputWrap>
            )}
          </SectionBlock>
        </>
      )}
    </StyledCard>
  );
};

export default CauseClassification;