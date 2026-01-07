// 警告系统模块 - 防拖延和约束机制
const Warning = {
    // 警告级别
    LEVELS: {
        LOW: 1,      // 初级警告：屏幕边缘闪烁
        MEDIUM: 2,   // 中级警告：半屏遮罩
        HIGH: 3      // 高级警告：全屏遮罩+语音
    },

    // 警告类型
    TYPES: {
        TASK_DELAY: 'task_delay',           // 任务启动拖延
        LOW_EFFICIENCY: 'low_efficiency',   // 低效时段
        ZERO_COINS: 'zero_coins',           // 金币归零
        VERIFICATION_FAILED: 'verification_failed', // 验证失败
        ENERGY_LOW: 'energy_low',           // 精力过低
        TASK_FAILED: 'task_failed'          // 任务失败
    },

    // 警告语音库
    VOICE_MESSAGES: {
        task_delay: [
            "老板，{taskName}应该2分钟前开始啦，现在启动还能获得全额金币哦！",
            "嘿！{taskName}该开始了，别让拖延症打败你！",
            "时间到啦！{taskName}在等你，快行动起来！"
        ],
        low_efficiency: [
            "老板，检测到你已经1小时没有完成任务了，是不是遇到困难了？需要帮助吗？",
            "一个小时过去了，还没有完成任何任务呢，要不要休息一下再继续？",
            "效率有点低哦，需要我帮你调整一下任务安排吗？"
        ],
        zero_coins: [
            "懒鬼！！你的金币耗尽！请立即完成一个任务来获取金币，否则警告无法关闭。",
            "金币归零了！这是最后警告，必须完成任务才能继续！",
            "没有金币了！快去完成一个任务吧，不然我会一直在这里哦~"
        ],
        verification_failed: [
            "任务验证未通过，想想看哪里出了问题？我们可以一起调整任务设置。",
            "验证失败了，没关系，下次注意提交正确的验证材料哦！",
            "这次验证没通过，要不要重新尝试一下？"
        ],
        energy_low: [
            "精力值很低了，建议休息一下再继续工作！",
            "你看起来很累了，要不要安排一个休息任务？",
            "精力不足会影响效率哦，休息一下吧！"
        ],
        task_failed: [
            "任务失败了，但这不是终点，调整一下继续前进！",
            "这个任务没完成，没关系，我们来看看下一个！",
            "失败是成功之母，重新规划一下吧！"
        ]
    },

    // 当前警告状态
    currentWarning: null,
    warningHistory: [],
    taskMonitorInterval: null,
    lastActivityTime: Date.now(),
    delayedTasks: {},  // 记录已警告的拖延任务

    // 初始化警告系统
    init() {
        this.startMonitoring();
        this.loadWarningHistory();
        console.log('警告系统初始化完成');
    },

    // 开始监控
    startMonitoring() {
        const self = this;

        // 每分钟检查一次
        this.taskMonitorInterval = setInterval(function() {
            self.checkForWarnings();
        }, 60000);

        // 监听用户活动
        document.addEventListener('click', function() {
            self.lastActivityTime = Date.now();
        });
        document.addEventListener('keypress', function() {
            self.lastActivityTime = Date.now();
        });

        // 立即检查一次
        setTimeout(function() {
            self.checkForWarnings();
        }, 5000);
    },

    // 检查是否需要触发警告
    checkForWarnings() {
        // 如果已有高级警告显示，不再检查
        if (this.currentWarning && this.currentWarning.level === this.LEVELS.HIGH) {
            return;
        }

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const today = App.formatDate(now);
        const tasks = Storage.getTasks();
        const state = Storage.getGameState();

        // 1. 检查金币归零
        if (state.coins <= 0) {
            this.trigger('zero_coins', { level: this.LEVELS.HIGH });
            return;
        }

        // 2. 检查精力过低
        if (state.energy <= 2 && state.energy > 0) {
            this.trigger('energy_low', { level: this.LEVELS.LOW });
        }

        // 3. 检查任务拖延
        const todayTasks = tasks.filter(function(t) { 
            return t.date === today && !t.completed && !t.failed && !t.skipped; 
        });

        todayTasks.forEach(function(task) {
            const startParts = task.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const delayMinutes = currentMinutes - startMinutes;

            // 任务应该开始但还没开始（2分钟后警告）
            if (delayMinutes >= 2 && delayMinutes < 60) {
                // 检查是否有子任务完成
                const hasProgress = task.subtasks && task.subtasks.some(function(s) { return s.completed; });
                
                if (!hasProgress && !Warning.delayedTasks[task.id]) {
                    Warning.delayedTasks[task.id] = true;
                    Warning.trigger('task_delay', { 
                        task: task, 
                        delayMinutes: delayMinutes,
                        level: delayMinutes >= 10 ? Warning.LEVELS.MEDIUM : Warning.LEVELS.LOW
                    });
                }
            }
        });

        // 4. 检查低效时段（1小时内没有完成任何任务）
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentCompletions = tasks.filter(function(t) {
            return t.completedAt && new Date(t.completedAt) > oneHourAgo;
        });

        if (recentCompletions.length === 0 && todayTasks.length > 0) {
            // 检查是否在工作时间（8:00-22:00）
            const hour = now.getHours();
            if (hour >= 8 && hour <= 22) {
                const lastWarning = this.getLastWarningOfType('low_efficiency');
                if (!lastWarning || (now - new Date(lastWarning.time)) > 60 * 60 * 1000) {
                    this.trigger('low_efficiency', { level: this.LEVELS.MEDIUM });
                }
            }
        }
    },

    // 触发警告
    trigger(type, data) {
        data = data || {};
        const level = data.level || this.LEVELS.LOW;

        // 如果当前有更高级别的警告，不触发
        if (this.currentWarning && this.currentWarning.level >= level) {
            return;
        }

        const warning = {
            id: Date.now().toString(),
            type: type,
            level: level,
            data: data,
            time: new Date().toISOString(),
            dismissed: false
        };

        this.currentWarning = warning;
        this.warningHistory.push(warning);
        this.saveWarningHistory();

        this.showWarning(warning);
    },

    // 显示警告
    showWarning(warning) {
        // 移除已存在的警告
        this.removeWarningUI();

        const level = warning.level;
        const type = warning.type;
        const data = warning.data;

        // 获取警告消息
        const message = this.getWarningMessage(type, data);
        const dismissCost = this.getDismissCost(level);

        // 创建警告UI
        const warningEl = document.createElement('div');
        warningEl.className = 'warning-overlay level-' + level;
        warningEl.id = 'warningOverlay';

        if (level === this.LEVELS.LOW) {
            // 初级警告：边缘闪烁
            warningEl.innerHTML = `
                <div class="warning-banner">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-message">${message}</div>
                    <button class="warning-dismiss-btn" onclick="Warning.dismiss()">知道了</button>
                </div>
            `;
        } else if (level === this.LEVELS.MEDIUM) {
            // 中级警告：半屏遮罩
            warningEl.innerHTML = `
                <div class="warning-modal medium">
                    <div class="warning-header">
                        <span class="warning-icon-large">⚠️</span>
                        <h2>注意！</h2>
                    </div>
                    <div class="warning-content">
                        <p class="warning-text">${message}</p>
                    </div>
                    <div class="warning-actions">
                        <button class="warning-btn btn-dismiss" onclick="Warning.dismiss()">
                            🪙 支付 ${dismissCost} 金币关闭
                        </button>
                        ${type === 'task_delay' && data.task ? `
                            <button class="warning-btn btn-start" onclick="Warning.startTask('${data.task.id}')">
                                ▶️ 立即开始任务
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (level === this.LEVELS.HIGH) {
            // 高级警告：全屏遮罩
            warningEl.innerHTML = `
                <div class="warning-modal high">
                    <div class="warning-header">
                        <span class="warning-icon-large">🚨</span>
                        <h2>严重警告！</h2>
                    </div>
                    <div class="warning-content">
                        <p class="warning-text">${message}</p>
                        ${type === 'zero_coins' ? `
                            <p class="warning-subtext">必须完成一个任务才能关闭此警告！</p>
                        ` : ''}
                    </div>
                    <div class="warning-actions">
                        ${type === 'zero_coins' ? `
                            <button class="warning-btn btn-task" onclick="Warning.showQuickTask()">
                                📋 完成快速任务
                            </button>
                        ` : `
                            <button class="warning-btn btn-dismiss" onclick="Warning.dismiss()">
                                🪙 支付 ${dismissCost} 金币关闭
                            </button>
                        `}
                    </div>
                </div>
            `;
        }

        document.body.appendChild(warningEl);
        setTimeout(function() { warningEl.classList.add('show'); }, 10);

        // 播放警告音
        this.playWarningSound(level);

        // 高级警告播放语音
        if (level >= this.LEVELS.MEDIUM) {
            this.speakWarning(message);
        }

        // 添加到聊天记录
        App.addChatMessage('system', '⚠️ ' + message, '🚨');
    },

    // 获取警告消息
    getWarningMessage(type, data) {
        const messages = this.VOICE_MESSAGES[type] || ['发生了一个警告'];
        let message = messages[Math.floor(Math.random() * messages.length)];

        // 替换变量
        if (data.task) {
            message = message.replace('{taskName}', data.task.title);
        }
        if (data.delayMinutes) {
            message = message.replace('{delayMinutes}', data.delayMinutes);
        }

        return message;
    },

    // 获取关闭警告所需金币
    getDismissCost(level) {
        if (level === this.LEVELS.LOW) return 0;
        if (level === this.LEVELS.MEDIUM) return Math.floor(Math.random() * 10) + 1; // 1-10
        if (level === this.LEVELS.HIGH) return Math.floor(Math.random() * 11) + 10; // 10-20
        return 0;
    },

    // 关闭警告
    dismiss() {
        if (!this.currentWarning) return;

        const level = this.currentWarning.level;
        const cost = this.getDismissCost(level);
        const state = Storage.getGameState();

        // 检查金币是否足够
        if (cost > 0 && state.coins < cost) {
            App.addChatMessage('system', '❌ 金币不足！需要 ' + cost + ' 金币才能关闭警告', '😰');
            return;
        }

        // 扣除金币
        if (cost > 0) {
            state.coins -= cost;
            Storage.saveGameState(state);
            App.updateGameStatus();
            App.addChatMessage('system', '💸 支付 ' + cost + ' 金币关闭警告', '💰');
        }

        // 标记警告已关闭
        this.currentWarning.dismissed = true;
        this.saveWarningHistory();

        // 移除UI
        this.removeWarningUI();
        this.currentWarning = null;
    },

    // 移除警告UI
    removeWarningUI() {
        const existing = document.getElementById('warningOverlay');
        if (existing) {
            existing.classList.remove('show');
            setTimeout(function() { existing.remove(); }, 300);
        }
    },

    // 开始任务（从警告中）
    startTask(taskId) {
        // 关闭警告（免费）
        this.removeWarningUI();
        this.currentWarning = null;

        // 标记任务开始
        const tasks = Storage.getTasks();
        const task = tasks.find(function(t) { return t.id === taskId; });
        if (task) {
            Storage.updateTask(taskId, { startedAt: new Date().toISOString() });
            App.addChatMessage('system', '▶️ 开始任务「' + task.title + '」，加油！', '💪');
            
            // 如果有子任务，展开显示
            const subtasksSection = document.getElementById('subtasks_' + taskId);
            if (subtasksSection) {
                subtasksSection.classList.add('expanded');
            }
        }

        App.loadTimeline();
    },

    // 显示快速任务（金币归零时）
    showQuickTask() {
        const modal = document.getElementById('warningOverlay');
        if (!modal) return;

        const content = modal.querySelector('.warning-modal');
        if (content) {
            content.innerHTML = `
                <div class="warning-header">
                    <span class="warning-icon-large">📋</span>
                    <h2>完成快速任务</h2>
                </div>
                <div class="warning-content">
                    <p class="warning-text">选择一个简单任务立即完成，获得金币后警告将自动关闭：</p>
                    <div class="quick-task-list">
                        <button class="quick-task-btn" onclick="Warning.completeQuickTask('喝一杯水', 2)">
                            💧 喝一杯水 (+2金币)
                        </button>
                        <button class="quick-task-btn" onclick="Warning.completeQuickTask('做5个深呼吸', 3)">
                            🌬️ 做5个深呼吸 (+3金币)
                        </button>
                        <button class="quick-task-btn" onclick="Warning.completeQuickTask('站起来伸展一下', 3)">
                            🧘 站起来伸展一下 (+3金币)
                        </button>
                        <button class="quick-task-btn" onclick="Warning.completeQuickTask('整理桌面', 5)">
                            🗂️ 整理桌面 (+5金币)
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // 完成快速任务
    completeQuickTask(taskName, coins) {
        // 添加金币
        const state = Storage.getGameState();
        state.coins += coins;
        state.completedTasks += 1;
        Storage.saveGameState(state);

        // 记录任务
        Storage.addTask({
            title: taskName,
            date: App.formatDate(new Date()),
            startTime: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
            duration: 1,
            completed: true,
            verified: true,
            completedAt: new Date().toISOString(),
            coins: coins,
            tags: ['快速任务']
        });

        App.addChatMessage('system', '✅ 完成快速任务「' + taskName + '」，获得 ' + coins + ' 金币！', '🎉');
        App.showCoinAnimation(coins);
        App.updateGameStatus();
        App.loadTimeline();

        // 关闭警告
        this.removeWarningUI();
        this.currentWarning = null;
    },

    // 播放警告音
    playWarningSound(level) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (level === this.LEVELS.LOW) {
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.2;
            } else if (level === this.LEVELS.MEDIUM) {
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.3;
            } else {
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.4;
            }

            oscillator.type = 'sine';
            oscillator.start();

            // 警告音模式
            const duration = level === this.LEVELS.HIGH ? 1 : 0.5;
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // 静默失败
        }
    },

    // 语音播报警告
    speakWarning(message) {
        if ('speechSynthesis' in window) {
            // 取消之前的语音
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = 'zh-CN';
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 0.8;

            // 尝试使用中文语音
            const voices = window.speechSynthesis.getVoices();
            const chineseVoice = voices.find(function(v) {
                return v.lang.includes('zh') || v.lang.includes('CN');
            });
            if (chineseVoice) {
                utterance.voice = chineseVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    },

    // 获取最后一次特定类型的警告
    getLastWarningOfType(type) {
        for (let i = this.warningHistory.length - 1; i >= 0; i--) {
            if (this.warningHistory[i].type === type) {
                return this.warningHistory[i];
            }
        }
        return null;
    },

    // 保存警告历史
    saveWarningHistory() {
        // 只保留最近100条
        if (this.warningHistory.length > 100) {
            this.warningHistory = this.warningHistory.slice(-100);
        }
        localStorage.setItem('adhd_warning_history', JSON.stringify(this.warningHistory));
    },

    // 加载警告历史
    loadWarningHistory() {
        try {
            const data = localStorage.getItem('adhd_warning_history');
            if (data) {
                this.warningHistory = JSON.parse(data);
            }
        } catch (e) {
            this.warningHistory = [];
        }
    },

    // 重置拖延任务记录（每天重置）
    resetDelayedTasks() {
        this.delayedTasks = {};
    },

    // 检测页面刷新绕过（惩罚机制）
    detectBypass() {
        const lastCheck = localStorage.getItem('adhd_last_check');
        const now = Date.now();

        if (lastCheck) {
            const timeDiff = now - parseInt(lastCheck);
            // 如果距离上次检查不到5秒就刷新了页面，可能是试图绕过
            if (timeDiff < 5000 && this.currentWarning) {
                const state = Storage.getGameState();
                const penalty = 5;
                state.coins = Math.max(0, state.coins - penalty);
                Storage.saveGameState(state);
                App.addChatMessage('system', '🚫 检测到异常刷新，扣除 ' + penalty + ' 金币作为惩罚', '⚠️');
            }
        }

        localStorage.setItem('adhd_last_check', now.toString());
    },

    // 更新警告语音库
    updateVoiceMessage(type, messages) {
        if (this.VOICE_MESSAGES[type]) {
            this.VOICE_MESSAGES[type] = messages;
        }
    }
};

// 导出
window.Warning = Warning;

