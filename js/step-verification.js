// 步数验证模块 - 通过计步器验证任务完成
const StepVerification = {
    // 状态
    state: {
        isActive: false,            // 是否正在验证中
        currentTask: null,          // 当前验证的任务
        targetSteps: 0,             // 目标步数
        currentSteps: 0,            // 当前累计步数
        lastStepTime: null,         // 最后一次检测到步数的时间
        idleStartTime: null,        // 开始静止的时间
        phase: 'idle',              // 阶段: idle, procrastination_check, verifying, completed
        procrastinationTimer: null, // 拖延检测定时器
        verificationTimer: null,    // 验证期定时器
        stepSensor: null,           // 步数传感器
        motionPermission: false,    // 运动权限
        baselineSteps: 0,           // 基准步数（开始时的步数）
    },
    
    // 设置
    settings: {
        procrastinationTimeout: 120,    // 拖延检测超时（秒）- 2分钟内必须开始活动
        idleTimeout: 120,               // 静止超时（秒）- 连续静止超过此时间步数清零
        minStepsPerCheck: 1,            // 每次检测最少步数增量（判断是否在活动）
        checkInterval: 1000,            // 检测间隔（毫秒）
        stepThresholds: {               // 任务类型对应的建议步数
            '打扫': 1000,
            '清洁': 800,
            '整理': 500,
            '运动': 2000,
            '散步': 3000,
            '跑步': 5000,
            '健身': 1500,
            '做饭': 600,
            '洗碗': 300,
            '拖地': 800,
            '吸尘': 600,
            '洗衣': 400,
            '购物': 2000,
            '遛狗': 2500,
            'default': 500
        }
    },
    
    // 初始化
    init() {
        // 加载设置
        const savedSettings = Storage.load('adhd_step_verification_settings', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
        
        // 检查设备是否支持计步
        this.checkSensorSupport();
        
        console.log('步数验证模块初始化完成');
    },
    
    // 检查传感器支持
    async checkSensorSupport() {
        // 检查是否支持 Pedometer API 或 DeviceMotion
        if ('Accelerometer' in window || 'DeviceMotionEvent' in window) {
            this.state.motionPermission = true;
            console.log('设备支持运动检测');
        } else {
            console.warn('设备不支持运动检测，将使用模拟模式');
        }
        
        // 尝试请求权限（iOS 13+需要）
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                this.state.motionPermission = (permission === 'granted');
            } catch (e) {
                console.warn('运动权限请求失败:', e);
            }
        }
    },
    
    // 请求运动权限（需要用户交互触发）
    async requestPermission() {
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                this.state.motionPermission = (permission === 'granted');
                return this.state.motionPermission;
            } catch (e) {
                console.error('运动权限请求失败:', e);
                return false;
            }
        }
        return true; // 非iOS设备默认有权限
    },
    
    // 根据任务描述推荐步数
    suggestSteps(taskTitle) {
        const title = (taskTitle || '').toLowerCase();
        
        for (const [keyword, steps] of Object.entries(this.settings.stepThresholds)) {
            if (keyword !== 'default' && title.includes(keyword)) {
                return steps;
            }
        }
        
        return this.settings.stepThresholds.default;
    },
    
    // 判断任务是否适合步数验证
    isStepVerificationSuitable(taskTitle) {
        const keywords = [
            '打扫', '清洁', '整理', '运动', '散步', '跑步', '健身',
            '做饭', '洗碗', '拖地', '吸尘', '洗衣', '购物', '遛狗',
            '收拾', '擦', '扫', '拖', '走', '跑', '动', '锻炼'
        ];
        
        const title = (taskTitle || '').toLowerCase();
        return keywords.some(k => title.includes(k));
    },
    
    // 开始步数验证任务
    async startVerification(task) {
        if (this.state.isActive) {
            console.warn('已有任务在验证中');
            return false;
        }
        
        // 请求权限
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '需要运动权限', '请允许访问运动数据');
            }
            // 继续使用模拟模式
        }
        
        this.state.isActive = true;
        this.state.currentTask = task;
        this.state.targetSteps = task.targetSteps || this.suggestSteps(task.title);
        this.state.currentSteps = 0;
        this.state.baselineSteps = 0;
        this.state.lastStepTime = null;
        this.state.idleStartTime = null;
        this.state.phase = 'procrastination_check';
        
        // 开始拖延检测阶段
        this.startProcrastinationCheck();
        
        // 显示验证UI
        this.showVerificationUI();
        
        // 通知
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🚶 步数验证任务【${task.title}】已开始！\n` +
                `目标步数：${this.state.targetSteps} 步\n` +
                `请在 ${this.settings.procrastinationTimeout / 60} 分钟内开始活动！`,
                '🚶'
            );
        }
        
        return true;
    },
    
    // 开始拖延检测（2分钟内必须开始活动）
    startProcrastinationCheck() {
        const self = this;
        let elapsedSeconds = 0;
        let activityDetected = false;
        
        // 开始监测运动
        this.startMotionDetection();
        
        // 拖延检测定时器
        this.state.procrastinationTimer = setInterval(() => {
            elapsedSeconds++;
            
            // 检查是否检测到活动
            if (self.state.currentSteps > 0) {
                activityDetected = true;
                clearInterval(self.state.procrastinationTimer);
                self.state.procrastinationTimer = null;
                
                // 进入主验证阶段
                self.state.phase = 'verifying';
                self.state.lastStepTime = Date.now();
                
                if (typeof App !== 'undefined') {
                    App.addChatMessage('system', 
                        '✅ 检测到活动！开始累计步数...\n' +
                        `注意：连续静止超过 ${self.settings.idleTimeout / 60} 分钟步数将清零！`,
                        '✅'
                    );
                }
                
                // 播放成功音
                if (typeof ProcrastinationMonitor !== 'undefined') {
                    ProcrastinationMonitor.playSound('success');
                }
                
                // 开始主验证期监控
                self.startMainVerification();
                return;
            }
            
            // 更新UI
            self.updateVerificationUI();
            
            // 检查是否超时
            if (elapsedSeconds >= self.settings.procrastinationTimeout) {
                clearInterval(self.state.procrastinationTimer);
                self.state.procrastinationTimer = null;
                
                // 标记为拖延，进入原有拖延处理流程
                self.handleProcrastination();
            }
        }, 1000);
    },
    
    // 处理拖延（2分钟内未开始活动）
    handleProcrastination() {
        const task = this.state.currentTask;
        
        // 播放警报音
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.playSound('alarm');
        }
        
        // 发送通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '🚨 拖延警告！',
                `任务【${task.title}】2分钟内未检测到活动！`,
                '🚨'
            );
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🚨 拖延警告！任务【${task.title}】\n` +
                `2分钟内未检测到任何活动！\n` +
                `请立即开始移动，或点击"重新开始"按钮。`,
                '🚨'
            );
        }
        
        // 记录拖延
        if (typeof AILearning !== 'undefined') {
            AILearning.recordProcrastination(task, 2, false);
        }
        
        // 重置并重新开始拖延检测
        this.state.phase = 'procrastination_check';
        this.state.currentSteps = 0;
        this.startProcrastinationCheck();
    },
    
    // 开始主验证期监控
    startMainVerification() {
        const self = this;
        
        // 主验证期定时器 - 检测静止
        this.state.verificationTimer = setInterval(() => {
            const now = Date.now();
            const timeSinceLastStep = self.state.lastStepTime ? 
                (now - self.state.lastStepTime) / 1000 : 0;
            
            // 检查是否静止超时
            if (timeSinceLastStep >= self.settings.idleTimeout) {
                // 步数清零！
                self.resetSteps();
            }
            
            // 检查是否完成
            if (self.state.currentSteps >= self.state.targetSteps) {
                self.completeVerification();
            }
            
            // 更新UI
            self.updateVerificationUI();
            
        }, 1000);
    },
    
    // 步数清零（静止超时）
    resetSteps() {
        const previousSteps = this.state.currentSteps;
        this.state.currentSteps = 0;
        this.state.lastStepTime = Date.now();
        this.state.idleStartTime = null;
        
        // 播放警告音
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.playSound('alarm');
        }
        
        // 发送通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '⚠️ 步数已清零！',
                `静止超过${this.settings.idleTimeout / 60}分钟，${previousSteps}步已清零！`,
                '⚠️'
            );
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `⚠️ 步数已清零！\n` +
                `检测到连续静止超过 ${this.settings.idleTimeout / 60} 分钟\n` +
                `之前累计的 ${previousSteps} 步已清零，请继续活动！`,
                '⚠️'
            );
        }
        
        this.updateVerificationUI();
    },
    
    // 完成验证
    completeVerification() {
        // 停止所有定时器
        this.stopAllTimers();
        this.stopMotionDetection();
        
        this.state.phase = 'completed';
        
        const task = this.state.currentTask;
        
        // 播放成功音
        if (typeof ProcrastinationMonitor !== 'undefined') {
            ProcrastinationMonitor.playSound('success');
        }
        
        // 发送通知
        if (typeof Settings !== 'undefined') {
            Settings.sendNotification(
                '🎉 步数目标达成！',
                `任务【${task.title}】已完成 ${this.state.currentSteps} 步！`,
                '🎉'
            );
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                `🎉 太棒了！步数目标达成！\n` +
                `任务【${task.title}】\n` +
                `完成步数：${this.state.currentSteps} / ${this.state.targetSteps} 步\n` +
                `现在可以点击"完成任务"按钮领取奖励！`,
                '🎉'
            );
        }
        
        // 更新UI显示完成按钮
        this.updateVerificationUI();
    },
    
    // 确认完成任务
    confirmComplete() {
        if (this.state.phase !== 'completed') {
            if (typeof Settings !== 'undefined') {
                Settings.showToast('warning', '还未达成目标', '请继续活动');
            }
            return;
        }
        
        const task = this.state.currentTask;
        
        // 调用App的完成任务方法
        if (typeof App !== 'undefined' && task) {
            App.completeTask(task.id);
        }
        
        // 重置状态
        this.reset();
        
        // 关闭验证UI
        this.hideVerificationUI();
    },
    
    // 开始运动检测
    startMotionDetection() {
        const self = this;
        
        // 使用加速度计模拟计步
        if ('DeviceMotionEvent' in window) {
            this.motionHandler = (event) => {
                const acc = event.accelerationIncludingGravity;
                if (!acc) return;
                
                // 简单的步数检测算法
                const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
                
                // 检测步伐（加速度变化超过阈值）
                if (!this.lastMagnitude) {
                    this.lastMagnitude = magnitude;
                    return;
                }
                
                const delta = Math.abs(magnitude - this.lastMagnitude);
                this.lastMagnitude = magnitude;
                
                // 步伐检测阈值
                if (delta > 3 && delta < 20) {
                    // 防抖：至少间隔300ms才算一步
                    const now = Date.now();
                    if (!this.lastStepDetected || now - this.lastStepDetected > 300) {
                        this.lastStepDetected = now;
                        self.addStep();
                    }
                }
            };
            
            window.addEventListener('devicemotion', this.motionHandler);
        } else {
            // 模拟模式：使用点击模拟步数（用于测试）
            console.log('使用模拟模式进行步数检测');
        }
    },
    
    // 停止运动检测
    stopMotionDetection() {
        if (this.motionHandler) {
            window.removeEventListener('devicemotion', this.motionHandler);
            this.motionHandler = null;
        }
        this.lastMagnitude = null;
        this.lastStepDetected = null;
    },
    
    // 添加步数
    addStep(count = 1) {
        if (!this.state.isActive) return;
        
        this.state.currentSteps += count;
        this.state.lastStepTime = Date.now();
        this.state.idleStartTime = null;
        
        // 更新UI
        this.updateVerificationUI();
        
        // 检查是否完成
        if (this.state.phase === 'verifying' && 
            this.state.currentSteps >= this.state.targetSteps) {
            this.completeVerification();
        }
    },
    
    // 模拟添加步数（用于测试）
    simulateSteps(count = 10) {
        if (!this.state.isActive) {
            console.warn('没有活动的验证任务');
            return;
        }
        this.addStep(count);
        console.log(`模拟添加 ${count} 步，当前: ${this.state.currentSteps}/${this.state.targetSteps}`);
    },
    
    // 停止所有定时器
    stopAllTimers() {
        if (this.state.procrastinationTimer) {
            clearInterval(this.state.procrastinationTimer);
            this.state.procrastinationTimer = null;
        }
        if (this.state.verificationTimer) {
            clearInterval(this.state.verificationTimer);
            this.state.verificationTimer = null;
        }
    },
    
    // 重置状态
    reset() {
        this.stopAllTimers();
        this.stopMotionDetection();
        
        this.state.isActive = false;
        this.state.currentTask = null;
        this.state.targetSteps = 0;
        this.state.currentSteps = 0;
        this.state.lastStepTime = null;
        this.state.idleStartTime = null;
        this.state.phase = 'idle';
    },
    
    // 取消验证
    cancelVerification() {
        const task = this.state.currentTask;
        this.reset();
        this.hideVerificationUI();
        
        if (typeof App !== 'undefined' && task) {
            App.addChatMessage('system', 
                `已取消任务【${task.title}】的步数验证`,
                '⏹️'
            );
        }
    },
    
    // 显示验证UI
    showVerificationUI() {
        // 移除已存在的UI
        this.hideVerificationUI();
        
        const container = document.createElement('div');
        container.id = 'stepVerificationUI';
        container.className = 'step-verification-container';
        container.innerHTML = this.renderVerificationUI();
        
        document.body.appendChild(container);
    },
    
    // 隐藏验证UI
    hideVerificationUI() {
        const container = document.getElementById('stepVerificationUI');
        if (container) {
            container.remove();
        }
    },
    
    // 更新验证UI
    updateVerificationUI() {
        const container = document.getElementById('stepVerificationUI');
        if (container) {
            container.innerHTML = this.renderVerificationUI();
        }
    },
    
    // 渲染验证UI
    renderVerificationUI() {
        const task = this.state.currentTask;
        const progress = Math.min(100, (this.state.currentSteps / this.state.targetSteps) * 100);
        const isCompleted = this.state.phase === 'completed';
        const isProcrastinationCheck = this.state.phase === 'procrastination_check';
        
        // 计算剩余时间或静止时间
        let statusText = '';
        let statusClass = '';
        
        if (isProcrastinationCheck) {
            statusText = '等待开始活动...';
            statusClass = 'waiting';
        } else if (isCompleted) {
            statusText = '🎉 目标达成！';
            statusClass = 'completed';
        } else {
            const timeSinceLastStep = this.state.lastStepTime ? 
                Math.floor((Date.now() - this.state.lastStepTime) / 1000) : 0;
            const idleRemaining = this.settings.idleTimeout - timeSinceLastStep;
            
            if (idleRemaining < 30) {
                statusText = `⚠️ 静止警告！${idleRemaining}秒后清零`;
                statusClass = 'warning';
            } else {
                statusText = '正在累计步数...';
                statusClass = 'active';
            }
        }
        
        return `
            <div class="step-verification-panel">
                <div class="step-verification-header">
                    <span class="step-icon">🚶</span>
                    <span class="step-title">步数验证</span>
                    <button class="step-close-btn" onclick="StepVerification.cancelVerification()">✕</button>
                </div>
                
                <div class="step-task-name">${task ? task.title : '未知任务'}</div>
                
                <div class="step-progress-container">
                    <div class="step-progress-ring">
                        <svg viewBox="0 0 100 100">
                            <circle class="step-progress-bg" cx="50" cy="50" r="45"/>
                            <circle class="step-progress-bar" cx="50" cy="50" r="45" 
                                style="stroke-dasharray: ${progress * 2.83}, 283"/>
                        </svg>
                        <div class="step-progress-text">
                            <span class="step-current">${this.state.currentSteps}</span>
                            <span class="step-separator">/</span>
                            <span class="step-target">${this.state.targetSteps}</span>
                        </div>
                    </div>
                </div>
                
                <div class="step-status ${statusClass}">${statusText}</div>
                
                <div class="step-actions">
                    ${isCompleted ? 
                        `<button class="step-complete-btn" onclick="StepVerification.confirmComplete()">
                            ✅ 完成任务
                        </button>` :
                        `<button class="step-simulate-btn" onclick="StepVerification.simulateSteps(50)">
                            🔧 模拟+50步
                        </button>`
                    }
                    <button class="step-cancel-btn" onclick="StepVerification.cancelVerification()">
                        取消
                    </button>
                </div>
                
                <div class="step-tips">
                    ${isProcrastinationCheck ? 
                        `💡 请在 ${this.settings.procrastinationTimeout / 60} 分钟内开始活动` :
                        `💡 连续静止超过 ${this.settings.idleTimeout / 60} 分钟步数将清零`
                    }
                </div>
            </div>
        `;
    },
    
    // 保存设置
    saveSettings() {
        Storage.save('adhd_step_verification_settings', this.settings);
    }
};

// 导出
window.StepVerification = StepVerification;

