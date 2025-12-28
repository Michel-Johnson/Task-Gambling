const express = require('express');
const router = express.Router();
const { dbRun, dbGet, dbAll } = require('../config/database');

// 获取所有奖品
router.get('/', async (req, res, next) => {
    try {
        const sql = 'SELECT * FROM prizes ORDER BY created_at DESC';
        const prizes = await dbAll(sql);
        res.json({ success: true, data: prizes });
    } catch (error) {
        next(error);
    }
});

// 获取单个奖品
router.get('/:id', async (req, res, next) => {
    try {
        const sql = 'SELECT * FROM prizes WHERE id = ?';
        const prize = await dbGet(sql, [req.params.id]);
        if (!prize) {
            return res.status(404).json({ success: false, message: '奖品不存在' });
        }
        res.json({ success: true, data: prize });
    } catch (error) {
        next(error);
    }
});

// 创建奖品
router.post('/', async (req, res, next) => {
    try {
        const { name, description, weight } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: '奖品名称不能为空' });
        }
        
        const weightValue = parseInt(weight) || 1;
        if (weightValue < 1) {
            return res.status(400).json({ success: false, message: '权重必须大于0' });
        }

        const sql = `INSERT INTO prizes (name, description, weight) 
                     VALUES (?, ?, ?)`;
        const result = await dbRun(sql, [name.trim(), description?.trim() || '', weightValue]);
        
        const prize = await dbGet('SELECT * FROM prizes WHERE id = ?', [result.id]);
        res.status(201).json({ success: true, data: prize });
    } catch (error) {
        next(error);
    }
});

// 更新奖品
router.put('/:id', async (req, res, next) => {
    try {
        const prize = await dbGet('SELECT * FROM prizes WHERE id = ?', [req.params.id]);
        if (!prize) {
            return res.status(404).json({ success: false, message: '奖品不存在' });
        }

        const updates = {};
        const values = [];
        
        if (req.body.name !== undefined) {
            updates.name = req.body.name.trim();
            values.push(updates.name);
        }
        if (req.body.description !== undefined) {
            updates.description = req.body.description?.trim() || '';
            values.push(updates.description);
        }
        if (req.body.weight !== undefined) {
            const weight = parseInt(req.body.weight);
            if (weight < 1) {
                return res.status(400).json({ success: false, message: '权重必须大于0' });
            }
            updates.weight = weight;
            values.push(weight);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: '没有可更新的字段' });
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        values.push(req.params.id);
        
        const sql = `UPDATE prizes SET ${fields} WHERE id = ?`;
        await dbRun(sql, values);
        
        const updatedPrize = await dbGet('SELECT * FROM prizes WHERE id = ?', [req.params.id]);
        res.json({ success: true, data: updatedPrize });
    } catch (error) {
        next(error);
    }
});

// 删除奖品（软删除）
router.delete('/:id', async (req, res, next) => {
    try {
        const sql = 'UPDATE prizes SET is_active = 0 WHERE id = ?';
        await dbRun(sql, [req.params.id]);
        res.json({ success: true, message: '奖品已删除' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

