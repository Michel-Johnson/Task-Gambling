// 自定义确认对话框

let confirmDialog = null;
let confirmResolve = null;

// 创建确认对话框
function createConfirmDialog() {
    if (confirmDialog) return confirmDialog;
    
    const dialog = document.createElement('div');
    dialog.id = 'confirm-dialog';
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2 id="confirm-title">确认</h2>
            <p id="confirm-message"></p>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button class="btn btn-secondary" id="confirm-cancel">取消</button>
                <button class="btn btn-primary" id="confirm-ok">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 绑定事件
    dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
        dialog.classList.remove('active');
        if (confirmResolve) {
            confirmResolve(false);
            confirmResolve = null;
        }
    });
    
    dialog.querySelector('#confirm-ok').addEventListener('click', () => {
        dialog.classList.remove('active');
        if (confirmResolve) {
            confirmResolve(true);
            confirmResolve = null;
        }
    });
    
    // 点击背景关闭
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.classList.remove('active');
            if (confirmResolve) {
                confirmResolve(false);
                confirmResolve = null;
            }
        }
    });
    
    confirmDialog = dialog;
    return dialog;
}

// 显示确认对话框
function showConfirm(message, title = '确认') {
    return new Promise((resolve) => {
        const dialog = createConfirmDialog();
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        confirmResolve = resolve;
        dialog.classList.add('active');
    });
}

// 显示输入对话框
function showInputDialog(message, title = '输入') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2>${escapeHtml(title)}</h2>
                <p style="margin-bottom: 15px;">${escapeHtml(message)}</p>
                <div class="form-group">
                    <input type="text" id="input-dialog-value" class="form-group input" style="width: 100%; padding: 10px;" autofocus>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button class="btn btn-secondary" id="input-cancel">取消</button>
                    <button class="btn btn-primary" id="input-ok">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        dialog.classList.add('active');
        
        const input = dialog.querySelector('#input-dialog-value');
        input.focus();
        
        const handleOk = () => {
            const value = input.value.trim();
            dialog.remove();
            resolve(value || null);
        };
        
        const handleCancel = () => {
            dialog.remove();
            resolve(null);
        };
        
        dialog.querySelector('#input-ok').addEventListener('click', handleOk);
        dialog.querySelector('#input-cancel').addEventListener('click', handleCancel);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleOk();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                handleCancel();
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出到全局
window.showConfirm = showConfirm;
window.showInputDialog = showInputDialog;

