//获取数据库分析结果
const getAnalysis = async (id) => {
  try {
    console.log('获取分析结果', id);

    const response = await fetch(`http://localhost:3001/api/analysis/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await response.json();

    if (!response.ok || !res.success) {
      throw new Error(res.error || '获取分析结果失败');
    }

    return res.data;
  } catch (error) {
    console.error('获取分析结果失败:', error);
    throw error;
  }
};


//保存分析结果
const saveAnalysis = async (id, analysisData) => {
  try {
    console.log('保存分析结果', id, analysisData);

    if (!id) {
      throw new Error('缺少 id，无法更新分析结果');
    }

    if (!analysisData || typeof analysisData !== 'object') {
      throw new Error('analysisData 必须是对象');
    }

    const response = await fetch(`http://localhost:3001/api/analysis/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData),
    });

    const res = await response.json();

    if (!response.ok || !res.success) {
      throw new Error(res.error || '保存分析结果失败');
    }

    return res.data;
  } catch (error) {
    console.error('保存分析结果失败:', error);
    throw error;
  }
};

export {
  getAnalysis,
  saveAnalysis,
};