const { CozeAPI } = require('@coze/api');

class CozeAgent {
  async getAnalysis(content, velocity) {
    console.log('开始分析');

    const apiClient = new CozeAPI({
      token: 'pat_yTc3wIoDvR8Y9HdWIe0iosn92l2g1rXyj5EHufcWMb0riQEPNbhwWmF0F8UDT6vt',
      baseURL: 'https://api.coze.cn',
    });

    const stream = await apiClient.chat.stream({
      bot_id: '7572514175918915599',
      user_id: 'tcdSys',
      additional_messages: [
        {
          role: 'user',
          type: 'question',
          content_type: 'text',
          content: `${content}    ${velocity}`,
        },
      ],
    });

    let finalText = '';

    for await (const event of stream) {
      if(event.event=='conversation.message.completed'&&event.data.type=='answer'){
        finalText = event.data.content;
        break;
      }
    }

    console.log('大模型最终返回文本：', finalText);

    try {
      const resultObj = JSON.parse(finalText);
      console.log('解析后的对象：', resultObj);
      return resultObj;
    } catch (error) {
      console.error('JSON 解析失败：', error);
      return {
        success: false,
        rawText: finalText,
        message: '大模型返回结果不是合法 JSON',
      };
    }
  }
}

const cozeagent = new CozeAgent();

module.exports = cozeagent;