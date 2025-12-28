const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');

// 执行抽奖
router.post('/draw', async (req, res, next) => {
    try {
        const { task_id, hours_exceeded } = req.body;
        
        if (task_id === undefined) {
            return res.status(400).json({ success: false, message: '任务ID不能为空' });
        }

        const hoursExceeded = parseInt(hours_exceeded) || 0;
        const result = await lotteryService.drawLottery(task_id, hoursExceeded);
        
        res.json({
            success: true,
            prize: result.prize,
            no_prize_probability: result.noPrizeProbability,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
});

// 获取抽奖历史
router.get('/history', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await lotteryService.getLotteryHistory(limit);
        res.json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

