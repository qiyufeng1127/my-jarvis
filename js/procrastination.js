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
    voiceLoopTimer: null,       // 语音循环定时器
    isPaused: false,            // 是否处于暂停状态
    pauseEndTime: null,         // 暂停结束时间
    speechSynthesis: null,      // 语音合成对象
    
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
        successSound: 'success',    // 成功提示音类型
        // 自定义语音提示
        customPreAlertText: "距离{task}开始还有{seconds}秒，请准备启动步骤：{step}",
        customAlertText: "任务{task}已超时，请立即开始执行步骤：{step}",
        useVoiceAlert: true,        // 是否使用语音播报
        voiceLoopEnabled: true,     // 是否循环播放语音
        voiceLoopInterval: 10,      // 语音循环间隔（秒）
        // 金币暂停功能
        pauseCost: 10,              // 暂停提醒的金币成本
        pauseDuration: 1800,        // 暂停时长（秒，30分钟）
        pauseEnabled: true          // 是否启用金币暂停功能
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
        
        // 初始化语音合成
        this.initSpeechSynthesis();
        
        // 监听任务完成事件 - 即时响应
        this.setupTaskCompletionListener();
        
        // 启动自动监控
        if (this.settings.enabled) {
            this.startAutoMonitor();
        }
    },
    
    // 设置任务完成事件监听器 - 即时响应监控系统
    setupTaskCompletionListener() {
        const self = this;
        
        // 监听自定义任务完成事件
        document.addEventListener('taskCompleted', function(e) {
            const taskId = e.detail && e.detail.taskId;
            self.onTaskOrSubtaskCompleted(taskId, 'task');
        });
        
        // 监听子任务完成事件
        document.addEventListener('subtaskCompleted', function(e) {
            const taskId = e.detail && e.detail.taskId;
            const subtaskIndex = e.detail && e.detail.subtaskIndex;
            self.onTaskOrSubtaskCompleted(taskId, 'subtask', subtaskIndex);
        });
        
        console.log('任务完成事件监听器已设置');
    },
    
    // 当任务或子任务完成时的处理 - 即时终止监控
    onTaskOrSubtaskCompleted(taskId, type, subtaskIndex) {
        // 检查是否是当前正在监控的任务
        if (!this.currentTask) return;
        
        if (this.currentTask.id === taskId) {
            console.log('检测到任务/子任务完成，立即终止监控:', type, taskId);
            
            // 立即终止监控并给予奖励
            this.immediateCompleteWithReward(type, subtaskIndex);
        }
    },
    
    // 立即完成并给予奖励（被任务完成事件触发）
    immediateCompleteWithReward(completionType, subtaskIndex) {
        if (!this.currentTask) return;
        
        // 停止倒计时
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        // 停止语音循环
        this.stopVoiceLoop();
        
        const task = this.currentTask;
        
        // 计算奖励金币（根据完成速度）
        let rewardCoins = this.settings.successReward;
        let bonusMessage = '';
        
        // 如果在宽限期内完成，额外奖励
        if (!this.isAlertActive && this.currentCycle === 1) {
            if (this.elapsedSeconds < 30) {
                rewardCoins += 2; // 30秒内完成额外奖励
                bonusMessage = '⚡ 闪电速度！额外+2金币！';
            } else if (this.elapsedSeconds < 60) {
                rewardCoins += 1; // 1分钟内完成额外奖励
                bonusMessage = '🚀 快速启动！额外+1金币！';
            }
        }
        
        // 如果之前扣过金币，返还部分
        let refundCoins = 0;
        if (this.totalPaidCoins > 0) {
            refundCoins = Math.floor(this.totalPaidCoins * 0.3); // 返还30%
            rewardCoins += refundCoins;
        }
        
        // 添加金币
        const state = Storage.getGameState();
        state.coins += rewardCoins;
        Storage.saveGameState(state);
        
        // 播放成功音效和金币动画
        this.playSound(this.settings.successSound);
        
        if (typeof CelebrationEffects !== 'undefined') {
            CelebrationEffects.showCoinAnimation(rewardCoins);
            CelebrationEffects.playCoinSound();
        } else if (typeof App !== 'undefined') {
            App.showCoinAnimation(rewardCoins);
        }
        
        // 构建消息
        let message = '';
        if (completionType === 'subtask') {
            message = `✅ 子任务完成！监控已自动终止\n获得 ${rewardCoins} 金币奖励！`;
        } else {
            message = `🎉 任务【${task.title}】完成！\n获得 ${rewardCoins} 金币奖励！`;
        }
        
        if (bonusMessage) {
            message += '\n' + bonusMessage;
        }
        
        if (refundCoins > 0) {
            message += `\n💰 返还 ${refundCoins} 金币（之前扣除的30%）`;
        }
        
        if (typeof App !== 'undefined') {
            App.updateGameStatus();
            App.addChatMessage("system", message, "🏆");
        }
        
        // 记录历史
        this.addHistory({
            taskId: task.id,
            taskTitle: task.title,
            status: 'success',
            duration: this.elapsedSeconds + '秒',
            coins: rewardCoins,
            cycles: this.currentCycle,
            totalPaid: this.totalPaidCoins,
            completionType: completionType
        });
        
        // 重置状态
        this.currentTask = null;
        this.isAlertActive = false;
        this.elapsedSeconds = 0;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.preAlertShown = false;
        this.isPaused = false;
        this.pauseEndTime = null;
        
        if (typeof App !== 'undefined') {
            App.loadProcrastinationPanel();
        }
    },
    
    // 初始化语音合成
    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            console.log('语音合成系统初始化完成');
        } else {
            console.warn('浏览器不支持语音合成');
        }
    },
    
    // ==================== 声音系统 ====================
    
    // 初始化音频系统
    initAudio() {
        try {
            // 创建 AudioContext（需要用户交互后才能播放）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 监听多种用户交互以解锁音频
            const unlockAudio = () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('音频上下文已解锁');
                    });
                }
            };
            
            // 添加多个事件监听器
            ['click', 'touchstart', 'touchend', 'keydown'].forEach(event => {
                document.addEventListener(event, unlockAudio, { once: false, passive: true });
            });
            
            // 5秒后移除监听器（假设用户已交互）
            setTimeout(() => {
                ['click', 'touchstart', 'touchend', 'keydown'].forEach(event => {
                    document.removeEventListener(event, unlockAudio);
                });
            }, 30000);
            
            console.log('音频系统初始化完成，状态:', this.audioContext.state);
        } catch (e) {
            console.error('音频系统初始化失败:', e);
            // 降级方案：使用 HTML5 Audio
            this.useHTML5Audio = true;
        }
    },
    
    // 播放提示音
    playSound(type) {
        if (!this.settings.soundEnabled) {
            console.log('声音提醒已禁用');
            return;
        }
        
        console.log('尝试播放声音:', type);
        
        // 确保音频上下文已创建
        if (!this.audioContext && !this.useHTML5Audio) {
            this.initAudio();
        }
        
        // 如果音频上下文被暂停，尝试恢复
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this._doPlaySound(type);
            });
            return;
        }
        
        this._doPlaySound(type);
    },
    
    // 实际播放声音
    _doPlaySound(type) {
        const volume = this.settings.soundVolume;
        
        // 如果 Web Audio API 不可用，使用降级方案
        if (this.useHTML5Audio || !this.audioContext) {
            this.playHTML5Sound(type, volume);
            return;
        }
        
        try {
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
            console.log('声音播放成功:', type);
        } catch (e) {
            console.error('声音播放失败:', e);
            // 降级到 HTML5 Audio
            this.playHTML5Sound(type, volume);
        }
    },
    
    // HTML5 Audio 降级方案（使用系统蜂鸣音）
    playHTML5Sound(type, volume) {
        try {
            // 创建一个简单的蜂鸣音
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // 根据类型设置不同的频率
            const freqMap = {
                'chime': 800,
                'warning': 600,
                'alarm': 400,
                'success': 1000
            };
            
            oscillator.frequency.value = freqMap[type] || 800;
            oscillator.type = 'sine';
            gainNode.gain.value = volume * 0.3;
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            
            console.log('HTML5 Audio 播放成功');
        } catch (e) {
            console.error('HTML5 Audio 也失败了:', e);
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
        
        // 🎤 播放自定义语音提示
        if (this.settings.useVoiceAlert) {
            const voiceText = this.settings.customPreAlertText
                .replace('{seconds}', remainingSeconds)
                .replace('{task}', task.title)
                .replace('{step}', startupStep);
            this.speakText(voiceText);
        }
        
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
        
        // 🎤 开始循环播放语音警报
        if (this.settings.useVoiceAlert && this.settings.voiceLoopEnabled && !this.isPaused) {
            const voiceText = this.settings.customAlertText
                .replace('{task}', task.title)
                .replace('{step}', startupStep);
            this.startVoiceLoop(voiceText);
        }
        
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
                "第 " + this.currentCycle + " 次循环，累计扣除：" + this.totalPaidCoins + " 金币\n" +
                (this.settings.pauseEnabled ? "💰 支付 " + this.settings.pauseCost + " 金币可暂停提醒30分钟" : ""), 
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
    
    // ==================== 语音播报系统 ====================
    
    // 播放语音文本
    speakText(text) {
        if (!this.speechSynthesis || !this.settings.useVoiceAlert) {
            console.log('语音播报未启用或不支持');
            return;
        }
        
        // 停止当前播放
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = this.settings.soundVolume;
        
        this.speechSynthesis.speak(utterance);
        console.log('播放语音:', text);
    },
    
    // 开始循环播放语音
    startVoiceLoop(text) {
        // 清除之前的循环
        this.stopVoiceLoop();
        
        const self = this;
        
        // 立即播放一次
        this.speakText(text);
        
        // 设置循环定时器
        this.voiceLoopTimer = setInterval(function() {
            // 检查是否暂停
            if (self.isPaused) {
                return;
            }
            
            // 检查暂停是否已结束
            if (self.pauseEndTime && new Date() >= self.pauseEndTime) {
                self.resumeFromPause();
            }
            
            // 播放语音
            self.speakText(text);
        }, this.settings.voiceLoopInterval * 1000);
        
        console.log('开始循环播放语音，间隔:', this.settings.voiceLoopInterval, '秒');
    },
    
    // 停止循环播放语音
    stopVoiceLoop() {
        if (this.voiceLoopTimer) {
            clearInterval(this.voiceLoopTimer);
            this.voiceLoopTimer = null;
        }
        
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        console.log('停止循环播放语音');
    },
    
    // ==================== 金币暂停功能 ====================
    
    // 支付金币暂停提醒
    pauseWithCoins() {
        if (!this.settings.pauseEnabled) {
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", "暂停功能未启用", "ℹ️");
            }
            return;
        }
        
        const cost = this.settings.pauseCost;
        const state = Storage.getGameState();
        
        if (state.coins < cost) {
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "金币不足！需要 " + cost + " 金币，当前只有 " + state.coins + " 金币", 
                    "❌"
                );
            }
            return;
        }
        
        // 扣除金币
        state.coins -= cost;
        Storage.saveGameState(state);
        
        // 设置暂停状态
        this.isPaused = true;
        this.pauseEndTime = new Date(Date.now() + this.settings.pauseDuration * 1000);
        
        // 停止语音循环
        this.stopVoiceLoop();
        
        const pauseMinutes = Math.floor(this.settings.pauseDuration / 60);
        
        if (typeof App !== 'undefined') {
            App.updateGameStatus();
            App.addChatMessage("system", 
                "✅ 已支付 " + cost + " 金币暂停提醒\n" +
                "暂停时长：" + pauseMinutes + " 分钟\n" +
                "暂停结束时间：" + this.formatTime(this.pauseEndTime) + "\n" +
                "⚠️ 超时后若未完成任务，语音警报将重新启动", 
                "💰"
            );
            App.loadProcrastinationPanel();
        }
    },
    
    // 从暂停中恢复
    resumeFromPause() {
        this.isPaused = false;
        this.pauseEndTime = null;
        
        // 如果仍在警报状态，重新启动语音循环
        if (this.isAlertActive && this.currentTask) {
            const task = this.currentTask;
            const startupStep = task.substeps && task.substeps.length > 0 ? 
                task.substeps[0].title : '开始执行';
            
            const voiceText = this.settings.customAlertText
                .replace('{task}', task.title)
                .replace('{step}', startupStep);
            
            this.startVoiceLoop(voiceText);
            
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "⏰ 暂停时间已结束！\n" +
                    "语音警报已重新启动\n" +
                    "请立即完成任务【" + task.title + "】", 
                    "🚨"
                );
                App.loadProcrastinationPanel();
            }
        }
    },
    
    // 格式化时间
    formatTime(date) {
        const d = new Date(date);
        return d.getHours().toString().padStart(2, '0') + ':' + 
               d.getMinutes().toString().padStart(2, '0');
    },
    
    // 完成启动步骤
    completeStep() {
        if (!this.currentTask) return;
        
        // 停止倒计时
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        // 停止语音循环
        this.stopVoiceLoop();
        
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
        this.isPaused = false;
        this.pauseEndTime = null;
        
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
        
        // 停止语音循环
        this.stopVoiceLoop();
        
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
        this.isPaused = false;
        this.pauseEndTime = null;
        
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

