// Enhanced Procrastination Monitor - v2.0
// 增强版拖延监控系统 - 实时语音播报、阶梯式问责、AI启动步骤引导

const ProcrastinationEnhanced = {
    // 状态
    countdownSeconds: 120,          // 倒计时秒数
    countdownTimer: null,           // 倒计时定时器
    isCountingDown: false,          // 是否正在倒计时
    currentTask: null,              // 当前任务
    failureCount: 0,                // 失败次数（用于阶梯式问责）
    voiceLoopTimer: null,           // 语音循环定时器
    fullscreenAlertActive: false,   // 全屏警报是否激活
    speechSynthesis: null,          // 语音合成
    audioContext: null,             // 音频上下文
    
    // 设置
    settings: {
        countdownDuration: 120,     // 倒计时时长（秒）
        voiceCountdown: true,       // 是否语音播报倒计时
        countdownInterval: 10,      // 每隔多少秒播报一次（1=每秒，10=每10秒）
        fullscreenAlert: true,      // 是否启用全屏警报
        alertSoundType: 'alarm',    // 警报声类型
        voiceEncouragement: true,   // 是否启用语音鼓励
        voiceLoopInterval: 15,      // 语音循环间隔（秒）
        useAISteps: true,           // 是否使用AI生成启动步骤
        apiKey: '',                 // DeepSeek API Key
    },
    
    // 阶梯式语音内容
    voiceMessages: {
        // 第一次失败 - 温柔鼓励
        level1: [
            "别担心，从小步做起，先{step}吧",
            "没关系，我们一起来，先试试{step}",
            "深呼吸，放轻松，只需要先{step}就好",
            "你可以的，先从最简单的开始，{step}",
            "不要给自己太大压力，先{step}试试看"
        ],
        // 第二次失败 - 严格提醒
        level2: [
            "时间在流逝，请立刻行动，现在就{step}",
            "已经拖延了一次，请马上开始{step}",
            "不能再等了，立即{step}",
            "每一秒都很宝贵，现在就{step}",
            "停止犹豫，马上{step}"
        ],
        // 第三次及以后 - 失望问责
        level3: [
            "你已经多次拖延了，这对你的目标有什么影响？请立即{step}",
            "反复拖延只会让事情更难，现在必须{step}",
            "你真的想要完成这个任务吗？如果想，现在就{step}",
            "拖延不会让任务消失，只会增加焦虑，马上{step}",
            "每次拖延都在消耗你的意志力，立刻{step}"
        ]
    },
    
    // 初始化
    init() {
        console.log('增强版拖延监控系统初始化...');
        
        // 加载设置
        const savedSettings = Storage.load('procrastination_enhanced_settings', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
        
        // 初始化语音合成
        this.initSpeechSynthesis();
        
        // 初始化音频
        this.initAudio();
        
        // 监听原有拖延监控的任务触发
        this.hookIntoProcrastinationMonitor();
        
        console.log('增强版拖延监控系统初始化完成');
    },
    
    // 初始化语音合成
    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            // 预加载中文语音
            this.speechSynthesis.getVoices();
            console.log('语音合成系统就绪');
        } else {
            console.warn('浏览器不支持语音合成');
        }
    },
    
    // 初始化音频上下文
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 用户交互后解锁音频
            const unlockAudio = () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            };
            
            ['click', 'touchstart', 'keydown'].forEach(event => {
                document.addEventListener(event, unlockAudio, { passive: true });
            });
        } catch (e) {
            console.error('音频初始化失败:', e);
        }
    },
    
    // 挂钩到原有拖延监控
    hookIntoProcrastinationMonitor() {
        const self = this;
        
        // 覆盖原有的triggerTaskMonitor方法
        if (typeof ProcrastinationMonitor !== 'undefined') {
            const originalTrigger = ProcrastinationMonitor.triggerTaskMonitor.bind(ProcrastinationMonitor);
            
            ProcrastinationMonitor.triggerTaskMonitor = function(task) {
                // 调用增强版的启动
                self.startEnhancedCountdown(task);
                // 也调用原有逻辑
                originalTrigger(task);
            };
            
            console.log('已挂钩到拖延监控系统');
        }
    },
    
    // ==================== 第一段：拖延倒计时启动与播报机制 ====================
    
    // 启动增强版倒计时
    startEnhancedCountdown(task) {
        if (this.isCountingDown) {
            this.stopCountdown();
        }
        
        this.currentTask = task;
        this.countdownSeconds = this.settings.countdownDuration;
        this.isCountingDown = true;
        this.failureCount = 0;
        
        const startupStep = this.getStartupStep(task);
        
        // 播报启动消息
        this.speak(`${task.title}，从现在开始启动${this.countdownSeconds}秒拖延倒计时`);
        
        // 开始倒计时
        this.runCountdown();
        
        console.log('增强版倒计时已启动:', task.title);
    },
    
    // 运行倒计时
    runCountdown() {
        const self = this;
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.countdownTimer = setInterval(function() {
            if (!self.isCountingDown) {
                clearInterval(self.countdownTimer);
                return;
            }
            
            self.countdownSeconds--;
            
            // 语音播报倒计时
            if (self.settings.voiceCountdown) {
                self.announceCountdown(self.countdownSeconds);
            }
            
            // 更新显示
            self.updateCountdownDisplay();
            
            // 倒计时结束
            if (self.countdownSeconds <= 0) {
                clearInterval(self.countdownTimer);
                self.onCountdownEnd();
            }
            
        }, 1000);
    },
    
    // 播报倒计时数字
    announceCountdown(seconds) {
        // 根据设置决定播报频率
        const interval = this.settings.countdownInterval;
        
        if (interval === 1) {
            // 每秒播报
            this.speak(seconds.toString(), 1.2, false);
        } else if (seconds % interval === 0 || seconds <= 10) {
            // 每隔N秒播报，或最后10秒每秒播报
            this.speak(seconds.toString(), 1.2, false);
        } else if (seconds === 30 || seconds === 60) {
            // 关键时间点播报
            this.speak(`还剩${seconds}秒`, 1.0, false);
        }
    },
    
    // 更新倒计时显示
    updateCountdownDisplay() {
        const display = document.getElementById('enhancedCountdownDisplay');
        if (display) {
            const minutes = Math.floor(this.countdownSeconds / 60);
            const seconds = this.countdownSeconds % 60;
            display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // 最后30秒变红
            if (this.countdownSeconds <= 30) {
                display.style.color = '#FF4444';
                display.style.animation = 'pulse 0.5s infinite';
            }
        }
    },
    
    // ==================== 第二段：倒计时结束与感官警报强化 ====================
    
    // 倒计时结束处理
    onCountdownEnd() {
        this.isCountingDown = false;
        this.failureCount++;
        
        // 触发全屏警报
        if (this.settings.fullscreenAlert) {
            this.triggerFullscreenAlert();
        }
        
        // 播放高强度警报声
        this.playAlarmSound();
        
        // 开始循环语音提醒
        this.startVoiceEncouragement();
    },
    
    // 触发全屏警报
    triggerFullscreenAlert() {
        this.fullscreenAlertActive = true;
        
        // 创建全屏警报遮罩
        let alertOverlay = document.getElementById('fullscreenAlertOverlay');
        if (!alertOverlay) {
            alertOverlay = document.createElement('div');
            alertOverlay.id = 'fullscreenAlertOverlay';
            alertOverlay.innerHTML = `
                <div class="fullscreen-alert-content">
                    <div class="alert-icon">🚨</div>
                    <div class="alert-title">拖延警报！</div>
                    <div class="alert-task">${this.currentTask ? this.currentTask.title : '任务'}</div>
                    <div class="alert-message">倒计时已结束，请立即开始！</div>
                    <div class="alert-step" id="alertStartupStep"></div>
                    <div class="alert-buttons">
                        <button class="alert-btn start-btn" onclick="ProcrastinationEnhanced.confirmStart()">
                            ✅ 我已开始
                        </button>
                        <button class="alert-btn stuck-btn" onclick="ProcrastinationEnhanced.showStuckForm()">
                            😰 我卡住了
                        </button>
                    </div>
                    <div class="stuck-form" id="stuckForm" style="display:none;">
                        <textarea id="stuckReason" placeholder="描述一下为什么卡住了，例如：躺着很困很累不想动..."></textarea>
                        <button class="alert-btn ai-btn" onclick="ProcrastinationEnhanced.getAIHelp()">
                            🤖 AI帮我想办法
                        </button>
                    </div>
                    <div class="ai-suggestion" id="aiSuggestion" style="display:none;"></div>
                </div>
            `;
            document.body.appendChild(alertOverlay);
        }
        
        alertOverlay.style.display = 'flex';
        alertOverlay.classList.add('flashing');
        
        // 显示启动步骤
        const stepEl = document.getElementById('alertStartupStep');
        if (stepEl && this.currentTask) {
            const step = this.getStartupStep(this.currentTask);
            stepEl.textContent = `启动步骤：${step}`;
        }
        
        // 开始红色闪烁动画
        this.startFlashingAnimation();
    },
    
    // 开始闪烁动画
    startFlashingAnimation() {
        const overlay = document.getElementById('fullscreenAlertOverlay');
        if (!overlay) return;
        
        let isRed = true;
        this.flashTimer = setInterval(() => {
            if (!this.fullscreenAlertActive) {
                clearInterval(this.flashTimer);
                return;
            }
            overlay.style.backgroundColor = isRed ? 'rgba(255, 0, 0, 0.9)' : 'rgba(139, 0, 0, 0.9)';
            isRed = !isRed;
        }, 500);
    },
    
    // 播放警报声
    playAlarmSound() {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建紧急警报音 - 交替高低频率的蜂鸣
        const playBeep = (startTime, freq, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0.5, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // 播放10次交替蜂鸣
        for (let i = 0; i < 10; i++) {
            const freq = i % 2 === 0 ? 800 : 600;
            playBeep(now + i * 0.2, freq, 0.18);
        }
        
        // 持续播放直到用户确认
        if (this.fullscreenAlertActive) {
            setTimeout(() => {
                if (this.fullscreenAlertActive) {
                    this.playAlarmSound();
                }
            }, 3000);
        }
    },
    
    // ==================== 第三段：循环语音鼓励开导与问责阶梯 ====================
    
    // 开始语音鼓励循环
    startVoiceEncouragement() {
        if (!this.settings.voiceEncouragement) return;
        
        this.stopVoiceLoop();
        
        const self = this;
        
        // 立即播放一次
        this.playEncouragementVoice();
        
        // 设置循环
        this.voiceLoopTimer = setInterval(function() {
            self.playEncouragementVoice();
        }, this.settings.voiceLoopInterval * 1000);
    },
    
    // 播放鼓励/问责语音
    playEncouragementVoice() {
        const step = this.currentTask ? this.getStartupStep(this.currentTask) : '开始行动';
        let messages;
        
        // 根据失败次数选择语气
        if (this.failureCount <= 1) {
            messages = this.voiceMessages.level1;
        } else if (this.failureCount === 2) {
            messages = this.voiceMessages.level2;
        } else {
            messages = this.voiceMessages.level3;
        }
        
        // 随机选择一条消息
        const message = messages[Math.floor(Math.random() * messages.length)];
        const finalMessage = message.replace('{step}', step);
        
        this.speak(finalMessage, 1.0, true);
    },
    
    // 停止语音循环
    stopVoiceLoop() {
        if (this.voiceLoopTimer) {
            clearInterval(this.voiceLoopTimer);
            this.voiceLoopTimer = null;
        }
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    },
    
    // ==================== 第四段：低效率监控的持续语音询问 ====================
    
    // 启动低效率语音询问（由InefficiencyMonitor调用）
    startInefficiencyVoiceLoop(task) {
        const self = this;
        const taskName = task ? task.title : '当前任务';
        
        this.stopVoiceLoop();
        
        const askProgress = () => {
            const message = `您已经处理${taskName}一小时了，现在有结果了吗？请反思进度。`;
            self.speak(message, 1.0, true);
        };
        
        // 立即询问一次
        askProgress();
        
        // 每30秒询问一次
        this.voiceLoopTimer = setInterval(askProgress, 30000);
    },
    
    // ==================== 第五段：具体启动步骤引导与AI集成 ====================
    
    // 显示卡住表单
    showStuckForm() {
        const form = document.getElementById('stuckForm');
        if (form) {
            form.style.display = 'block';
        }
    },
    
    // 获取AI帮助
    async getAIHelp() {
        const reasonEl = document.getElementById('stuckReason');
        const suggestionEl = document.getElementById('aiSuggestion');
        
        if (!reasonEl || !suggestionEl) return;
        
        const reason = reasonEl.value.trim();
        if (!reason) {
            this.speak('请先描述一下为什么卡住了');
            return;
        }
        
        suggestionEl.style.display = 'block';
        suggestionEl.innerHTML = '<div class="loading">🤖 AI正在分析...</div>';
        
        try {
            const suggestion = await this.callAIForSteps(reason);
            
            suggestionEl.innerHTML = `
                <div class="ai-result">
                    <div class="ai-title">🎯 最小启动步骤：</div>
                    <div class="ai-steps">${suggestion}</div>
                    <button class="alert-btn try-btn" onclick="ProcrastinationEnhanced.tryAISuggestion('${suggestion.replace(/'/g, "\\'")}')">
                        👍 试试这个
                    </button>
                </div>
            `;
            
            // 语音播报建议
            this.speak(suggestion, 1.0, true);
            
        } catch (error) {
            console.error('AI调用失败:', error);
            // 使用备用建议
            const fallbackSuggestion = this.getFallbackSuggestion(reason);
            suggestionEl.innerHTML = `
                <div class="ai-result">
                    <div class="ai-title">🎯 建议的启动步骤：</div>
                    <div class="ai-steps">${fallbackSuggestion}</div>
                    <button class="alert-btn try-btn" onclick="ProcrastinationEnhanced.tryAISuggestion('${fallbackSuggestion.replace(/'/g, "\\'")}')">
                        👍 试试这个
                    </button>
                </div>
            `;
            this.speak(fallbackSuggestion, 1.0, true);
        }
    },
    
    // 调用AI获取启动步骤
    async callAIForSteps(stuckReason) {
        // 优先使用设置中的API Key，否则尝试从AIService获取
        let apiKey = this.settings.apiKey;
        if (!apiKey && typeof AIService !== 'undefined') {
            apiKey = AIService.apiKey;
        }
        
        if (!apiKey) {
            throw new Error('未配置API Key');
        }
        
        const taskName = this.currentTask ? this.currentTask.title : '任务';
        
        const prompt = `用户正在尝试开始任务"${taskName}"，但遇到了困难。

用户描述的卡住原因：${stuckReason}

请根据用户的具体情况，给出一个最小的、立即可执行的启动步骤。要求：
1. 步骤必须非常具体、简单，能在10秒内开始执行
2. 针对用户描述的困难给出解决方案
3. 使用鼓励性的语气
4. 只给出一个步骤，不要列表
5. 回复控制在30字以内

例如：
- 如果用户说"躺着很困很累不想动"，可以回复"心里倒数3、2、1，先坐起来"
- 如果用户说"不知道从哪开始"，可以回复"先打开文档，只看第一行"
- 如果用户说"任务太难了"，可以回复"只做5分钟，设个闹钟试试"`;

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一个专业的ADHD教练，擅长帮助人们克服拖延。你的回答简洁有力，直接给出可执行的最小步骤。' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
    },
    
    // 备用建议（当AI不可用时）
    getFallbackSuggestion(reason) {
        const reasonLower = reason.toLowerCase();
        
        if (reasonLower.includes('困') || reasonLower.includes('累') || reasonLower.includes('躺')) {
            return '心里倒数3、2、1，先站起来走两步';
        } else if (reasonLower.includes('不知道') || reasonLower.includes('从哪')) {
            return '先打开相关文件或工具，只看不做';
        } else if (reasonLower.includes('难') || reasonLower.includes('复杂')) {
            return '只做5分钟，设个闹钟，时间到就停';
        } else if (reasonLower.includes('不想') || reasonLower.includes('没动力')) {
            return '告诉自己只做1分钟，1分钟后可以停';
        } else if (reasonLower.includes('焦虑') || reasonLower.includes('压力')) {
            return '深呼吸3次，然后只做最简单的一小步';
        } else {
            return '倒数3秒，然后立即做第一个动作';
        }
    },
    
    // 尝试AI建议
    tryAISuggestion(suggestion) {
        this.speak(`好的，现在就${suggestion}`, 1.0, true);
        
        // 给用户30秒时间尝试
        setTimeout(() => {
            if (this.fullscreenAlertActive) {
                this.speak('怎么样，开始了吗？如果开始了请点击"我已开始"按钮', 1.0, true);
            }
        }, 30000);
    },
    
    // 确认开始
    confirmStart() {
        this.fullscreenAlertActive = false;
        this.stopVoiceLoop();
        
        // 隐藏警报
        const overlay = document.getElementById('fullscreenAlertOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('flashing');
        }
        
        // 清除闪烁定时器
        if (this.flashTimer) {
            clearInterval(this.flashTimer);
        }
        
        // 播放成功音
        this.playSuccessSound();
        
        // 语音鼓励
        this.speak('太棒了！继续保持，你可以的！', 1.0, true);
        
        // 通知原有系统
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.completeStep();
        }
    },
    
    // 播放成功音
    playSuccessSound() {
        if (!this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 上升的三音符
        const notes = [523.25, 659.25, 783.99];
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    },
    
    // ==================== 工具方法 ====================
    
    // 语音播报
    speak(text, rate = 1.0, interrupt = true) {
        if (!this.speechSynthesis) {
            console.log('语音播报（不支持）:', text);
            return;
        }
        
        if (interrupt) {
            this.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // 尝试使用中文语音
        const voices = this.speechSynthesis.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh'));
        if (chineseVoice) {
            utterance.voice = chineseVoice;
        }
        
        this.speechSynthesis.speak(utterance);
        console.log('语音播报:', text);
    },
    
    // 获取启动步骤
    getStartupStep(task) {
        if (task.substeps && task.substeps.length > 0) {
            return task.substeps[0].title;
        }
        return '开始执行';
    },
    
    // 停止倒计时
    stopCountdown() {
        this.isCountingDown = false;
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    },
    
    // 保存设置
    saveSettings() {
        Storage.save('procrastination_enhanced_settings', this.settings);
    },
    
    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    },
    
    // 设置API Key
    setApiKey(key) {
        this.settings.apiKey = key;
        this.saveSettings();
    },
    
    // 手动测试倒计时
    testCountdown(seconds = 10) {
        this.currentTask = { title: '测试任务', substeps: [{ title: '测试步骤' }] };
        this.countdownSeconds = seconds;
        this.isCountingDown = true;
        this.failureCount = 0;
        
        this.speak(`测试倒计时${seconds}秒开始`);
        this.runCountdown();
    },
    
    // 手动测试警报
    testAlert() {
        this.currentTask = { title: '测试任务', substeps: [{ title: '打开文档' }] };
        this.failureCount = 1;
        this.triggerFullscreenAlert();
        this.playAlarmSound();
        this.startVoiceEncouragement();
    }
};

// 导出
window.ProcrastinationEnhanced = ProcrastinationEnhanced;

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        ProcrastinationEnhanced.init();
    }, 2000);
});

