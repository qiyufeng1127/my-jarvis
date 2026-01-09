// 拖延监控模块 - 自动监控时间轴上的所有任务
const ProcrastinationMonitor = {
    // 状态
    monitorTimer: null,         // 任务监控定时器（每秒检查）
    currentTask: null,          // 当前正在监控的任务
    countdownTimer: null,       // 倒计时定时器
    isAlertActive: false,       // 是否处于警报状态
    currentCycle: 1,            // 当前循环次数
    totalPaidCoins: 0,          // 本次任务累计支付金币
    elapsedSeconds: 0,          // 已过去的秒数
    preAlertShown: false,       // 是否已显示预警提示
    triggeredTasks: [],         // 已触发过的任务ID列表
    history: [],                // 拖延历史记录
    audioContext: null,         // Web Audio API 上下文
    
    // 设置项
    settings: {
        enabled: true,              // 是否启用自动监控
        gracePeriod: 120,           // 宽限期（秒）
        preAlertTime: 20,           // 预警时间（秒，倒计时结束前多少秒提醒）
        baseCost: 5,                // 基础金币成本
        costIncrement: 1.5,         // 成本递增比率
        maxCost: 50,                // 最高成本上限
        preAlertMessage: "⏰ 还有{seconds}秒！准备开始【{task}】的启动步骤【{step}】！",
        alertMessage: "🚨 时间到！请立即完成【{step}】！否则将扣除金币！",
        successReward: 3,           // 成功启动奖励金币
        // 声音设置
        soundEnabled: true,         // 是否启用声音提醒
        soundVolume: 0.7,           // 音量 (0-1)
        taskStartSound: 'chime',    // 任务开始提示音类型
        preAlertSound: 'warning',   // 预警提示音类型
        alertSound: 'alarm',        // 超时警报音类型
        successSound: 'success'     // 成功提示音类型
    },
    
    // 初始化
    init() {
        // 加载历史记录
        this.history = Storage.load('adhd_procrastination_history', []);
        
        // 加载设置
        const savedSettings = Storage.load('adhd_procrastination_settings_v2', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
        
        // 加载已触发任务列表（今天的）
        const today = this.formatDate(new Date());
        const savedTriggered = Storage.load('adhd_triggered_tasks', {});
        this.triggeredTasks = savedTriggered[today] || [];
        
        // 初始化音频系统
        this.initAudio();
        
        // 启动自动监控
        if (this.settings.enabled) {
            this.startAutoMonitor();
        }
    },
    
    // ==================== 声音系统 ====================
    
    // 初始化音频系统
    initAudio() {
        try {
            // 创建 AudioContext（需要用户交互后才能播放）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 监听用户交互以解锁音频
            const unlockAudio = () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };
            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);
            
            console.log('音频系统初始化完成');
        } catch (e) {
            console.error('音频系统初始化失败:', e);
        }
    },
    
    // 播放提示音
    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        // 确保音频上下文已创建
        if (!this.audioContext) {
            this.initAudio();
        }
        
        // 如果音频上下文被暂停，尝试恢复
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const volume = this.settings.soundVolume;
        
        switch (type) {
            case 'chime':       // 任务开始 - 清脆的提示音
                this.playChime(volume);
                break;
            case 'warning':     // 预警 - 警告音
                this.playWarning(volume);
                break;
            case 'alarm':       // 超时警报 - 紧急警报音
                this.playAlarm(volume);
                break;
            case 'success':     // 成功 - 欢快的成功音
                this.playSuccess(volume);
                break;
            default:
                this.playChime(volume);
        }
    },
    
    // 清脆提示音（任务开始）
    playChime(volume) {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建振荡器
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // 双音和弦
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5
        
        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
    },
    
    // 警告音（预警）
    playWarning(volume) {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 播放两次短促的警告音
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now + i * 0.2); // A5
            
            gain.gain.setValueAtTime(volume * 0.4, now + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.15);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.2);
            osc.stop(now + i * 0.2 + 0.15);
        }
    },
    
    // 紧急警报音（超时）
    playAlarm(volume) {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 播放紧急警报 - 交替高低音
        for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            // 交替高低频率
            const freq = i % 2 === 0 ? 800 : 600;
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gain.gain.setValueAtTime(volume * 0.35, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.12);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.12);
        }
    },
    
    // 成功音
    playSuccess(volume) {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 上升的三音符
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            
            gain.gain.setValueAtTime(volume * 0.3, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.3);
        });
    },
    
    // 测试声音
    testSound(type) {
        const originalEnabled = this.settings.soundEnabled;
        this.settings.soundEnabled = true;
        this.playSound(type || 'chime');
        this.settings.soundEnabled = originalEnabled;
    },
    
    // 更新音量
    setVolume(volume) {
        this.settings.soundVolume = Math.max(0, Math.min(1, volume));
        Storage.save('adhd_procrastination_settings_v2', this.settings);
    },
    
    // 切换声音开关
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        Storage.save('adhd_procrastination_settings_v2', this.settings);
        
        if (this.settings.soundEnabled) {
            this.playSound('chime'); // 播放一个提示音确认已开启
        }
        
        if (typeof Settings !== 'undefined') {
            Settings.showToast(
                this.settings.soundEnabled ? 'success' : 'info',
                this.settings.soundEnabled ? '声音提醒已开启' : '声音提醒已关闭',
                ''
            );
        }
        
        return this.settings.soundEnabled;
    },
    
    // 启动自动任务监控（每秒检查是否有任务到时间）
    startAutoMonitor() {
        const self = this;
        
        // 清除之前的监控
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
        }
        
        // 每秒检查一次
        this.monitorTimer = setInterval(function() {
            self.checkForDueTasks();
        }, 1000);
        
        console.log("拖延监控已启动");
    },
    
    // 停止自动监控
    stopAutoMonitor() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        console.log("拖延监控已停止");
    },
    
    // 检查是否有任务到时间
    checkForDueTasks() {
        // 如果当前已有任务在监控中，不检查新任务
        if (this.currentTask) return;
        
        const now = new Date();
        const today = this.formatDate(now);
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        // 获取今天的任务
        const tasks = Storage.getTasks();
        const todayTasks = tasks.filter(function(t) { 
            return t.date === today && !t.completed; 
        });
        
        // 检查是否有任务刚好到时间
        for (var i = 0; i < todayTasks.length; i++) {
            const task = todayTasks[i];
            
            // 跳过已触发过的任务
            if (this.triggeredTasks.indexOf(task.id) !== -1) continue;
            
            // 检查任务时间是否到了
            if (task.startTime === currentTime) {
                this.triggerTaskMonitor(task);
                break;
            }
        }
    },
    
    // 触发任务监控
    triggerTaskMonitor(task) {
        const self = this;
        
        // 记录已触发
        this.triggeredTasks.push(task.id);
        const today = this.formatDate(new Date());
        const savedTriggered = Storage.load('adhd_triggered_tasks', {});
        savedTriggered[today] = this.triggeredTasks;
        Storage.save('adhd_triggered_tasks', savedTriggered);
        
        // 检查是否是步数验证任务
        if (task.verificationType === 'steps' && task.targetSteps) {
            // 使用步数验证模块
            if (typeof StepVerification !== 'undefined') {
                StepVerification.startVerification(task);
                return; // 步数验证模块会处理后续流程
            }
        }
        
        // 设置当前任务（非步数验证任务走原有流程）
        this.currentTask = task;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.preAlertShown = false;
        
        // 获取启动步骤
        const startupStep = task.substeps && task.substeps.length > 0 ? 
            task.substeps[0].title : '开始执行';
        
        // 🔊 播放任务开始提示音
        this.playSound(this.settings.taskStartSound);
        
        // 发送浏览器通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '⏰ 任务时间到！',
                '【' + task.title + '】请在 ' + (this.settings.gracePeriod / 60) + ' 分钟内开始',
                '⏰'
            );
        }
        
        // 发送通知
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "⏰ 任务时间到！【" + task.title + "】\n" +
                "请在 " + (this.settings.gracePeriod / 60) + " 分钟内完成启动步骤：【" + startupStep + "】\n" +
                "成功启动可获得 " + this.settings.successReward + " 金币奖励！", 
                "⏰"
            );
            App.loadProcrastinationPanel();
        }
        
        // 开始倒计时
        this.startCountdown();
    },
    
    // 开始倒计时
    startCountdown() {
        const self = this;
        
        // 清除之前的倒计时
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(function() {
            self.elapsedSeconds++;
            
            const remainingSeconds = self.settings.gracePeriod - self.elapsedSeconds;
            
            // 预警提示（倒计时快结束时）
            if (!self.preAlertShown && remainingSeconds <= self.settings.preAlertTime && remainingSeconds > 0) {
                self.preAlertShown = true;
                self.showPreAlert(remainingSeconds);
            }
            
            // 检查是否超时
            if (self.elapsedSeconds >= self.settings.gracePeriod && !self.isAlertActive) {
                self.isAlertActive = true;
                self.triggerAlert();
            }
            
            // 更新显示
            self.updateDisplay();
            
        }, 1000);
    },
    
    // 显示预警提示
    showPreAlert(remainingSeconds) {
        const task = this.currentTask;
        const startupStep = task.substeps && task.substeps.length > 0 ? 
            task.substeps[0].title : '开始执行';
        
        var message = this.settings.preAlertMessage
            .replace('{seconds}', remainingSeconds)
            .replace('{task}', task.title)
            .replace('{step}', startupStep);
        
        // 🔊 播放预警提示音
        this.playSound(this.settings.preAlertSound);
        
        // 发送浏览器通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '⚠️ 预警提醒',
                '还有 ' + remainingSeconds + ' 秒！准备开始【' + task.title + '】',
                '⚠️'
            );
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", message, "⚠️");
        }
    },
    
    // 触发警报（超时，扣除金币）
    triggerAlert() {
        const self = this;
        const task = this.currentTask;
        const startupStep = task.substeps && task.substeps.length > 0 ? 
            task.substeps[0].title : '开始执行';
        
        // 计算需要扣除的金币
        const cost = this.calculateCurrentCost();
        
        // 扣除金币
        const state = Storage.getGameState();
        const actualCost = Math.min(cost, state.coins); // 不能扣成负数
        state.coins -= actualCost;
        Storage.saveGameState(state);
        
        this.totalPaidCoins += actualCost;
        
        // 🔊 播放超时警报音
        this.playSound(this.settings.alertSound);
        
        // 发送浏览器通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '🚨 启动超时！',
                '已扣除 ' + actualCost + ' 金币！请立即开始【' + task.title + '】',
                '🚨'
            );
        }
        
        // 发送警报消息
        var message = this.settings.alertMessage
            .replace('{step}', startupStep);
        
        // 获取价值损失警告
        var lossWarning = '';
        if (typeof ValueVisualizer !== 'undefined') {
            const hourlyLoss = ValueVisualizer.calculateProcrastinationLoss(task);
            if (hourlyLoss > 0) {
                lossWarning = '\n⚠️ 正在损失 ' + ValueVisualizer.formatMoney(hourlyLoss) + '/小时！';
            }
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🚨 启动超时！已扣除 " + actualCost + " 金币！\n" +
                message + lossWarning + "\n" +
                "第 " + this.currentCycle + " 次循环，累计扣除：" + this.totalPaidCoins + " 金币", 
                "🚨"
            );
            App.updateGameStatus();
            App.loadProcrastinationPanel();
        }
        
        // 开始新的循环
        this.currentCycle++;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.preAlertShown = false;
        
        // 继续倒计时（新循环）
    },
    
    // 计算当前需要支付的金币
    calculateCurrentCost() {
        const cost = Math.floor(this.settings.baseCost * Math.pow(this.settings.costIncrement, this.currentCycle - 1));
        return Math.min(cost, this.settings.maxCost);
    },
    
    // 完成启动步骤
    completeStep() {
        if (!this.currentTask) return;
        
        // 停止倒计时
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        const task = this.currentTask;
        var coins = 0;
        var status = 'success';
        var duration = this.elapsedSeconds + '秒';
        
        if (!this.isAlertActive && this.currentCycle === 1) {
            // 在第一个宽限期内完成，获得奖励
            coins = this.settings.successReward;
            status = 'success';
            
            // 添加金币
            const state = Storage.getGameState();
            state.coins += coins;
            Storage.saveGameState(state);
            
            // 🔊 播放成功提示音
            this.playSound(this.settings.successSound);
            
            if (typeof App !== 'undefined') {
                App.updateGameStatus();
                App.showCoinAnimation(coins);
                App.addChatMessage("system", 
                    "🎉 太棒了！成功启动任务【" + task.title + "】！\n" +
                    "获得 " + coins + " 金币奖励！用时：" + duration, 
                    "🏆"
                );
            }
        } else {
            // 超时或多次循环后完成
            status = this.totalPaidCoins > 0 ? 'paid' : 'delayed';
            coins = -this.totalPaidCoins;
            duration = Math.floor(this.elapsedSeconds / 60) + '分' + (this.elapsedSeconds % 60) + '秒';
            
            // 🔊 播放完成提示音（虽然超时但还是完成了）
            this.playSound('chime');
            
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "✅ 任务【" + task.title + "】已完成启动\n" +
                    (this.totalPaidCoins > 0 ? "本次共扣除 " + this.totalPaidCoins + " 金币\n" : "") +
                    "虽然有些波折，但完成就是胜利！💪", 
                    "💪"
                );
            }
        }
        
        // 记录历史
        this.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            status: status,
            duration: duration,
            coins: coins,
            cycles: this.currentCycle,
            totalPaid: this.totalPaidCoins
        });
        
        // 重置状态
        this.currentTask = null;
        this.isAlertActive = false;
        this.elapsedSeconds = 0;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.preAlertShown = false;
        
        if (typeof App !== 'undefined') {
            App.loadProcrastinationPanel();
        }
    },
    
    // 跳过当前任务（不监控）
    skipCurrentTask() {
        if (!this.currentTask) return;
        
        // 停止倒计时
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        const task = this.currentTask;
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", "已跳过任务【" + task.title + "】的启动监控", "⏭️");
        }
        
        // 重置状态
        this.currentTask = null;
        this.isAlertActive = false;
        this.elapsedSeconds = 0;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.preAlertShown = false;
        
        if (typeof App !== 'undefined') {
            App.loadProcrastinationPanel();
        }
    },
    
    // 更新显示
    updateDisplay() {
        if (typeof App !== 'undefined') {
            const container = document.querySelector('.procrastination-monitor');
            if (container) {
                container.innerHTML = App.renderProcrastinationMonitor();
            }
        }
    },
    
    // 添加历史记录
    addHistory(record) {
        record.timestamp = new Date().toISOString();
        this.history.unshift(record);
        
        // 只保留最近50条记录
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        Storage.save('adhd_procrastination_history', this.history);
    },
    
    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        Storage.save('adhd_procrastination_settings_v2', this.settings);
    },
    
    // 切换启用状态
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        Storage.save('adhd_procrastination_settings_v2', this.settings);
        
        if (this.settings.enabled) {
            this.startAutoMonitor();
        } else {
            this.stopAutoMonitor();
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                this.settings.enabled ? "✅ 拖延监控已启用" : "⏸️ 拖延监控已暂停", 
                this.settings.enabled ? "✅" : "⏸️"
            );
            App.loadProcrastinationPanel();
        }
    },
    
    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + "-" + 
               (d.getMonth() + 1).toString().padStart(2, "0") + "-" + 
               d.getDate().toString().padStart(2, "0");
    },
    
    // 计算统计数据
    getStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        var weeklyCount = 0;
        var totalSpent = 0;
        var successCount = 0;
        
        for (var i = 0; i < this.history.length; i++) {
            const item = this.history[i];
            if (new Date(item.timestamp) > oneWeekAgo) {
                if (item.status !== 'success') weeklyCount++;
                else successCount++;
            }
            if (item.coins < 0) totalSpent += Math.abs(item.coins);
        }
        
        return {
            weeklyDelays: weeklyCount,
            weeklySuccess: successCount,
            totalSpent: totalSpent
        };
    }
};

// 导出
window.ProcrastinationMonitor = ProcrastinationMonitor;

