// 语音助手模块 - 智能语音控制中心
const VoiceAssistant = {
    // 状态
    isEnabled: false,
    isListening: false,
    recognition: null,
    synthesis: window.speechSynthesis,
    
    // 语音指令映射
    commands: {
        '继续': 'continue',
        '已完成': 'complete',
        '完成': 'complete',
        '下一步': 'next',
        '下一个': 'next',
        '暂停': 'pause',
        '停止': 'stop',
        '开始': 'start',
        '什么任务': 'current',
        '当前任务': 'current',
        '跳过': 'skip'
    },
    
    // 当前任务上下文
    currentTaskContext: null,
    currentSubstepIndex: 0,
    
    // 初始化
    init() {
        this.loadState();
        this.initSpeechRecognition();
        this.renderVoiceButton();
        this.startTaskMonitor();
        console.log('语音助手模块初始化完成');
    },
    
    // 加载状态
    loadState() {
        this.isEnabled = localStorage.getItem('voiceAssistantEnabled') === 'true';
    },
    
    // 保存状态
    saveState() {
        localStorage.setItem('voiceAssistantEnabled', this.isEnabled);
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
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // 自动重启
                if (this.isEnabled && this.isListening) {
                    setTimeout(() => this.startListening(), 1000);
                }
            }
        };
        
        this.recognition.onend = () => {
            if (this.isEnabled && this.isListening) {
                // 自动重启监听
                setTimeout(() => this.startListening(), 500);
            }
        };
    },
    
    // 渲染语音按钮（在时间轴上方）
    renderVoiceButton() {
        // 移除已存在的按钮
        const existing = document.getElementById('voiceAssistantBtn');
        if (existing) existing.remove();
        
        const btn = document.createElement('button');
        btn.id = 'voiceAssistantBtn';
        btn.className = 'voice-assistant-btn' + (this.isEnabled ? ' active' : '');
        btn.innerHTML = `
            <span class="voice-icon">🔊</span>
            <span class="voice-status">${this.isEnabled ? '语音助手已开启' : '语音助手'}</span>
        `;
        btn.onclick = () => this.toggle();
        btn.title = '点击开启/关闭语音助手模式';
        
        // 添加到时间轴组件头部
        const timelineHeader = document.querySelector('#timeline .component-header');
        if (timelineHeader) {
            const controls = timelineHeader.querySelector('.component-controls');
            if (controls) {
                controls.insertBefore(btn, controls.firstChild);
            }
        }
        
        // 同时添加一个浮动按钮（移动端友好）
        this.renderFloatingVoiceButton();
    },
    
    // 渲染浮动语音按钮
    renderFloatingVoiceButton() {
        const existing = document.getElementById('floatingVoiceBtn');
        if (existing) existing.remove();
        
        const btn = document.createElement('button');
        btn.id = 'floatingVoiceBtn';
        btn.className = 'floating-voice-btn' + (this.isEnabled ? ' active' : '');
        btn.innerHTML = this.isEnabled ? '🔊' : '🔇';
        btn.onclick = () => this.toggle();
        btn.title = '语音助手';
        
        document.body.appendChild(btn);
    },
    
    // 切换语音助手
    toggle() {
        this.isEnabled = !this.isEnabled;
        this.saveState();
        
        if (this.isEnabled) {
            this.startListening();
            this.speak('语音助手已开启，我会为你播报任务进度');
            if (typeof Settings !== 'undefined') {
                Settings.showToast('success', '语音助手已开启', '说"继续"、"已完成"、"下一步"来控制任务');
            }
        } else {
            this.stopListening();
            if (typeof Settings !== 'undefined') {
                Settings.showToast('info', '语音助手已关闭', '');
            }
        }
        
        this.updateButtonState();
    },
    
    // 更新按钮状态
    updateButtonState() {
        const btn = document.getElementById('voiceAssistantBtn');
        const floatingBtn = document.getElementById('floatingVoiceBtn');
        
        if (btn) {
            btn.className = 'voice-assistant-btn' + (this.isEnabled ? ' active' : '');
            btn.querySelector('.voice-status').textContent = this.isEnabled ? '语音助手已开启' : '语音助手';
        }
        
        if (floatingBtn) {
            floatingBtn.className = 'floating-voice-btn' + (this.isEnabled ? ' active' : '');
            floatingBtn.innerHTML = this.isEnabled ? '🔊' : '🔇';
        }
    },
    
    // 开始监听
    startListening() {
        if (!this.recognition) return;
        
        try {
            this.isListening = true;
            this.recognition.start();
            console.log('开始语音监听');
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
    
    // 处理语音指令
    processVoiceCommand(text) {
        // 查找匹配的指令
        for (const [keyword, action] of Object.entries(this.commands)) {
            if (text.includes(keyword)) {
                this.executeCommand(action, text);
                return;
            }
        }
        
        // 没有匹配的指令，可能是自然语言
        console.log('未识别的语音指令:', text);
    },
    
    // 执行指令
    executeCommand(action, originalText) {
        console.log('执行语音指令:', action);
        
        switch (action) {
            case 'complete':
                this.completeCurrentTask();
                break;
            case 'next':
                this.goToNextStep();
                break;
            case 'continue':
                this.continueTask();
                break;
            case 'pause':
                this.pauseTask();
                break;
            case 'current':
                this.announceCurrentTask();
                break;
            case 'skip':
                this.skipCurrentTask();
                break;
            case 'start':
                this.startCurrentTask();
                break;
        }
    },
    
    // 完成当前任务/子任务
    completeCurrentTask() {
        const task = this.getCurrentTask();
        if (!task) {
            this.speak('当前没有进行中的任务');
            return;
        }
        
        // 如果有子步骤，完成当前子步骤
        if (task.substeps && task.substeps.length > 0) {
            const currentStep = task.substeps.find(s => !s.completed);
            if (currentStep) {
                const stepIndex = task.substeps.indexOf(currentStep);
                currentStep.completed = true;
                Storage.updateTask(task.id, { substeps: task.substeps });
                
                // 触发金币动画
                CelebrationEffects.showCoinAnimation(5);
                CelebrationEffects.playCoinSound();
                
                // 检查是否所有子步骤都完成了
                const allCompleted = task.substeps.every(s => s.completed);
                if (allCompleted) {
                    this.markTaskComplete(task);
                } else {
                    // 播报下一个子步骤
                    const nextStep = task.substeps.find(s => !s.completed);
                    this.speak(`已完成。下一个子任务是：${nextStep.title}`);
                }
                
                if (typeof App !== 'undefined') {
                    App.loadTimeline();
                }
                return;
            }
        }
        
        // 直接完成整个任务
        this.markTaskComplete(task);
    },
    
    // 标记任务完成
    markTaskComplete(task) {
        // 更新任务状态
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        Storage.updateTask(task.id, { 
            completed: true,
            actualEndTime: currentTime
        });
        
        // 触发庆祝效果
        CelebrationEffects.triggerConfetti();
        CelebrationEffects.playConfettiSound();
        
        // 增加金币
        const gameState = Storage.getGameState();
        gameState.coins = (gameState.coins || 0) + (task.coins || 5);
        Storage.saveGameState(gameState);
        
        // 语音播报
        this.speak('太棒了！当前任务已完成！');
        
        // 播报下一个任务
        setTimeout(() => {
            this.announceNextTask();
        }, 2000);
        
        // 刷新界面
        if (typeof App !== 'undefined') {
            App.loadTimeline();
            App.updateGameStatus();
        }
        
        // 动态调整时间轴
        this.adjustTimelineAfterCompletion(task);
    },
    
    // 动态调整时间轴
    adjustTimelineAfterCompletion(completedTask) {
        const tasks = Storage.getTasks();
        const today = App.formatDate(new Date());
        const todayTasks = tasks.filter(t => t.date === today && !t.completed)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (todayTasks.length === 0) return;
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // 找到下一个任务
        const nextTask = todayTasks[0];
        const nextTaskParts = nextTask.startTime.split(':');
        const nextTaskMinutes = parseInt(nextTaskParts[0]) * 60 + parseInt(nextTaskParts[1]);
        
        // 如果下一个任务的开始时间在当前时间之后，且间隔小于30分钟，提前开始
        if (nextTaskMinutes > currentMinutes && nextTaskMinutes - currentMinutes < 30) {
            const newStartTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            Storage.updateTask(nextTask.id, { startTime: newStartTime });
            
            if (typeof App !== 'undefined') {
                App.loadTimeline();
            }
        }
    },
    
    // 进入下一步
    goToNextStep() {
        const task = this.getCurrentTask();
        if (!task) {
            this.speak('当前没有进行中的任务');
            return;
        }
        
        if (task.substeps && task.substeps.length > 0) {
            const currentStep = task.substeps.find(s => !s.completed);
            if (currentStep) {
                currentStep.completed = true;
                Storage.updateTask(task.id, { substeps: task.substeps });
                
                const nextStep = task.substeps.find(s => !s.completed);
                if (nextStep) {
                    this.speak(`下一步：${nextStep.title}`);
                    CelebrationEffects.showCoinAnimation(3);
                } else {
                    this.markTaskComplete(task);
                }
                
                if (typeof App !== 'undefined') {
                    App.loadTimeline();
                }
            }
        } else {
            this.speak('当前任务没有子步骤');
        }
    },
    
    // 继续任务
    continueTask() {
        const task = this.getCurrentTask();
        if (task) {
            this.speak(`继续进行：${task.title}`);
            CelebrationEffects.showCoinAnimation(2);
        } else {
            this.announceCurrentTask();
        }
    },
    
    // 暂停任务
    pauseTask() {
        this.speak('任务已暂停，说"继续"来恢复');
    },
    
    // 跳过当前任务
    skipCurrentTask() {
        const task = this.getCurrentTask();
        if (task) {
            Storage.updateTask(task.id, { skipped: true });
            this.speak(`已跳过任务：${task.title}`);
            this.announceNextTask();
            
            if (typeof App !== 'undefined') {
                App.loadTimeline();
            }
        }
    },
    
    // 开始当前任务
    startCurrentTask() {
        const task = this.getCurrentTask();
        if (task) {
            this.speak(`开始任务：${task.title}`);
            if (task.substeps && task.substeps.length > 0) {
                const firstStep = task.substeps[0];
                setTimeout(() => {
                    this.speak(`第一步：${firstStep.title}`);
                }, 1500);
            }
        } else {
            this.speak('当前没有待开始的任务');
        }
    },
    
    // 获取当前任务
    getCurrentTask() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = App.formatDate(now);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        // 找到当前时间段的任务
        const currentTask = tasks.find(t => {
            if (t.date !== today || t.completed) return false;
            
            const startParts = t.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const duration = t.duration || 30;
            const endMinutes = startMinutes + duration;
            
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        });
        
        return currentTask;
    },
    
    // 获取下一个任务
    getNextTask() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = App.formatDate(now);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const futureTasks = tasks.filter(t => {
            if (t.date !== today || t.completed) return false;
            
            const startParts = t.startTime.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            
            return startMinutes > currentMinutes;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        return futureTasks[0];
    },
    
    // 播报当前任务
    announceCurrentTask() {
        const task = this.getCurrentTask();
        if (task) {
            let message = `当前任务：${task.title}`;
            if (task.substeps && task.substeps.length > 0) {
                const currentStep = task.substeps.find(s => !s.completed);
                if (currentStep) {
                    message += `。当前步骤：${currentStep.title}`;
                }
            }
            this.speak(message);
        } else {
            const nextTask = this.getNextTask();
            if (nextTask) {
                this.speak(`当前没有进行中的任务。下一个任务是：${nextTask.title}，将于${nextTask.startTime}开始`);
            } else {
                this.speak('今天没有更多任务了');
            }
        }
    },
    
    // 播报下一个任务
    announceNextTask() {
        const nextTask = this.getNextTask();
        if (nextTask) {
            this.speak(`下一个任务是：${nextTask.title}，将于${nextTask.startTime}开始`);
        } else {
            this.speak('太棒了！今天的任务都完成了！');
        }
    },
    
    // 语音播报
    speak(text) {
        if (!this.synthesis) return;
        
        // 取消之前的播报
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        this.synthesis.speak(utterance);
        console.log('语音播报:', text);
    },
    
    // 任务监控 - 自动播报任务开始
    startTaskMonitor() {
        // 每分钟检查一次
        setInterval(() => {
            if (!this.isEnabled) return;
            this.checkTaskStart();
        }, 60000);
        
        // 立即检查一次
        setTimeout(() => {
            if (this.isEnabled) {
                this.checkTaskStart();
            }
        }, 5000);
    },
    
    // 检查任务开始
    checkTaskStart() {
        const tasks = Storage.getTasks();
        const now = new Date();
        const today = App.formatDate(now);
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        // 找到刚开始的任务
        const startingTask = tasks.find(t => {
            if (t.date !== today || t.completed || t.announced) return false;
            return t.startTime === currentTime;
        });
        
        if (startingTask) {
            // 标记已播报
            Storage.updateTask(startingTask.id, { announced: true });
            
            // 播报任务开始
            this.speak(`当前任务：${startingTask.title}`);
            
            // 如果有子步骤，播报第一步
            if (startingTask.substeps && startingTask.substeps.length > 0) {
                setTimeout(() => {
                    this.speak(`第一步：${startingTask.substeps[0].title}`);
                }, 2000);
            }
            
            // 启动拖延监控
            if (typeof ProcrastinationMonitor !== 'undefined') {
                ProcrastinationMonitor.startMonitoring(startingTask);
            }
        }
    }
};

// 导出
window.VoiceAssistant = VoiceAssistant;

