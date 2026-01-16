// ============================================================
// 全局语音助手 v4.0
// 核心：状态感知的全站语音助手，支持自然语言指令
// ============================================================

const VoiceAssistant = {
    // 版本
    version: '4.0.0',
    
    // 状态
    isEnabled: false,
    isListening: false,
    isProcessing: false,
    recognition: null,
    synthesis: window.speechSynthesis,
    
    // 唤醒词检测
    wakeWordDetected: false,
    wakeWords: ['嘿助手', '你好助手', 'hey assistant'],
    
    // 语音设置
    settings: {
        enabled: true,
        wakeWordEnabled: true,
        voiceRate: 1.0,
        voicePitch: 1.0,
        voiceVolume: 1.0,
        voiceName: '',
        language: 'zh-CN'
    },
    
    // 可用语音列表
    availableVoices: [],
    selectedVoice: null,
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('VoiceAssistant 初始化...');
        this.loadSettings();
        this.initSpeechRecognition();
        this.loadVoices();
        this.renderUI();
        
        // 监听语音列表加载
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // 订阅状态变化
        if (typeof GlobalState !== 'undefined') {
            GlobalState.subscribe('taskCompleted', (data) => {
                this.announceTaskComplete(data.task, data.reward);
            });
            GlobalState.subscribe('coinsChanged', (data) => {
                if (data.change > 0) {
                    this.speak(`获得${data.change}金币`);
                }
            });
        }
        
        if (this.settings.enabled) {
            this.start();
        }
        
        console.log('VoiceAssistant 初始化完成');
    },
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('voice_assistant_settings');
        if (saved) {
            Object.assign(this.settings, JSON.parse(saved));
        }
    },
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('voice_assistant_settings', JSON.stringify(this.settings));
    },
    
    // 加载可用语音
    loadVoices() {
        if (!this.synthesis) return;
        
        this.availableVoices = this.synthesis.getVoices();
        
        // 筛选中文语音
        const chineseVoices = this.availableVoices.filter(v => 
            v.lang.includes('zh') || v.lang.includes('CN')
        );
        
        // 恢复选择的语音
        if (this.settings.voiceName) {
            this.selectedVoice = this.availableVoices.find(v => v.name === this.settings.voiceName);
        }
        
        // 默认选择第一个中文语音
        if (!this.selectedVoice && chineseVoices.length > 0) {
            this.selectedVoice = chineseVoices[0];
        }
    },
    
    // ==================== 语音识别 ====================
    
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('浏览器不支持语音识别');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.settings.language;
        
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    },
    
    // 处理识别结果
    handleRecognitionResult(event) {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();
        const isFinal = event.results[last].isFinal;
        
        console.log('语音识别:', transcript, isFinal ? '(最终)' : '(临时)');
        
        // 检测唤醒词
        if (this.settings.wakeWordEnabled && !this.wakeWordDetected) {
            for (const wakeWord of this.wakeWords) {
                if (transcript.includes(wakeWord.toLowerCase())) {
                    this.wakeWordDetected = true;
                    this.speak('我在，请说');
                    this.showListeningUI();
                    
                    // 5秒后重置唤醒状态
                    setTimeout(() => {
                        if (!this.isProcessing) {
                            this.wakeWordDetected = false;
                            this.hideListeningUI();
                        }
                    }, 5000);
                    return;
                }
            }
        }
        
        // 如果已唤醒或未启用唤醒词，处理指令
        if (isFinal && (this.wakeWordDetected || !this.settings.wakeWordEnabled)) {
            // 移除唤醒词
            let command = transcript;
            for (const wakeWord of this.wakeWords) {
                command = command.replace(wakeWord.toLowerCase(), '').trim();
            }
            
            if (command.length > 0) {
                this.processCommand(command);
            }
        }
    },
    
    handleRecognitionError(event) {
        console.error('语音识别错误:', event.error);
        if (event.error !== 'no-speech' && this.isEnabled) {
            setTimeout(() => this.startListening(), 1000);
        }
    },
    
    handleRecognitionEnd() {
        if (this.isEnabled && this.isListening) {
            setTimeout(() => this.startListening(), 500);
        }
    },
    
    // ==================== 指令处理 ====================
    
    async processCommand(command) {
        console.log('处理指令:', command);
        this.isProcessing = true;
        this.showProcessingUI();
        
        try {
            // 先尝试本地指令匹配
            const localResult = CommandMapper.matchCommand(command);
            
            if (localResult.matched) {
                await this.executeAction(localResult.action, localResult.params);
                if (localResult.reply) {
                    this.speak(localResult.reply);
                }
            } else {
                // 使用AI解析
                if (typeof UnifiedAPI !== 'undefined') {
                    const result = await UnifiedAPI.parseVoiceCommand(command);
                    await this.executeAction(result.action, result.params);
                    if (result.reply) {
                        this.speak(result.reply);
                    }
                } else {
                    this.speak('抱歉，我没有理解你的意思');
                }
            }
        } catch (e) {
            console.error('指令处理失败:', e);
            this.speak('抱歉，处理指令时出错了');
        } finally {
            this.isProcessing = false;
            this.wakeWordDetected = false;
            this.hideProcessingUI();
        }
    },
    
    // 执行动作
    async executeAction(action, params = {}) {
        console.log('执行动作:', action, params);
        
        switch (action) {
            case 'start_timer':
                this.startTimer(params.duration || 25);
                break;
                
            case 'complete_task':
                this.completeTask(params.taskName);
                break;
                
            case 'add_task':
                this.addTask(params);
                break;
                
            case 'add_income':
                this.addIncome(params.amount, params.description);
                break;
                
            case 'add_expense':
                this.addExpense(params.amount, params.description);
                break;
                
            case 'query_status':
                this.queryStatus(params.type);
                break;
                
            case 'control_monitor':
                this.controlMonitor(params.action);
                break;
                
            default:
                console.log('未知动作:', action);
        }
    },
    
    // ==================== 动作实现 ====================
    
    // 开始计时器
    startTimer(minutes) {
        this.speak(`好的，开始${minutes}分钟专注倒计时`);
        
        // 触发倒计时
        if (typeof GlobalState !== 'undefined') {
            GlobalState.emit('startTimer', { duration: minutes * 60 });
        }
        
        // 显示通知
        if (typeof Settings !== 'undefined' && Settings.sendNotification) {
            Settings.sendNotification('⏱️ 专注开始', `${minutes}分钟倒计时已开始`, '⏱️');
        }
    },
    
    // 完成任务
    completeTask(taskName) {
        if (typeof GlobalState !== 'undefined') {
            // 查找匹配的任务
            const todayTasks = GlobalState.getTodayTasks();
            let task = null;
            
            if (taskName) {
                task = todayTasks.find(t => 
                    !t.completed && t.title.includes(taskName)
                );
            } else {
                // 找当前时间段的任务
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                
                task = todayTasks.find(t => {
                    if (t.completed) return false;
                    const [h, m] = t.startTime.split(':').map(Number);
                    const startMinutes = h * 60 + m;
                    const endMinutes = startMinutes + (t.duration || 30);
                    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
                });
            }
            
            if (task) {
                const result = GlobalState.completeTask(task.id);
                this.speak(`太棒了！${task.title}已完成，获得${result.reward}金币`);
            } else {
                this.speak('没有找到匹配的任务');
            }
        }
    },
    
    // 添加任务
    addTask(params) {
        if (typeof GlobalState !== 'undefined') {
            const task = GlobalState.addTask({
                title: params.title || params.taskName,
                date: params.date || GlobalState.formatDate(new Date()),
                startTime: params.startTime || this.getNextAvailableTime(),
                duration: params.duration || 30,
                coins: params.coins || 5
            });
            
            this.speak(`已添加任务：${task.title}`);
            
            // 刷新时间轴
            if (typeof App !== 'undefined' && App.loadTimeline) {
                App.loadTimeline();
            }
        }
    },
    
    // 记录收入
    addIncome(amount, description) {
        if (typeof GlobalState !== 'undefined' && amount > 0) {
            GlobalState.addIncome(amount, description || '语音记录');
            this.speak(`已记录收入${amount}元`);
            
            // 刷新价值面板
            if (typeof App !== 'undefined' && App.loadValuePanel) {
                App.loadValuePanel();
            }
        }
    },
    
    // 记录支出
    addExpense(amount, description) {
        if (typeof GlobalState !== 'undefined' && amount > 0) {
            GlobalState.addExpense(amount, description || '语音记录');
            this.speak(`已记录支出${amount}元`);
        }
    },
    
    // 查询状态
    queryStatus(type) {
        if (typeof GlobalState === 'undefined') {
            this.speak('状态查询不可用');
            return;
        }
        
        switch (type) {
            case 'coins':
                this.speak(`当前金币余额${GlobalState.coins.balance}个`);
                break;
            case 'finance':
                this.speak(`今日收入${GlobalState.finance.todayEarned}元`);
                break;
            case 'tasks':
                const todayTasks = GlobalState.getTodayTasks();
                const completed = todayTasks.filter(t => t.completed).length;
                this.speak(`今天共${todayTasks.length}个任务，已完成${completed}个`);
                break;
            case 'energy':
                this.speak(`当前能量${GlobalState.game.energy}点`);
                break;
            default:
                this.speak(`金币${GlobalState.coins.balance}个，能量${GlobalState.game.energy}点`);
        }
    },
    
    // 控制监控
    controlMonitor(action) {
        if (typeof ProcrastinationMonitor !== 'undefined') {
            switch (action) {
                case 'start':
                    ProcrastinationMonitor.settings.enabled = true;
                    this.speak('监控已开启');
                    break;
                case 'stop':
                    ProcrastinationMonitor.settings.enabled = false;
                    this.speak('监控已关闭');
                    break;
                case 'pause':
                    ProcrastinationMonitor.pauseWithCoins();
                    break;
                case 'complete':
                    ProcrastinationMonitor.completeStep();
                    break;
            }
        }
    },
    
    // 获取下一个可用时间
    getNextAvailableTime() {
        const now = new Date();
        const minutes = Math.ceil(now.getMinutes() / 5) * 5;
        now.setMinutes(minutes);
        return now.getHours().toString().padStart(2, '0') + ':' + 
               now.getMinutes().toString().padStart(2, '0');
    },
    
    // ==================== 语音播报 ====================
    
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.log('语音播报(不支持):', text);
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.settings.language;
            utterance.rate = options.rate || this.settings.voiceRate;
            utterance.pitch = options.pitch || this.settings.voicePitch;
            utterance.volume = options.volume || this.settings.voiceVolume;
            
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
            
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            
            this.synthesis.speak(utterance);
            console.log('语音播报:', text);
        });
    },
    
    // 播报任务完成
    announceTaskComplete(task, reward) {
        if (!this.isEnabled) return;
        this.speak(`太棒了！${task.title}已完成，获得${reward}金币`);
    },
    
    // ==================== 控制方法 ====================
    
    start() {
        this.isEnabled = true;
        this.settings.enabled = true;
        this.saveSettings();
        this.startListening();
        this.updateUI();
        console.log('语音助手已启动');
    },
    
    stop() {
        this.isEnabled = false;
        this.settings.enabled = false;
        this.saveSettings();
        this.stopListening();
        this.updateUI();
        console.log('语音助手已停止');
    },
    
    toggle() {
        if (this.isEnabled) {
            this.stop();
            this.speak('语音助手已关闭');
        } else {
            this.start();
            this.speak('语音助手已开启');
        }
        return this.isEnabled;
    },
    
    startListening() {
        if (!this.recognition) return;
        try {
            this.isListening = true;
            this.recognition.start();
        } catch (e) {
            console.error('启动语音识别失败:', e);
        }
    },
    
    stopListening() {
        if (!this.recognition) return;
        this.isListening = false;
        try {
            this.recognition.stop();
        } catch (e) {}
    },
    
    // ==================== UI ====================
    
    renderUI() {
        // 创建浮动按钮
        let btn = document.getElementById('voiceAssistantBtn');
        if (btn) btn.remove();
        
        btn = document.createElement('button');
        btn.id = 'voiceAssistantBtn';
        btn.className = 'voice-assistant-btn' + (this.isEnabled ? ' active' : '');
        btn.innerHTML = '🎤';
        btn.title = '语音助手 (说"嘿助手"唤醒)';
        btn.onclick = () => this.toggle();
        
        document.body.appendChild(btn);
    },
    
    updateUI() {
        const btn = document.getElementById('voiceAssistantBtn');
        if (btn) {
            btn.className = 'voice-assistant-btn' + (this.isEnabled ? ' active' : '');
        }
    },
    
    showListeningUI() {
        const btn = document.getElementById('voiceAssistantBtn');
        if (btn) btn.classList.add('listening');
    },
    
    hideListeningUI() {
        const btn = document.getElementById('voiceAssistantBtn');
        if (btn) btn.classList.remove('listening');
    },
    
    showProcessingUI() {
        const btn = document.getElementById('voiceAssistantBtn');
        if (btn) btn.classList.add('processing');
    },
    
    hideProcessingUI() {
        const btn = document.getElementById('voiceAssistantBtn');
        if (btn) btn.classList.remove('processing');
    }
};

// 导出
window.VoiceAssistant = VoiceAssistant;

