// ============================================================
// 统一监控系统 v4.0
// 合并拖延监控和效率监控，修复任务状态关联
// ============================================================

const MonitorSystem = {
    // 版本
    version: '4.0.0',
    
    // 状态
    currentTask: null,
    isActive: false,
    elapsedSeconds: 0,
    currentCycle: 1,
    totalPaidCoins: 0,
    isPaused: false,
    pauseEndTime: null,
    preAlertShown: false,
    
    // 定时器
    monitorTimer: null,
    countdownTimer: null,
    
    // 已触发任务
    triggeredTasks: [],
    
    // 历史记录
    history: [],
    
    // 设置
    settings: {
        enabled: true,
        gracePeriod: 120,        // 宽限期（秒）
        preAlertTime: 20,        // 预警时间（秒）
        baseCost: 5,             // 基础扣币
        costIncrement: 1.5,      // 递增系数
        maxCost: 50,             // 最大扣币
        successReward: 3,        // 成功奖励
        soundEnabled: true,
        voiceEnabled: true,
        pauseCost: 10,           // 暂停费用
        pauseDuration: 1800      // 暂停时长（秒）
    },
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('MonitorSystem 初始化...');
        this.loadSettings();
        this.loadHistory();
        this.loadTriggeredTasks();
        this.setupEventListeners();
        
        if (this.settings.enabled) {
            this.startAutoMonitor();
        }
        
        console.log('MonitorSystem 初始化完成');
    },
    
    loadSettings() {
        const saved = localStorage.getItem('monitor_settings_v4');
        if (saved) {
            Object.assign(this.settings, JSON.parse(saved));
        }
    },
    
    saveSettings() {
        localStorage.setItem('monitor_settings_v4', JSON.stringify(this.settings));
    },
    
    loadHistory() {
        this.history = JSON.parse(localStorage.getItem('monitor_history') || '[]');
    },
    
    saveHistory() {
        localStorage.setItem('monitor_history', JSON.stringify(this.history.slice(-100)));
    },
    
    loadTriggeredTasks() {
        const today = this.formatDate(new Date());
        const saved = JSON.parse(localStorage.getItem('monitor_triggered') || '{}');
        this.triggeredTasks = saved[today] || [];
    },
    
    saveTriggeredTasks() {
        const today = this.formatDate(new Date());
        const saved = JSON.parse(localStorage.getItem('monitor_triggered') || '{}');
        saved[today] = this.triggeredTasks;
        localStorage.setItem('monitor_triggered', JSON.stringify(saved));
    },
    
    // ==================== 事件监听 ====================
    
    setupEventListeners() {
        // 监听任务完成事件
        document.addEventListener('taskCompleted', (e) => {
            if (e.detail?.taskId && this.currentTask?.id === e.detail.taskId) {
                this.onTaskCompleted('task');
            }
        });
        
        // 监听子任务完成事件
        document.addEventListener('subtaskCompleted', (e) => {
            if (e.detail?.taskId && this.currentTask?.id === e.detail.taskId) {
                this.onTaskCompleted('subtask');
            }
        });
        
        // 订阅全局状态
        if (typeof GlobalState !== 'undefined') {
            GlobalState.subscribe('taskCompleted', (data) => {
                if (this.currentTask?.id === data.task.id) {
                    this.onTaskCompleted('task');
                }
            });
        }
    },
    
    // ==================== 自动监控 ====================
    
    startAutoMonitor() {
        if (this.monitorTimer) clearInterval(this.monitorTimer);
        
        this.monitorTimer = setInterval(() => {
            if (!this.settings.enabled) return;
            this.checkForDueTasks();
        }, 1000);
        
        console.log('自动监控已启动');
    },
    
    stopAutoMonitor() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        console.log('自动监控已停止');
    },
    
    checkForDueTasks() {
        if (this.currentTask) return;
        
        const now = new Date();
        const today = this.formatDate(now);
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        // 获取今日任务
        const tasks = typeof GlobalState !== 'undefined' ? 
            GlobalState.tasks : (typeof Storage !== 'undefined' ? Storage.getTasks() : []);
        
        const todayTasks = tasks.filter(t => t.date === today && !t.completed);
        
        for (const task of todayTasks) {
            if (this.triggeredTasks.includes(task.id)) continue;
            
            if (task.startTime === currentTime) {
                this.triggerMonitor(task);
                break;
            }
        }
    },
    
    // ==================== 触发监控 ====================
    
    triggerMonitor(task) {
        console.log('触发监控:', task.title);
        
        // 记录已触发
        this.triggeredTasks.push(task.id);
        this.saveTriggeredTasks();
        
        // 设置状态
        this.currentTask = task;
        this.isActive = true;
        this.elapsedSeconds = 0;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.preAlertShown = false;
        this.isPaused = false;
        
        // 获取启动步骤
        const startupStep = task.substeps?.[0]?.title || '开始执行';
        
        // 播放提示音
        this.playSound('chime');
        
        // 发送通知
        this.sendNotification('⏰ 任务时间到！', 
            `【${task.title}】请在${this.settings.gracePeriod / 60}分钟内开始`);
        
        // 聊天消息
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `⏰ 任务时间到！【${task.title}】\n` +
                `请在 ${this.settings.gracePeriod / 60} 分钟内完成启动步骤：【${startupStep}】\n` +
                `成功启动可获得 ${this.settings.successReward} 金币奖励！`,
                '⏰'
            );
        }
        
        // 开始倒计时
        this.startCountdown();
        
        // 更新UI
        this.updateUI();
        
        // 更新全局状态
        if (typeof GlobalState !== 'undefined') {
            GlobalState.monitor.currentTask = task;
            GlobalState.monitor.isActive = true;
        }
    },
    
    // ==================== 倒计时 ====================
    
    startCountdown() {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        
        this.countdownTimer = setInterval(() => {
            if (this.isPaused) {
                // 检查暂停是否结束
                if (this.pauseEndTime && new Date() >= this.pauseEndTime) {
                    this.resumeFromPause();
                }
                return;
            }
            
            this.elapsedSeconds++;
            const remaining = this.settings.gracePeriod - this.elapsedSeconds;
            
            // 预警
            if (!this.preAlertShown && remaining <= this.settings.preAlertTime && remaining > 0) {
                this.preAlertShown = true;
                this.showPreAlert(remaining);
            }
            
            // 超时
            if (this.elapsedSeconds >= this.settings.gracePeriod) {
                this.triggerAlert();
            }
            
            // 更新显示
            this.updateCountdownDisplay();
            
        }, 1000);
    },
    
    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    },
    
    // ==================== 预警和警报 ====================
    
    showPreAlert(remaining) {
        const task = this.currentTask;
        const step = task.substeps?.[0]?.title || '开始执行';
        
        this.playSound('warning');
        
        if (this.settings.voiceEnabled && typeof VoiceAssistant !== 'undefined') {
            VoiceAssistant.speak(`还有${remaining}秒，准备开始${task.title}`);
        }
        
        this.sendNotification('⚠️ 预警提醒', `还有${remaining}秒！准备开始【${task.title}】`);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `⚠️ 还有${remaining}秒！准备开始【${task.title}】的启动步骤【${step}】！`,
                '⚠️'
            );
        }
    },
    
    triggerAlert() {
        const task = this.currentTask;
        const step = task.substeps?.[0]?.title || '开始执行';
        
        // 计算扣币
        const cost = this.calculateCost();
        const actualCost = typeof GlobalState !== 'undefined' ? 
            GlobalState.deductCoins(cost, `拖延任务: ${task.title}`, 'procrastination') :
            cost;
        
        this.totalPaidCoins += actualCost;
        
        // 播放警报
        this.playSound('alarm');
        
        if (this.settings.voiceEnabled && typeof VoiceAssistant !== 'undefined') {
            VoiceAssistant.speak(`任务${task.title}已超时，请立即开始`);
        }
        
        this.sendNotification('🚨 启动超时！', `已扣除${actualCost}金币！请立即开始【${task.title}】`);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🚨 启动超时！已扣除 ${actualCost} 金币！\n` +
                `请立即完成【${step}】！\n` +
                `第 ${this.currentCycle} 次循环，累计扣除：${this.totalPaidCoins} 金币`,
                '🚨'
            );
            App.updateGameStatus();
        }
        
        // 新循环
        this.currentCycle++;
        this.elapsedSeconds = 0;
        this.preAlertShown = false;
        
        this.updateUI();
    },
    
    calculateCost() {
        const cost = Math.floor(
            this.settings.baseCost * 
            Math.pow(this.settings.costIncrement, this.currentCycle - 1)
        );
        return Math.min(cost, this.settings.maxCost);
    },
    
    // ==================== 完成操作 ====================
    
    completeStep() {
        if (!this.currentTask) return;
        
        this.stopCountdown();
        
        const task = this.currentTask;
        let reward = 0;
        let status = 'success';
        
        if (this.currentCycle === 1 && this.elapsedSeconds < this.settings.gracePeriod) {
            // 成功启动
            reward = this.settings.successReward;
            
            // 快速启动额外奖励
            if (this.elapsedSeconds < 30) {
                reward += 2;
            } else if (this.elapsedSeconds < 60) {
                reward += 1;
            }
            
            if (typeof GlobalState !== 'undefined') {
                GlobalState.addCoins(reward, `按时启动: ${task.title}`, 'startup_reward');
            }
            
            this.playSound('success');
            
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', 
                    `🎉 太棒了！成功启动任务【${task.title}】！\n` +
                    `获得 ${reward} 金币奖励！用时：${this.elapsedSeconds}秒`,
                    '🏆'
                );
                App.updateGameStatus();
            }
        } else {
            // 延迟完成
            status = this.totalPaidCoins > 0 ? 'paid' : 'delayed';
            
            this.playSound('chime');
            
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', 
                    `✅ 任务【${task.title}】已完成启动\n` +
                    (this.totalPaidCoins > 0 ? `本次共扣除 ${this.totalPaidCoins} 金币\n` : '') +
                    `虽然有些波折，但完成就是胜利！💪`,
                    '💪'
                );
            }
        }
        
        // 记录历史
        this.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            status,
            duration: this.elapsedSeconds,
            reward,
            cycles: this.currentCycle,
            totalPaid: this.totalPaidCoins
        });
        
        this.resetState();
        this.updateUI();
    },
    
    onTaskCompleted(type) {
        if (!this.currentTask) return;
        
        console.log('任务完成，终止监控:', type);
        
        this.stopCountdown();
        
        const task = this.currentTask;
        let reward = this.settings.successReward;
        
        // 额外奖励
        if (this.currentCycle === 1 && this.elapsedSeconds < 30) {
            reward += 2;
        }
        
        // 返还部分扣除的金币
        if (this.totalPaidCoins > 0) {
            const refund = Math.floor(this.totalPaidCoins * 0.3);
            reward += refund;
        }
        
        if (typeof GlobalState !== 'undefined') {
            GlobalState.addCoins(reward, `完成任务: ${task.title}`, 'task_complete');
        }
        
        this.playSound('success');
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🎉 任务【${task.title}】完成！监控已自动终止\n获得 ${reward} 金币奖励！`,
                '🏆'
            );
            App.updateGameStatus();
        }
        
        this.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            status: 'success',
            duration: this.elapsedSeconds,
            reward,
            cycles: this.currentCycle,
            totalPaid: this.totalPaidCoins,
            completionType: type
        });
        
        this.resetState();
        this.updateUI();
    },
    
    skipTask() {
        if (!this.currentTask) return;
        
        this.stopCountdown();
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', `已跳过任务【${this.currentTask.title}】的监控`, '⏭️');
        }
        
        this.resetState();
        this.updateUI();
    },
    
    // ==================== 暂停功能 ====================
    
    pauseWithCoins() {
        const cost = this.settings.pauseCost;
        
        if (typeof GlobalState !== 'undefined' && !GlobalState.hasEnoughCoins(cost)) {
            if (typeof App !== 'undefined') {
                App.addChatMessage('system', `金币不足！需要${cost}金币`, '❌');
            }
            return;
        }
        
        if (typeof GlobalState !== 'undefined') {
            GlobalState.deductCoins(cost, '暂停监控', 'pause');
        }
        
        this.isPaused = true;
        this.pauseEndTime = new Date(Date.now() + this.settings.pauseDuration * 1000);
        
        const minutes = Math.floor(this.settings.pauseDuration / 60);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `✅ 已支付${cost}金币暂停提醒${minutes}分钟`,
                '💰'
            );
            App.updateGameStatus();
        }
        
        this.updateUI();
    },
    
    resumeFromPause() {
        this.isPaused = false;
        this.pauseEndTime = null;
        
        if (this.currentTask && typeof App !== 'undefined') {
            App.addChatMessage('system', '⏰ 暂停时间已结束！请继续任务', '🚨');
        }
        
        this.updateUI();
    },
    
    // ==================== 工具方法 ====================
    
    resetState() {
        this.currentTask = null;
        this.isActive = false;
        this.elapsedSeconds = 0;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.preAlertShown = false;
        this.isPaused = false;
        this.pauseEndTime = null;
        
        if (typeof GlobalState !== 'undefined') {
            GlobalState.monitor.currentTask = null;
            GlobalState.monitor.isActive = false;
        }
    },
    
    addHistory(record) {
        record.timestamp = new Date().toISOString();
        this.history.unshift(record);
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
        this.saveHistory();
    },
    
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               d.getDate().toString().padStart(2, '0');
    },
    
    // ==================== 音效和通知 ====================
    
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        if (typeof UnifiedAudioSystem !== 'undefined') {
            UnifiedAudioSystem.playSound(type);
        }
    },
    
    sendNotification(title, body) {
        if (typeof Settings !== 'undefined' && Settings.sendNotification) {
            Settings.sendNotification(title, body, '⏰');
        }
    },
    
    // ==================== UI ====================
    
    updateUI() {
        if (typeof App !== 'undefined' && App.loadMonitorPanel) {
            App.loadMonitorPanel();
        }
    },
    
    updateCountdownDisplay() {
        const display = document.getElementById('monitorCountdown');
        if (display && this.currentTask) {
            const remaining = Math.max(0, this.settings.gracePeriod - this.elapsedSeconds);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    },
    
    // 切换启用状态
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        this.saveSettings();
        
        if (this.settings.enabled) {
            this.startAutoMonitor();
        } else {
            this.stopAutoMonitor();
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                this.settings.enabled ? '✅ 监控已启用' : '⏸️ 监控已暂停',
                this.settings.enabled ? '✅' : '⏸️'
            );
        }
        
        this.updateUI();
    },
    
    // 获取统计
    getStats() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        let weeklySuccess = 0;
        let weeklyDelays = 0;
        let totalSpent = 0;
        
        this.history.forEach(h => {
            if (new Date(h.timestamp) > weekAgo) {
                if (h.status === 'success') weeklySuccess++;
                else weeklyDelays++;
            }
            if (h.totalPaid > 0) totalSpent += h.totalPaid;
        });
        
        return { weeklySuccess, weeklyDelays, totalSpent };
    }
};

// 导出
window.MonitorSystem = MonitorSystem;

// 兼容旧版
window.ProcrastinationMonitor = {
    init: () => MonitorSystem.init(),
    settings: MonitorSystem.settings,
    currentTask: null,
    get elapsedSeconds() { return MonitorSystem.elapsedSeconds; },
    get currentCycle() { return MonitorSystem.currentCycle; },
    get totalPaidCoins() { return MonitorSystem.totalPaidCoins; },
    get isAlertActive() { return MonitorSystem.elapsedSeconds >= MonitorSystem.settings.gracePeriod; },
    get history() { return MonitorSystem.history; },
    completeStep: () => MonitorSystem.completeStep(),
    skipCurrentTask: () => MonitorSystem.skipTask(),
    toggleEnabled: () => MonitorSystem.toggleEnabled(),
    toggleSound: () => { MonitorSystem.settings.soundEnabled = !MonitorSystem.settings.soundEnabled; MonitorSystem.saveSettings(); },
    pauseWithCoins: () => MonitorSystem.pauseWithCoins(),
    getStats: () => MonitorSystem.getStats(),
    updateSetting: (k, v) => { MonitorSystem.settings[k] = v; MonitorSystem.saveSettings(); },
    testSound: (t) => MonitorSystem.playSound(t || 'chime')
};

