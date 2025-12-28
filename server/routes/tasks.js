const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService');

// 获取所有任务
router.get('/', async (req, res, next) => {
    try {
        const { status } = req.query;
        const tasks = await taskService.getAllTasks(status);
        res.json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
});

// 获取单个任务
router.get('/:id', async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: '任务不存在' });
        }
        res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

// 创建任务
router.post('/', async (req, res, next) => {
    try {
        const { title, description, weight } = req.body;
        
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: '任务标题不能为空' });
        }
        
        const weightValue = parseInt(weight) || 1;
        if (weightValue < 1) {
            return res.status(400).json({ success: false, message: '权重必须大于0' });
        }

        const task = await taskService.createTask(title.trim(), description?.trim() || '', weightValue);
        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

// 更新任务
router.put('/:id', async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: '任务不存在' });
        }

        const updates = {};
        if (req.body.title !== undefined) updates.title = req.body.title.trim();
        if (req.body.description !== undefined) updates.description = req.body.description?.trim() || '';
        if (req.body.weight !== undefined) {
            const weight = parseInt(req.body.weight);
            if (weight < 1) {
                return res.status(400).json({ success: false, message: '权重必须大于0' });
            }
            updates.weight = weight;
        }

        const updatedTask = await taskService.updateTask(req.params.id, updates);
        res.json({ success: true, data: updatedTask });
    } catch (error) {
        next(error);
    }
});

// 删除任务
router.delete('/:id', async (req, res, next) => {
    try {
        await taskService.deleteTask(req.params.id);
        res.json({ success: true, message: '任务已删除' });
    } catch (error) {
        next(error);
    }
});

// 抽取任务
router.post('/draw', async (req, res, next) => {
    try {
        const task = await taskService.drawTask();
        res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

// 开始任务
router.post('/:id/start', async (req, res, next) => {
    try {
        const { time_limit } = req.body;
        const timeLimit = parseInt(time_limit);
        
        if (!timeLimit || timeLimit < 1) {
            return res.status(400).json({ success: false, message: '时间限制必须大于0分钟' });
        }

        const task = await taskService.startTask(req.params.id, timeLimit);
        res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

// 完成任务
router.post('/:id/complete', async (req, res, next) => {
    try {
        const result = await taskService.completeTask(req.params.id);
        res.json({
            success: true,
            task: result.task,
            hours_exceeded: result.hoursExceeded,
            lottery_eligible: result.lotteryEligible
        });
    } catch (error) {
        next(error);
    }
});

// 归档任务
router.post('/:id/archive', async (req, res, next) => {
    try {
        const task = await taskService.archiveTask(req.params.id);
        res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

