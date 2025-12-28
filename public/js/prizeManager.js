// 奖品管理功能

// 初始化奖品管理
function initPrizeManager() {
    // 创建奖品表单
    const prizeForm = document.getElementById('prize-form');
    prizeForm.addEventListener('submit', handleCreatePrize);

    // 加载奖品列表
    loadPrizes();

    // 定时刷新奖品列表
    setInterval(loadPrizes, 10000);
}

// 创建奖品
async function handleCreatePrize(e) {
    e.preventDefault();

    const name = document.getElementById('prize-name').value.trim();
    const description = document.getElementById('prize-description').value.trim();
    const weight = parseInt(document.getElementById('prize-weight').value) || 1;

    if (!name) {
        showMessage('奖品名称不能为空', 'error');
        return;
    }

    try {
        await apiRequest('/prizes', {
            method: 'POST',
            body: { name, description, weight }
        });

        showMessage('奖品创建成功！', 'success');
        e.target.reset();
        loadPrizes();
    } catch (error) {
        showMessage(error.message || '创建奖品失败', 'error');
    }
}

// 加载奖品列表
async function loadPrizes() {
    try {
        const response = await apiRequest('/prizes');
        renderPrizes(response.data);
    } catch (error) {
        console.error('加载奖品失败:', error);
    }
}

// 渲染奖品列表
function renderPrizes(prizes) {
    const container = document.getElementById('prizes-list');
    
    // 只显示活跃的奖品
    const activePrizes = prizes.filter(p => p.is_active);
    
    if (activePrizes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎁</div>
                <p>暂无奖品，创建一些奖品来激励自己吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = activePrizes.map(prize => createPrizeCard(prize)).join('');

    // 绑定事件
    activePrizes.forEach(prize => {
        const editBtn = document.getElementById(`edit-prize-${prize.id}`);
        const deleteBtn = document.getElementById(`delete-prize-${prize.id}`);
        
        if (editBtn) editBtn.addEventListener('click', () => handleEditPrize(prize));
        if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeletePrize(prize.id));
    });
}

// 创建奖品卡片
function createPrizeCard(prize) {
    return `
        <div class="prize-card">
            <div class="task-meta">
                <span class="weight-badge">权重: ${prize.weight}</span>
            </div>
            <h3>${escapeHtml(prize.name)}</h3>
            ${prize.description ? `<p>${escapeHtml(prize.description)}</p>` : ''}
            <div class="task-actions">
                <button class="btn btn-secondary btn-small" id="edit-prize-${prize.id}">编辑</button>
                <button class="btn btn-danger btn-small" id="delete-prize-${prize.id}">删除</button>
            </div>
        </div>
    `;
}

// 编辑奖品
async function handleEditPrize(prize) {
    const newName = prompt('输入新名称:', prize.name);
    if (!newName) return;

    const newDescription = prompt('输入新描述:', prize.description || '');
    const newWeight = prompt('输入新权重:', prize.weight);
    
    if (!newWeight || isNaN(newWeight) || parseInt(newWeight) < 1) {
        showMessage('权重必须大于0', 'error');
        return;
    }

    try {
        await apiRequest(`/prizes/${prize.id}`, {
            method: 'PUT',
            body: {
                name: newName,
                description: newDescription,
                weight: parseInt(newWeight)
            }
        });
        
        showMessage('奖品已更新', 'success');
        loadPrizes();
    } catch (error) {
        showMessage(error.message || '更新奖品失败', 'error');
    }
}

// 删除奖品
async function handleDeletePrize(prizeId) {
    if (!confirm('确定要删除这个奖品吗？')) {
        return;
    }

    try {
        await apiRequest(`/prizes/${prizeId}`, {
            method: 'DELETE'
        });
        
        showMessage('奖品已删除', 'success');
        loadPrizes();
    } catch (error) {
        showMessage(error.message || '删除奖品失败', 'error');
    }
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 初始化
document.addEventListener('DOMContentLoaded', initPrizeManager);

