// 任务管理功能

let currentTask = null;
let taskTimer = null;

// 初始化任务管理
function initTaskManager() {
    // 创建任务表单
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', handleCreateTask);

    // 抽取任务按钮
    const drawBtn = document.getElementById('draw-task-btn');
    drawBtn.addEventListener('click', handleDrawTask);

    // 加载任务列表
    loadTasks();

    // 定时刷新任务列表
    setInterval(loadTasks, 5000);
}

// 创建任务
async function handleCreateTask(e) {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const weight = parseInt(document.getElementById('task-weight').value) || 1;

    if (!title) {
        showMessage('任务标题不能为空', 'error');
        return;
    }

    try {
        await apiRequest('/tasks', {
            method: 'POST',
            body: { title, description, weight }
        });

        showMessage('任务创建成功！', 'success');
        e.target.reset();
        loadTasks();
    } catch (error) {
        showMessage(error.message || '创建任务失败', 'error');
    }
}

// 加载任务列表
async function loadTasks() {
    try {
        const pendingTasks = await apiRequest('/tasks?status=pending');
        const inProgressTasks = await apiRequest('/tasks?status=in_progress');
        const completedTasks = await apiRequest('/tasks?status=completed');

        renderTasks('pending-tasks', pendingTasks.data, 'pending');
        renderTasks('in-progress-tasks', inProgressTasks.data, 'in_progress');
        renderTasks('completed-tasks', completedTasks.data, 'completed');

        // 更新抽取按钮状态
        const drawBtn = document.getElementById('draw-task-btn');
        drawBtn.disabled = pendingTasks.data.length === 0;
    } catch (error) {
        console.error('加载任务失败:', error);
    }
}

// 渲染任务列表
function renderTasks(containerId, tasks, status) {
    const container = document.getElementById(containerId);
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>暂无任务</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => createTaskCard(task, status)).join('');

    // 绑定事件
    tasks.forEach(task => {
        if (status === 'pending') {
            const editBtn = document.getElementById(`edit-task-${task.id}`);
            const deleteBtn = document.getElementById(`delete-task-${task.id}`);
            if (editBtn) editBtn.addEventListener('click', () => handleEditTask(task));
            if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));
        } else if (status === 'in_progress') {
            const completeBtn = document.getElementById(`complete-task-${task.id}`);
            if (completeBtn) completeBtn.addEventListener('click', () => handleCompleteTask(task));
            startTaskTimer(task);
        } else if (status === 'completed') {
            const archiveBtn = document.getElementById(`archive-task-${task.id}`);
            if (archiveBtn) archiveBtn.addEventListener('click', () => handleArchiveTask(task.id));
        }
    });
}

// 创建任务卡片
function createTaskCard(task, status) {
    const statusLabels = {
        pending: '待抽取',
        in_progress: '进行中',
        completed: '已完成',
        archived: '已归档'
    };

    let actions = '';
    
    if (status === 'pending') {
        actions = `
            <div class="task-actions">
                <button class="btn btn-secondary btn-small" id="edit-task-${task.id}">编辑</button>
                <button class="btn btn-danger btn-small" id="delete-task-${task.id}">删除</button>
            </div>
        `;
    } else if (status === 'in_progress') {
        const timerId = `timer-${task.id}`;
        actions = `
            <div class="timer-display" id="${timerId}">计算中...</div>
            <div class="task-actions">
                <button class="btn btn-success btn-small" id="complete-task-${task.id}">完成任务</button>
            </div>
        `;
    } else if (status === 'completed') {
        actions = `
            <div class="task-actions">
                <button class="btn btn-secondary btn-small" id="archive-task-${task.id}">归档</button>
            </div>
        `;
    }

    return `
        <div class="task-card">
            <div class="task-meta">
                <span class="status-badge status-${status}">${statusLabels[status]}</span>
                <span class="weight-badge">权重: ${task.weight}</span>
            </div>
            <h3>${escapeHtml(task.title)}</h3>
            ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
            ${actions}
        </div>
    `;
}

// 抽取任务
async function handleDrawTask() {
    try {
        const result = await apiRequest('/tasks/draw', {
            method: 'POST'
        });

        if (result.success && result.data) {
            showDrawAnimation(result.data);
        }
    } catch (error) {
        showMessage(error.message || '抽取任务失败', 'error');
    }
}

// 显示抽取动画
function showDrawAnimation(selectedTask) {
    const modal = document.getElementById('draw-modal');
    const animationContainer = document.getElementById('draw-animation');
    const resultContainer = document.getElementById('draw-result');
    
    modal.classList.add('active');
    resultContainer.innerHTML = '';

    // 获取所有待抽取任务
    apiRequest('/tasks?status=pending').then(response => {
        const tasks = response.data;
        
        if (tasks.length === 0) {
            modal.classList.remove('active');
            return;
        }

        // 创建动画元素
        animationContainer.innerHTML = tasks.map(task => 
            `<div class="draw-item" data-id="${task.id}">${escapeHtml(task.title)}</div>`
        ).join('');

        const items = animationContainer.querySelectorAll('.draw-item');
        let currentIndex = 0;
        let speed = 50; // 初始速度（毫秒）
        const minSpeed = 300; // 最终速度
        const acceleration = 1.1; // 加速度

        function highlightNext() {
            // 移除所有高亮
            items.forEach(item => item.classList.remove('highlight'));

            // 高亮当前项
            if (items[currentIndex]) {
                items[currentIndex].classList.add('highlight');
            }

            // 移动到下一项
            currentIndex = (currentIndex + 1) % items.length;

            // 逐渐减速
            if (speed < minSpeed) {
                speed *= acceleration;
            }

            // 检查是否到达目标
            const selectedIndex = tasks.findIndex(t => t.id === selectedTask.id);
            const distance = Math.abs(currentIndex - selectedIndex);
            
            if (distance === 0 && speed >= minSpeed * 0.9) {
                // 停在选中的任务上
                items[selectedIndex].classList.add('highlight');
                showDrawResult(selectedTask);
                return;
            }

            setTimeout(highlightNext, speed);
        }

        highlightNext();
    });
}

// 显示抽取结果
function showDrawResult(task) {
    const resultContainer = document.getElementById('draw-result');
    resultContainer.innerHTML = `
        <h3>🎯 抽中任务：${escapeHtml(task.title)}</h3>
        <p>${task.description ? escapeHtml(task.description) : '无描述'}</p>
        <button class="btn btn-primary" onclick="startSelectedTask(${task.id})">开始任务</button>
        <button class="btn btn-secondary" onclick="closeDrawModal()">取消</button>
    `;
}

// 开始选中的任务
async function startSelectedTask(taskId) {
    closeDrawModal();
    
    // 显示时间设定模态框
    const modal = document.getElementById('time-limit-modal');
    modal.classList.add('active');
    
    const form = document.getElementById('time-limit-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const timeLimit = parseInt(document.getElementById('time-limit').value);
        
        try {
            await apiRequest(`/tasks/${taskId}/start`, {
                method: 'POST',
                body: { time_limit: timeLimit }
            });
            
            modal.classList.remove('active');
            showMessage('任务已开始！', 'success');
            loadTasks();
        } catch (error) {
            showMessage(error.message || '开始任务失败', 'error');
        }
    };
}

// 关闭抽取模态框
function closeDrawModal() {
    document.getElementById('draw-modal').classList.remove('active');
}

// 完成任务
async function handleCompleteTask(task) {
    if (!confirm('确定要完成任务吗？完成后将获得抽奖机会！')) {
        return;
    }

    try {
        const result = await apiRequest(`/tasks/${task.id}/complete`, {
            method: 'POST'
        });

        if (result.success) {
            showMessage('任务完成！', 'success');
            loadTasks();
            
            // 如果符合抽奖条件，显示抽奖界面
            if (result.lottery_eligible) {
                setTimeout(() => {
                    showLotteryModal(task.id, result.hours_exceeded);
                }, 1000);
            }
        }
    } catch (error) {
        showMessage(error.message || '完成任务失败', 'error');
    }
}

// 归档任务
async function handleArchiveTask(taskId) {
    try {
        await apiRequest(`/tasks/${taskId}/archive`, {
            method: 'POST'
        });
        
        showMessage('任务已归档', 'success');
        loadTasks();
    } catch (error) {
        showMessage(error.message || '归档任务失败', 'error');
    }
}

// 编辑任务
async function handleEditTask(task) {
    const newTitle = prompt('输入新标题:', task.title);
    if (!newTitle) return;

    const newDescription = prompt('输入新描述:', task.description || '');
    const newWeight = prompt('输入新权重:', task.weight);
    
    if (!newWeight || isNaN(newWeight) || parseInt(newWeight) < 1) {
        showMessage('权重必须大于0', 'error');
        return;
    }

    try {
        await apiRequest(`/tasks/${task.id}`, {
            method: 'PUT',
            body: {
                title: newTitle,
                description: newDescription,
                weight: parseInt(newWeight)
            }
        });
        
        showMessage('任务已更新', 'success');
        loadTasks();
    } catch (error) {
        showMessage(error.message || '更新任务失败', 'error');
    }
}

// 删除任务
async function handleDeleteTask(taskId) {
    if (!confirm('确定要删除这个任务吗？')) {
        return;
    }

    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        showMessage('任务已删除', 'success');
        loadTasks();
    } catch (error) {
        showMessage(error.message || '删除任务失败', 'error');
    }
}

// 启动任务计时器
function startTaskTimer(task) {
    if (!task.started_at || !task.time_limit) return;

    const timerId = `timer-${task.id}`;
    const timerEl = document.getElementById(timerId);
    if (!timerEl) return;

    function updateTimer() {
        const startedAt = new Date(task.started_at);
        const now = new Date();
        const elapsed = (now - startedAt) / 1000 / 60; // 分钟
        const remaining = task.time_limit - elapsed;

        if (remaining <= 0) {
            timerEl.textContent = '已超时';
            timerEl.className = 'timer-display timer-danger';
            return;
        }

        const hours = Math.floor(remaining / 60);
        const minutes = Math.floor(remaining % 60);
        timerEl.textContent = `剩余: ${hours}小时 ${minutes}分钟`;

        if (remaining < 60) {
            timerEl.className = 'timer-display timer-danger';
        } else if (remaining < 120) {
            timerEl.className = 'timer-display timer-warning';
        } else {
            timerEl.className = 'timer-display';
        }
    }

    updateTimer();
    setInterval(updateTimer, 60000); // 每分钟更新一次
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出到全局
window.startSelectedTask = startSelectedTask;
window.closeDrawModal = closeDrawModal;

// 初始化
document.addEventListener('DOMContentLoaded', initTaskManager);

