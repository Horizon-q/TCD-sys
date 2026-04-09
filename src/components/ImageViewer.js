import { LeftOutlined, RightOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tooltip, message } from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  height: 100%;
  border-radius: 8px !important;

  .ant-card-head {
    min-height: 38px !important;
    padding: 0 10px !important;
  }

  .ant-card-head-title {
    padding: 8px 0 !important;
    font-size: 14px !important;
    line-height: 1.2;
  }

  .ant-card-extra {
    padding: 8px 0 !important;
    font-size: 12px !important;
  }

  .ant-card-body {
    padding: 8px 10px 10px !important;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 320px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
`;

const StyledImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  transform: scale(${props => props.scale});
  transition: transform 0.2s ease;
  cursor: move;
  user-select: none;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 8px;

  .ant-space {
    gap: 6px !important;
    flex-wrap: wrap;
    justify-content: center;
  }

  .ant-btn {
    height: 30px !important;
    padding: 0 10px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
  }
`;

const ShortcutHint = styled.div`
  margin-top: 6px;
  text-align: center;
  color: #888;
  font-size: 11px;
  line-height: 1.3;
`;

const ImageViewer = ({ image, onNext, onPrev, onSave, pageType }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
        case 'ArrowRight':
          if (onNext) onNext();
          break;
        case 'ArrowLeft':
          if (onPrev) onPrev();
          break;
        case 'Enter':
          if (onSave && pageType === 'annotation') {
            e.preventDefault();
            onSave();
            message.success('已保存标注');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [image, onNext, onPrev, onSave, pageType]);

  return (
    <StyledCard
      title="多普勒频谱图"
      variant="outlined"
      extra={`图像ID: ${image?.id || '-'}`}
    >
      <ImageContainer>
        <StyledImage
          src={
            image?.url && image.url.trim() !== ''
              ? image.url
              : './images/spectrum/sample (1).bmp'
          }
          alt="多普勒频谱图"
          scale={scale}
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          }}
          onError={(e) => {
            e.target.onerror = null;
            if (e.target.src !== './images/spectrum/sample (1).bmp') {
              e.target.src = './images/spectrum/sample (1).bmp';
            }
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable="false"
        />
      </ImageContainer>

      <ControlsContainer>
        <Space>
          <Tooltip title="左方向键">
            <Button icon={<LeftOutlined />} onClick={onPrev}>上一张</Button>
          </Tooltip>

          <Tooltip title="+">
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>放大</Button>
          </Tooltip>

          <Tooltip title="-">
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>缩小</Button>
          </Tooltip>

          <Tooltip title="0">
            <Button icon={<UndoOutlined />} onClick={handleReset}>重置</Button>
          </Tooltip>

          <Tooltip title="右方向键">
            <Button icon={<RightOutlined />} onClick={onNext}>下一张</Button>
          </Tooltip>

          {pageType === 'annotation' && (
            <Tooltip title="回车">
              <Button type="primary" onClick={onSave}>
                保存标注
              </Button>
            </Tooltip>
          )}
        </Space>
      </ControlsContainer>

      <ShortcutHint>
        + 放大 ｜ - 缩小 ｜ 0 重置 ｜ ← 上一张 ｜ → 下一张 ｜ 回车保存
      </ShortcutHint>
    </StyledCard>
  );
};

export default ImageViewer;