// ============================================================
// 输入框增强器 v4.0
// 增强现有输入框，添加模式切换和智能识别功能
// ============================================================

const InputEnhancer = {
    currentMode: 'auto',
    modes: {
        auto: { icon: '✨', label: '智能', color: '#667eea' },
        task: { icon: '📋', label: '任务', color: '#27AE60' },
        income: { icon: '💵', label: '收入', color: '#F39C12' },
        chat: { icon: '💬', label: '对话', color: '#3498DB' }
    },
    
    init() {
        // 等待DOM加载
        setTimeout(() => this.enhance(), 800);
        console.log('InputEnhancer 初始化完成');
    },
    
    enhance() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) {
            console.log('InputEnhancer: 等待输入框...');
            setTimeout(() => this.enhance(), 500);
            return;
        }
        
        // 检查是否已增强
        if (document.getElementById('inputModeBar')) return;
        
        // 添加模式切换栏
        this.addModeBar();
        
        // 增强输入框事件
        this.enhanceInput(chatInput);
        
        // 添加样式
        this.addStyles();
        
        console.log('✓ 输入框已增强');
    },
    
    addModeBar() {
        const quickReplies = document.getElementById('quickReplies');
        if (!quickReplies) return;
        
        const modeBar = document.createElement('div');
        modeBar.id = 'inputModeBar';
        modeBar.className = 'input-mode-bar';
        modeBar.innerHTML = `
            <div class="mode-tabs">
                ${Object.entries(this.modes).map(([key, m]) => `
                    <button class="mode-tab ${key === this.currentMode ? 'active' : ''}" 
                            data-mode="${key}"
                            style="--mode-color: ${m.color}">
                        <span class="mode-tab-icon">${m.icon}</span>
                        <span class="mode-tab-label">${m.label}</span>
                    </button>
                `).join('')}
            </div>
            <div class="mode-indicator" id="modeIndicator">
                <span class="indicator-icon">${this.modes[this.currentMode].icon}</span>
                <span class="indicator-text">智能识别模式</span>
            </div>
        `;
        
        // 插入到快捷回复上方
        quickReplies.parentNode.insertBefore(modeBar, quickReplies);
        
        // 绑定模式切换事件
        modeBar.querySelectorAll('.mode-tab').forEach(tab => {
            tab.onclick = () => this.setMode(tab.dataset.mode);
        });
    },
    
    setMode(mode) {
        this.currentMode = mode;
        const m = this.modes[mode];
        
        // 更新标签状态
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // 更新指示器
        const indicator = document.getElementById('modeIndicator');
        if (indicator) {
            indicator.innerHTML = `
                <span class="indicator-icon">${m.icon}</span>
                <span class="indicator-text">${m.label}模式</span>
            `;
            indicator.style.color = m.color;
        }
        
        // 更新输入框占位符
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            const placeholders = {
                auto: '输入任何内容，AI自动识别...',
                task: '例：3点开会、写周报30分钟',
                income: '例：插画项目1500、照相馆客人200',
                chat: '和 KiiKii 聊天...'
            };
            chatInput.placeholder = placeholders[mode];
            chatInput.focus();
        }
    },
    
    enhanceInput(input) {
        // 保存原始的发送函数
        const originalSend = window.App?.sendMessage?.bind(window.App);
        
        // 重写发送函数
        if (window.App) {
            window.App.sendMessage = () => {
                const text = input.value?.trim();
                if (!text) return;
                
                // 根据模式处理
                switch (this.currentMode) {
                    case 'task':
                        this.handleTaskInput(text);
                        break;
                    case 'income':
                        this.handleIncomeInput(text);
                        break;
                    case 'chat':
                        if (originalSend) originalSend();
                        break;
                    case 'auto':
                    default:
                        this.handleAutoInput(text, originalSend);
                        break;
                }
                
                input.value = '';
            };
        }
        
        // 添加输入时的实时检测
        input.addEventListener('input', () => {
            if (this.currentMode === 'auto') {
                this.detectInputType(input.value);
            }
        });
    },
    
    detectInputType(text) {
        if (!text || text.length < 2) return;
        
        const indicator = document.getElementById('modeIndicator');
        if (!indicator) return;
        
        let detected = 'chat';
        let icon = '💬';
        let label = '对话';
        
        // 检测任务
        if (/^\d{1,2}[点:：]/.test(text) || 
            /^(上午|下午|晚上|明天|今天)/.test(text) ||
            /(分钟|小时)$/.test(text)) {
            detected = 'task';
            icon = '📋';
            label = '识别为任务';
        }
        // 检测收入
        else if (/收入|赚了|到账|卖出|卖了/.test(text) ||
                 /\d+(元|块|rmb)/i.test(text)) {
            detected = 'income';
            icon = '💵';
            label = '识别为收入';
        }
        
        indicator.innerHTML = `
            <span class="indicator-icon">${icon}</span>
            <span class="indicator-text">${label}</span>
        `;
        indicator.style.color = this.modes[detected].color;
    },
    
    handleAutoInput(text, originalSend) {
        // 检测类型
        if (/^\d{1,2}[点:：]/.test(text) || 
            /^(上午|下午|晚上|明天|今天)/.test(text) ||
            /(分钟|小时)$/.test(text)) {
            this.handleTaskInput(text);
        }
        else if (/收入|赚了|到账|卖出|卖了/.test(text) ||
                 /(\d+)(元|块|rmb)/i.test(text)) {
            this.handleIncomeInput(text);
        }
        else {
            // 默认走聊天
            if (originalSend) originalSend();
        }
    },
    
    handleTaskInput(text) {
        // 解析任务
        const task = this.parseTask(text);
        
        // 添加到任务列表
        if (typeof GlobalState !== 'undefined') {
            GlobalState.addTask(task);
        } else if (typeof Storage !== 'undefined') {
            const tasks = Storage.getTasks();
            tasks.push(task);
            Storage.saveTasks(tasks);
        }
        
        // 显示确认消息
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `📋 任务已添加！\n\n` +
                `📝 ${task.title}\n` +
                `⏰ ${task.startTime}\n` +
                `⏱️ ${task.duration}分钟\n` +
                `🪙 完成可获得 ${task.coins} 金币`,
                '📋'
            );
            App.loadTimeline?.();
        }
        
        // 显示Toast
        if (typeof UIComponents !== 'undefined') {
            UIComponents.toast?.success('任务已添加', task.title);
        } else if (typeof Settings !== 'undefined') {
            Settings.showToast('success', '任务已添加', task.title);
        }
    },
    
    parseTask(text) {
        const now = new Date();
        let startTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       (Math.ceil(now.getMinutes() / 5) * 5).toString().padStart(2, '0');
        let duration = 30;
        let title = text;
        let date = now.toISOString().split('T')[0];
        
        // 解析"明天"
        if (/明天/.test(text)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            date = tomorrow.toISOString().split('T')[0];
            title = title.replace(/明天/g, '').trim();
        }
        
        // 解析时间
        const timeMatch = text.match(/(\d{1,2})[点:：](\d{0,2})/);
        if (timeMatch) {
            startTime = timeMatch[1].padStart(2, '0') + ':' + (timeMatch[2] || '00').padStart(2, '0');
            title = title.replace(timeMatch[0], '').trim();
        }
        
        // 解析时长
        const durationMatch = text.match(/(\d+)(分钟|小时)/);
        if (durationMatch) {
            duration = parseInt(durationMatch[1]) * (durationMatch[2] === '小时' ? 60 : 1);
            title = title.replace(durationMatch[0], '').trim();
        }
        
        // 清理标题
        title = title.replace(/^(要|去|做|有)/, '').trim() || text;
        
        return {
            id: Date.now().toString(),
            title,
            date,
            startTime,
            duration,
            coins: Math.max(5, Math.ceil(duration / 10)),
            completed: false,
            createdAt: new Date().toISOString()
        };
    },
    
    handleIncomeInput(text) {
        const income = this.parseIncome(text);
        
        if (income.amount <= 0) {
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', '❌ 无法识别金额，请重新输入', '❌');
            }
            return;
        }
        
        // 记录收入
        if (typeof GlobalState !== 'undefined') {
            GlobalState.addIncome(income.amount, income.description, income.category);
        } else if (typeof FinanceSystem !== 'undefined') {
            FinanceSystem.money.addIncome(income.amount, income.description, income.category);
        }
        
        // 显示确认消息
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `💵 收入已记录！\n\n` +
                `💰 +¥${income.amount}\n` +
                `📝 ${income.description || income.category}\n` +
                `📁 分类：${income.category}`,
                '💵'
            );
            App.loadValuePanel?.();
        }
        
        // 显示Toast
        if (typeof UIComponents !== 'undefined') {
            UIComponents.toast?.success(`收入 +¥${income.amount}`, income.description || income.category);
        } else if (typeof Settings !== 'undefined') {
            Settings.showToast('success', `收入 +¥${income.amount}`, income.description || income.category);
        }
    },
    
    parseIncome(text) {
        let amount = 0;
        let description = '';
        let category = '其他';
        
        // 提取金额
        const amountMatch = text.match(/(\d+(?:\.\d+)?)(元|块|rmb)?/i);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1]);
        }
        
        // 提取描述
        description = text.replace(/收入|赚了|到账|卖出|卖了|\d+(?:\.\d+)?元?块?/gi, '').trim();
        
        // 自动分类
        if (/照相|拍照|证件照/.test(text)) category = '照相馆';
        else if (/插画|画|绘/.test(text)) category = '插画';
        else if (/设计|logo|海报/.test(text)) category = '设计';
        else if (/视频|剪辑/.test(text)) category = '视频';
        else if (/小红书|笔记/.test(text)) category = '小红书';
        else if (/工资|薪水/.test(text)) category = '工资';
        else if (/红包|转账/.test(text)) category = '转账';
        
        return { amount, description, category };
    },
    
    addStyles() {
        if (document.getElementById('inputEnhancerStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'inputEnhancerStyles';
        style.textContent = `
            .input-mode-bar {
                padding: 8px 12px;
                background: var(--bg-light, #f8f9fa);
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            
            .mode-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 8px;
            }
            
            .mode-tab {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border: none;
                background: var(--bg-white, #fff);
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                color: var(--text-secondary, #666);
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }
            
            .mode-tab:hover {
                background: var(--bg-hover, #f0f0f0);
            }
            
            .mode-tab.active {
                background: var(--mode-color, #667eea);
                color: white;
                border-color: var(--mode-color, #667eea);
            }
            
            .mode-tab-icon {
                font-size: 14px;
            }
            
            .mode-tab-label {
                font-weight: 500;
            }
            
            .mode-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: var(--text-muted, #999);
                transition: all 0.3s ease;
            }
            
            .indicator-icon {
                font-size: 14px;
            }
            
            .indicator-text {
                font-weight: 500;
            }
            
            /* 深色模式 */
            [data-theme="dark"] .input-mode-bar {
                background: var(--bg-dark, #1a1a2e);
            }
            
            [data-theme="dark"] .mode-tab {
                background: var(--bg-card, #16213e);
                color: var(--text-secondary, #a0a0a0);
            }
            
            [data-theme="dark"] .mode-tab:hover {
                background: var(--bg-hover, #1f2b4d);
            }
            
            /* 移动端适配 */
            @media screen and (max-width: 768px) {
                .mode-tab-label {
                    display: none;
                }
                
                .mode-tab {
                    padding: 8px 12px;
                }
                
                .mode-tab-icon {
                    font-size: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// 导出
window.InputEnhancer = InputEnhancer;

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => InputEnhancer.init(), 1000);
});

