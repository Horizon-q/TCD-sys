const express = require('express');
const router = express.Router();
const coze = require('../agent/CozeServer');
const glm = require('../agent/GLMServer');

router.get('/', async (req, res) => {
  try {
    const { content, velocity } = req.query;

    // if (!content) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'content 不能为空',
    //   });
    // }

    const ret = await glm.getAnalysis(content, velocity);

    console.log('大模型调用返回的结果是', ret);

    return res.json({
      success: true,
      data: ret,
    });
  } catch (e) {
    console.error(e);
    console.log('大模型调用失败');

    return res.status(500).json({
      success: false,
      message: '大模型调用失败',
    });
  }
});

module.exports = router;