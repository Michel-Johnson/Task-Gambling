require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// 导入路由
const tasksRouter = require('./routes/tasks');
const prizesRouter = require('./routes/prizes');
const lotteryRouter = require('./routes/lottery');

// 导入服务
const cleanupService = require('./services/cleanupService');

// 导入错误处理
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/tasks', tasksRouter);
app.use('/api/prizes', prizesRouter);
app.use('/api/lottery', lotteryRouter);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: '服务运行正常' });
});

// 定时任务：每天凌晨2点清理过期任务
cron.schedule('0 2 * * *', () => {
    console.log('开始清理过期任务...');
    cleanupService.cleanArchivedTasks().catch(err => {
        console.error('清理任务失败:', err);
    });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;

