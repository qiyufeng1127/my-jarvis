// Enhanced Procrastination Monitor - v3.0
// 增强版拖延监控系统 - 集成专业ADHD提示词、实时语音播报、阶梯式问责、AI启动步骤引导

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
    inefficiencyDuration: 0,        // 低效率持续时间（分钟）
    currentStuckType: '',           // 当前卡点类型
    currentEmotionalState: '',      // 当前情绪状态
    
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
        apiKey: 'sk-feff761a4a744e789711f2d88801d80b',  // DeepSeek API Key
    },
    
    // ==================== 专业ADHD提示词模板（可自定义修改） ====================
    
    // 提示词1：最小启动步骤生成器
    prompts: {
        // 最小启动步骤生成器（针对拖延/启动困难）
        startupStepPrompt: `你是一位专业的ADHD教练和拖延症行为专家，专为执行功能障碍人群设计微启动步骤。请根据用户的任务和卡点生成一个极其微小、可立即执行的启动动作。

### 核心原则：
1. **微小到荒谬**：步骤必须小到无法拒绝（通常<2分钟）
2. **感官先行**：优先涉及身体动作或感官体验
3. **减少决策**：避免需要选择的步骤
4. **外部提示**：利用环境或设备作为启动锚点
5. **正向强化**：完成后能有即时微小成就感

### 针对不同ADHD障碍类型的启动策略：
- **启动困难型**：用物理动作打破静止（如"站起来数到3"）
- **决策瘫痪型**：用二选一减少选项（如"A或B，闭眼指一个"）
- **过度思考型**：用无脑执行步骤（如"手比脑子快，先点开文件"）
- **完美主义型**：用"故意做糟"降低标准（如"用最丑的字体打第一行"）

### 响应格式（严格按此格式，便于解析）：
**步骤**：[具体动作，用祈使句，20字以内]
**原理**：[一句话解释为什么这对ADHD/拖延症有效，30字以内]
**下一步**：[完成后自然衔接的微步骤，15字以内]

### 请为以下情况生成启动步骤：
任务：{task_name}
卡点类型：{stuck_type}
具体描述：{stuck_reason}

记住：步骤必须小到可笑，但能打破行动僵局。ADHD大脑需要"先动起来，再思考"。`,

        // 提示词2：低效率监控与反思提问生成器
        inefficiencyPrompt: `你是一位了解ADHD时间感知障碍和执行功能挑战的教练。当用户陷入低效率循环时，你需要生成能帮助他们"跳出当前思维框架"的反思问题。

### 设计原则：
1. **时间锚定**：帮助ADHD用户重新感知时间流逝
2. **环境转向**：引导注意力从内部焦虑转向外部环境
3. **策略切换**：建议具体的注意力转移技巧
4. **降低标准**：重新定义"进展"的标准
5. **身体-大脑连接**：结合身体状态调整认知状态

### 针对不同低效率模式的问题类型：
- **时间盲症型**："过去一小时，你的注意力实际在哪里停留最久？"
- **任务切换型**："这是你切换的第几个任务？哪个任务在'召唤'你？"
- **细节漩涡型**："你现在卡住的细节对最终目标的重要程度是1-10分？"
- **回避循环型**："你在用当前行为逃避什么具体感受？"

### 响应格式（严格按此格式）：
**问题**：[一个简短、直接的反思问题，20字以内]
**策略建议**：[一个具体的注意力重置技巧，25字以内]
**再评估**：[一个帮助重新评估任务价值的问题，20字以内]

### 请为以下情况生成反思干预：
任务：{task_name}
已用时间：{duration}分钟
当前行为模式：{pattern}
感知进度：{progress}/10分

记住：问题要简短、犀利、可视化，帮助ADHD用户"跳出当前时刻"观察自己的行为模式。`,

        // 提示词3：梯度提醒与问责语音生成器
        reminderPrompt: `你是一位懂得ADHD情绪敏感性和动机波动的教练。请根据拖延次数生成恰当语气的提醒语音。

### 语气梯度设计：
- **第1次（温柔引导）**：共情+微小步骤建议
- **第2次（坚定提醒）**：事实陈述+选择权强调
- **第3次（直接问责）**：后果可视化+立即行动指令
- **第4+次（系统重置）**：完全改变策略，打破当前循环

### 关键元素：
1. **命名拖延**：给当前拖延行为一个具体名称
2. **情绪接纳**：承认困难，但不陷入共情循环
3. **选择点**：强调"现在的小选择决定后续体验"
4. **后果可视化**：让未来后果变得具体、即时
5. **退出通道**：提供"做一点就能停"的许可

### 响应格式（严格按此格式）：
**语音文本**：[直接播放的内容，50字以内，带语气指示如(温柔)/(坚定)/(严肃)]
**后续动作**：[如果用户响应，建议的具体动作，20字以内]
**备用策略**：[如果继续拖延，2分钟后的新方法，25字以内]

### 请为以下情况生成提醒：
拖延次数：{delay_count}
任务：{task_name}
拖延模式：{delay_pattern}
情绪状态：{emotional_state}

记住：对ADHD用户，提醒必须简短、具体、提供清晰的选择路径。避免长篇说教，使用短句和视觉化语言。`
    },
    
    // 卡点类型选项
    stuckTypes: [
        { id: 'startup', label: '启动困难', desc: '知道要做但就是动不起来' },
        { id: 'decision', label: '决策瘫痪', desc: '不知道从哪里开始' },
        { id: 'overthink', label: '过度思考', desc: '想太多反而无法行动' },
        { id: 'perfectionism', label: '完美主义', desc: '担心做不好所以不敢开始' },
        { id: 'exhaustion', label: '精力枯竭', desc: '太累了没有力气' }
    ],
    
    // 情绪状态选项
    emotionalStates: [
        { id: 'anxious', label: '焦虑', emoji: '😰' },
        { id: 'resistant', label: '抗拒', emoji: '😤' },
        { id: 'numb', label: '麻木', emoji: '😶' },
        { id: 'tired', label: '疲惫', emoji: '😴' },
        { id: 'overwhelmed', label: '不堪重负', emoji: '😵' }
    ],
    
    // 低效率行为模式选项
    inefficiencyPatterns: [
        { id: 'checking', label: '反复检查', desc: '不断检查同一部分' },
        { id: 'switching', label: '频繁切换', desc: '在多个任务间跳来跳去' },
        { id: 'perfectloop', label: '完美主义循环', desc: '反复修改追求完美' },
        { id: 'browsing', label: '网络漫游', desc: '不自觉地刷网页/社交媒体' },
        { id: 'avoidance', label: '回避行为', desc: '做其他事情逃避主任务' }
    ],
    
    // 阶梯式语音内容（本地备用，当AI不可用时使用）
    voiceMessages: {
        // 第一次失败 - 温柔鼓励（共情+微小步骤）
        level1: [
            "(温柔)我知道开始很难，先{step}就好，只需要这一小步",
            "(温柔)没关系，我们一起来。深呼吸，然后{step}",
            "(温柔)不用想太多，先让身体动起来，{step}",
            "(温柔)你可以的，先从最简单的开始，{step}试试看",
            "(温柔)给自己一个小小的许可，只做{step}，做完可以停"
        ],
        // 第二次失败 - 坚定提醒（事实陈述+选择权）
        level2: [
            "(坚定)这是第二次提醒。时间在流逝，你可以选择：现在{step}，或者决定改期",
            "(坚定)已经过去几分钟了。每多等一分钟，开始就更难。现在{step}",
            "(坚定)停止等待完美时机。现在就是时机。立即{step}",
            "(坚定)你的大脑在制造借口。打断它，马上{step}",
            "(坚定)选择时刻：A.现在{step}；B.承认今天不做。没有C选项"
        ],
        // 第三次及以后 - 直接问责（后果可视化+行动指令）
        level3: [
            "(严肃)第三次了。继续拖延会让你今晚更焦虑。立刻{step}，现在",
            "(严肃)你已经在这个任务上浪费了宝贵的意志力。停止消耗，马上{step}",
            "(严肃)问问自己：一小时后的你会感谢现在的选择吗？立即{step}",
            "(严肃)拖延不会让任务消失，只会让它变得更重。现在{step}",
            "(严肃)这是你第三次机会。用它来{step}，或者承担后果"
        ],
        // 第四次及以后 - 系统重置（完全改变策略）
        level4: [
            "(平静)好，我们换个方式。忘掉原计划，现在只做一件事：{step}",
            "(平静)当前方法不奏效。新策略：用手机录音说出你对任务的所有想法，不整理",
            "(平静)重置。站起来，走到窗边，看外面10秒，然后回来{step}",
            "(平静)改变环境。换个位置，换个姿势，然后只做{step}这一件事",
            "(平静)最后尝试：设置5分钟倒计时，只做{step}，时间到就停，不管完成多少"
        ]
    },
    
    // 初始化
    init() {
        console.log('增强版拖延监控系统 v3.0 初始化...');
        
        // 加载设置
        const savedSettings = Storage.load('procrastination_enhanced_settings', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
        
        // 加载自定义提示词
        const savedPrompts = Storage.load('procrastination_enhanced_prompts', null);
        if (savedPrompts) {
            Object.assign(this.prompts, savedPrompts);
        }
        
        // 初始化语音合成
        this.initSpeechSynthesis();
        
        // 初始化音频
        this.initAudio();
        
        // 监听原有拖延监控的任务触发
        this.hookIntoProcrastinationMonitor();
        
        // 监听低效率监控
        this.hookIntoInefficiencyMonitor();
        
        console.log('增强版拖延监控系统初始化完成，API Key:', this.settings.apiKey ? '已配置' : '未配置');
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
    
    // 挂钩到低效率监控
    hookIntoInefficiencyMonitor() {
        const self = this;
        
        if (typeof InefficiencyMonitor !== 'undefined') {
            const originalAlert = InefficiencyMonitor.triggerHourlyAlert ? 
                InefficiencyMonitor.triggerHourlyAlert.bind(InefficiencyMonitor) : null;
            
            if (originalAlert) {
                InefficiencyMonitor.triggerHourlyAlert = function() {
                    // 调用增强版的低效率提醒
                    self.triggerInefficiencyAlert(InefficiencyMonitor.currentTask, InefficiencyMonitor.elapsedMinutes);
                    // 也调用原有逻辑
                    originalAlert();
                };
                console.log('已挂钩到低效率监控系统');
            }
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
        
        // 生成卡点类型选项HTML
        const stuckTypesHtml = this.stuckTypes.map(t => 
            `<button class="stuck-type-btn" data-type="${t.id}" onclick="ProcrastinationEnhanced.selectStuckType('${t.id}')">${t.label}</button>`
        ).join('');
        
        // 生成情绪状态选项HTML
        const emotionalStatesHtml = this.emotionalStates.map(e => 
            `<button class="emotion-btn" data-emotion="${e.id}" onclick="ProcrastinationEnhanced.selectEmotion('${e.id}')">${e.emoji} ${e.label}</button>`
        ).join('');
        
        // 创建全屏警报遮罩
        let alertOverlay = document.getElementById('fullscreenAlertOverlay');
        if (alertOverlay) {
            alertOverlay.remove();
        }
        
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
                    <div class="stuck-section">
                        <div class="stuck-label">你的卡点类型是？</div>
                        <div class="stuck-types">${stuckTypesHtml}</div>
                    </div>
                    
                    <div class="stuck-section">
                        <div class="stuck-label">当前情绪状态？</div>
                        <div class="emotion-states">${emotionalStatesHtml}</div>
                    </div>
                    
                    <div class="stuck-section">
                        <div class="stuck-label">具体描述一下（可选）</div>
                        <textarea id="stuckReason" placeholder="例如：躺着很困很累不想动、不知道从哪开始、害怕做不好..."></textarea>
                    </div>
                    
                    <button class="alert-btn ai-btn" onclick="ProcrastinationEnhanced.getAIHelp()">
                        🤖 AI帮我生成最小启动步骤
                    </button>
                </div>
                
                <div class="ai-suggestion" id="aiSuggestion" style="display:none;"></div>
                
                <div class="settings-link">
                    <button class="settings-btn-small" onclick="ProcrastinationEnhanced.showSettingsPanel()">
                        ⚙️ 设置提示词和API
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(alertOverlay);
        
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
    
    // 选择卡点类型
    selectStuckType(typeId) {
        this.currentStuckType = typeId;
        document.querySelectorAll('.stuck-type-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === typeId);
        });
    },
    
    // 选择情绪状态
    selectEmotion(emotionId) {
        this.currentEmotionalState = emotionId;
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.emotion === emotionId);
        });
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
    
    // 播放鼓励/问责语音（使用AI或本地备用）
    async playEncouragementVoice() {
        const step = this.currentTask ? this.getStartupStep(this.currentTask) : '开始行动';
        const taskName = this.currentTask ? this.currentTask.title : '任务';
        
        // 尝试使用AI生成
        if (this.settings.useAISteps && this.settings.apiKey) {
            try {
                const aiResponse = await this.callAIForReminder(taskName, step);
                if (aiResponse && aiResponse.voiceText) {
                    this.speak(aiResponse.voiceText, 1.0, true);
                    return;
                }
            } catch (e) {
                console.log('AI提醒生成失败，使用本地备用:', e);
            }
        }
        
        // 使用本地备用消息
        let messages;
        if (this.failureCount <= 1) {
            messages = this.voiceMessages.level1;
        } else if (this.failureCount === 2) {
            messages = this.voiceMessages.level2;
        } else if (this.failureCount === 3) {
            messages = this.voiceMessages.level3;
        } else {
            messages = this.voiceMessages.level4;
        }
        
        // 随机选择一条消息
        const message = messages[Math.floor(Math.random() * messages.length)];
        const finalMessage = message.replace('{step}', step).replace(/\(温柔\)|\(坚定\)|\(严肃\)|\(平静\)/g, '');
        
        this.speak(finalMessage, 1.0, true);
    },
    
    // 调用AI生成梯度提醒（提示词3）
    async callAIForReminder(taskName, step) {
        if (!this.settings.apiKey) return null;
        
        const stuckType = this.stuckTypes.find(t => t.id === this.currentStuckType);
        const emotion = this.emotionalStates.find(e => e.id === this.currentEmotionalState);
        
        const prompt = this.prompts.reminderPrompt
            .replace('{delay_count}', this.failureCount.toString())
            .replace('{task_name}', taskName)
            .replace('{delay_pattern}', stuckType ? stuckType.label : '启动困难')
            .replace('{emotional_state}', emotion ? emotion.label : '焦虑');
        
        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: '你是一位专业的ADHD教练，懂得情绪敏感性和动机波动。请严格按照格式要求回复。' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) throw new Error('API请求失败');
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // 解析响应
            const voiceMatch = content.match(/\*\*语音文本\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            const actionMatch = content.match(/\*\*后续动作\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            const backupMatch = content.match(/\*\*备用策略\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            
            return {
                voiceText: voiceMatch ? voiceMatch[1].trim() : null,
                nextAction: actionMatch ? actionMatch[1].trim() : null,
                backupStrategy: backupMatch ? backupMatch[1].trim() : null
            };
        } catch (e) {
            console.error('AI提醒生成失败:', e);
            return null;
        }
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
    
    // 触发低效率警报（使用提示词2）
    async triggerInefficiencyAlert(task, durationMinutes) {
        this.inefficiencyDuration = durationMinutes;
        const taskName = task ? task.title : '当前任务';
        
        // 尝试使用AI生成反思问题
        if (this.settings.useAISteps && this.settings.apiKey) {
            try {
                const aiResponse = await this.callAIForInefficiency(taskName, durationMinutes);
                if (aiResponse) {
                    this.showInefficiencyDialog(taskName, durationMinutes, aiResponse);
                    return;
                }
            } catch (e) {
                console.log('AI低效率分析失败，使用默认提醒:', e);
            }
        }
        
        // 默认提醒
        const message = `您已经处理${taskName}${durationMinutes}分钟了，现在有结果了吗？请反思进度。`;
        this.speak(message, 1.0, true);
    },
    
    // 调用AI生成低效率反思问题（提示词2）
    async callAIForInefficiency(taskName, duration) {
        if (!this.settings.apiKey) return null;
        
        const pattern = this.inefficiencyPatterns.find(p => p.id === 'checking'); // 默认
        
        const prompt = this.prompts.inefficiencyPrompt
            .replace('{task_name}', taskName)
            .replace('{duration}', duration.toString())
            .replace('{pattern}', pattern ? pattern.label : '反复检查')
            .replace('{progress}', '3'); // 默认低进度
        
        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: '你是一位了解ADHD时间感知障碍的教练。请严格按照格式要求回复，帮助用户跳出低效率循环。' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) throw new Error('API请求失败');
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            // 解析响应
            const questionMatch = content.match(/\*\*问题\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            const strategyMatch = content.match(/\*\*策略建议\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            const reevalMatch = content.match(/\*\*再评估\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
            
            return {
                question: questionMatch ? questionMatch[1].trim() : null,
                strategy: strategyMatch ? strategyMatch[1].trim() : null,
                reevaluate: reevalMatch ? reevalMatch[1].trim() : null
            };
        } catch (e) {
            console.error('AI低效率分析失败:', e);
            return null;
        }
    },
    
    // 显示低效率对话框
    showInefficiencyDialog(taskName, duration, aiResponse) {
        // 语音播报问题
        if (aiResponse.question) {
            this.speak(aiResponse.question, 1.0, true);
        }
        
        // 创建对话框
        let dialog = document.getElementById('inefficiencyDialog');
        if (dialog) dialog.remove();
        
        dialog = document.createElement('div');
        dialog.id = 'inefficiencyDialog';
        dialog.className = 'inefficiency-dialog';
        dialog.innerHTML = `
            <div class="inefficiency-content">
                <div class="inefficiency-header">
                    <span class="inefficiency-icon">⏰</span>
                    <span class="inefficiency-title">低效率提醒</span>
                    <button class="inefficiency-close" onclick="ProcrastinationEnhanced.closeInefficiencyDialog()">×</button>
                </div>
                <div class="inefficiency-task">
                    <strong>${taskName}</strong> - 已用时 ${duration} 分钟
                </div>
                ${aiResponse.question ? `
                <div class="inefficiency-question">
                    <div class="question-label">💭 反思问题：</div>
                    <div class="question-text">${aiResponse.question}</div>
                </div>
                ` : ''}
                ${aiResponse.strategy ? `
                <div class="inefficiency-strategy">
                    <div class="strategy-label">🎯 策略建议：</div>
                    <div class="strategy-text">${aiResponse.strategy}</div>
                </div>
                ` : ''}
                ${aiResponse.reevaluate ? `
                <div class="inefficiency-reevaluate">
                    <div class="reevaluate-label">🔄 再评估：</div>
                    <div class="reevaluate-text">${aiResponse.reevaluate}</div>
                </div>
                ` : ''}
                <div class="inefficiency-actions">
                    <button class="inefficiency-btn continue" onclick="ProcrastinationEnhanced.closeInefficiencyDialog()">
                        继续专注
                    </button>
                    <button class="inefficiency-btn break" onclick="ProcrastinationEnhanced.takeBreak()">
                        休息5分钟
                    </button>
                    <button class="inefficiency-btn change" onclick="ProcrastinationEnhanced.changeStrategy()">
                        换个方法
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        setTimeout(() => dialog.classList.add('show'), 10);
    },
    
    // 关闭低效率对话框
    closeInefficiencyDialog() {
        const dialog = document.getElementById('inefficiencyDialog');
        if (dialog) {
            dialog.classList.remove('show');
            setTimeout(() => dialog.remove(), 300);
        }
    },
    
    // 休息5分钟
    takeBreak() {
        this.closeInefficiencyDialog();
        this.speak('好的，休息5分钟。站起来走动一下，喝点水。5分钟后我会提醒你。', 1.0, true);
        
        setTimeout(() => {
            this.speak('休息时间结束，准备好继续了吗？', 1.0, true);
        }, 5 * 60 * 1000);
    },
    
    // 换个方法
    changeStrategy() {
        this.closeInefficiencyDialog();
        this.speak('好的，让我们换个方法。试试用语音输入口述你的想法，不要整理，先说出来。', 1.0, true);
    },
    
    // 启动低效率语音询问（由InefficiencyMonitor调用）
    startInefficiencyVoiceLoop(task) {
        const self = this;
        const taskName = task ? task.title : '当前任务';
        
        this.stopVoiceLoop();
        
        const askProgress = () => {
            self.triggerInefficiencyAlert(task, self.inefficiencyDuration + 60);
            self.inefficiencyDuration += 60;
        };
        
        // 立即询问一次
        this.triggerInefficiencyAlert(task, 60);
        
        // 每60分钟询问一次
        this.voiceLoopTimer = setInterval(askProgress, 60 * 60 * 1000);
    },
    
    // ==================== 第五段：具体启动步骤引导与AI集成 ====================
    
    // 显示卡住表单
    showStuckForm() {
        const form = document.getElementById('stuckForm');
        if (form) {
            form.style.display = 'block';
        }
    },
    
    // 获取AI帮助（使用提示词1：最小启动步骤生成器）
    async getAIHelp() {
        const reasonEl = document.getElementById('stuckReason');
        const suggestionEl = document.getElementById('aiSuggestion');
        
        if (!suggestionEl) return;
        
        const reason = reasonEl ? reasonEl.value.trim() : '';
        const stuckType = this.stuckTypes.find(t => t.id === this.currentStuckType);
        const emotion = this.emotionalStates.find(e => e.id === this.currentEmotionalState);
        
        if (!this.currentStuckType && !reason) {
            this.speak('请先选择卡点类型或描述一下情况');
            return;
        }
        
        suggestionEl.style.display = 'block';
        suggestionEl.innerHTML = '<div class="loading">🤖 AI正在分析你的情况，生成最小启动步骤...</div>';
        
        try {
            const aiResponse = await this.callAIForStartupSteps(reason, stuckType, emotion);
            
            if (aiResponse && aiResponse.step) {
                suggestionEl.innerHTML = `
                    <div class="ai-result">
                        <div class="ai-step-section">
                            <div class="ai-title">🎯 最小启动步骤：</div>
                            <div class="ai-steps">${aiResponse.step}</div>
                        </div>
                        ${aiResponse.reason ? `
                        <div class="ai-reason-section">
                            <div class="ai-subtitle">💡 原理：</div>
                            <div class="ai-reason">${aiResponse.reason}</div>
                        </div>
                        ` : ''}
                        ${aiResponse.nextStep ? `
                        <div class="ai-next-section">
                            <div class="ai-subtitle">➡️ 下一步：</div>
                            <div class="ai-next">${aiResponse.nextStep}</div>
                        </div>
                        ` : ''}
                        <button class="alert-btn try-btn" onclick="ProcrastinationEnhanced.tryAISuggestion('${aiResponse.step.replace(/'/g, "\\'")}')">
                            👍 好，我现在就试试
                        </button>
                    </div>
                `;
                
                // 语音播报建议
                this.speak(aiResponse.step, 1.0, true);
            } else {
                throw new Error('AI响应格式错误');
            }
            
        } catch (error) {
            console.error('AI调用失败:', error);
            // 使用备用建议
            const fallbackSuggestion = this.getFallbackSuggestion(reason || (stuckType ? stuckType.desc : ''));
            suggestionEl.innerHTML = `
                <div class="ai-result">
                    <div class="ai-title">🎯 建议的启动步骤：</div>
                    <div class="ai-steps">${fallbackSuggestion}</div>
                    <div class="ai-note">（AI暂时不可用，这是本地建议）</div>
                    <button class="alert-btn try-btn" onclick="ProcrastinationEnhanced.tryAISuggestion('${fallbackSuggestion.replace(/'/g, "\\'")}')">
                        👍 好，我现在就试试
                    </button>
                </div>
            `;
            this.speak(fallbackSuggestion, 1.0, true);
        }
    },
    
    // 调用AI获取启动步骤（提示词1）
    async callAIForStartupSteps(stuckReason, stuckType, emotion) {
        if (!this.settings.apiKey) {
            throw new Error('未配置API Key');
        }
        
        const taskName = this.currentTask ? this.currentTask.title : '任务';
        
        // 使用提示词1模板
        const prompt = this.prompts.startupStepPrompt
            .replace('{task_name}', taskName)
            .replace('{stuck_type}', stuckType ? stuckType.label : '启动困难')
            .replace('{stuck_reason}', stuckReason || (stuckType ? stuckType.desc : '不知道如何开始'));
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一位专业的ADHD教练和拖延症行为专家。请严格按照格式要求回复，生成微小到无法拒绝的启动步骤。' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败: ' + response.status);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // 解析响应
        const stepMatch = content.match(/\*\*步骤\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
        const reasonMatch = content.match(/\*\*原理\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
        const nextMatch = content.match(/\*\*下一步\*\*[：:]\s*(.+?)(?=\*\*|$)/s);
        
        return {
            step: stepMatch ? stepMatch[1].trim() : content.trim(),
            reason: reasonMatch ? reasonMatch[1].trim() : null,
            nextStep: nextMatch ? nextMatch[1].trim() : null
        };
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
    
    // 保存提示词
    savePrompts() {
        Storage.save('procrastination_enhanced_prompts', this.prompts);
    },
    
    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    },
    
    // 更新提示词
    updatePrompt(key, value) {
        this.prompts[key] = value;
        this.savePrompts();
    },
    
    // 设置API Key
    setApiKey(key) {
        this.settings.apiKey = key;
        this.saveSettings();
        console.log('API Key已更新');
    },
    
    // 显示设置面板
    showSettingsPanel() {
        let panel = document.getElementById('procrastinationSettingsPanel');
        if (panel) panel.remove();
        
        panel = document.createElement('div');
        panel.id = 'procrastinationSettingsPanel';
        panel.className = 'settings-panel-overlay';
        panel.innerHTML = `
            <div class="settings-panel-content">
                <div class="settings-panel-header">
                    <h3>⚙️ 拖延监控设置</h3>
                    <button class="settings-close-btn" onclick="ProcrastinationEnhanced.closeSettingsPanel()">×</button>
                </div>
                
                <div class="settings-panel-body">
                    <!-- API Key 设置 -->
                    <div class="settings-section">
                        <div class="settings-section-title">🔑 DeepSeek API Key</div>
                        <div class="settings-item">
                            <input type="password" id="apiKeyInput" class="settings-input" 
                                value="${this.settings.apiKey}" 
                                placeholder="输入你的 DeepSeek API Key">
                            <button class="settings-btn" onclick="ProcrastinationEnhanced.saveApiKey()">保存</button>
                            <button class="settings-btn secondary" onclick="ProcrastinationEnhanced.testApiKey()">测试</button>
                        </div>
                        <div class="settings-hint">用于AI生成个性化启动步骤和提醒</div>
                    </div>
                    
                    <!-- 基础设置 -->
                    <div class="settings-section">
                        <div class="settings-section-title">⏱️ 基础设置</div>
                        <div class="settings-item">
                            <label>倒计时时长（秒）</label>
                            <input type="number" id="countdownDuration" class="settings-input-small" 
                                value="${this.settings.countdownDuration}" min="30" max="600">
                        </div>
                        <div class="settings-item">
                            <label>语音循环间隔（秒）</label>
                            <input type="number" id="voiceLoopInterval" class="settings-input-small" 
                                value="${this.settings.voiceLoopInterval}" min="5" max="60">
                        </div>
                        <div class="settings-item">
                            <label>
                                <input type="checkbox" id="voiceCountdown" ${this.settings.voiceCountdown ? 'checked' : ''}>
                                启用语音倒计时播报
                            </label>
                        </div>
                        <div class="settings-item">
                            <label>
                                <input type="checkbox" id="fullscreenAlert" ${this.settings.fullscreenAlert ? 'checked' : ''}>
                                启用全屏警报
                            </label>
                        </div>
                        <div class="settings-item">
                            <label>
                                <input type="checkbox" id="useAISteps" ${this.settings.useAISteps ? 'checked' : ''}>
                                使用AI生成启动步骤
                            </label>
                        </div>
                    </div>
                    
                    <!-- 提示词设置 -->
                    <div class="settings-section">
                        <div class="settings-section-title">📝 提示词模板（可自定义）</div>
                        
                        <div class="prompt-tabs">
                            <button class="prompt-tab active" onclick="ProcrastinationEnhanced.switchPromptTab('startup')">
                                启动步骤
                            </button>
                            <button class="prompt-tab" onclick="ProcrastinationEnhanced.switchPromptTab('inefficiency')">
                                低效率反思
                            </button>
                            <button class="prompt-tab" onclick="ProcrastinationEnhanced.switchPromptTab('reminder')">
                                梯度提醒
                            </button>
                        </div>
                        
                        <div class="prompt-content" id="promptContent">
                            <div class="prompt-editor" id="startupPromptEditor">
                                <div class="prompt-label">提示词1：最小启动步骤生成器</div>
                                <textarea id="startupStepPrompt" class="prompt-textarea">${this.escapeHtml(this.prompts.startupStepPrompt)}</textarea>
                                <div class="prompt-variables">
                                    可用变量：{task_name}, {stuck_type}, {stuck_reason}
                                </div>
                            </div>
                            <div class="prompt-editor" id="inefficiencyPromptEditor" style="display:none;">
                                <div class="prompt-label">提示词2：低效率监控与反思提问</div>
                                <textarea id="inefficiencyPrompt" class="prompt-textarea">${this.escapeHtml(this.prompts.inefficiencyPrompt)}</textarea>
                                <div class="prompt-variables">
                                    可用变量：{task_name}, {duration}, {pattern}, {progress}
                                </div>
                            </div>
                            <div class="prompt-editor" id="reminderPromptEditor" style="display:none;">
                                <div class="prompt-label">提示词3：梯度提醒与问责语音</div>
                                <textarea id="reminderPrompt" class="prompt-textarea">${this.escapeHtml(this.prompts.reminderPrompt)}</textarea>
                                <div class="prompt-variables">
                                    可用变量：{delay_count}, {task_name}, {delay_pattern}, {emotional_state}
                                </div>
                            </div>
                        </div>
                        
                        <div class="prompt-actions">
                            <button class="settings-btn" onclick="ProcrastinationEnhanced.saveAllPrompts()">
                                💾 保存提示词
                            </button>
                            <button class="settings-btn secondary" onclick="ProcrastinationEnhanced.resetPrompts()">
                                🔄 恢复默认
                            </button>
                        </div>
                    </div>
                    
                    <!-- 测试功能 -->
                    <div class="settings-section">
                        <div class="settings-section-title">🧪 测试功能</div>
                        <div class="test-buttons">
                            <button class="test-btn" onclick="ProcrastinationEnhanced.testCountdown(10)">
                                测试10秒倒计时
                            </button>
                            <button class="test-btn" onclick="ProcrastinationEnhanced.testAlert()">
                                测试全屏警报
                            </button>
                            <button class="test-btn" onclick="ProcrastinationEnhanced.testVoice()">
                                测试语音播报
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-panel-footer">
                    <button class="settings-btn primary" onclick="ProcrastinationEnhanced.saveAllSettings()">
                        保存所有设置
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        
        setTimeout(() => panel.classList.add('show'), 10);
    },
    
    // 关闭设置面板
    closeSettingsPanel() {
        const panel = document.getElementById('procrastinationSettingsPanel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => panel.remove(), 300);
        }
    },
    
    // 切换提示词标签
    switchPromptTab(tab) {
        document.querySelectorAll('.prompt-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.prompt-editor').forEach(e => e.style.display = 'none');
        
        event.target.classList.add('active');
        document.getElementById(tab + 'PromptEditor').style.display = 'block';
    },
    
    // 保存API Key
    saveApiKey() {
        const input = document.getElementById('apiKeyInput');
        if (input) {
            this.setApiKey(input.value.trim());
            this.speak('API Key已保存');
        }
    },
    
    // 测试API Key
    async testApiKey() {
        const input = document.getElementById('apiKeyInput');
        const apiKey = input ? input.value.trim() : this.settings.apiKey;
        
        if (!apiKey) {
            this.speak('请先输入API Key');
            return;
        }
        
        this.speak('正在测试API连接...');
        
        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: '你好' }],
                    max_tokens: 10
                })
            });
            
            if (response.ok) {
                this.speak('API连接成功！');
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', '✅ DeepSeek API 连接测试成功！', '✅');
                }
            } else {
                throw new Error('API响应错误: ' + response.status);
            }
        } catch (e) {
            this.speak('API连接失败，请检查Key是否正确');
            console.error('API测试失败:', e);
        }
    },
    
    // 保存所有提示词
    saveAllPrompts() {
        const startupPrompt = document.getElementById('startupStepPrompt');
        const inefficiencyPrompt = document.getElementById('inefficiencyPrompt');
        const reminderPrompt = document.getElementById('reminderPrompt');
        
        if (startupPrompt) this.prompts.startupStepPrompt = startupPrompt.value;
        if (inefficiencyPrompt) this.prompts.inefficiencyPrompt = inefficiencyPrompt.value;
        if (reminderPrompt) this.prompts.reminderPrompt = reminderPrompt.value;
        
        this.savePrompts();
        this.speak('提示词已保存');
    },
    
    // 重置提示词为默认
    resetPrompts() {
        if (confirm('确定要恢复默认提示词吗？你的自定义修改将丢失。')) {
            Storage.remove('procrastination_enhanced_prompts');
            location.reload();
        }
    },
    
    // 保存所有设置
    saveAllSettings() {
        // 保存基础设置
        const countdownDuration = document.getElementById('countdownDuration');
        const voiceLoopInterval = document.getElementById('voiceLoopInterval');
        const voiceCountdown = document.getElementById('voiceCountdown');
        const fullscreenAlert = document.getElementById('fullscreenAlert');
        const useAISteps = document.getElementById('useAISteps');
        
        if (countdownDuration) this.settings.countdownDuration = parseInt(countdownDuration.value) || 120;
        if (voiceLoopInterval) this.settings.voiceLoopInterval = parseInt(voiceLoopInterval.value) || 15;
        if (voiceCountdown) this.settings.voiceCountdown = voiceCountdown.checked;
        if (fullscreenAlert) this.settings.fullscreenAlert = fullscreenAlert.checked;
        if (useAISteps) this.settings.useAISteps = useAISteps.checked;
        
        // 保存API Key
        this.saveApiKey();
        
        // 保存提示词
        this.saveAllPrompts();
        
        this.saveSettings();
        this.speak('所有设置已保存');
        this.closeSettingsPanel();
    },
    
    // 测试语音
    testVoice() {
        this.speak('这是一条测试语音。如果你能听到这条消息，说明语音功能正常工作。');
    },
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

