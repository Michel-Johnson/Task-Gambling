const { dbRun, dbGet, dbAll } = require('../config/database');
const taskService = require('./taskService');

class LotteryService {
    // 计算无奖概率
    calculateNoPrizeProbability(hoursExceeded) {
        // 每超出一小时，无奖几率增大10%
        return Math.min(hoursExceeded * 0.1, 1.0); // 最大100%
    }

    // 权重随机选择
    weightedRandomSelect(items) {
        if (items.length === 0) {
            return null;
        }

        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        
        if (totalWeight === 0) {
            return null;
        }

        const random = Math.random() * totalWeight;
        let currentWeight = 0;

        for (const item of items) {
            currentWeight += item.weight;
            if (random <= currentWeight) {
                return item;
            }
        }

        return items[items.length - 1];
    }

    // 获取所有活跃奖品
    async getActivePrizes() {
        const sql = 'SELECT * FROM prizes WHERE is_active = 1 ORDER BY created_at DESC';
        return await dbAll(sql);
    }

    // 执行抽奖
    async drawLottery(taskId, hoursExceeded) {
        const noPrizeProb = this.calculateNoPrizeProbability(hoursExceeded);
        
        // 先判断是否无奖
        if (Math.random() < noPrizeProb) {
            // 记录未中奖
            await this.recordLottery(taskId, null, hoursExceeded, noPrizeProb);
            return {
                prize: null,
                noPrizeProbability: noPrizeProb
            };
        }

        // 从奖品池中按权重抽取
        const prizes = await this.getActivePrizes();
        
        if (prizes.length === 0) {
            await this.recordLottery(taskId, null, hoursExceeded, noPrizeProb);
            return {
                prize: null,
                noPrizeProbability: noPrizeProb,
                message: '没有可抽取的奖品'
            };
        }

        const selectedPrize = this.weightedRandomSelect(prizes);
        
        // 记录抽奖结果
        await this.recordLottery(taskId, selectedPrize.id, hoursExceeded, noPrizeProb);
        
        return {
            prize: selectedPrize,
            noPrizeProbability: noPrizeProb
        };
    }

    // 记录抽奖结果
    async recordLottery(taskId, prizeId, hoursExceeded, noPrizeProb) {
        const sql = `INSERT INTO lottery_records 
                     (task_id, prize_id, time_exceeded, no_prize_probability)
                     VALUES (?, ?, ?, ?)`;
        await dbRun(sql, [taskId, prizeId, hoursExceeded, noPrizeProb]);
    }

    // 获取抽奖历史
    async getLotteryHistory(limit = 50) {
        const sql = `SELECT lr.*, t.title as task_title, p.name as prize_name, p.description as prize_description
                     FROM lottery_records lr
                     LEFT JOIN tasks t ON lr.task_id = t.id
                     LEFT JOIN prizes p ON lr.prize_id = p.id
                     ORDER BY lr.draw_time DESC
                     LIMIT ?`;
        return await dbAll(sql, [limit]);
    }
}

module.exports = new LotteryService();

