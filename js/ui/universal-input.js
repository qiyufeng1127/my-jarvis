// ============================================================
// 全能输入框 v4.0
// 统一交互入口：任务、收入、聊天、指令一框搞定
// ============================================================

const UniversalInput = {
    // 状态
    isExpanded: false,
    currentMode: 'auto',  // auto, task, income, chat, command
    inputHistory: [],
    historyIndex: -1,
    
    // 模式配置
    modes: {
        auto: { icon: '✨', label: '智能识别', placeholder: '输入任何内容，AI自动识别...' },
        task: { icon: '📋', label: '添加任务', placeholder: '例：3点开会、写周报30分钟' },
        income: { icon: '💵', label: '记录收入', placeholder: '例：插画项目1500、照相馆客人200' },
        chat: { icon: '💬', label: '对话', placeholder: '和AI助手聊天...' },
        command: { icon: '⚡', label: '指令', placeholder: '例：开始专注25分钟、查询金币' }
    },
    
    // ==================== 初始化 ====================
    
    init() {
        this.loadHistory();
        // 延迟渲染，等待DOM加载完成
        setTimeout(() => {
            this.render();
            this.bindEvents();
        }, 500);
        console.log('UniversalInput 初始化完成');
    },
    
    loadHistory() {
        this.inputHistory = JSON.parse(localStorage.getItem('universal_input_history') || '[]');
    },
    
    saveHistory() {
        localStorage.setItem('universal_input_history', JSON.stringify(this.inputHistory.slice(-50)));
    },
    
    // ==================== 渲染 ====================
    
    render() {
        // 查找聊天输入区域
        const chatInputArea = document.querySelector('.chat-input-area');
        
        if (!chatInputArea) {
            console.log('UniversalInput: 等待聊天输入区域加载...');
            setTimeout(() => this.render(), 500);
            return;
        }
        
        // 隐藏原有的输入区域
        chatInputArea.style.display = 'none';
        
        // 查找或创建容器
        let container = document.getElementById('universalInputContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'universalInputContainer';
            // 插入到原输入区域后面
            chatInputArea.parentNode.insertBefore(container, chatInputArea.nextSibling);
        }
        
        const mode = this.modes[this.currentMode];
        
        container.innerHTML = `
            <div class="universal-input ${this.isExpanded ? 'expanded' : ''}">
                <!-- 模式选择器 -->
                <div class="input-mode-selector">
                    ${Object.entries(this.modes).map(([key, m]) => `
                        <button class="mode-btn ${key === this.currentMode ? 'active' : ''}" 
                                data-mode="${key}" 
                                title="${m.label}">
                            <span class="mode-icon">${m.icon}</span>
                            <span class="mode-label">${m.label}</span>
                        </button>
                    `).join('')}
                </div>
                
                <!-- 主输入区 -->
                <div class="input-main">
                    <span class="input-prefix">${mode.icon}</span>
                    <input type="text" 
                           id="universalInputField"
                           class="universal-input-field"
                           placeholder="${mode.placeholder}"
                           autocomplete="off">
                    <div class="input-actions">
                        <button class="input-action-btn voice-btn" id="voiceInputBtn" title="语音输入">
                            🎤
                        </button>
                        <button class="input-action-btn send-btn" id="sendInputBtn" title="发送">
                            ➤
                        </button>
                    </div>
                </div>
                
                <!-- 快捷操作 -->
                <div class="input-shortcuts">
                    <button class="shortcut-btn" data-action="quick-task">
                        <span>📋</span> 快速任务
                    </button>
                    <button class="shortcut-btn" data-action="quick-income">
                        <span>💵</span> 记录收入
                    </button>
                    <button class="shortcut-btn" data-action="start-focus">
                        <span>🍅</span> 开始专注
                    </button>
                    <button class="shortcut-btn" data-action="complete-task">
                        <span>✅</span> 完成任务
                    </button>
                </div>
                
                <!-- AI建议区 -->
                <div class="input-suggestions" id="inputSuggestions" style="display: none;">
                    <div class="suggestions-header">
                        <span>💡 AI建议</span>
                        <button class="close-suggestions" onclick="UniversalInput.hideSuggestions()">×</button>
                    </div>
                    <div class="suggestions-list" id="suggestionsList"></div>
                </div>
            </div>
        `;
        
        this.addStyles();
    },
    
    addStyles() {
        if (document.getElementById('universalInputStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'universalInputStyles';
        style.textContent = `
            .universal-input {
                background: var(--bg-white, #fff);
                border-radius: var(--radius-lg, 16px);
                box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.12));
                margin: 15px;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .universal-input.expanded {
                box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.16));
            }
            
            /* 模式选择器 */
            .input-mode-selector {
                display: flex;
                padding: 8px;
                gap: 4px;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                overflow-x: auto;
                scrollbar-width: none;
            }
            
            .input-mode-selector::-webkit-scrollbar {
                display: none;
            }
            
            .mode-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: none;
                background: transparent;
                border-radius: var(--radius-md, 10px);
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s ease;
                color: var(--text-secondary, #666);
                font-size: 13px;
            }
            
            .mode-btn:hover {
                background: var(--bg-light, #f5f5f5);
            }
            
            .mode-btn.active {
                background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #5a67d8));
                color: white;
            }
            
            .mode-icon {
                font-size: 16px;
            }
            
            /* 主输入区 */
            .input-main {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 12px;
            }
            
            .input-prefix {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .universal-input-field {
                flex: 1;
                border: none;
                outline: none;
                font-size: 15px;
                background: transparent;
                color: var(--text-primary, #2c3e50);
            }
            
            .universal-input-field::placeholder {
                color: var(--text-muted, #999);
            }
            
            .input-actions {
                display: flex;
                gap: 8px;
            }
            
            .input-action-btn {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .voice-btn {
                background: var(--bg-light, #f5f5f5);
                color: var(--text-secondary, #666);
            }
            
            .voice-btn:hover {
                background: var(--border-color, #e0e0e0);
            }
            
            .voice-btn.recording {
                background: #E74C3C;
                color: white;
                animation: pulse 1s infinite;
            }
            
            .send-btn {
                background: linear-gradient(135deg, var(--primary, #667eea), var(--primary-dark, #5a67d8));
                color: white;
            }
            
            .send-btn:hover {
                transform: scale(1.05);
            }
            
            /* 快捷操作 */
            .input-shortcuts {
                display: flex;
                padding: 8px 12px;
                gap: 8px;
                border-top: 1px solid var(--border-color, #e0e0e0);
                overflow-x: auto;
                scrollbar-width: none;
            }
            
            .input-shortcuts::-webkit-scrollbar {
                display: none;
            }
            
            .shortcut-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                border: 1px solid var(--border-color, #e0e0e0);
                background: var(--bg-white, #fff);
                border-radius: var(--radius-full, 9999px);
                cursor: pointer;
                white-space: nowrap;
                font-size: 13px;
                color: var(--text-secondary, #666);
                transition: all 0.2s ease;
            }
            
            .shortcut-btn:hover {
                border-color: var(--primary, #667eea);
                color: var(--primary, #667eea);
                background: rgba(102, 126, 234, 0.05);
            }
            
            /* AI建议区 */
            .input-suggestions {
                border-top: 1px solid var(--border-color, #e0e0e0);
                background: var(--bg-light, #f5f5f5);
            }
            
            .suggestions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 16px;
                font-size: 13px;
                color: var(--text-secondary, #666);
            }
            
            .close-suggestions {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-muted, #999);
            }
            
            .suggestions-list {
                padding: 0 12px 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            
            .suggestion-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 14px;
                background: var(--bg-white, #fff);
                border-radius: var(--radius-md, 10px);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .suggestion-item:hover {
                background: white;
                box-shadow: var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.08));
            }
            
            .suggestion-icon {
                font-size: 18px;
            }
            
            .suggestion-text {
                flex: 1;
                font-size: 14px;
                color: var(--text-primary, #2c3e50);
            }
            
            .suggestion-type {
                font-size: 12px;
                color: var(--text-muted, #999);
                padding: 2px 8px;
                background: var(--bg-light, #f5f5f5);
                border-radius: var(--radius-full, 9999px);
            }
            
            /* 移动端适配 */
            @media screen and (max-width: 768px) {
                .universal-input {
                    margin: 10px;
                    border-radius: var(--radius-md, 10px);
                }
                
                .mode-label {
                    display: none;
                }
                
                .mode-btn {
                    padding: 8px;
                }
                
                .shortcut-btn span:last-child {
                    display: none;
                }
                
                .shortcut-btn {
                    padding: 8px 12px;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    // ==================== 事件绑定 ====================
    
    bindEvents() {
        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => this.setMode(btn.dataset.mode);
        });
        
        // 输入框事件
        const input = document.getElementById('universalInputField');
        if (input) {
            input.onkeydown = (e) => this.handleKeydown(e);
            input.oninput = () => this.handleInput();
            input.onfocus = () => this.onFocus();
            input.onblur = () => this.onBlur();
        }
        
        // 发送按钮
        const sendBtn = document.getElementById('sendInputBtn');
        if (sendBtn) {
            sendBtn.onclick = () => this.submit();
        }
        
        // 语音按钮
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.onclick = () => this.toggleVoiceInput();
        }
        
        // 快捷操作
        document.querySelectorAll('.shortcut-btn').forEach(btn => {
            btn.onclick = () => this.handleShortcut(btn.dataset.action);
        });
    },
    
    // ==================== 模式切换 ====================
    
    setMode(mode) {
        this.currentMode = mode;
        this.render();
        this.bindEvents();
        
        const input = document.getElementById('universalInputField');
        if (input) input.focus();
    },
    
    // ==================== 输入处理 ====================
    
    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.submit();
        } else if (e.key === 'ArrowUp') {
            this.navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            this.navigateHistory(1);
        } else if (e.key === 'Escape') {
            this.hideSuggestions();
        }
    },
    
    handleInput() {
        const input = document.getElementById('universalInputField');
        const value = input?.value || '';
        
        // 自动模式下检测内容类型
        if (this.currentMode === 'auto' && value.length > 2) {
            this.detectAndSuggest(value);
        }
    },
    
    onFocus() {
        this.isExpanded = true;
        document.querySelector('.universal-input')?.classList.add('expanded');
    },
    
    onBlur() {
        setTimeout(() => {
            this.isExpanded = false;
            document.querySelector('.universal-input')?.classList.remove('expanded');
        }, 200);
    },
    
    navigateHistory(direction) {
        if (this.inputHistory.length === 0) return;
        
        this.historyIndex += direction;
        this.historyIndex = Math.max(-1, Math.min(this.historyIndex, this.inputHistory.length - 1));
        
        const input = document.getElementById('universalInputField');
        if (input) {
            input.value = this.historyIndex >= 0 ? this.inputHistory[this.historyIndex] : '';
        }
    },
    
    // ==================== 提交处理 ====================
    
    async submit() {
        const input = document.getElementById('universalInputField');
        const value = input?.value?.trim();
        
        if (!value) return;
        
        // 保存历史
        this.inputHistory.unshift(value);
        this.saveHistory();
        this.historyIndex = -1;
        
        // 清空输入
        input.value = '';
        this.hideSuggestions();
        
        // 根据模式处理
        switch (this.currentMode) {
            case 'auto':
                await this.processAuto(value);
                break;
            case 'task':
                this.processTask(value);
                break;
            case 'income':
                this.processIncome(value);
                break;
            case 'chat':
                this.processChat(value);
                break;
            case 'command':
                this.processCommand(value);
                break;
        }
    },
    
    // 自动识别处理
    async processAuto(text) {
        // 先尝试本地规则匹配
        const detected = this.detectType(text);
        
        switch (detected.type) {
            case 'task':
                this.processTask(text);
                break;
            case 'income':
                this.processIncome(text);
                break;
            case 'command':
                this.processCommand(text);
                break;
            default:
                // 使用AI分析
                if (typeof UnifiedAPI !== 'undefined') {
                    try {
                        const result = await UnifiedAPI.analyzeInput(text);
                        this.handleAIResult(result, text);
                    } catch (e) {
                        this.processChat(text);
                    }
                } else {
                    this.processChat(text);
                }
        }
    },
    
    // 检测输入类型
    detectType(text) {
        const lower = text.toLowerCase();
        
        // 任务模式检测
        if (/^\d{1,2}[点:：]\d{0,2}/.test(text) || 
            /^(上午|下午|晚上|明天|今天)/.test(text) ||
            /(分钟|小时)$/.test(text)) {
            return { type: 'task' };
        }
        
        // 收入模式检测
        if (/收入|赚了|到账|卖出|卖了/.test(text) ||
            /\d+(元|块|rmb)/i.test(text)) {
            return { type: 'income' };
        }
        
        // 指令模式检测
        if (/^(开始|停止|暂停|查询|完成|打开|关闭)/.test(text) ||
            /专注|倒计时|番茄钟|监控/.test(text)) {
            return { type: 'command' };
        }
        
        return { type: 'chat' };
    },
    
    // 处理任务
    processTask(text) {
        // 解析任务信息
        const taskInfo = this.parseTaskText(text);
        
        if (typeof GlobalState !== 'undefined') {
            const task = GlobalState.addTask(taskInfo);
            
            if (typeof UIComponents !== 'undefined') {
                UIComponents.toast.success('任务已添加', task.title);
            }
            
            if (typeof App !== 'undefined') {
                App.loadTimeline();
                App.addChatMessage('system', `📋 已添加任务：${task.title}\n⏰ 时间：${task.startTime}`, '📋');
            }
        }
    },
    
    parseTaskText(text) {
        const now = new Date();
        let startTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       (Math.ceil(now.getMinutes() / 5) * 5).toString().padStart(2, '0');
        let duration = 30;
        let title = text;
        
        // 解析时间
        const timeMatch = text.match(/(\d{1,2})[点:：](\d{0,2})/);
        if (timeMatch) {
            startTime = timeMatch[1].padStart(2, '0') + ':' + (timeMatch[2] || '00').padStart(2, '0');
            title = text.replace(timeMatch[0], '').trim();
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
            title,
            date: GlobalState?.formatDate(now) || now.toISOString().split('T')[0],
            startTime,
            duration,
            coins: Math.ceil(duration / 10)
        };
    },
    
    // 处理收入
    processIncome(text) {
        const incomeInfo = this.parseIncomeText(text);
        
        if (incomeInfo.amount > 0 && typeof FinanceSystem !== 'undefined') {
            FinanceSystem.money.addIncome(incomeInfo.amount, incomeInfo.description, incomeInfo.category);
            
            if (typeof App !== 'undefined') {
                App.loadValuePanel();
                App.addChatMessage('system', 
                    `💵 收入已记录！+¥${incomeInfo.amount}\n📝 来源：${incomeInfo.description || incomeInfo.category}`, 
                    '💵'
                );
            }
        }
    },
    
    parseIncomeText(text) {
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
        
        return { amount, description, category };
    },
    
    // 处理聊天
    processChat(text) {
        if (typeof App !== 'undefined' && App.sendMessage) {
            App.sendMessage(text);
        } else if (typeof App !== 'undefined') {
            App.addChatMessage('user', text, '👤');
            // 简单回复
            setTimeout(() => {
                App.addChatMessage('assistant', '收到你的消息：' + text, '🤖');
            }, 500);
        }
    },
    
    // 处理指令
    processCommand(text) {
        if (typeof CommandMapper !== 'undefined') {
            const result = CommandMapper.matchCommand(text);
            
            if (result.matched && typeof VoiceAssistant !== 'undefined') {
                VoiceAssistant.executeAction(result.action, result.params);
                if (result.reply) {
                    if (typeof App !== 'undefined') {
                        App.addChatMessage('system', result.reply, '⚡');
                    }
                }
            } else {
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', '未识别的指令，请重试', '❓');
                }
            }
        }
    },
    
    // 处理AI结果
    handleAIResult(result, originalText) {
        switch (result.type) {
            case 'task':
                this.processTask(originalText);
                break;
            case 'income':
                this.processIncome(originalText);
                break;
            case 'command':
                this.processCommand(originalText);
                break;
            default:
                this.processChat(originalText);
        }
    },
    
    // ==================== 快捷操作 ====================
    
    handleShortcut(action) {
        switch (action) {
            case 'quick-task':
                this.setMode('task');
                break;
            case 'quick-income':
                this.setMode('income');
                break;
            case 'start-focus':
                if (typeof VoiceAssistant !== 'undefined') {
                    VoiceAssistant.executeAction('start_timer', { duration: 25 });
                }
                break;
            case 'complete-task':
                if (typeof VoiceAssistant !== 'undefined') {
                    VoiceAssistant.executeAction('complete_task', {});
                }
                break;
        }
    },
    
    // ==================== 语音输入 ====================
    
    toggleVoiceInput() {
        const btn = document.getElementById('voiceInputBtn');
        
        if (btn?.classList.contains('recording')) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    },
    
    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            UIComponents?.toast?.warning('提示', '浏览器不支持语音输入');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        
        this.recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            const input = document.getElementById('universalInputField');
            if (input) input.value = text;
            this.stopVoiceInput();
        };
        
        this.recognition.onerror = () => this.stopVoiceInput();
        this.recognition.onend = () => this.stopVoiceInput();
        
        this.recognition.start();
        document.getElementById('voiceInputBtn')?.classList.add('recording');
    },
    
    stopVoiceInput() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }
        document.getElementById('voiceInputBtn')?.classList.remove('recording');
    },
    
    // ==================== 建议功能 ====================
    
    detectAndSuggest(text) {
        const suggestions = [];
        const detected = this.detectType(text);
        
        if (detected.type === 'task') {
            const taskInfo = this.parseTaskText(text);
            suggestions.push({
                icon: '📋',
                text: `添加任务：${taskInfo.title} (${taskInfo.startTime})`,
                type: '任务',
                action: () => this.processTask(text)
            });
        }
        
        if (detected.type === 'income') {
            const incomeInfo = this.parseIncomeText(text);
            if (incomeInfo.amount > 0) {
                suggestions.push({
                    icon: '💵',
                    text: `记录收入：¥${incomeInfo.amount}`,
                    type: '收入',
                    action: () => this.processIncome(text)
                });
            }
        }
        
        if (suggestions.length > 0) {
            this.showSuggestions(suggestions);
        } else {
            this.hideSuggestions();
        }
    },
    
    showSuggestions(suggestions) {
        const container = document.getElementById('inputSuggestions');
        const list = document.getElementById('suggestionsList');
        
        if (!container || !list) return;
        
        list.innerHTML = suggestions.map((s, i) => `
            <div class="suggestion-item" onclick="UniversalInput.executeSuggestion(${i})">
                <span class="suggestion-icon">${s.icon}</span>
                <span class="suggestion-text">${s.text}</span>
                <span class="suggestion-type">${s.type}</span>
            </div>
        `).join('');
        
        this.currentSuggestions = suggestions;
        container.style.display = 'block';
    },
    
    hideSuggestions() {
        const container = document.getElementById('inputSuggestions');
        if (container) container.style.display = 'none';
    },
    
    executeSuggestion(index) {
        if (this.currentSuggestions?.[index]?.action) {
            this.currentSuggestions[index].action();
            document.getElementById('universalInputField').value = '';
            this.hideSuggestions();
        }
    }
};

// 导出
window.UniversalInput = UniversalInput;

