const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/tasks.db';

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('数据库连接失败:', err.message);
    } else {
        console.log('数据库连接成功');
        initDatabase();
    }
});

// 初始化数据库表
function initDatabase() {
    db.serialize(() => {
        // 创建任务表
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            weight INTEGER NOT NULL DEFAULT 1,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME,
            completed_at DATETIME,
            time_limit INTEGER,
            archived_at DATETIME
        )`);

        // 创建奖品表
        db.run(`CREATE TABLE IF NOT EXISTS prizes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            weight INTEGER NOT NULL DEFAULT 1,
            is_money BOOLEAN DEFAULT 0,
            money_amount REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )`);

        // 创建抽奖记录表
        db.run(`CREATE TABLE IF NOT EXISTS lottery_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            prize_id INTEGER,
            draw_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            time_exceeded INTEGER DEFAULT 0,
            no_prize_probability REAL,
            FOREIGN KEY (task_id) REFERENCES tasks(id),
            FOREIGN KEY (prize_id) REFERENCES prizes(id)
        )`);

        // 创建钱包表
        db.run(`CREATE TABLE IF NOT EXISTS wallet (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 创建钱包交易记录表
        db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            lottery_record_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lottery_record_id) REFERENCES lottery_records(id)
        )`);

        // 初始化钱包（如果不存在）
        db.run(`INSERT OR IGNORE INTO wallet (id, amount) VALUES (1, 0)`);

        // 数据库迁移：为已存在的表添加新字段
        migrateDatabase();

        console.log('数据库表初始化完成');
    });
}

// 数据库迁移函数
function migrateDatabase() {
    // 检查并添加prizes表的新字段
    db.all("PRAGMA table_info(prizes)", (err, rows) => {
        if (err) {
            console.error('检查表结构失败:', err);
            return;
        }
        
        if (!rows || rows.length === 0) {
            // 表不存在，会在CREATE TABLE中创建
            return;
        }
        
        // 检查字段是否存在
        const columns = rows.map(row => row.name);
        
        if (!columns.includes('is_money')) {
            db.run("ALTER TABLE prizes ADD COLUMN is_money BOOLEAN DEFAULT 0", (err) => {
                if (err) {
                    // 忽略已存在的错误
                    if (!err.message.includes('duplicate column')) {
                        console.error('添加is_money字段失败:', err);
                    }
                } else {
                    console.log('成功添加is_money字段');
                }
            });
        }
        
        if (!columns.includes('money_amount')) {
            db.run("ALTER TABLE prizes ADD COLUMN money_amount REAL", (err) => {
                if (err) {
                    // 忽略已存在的错误
                    if (!err.message.includes('duplicate column')) {
                        console.error('添加money_amount字段失败:', err);
                    }
                } else {
                    console.log('成功添加money_amount字段');
                }
            });
        }
    });
}

// 封装数据库操作为Promise
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

module.exports = {
    db,
    dbRun,
    dbGet,
    dbAll
};

