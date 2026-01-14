// 统一语音系统 v1.0
// 整合所有语音功能到一个模块，提供清晰的语音触发点和可视化设置

const UnifiedVoiceSystem = {
    // 状态
    isEnabled: false,
    isListening: false,
    recognition: null,
    synthesis: window.speechSynthesis,
    availableVoices: [],
    selectedVoice: null,
    
    // 定时器
    taskCheckTimer: null,
    hourlyCheckTimer: null,
    
    // 当前任务状态
    currentTask: null,
    taskStartTime: null,
    lastHourlyReminder: null,
    
    // 拖延倒计时状态
    procrastinationTimer: null,
    procrastinationSeconds: 0,
    isProcrastinationActive: false,
    
    // 已播报记录（防止重复播报）
    announcedTasks: new Set(),
    
    // 设置
    settings: {
        enabled: true,
        // 语音风格
        voiceName: '',           // 选择的语音名称
        voiceRate: 1.0,          // 语速 0.5-2
        voicePitch: 1.0,         // 音调 0.5-2
        voiceVolume: 1.0,        // 音量 0-1
        
        // 触发点开关
        taskPreStart: true,      // 任务即将开始
        taskStart: true,         // 任务正式开始
        taskEndCountdown: true,  // 任务结束倒计时
        taskComplete: true,      // 任务完成
        procrastinationWarning: true,  // 拖延预警
        hourlyProgress: true,    // 每小时进度询问
        
        // 时间设置
        preStartMinutes: 5,      // 提前几分钟提醒
        endCountdownMinutes: 10, // 结束前几分钟提醒
        procrastinationGrace: 120,    // 拖延宽限期（秒）
        procrastinationWarningAt: 20, // 剩余多少秒时预警
        hourlyInterval: 60,      // 每小时提醒间隔（分钟）
        
        // 自定义语音文本
        texts: {
            preStart: "距离{task}开始还有{minutes}分钟，请准备好",
            taskStart: "{task}现在开始，加油！",
            endCountdown: "还有{minutes}分钟，{task}就要结束了",
            taskComplete: "太棒了！{task}已完成！",
            procrastinationWarning: "还有{seconds}秒钟启动哦，准备好了吗？",
            procrastinationAlert: "时间到了！请立即开始{task}！",
            hourlyProgress: "已经过去{hours}小时了，{task}进展如何？",
            currentTaskQuery: "当前任务是{task}，{status}",
            nextTaskQuery: "下一个任务是{task}，将于{time}开始"
        }
    },
    
    // 语音指令
    commands: {
        '当前任务': 'queryCurrentTask',
        '什么任务': 'queryCurrentTask',
        '下一个任务': 'queryNextTask',
        '下一个': 'queryNextTask',
        '任务进度': 'queryProgress',
        '还有多久': 'queryTimeRemaining',
        '完成': 'completeCurrentTask',
        '已完成': 'completeCurrentTask',
        '开始': 'confirmStart',
        '启动': 'confirmStart'
    },
    
    // 初始化
    init() {
        console.log('统一语音系统初始化...');
        this.loadSettings();
        this.loadVoices();
        this.initSpeechRecognition();
        
        // 每日重置已播报记录
        this.resetDailyAnnouncements();
        
        // 监听任务完成事件
        this.setupEventListeners();
        
        if (this.settings.enabled) {
            this.start();
        }
        
        // 监听语音列表加载
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // 添加浮动语音按钮
        this.renderFloatingButton();
        
        console.log('统一语音系统初始化完成');
    },
    
    // 设置事件监听
    setupEventListeners() {
        // 监听任务完成事件
        document.addEventListener('taskCompleted', (e) => {
            if (e.detail && e.detail.task) {
                this.announceTaskComplete(e.detail.task);
            }
        });
        
        // 监听子任务完成事件
        document.addEventListener('subtaskCompleted', (e) => {
            if (this.isEnabled && e.detail) {
                this.speak('子任务已完成，继续加油！');
            }
        });
    },
    
    // 每日重置已播报记录
    resetDailyAnnouncements() {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('voice_last_reset');
        if (lastReset !== today) {
            this.announcedTasks.clear();
            localStorage.setItem('voice_last_reset', today);
        }
    },
    
    // 渲染浮动语音按钮
    renderFloatingButton() {
        let btn = document.getElementById('floatingVoiceBtn');
        if (btn) btn.remove();
        
        btn = document.createElement('button');
        btn.id = 'floatingVoiceBtn';
        btn.className = 'floating-voice-btn' + (this.isEnabled ? ' active' : '');
        btn.innerHTML = this.isEnabled ? '🔊' : '🔇';
        btn.title = '语音助手';
        btn.onclick = () => {
            this.toggle();
            btn.innerHTML = this.isEnabled ? '🔊' : '🔇';
            btn.className = 'floating-voice-btn' + (this.isEnabled ? ' active' : '');
            // 刷新设置面板
            if (typeof VoiceSettingsPanel !== 'undefined') {
                VoiceSettingsPanel.refresh();
            }
        };
        
        document.body.appendChild(btn);
    },
    
    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('unified_voice_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                // 确保texts对象完整
                this.settings.texts = { ...this.settings.texts, ...parsed.texts };
            } catch (e) {
                console.error('加载语音设置失败:', e);
            }
        }
        this.isEnabled = this.settings.enabled;
    },
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('unified_voice_settings', JSON.stringify(this.settings));
    },
    
    // 加载可用语音
    loadVoices() {
        if (!this.synthesis) return;
        
        this.availableVoices = this.synthesis.getVoices();
        
        // 筛选中文语音
        const chineseVoices = this.availableVoices.filter(v => 
            v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('TW')
        );
        
        console.log('可用中文语音:', chineseVoices.map(v => v.name));
        
        // 如果有保存的语音，尝试恢复
        if (this.settings.voiceName) {
            this.selectedVoice = this.availableVoices.find(v => v.name === this.settings.voiceName);
        }
        
        // 如果没有选择语音，选择第一个中文语音
        if (!this.selectedVoice && chineseVoices.length > 0) {
            this.selectedVoice = chineseVoices[0];
        }
    },
    
    // 获取中文语音列表
    getChineseVoices() {
        return this.availableVoices.filter(v => 
            v.lang.includes('zh') || v.lang.includes('CN') || v.lang.includes('TW')
        );
    },
    
    // 初始化语音识别
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('浏览器不支持语音识别');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'zh-CN';
        
        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript.trim();
            console.log('识别到语音:', text);
            this.processVoiceCommand(text);
        };
        
        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (this.isEnabled && this.isListening) {
                setTimeout(() => this.startListening(), 1000);
            }
        };
        
        this.recognition.onend = () => {
            if (this.isEnabled && this.isListening) {
                setTimeout(() => this.startListening(), 500);
            }
        };
    },
    
    // 启动系统
    start() {
        this.isEnabled = true;
        this.settings.enabled = true;
        this.saveSettings();
        
        this.startListening();
        this.startTaskMonitor();
        this.startHourlyMonitor();
        
        console.log('语音系统已启动');
    },
    
    // 停止系统
    stop() {
        this.isEnabled = false;
        this.settings.enabled = false;
        this.saveSettings();
        
        this.stopListening();
        this.stopTaskMonitor();
        this.stopHourlyMonitor();
        this.stopProcrastinationTimer();
        
        console.log('语音系统已停止');
    },
    
    // 切换开关
    toggle() {
        if (this.isEnabled) {
            this.stop();
            this.speak('语音系统已关闭');
        } else {
            this.start();
            this.speak('语音系统已开启');
        }
        return this.isEnabled;
    },
    
    // 开始监听
    startListening() {
        if (!this.recognition) return;
        try {
            this.isListening = true;
            this.recognition.start();
        } catch (e) {
            console.error('启动语音识别失败:', e);
        }
    },
    
    // 停止监听
    stopListening() {
        if (!this.recognition) return;
        this.isListening = false;
        try {
            this.recognition.stop();
        } catch (e) {}
    },
    
    // ==================== 语音播报 ====================
    
    // 核心播报方法
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.log('语音播报(不支持):', text);
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            // 取消之前的播报
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
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
    
    // 替换模板变量
    formatText(template, vars) {
        let text = template;
        for (const [key, value] of Object.entries(vars)) {
            text = text.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return text;
    },
    
    // ==================== 任务监控 ====================
    
    // 启动任务监控（每秒检查）
    startTaskMonitor() {
        if (this.taskCheckTimer) clearInterval(this.taskCheckTimer);
        
        this.taskCheckTimer = setInterval(() => {
            if (!this.isEnabled) return;
            this.checkTaskTriggers();
        }, 1000);
        
        // 立即检查一次
        setTimeout(() => this.checkTaskTriggers(), 1000);
    },
    
    // 停止任务监控
    stopTaskMonitor() {
        if (this.taskCheckTimer) {
            clearInterval(this.taskCheckTimer);
            this.taskCheckTimer = null;
        }
    },
    
    // 检查任务触发点
    checkTaskTriggers() {
        const tasks = this.getTodayTasks();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentSeconds = now.getSeconds();
        const todayKey = now.toDateString();
        
        for (const task of tasks) {
            if (task.completed) continue;
            
            const [startH, startM] = task.startTime.split(':').map(Number);
            const taskStartMinutes = startH * 60 + startM;
            const duration = task.duration || 30;
            const taskEndMinutes = taskStartMinutes + duration;
            
            // 生成唯一标识
            const taskKey = `${todayKey}_${task.id}`;
            
            // 1. 任务即将开始提醒
            if (this.settings.taskPreStart) {
                const preStartMinutes = taskStartMinutes - this.settings.preStartMinutes;
                if (currentMinutes === preStartMinutes && currentSeconds < 5) {
                    const preStartKey = `${taskKey}_preStart`;
                    if (!this.announcedTasks.has(preStartKey)) {
                        this.announcedTasks.add(preStartKey);
                        this.announcePreStart(task);
                    }
                }
            }
            
            // 2. 任务正式开始
            if (this.settings.taskStart) {
                if (currentMinutes === taskStartMinutes && currentSeconds < 5) {
                    const startKey = `${taskKey}_start`;
                    if (!this.announcedTasks.has(startKey)) {
                        this.announcedTasks.add(startKey);
                        this.announceTaskStart(task);
                    }
                }
            }
            
            // 3. 任务结束倒计时提醒
            if (this.settings.taskEndCountdown) {
                const endCountdownMinutes = taskEndMinutes - this.settings.endCountdownMinutes;
                if (currentMinutes === endCountdownMinutes && currentSeconds < 5) {
                    const endKey = `${taskKey}_endCountdown`;
                    if (!this.announcedTasks.has(endKey) && currentMinutes >= taskStartMinutes) {
                        this.announcedTasks.add(endKey);
                        this.announceEndCountdown(task);
                    }
                }
            }
        }
    },
    
    // 播报：任务即将开始
    announcePreStart(task) {
        const text = this.formatText(this.settings.texts.preStart, {
            task: task.title,
            minutes: this.settings.preStartMinutes
        });
        this.speak(text);
        this.showNotification('任务即将开始', text);
    },
    
    // 播报：任务正式开始
    announceTaskStart(task) {
        this.currentTask = task;
        this.taskStartTime = new Date();
        this.lastHourlyReminder = new Date();
        
        const text = this.formatText(this.settings.texts.taskStart, {
            task: task.title
        });
        this.speak(text);
        this.showNotification('任务开始', text);
        
        // 启动拖延监控
        if (this.settings.procrastinationWarning) {
            this.startProcrastinationTimer(task);
        }
        
        // 触发庆祝音效
        this.playSound('taskStart');
    },
    
    // 播报：任务结束倒计时
    announceEndCountdown(task) {
        const text = this.formatText(this.settings.texts.endCountdown, {
            task: task.title,
            minutes: this.settings.endCountdownMinutes
        });
        this.speak(text);
        this.showNotification('任务即将结束', text);
    },
    
    // 播报：任务完成
    announceTaskComplete(task) {
        if (!this.isEnabled || !this.settings.taskComplete) return;
        
        const text = this.formatText(this.settings.texts.taskComplete, {
            task: task.title
        });
        this.speak(text);
        
        // 播放庆祝音效
        this.playSound('celebration');
        
        // 停止拖延监控
        this.stopProcrastinationTimer();
        
        // 重置当前任务
        this.currentTask = null;
        this.taskStartTime = null;
        
        // 播报下一个任务
        setTimeout(() => {
            const nextTask = this.getNextTask();
            if (nextTask) {
                this.speak(`下一个任务是${nextTask.title}，将于${nextTask.startTime}开始`);
            }
        }, 2000);
    },
    
    // ==================== 拖延监控 ====================
    
    // 启动拖延倒计时
    startProcrastinationTimer(task) {
        this.stopProcrastinationTimer();
        
        this.isProcrastinationActive = true;
        this.procrastinationSeconds = this.settings.procrastinationGrace;
        
        this.procrastinationTimer = setInterval(() => {
            if (!this.isProcrastinationActive) return;
            
            this.procrastinationSeconds--;
            
            // 预警提醒
            if (this.procrastinationSeconds === this.settings.procrastinationWarningAt) {
                const text = this.formatText(this.settings.texts.procrastinationWarning, {
                    seconds: this.settings.procrastinationWarningAt
                });
                this.speak(text);
            }
            
            // 时间到
            if (this.procrastinationSeconds <= 0) {
                this.triggerProcrastinationAlert(task);
            }
        }, 1000);
    },
    
    // 停止拖延倒计时
    stopProcrastinationTimer() {
        this.isProcrastinationActive = false;
        if (this.procrastinationTimer) {
            clearInterval(this.procrastinationTimer);
            this.procrastinationTimer = null;
        }
    },
    
    // 触发拖延警报
    triggerProcrastinationAlert(task) {
        const text = this.formatText(this.settings.texts.procrastinationAlert, {
            task: task.title
        });
        this.speak(text);
        this.playSound('alert');
        this.showNotification('拖延警报', text);
        
        // 重新开始倒计时（循环提醒）
        this.procrastinationSeconds = this.settings.procrastinationGrace;
    },
    
    // 确认启动（用户说"开始"或"启动"）
    confirmStart() {
        if (this.isProcrastinationActive) {
            this.stopProcrastinationTimer();
            this.speak('好的，已确认启动，加油！');
            this.playSound('success');
        }
    },
    
    // ==================== 每小时进度提醒 ====================
    
    // 启动每小时监控
    startHourlyMonitor() {
        if (this.hourlyCheckTimer) clearInterval(this.hourlyCheckTimer);
        
        this.hourlyCheckTimer = setInterval(() => {
            if (!this.isEnabled || !this.settings.hourlyProgress) return;
            this.checkHourlyProgress();
        }, 60000); // 每分钟检查
    },
    
    // 停止每小时监控
    stopHourlyMonitor() {
        if (this.hourlyCheckTimer) {
            clearInterval(this.hourlyCheckTimer);
            this.hourlyCheckTimer = null;
        }
    },
    
    // 检查每小时进度
    checkHourlyProgress() {
        if (!this.currentTask || !this.taskStartTime) return;
        
        const now = new Date();
        const elapsed = (now - this.lastHourlyReminder) / 1000 / 60; // 分钟
        
        if (elapsed >= this.settings.hourlyInterval) {
            this.lastHourlyReminder = now;
            const hours = Math.floor((now - this.taskStartTime) / 1000 / 60 / 60);
            
            const text = this.formatText(this.settings.texts.hourlyProgress, {
                task: this.currentTask.title,
                hours: hours || 1
            });
            this.speak(text);
            
            // 显示进度填写弹窗
            this.showProgressDialog();
        }
    },
    
    // 显示进度对话框
    showProgressDialog() {
        // 触发自定义事件，让UI层处理
        const event = new CustomEvent('voiceProgressCheck', {
            detail: { task: this.currentTask }
        });
        document.dispatchEvent(event);
    },
    
    // ==================== 语音指令处理 ====================
    
    // 处理语音指令
    processVoiceCommand(text) {
        for (const [keyword, action] of Object.entries(this.commands)) {
            if (text.includes(keyword)) {
                this[action]();
                return;
            }
        }
    },
    
    // 查询当前任务
    queryCurrentTask() {
        const task = this.getCurrentTask();
        if (task) {
            const status = this.getTaskStatus(task);
            const text = this.formatText(this.settings.texts.currentTaskQuery, {
                task: task.title,
                status: status
            });
            this.speak(text);
        } else {
            this.speak('当前没有进行中的任务');
        }
    },
    
    // 查询下一个任务
    queryNextTask() {
        const task = this.getNextTask();
        if (task) {
            const text = this.formatText(this.settings.texts.nextTaskQuery, {
                task: task.title,
                time: task.startTime
            });
            this.speak(text);
        } else {
            this.speak('今天没有更多任务了');
        }
    },
    
    // 查询进度
    queryProgress() {
        if (this.currentTask && this.taskStartTime) {
            const elapsed = Math.floor((new Date() - this.taskStartTime) / 1000 / 60);
            this.speak(`${this.currentTask.title}已进行${elapsed}分钟`);
        } else {
            this.speak('当前没有进行中的任务');
        }
    },
    
    // 查询剩余时间
    queryTimeRemaining() {
        const task = this.getCurrentTask();
        if (task) {
            const now = new Date();
            const [endH, endM] = this.getTaskEndTime(task).split(':').map(Number);
            const endMinutes = endH * 60 + endM;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const remaining = endMinutes - currentMinutes;
            
            if (remaining > 0) {
                this.speak(`还有${remaining}分钟，${task.title}就要结束了`);
            } else {
                this.speak(`${task.title}已经超时了`);
            }
        } else {
            this.speak('当前没有进行中的任务');
        }
    },
    
    // 完成当前任务
    completeCurrentTask() {
        if (this.currentTask) {
            this.announceTaskComplete(this.currentTask);
            // 触发任务完成事件
            const event = new CustomEvent('voiceTaskComplete', {
                detail: { task: this.currentTask }
            });
            document.dispatchEvent(event);
        } else {
            this.speak('当前没有进行中的任务');
        }
    },
    
    // ==================== 辅助方法 ====================
    
    // 获取今天的任务
    getTodayTasks() {
        if (typeof Storage === 'undefined') return [];
        const tasks = Storage.getTasks() || [];
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
            String(today.getMonth() + 1).padStart(2, '0') + '-' + 
            String(today.getDate()).padStart(2, '0');
        return tasks.filter(t => t.date === todayStr);
    },
    
    // 获取当前任务
    getCurrentTask() {
        const tasks = this.getTodayTasks();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        return tasks.find(t => {
            if (t.completed) return false;
            const [startH, startM] = t.startTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const duration = t.duration || 30;
            const endMinutes = startMinutes + duration;
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });
    },
    
    // 获取下一个任务
    getNextTask() {
        const tasks = this.getTodayTasks();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const futureTasks = tasks.filter(t => {
            if (t.completed) return false;
            const [startH, startM] = t.startTime.split(':').map(Number);
            return startH * 60 + startM > currentMinutes;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        return futureTasks[0];
    },
    
    // 获取任务状态描述
    getTaskStatus(task) {
        if (!this.taskStartTime) return '刚开始';
        const elapsed = Math.floor((new Date() - this.taskStartTime) / 1000 / 60);
        if (elapsed < 5) return '刚开始';
        if (elapsed < 30) return '进行中';
        return `已进行${elapsed}分钟`;
    },
    
    // 获取任务结束时间
    getTaskEndTime(task) {
        const [startH, startM] = task.startTime.split(':').map(Number);
        const duration = task.duration || 30;
        const endMinutes = startH * 60 + startM + duration;
        const endH = Math.floor(endMinutes / 60);
        const endM = endMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    },
    
    // 播放音效
    playSound(type) {
        if (typeof CelebrationEffects !== 'undefined') {
            switch (type) {
                case 'celebration':
                    CelebrationEffects.triggerConfetti();
                    CelebrationEffects.playConfettiSound();
                    break;
                case 'success':
                    CelebrationEffects.playCoinSound();
                    break;
                case 'alert':
                    this.playAlertSound();
                    break;
                case 'taskStart':
                    this.playChimeSound();
                    break;
            }
        }
    },
    
    // 播放警报音
    playAlertSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            for (let i = 0; i < 4; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = i % 2 === 0 ? 800 : 600;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.15);
                osc.stop(ctx.currentTime + i * 0.15 + 0.12);
            }
        } catch (e) {}
    },
    
    // 播放提示音
    playChimeSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.3);
            });
        } catch (e) {}
    },
    
    // 显示通知
    showNotification(title, body) {
        if (typeof Settings !== 'undefined' && Settings.sendNotification) {
            Settings.sendNotification(title, body, '🔊');
        }
    },
    
    // 更新设置
    updateSetting(key, value) {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            this.settings[parent][child] = value;
        } else {
            this.settings[key] = value;
        }
        this.saveSettings();
        
        // 如果更改了语音，更新选择
        if (key === 'voiceName') {
            this.selectedVoice = this.availableVoices.find(v => v.name === value);
        }
    },
    
    // 测试语音
    testVoice(text) {
        this.speak(text || '这是一条测试语音，如果你能听到，说明语音系统工作正常');
    }
};

// 导出
window.UnifiedVoiceSystem = UnifiedVoiceSystem;

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => UnifiedVoiceSystem.init(), 1500);
});

