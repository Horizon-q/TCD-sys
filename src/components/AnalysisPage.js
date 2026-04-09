// components/AnnotationPage.js
// 大模型分析界面
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useSpectrumData } from '../context/SpectrumDataContext';
import { Button, Table, Tag, message } from 'antd';
import ImageViewer from './ImageViewer';
import { getAgentAnalysis } from '../services/AgentService';
import { getAnalysis } from '../services/analysisService';

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
`;

const TopSection = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const ImageViewerCard = styled.div`
  flex: 3;
`;

const ImageMetaBar = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MetaLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const MetaValue = styled.span`
  color: #1677ff;
  font-weight: 600;
`;

const BottomSection = styled.div`
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #222;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RefreshInfo = styled.div`
  font-size: 12px;
  color: #8c8c8c;
`;

const TopInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.95fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const RightInfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
`;

const InfoCardTitle = styled.div`
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const InfoCardBody = styled.div`
  padding: 14px;
  font-size: 14px;
  color: #444;
  line-height: 1.8;
  white-space: pre-wrap;
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const TableCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const OtherDesc = styled.div`
  margin-top: 14px;
  padding: 0 14px 14px;
  font-size: 14px;
  color: #444;
  line-height: 1.8;
`;

const EmptyText = styled.span`
  color: #bfbfbf;
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

const confidenceMap = {
  1: '置信度：1',
  4: '置信度：2',
  7: '置信度：3',
  10: '置信度：4',
};

const toYesNo = (val) => {
  if (val === 1 || val === '1' || val === true) return '是';
  if (val === 0 || val === '0' || val === false) return '否';
  return val ?? '-';
};

const toDisplayText = (val) => {
  if (val === null || val === undefined || val === '') return '-';
  return String(val);
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

// 取值时优先使用 agent 结果，其次使用 db 结果
const pickValue = (agentVal, dbVal, defaultValue = '-') => {
  if (agentVal !== null && agentVal !== undefined && agentVal !== '') return agentVal;
  if (dbVal !== null && dbVal !== undefined && dbVal !== '') return dbVal;
  return defaultValue;
};

// 兼容大模型返回字段名不一致的情况
const normalizeAgentResult = (raw) => {
  if (!raw) return null;

  const data = raw?.data?.data || raw?.data || raw;

  return {
    patient_exam: data.patient_exam ?? data.originalDiagnosis ?? data.original_diagnosis ?? '',
    velocity_exam: data.velocity_exam ?? data.vesselDiagnosisDesc ?? data.vessel_diagnosis_desc ?? '',
    velocity_status: data.velocity_status ?? data.velocityStatus ?? '',
    velocity_reference: data.velocity_reference ?? data.velocityReference ?? '',
    envelope_status: data.envelope_status ?? data.envelopeStatus ?? '',
    spectrum_disorder: data.spectrum_disorder ?? data.spectrumDisorder ?? '',
    direction_status: data.direction_status ?? data.directionStatus ?? '',
    pi_status: data.pi_status ?? data.piStatus ?? '',
    bruit_status: data.bruit_status ?? data.bruitStatus ?? '',
    stenosis_flag: data.stenosis_flag ?? data.stenosisFlag ?? '',
    stenosis: data.stenosis ?? data.primaryDiagnosis ?? '',
    analysisFlag: data.analysisFlag ?? data.analysis_flag ?? 1,
    other_desc: data.other_desc ?? data.otherDesc ?? '',
  };
};

const buildCompareTable = (dbData, formData, agentData) => {
  const disorderText = pickValue(
    agentData?.spectrum_disorder,
    dbData?.spectrum_disorder,
    ''
  );

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

  const getMarkText = (value) => {
    if (value === null || value === undefined || value === '' || value === false) return '-';
    if (typeof value === 'number') return confidenceMap[value] || `置信度：${value}`;
    if (typeof value === 'string') return confidenceMap[value] || value;
    return '-';
  };

  return [
    {
      key: '1',
      item: '峰时延迟频谱',
      markResult: getMarkText(markMap.peak_delay),
      analysisResult: hasDisorder(disorderText, ['峰时延迟']) ? '√' : '-',
    },
    {
      key: '2',
      item: '圆钝频谱',
      markResult: getMarkText(markMap.round_blunt),
      analysisResult: hasDisorder(disorderText, ['圆钝']) ? '√' : '-',
    },
    {
      key: '3',
      item: '高阻力频谱',
      markResult: getMarkText(markMap.high_resistance),
      analysisResult: hasDisorder(disorderText, ['高阻力']) ? '√' : '-',
    },
    {
      key: '4',
      item: '低阻力频谱',
      markResult: getMarkText(markMap.low_resistance),
      analysisResult: hasDisorder(disorderText, ['低阻力']) ? '√' : '-',
    },
    {
      key: '5',
      item: '窃血频谱',
      markResult: getMarkText(markMap.steal_blood),
      analysisResult: hasDisorder(disorderText, ['窃血']) ? '√' : '-',
    },
    {
      key: '6',
      item: '涡流频谱',
      markResult: getMarkText(markMap.vortex),
      analysisResult: hasDisorder(disorderText, ['涡流']) ? '√' : '-',
    },
    {
      key: '7',
      item: '湍流频谱',
      markResult: getMarkText(markMap.turbulence),
      analysisResult: hasDisorder(disorderText, ['湍流']) ? '√' : '-',
    },
    {
      key: '8',
      item: '频窗填充',
      markResult: getMarkText(markMap.window_filling),
      analysisResult: hasDisorder(disorderText, ['频窗填充', '频窗消失']) ? '√' : '-',
    },
    {
      key: '9',
      item: '其他异常情况',
      markResult: getMarkText(markMap.other),
      analysisResult: hasDisorder(disorderText, ['其他']) ? '√' : '-',
    },
  ];
};

const mapDbAnalysisToPageData = (dbData, formData, agentData) => {
  if (!dbData && !agentData) return EMPTY_ANALYSIS_DATA;

  const mergedStenosisFlag = pickValue(agentData?.stenosis_flag, dbData?.stenosis_flag, '');
  const mergedStenosis = pickValue(agentData?.stenosis, dbData?.stenosis, '-');

  return {
    refreshTime: new Date().toLocaleTimeString(),
    originalDiagnosis: toDisplayText(
      pickValue(agentData?.patient_exam, dbData?.patient_exam, '-')
    ),
    vesselDiagnosisDesc: toDisplayText(
      pickValue(agentData?.velocity_exam, dbData?.velocity_exam, '-')
    ),
    primaryDiagnosis:
      mergedStenosisFlag === '是' || mergedStenosisFlag === '1'
        ? toDisplayText(mergedStenosis)
        : '无医生诊断',
    summaryTable: [
      {
        key: '1',
        item: '血流速度情况',
        result: toDisplayText(
          pickValue(agentData?.velocity_status, dbData?.velocity_status, '-')
        ),
      },
      {
        key: '2',
        item: '参照血管',
        result: toDisplayText(
          pickValue(agentData?.velocity_reference, dbData?.velocity_reference, '-')
        ),
      },
      {
        key: '3',
        item: '包络情况',
        result: toDisplayText(
          pickValue(agentData?.envelope_status, dbData?.envelope_status, '-')
        ),
      },
      {
        key: '4',
        item: '频谱紊乱情况',
        result: toDisplayText(
          pickValue(agentData?.spectrum_disorder, dbData?.spectrum_disorder, '-')
        ),
      },
      {
        key: '5',
        item: '血流方向',
        result: toDisplayText(
          pickValue(agentData?.direction_status, dbData?.direction_status, '-')
        ),
      },
      {
        key: '6',
        item: 'PI情况',
        result: toDisplayText(
          pickValue(agentData?.pi_status, dbData?.pi_status, '-')
        ),
      },
      {
        key: '7',
        item: '杂音情况',
        result: toDisplayText(
          pickValue(agentData?.bruit_status, dbData?.bruit_status, '-')
        ),
      },
      {
        key: '8',
        item: '是否狭窄',
        result: toYesNo(
          pickValue(agentData?.stenosis_flag, dbData?.stenosis_flag, '-')
        ),
      },
      {
        key: '9',
        item: '狭窄程度',
        result: toDisplayText(
          pickValue(agentData?.stenosis, dbData?.stenosis, '-')
        ),
      },
      {
        key: '10',
        item: '是否完成分析',
        result: toYesNo(
          pickValue(agentData?.analysisFlag, dbData?.analysisFlag, '-')
        ),
      },
    ],
    compareTable: buildCompareTable(dbData, formData, agentData),
    otherMark: toDisplayText(formData?.other_desc),
    otherAnalysis: toDisplayText(
      pickValue(agentData?.other_desc, dbData?.other_desc, '-')
    ),

    // 额外保留原始字段，给调用大模型接口时使用
    velocity: pickValue(agentData?.velocity_exam, dbData?.velocity_exam, ''),
  };
};

const AnalysisPage = () => {
  const {
    spectrums,
    formData,
    handleSubmit: originalHandleSubmit,
    handleNext,
    handlePrev,
    currentIndex,
    currentImage,
  } = useSpectrumData();

  const [analysisDbData, setAnalysisDbData] = useState(null);
  const [agentAnalysisData, setAgentAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);

  const analysisData = useMemo(() => {
    return mapDbAnalysisToPageData(analysisDbData, formData, agentAnalysisData);
  }, [analysisDbData, formData, agentAnalysisData]);

  const currentImageId = formData.id;
  const currentVesselName = formData.vessel;

  const handleSave = async (userId) => {
    if (originalHandleSubmit) {
      await originalHandleSubmit(userId);
    }
  };

  const fetchAnalysisData = async () => {
    if (!currentImage?.id) {
      setAnalysisDbData(null);
      setAgentAnalysisData(null);
      return;
    }

    try {
      setLoading(true);
      const res = await getAnalysis(currentImage.id);

      const dbData = res?.data?.data || res?.data || res;
      setAnalysisDbData(dbData || null);

      console.log('数据库存储的分析结果为：', dbData);
      console.log('当前的formdata:', formData);
    } catch (error) {
      console.error('获取数据库分析结果失败：', error);
      message.error('获取分析结果失败');
      setAnalysisDbData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, [currentImage?.id]);

  const showAnalysisData = async () => {
    await fetchAnalysisData();
  };

  const agentAnalysis = async () => {
    try {
      if (!analysisDbData) {
        message.warning('请先加载数据库分析结果');
        return;
      }

      setAgentLoading(true);

      const analysisRet = await getAgentAnalysis(
        analysisDbData?.velocity || analysisDbData?.velocity_exam || '',
        analysisDbData?.patient_exam || ''
      );

      console.log('大模型的分析结果为：', analysisRet);

      const normalizedAgentData = normalizeAgentResult(analysisRet);
      setAgentAnalysisData(normalizedAgentData);

      message.success('大模型分析结果已更新到页面');
    } catch (error) {
      console.error('获取大模型分析结果失败：', error);
      message.error('获取大模型分析结果失败');
    } finally {
      setAgentLoading(false);
    }
  };

  const summaryColumns = [
    {
      title: '指标',
      dataIndex: 'item',
      key: 'item',
      width: '42%',
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (text) => (text === '-' ? <EmptyText>-</EmptyText> : text),
    },
  ];

  const compareColumns = [
    {
      title: '项目',
      dataIndex: 'item',
      key: 'item',
      width: '36%',
    },
    {
      title: '标注结果',
      dataIndex: 'markResult',
      key: 'markResult',
      render: (text) => {
        if (String(text).startsWith('置信度：')) {
          return <Tag color="default">{text}</Tag>;
        }
        return text === '-' ? <EmptyText>-</EmptyText> : text;
      },
    },
    {
      title: '归纳分析异常',
      dataIndex: 'analysisResult',
      key: 'analysisResult',
      render: (text) => {
        if (text === '√') {
          return <Tag color="blue">√</Tag>;
        }
        return text === '-' ? <EmptyText>-</EmptyText> : text;
      },
    },
  ];

  const handleSubmitWithValidation = async (userId) => {
    if (originalHandleSubmit) {
      await originalHandleSubmit(userId);
    }
  };

  return (
    <ContentWrapper>
      <TopSection>
        <ImageViewerCard>

          <ImageViewer
            image={currentImage}
            onNext={handleNext}
            onPrev={handlePrev}
            onSave={handleSubmitWithValidation}
            currentIndex={currentIndex}
            totalCount={spectrums.length}
          />
        </ImageViewerCard>
      </TopSection>

      <BottomSection>
        <SectionHeader>
          <SectionTitle>诊断结果与分析</SectionTitle>

          <ImageMetaBar>
            <MetaItem>
              <MetaLabel>当前图像ID：</MetaLabel>
              <MetaValue>{currentImageId}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>血管名称：</MetaLabel>
              <MetaValue>{currentVesselName}</MetaValue>
            </MetaItem>
          </ImageMetaBar>

          <HeaderRight>
            <RefreshInfo>
              最近更新: {loading || agentLoading ? '加载中...' : analysisData.refreshTime}
            </RefreshInfo>
            <Button size="small" onClick={agentAnalysis} loading={agentLoading}>
              刷新分析结果
            </Button>
            <Button size="small" loading={loading} onClick={showAnalysisData}>
              当前页面的表格数据
            </Button>
          </HeaderRight>
        </SectionHeader>

        <TopInfoGrid>
          <InfoCard>
            <InfoCardTitle>原始诊断结果</InfoCardTitle>
            <InfoCardBody>{analysisData.originalDiagnosis}</InfoCardBody>
          </InfoCard>

          <RightInfoColumn>
            <InfoCard>
              <InfoCardTitle>血管级诊断特征描述</InfoCardTitle>
              <InfoCardBody>{analysisData.vesselDiagnosisDesc}</InfoCardBody>
            </InfoCard>

            <InfoCard>
              <InfoCardTitle>初步诊断结果</InfoCardTitle>
              <InfoCardBody>{analysisData.primaryDiagnosis}</InfoCardBody>
            </InfoCard>
          </RightInfoColumn>
        </TopInfoGrid>

        <BottomGrid>
          <InfoCard>
            <TableCardHeader>
              <span>归纳分析结果</span>
            </TableCardHeader>
            <Table
              columns={summaryColumns}
              dataSource={analysisData.summaryTable}
              pagination={false}
              size="small"
              bordered={false}
              rowKey="key"
            />
          </InfoCard>

          <InfoCard>
            <TableCardHeader>
              <span>标注与诊断结果对比</span>
            </TableCardHeader>
            <Table
              columns={compareColumns}
              dataSource={analysisData.compareTable}
              pagination={false}
              size="small"
              bordered={false}
              rowKey="key"
            />

            <OtherDesc>
              <div>
                <strong>Other 说明：</strong>
              </div>
              <div>标注：{analysisData.otherMark || '-'}</div>
              <div>归纳分析：{analysisData.otherAnalysis || '-'}</div>
            </OtherDesc>
          </InfoCard>
        </BottomGrid>
      </BottomSection>
    </ContentWrapper>
  );
};

export default AnalysisPage;