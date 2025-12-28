// 钱包管理功能

// 初始化钱包管理
function initWallet() {
    // 刷新余额按钮
    const refreshBtn = document.getElementById('refresh-wallet-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadWalletBalance);
    }

    // 查看交易记录按钮
    const viewTransactionsBtn = document.getElementById('view-transactions-btn');
    if (viewTransactionsBtn) {
        viewTransactionsBtn.addEventListener('click', loadWalletTransactions);
    }

    // 提现按钮
    const withdrawBtn = document.getElementById('withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', showWithdrawModal);
    }

    // 加载钱包余额
    loadWalletBalance();
    loadWalletTransactions();
}

// 显示提现模态框
async function showWithdrawModal() {
    // 使用自定义输入对话框
    const amount = await showInputDialog('请输入提现金额：', '提现');
    if (!amount) return;
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        showMessage('请输入有效的金额', 'error');
        return;
    }

    const confirmed = await showConfirm(`确定要提现 ¥${withdrawAmount.toFixed(2)} 吗？`, '提现确认');
    if (!confirmed) return;

    handleWithdraw(withdrawAmount);
}

// 处理提现
async function handleWithdraw(amount) {
    try {
        await apiRequest('/wallet/subtract', {
            method: 'POST',
            body: {
                amount: amount,
                description: '提现'
            }
        });
        
        showMessage(`成功提现 ¥${amount.toFixed(2)}`, 'success');
        loadWalletBalance();
        loadWalletTransactions();
    } catch (error) {
        showMessage(error.message || '提现失败', 'error');
    }
}

// 加载钱包余额
async function loadWalletBalance() {
    try {
        const response = await apiRequest('/wallet/balance');
        const balance = response.data.balance || 0;
        const balanceEl = document.getElementById('wallet-balance');
        if (balanceEl) {
            balanceEl.textContent = `¥${balance.toFixed(2)}`;
            balanceEl.style.color = balance > 0 ? 'var(--success-color)' : 'var(--text-color)';
        }
    } catch (error) {
        console.error('加载钱包余额失败:', error);
        const balanceEl = document.getElementById('wallet-balance');
        if (balanceEl) {
            balanceEl.textContent = '加载失败';
        }
    }
}

// 加载交易记录
async function loadWalletTransactions() {
    try {
        const response = await apiRequest('/wallet/transactions?limit=50');
        renderWalletTransactions(response.data);
    } catch (error) {
        console.error('加载交易记录失败:', error);
    }
}

// 渲染交易记录
function renderWalletTransactions(transactions) {
    const container = document.getElementById('wallet-transactions');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <p>暂无交易记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.created_at);
        const dateStr = date.toLocaleString('zh-CN');
        const isIncome = transaction.type === 'income';
        const amount = parseFloat(transaction.amount);
        
        return `
            <div class="history-item">
                <div class="history-item-info">
                    <h4 style="color: ${isIncome ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${isIncome ? '+' : '-'}¥${amount.toFixed(2)}
                    </h4>
                    <p>${transaction.description || '无描述'}</p>
                    <p style="color: var(--text-light); font-size: 0.875rem;">${dateStr}</p>
                </div>
                <div class="${isIncome ? 'history-item-prize' : 'history-item-no-prize'}">
                    ${isIncome ? '收入' : '支出'}
                </div>
            </div>
        `;
    }).join('');
}

// 导出到全局
window.loadWalletBalance = loadWalletBalance;
window.loadWalletTransactions = loadWalletTransactions;

// 当切换到钱包标签页时加载
document.addEventListener('DOMContentLoaded', () => {
    const walletTab = document.querySelector('[data-tab="wallet"]');
    if (walletTab) {
        walletTab.addEventListener('click', () => {
            loadWalletBalance();
            loadWalletTransactions();
        });
    }
    
    initWallet();
});

