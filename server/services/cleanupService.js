const { dbRun, dbAll } = require('../config/database');

class CleanupService {
    // 清理30天前的归档任务
    async cleanArchivedTasks() {
        const sql = `DELETE FROM tasks 
                     WHERE status = 'archived' 
                     AND archived_at < datetime('now', '-30 days')`;
        
        const result = await dbRun(sql);
        console.log(`清理了 ${result.changes} 个过期任务`);
        return result.changes;
    }

    // 获取即将过期的任务（用于提醒）
    async getExpiringTasks(days = 7) {
        const sql = `SELECT * FROM tasks 
                     WHERE status = 'archived' 
                     AND archived_at < datetime('now', '-${30 - days} days')
                     AND archived_at >= datetime('now', '-30 days')`;
        return await dbAll(sql);
    }
}

module.exports = new CleanupService();

