const { dbRun, dbGet, dbAll } = require('../config/database');

class TaskService {
    // 获取所有任务
    async getAllTasks(status = null) {
        let sql = 'SELECT * FROM tasks';
        const params = [];
        
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY created_at DESC';
        return await dbAll(sql, params);
    }

    // 根据ID获取任务
    async getTaskById(id) {
        const sql = 'SELECT * FROM tasks WHERE id = ?';
        return await dbGet(sql, [id]);
    }

    // 创建任务
    async createTask(title, description, weight) {
        const sql = `INSERT INTO tasks (title, description, weight) 
                     VALUES (?, ?, ?)`;
        const result = await dbRun(sql, [title, description, weight]);
        return await this.getTaskById(result.id);
    }

    // 更新任务
    async updateTask(id, updates) {
        const allowedFields = ['title', 'description', 'weight'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('没有可更新的字段');
        }

        values.push(id);
        const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
        await dbRun(sql, values);
        return await this.getTaskById(id);
    }

    // 删除任务
    async deleteTask(id) {
        const sql = 'DELETE FROM tasks WHERE id = ?';
        await dbRun(sql, [id]);
        return { success: true };
    }

    // 获取待抽取的任务（pending状态）
    async getPendingTasks() {
        const sql = 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC';
        return await dbAll(sql, ['pending']);
    }

    // 权重抽取任务
    async drawTask() {
        const tasks = await this.getPendingTasks();
        
        if (tasks.length === 0) {
            throw new Error('没有可抽取的任务');
        }

        // 计算总权重
        const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
        
        if (totalWeight === 0) {
            throw new Error('所有任务权重为0');
        }

        // 生成随机数
        const random = Math.random() * totalWeight;
        
        // 找到对应的任务
        let currentWeight = 0;
        let selectedTask = null;
        
        for (const task of tasks) {
            currentWeight += task.weight;
            if (random <= currentWeight) {
                selectedTask = task;
                break;
            }
        }

        // 如果没找到（边界情况），返回最后一个
        if (!selectedTask) {
            selectedTask = tasks[tasks.length - 1];
        }

        return selectedTask;
    }

    // 开始任务（设定时间限制）
    async startTask(id, timeLimit) {
        const sql = `UPDATE tasks 
                     SET status = ?, started_at = CURRENT_TIMESTAMP, time_limit = ?
                     WHERE id = ?`;
        await dbRun(sql, ['in_progress', timeLimit, id]);
        return await this.getTaskById(id);
    }

    // 完成任务
    async completeTask(id) {
        const task = await this.getTaskById(id);
        
        if (!task) {
            throw new Error('任务不存在');
        }

        if (task.status !== 'in_progress') {
            throw new Error('任务状态不正确');
        }

        // 计算超时小时数
        const completedAt = new Date();
        const startedAt = new Date(task.started_at);
        const timeLimit = task.time_limit || 0;
        
        const elapsedMinutes = (completedAt - startedAt) / (1000 * 60);
        const hoursExceeded = Math.max(0, Math.ceil((elapsedMinutes - timeLimit) / 60));

        // 更新任务状态
        const sql = `UPDATE tasks 
                     SET status = ?, completed_at = CURRENT_TIMESTAMP
                     WHERE id = ?`;
        await dbRun(sql, ['completed', id]);
        
        const updatedTask = await this.getTaskById(id);
        
        return {
            task: updatedTask,
            hoursExceeded: hoursExceeded,
            lotteryEligible: true
        };
    }

    // 归档任务
    async archiveTask(id) {
        const sql = `UPDATE tasks 
                     SET status = ?, archived_at = CURRENT_TIMESTAMP
                     WHERE id = ?`;
        await dbRun(sql, ['archived', id]);
        return await this.getTaskById(id);
    }
}

module.exports = new TaskService();

