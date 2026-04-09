import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button, Table, Tag, message, Input } from 'antd';
import { useSpectrumData } from '../context/SpectrumDataContext';
import CauseClassification from './CauseClassification';
import ImageViewer from './ImageViewer';
import QualityAssessment from './QualityAssessment';
import { getAgentAnalysis } from '../services/AgentService';
import { getAnalysis, saveAnalysis } from '../services/analysisService';

const { TextArea } = Input;

const CONTENT_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1180px;
  margin: 0 auto;
  padding: 2px 6px 4px;
  gap: 4px;
  overflow: hidden;
`;

const TopSection = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
`;

const ImageViewerCard = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const BottomSection = styled.div`
  display: flex;
  gap: 6px;
  align-items: stretch;
  overflow: hidden;
`;

const StepCard = styled.div`
  flex: 1;
  min-width: 0;
  border: 1px solid ${(props) => (props.$hasError ? '#ff4d4f' : '#f0f0f0')};
  border-radius: 8px;
  padding: 6px 8px;
  background: ${(props) => (props.$hasError ? '#fff2f0' : '#fff')};
  transition: all 0.3s ease;
  overflow: hidden;
`;

const CompactStepContent = styled.div`
  overflow: hidden;
`;

const AnalysisSection = styled.div`
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
`;

const SectionTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #222;
  line-height: 1.3;
  flex-shrink: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const RefreshInfo = styled.div`
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.3;
`;

const KeyboardHintBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 8px 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
`;

const KeyboardHintLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const KeyboardHintRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const KeyboardModeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.$active ? '#1677ff' : '#8c8c8c')};
  background: ${(props) => (props.$active ? '#e6f4ff' : '#f5f5f5')};
  border: 1px solid ${(props) => (props.$active ? '#91caff' : '#d9d9d9')};
`;

const KeyboardHintText = styled.div`
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
`;

const BasicInfoBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
`;

const BasicInfoItem = styled.div`
  padding: 6px 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  font-size: 13px;
  color: #444;
  line-height: 1.4;
`;

const BasicInfoLabel = styled.span`
  color: #1677ff;
  font-weight: 600;
  margin-right: 4px;
`;

const TopInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.95fr;
  gap: 10px;
  margin-bottom: 10px;
`;

const RightInfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InfoCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
`;

const InfoCardTitle = styled.div`
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.3;
`;

const InfoCardBody = styled.div`
  padding: 8px 10px;
  font-size: 13px;
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const TableCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.3;
`;

const OtherDesc = styled.div`
  margin-top: 8px;
  padding: 0 10px 10px;
  font-size: 13px;
  color: #444;
  line-height: 1.6;
`;

const EmptyText = styled.span`
  color: #bfbfbf;
`;

const StyledInput = styled(Input)`
  border-radius: 6px;

  &.ant-input {
    font-size: 13px;
    padding: 6px 10px;
  }
`;

const StyledTextArea = styled(TextArea)`
  border-radius: 6px;

  &.ant-input {
    font-size: 13px;
    line-height: 1.6;
    padding: 6px 10px;
  }
`;

const ShortcutTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  margin-right: 8px;
  border-radius: 999px;
  background: ${(props) => (props.$active ? '#1677ff' : '#f0f0f0')};
  color: ${(props) => (props.$active ? '#fff' : '#595959')};
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  transition: all 0.2s ease;
`;

const MetricNameWrap = styled.div`
  display: flex;
  align-items: center;
`;

const KeyboardCellBox = styled.div`
  position: relative;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid
    ${(props) =>
      props.$open ? '#1677ff' : props.$active ? '#91caff' : 'transparent'};
  background: ${(props) =>
    props.$open ? '#f0f8ff' : props.$active ? '#fafcff' : 'transparent'};
  transition: all 0.2s ease;
  cursor: pointer;
`;

const KeyboardValueText = styled.div`
  min-height: 20px;
  font-size: 13px;
  color: #262626;
  line-height: 1.5;
  word-break: break-all;
`;

const MultiValueTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const KeyboardDropdown = styled.div`
  margin-top: 8px;
  padding: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  max-height: 230px;
  overflow-y: auto;
`;

const KeyboardOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  background: ${(props) =>
    props.$active ? '#e6f4ff' : props.$selected ? '#f6ffed' : 'transparent'};
  border: 1px solid
    ${(props) =>
      props.$active ? '#91caff' : props.$selected ? '#b7eb8f' : 'transparent'};
  color: #262626;
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;

  &:not(:last-child) {
    margin-bottom: 4px;
  }
`;

const KeyboardOptionMark = styled.span`
  color: ${(props) => (props.$selected ? '#52c41a' : '#bfbfbf')};
  font-weight: 600;
  flex-shrink: 0;
`;

const CompactTableWrap = styled.div`
  .ant-table {
    font-size: 13px;
  }

  .ant-table-thead > tr > th {
    padding: 7px 9px !important;
    font-size: 13px;
    line-height: 1.3;
  }

  .ant-table-tbody > tr > td {
    padding: 7px 9px !important;
    line-height: 1.4;
    vertical-align: top;
  }

  .ant-tag {
    margin-inline-end: 0;
    font-size: 12px;
    padding-inline: 8px;
    line-height: 20px;
  }

  .ant-input,
  .ant-select-selector {
    font-size: 13px !important;
    min-height: 32px !important;
  }

  .analysis-keyboard-row-active > td {
    background: #f7fbff !important;
  }
`;

const EMPTY_ANALYSIS_DATA = {
  refreshTime: '-',
  originalDiagnosis: '-',
  vesselDiagnosisDesc: '-',
  primaryDiagnosis: '-',
  summaryTable: [],
  compareTable: [],
  otherMark: '-',
  otherAnalysis: '-',
};

const ANALYSIS_FIELD_OPTIONS = {
  velocity_status: [
    { label: '增高', value: '增高' },
    { label: '减低', value: '减低' },
    { label: '稍微增高', value: '稍微增高' },
    { label: '稍微减低', value: '稍微减低' },
    { label: '正常', value: '正常' },
    { label: '无', value: '无' },
    { label: '明显增高', value: '明显增高' },
    { label: '明显减低', value: '明显减低' },
  ],
  velocity_reference: [
    { label: '无', value: '无' },
    { label: 'LMCA', value: 'LMCA' },
    { label: 'RMCA', value: 'RMCA' },
    { label: 'LACA', value: 'LACA' },
    { label: 'RACA', value: 'RACA' },
    { label: 'LPCA', value: 'LPCA' },
    { label: 'RPCA', value: 'RPCA' },
    { label: 'LVA', value: 'LVA' },
    { label: 'RVA', value: 'RVA' },
    { label: 'BA', value: 'BA' },
    { label: '前循环', value: '前循环' },
    { label: '后循环', value: '后循环' },
  ],
  envelope_status: [
    { label: '正常', value: '正常' },
    { label: '峰时延迟', value: '峰时延迟' },
    { label: '圆钝', value: '圆钝' },
    { label: '高阻', value: '高阻' },
    { label: '无', value: '无' },
  ],
  spectrum_disorder: [
    { label: '无', value: '无' },
    { label: '频窗充填', value: '频窗充填' },
    { label: '频窗消失', value: '频窗消失' },
    { label: '涡流', value: '涡流' },
    { label: '湍流', value: '湍流' },
    { label: '短弧线', value: '短弧线' },
    { label: '鸥鸣音', value: '鸥鸣音' },
  ],
  direction_status: [
    { label: '无', value: '无' },
    { label: '逆向', value: '逆向' },
  ],
  pi_status: [
    { label: '正常', value: '正常' },
    { label: '偏高', value: '偏高' },
    { label: '偏低', value: '偏低' },
  ],
  bruit_status: [
    { label: '无', value: '无' },
    { label: '有', value: '有' },
  ],
  stenosis_flag: [
    { label: '是', value: '是' },
    { label: '否', value: '否' },
    { label: '不确定', value: '不确定' },
  ],
  stenosis: [
    { label: '无', value: '无' },
    { label: '轻度', value: '轻度' },
    { label: '中度', value: '中度' },
    { label: '重度', value: '重度' },
    { label: '轻-中度', value: '轻-中度' },
    { label: '中-重度', value: '中-重度' },
  ],
  analysisFlag: [
    { label: '1', value: 1 },
    { label: '0', value: 0 },
  ],
};

const MULTI_VALUE_FIELDS = new Set(['spectrum_disorder']);

const getCurrentTime = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const toDisplayText = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  return String(val);
};

const normalizeFieldValue = (field, value) => {
  if (value === null || value === undefined || value === '') {
    if (field === 'pi_status') return '正常';
    if (field === 'velocity_reference') return '无';
    if (field === 'direction_status') return '无';
    if (field === 'bruit_status') return '无';
    return '';
  }

  if (field === 'stenosis_flag') {
    if (value === 1 || value === '1' || value === true) return '是';
    if (value === 0 || value === '0' || value === false) return '否';
    return String(value);
  }

  if (field === 'analysisFlag') {
    if (value === '1' || value === 1 || value === true) return 1;
    return 0;
  }

  return value;
};

const splitMultiValue = (value) => {
  if (!value) return [];
  return String(value)
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeDisorderList = (text) => {
  if (!text) return [];
  return String(text)
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const hasDisorder = (disorderText, keywords = []) => {
  const list = normalizeDisorderList(disorderText);
  return keywords.some((k) => list.includes(k) || String(disorderText).includes(k));
};

const hasAnyText = (value, keywords = []) => {
  const text = String(value ?? '').trim();
  if (!text || text === '-' || text === '无') return false;
  return keywords.some((keyword) => text.includes(keyword));
};

const hasMeaningfulText = (value) => {
  const text = String(value ?? '').trim();
  return text !== '' && text !== '-' && text !== '无';
};

const pickValue = (agentVal, dbVal, defaultValue = '-') => {
  if (agentVal !== null && agentVal !== undefined && agentVal !== '') return agentVal;
  if (dbVal !== null && dbVal !== undefined && dbVal !== '') return dbVal;
  return defaultValue;
};

const normalizeAgentResult = (raw) => {
  if (!raw) return null;

  const data = raw?.data?.data || raw?.data || raw;

  return {
    patient_exam: data.patient_exam ?? data.originalDiagnosis ?? data.original_diagnosis ?? '',
    velocity_exam: data.velocity_exam ?? data.vesselDiagnosisDesc ?? data.vessel_diagnosis_desc ?? '',
    velocity_status: data.velocity_status ?? data.velocityStatus ?? '',
    velocity_reference: data.velocity_reference ?? data.velocityReference ?? '',
    stenosis_descri:
      data.stenosis_descri ??
      data.velocity_diagnose ??
      data.velocityDiagnose ??
      data.primaryDiagnosis ??
      '',
    envelope_status: data.envelope_status ?? data.envelopeStatus ?? '',
    spectrum_disorder: data.spectrum_disorder ?? data.spectrumDisorder ?? '',
    direction_status: data.direction_status ?? data.directionStatus ?? '',
    pi_status: data.pi_status ?? data.piStatus ?? '',
    bruit_status: data.bruit_status ?? data.bruitStatus ?? '',
    stenosis_flag: data.stenosis_flag ?? data.stenosisFlag ?? '',
    stenosis: data.stenosis ?? '',
    analysisFlag: data.analysisFlag ?? data.analysis_flag ?? 1,
    other_desc: data.other_desc ?? data.otherDesc ?? '',
  };
};

const mergeAnalysisData = (dbData, agentData) => {
  if (!dbData && !agentData) return null;
  if (!dbData) return { ...agentData };
  if (!agentData) return { ...dbData };

  return {
    ...dbData,
    patient_exam: pickValue(agentData?.patient_exam, dbData?.patient_exam, ''),
    velocity_exam: pickValue(agentData?.velocity_exam, dbData?.velocity_exam, ''),
    velocity_status: pickValue(agentData?.velocity_status, dbData?.velocity_status, ''),
    velocity_reference: pickValue(agentData?.velocity_reference, dbData?.velocity_reference, ''),
    stenosis_descri: pickValue(agentData?.stenosis_descri, dbData?.stenosis_descri, ''),
    envelope_status: pickValue(agentData?.envelope_status, dbData?.envelope_status, ''),
    spectrum_disorder: pickValue(agentData?.spectrum_disorder, dbData?.spectrum_disorder, ''),
    direction_status: pickValue(agentData?.direction_status, dbData?.direction_status, ''),
    pi_status: pickValue(agentData?.pi_status, dbData?.pi_status, ''),
    bruit_status: pickValue(agentData?.bruit_status, dbData?.bruit_status, ''),
    stenosis_flag: pickValue(agentData?.stenosis_flag, dbData?.stenosis_flag, ''),
    stenosis: pickValue(agentData?.stenosis, dbData?.stenosis, ''),
    analysisFlag: pickValue(agentData?.analysisFlag, dbData?.analysisFlag, 1),
    other_desc: pickValue(agentData?.other_desc, dbData?.other_desc, ''),
  };
};

const buildCompareTable = (dbData, formData) => {
  const disorderText = dbData?.spectrum_disorder || '';
  const envelopeText = dbData?.envelope_status || '';
  const directionText = dbData?.direction_status || '';
  const piText = dbData?.pi_status || '';
  const otherDescText = dbData?.other_desc || '';

  const markMap = {
    peak_delay: formData?.peak_delay,
    round_blunt: formData?.round_blunt,
    high_resistance: formData?.high_resistance,
    low_resistance: formData?.low_resistance,
    steal_blood: formData?.steal_blood,
    vortex: formData?.vortex,
    turbulence: formData?.turbulence,
    window_filling: formData?.window_filling,
    other: formData?.other,
  };

  const analysisMap = {
    peak_delay: hasAnyText(envelopeText, ['峰时延迟']),
    round_blunt: hasAnyText(envelopeText, ['圆钝']),
    high_resistance:
      hasAnyText(envelopeText, ['高阻']) ||
      hasAnyText(piText, ['偏高']),
    low_resistance:
      hasAnyText(envelopeText, ['低阻']) ||
      hasAnyText(piText, ['偏低']),
    steal_blood:
      hasAnyText(directionText, ['逆向']) ||
      hasDisorder(disorderText, ['窃血']),
    vortex: hasDisorder(disorderText, ['涡流']),
    turbulence: hasDisorder(disorderText, ['湍流']),
    window_filling: hasDisorder(disorderText, ['频窗充填', '频窗填充', '频窗消失']),
    other:
      hasDisorder(disorderText, ['其他', '短弧线', '鸥鸣音']) ||
      hasMeaningfulText(otherDescText),
  };

  const getMarkText = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      value === false ||
      value === 0 ||
      value === '0'
    ) {
      return '-';
    }

    if (typeof value === 'number') return `${value}`;
    if (typeof value === 'string') return value;
    return '-';
  };

  const hasMarkValue = (value) => {
    return !(
      value === null ||
      value === undefined ||
      value === '' ||
      value === false ||
      value === 0 ||
      value === '0'
    );
  };

  const getConsistency = (markValue, analysisMatched) => {
    const hasMark = hasMarkValue(markValue);
    const hasAnalysis = analysisMatched === true;
    return hasMark === hasAnalysis ? '一致' : '不一致';
  };

  const makeRow = (key, item, markValue, analysisMatched) => ({
    key,
    item,
    markResult: getMarkText(markValue),
    analysisResult: analysisMatched ? '√' : '-',
    consistency: getConsistency(markValue, analysisMatched),
  });

  return [
    makeRow('1', '峰时延迟频谱', markMap.peak_delay, analysisMap.peak_delay),
    makeRow('2', '圆钝频谱', markMap.round_blunt, analysisMap.round_blunt),
    makeRow('3', '高阻力频谱', markMap.high_resistance, analysisMap.high_resistance),
    makeRow('4', '低阻力频谱', markMap.low_resistance, analysisMap.low_resistance),
    makeRow('5', '窃血频谱', markMap.steal_blood, analysisMap.steal_blood),
    makeRow('6', '涡流频谱', markMap.vortex, analysisMap.vortex),
    makeRow('7', '湍流频谱', markMap.turbulence, analysisMap.turbulence),
    makeRow('8', '频窗填充', markMap.window_filling, analysisMap.window_filling),
    makeRow('9', '其他异常情况', markMap.other, analysisMap.other),
  ];
};

const mapDbAnalysisToPageData = (dbData, formData) => {
  if (!dbData) return EMPTY_ANALYSIS_DATA;

  return {
    refreshTime: new Date().toLocaleTimeString(),
    originalDiagnosis: toDisplayText(dbData?.patient_exam),
    vesselDiagnosisDesc: toDisplayText(dbData?.velocity_exam),
    primaryDiagnosis: toDisplayText(dbData?.stenosis_descri),
    summaryTable: [
      { key: '1', item: '血流速度情况', result: toDisplayText(dbData?.velocity_status), field: 'velocity_status' },
      { key: '2', item: '参照血管', result: toDisplayText(dbData?.velocity_reference), field: 'velocity_reference' },
      { key: '3', item: '包络情况', result: toDisplayText(dbData?.envelope_status), field: 'envelope_status' },
      { key: '4', item: '频谱紊乱情况', result: toDisplayText(dbData?.spectrum_disorder), field: 'spectrum_disorder' },
      { key: '5', item: '血流方向', result: toDisplayText(dbData?.direction_status), field: 'direction_status' },
      { key: '6', item: 'PI情况', result: toDisplayText(dbData?.pi_status), field: 'pi_status' },
      { key: '7', item: '杂音情况', result: toDisplayText(dbData?.bruit_status), field: 'bruit_status' },
      { key: '8', item: '是否狭窄', result: toDisplayText(dbData?.stenosis_flag), field: 'stenosis_flag' },
      { key: '9', item: '狭窄程度', result: toDisplayText(dbData?.stenosis), field: 'stenosis' },
      { key: '10', item: '当前血管是否有诊断', result: toDisplayText(dbData?.analysisFlag), field: 'analysisFlag' },
    ],
    compareTable: buildCompareTable(dbData, formData),
    otherMark: toDisplayText(formData?.other_desc || formData?.cause_description),
    otherAnalysis: toDisplayText(dbData?.other_desc),
  };
};

const isEditableTarget = (target) => {
  if (!target) return false;

  const tagName = target.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (
    target.closest('.ant-input') ||
    target.closest('.ant-input-affix-wrapper') ||
    target.closest('.ant-select') ||
    target.closest('.ant-select-dropdown') ||
    target.closest('.ant-picker') ||
    target.closest('.ant-modal')
  ) {
    return true;
  }

  return false;
};

const AnnotationPage = () => {
  const {
    spectrums,
    formData,
    handleFormChange,
    handleSubmit: originalHandleSubmit,
    handleNext,
    handlePrev,
    currentIndex,
    currentImage,
    currentPageType,
    PAGE_TYPES,
  } = useSpectrumData();

  const [validationErrors, setValidationErrors] = useState({});
  const [analysisDbData, setAnalysisDbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [keyboardEditMode, setKeyboardEditMode] = useState(false);
  const [keyboardLevel, setKeyboardLevel] = useState('field');
  const [selectedSummaryIndex, setSelectedSummaryIndex] = useState(0);
  const [activeDropdownField, setActiveDropdownField] = useState(null);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  const analysisData = useMemo(() => {
    return mapDbAnalysisToPageData(analysisDbData, formData);
  }, [analysisDbData, formData]);

  const keyboardSummaryRows = useMemo(() => {
    return analysisData.summaryTable.map((row, index) => ({
      ...row,
      shortcutKey: CONTENT_SHORTCUT_KEYS[index] || '',
    }));
  }, [analysisData.summaryTable]);

  const currentKeyboardRow =
    keyboardSummaryRows[selectedSummaryIndex] || keyboardSummaryRows[0] || null;

  const currentKeyboardField = currentKeyboardRow?.field || null;

  const currentKeyboardOptions = useMemo(() => {
    if (!currentKeyboardField) return [];
    return ANALYSIS_FIELD_OPTIONS[currentKeyboardField] || [];
  }, [currentKeyboardField]);

  const displaySpectrumId = currentImage?.id || '-';
  const displayVesselName =
    analysisDbData?.velocity ||
    currentImage?.vessel ||
    currentImage?.snpVessel ||
    '-';

  const displayCheckStatus =
    analysisDbData?.check_tag === null ||
    analysisDbData?.check_tag === undefined ||
    analysisDbData?.check_tag === 0 ||
    analysisDbData?.check_tag === '0'
      ? '未检查'
      : analysisDbData?.check_tag === 1 || analysisDbData?.check_tag === '1'
        ? '已检查'
        : '未检查';

  const resetKeyboardState = () => {
    setKeyboardEditMode(false);
    setKeyboardLevel('field');
    setSelectedSummaryIndex(0);
    setActiveDropdownField(null);
    setActiveOptionIndex(0);
  };

  const validateForm = () => {
    const errors = {};

    if (
      formData.noise_level === null ||
      formData.noise_level === undefined ||
      formData.envelope_quality === null ||
      formData.envelope_quality === undefined ||
      formData.laminar_flow_status === null ||
      formData.laminar_flow_status === undefined
    ) {
      errors.quality = '请选择频谱质量评估';
    }

    if (
      (formData.normal_spectrum === 0 && formData.abnormal_spectrum === 0) ||
      (formData.normal_spectrum == null && formData.abnormal_spectrum == null)
    ) {
      errors.causes = '请至少选择一个病因分类';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitWithValidation = async (userId) => {
    if (currentPageType === PAGE_TYPES.ANNOTATION) {
      if (!validateForm()) {
        console.log('请完成标注再保存');
        return;
      }
    }

    if (originalHandleSubmit) {
      await originalHandleSubmit(userId);
    }
  };

  const fetchAnalysisData = async () => {
    if (!currentImage?.id) {
      setAnalysisDbData(null);
      return;
    }

    try {
      setLoading(true);
      const res = await getAnalysis(currentImage.id);
      const dbData = res?.data?.data || res?.data || res;
      setAnalysisDbData(dbData || null);
    } catch (error) {
      console.error('获取数据库分析结果失败：', error);
      message.error('获取分析结果失败');
      setAnalysisDbData(null);
    } finally {
      setLoading(false);
    }
  };

  const showPageData = () => {
    console.log('当前页面的formdata为：', formData);
    console.log('当前页面的analysisDbData：', analysisDbData);
  };

  const handleAnalysisFieldChange = (field, value) => {
    setAnalysisDbData((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const handleSaveCurrentAnalysis = async () => {
    if (!currentImage?.id) {
      message.warning('当前没有可保存的频谱图');
      return;
    }

    if (!analysisDbData) {
      message.warning('当前没有可保存的分析结果');
      return;
    }

    const savePayload = {
      pId: analysisDbData.pId,
      velocity: analysisDbData.velocity,
      patient_exam: analysisDbData.patient_exam ?? '',
      velocity_exam: analysisDbData.velocity_exam ?? '',
      velocity_status: analysisDbData.velocity_status ?? '',
      stenosis_descri: analysisDbData.stenosis_descri ?? '',
      velocity_reference: analysisDbData.velocity_reference ?? '无',
      envelope_status: analysisDbData.envelope_status ?? '',
      spectrum_disorder: analysisDbData.spectrum_disorder ?? '无',
      direction_status: analysisDbData.direction_status ?? '无',
      pi_status: analysisDbData.pi_status ?? '正常',
      bruit_status: analysisDbData.bruit_status ?? '无',
      stenosis_flag: analysisDbData.stenosis_flag ?? '不确定',
      stenosis: analysisDbData.stenosis ?? '无',
      analysisFlag: analysisDbData.analysisFlag ?? 1,
      analysis_at: getCurrentTime(),
      check_tag: '1',
      other_desc: analysisDbData.other_desc ?? '',
    };

    try {
      setSaving(true);
      await saveAnalysis(currentImage.id, savePayload);

      setAnalysisDbData((prev) => ({
        ...(prev || {}),
        ...savePayload,
        check_tag: 1,
      }));

      message.success('当前分析结果已保存到数据库');
    } catch (error) {
      console.error('保存分析结果失败：', error);
      message.error('保存分析结果失败');
    } finally {
      setSaving(false);
    }
  };

  const agentAnalysis = async () => {
    try {
      if (!analysisDbData) {
        message.warning('请先加载数据库分析结果');
        return;
      }

      if (!currentImage?.id) {
        message.warning('当前没有频谱图ID');
        return;
      }

      setAgentLoading(true);

      const analysisRet = await getAgentAnalysis(
        analysisDbData?.velocity || analysisDbData?.velocity_exam || '',
        analysisDbData?.patient_exam || ''
      );

      const normalizedAgentData = normalizeAgentResult(analysisRet);

      setAnalysisDbData((prev) => {
        const merged = mergeAnalysisData(prev, normalizedAgentData);
        return merged;
      });

      message.success('大模型分析结果已更新到当前页面');
    } catch (error) {
      console.error('获取大模型分析结果失败：', error);
      message.error('获取大模型分析结果失败');
    } finally {
      setAgentLoading(false);
    }
  };

  const findInitialOptionIndex = (field) => {
    const options = ANALYSIS_FIELD_OPTIONS[field] || [];
    if (!options.length) return 0;

    const currentValue = normalizeFieldValue(field, analysisDbData?.[field]);

    if (MULTI_VALUE_FIELDS.has(field)) {
      const selectedValues = splitMultiValue(currentValue);
      const firstMatchedIndex = options.findIndex((opt) =>
        selectedValues.includes(String(opt.value)) || selectedValues.includes(String(opt.label))
      );
      return firstMatchedIndex >= 0 ? firstMatchedIndex : 0;
    }

    const matchedIndex = options.findIndex(
      (opt) => String(opt.value) === String(currentValue)
    );
    return matchedIndex >= 0 ? matchedIndex : 0;
  };

  const enterKeyboardEditMode = () => {
    if (!keyboardSummaryRows.length) return;
    setKeyboardEditMode(true);
    setKeyboardLevel('field');
    setActiveDropdownField(null);
    setSelectedSummaryIndex((prev) => {
      if (prev >= 0 && prev < keyboardSummaryRows.length) return prev;
      return 0;
    });
    setActiveOptionIndex(0);
  };

  const openCurrentFieldOptions = () => {
    if (!currentKeyboardField) return;
    const options = ANALYSIS_FIELD_OPTIONS[currentKeyboardField] || [];
    if (!options.length) return;

    setKeyboardLevel('option');
    setActiveDropdownField(currentKeyboardField);
    setActiveOptionIndex(findInitialOptionIndex(currentKeyboardField));
  };

  const backFromKeyboardLevel = () => {
    if (!keyboardEditMode) return;

    if (keyboardLevel === 'option') {
      setKeyboardLevel('field');
      setActiveDropdownField(null);
      return;
    }

    resetKeyboardState();
  };

  const moveSelectedField = (direction) => {
    if (!keyboardSummaryRows.length) return;

    setSelectedSummaryIndex((prev) => {
      const total = keyboardSummaryRows.length;
      return (prev + direction + total) % total;
    });

    setKeyboardLevel('field');
    setActiveDropdownField(null);
  };

  const moveSelectedOption = (direction) => {
    if (!currentKeyboardOptions.length) return;

    setActiveOptionIndex((prev) => {
      const total = currentKeyboardOptions.length;
      return (prev + direction + total) % total;
    });
  };

  const toggleMultiFieldValue = (field, optionValue) => {
    const currentList = splitMultiValue(analysisDbData?.[field]);
    const nextList = currentList.includes(String(optionValue))
      ? currentList.filter((item) => item !== String(optionValue))
      : [...currentList, String(optionValue)];

    handleAnalysisFieldChange(field, nextList.join('，'));
  };

  const confirmCurrentOption = () => {
    if (!currentKeyboardField || !currentKeyboardOptions.length) return;

    const option = currentKeyboardOptions[activeOptionIndex];
    if (!option) return;

    if (MULTI_VALUE_FIELDS.has(currentKeyboardField)) {
      toggleMultiFieldValue(currentKeyboardField, option.value);
      return;
    }

    handleAnalysisFieldChange(currentKeyboardField, option.value);
  };

  const handleSummaryRowClick = (rowIndex, field) => {
    if (!keyboardEditMode) return;

    setSelectedSummaryIndex(rowIndex);

    if (keyboardLevel === 'option' && activeDropdownField !== field) {
      setKeyboardLevel('field');
      setActiveDropdownField(null);
    }
  };

  const renderFieldDisplayValue = (field, rawValue) => {
    const currentValue = normalizeFieldValue(field, rawValue);

    if (MULTI_VALUE_FIELDS.has(field)) {
      const values = splitMultiValue(currentValue);

      if (!values.length) {
        return <EmptyText>-</EmptyText>;
      }

      return (
        <MultiValueTags>
          {values.map((item) => (
            <Tag key={item} color="blue">
              {item}
            </Tag>
          ))}
        </MultiValueTags>
      );
    }

    const text = toDisplayText(currentValue);
    return text === '-' ? <EmptyText>-</EmptyText> : text;
  };

  useEffect(() => {
    if (currentPageType === PAGE_TYPES.ANNOTATION) {
      validateForm();
    }
  }, [formData, currentPageType, PAGE_TYPES.ANNOTATION]);

  useEffect(() => {
    if (currentPageType === PAGE_TYPES.AGENT) {
      fetchAnalysisData();
    }
  }, [currentImage?.id, currentPageType, PAGE_TYPES.AGENT]);

  useEffect(() => {
    resetKeyboardState();
  }, [currentImage?.id, currentPageType]);

  useEffect(() => {
    if (selectedSummaryIndex > keyboardSummaryRows.length - 1) {
      setSelectedSummaryIndex(0);
    }
  }, [keyboardSummaryRows.length, selectedSummaryIndex]);

  useEffect(() => {
    if (keyboardLevel === 'option' && activeDropdownField !== currentKeyboardField) {
      setKeyboardLevel('field');
      setActiveDropdownField(null);
    }
  }, [currentKeyboardField, keyboardLevel, activeDropdownField]);

  useEffect(() => {
    if (currentPageType !== PAGE_TYPES.AGENT) return;

    const onKeyDown = async (e) => {
      const typing = isEditableTarget(e.target);

      if (!keyboardEditMode) {
        if ((e.key === 'e' || e.key === 'E') && !typing) {
          e.preventDefault();
          enterKeyboardEditMode();
          return;
        }

        if (e.key === 'Enter' && !typing) {
          e.preventDefault();
          await handleSaveCurrentAnalysis();
        }

        return;
      }

      if (typing) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        backFromKeyboardLevel();
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();

        if (keyboardLevel === 'field') {
          openCurrentFieldOptions();
        }

        return;
      }

      if (keyboardLevel === 'field') {
        if (CONTENT_SHORTCUT_KEYS.includes(e.key)) {
          const shortcutIndex = e.key === '0' ? 9 : Number(e.key) - 1;
          if (shortcutIndex >= 0 && shortcutIndex < keyboardSummaryRows.length) {
            e.preventDefault();
            setSelectedSummaryIndex(shortcutIndex);
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveSelectedField(-1);
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveSelectedField(1);
          return;
        }
      }

      if (keyboardLevel === 'option') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveSelectedOption(-1);
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveSelectedOption(1);
          return;
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          confirmCurrentOption();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    currentPageType,
    PAGE_TYPES.AGENT,
    keyboardEditMode,
    keyboardLevel,
    keyboardSummaryRows.length,
    currentKeyboardField,
    currentKeyboardOptions,
    activeOptionIndex,
    analysisDbData,
  ]);

  const summaryColumns = [
    {
      title: '指标',
      dataIndex: 'item',
      key: 'item',
      width: '42%',
      render: (_, record, index) => {
        const rowActive = keyboardEditMode && index === selectedSummaryIndex;
        return (
          <MetricNameWrap>
            <ShortcutTag $active={rowActive}>{record.shortcutKey}</ShortcutTag>
            <span>{record.item}</span>
          </MetricNameWrap>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (_, record, index) => {
        const field = record?.field;
        const rowActive = keyboardEditMode && index === selectedSummaryIndex;
        const dropdownOpen =
          rowActive &&
          keyboardEditMode &&
          keyboardLevel === 'option' &&
          activeDropdownField === field;

        const options = ANALYSIS_FIELD_OPTIONS[field] || [];
        const selectedValues = splitMultiValue(analysisDbData?.[field]);

        return (
          <KeyboardCellBox
            $active={rowActive}
            $open={dropdownOpen}
            onClick={() => handleSummaryRowClick(index, field)}
          >
            <KeyboardValueText>
              {renderFieldDisplayValue(field, analysisDbData?.[field])}
            </KeyboardValueText>

            {dropdownOpen && options.length > 0 && (
              <KeyboardDropdown>
                {options.map((option, optIndex) => {
                  const singleSelected =
                    String(normalizeFieldValue(field, analysisDbData?.[field])) ===
                    String(option.value);

                  const multiSelected =
                    selectedValues.includes(String(option.value)) ||
                    selectedValues.includes(String(option.label));

                  const selected = MULTI_VALUE_FIELDS.has(field)
                    ? multiSelected
                    : singleSelected;

                  return (
                    <KeyboardOption
                      key={`${field}-${option.value}`}
                      $active={optIndex === activeOptionIndex}
                      $selected={selected}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveOptionIndex(optIndex);

                        if (MULTI_VALUE_FIELDS.has(field)) {
                          toggleMultiFieldValue(field, option.value);
                        } else {
                          handleAnalysisFieldChange(field, option.value);
                        }
                      }}
                    >
                      <span>{option.label}</span>
                      <KeyboardOptionMark $selected={selected}>
                        {selected ? '√' : ''}
                      </KeyboardOptionMark>
                    </KeyboardOption>
                  );
                })}
              </KeyboardDropdown>
            )}
          </KeyboardCellBox>
        );
      },
    },
  ];

  const compareColumns = [
    {
      title: '项目',
      dataIndex: 'item',
      key: 'item',
      width: '28%',
    },
    {
      title: '标注结果',
      dataIndex: 'markResult',
      key: 'markResult',
      width: '24%',
      render: (text) => {
        return text === '-' ? <EmptyText>-</EmptyText> : text;
      },
    },
    {
      title: '归纳分析异常',
      dataIndex: 'analysisResult',
      key: 'analysisResult',
      width: '18%',
      render: (text) => {
        if (text === '√') {
          return <Tag color="blue">√</Tag>;
        }
        return text === '-' ? <EmptyText>-</EmptyText> : text;
      },
    },
    {
      title: '是否一致',
      dataIndex: 'consistency',
      key: 'consistency',
      width: '20%',
      render: (text) => {
        if (text === '一致') {
          return <Tag color="success">一致</Tag>;
        }
        if (text === '不一致') {
          return <Tag color="error">不一致</Tag>;
        }
        return <EmptyText>-</EmptyText>;
      },
    },
  ];

  return (
    <ContentWrapper>
      {currentPageType === PAGE_TYPES.AGENT && (
        <AnalysisSection>
          <SectionHeader>
            <SectionTitle>诊断结果与分析</SectionTitle>

            <HeaderRight>
              <RefreshInfo>
                最近更新: {analysisDbData?.analysis_at || '-'}
              </RefreshInfo>

              <Button size="middle" onClick={agentAnalysis} loading={agentLoading}>
                刷新分析结果
              </Button>

              <Button
                size="middle"
                type="primary"
                onClick={handleSaveCurrentAnalysis}
                loading={saving}
              >
                保存当前分析结果
              </Button>

              {/* <Button size="middle" loading={loading} onClick={showPageData}>
                当前页面的表格数据
              </Button> */}
            </HeaderRight>
          </SectionHeader>

          <KeyboardHintBar>
            <KeyboardHintLeft>
              <KeyboardModeBadge $active={keyboardEditMode}>
                {keyboardEditMode
                  ? keyboardLevel === 'field'
                    ? '编辑模式：指标选择'
                    : '编辑模式：内容选择'
                  : '非编辑模式'}
              </KeyboardModeBadge>

              <KeyboardHintText>
                当前指标：
                <strong>
                  {currentKeyboardRow ? ` ${currentKeyboardRow.shortcutKey} - ${currentKeyboardRow.item}` : ' -'}
                </strong>
              </KeyboardHintText>
            </KeyboardHintLeft>

            <KeyboardHintRight>
              <KeyboardHintText>E：进入编辑 / 展开当前指标</KeyboardHintText>
              <KeyboardHintText>数字键：选择指标</KeyboardHintText>
              <KeyboardHintText>↑ ↓：选择选项</KeyboardHintText>
              <KeyboardHintText>Enter：确认</KeyboardHintText>
              <KeyboardHintText>R：返回 / 退出编辑</KeyboardHintText>
              <KeyboardHintText>非编辑模式 Enter：保存当前分析结果</KeyboardHintText>
            </KeyboardHintRight>
          </KeyboardHintBar>

          <BasicInfoBar>
            <BasicInfoItem>
              <BasicInfoLabel>频谱图ID：</BasicInfoLabel>
              <span>{displaySpectrumId}</span>
            </BasicInfoItem>

            <BasicInfoItem>
              <BasicInfoLabel>血管名称：</BasicInfoLabel>
              <span>{displayVesselName}</span>
              <span
                style={{
                  marginLeft: 8,
                  color: displayCheckStatus === '已检查' ? '#52c41a' : '#fa8c16',
                  fontWeight: 500,
                }}
              >
                （{displayCheckStatus}）
              </span>
            </BasicInfoItem>
          </BasicInfoBar>

          <TopInfoGrid>
            <InfoCard>
              <InfoCardTitle>原始诊断结果</InfoCardTitle>
              <InfoCardBody>
                <StyledTextArea
                  autoSize={{ minRows: 2, maxRows: 20 }}
                  value={analysisDbData?.patient_exam ?? ''}
                  readOnly
                  bordered={false}
                  style={{
                    resize: 'none',
                    cursor: 'default',
                    background: '#fff',
                    color: 'rgba(0, 0, 0, 0.88)',
                  }}
                />
              </InfoCardBody>
            </InfoCard>

            <RightInfoColumn>
              <InfoCard>
                <InfoCardTitle>血管级诊断特征描述</InfoCardTitle>
                <InfoCardBody>
                  <StyledTextArea
                    autoSize={{ minRows: 2, maxRows: 3 }}
                    value={analysisDbData?.velocity_exam ?? ''}
                    onChange={(e) =>
                      handleAnalysisFieldChange('velocity_exam', e.target.value)
                    }
                    placeholder="请输入血管级诊断特征描述"
                  />
                </InfoCardBody>
              </InfoCard>

              <InfoCard>
                <InfoCardTitle>初步狭窄程度诊断结果</InfoCardTitle>
                <InfoCardBody>
                  <StyledInput
                    value={analysisDbData?.stenosis_descri ?? ''}
                    onChange={(e) =>
                      handleAnalysisFieldChange('stenosis_descri', e.target.value)
                    }
                    placeholder="请输入初步狭窄程度诊断结果"
                  />
                </InfoCardBody>
              </InfoCard>
            </RightInfoColumn>
          </TopInfoGrid>

          <BottomGrid>
            <InfoCard>
              <TableCardHeader>
                <span>归纳分析结果</span>
              </TableCardHeader>
              <CompactTableWrap>
                <Table
                  columns={summaryColumns}
                  dataSource={keyboardSummaryRows}
                  pagination={false}
                  size="small"
                  bordered={false}
                  rowKey="key"
                  rowClassName={(_, index) =>
                    keyboardEditMode && index === selectedSummaryIndex
                      ? 'analysis-keyboard-row-active'
                      : ''
                  }
                />
              </CompactTableWrap>
            </InfoCard>

            <InfoCard>
              <TableCardHeader>
                <span>标注与诊断结果对比</span>
              </TableCardHeader>
              <CompactTableWrap>
                <Table
                  columns={compareColumns}
                  dataSource={analysisData.compareTable}
                  pagination={false}
                  size="small"
                  bordered={false}
                  rowKey="key"
                />
              </CompactTableWrap>

              <OtherDesc>
                <div style={{ marginBottom: 6 }}>
                  <strong>其他异常情况说明：</strong>
                </div>
                <div style={{ marginBottom: 6 }}>标注：{analysisData.otherMark || '-'}</div>
                <div>
                  归纳分析：
                  <StyledTextArea
                    style={{ marginTop: 6 }}
                    autoSize={{ minRows: 1, maxRows: 2 }}
                    value={analysisDbData?.other_desc ?? ''}
                    onChange={(e) =>
                      handleAnalysisFieldChange('other_desc', e.target.value)
                    }
                    placeholder="请输入归纳分析中的 Other 说明"
                  />
                </div>
              </OtherDesc>
            </InfoCard>
          </BottomGrid>
        </AnalysisSection>
      )}

      <TopSection>
        <ImageViewerCard>
          <ImageViewer
            image={currentImage}
            onNext={handleNext}
            onPrev={handlePrev}
            onSave={handleSubmitWithValidation}
            currentIndex={currentIndex}
            totalCount={spectrums.length}
            pageType={currentPageType}
          />
        </ImageViewerCard>
      </TopSection>

      {currentPageType === PAGE_TYPES.ANNOTATION && (
        <BottomSection>
          <StepCard $hasError={!!validationErrors.quality}>
            <CompactStepContent>
              <QualityAssessment
                id="step1"
                value={{
                  noise_level: formData.noise_level,
                  envelope_quality: formData.envelope_quality,
                  laminar_flow_status: formData.laminar_flow_status,
                  spectrum_quality_remark: formData.spectrum_quality_remark,
                }}
                onChange={(data) => handleFormChange('quality', data)}
                error={validationErrors.quality}
              />
            </CompactStepContent>
          </StepCard>

          <StepCard $hasError={!!validationErrors.causes || !!validationErrors.otherCause}>
            <CompactStepContent>
              <CauseClassification
                id="step2"
                value={{
                  normal_spectrum: formData.normal_spectrum,
                  abnormal_spectrum: formData.abnormal_spectrum,
                  peak_delay: formData.peak_delay,
                  round_blunt: formData.round_blunt,
                  high_resistance: formData.high_resistance,
                  low_resistance: formData.low_resistance,
                  steal_blood: formData.steal_blood,
                  vortex: formData.vortex,
                  turbulence: formData.turbulence,
                  window_filling: formData.window_filling,
                  other: formData.other,
                  other_cause: formData.other_cause,
                  cause_description: formData.cause_description,
                }}
                onChange={(data) => handleFormChange('causes', data)}
                error={validationErrors.causes}
                otherCauseError={validationErrors.otherCause}
              />
            </CompactStepContent>
          </StepCard>
        </BottomSection>
      )}
    </ContentWrapper>
  );
};

export default AnnotationPage;