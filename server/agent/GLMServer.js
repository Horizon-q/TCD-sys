class GLMAgent {
  async getAnalysis(content, vessel) {
    console.log('开始调用GLM分析');

    try {
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer 4cecf044dcc04ee5abca715c9902dc27.KNhOnNX21pozQVo8`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4.7',
          messages: [
            {
              role: 'system',
              content: `你是一个用于从血管超声诊断报告中抽取结构化信息的助手。

【任务】
根据医生给出的中文诊断描述和对诊断血管的要求（输入格式为json格式，诊断描述在formData中，诊断血管在vessel中），提取并生成一个 JavaScript 对象，用于直接写入数据库。

对象的属性名和含义必须与下表完全一致：
- exam_id: string 检查ID（由外部系统提供，如未提供则返回 null）
- snapshot_id: string 血管快照唯一编号（外部提供，如未提供则返回 null）
- velocity: 诊断血管名（与传入的vessel一致）
- velocity_exam: 该诊断血管对应的诊断描述，以string类型返回
- stenosis_descri: 在“提示：”后对该血管可能存在的异常的描述，以string类型返回，要返回原始报告中对应的整句描述,如果没有对该血管的异常诊断，则返回null
- velocity_status: "增高" / "减低" / "稍微增高" / "稍微减低" / "正常" / "无" / "明显增高" / "明显减低"
- velocity_reference: string，仅在有比较时填写，未提及时用"无"
- envelope_status: "正常" / "峰时延迟" / "圆钝" / "高阻" / "无"，若有其他异常直接写异常名
- spectrum_disorder: "频窗充填" / "涡流" / "湍流" / "无"，若有其他异常直接写异常名
- direction_status: "无" / "逆向"，若有其他异常直接写异常名
- pi_status: "正常" / "偏高" / "偏低"，未提及时用"正常"
- bruit_status: "无" / "有"，未提及时用"无"
- stenosis_flag: "是" / "否" / "不确定"
- stenosis: "轻度" / "中度" / "重度" / "轻-中度" / "中-重度" / "无"
- analysisFlag: int，当描述中提到该血管时返回1，否则返回0

【规则】
1. 严格根据诊断内容判断，不要编造。
2. 如果文本中没有提到某一项，或者无法确定，就把对应字段设置为 null。
3. 如果报告未明确提及该血管：
   - velocity 保留为传入 vessel
   - velocity_exam 返回"报告中未明确提及该血管"
   - analysisFlag 返回 0
   - 其他字段都返回 null
4. 只输出一个合法 JSON 对象，不要输出任何解释、说明或代码块。
5. 当同一属性出现多个异常，中间用中文逗号“，”分割。`,
            },
            {
              role: 'user',
              content: JSON.stringify({
                formData: content,
                vessel: vessel,
              }),
            },
          ],
          stream: false,
          temperature: 0.1,
        }),
      };

      const res = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        options
      );

      if (!res.ok) {
        throw new Error(`HTTP错误！状态码: ${res.status}`);
      }

      const data = await res.json();
      let result = data?.choices?.[0]?.message?.content;

      if (!result) {
        throw new Error('模型未返回内容');
      }

      console.log('目标结构化对象原文：', result);

      // 清理可能的 ```json 包裹
      result = result.trim();
      result = result.replace(/^```json\s*/i, '');
      result = result.replace(/^```\s*/i, '');
      result = result.replace(/\s*```$/i, '');

      // 截取最外层 JSON
      const start = result.indexOf('{');
      const end = result.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        result = result.slice(start, end + 1);
      }

      const jsonObj = JSON.parse(result);

      console.log('解析后的 JSON 对象：', jsonObj);
      return jsonObj;
    } catch (err) {
      console.error('请求失败：', err);
      return {
        success: false,
        message: err.message || '请求失败',
      };
    }
  }
}

const GLMagent = new GLMAgent();

module.exports = GLMagent;