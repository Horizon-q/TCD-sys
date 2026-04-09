// context/SpectrumDataContext.js
import { message } from 'antd';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  getDefaultFilters,
  getDefaultFormData,
  getDefaultImage,
  spectrumAPI
} from '../services/spectrumService';

const SpectrumDataContext = createContext();

export const SpectrumDataProvider = ({ children }) => {
  const PAGE_TYPES = {
    ANNOTATION: 'annotation',
    MANAGEMENT: 'management',
    AGENT: 'agent'
  };

  const [currentIndex, setCurrentIndex] = useState(1);
  const [currentImage, setCurrentImage] = useState(getDefaultImage());
  const [filters, setFilters] = useState(getDefaultFilters());
  const [formData, setFormData] = useState(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [currentPageType, setCurrentPageType] = useState(PAGE_TYPES.ANNOTATION);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 0
  });
  const [spectrums, setSpectrums] = useState([]);
  const [annotatedSize, setAnnotatedSize] = useState(10);

  const isSingleView = useMemo(() => {
    return (
      currentPageType === PAGE_TYPES.ANNOTATION ||
      currentPageType === PAGE_TYPES.AGENT
    );
  }, [currentPageType, PAGE_TYPES.ANNOTATION, PAGE_TYPES.AGENT]);

  const syncCurrentDisplay = useCallback((list, index = 1) => {
    const safeList = Array.isArray(list) ? list : [];
    const safeIndex =
      safeList.length > 0
        ? Math.min(Math.max(index, 1), safeList.length)
        : 1;

    setCurrentIndex(safeIndex);

    const target = safeList[safeIndex - 1] || getDefaultImage();
    setCurrentImage(target);

    // 关键修复：
    // 单图模式下（ANNOTATION / AGENT）都同步 formData
    if (isSingleView) {
      if (safeList[safeIndex - 1]) {
        setFormData({ ...safeList[safeIndex - 1] });
      } else {
        setFormData(getDefaultFormData());
      }
    }
  }, [isSingleView]);

  const updateSpectrums = useCallback(async () => {
    setLoading(true);

    try {
      const requestPage = isSingleView ? 1 : currentPage;
      const requestPageSize = isSingleView ? annotatedSize : 8;

      const { data, pagination: serverPagination } = await spectrumAPI.getSpectrums({
        filters,
        page: requestPage,
        pageSize: requestPageSize,
        totalLimit: isSingleView ? annotatedSize : undefined,
        searchText
      });

      const safeData = Array.isArray(data) ? data : [];

      setSpectrums(safeData);
      setPagination(
        serverPagination || {
          page: requestPage,
          pageSize: requestPageSize,
          total: safeData.length,
          totalPages: 1
        }
      );

      if (isSingleView) {
        syncCurrentDisplay(safeData, 1);
      }
    } catch (error) {
      console.error('加载频谱图数据失败:', error);
      message.error('加载频谱图数据失败');
      setSpectrums([]);

      if (isSingleView) {
        syncCurrentDisplay([], 1);
      }
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    currentPage,
    searchText,
    annotatedSize,
    isSingleView,
    syncCurrentDisplay
  ]);

  useEffect(() => {
    updateSpectrums();
  }, [updateSpectrums]);

  const handleFormChange = useCallback((section, data) => {
    setFormData((prev) => ({
      ...prev,
      ...data
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (!isSingleView || loading) return;

    const batchSize = spectrums.length;
    if (batchSize === 0) {
      message.info('当前没有可显示的图片');
      return;
    }

    if (currentIndex < batchSize) {
      const nextIndex = currentIndex + 1;
      syncCurrentDisplay(spectrums, nextIndex);
      message.info(`已切换到当前组第 ${nextIndex} 张`);
      return;
    }

    message.info('已经是当前组最后一张图片');
  }, [isSingleView, loading, spectrums, currentIndex, syncCurrentDisplay]);

  const handlePrev = useCallback(() => {
    if (!isSingleView || loading) return;

    const batchSize = spectrums.length;
    if (batchSize === 0) {
      message.info('当前没有可显示的图片');
      return;
    }

    if (currentIndex > 1) {
      const prevIndex = currentIndex - 1;
      syncCurrentDisplay(spectrums, prevIndex);
      message.info(`已切换到当前组第 ${prevIndex} 张`);
    } else {
      message.info('已经是当前组第一张图片');
    }
  }, [isSingleView, loading, spectrums, currentIndex, syncCurrentDisplay]);

  const handleSubmit = useCallback(async () => {
    if (!currentImage?.id) {
      message.warning('无法保存标注：缺少图片ID');
      return;
    }

    if (loading) return;

    try {
      const annotationPayload = {
        ...formData,
        snpId: currentImage.id
      };

      await spectrumAPI.saveAnnotation(currentImage.id, annotationPayload);

      const updatedSpectrums = spectrums.map((item, index) => {
        if (index === currentIndex - 1) {
          return {
            ...item,
            ...annotationPayload,
            annotationStatus: 1
          };
        }
        return item;
      });

      setSpectrums(updatedSpectrums);

      const isLastInBatch = currentIndex >= updatedSpectrums.length;

      if (!isLastInBatch) {
        const nextIndex = currentIndex + 1;
        syncCurrentDisplay(updatedSpectrums, nextIndex);
        message.success('标注已保存，已切换到当前组下一张');
        return;
      }

      syncCurrentDisplay(updatedSpectrums, currentIndex);
      message.success('标注已保存，当前已是本组最后一张');
    } catch (error) {
      console.error('保存标注失败:', error);
      message.error('保存标注失败');
    }
  }, [
    currentImage,
    formData,
    currentIndex,
    spectrums,
    loading,
    syncCurrentDisplay
  ]);

  const handleSelectImage = useCallback((image) => {
    console.log('选择图片', image);
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(getDefaultFormData());
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
    setCurrentIndex(1);
    setCurrentPage(1);
    setSearchText('');
  }, []);

  const applyFilters = useCallback((nextFilters) => {
    setFilters(nextFilters);
    setCurrentIndex(1);
    setCurrentPage(1);
  }, []);

  const applySearch = useCallback((nextSearchText = '') => {
    setSearchText(nextSearchText);
    setCurrentIndex(1);
    setCurrentPage(1);
  }, []);

  const contextValue = {
    spectrums,
    currentIndex,
    currentImage,
    currentPageType,
    filters,
    formData,
    loading,
    pagination,
    currentPage,
    searchText,
    annotatedSize,
    PAGE_TYPES,

    setCurrentIndex,
    setCurrentImage,
    setFilters,
    setFormData,
    setPagination,
    setCurrentPage,
    setSearchText,
    setAnnotatedSize,
    setCurrentPageType,

    handleFormChange,
    handleSubmit,
    handleNext,
    handlePrev,
    handleSelectImage,
    resetFormData,
    resetFilters,
    applyFilters,
    applySearch,
    updateSpectrums
  };

  return (
    <SpectrumDataContext.Provider value={contextValue}>
      {children}
    </SpectrumDataContext.Provider>
  );
};

export const useSpectrumData = () => {
  const context = useContext(SpectrumDataContext);
  if (!context) {
    throw new Error('useSpectrumData must be used within a SpectrumDataProvider');
  }
  return context;
};

export default SpectrumDataContext;