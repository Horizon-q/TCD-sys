// App.js
import { Layout, message } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import AnnotationPage from './components/AnnotationPage';
import AnalysisPage from './components/AnalysisPage';
import AppSider from './components/AppSider';
import SpectrumManager from './components/SpectrumManager';
import { KeyboardNavProvider } from './context/KeyboardNavContext';
import { SpectrumDataProvider, useSpectrumData } from './context/SpectrumDataContext';

const { Sider, Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledSider = styled(Sider)`
  background: #1890ff;
  
  // 覆盖 Antd Sider 的默认样式
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
`;

const StyledContent = styled(Content)`
  padding: 20px;
  background: #f0f2f5;
  overflow: auto;
`;

// 内部组件，使用 SpectrumDataProvider 提供的上下文
const AppContent = () => {
  const {
    handleSubmit,
    handleNext,
    handlePrev,
    handleSelectImage,
    PAGE_TYPES,
    currentPageType, setCurrentPageType
  } = useSpectrumData();

  //console.log(currentPageType);

  // 处理从频谱管理器选择图片
  const handleManagerSelectImage = (image) => {
    handleSelectImage(image);
    setCurrentPageType(PAGE_TYPES.ANNOTATION);
  };

  // 添加全局键盘快捷键
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (currentPageType !== PAGE_TYPES.ANNOTATION) return;

      if (e.key === 'Q') {
        message.info('切换到步骤一：质量评估');
        const step1 = document.getElementById('step1');
        if (step1) step1.focus();
        e.preventDefault();
      } else if (e.key === 'W') {
        message.info('切换到步骤二：病因分类标注');
        const step2 = document.getElementById('step2');
        if (step2) step2.focus();
        e.preventDefault();
      } else if (e.key === 'E') {
        message.info('切换到步骤三：置信度与备注');
        const step3 = document.getElementById('step3');
        if (step3) step3.focus();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [currentPageType, handleSubmit, handleNext, handlePrev]);

  return (
    <KeyboardNavProvider>
      <StyledLayout>
        <StyledSider width={320} theme="light">
          <AppSider />
        </StyledSider>

        <StyledContent>
          {(currentPageType === PAGE_TYPES.ANNOTATION ||currentPageType === PAGE_TYPES.AGENT) ? (
            <AnnotationPage />
          ) :  (
            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
              <SpectrumManager />
            </div>
          ) }
        </StyledContent>
      </StyledLayout>
    </KeyboardNavProvider>
  );
};

function App() {
  return (
    <SpectrumDataProvider>
      <AppContent />
    </SpectrumDataProvider>
  );
}

export default App;