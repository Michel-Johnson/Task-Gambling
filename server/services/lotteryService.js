const { dbRun, dbGet, dbAll } = require('../config/database');
const taskService = require('./taskService');
const walletService = require('./walletService');

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
        const lotteryRecord = await this.recordLottery(taskId, selectedPrize.id, hoursExceeded, noPrizeProb);
        
        // 检查是否是金钱类奖品，如果是则自动存入钱包
        let walletAdded = false;
        if (selectedPrize && this.isMoneyPrize(selectedPrize)) {
            const amount = this.extractMoneyAmount(selectedPrize);
            if (amount > 0) {
                await walletService.addBalance(
                    amount, 
                    `抽奖获得：${selectedPrize.name}`, 
                    lotteryRecord.id
                );
                walletAdded = true;
            }
        }
        
        return {
            prize: selectedPrize,
            noPrizeProbability: noPrizeProb,
            walletAdded: walletAdded
        };
    }

    // 记录抽奖结果
    async recordLottery(taskId, prizeId, hoursExceeded, noPrizeProb) {
        const sql = `INSERT INTO lottery_records 
                     (task_id, prize_id, time_exceeded, no_prize_probability)
                     VALUES (?, ?, ?, ?)`;
        const result = await dbRun(sql, [taskId, prizeId, hoursExceeded, noPrizeProb]);
        
        // 返回记录ID
        const record = await dbGet('SELECT * FROM lottery_records WHERE id = ?', [result.id]);
        return record;
    }

    // 判断是否是金钱类奖品
    isMoneyPrize(prize) {
        if (!prize || !prize.name) return false;
        
        const moneyKeywords = ['元', '¥', '￥', 'money', '现金', '金额', '钱'];
        const name = prize.name.toLowerCase();
        const description = (prize.description || '').toLowerCase();
        
        return moneyKeywords.some(keyword => 
            name.includes(keyword.toLowerCase()) || 
            description.includes(keyword.toLowerCase())
        );
    }

    // 从奖品名称或描述中提取金额
    extractMoneyAmount(prize) {
        const text = `${prize.name} ${prize.description || ''}`;
        // 匹配数字，支持小数点
        const matches = text.match(/(\d+\.?\d*)/g);
        
        if (matches && matches.length > 0) {
            // 取第一个匹配的数字
            return parseFloat(matches[0]);
        }
        
        return 0;
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

