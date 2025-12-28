// 抽奖功能

// 显示抽奖模态框
async function showLotteryModal(taskId, hoursExceeded) {
    const modal = document.getElementById('lottery-modal');
    const animationContainer = document.getElementById('lottery-animation');
    const resultContainer = document.getElementById('lottery-result');
    
    modal.classList.add('active');
    resultContainer.innerHTML = '';

    try {
        // 获取所有奖品
        const prizesResponse = await apiRequest('/prizes');
        const prizes = prizesResponse.data.filter(p => p.is_active);

        if (prizes.length === 0) {
            resultContainer.innerHTML = `
                <h3>😔 没有可抽取的奖品</h3>
                <p>请先创建一些奖品！</p>
                <button class="btn btn-primary" onclick="closeLotteryModal()">确定</button>
            `;
            return;
        }

        // 创建动画元素
        animationContainer.innerHTML = prizes.map(prize => 
            `<div class="lottery-item" data-id="${prize.id}">
                <div>${escapeHtml(prize.name)}</div>
                <div style="font-size: 0.8rem; margin-top: 5px;">权重: ${prize.weight}</div>
            </div>`
        ).join('');

        // 添加"未中奖"选项
        const noPrizeItem = document.createElement('div');
        noPrizeItem.className = 'lottery-item';
        noPrizeItem.textContent = '再接再厉';
        noPrizeItem.dataset.id = 'none';
        animationContainer.appendChild(noPrizeItem);

        // 执行抽奖
        const lotteryResult = await apiRequest('/lottery/draw', {
            method: 'POST',
            body: {
                task_id: taskId,
                hours_exceeded: hoursExceeded
            }
        });

        // 开始动画
        startLotteryAnimation(lotteryResult, prizes);
    } catch (error) {
        console.error('抽奖失败:', error);
        showMessage(error.message || '抽奖失败', 'error');
        closeLotteryModal();
    }
}

// 开始抽奖动画
function startLotteryAnimation(lotteryResult, prizes) {
    const animationContainer = document.getElementById('lottery-animation');
    const resultContainer = document.getElementById('lottery-result');
    const items = animationContainer.querySelectorAll('.lottery-item');
    
    let currentIndex = 0;
    let speed = 30; // 初始速度（毫秒）
    const minSpeed = 200; // 最终速度
    const acceleration = 1.05; // 加速度
    let iterations = 0;
    const maxIterations = 50; // 至少转50次

    // 确定目标索引
    let targetIndex = 0;
    if (lotteryResult.prize) {
        targetIndex = Array.from(items).findIndex(item => 
            item.dataset.id == lotteryResult.prize.id
        );
    } else {
        // 未中奖，停在"再接再厉"
        targetIndex = items.length - 1;
    }

    function highlightNext() {
        // 移除所有高亮
        items.forEach(item => item.classList.remove('highlight'));

        // 高亮当前项
        if (items[currentIndex]) {
            items[currentIndex].classList.add('highlight');
        }

        // 移动到下一项
        currentIndex = (currentIndex + 1) % items.length;
        iterations++;

        // 逐渐减速
        if (speed < minSpeed) {
            speed *= acceleration;
        }

        // 检查是否到达目标
        const distance = Math.abs(currentIndex - targetIndex);
        const shouldStop = iterations >= maxIterations && 
                          (distance === 0 || (distance === 1 && speed >= minSpeed * 0.95));

        if (shouldStop) {
            // 停在目标上
            items[targetIndex].classList.add('highlight');
            showLotteryResult(lotteryResult);
            return;
        }

        setTimeout(highlightNext, speed);
    }

    highlightNext();
}

// 显示抽奖结果
function showLotteryResult(lotteryResult) {
    const resultContainer = document.getElementById('lottery-result');
    
    if (lotteryResult.prize) {
        let walletMessage = '';
        if (lotteryResult.walletAdded) {
            walletMessage = `
                <div style="background: var(--success-color); color: white; padding: 10px; border-radius: 8px; margin-top: 15px;">
                    💰 金钱已自动存入钱包！
                </div>
            `;
        }
        
        resultContainer.innerHTML = `
            <h3>🎉 恭喜中奖！</h3>
            <div class="prize-name">${escapeHtml(lotteryResult.prize.name)}</div>
            ${lotteryResult.prize.description ? 
                `<p style="margin-top: 10px; color: var(--text-light);">${escapeHtml(lotteryResult.prize.description)}</p>` : ''}
            ${walletMessage}
            <button class="btn btn-primary" onclick="closeLotteryModal(); if(window.loadWalletBalance) loadWalletBalance();" style="margin-top: 20px;">太棒了！</button>
        `;
    } else {
        resultContainer.innerHTML = `
            <h3>😔 很遗憾</h3>
            <div class="no-prize">这次没有中奖，再接再厉！</div>
            ${lotteryResult.no_prize_probability > 0 ? 
                `<p style="margin-top: 10px; color: var(--text-light); font-size: 0.9rem;">
                    无奖概率: ${(lotteryResult.no_prize_probability * 100).toFixed(1)}%
                </p>` : ''}
            <button class="btn btn-primary" onclick="closeLotteryModal()" style="margin-top: 20px;">继续努力</button>
        `;
    }
}

// 关闭抽奖模态框
function closeLotteryModal() {
    document.getElementById('lottery-modal').classList.remove('active');
}

// 加载抽奖历史
async function loadLotteryHistory() {
    try {
        const response = await apiRequest('/lottery/history?limit=50');
        renderLotteryHistory(response.data);
    } catch (error) {
        console.error('加载抽奖历史失败:', error);
    }
}

// 渲染抽奖历史
function renderLotteryHistory(history) {
    const container = document.getElementById('lottery-history');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>暂无抽奖记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = history.map(record => {
        const date = new Date(record.draw_time);
        const dateStr = date.toLocaleString('zh-CN');
        
        return `
            <div class="history-item">
                <div class="history-item-info">
                    <h4>${escapeHtml(record.task_title || '未知任务')}</h4>
                    <p>${dateStr}</p>
                    ${record.time_exceeded > 0 ? 
                        `<p style="color: var(--warning-color);">超时 ${record.time_exceeded} 小时</p>` : ''}
                </div>
                <div class="${record.prize_name ? 'history-item-prize' : 'history-item-no-prize'}">
                    ${record.prize_name ? `🎁 ${escapeHtml(record.prize_name)}` : '😔 未中奖'}
                </div>
            </div>
        `;
    }).join('');
}

// HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出到全局
window.showLotteryModal = showLotteryModal;
window.closeLotteryModal = closeLotteryModal;
window.loadLotteryHistory = loadLotteryHistory;

// 当切换到历史标签页时加载历史
document.addEventListener('DOMContentLoaded', () => {
    const historyTab = document.querySelector('[data-tab="history"]');
    if (historyTab) {
        historyTab.addEventListener('click', loadLotteryHistory);
    }
});

