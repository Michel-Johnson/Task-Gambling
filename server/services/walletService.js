const { dbRun, dbGet, dbAll } = require('../config/database');

class WalletService {
    // 获取钱包余额
    async getBalance() {
        const sql = 'SELECT amount FROM wallet WHERE id = 1';
        const result = await dbGet(sql);
        return result ? result.amount : 0;
    }

    // 增加余额
    async addBalance(amount, description = '', lotteryRecordId = null) {
        if (amount <= 0) {
            throw new Error('金额必须大于0');
        }

        // 更新钱包余额
        const updateSql = `UPDATE wallet 
                          SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP 
                          WHERE id = 1`;
        await dbRun(updateSql, [amount]);

        // 记录交易
        const transactionSql = `INSERT INTO wallet_transactions 
                                (amount, type, description, lottery_record_id)
                                VALUES (?, 'income', ?, ?)`;
        await dbRun(transactionSql, [amount, description, lotteryRecordId]);

        return await this.getBalance();
    }

    // 减少余额（用于提现等）
    async subtractBalance(amount, description = '') {
        const balance = await this.getBalance();
        
        if (amount <= 0) {
            throw new Error('金额必须大于0');
        }

        if (balance < amount) {
            throw new Error('余额不足');
        }

        // 更新钱包余额
        const updateSql = `UPDATE wallet 
                          SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP 
                          WHERE id = 1`;
        await dbRun(updateSql, [amount]);

        // 记录交易
        const transactionSql = `INSERT INTO wallet_transactions 
                                (amount, type, description)
                                VALUES (?, 'expense', ?)`;
        await dbRun(transactionSql, [amount, description]);

        return await this.getBalance();
    }

    // 获取交易记录
    async getTransactions(limit = 50) {
        const sql = `SELECT * FROM wallet_transactions 
                     ORDER BY created_at DESC 
                     LIMIT ?`;
        return await dbAll(sql, [limit]);
    }
}

module.exports = new WalletService();

