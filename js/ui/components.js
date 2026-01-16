// ============================================================
// 统一UI组件库 v4.0
// 提供全站统一的UI组件和交互模式
// ============================================================

const UIComponents = {
    // ==================== Toast通知 ====================
    
    toast: {
        show(type, title, message, duration = 3000) {
            const container = document.getElementById('toastContainer') || this.createContainer();
            
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    ${message ? `<div class="toast-message">${message}</div>` : ''}
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            container.appendChild(toast);
            
            // 动画入场
            requestAnimationFrame(() => toast.classList.add('show'));
            
            // 自动消失
            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
            
            return toast;
        },
        
        createContainer() {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        },
        
        success(title, message) { return this.show('success', title, message); },
        error(title, message) { return this.show('error', title, message); },
        warning(title, message) { return this.show('warning', title, message); },
        info(title, message) { return this.show('info', title, message); }
    },
    
    // ==================== 模态框 ====================
    
    modal: {
        show(options) {
            const { id, title, icon, content, footer, maxWidth = '450px', onClose } = options;
            
            // 移除已存在的同ID模态框
            const existing = document.getElementById(id);
            if (existing) existing.remove();
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = id;
            modal.innerHTML = `
                <div class="modal-content" style="max-width: ${maxWidth};">
                    <div class="modal-header">
                        ${icon ? `<span class="modal-icon">${icon}</span>` : ''}
                        <h2>${title}</h2>
                        <button class="modal-close-btn" data-close>×</button>
                    </div>
                    <div class="modal-body">${content}</div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            `;
            
            // 关闭事件
            modal.querySelector('[data-close]').onclick = () => this.close(id, onClose);
            modal.onclick = (e) => {
                if (e.target === modal) this.close(id, onClose);
            };
            
            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.classList.add('show'));
            
            return modal;
        },
        
        close(id, callback) {
            const modal = document.getElementById(id);
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    if (callback) callback();
                }, 300);
            }
        },
        
        confirm(title, message, onConfirm, onCancel) {
            return this.show({
                id: 'confirmModal',
                title,
                icon: '❓',
                content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
                footer: `
                    <button class="modal-btn btn-cancel" onclick="UIComponents.modal.close('confirmModal'); ${onCancel ? onCancel + '()' : ''}">取消</button>
                    <button class="modal-btn btn-confirm" onclick="UIComponents.modal.close('confirmModal'); ${onConfirm}()">确认</button>
                `
            });
        },
        
        alert(title, message, icon = 'ℹ️') {
            return this.show({
                id: 'alertModal',
                title,
                icon,
                content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
                footer: `<button class="modal-btn btn-confirm" onclick="UIComponents.modal.close('alertModal')">确定</button>`
            });
        }
    },
    
    // ==================== 加载状态 ====================
    
    loading: {
        show(message = '加载中...') {
            let overlay = document.getElementById('loadingOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.className = 'loading-overlay';
                document.body.appendChild(overlay);
            }
            
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `;
            overlay.classList.add('show');
        },
        
        hide() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
        },
        
        // 按钮加载状态
        setButtonLoading(btn, loading, text) {
            if (loading) {
                btn.dataset.originalText = btn.innerHTML;
                btn.innerHTML = '<span class="btn-spinner"></span>' + (text || '处理中...');
                btn.disabled = true;
            } else {
                btn.innerHTML = btn.dataset.originalText || text || btn.innerHTML;
                btn.disabled = false;
            }
        }
    },
    
    // ==================== 进度条 ====================
    
    progress: {
        create(container, value = 0, options = {}) {
            const { color = '#667eea', height = '8px', showText = true } = options;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'progress-wrapper';
            wrapper.innerHTML = `
                <div class="progress-bar" style="height: ${height};">
                    <div class="progress-fill" style="width: ${value}%; background: ${color};"></div>
                </div>
                ${showText ? `<div class="progress-text">${value}%</div>` : ''}
            `;
            
            if (typeof container === 'string') {
                document.querySelector(container)?.appendChild(wrapper);
            } else {
                container?.appendChild(wrapper);
            }
            
            return wrapper;
        },
        
        update(wrapper, value) {
            const fill = wrapper.querySelector('.progress-fill');
            const text = wrapper.querySelector('.progress-text');
            if (fill) fill.style.width = `${value}%`;
            if (text) text.textContent = `${Math.round(value)}%`;
        }
    },
    
    // ==================== 表单组件 ====================
    
    form: {
        // 创建输入框
        input(options) {
            const { id, label, type = 'text', value = '', placeholder = '', prefix, suffix } = options;
            
            let html = `<div class="form-group">`;
            if (label) html += `<label for="${id}">${label}</label>`;
            
            if (prefix || suffix) {
                html += `<div class="input-with-addon">`;
                if (prefix) html += `<span class="input-addon prefix">${prefix}</span>`;
                html += `<input type="${type}" id="${id}" value="${value}" placeholder="${placeholder}">`;
                if (suffix) html += `<span class="input-addon suffix">${suffix}</span>`;
                html += `</div>`;
            } else {
                html += `<input type="${type}" id="${id}" value="${value}" placeholder="${placeholder}">`;
            }
            
            html += `</div>`;
            return html;
        },
        
        // 创建选择框
        select(options) {
            const { id, label, value = '', items = [] } = options;
            
            let html = `<div class="form-group">`;
            if (label) html += `<label for="${id}">${label}</label>`;
            html += `<select id="${id}">`;
            
            items.forEach(item => {
                const val = typeof item === 'object' ? item.value : item;
                const text = typeof item === 'object' ? item.label : item;
                const selected = val === value ? 'selected' : '';
                html += `<option value="${val}" ${selected}>${text}</option>`;
            });
            
            html += `</select></div>`;
            return html;
        },
        
        // 创建开关
        toggle(options) {
            const { id, label, checked = false, onChange } = options;
            
            return `
                <div class="form-group toggle-group">
                    <span class="toggle-label">${label}</span>
                    <div class="toggle-switch ${checked ? 'active' : ''}" 
                         id="${id}" 
                         onclick="UIComponents.form.handleToggle('${id}'${onChange ? `, ${onChange}` : ''})">
                    </div>
                </div>
            `;
        },
        
        handleToggle(id, callback) {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.classList.toggle('active');
                if (callback) callback(toggle.classList.contains('active'));
            }
        }
    },
    
    // ==================== 卡片组件 ====================
    
    card: {
        create(options) {
            const { title, icon, content, actions, className = '' } = options;
            
            return `
                <div class="ui-card ${className}">
                    ${title ? `
                        <div class="card-header">
                            ${icon ? `<span class="card-icon">${icon}</span>` : ''}
                            <span class="card-title">${title}</span>
                        </div>
                    ` : ''}
                    <div class="card-body">${content}</div>
                    ${actions ? `<div class="card-actions">${actions}</div>` : ''}
                </div>
            `;
        },
        
        stat(options) {
            const { label, value, icon, trend, color = '' } = options;
            
            return `
                <div class="stat-card ${color}">
                    ${icon ? `<span class="stat-icon">${icon}</span>` : ''}
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                    ${trend ? `<div class="stat-trend ${trend > 0 ? 'up' : 'down'}">${trend > 0 ? '↑' : '↓'} ${Math.abs(trend)}%</div>` : ''}
                </div>
            `;
        }
    },
    
    // ==================== 列表组件 ====================
    
    list: {
        create(items, options = {}) {
            const { emptyText = '暂无数据', className = '' } = options;
            
            if (!items || items.length === 0) {
                return `<div class="list-empty">${emptyText}</div>`;
            }
            
            return `
                <div class="ui-list ${className}">
                    ${items.map(item => `
                        <div class="list-item ${item.className || ''}" ${item.onClick ? `onclick="${item.onClick}"` : ''}>
                            ${item.icon ? `<span class="item-icon">${item.icon}</span>` : ''}
                            <div class="item-content">
                                <div class="item-title">${item.title}</div>
                                ${item.subtitle ? `<div class="item-subtitle">${item.subtitle}</div>` : ''}
                            </div>
                            ${item.action ? `<div class="item-action">${item.action}</div>` : ''}
                            ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },
    
    // ==================== 标签页 ====================
    
    tabs: {
        create(options) {
            const { id, tabs, activeTab = 0, onChange } = options;
            
            return `
                <div class="ui-tabs" id="${id}">
                    <div class="tabs-header">
                        ${tabs.map((tab, i) => `
                            <button class="tab-btn ${i === activeTab ? 'active' : ''}" 
                                    data-tab="${i}"
                                    onclick="UIComponents.tabs.switch('${id}', ${i}${onChange ? `, ${onChange}` : ''})">
                                ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
                                <span class="tab-label">${tab.label}</span>
                                ${tab.badge ? `<span class="tab-badge">${tab.badge}</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                    <div class="tabs-content">
                        ${tabs.map((tab, i) => `
                            <div class="tab-panel ${i === activeTab ? 'active' : ''}" data-panel="${i}">
                                ${tab.content}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },
        
        switch(id, index, callback) {
            const container = document.getElementById(id);
            if (!container) return;
            
            // 更新按钮状态
            container.querySelectorAll('.tab-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
            
            // 更新面板显示
            container.querySelectorAll('.tab-panel').forEach((panel, i) => {
                panel.classList.toggle('active', i === index);
            });
            
            if (callback) callback(index);
        }
    },
    
    // ==================== 动画效果 ====================
    
    animation: {
        // 金币动画
        showCoinAnimation(amount, x, y) {
            const container = document.getElementById('coinAnimationContainer');
            if (!container) return;
            
            const anim = document.createElement('div');
            anim.className = 'coin-float-animation';
            anim.innerHTML = `<span class="coin-icon">🪙</span><span class="coin-amount">+${amount}</span>`;
            anim.style.left = (x || window.innerWidth / 2) + 'px';
            anim.style.top = (y || window.innerHeight / 2) + 'px';
            
            container.appendChild(anim);
            setTimeout(() => anim.remove(), 1500);
        },
        
        // 庆祝动画
        celebrate() {
            if (typeof CelebrationEffects !== 'undefined') {
                CelebrationEffects.triggerConfetti();
            }
        },
        
        // 震动效果
        shake(element) {
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
        },
        
        // 脉冲效果
        pulse(element) {
            element.classList.add('pulse');
            setTimeout(() => element.classList.remove('pulse'), 1000);
        }
    }
};

// 导出
window.UIComponents = UIComponents;

// 兼容旧版Settings.showToast
if (typeof Settings === 'undefined') {
    window.Settings = {};
}
Settings.showToast = (type, title, message, duration) => UIComponents.toast.show(type, title, message, duration);

