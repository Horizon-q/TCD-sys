const express = require('express');
const cors = require('cors');
const spectrumRoutes = require('./routes/spectrum');
const agentRoutes = require('./routes/agent');
const analysisRoutes = require('./routes/analysis');
const db = require('./database/db'); // 导入数据库实例

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务 - 指向您的本地图片目录
// 请将下面的路径替换为您的实际图片目录
const IMAGE_BASE_PATH = "D:\\TCD\\tcddatacopy\\DB"; // 您的本地图片根目录
const IMAGE_SERVE_PATH = '/images/spectrum'; // 前端访问的URL路径

app.use(IMAGE_SERVE_PATH, express.static(IMAGE_BASE_PATH, {
    dotfiles: 'deny', // 拒绝访问点文件
    etag: true, // 启用ETag
    fallthrough: true, // 允许继续到下一个中间件
    index: false, // 禁用目录索引
    maxAge: '1d', // 缓存1天
    redirect: false // 禁用重定向
}));

console.log(`🖼️ 图片服务配置:`);
console.log(`   物理路径: ${IMAGE_BASE_PATH}`);
console.log(`   访问路径: ${IMAGE_SERVE_PATH}`);


// 路由
app.use('/api/spectrum', spectrumRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/agent/Coze', agentRoutes);

// 健康检查接口（包含数据库状态）
app.get('/api/health', async (req, res) => {
    try {
        const dbHealth = await db.healthCheck();

        res.json({
            status: 'OK',
            message: 'TCD标注系统后端服务运行正常',
            database: dbHealth,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: '服务异常',
            database: { status: 'unhealthy', message: error.message },
            timestamp: new Date().toISOString()
        });
    }
});

// 数据库信息接口
app.get('/api/database/info', async (req, res) => {
    try {
        const dbInfo = await db.getDatabaseInfo();
        res.json({
            success: true,
            data: dbInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取数据库信息失败',
            message: error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message
    });
});

// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
const startServer = async () => {
    try {
        console.log('🚀 正在启动服务器...');

        // 确保数据库连接正常后再启动服务器
        console.log('🔗 初始化数据库连接...');
        const dbReady = await db.initialize();

        if (!dbReady) {
            console.error('💥 无法启动服务器：数据库连接失败');
            process.exit(1);
        }

        console.log('✅ 数据库连接成功');

        // 检查必要的表是否存在
        const tables = await db.getAllTables();
        console.log('📊 数据库中的表:', tables);

        // 检查数据量
        const patientCount = await db.getTableCount('tcdPatient');
        const snapshotCount = await db.getTableCount('tcdSnapshot');
        console.log(`📈 数据统计: 患者表 ${patientCount} 条, 频谱图表 ${snapshotCount} 条`);

        app.listen(PORT, () => {
            console.log(`🎉 后端服务运行在 http://localhost:${PORT}`);
            console.log(`📊 API接口: http://localhost:${PORT}/api`);
            console.log(`🖼️ 图片服务: http://localhost:${PORT}/images/spectrum`);
            console.log(`❤️  健康检查: http://localhost:${PORT}/api/health`);
            console.log(`🗄️  数据库信息: http://localhost:${PORT}/api/database/info`);
            console.log(`🔍 频谱图调试: http://localhost:${PORT}/api/spectrum/debug/info`);
        });
    } catch (error) {
        console.error('💥 服务器启动失败:', error);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭服务器...');
    await db.close();
    console.log('👋 服务器已关闭');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    await db.close();
    console.log('👋 服务器已关闭');
    process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', async (error) => {
    console.error('💥 未捕获异常:', error);
    await db.close();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason);
    await db.close();
    process.exit(1);
});

// 启动服务器
startServer();

module.exports = app;