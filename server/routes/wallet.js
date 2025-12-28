const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');

// 获取钱包余额
router.get('/balance', async (req, res, next) => {
    try {
        const balance = await walletService.getBalance();
        res.json({ success: true, data: { balance } });
    } catch (error) {
        next(error);
    }
});

// 增加余额
router.post('/add', async (req, res, next) => {
    try {
        const { amount, description } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: '金额必须大于0' });
        }

        const balance = await walletService.addBalance(amount, description || '');
        res.json({ success: true, data: { balance } });
    } catch (error) {
        next(error);
    }
});

// 减少余额
router.post('/subtract', async (req, res, next) => {
    try {
        const { amount, description } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: '金额必须大于0' });
        }

        const balance = await walletService.subtractBalance(amount, description || '');
        res.json({ success: true, data: { balance } });
    } catch (error) {
        next(error);
    }
});

// 获取交易记录
router.get('/transactions', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const transactions = await walletService.getTransactions(limit);
        res.json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

