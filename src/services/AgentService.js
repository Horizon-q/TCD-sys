const getAgentAnalysis = async (velocity, content) => {
  try {
    console.log('调用大模型分析');

    const queryParams = new URLSearchParams();
    queryParams.append('velocity', velocity || '');
    queryParams.append('content', content || '');

    const response = await fetch(`http://localhost:3001/agent/Coze?${queryParams.toString()}`, {
      method: 'GET',
    });

    const dataRet = await response.json();

    console.log('调用大模型的返回结果：', dataRet);

    return dataRet.data;
  } catch (error) {
    console.error('调用大模型失败：', error);
    return {
      success: false,
      message: '调用大模型失败',
      error,
    };
  }
};

export {
  getAgentAnalysis,
};