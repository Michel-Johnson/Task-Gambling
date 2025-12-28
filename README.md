# 任务管理抽奖系统

一个基于Web的任务管理应用，通过权重系统随机抽取任务，完成任务后根据完成时间获得抽奖机会，激励用户高效完成任务。

## 功能特性

- ✅ **任务管理**：创建、编辑、删除任务，为任务分配权重
- 🎲 **权重抽取**：优雅的权重随机抽取机制
- ⏰ **时间管理**：为任务设定完成时限
- 🎁 **抽奖系统**：根据完成情况获得抽奖机会，奖品也有权重
- 🗑️ **回收站**：已完成任务自动归档，30天后清除

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript (原生)
- **数据库**: SQLite
- **定时任务**: node-cron

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（如果不存在）：

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/tasks.db
```

### 3. 启动应用

**开发模式（自动重启）：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 使用说明

### 创建任务

1. 在"任务管理"标签页中，填写任务标题、描述和权重
2. 权重越大，被抽中的概率越高
3. 点击"创建任务"按钮

### 抽取任务

1. 点击"🎲 抽取任务"按钮
2. 系统会通过动画展示抽取过程
3. 抽取到任务后，点击"开始任务"
4. 设定完成时间限制（分钟）

### 完成任务

1. 在"进行中的任务"中，可以看到当前任务和倒计时
2. 完成任务后，点击"完成任务"按钮
3. 如果按时完成，将获得抽奖机会
4. 如果超时，每超出一小时，无奖概率增加10%

### 抽奖

1. 完成任务后，系统会自动弹出抽奖界面
2. 奖品会通过动画展示
3. 中奖后可以查看奖品信息

### 管理奖品

1. 切换到"奖品管理"标签页
2. 创建奖品，设置名称、描述和权重
3. 权重越大，被抽中的概率越高

### 查看历史

1. 切换到"抽奖历史"标签页
2. 查看所有抽奖记录

## 项目结构

```
task-gambling/
├── server/                 # 后端代码
│   ├── app.js             # 主应用入口
│   ├── routes/            # 路由定义
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   ├── middleware/        # 中间件
│   └── config/            # 配置文件
├── public/                # 前端静态文件
│   ├── index.html         # 主页面
│   ├── css/               # 样式文件
│   └── js/                # JavaScript文件
├── data/                  # 数据库文件（自动创建）
├── package.json           # 项目配置
└── README.md             # 说明文档
```

## API接口

### 任务相关

- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks?status=pending` - 获取指定状态的任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `POST /api/tasks/draw` - 抽取任务
- `POST /api/tasks/:id/start` - 开始任务
- `POST /api/tasks/:id/complete` - 完成任务
- `POST /api/tasks/:id/archive` - 归档任务

### 奖品相关

- `GET /api/prizes` - 获取所有奖品
- `POST /api/prizes` - 创建奖品
- `PUT /api/prizes/:id` - 更新奖品
- `DELETE /api/prizes/:id` - 删除奖品

### 抽奖相关

- `POST /api/lottery/draw` - 执行抽奖
- `GET /api/lottery/history` - 获取抽奖历史

## 部署到Ubuntu服务器

### 1. 安装Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 安装PM2

```bash
sudo npm install -g pm2
```

### 3. 部署应用

```bash
# 上传项目文件到服务器
# 进入项目目录
cd /path/to/task-gambling

# 安装依赖
npm install

# 启动应用
pm2 start server/app.js --name task-gambling

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 配置Nginx（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 注意事项

1. 数据库文件会自动创建在 `data/tasks.db`
2. 定时清理任务每天凌晨2点执行
3. 归档的任务会在30天后自动删除
4. 建议定期备份数据库文件

## 许可证

MIT

