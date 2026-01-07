// 拖延面板管理系统
const ProcrastinationPanel = {
    currentTask: null,
    countdownTimer: null,
    alertTimer: null,
    cycleCount: 1,
    totalPaid: 0,
    baseCost: 5,
    incrementRate: 0.5, // 50%
    maxCost: 50,
    graceTime: 120, // 2分钟（秒）
    remainingTime: 120,
    isAlerting: false,
    overtimeSeconds: 0,

    init() {
        this.loadHistory();
        this.bindEvents();
        // 模拟一个示例任务
        this.startMonitoring({
            name: '吃午饭',
            startupStep: '站起来',
            startTime: new Date(),
            reward: 3
        });
    },

    bindEvents() {
        const self = this;
        
        // 完成步骤按钮
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-complete')) {
                self.completeStep();
            }
            
            // AI拆分帮助
            if (e.target.classList.contains('btn-ai-help') || e.target.classList.contains('btn-ai-split')) {
                self.aiSplitStep();
            }
            
            // 支付金币重置
            if (e.target.classList.contains('btn-pay-reset')) {
                self.payAndReset();
            }
            
            // 查看历史
            if (e.target.classList.contains('btn-history')) {
                self.showHistory();
            }
            
            // 设置折叠
            if (e.target.closest('#procrastinationPanel') && e.target.id === 'settingsToggle') {
                self.toggleSettings();
            }
            
            // 历史展开
            if (e.target.classList.contains('history-expand-btn')) {
                e.target.textContent = e.target.textContent.includes('▼') ? '详情 ▲' : '详情 ▼';
            }
        });
        
        // 设置滑块
        const panel = document.getElementById('procrastinationPanel');
        if (panel) {
            const slider = panel.querySelector('.setting-slider');
            if (slider) {
                slider.addEventListener('input', function(e) {
                    const value = e.target.value;
                    const valueSpan = e.target.nextElementSibling;
                    if (valueSpan) {
                        valueSpan.textContent = value + '分钟';
                    }
                    self.graceTime = value * 60;
                });
            }
        }
    },

    startMonitoring(task) {
        this.currentTask = task;
        this.cycleCount = 1;
        this.totalPaid = 0;
        this.remainingTime = this.graceTime;
        this.isAlerting = false;
        this.overtimeSeconds = 0;
        
        this.updateTaskCard();
        this.startCountdown();
        this.playStartSound();
    },

    startCountdown() {
        const self = this;
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        
        this.countdownTimer = setInterval(function() {
            self.remainingTime--;
            self.updateCountdownDisplay();
            
            // 最后10秒变红
            if (self.remainingTime <= 10 && self.remainingTime > 0) {
                self.playTickSound();
            }
            
            // 时间到，触发警报
            if (self.remainingTime <= 0 && !self.isAlerting) {
                self.triggerAlert();
            }
            
            // 警报中，累计超时
            if (self.isAlerting) {
                self.overtimeSeconds++;
                self.updateAlertMessage();
            }
        }, 1000);
    },

    updateTaskCard() {
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const taskCard = panel.querySelector('.current-task-card');
        if (!taskCard) return;
        
        // 更新任务名称
        const taskName = taskCard.querySelector('.task-name');
        if (taskName) taskName.textContent = `【${this.currentTask.name}】`;
        
        // 更新启动步骤
        const stepContent = taskCard.querySelector('.step-content');
        if (stepContent) stepContent.textContent = `【${this.currentTask.startupStep}】`;
        
        // 更新循环信息
        const cycleInfo = taskCard.querySelector('.cycle-info');
        if (cycleInfo) {
            cycleInfo.innerHTML = `
                <span>第<strong>${this.cycleCount}</strong>次循环</span>
                <span class="divider">|</span>
                <span>已支付：<strong class="coin-text">${this.totalPaid}</strong>金币</span>
            `;
        }
    },

    updateCountdownDisplay() {
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const timeDisplay = panel.querySelector('.countdown-time');
        const progressBar = panel.querySelector('.countdown-progress-bar');
        
        if (timeDisplay) {
            const minutes = Math.floor(Math.abs(this.remainingTime) / 60);
            const seconds = Math.abs(this.remainingTime) % 60;
            const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            if (this.remainingTime < 0) {
                timeDisplay.textContent = '-' + timeStr;
                timeDisplay.style.color = '#E74C3C';
            } else {
                timeDisplay.textContent = timeStr;
                timeDisplay.style.color = this.remainingTime <= 10 ? '#E74C3C' : '#27AE60';
            }
        }
        
        if (progressBar) {
            const percentage = Math.max(0, (this.remainingTime / this.graceTime) * 100);
            progressBar.style.width = percentage + '%';
        }
    },

    triggerAlert() {
        this.isAlerting = true;
        this.overtimeSeconds = 0;
        
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        // 隐藏正常卡片，显示警报卡片
        const taskCard = panel.querySelector('.current-task-card');
        const alertCard = panel.querySelector('.alert-card');
        
        if (taskCard) taskCard.style.display = 'none';
        if (alertCard) {
            alertCard.style.display = 'block';
            this.updateAlertCost();
        }
        
        // 播放警报音
        this.playAlertSound();
        
        // 循环播放警告语音
        this.startAlertLoop();
    },

    updateAlertMessage() {
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const alertMessage = panel.querySelector('.alert-message p');
        if (alertMessage) {
            const minutes = Math.floor(this.overtimeSeconds / 60);
            const seconds = this.overtimeSeconds % 60;
            let timeStr = '';
            if (minutes > 0) {
                timeStr = `${minutes}分${seconds}秒`;
            } else {
                timeStr = `${seconds}秒`;
            }
            alertMessage.textContent = `"已超时${timeStr}！请立即完成【${this.currentTask.startupStep}】！"`;
        }
    },

    updateAlertCost() {
        const cost = this.calculateCost();
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const costValue = panel.querySelector('.alert-cost .cost-value strong');
        if (costValue) costValue.textContent = cost;
        
        const payBtn = panel.querySelector('.btn-pay-reset');
        if (payBtn) payBtn.textContent = `🪙 支付${cost}金币重置计时`;
    },

    calculateCost() {
        let cost = this.baseCost * Math.pow(1 + this.incrementRate, this.cycleCount - 1);
        return Math.min(Math.round(cost), this.maxCost);
    },

    completeStep() {
        if (this.isAlerting) {
            // 延迟完成
            this.recordHistory('延迟完成', this.graceTime + this.overtimeSeconds, 0, this.currentTask.reward);
            this.showToast('✅ 任务完成！获得' + this.currentTask.reward + '金币', 'success');
            this.addCoins(this.currentTask.reward);
        } else {
            // 成功启动
            const elapsed = this.graceTime - this.remainingTime;
            this.recordHistory('成功启动', elapsed, 0, this.currentTask.reward);
            this.showToast('🎉 成功启动！获得' + this.currentTask.reward + '金币', 'success');
            this.addCoins(this.currentTask.reward);
        }
        
        this.stopMonitoring();
    },

    payAndReset() {
        const cost = this.calculateCost();
        const currentCoins = this.getCoins();
        
        if (currentCoins < cost) {
            this.showToast('❌ 金币不足！需要' + cost + '金币', 'error');
            return;
        }
        
        // 扣除金币
        this.deductCoins(cost);
        this.totalPaid += cost;
        this.cycleCount++;
        
        // 记录本次循环
        this.recordHistory(`第${this.cycleCount - 1}次循环`, this.graceTime + this.overtimeSeconds, cost, 0);
        
        // 重置计时
        this.remainingTime = this.graceTime;
        this.isAlerting = false;
        this.overtimeSeconds = 0;
        
        // 显示正常卡片
        const panel = document.getElementById('procrastinationPanel');
        if (panel) {
            const taskCard = panel.querySelector('.current-task-card');
            const alertCard = panel.querySelector('.alert-card');
            if (taskCard) taskCard.style.display = 'block';
            if (alertCard) alertCard.style.display = 'none';
        }
        
        this.updateTaskCard();
        this.updateAlertCost();
        this.showToast(`💰 已支付${cost}金币，计时重置`, 'warning');
        this.playPaySound();
    },

    aiSplitStep() {
        this.showToast('🤖 AI正在拆解步骤...', 'info');
        
        // 模拟AI拆解
        setTimeout(() => {
            const steps = [
                '1. 放下手机',
                '2. 双手撑住椅子扶手',
                '3. 用力站起来'
            ];
            
            this.showToast('✨ AI已拆解为3个微步骤：\n' + steps.join('\n'), 'success');
        }, 1500);
    },

    stopMonitoring() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        if (this.alertTimer) {
            clearInterval(this.alertTimer);
            this.alertTimer = null;
        }
        
        this.currentTask = null;
        this.isAlerting = false;
        
        // 重置显示
        const panel = document.getElementById('procrastinationPanel');
        if (panel) {
            const taskCard = panel.querySelector('.current-task-card');
            const alertCard = panel.querySelector('.alert-card');
            if (taskCard) taskCard.style.display = 'none';
            if (alertCard) alertCard.style.display = 'none';
        }
    },

    recordHistory(status, duration, cost, reward) {
        const history = this.getHistory();
        const now = new Date();
        
        history.unshift({
            time: now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            taskName: this.currentTask.name,
            status: status,
            duration: this.formatDuration(duration),
            cost: cost,
            reward: reward,
            cycles: this.cycleCount,
            totalCost: this.totalPaid + cost
        });
        
        // 只保留最近10条
        if (history.length > 10) history.length = 10;
        
        localStorage.setItem('procrastination_history', JSON.stringify(history));
        this.loadHistory();
    },

    loadHistory() {
        const history = this.getHistory();
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const timeline = panel.querySelector('.history-timeline');
        if (!timeline) return;
        
        if (history.length === 0) {
            timeline.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无历史记录</div>';
            return;
        }
        
        timeline.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-time">${item.time}</div>
                <div class="history-content">
                    <div class="history-task-name">【${item.taskName}】</div>
                    <div class="history-details">
                        <span class="history-status ${item.cost > 0 ? 'status-paid' : 'status-success'}">${item.status}</span>
                        <span class="history-stat">耗时：${item.duration}</span>
                        ${item.cost > 0 ? `<span class="history-stat cost">成本：${item.cost}金币</span>` : ''}
                        ${item.reward > 0 ? `<span class="history-stat reward">获得：${item.reward}金币</span>` : ''}
                    </div>
                    <button class="history-expand-btn">详情 ▼</button>
                </div>
            </div>
        `).join('');
    },

    getHistory() {
        const data = localStorage.getItem('procrastination_history');
        return data ? JSON.parse(data) : [];
    },

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes > 0) {
            return `${minutes}分${secs}秒`;
        }
        return `${secs}秒`;
    },

    toggleSettings() {
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const section = panel.querySelector('.settings-section');
        if (section) {
            section.classList.toggle('collapsed');
        }
    },

    showHistory() {
        this.showToast('📊 历史成本统计：总计' + this.totalPaid + '金币', 'info');
    },

    // 音效系统
    playStartSound() {
        console.log('🎵 播放启动音效');
    },

    playTickSound() {
        console.log('⏰ 滴答声');
    },

    playAlertSound() {
        console.log('🚨 播放警报音');
    },

    playPaySound() {
        console.log('💰 播放金币音效');
    },

    startAlertLoop() {
        const self = this;
        if (this.alertTimer) clearInterval(this.alertTimer);
        
        this.alertTimer = setInterval(function() {
            if (self.isAlerting) {
                console.log('🔊 循环播放警告语音');
            }
        }, 10000); // 每10秒播放一次
    },

    // 金币系统集成
    getCoins() {
        const coinAmount = document.getElementById('coinAmount');
        return coinAmount ? parseInt(coinAmount.textContent) : 0;
    },

    addCoins(amount) {
        const coinAmount = document.getElementById('coinAmount');
        if (coinAmount) {
            const current = parseInt(coinAmount.textContent);
            coinAmount.textContent = current + amount;
            this.animateCoin(amount);
        }
    },

    deductCoins(amount) {
        const coinAmount = document.getElementById('coinAmount');
        if (coinAmount) {
            const current = parseInt(coinAmount.textContent);
            coinAmount.textContent = Math.max(0, current - amount);
            this.animateCoin(-amount);
        }
    },

    animateCoin(amount) {
        console.log(`💫 金币动画: ${amount > 0 ? '+' : ''}${amount}`);
        
        // 创建金币飞行动画
        const panel = document.getElementById('procrastinationPanel');
        if (!panel) return;
        
        const rect = panel.getBoundingClientRect();
        const coinDisplay = document.getElementById('coinAmount');
        if (!coinDisplay) return;
        
        const targetRect = coinDisplay.getBoundingClientRect();
        
        // 创建多个金币
        const coinCount = Math.min(Math.abs(amount), 5);
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.textContent = '🪙';
                coin.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width / 2}px;
                    top: ${rect.top + rect.height / 2}px;
                    font-size: 24px;
                    z-index: 10001;
                    pointer-events: none;
                    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                `;
                document.body.appendChild(coin);
                
                setTimeout(() => {
                    coin.style.left = targetRect.left + 'px';
                    coin.style.top = targetRect.top + 'px';
                    coin.style.opacity = '0';
                    coin.style.transform = 'scale(0.5)';
                }, 50);
                
                setTimeout(() => coin.remove(), 900);
            }, i * 100);
        }
        
        // 金币数字跳动
        if (coinDisplay) {
            coinDisplay.style.transform = 'scale(1.3)';
            coinDisplay.style.color = amount > 0 ? '#27AE60' : '#E74C3C';
            setTimeout(() => {
                coinDisplay.style.transform = 'scale(1)';
                coinDisplay.style.color = '';
            }, 300);
        }
    },

    showToast(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        const toast = document.createElement('div');
        toast.className = 'custom-toast toast-' + type;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background: ${type === 'success' ? 'linear-gradient(135deg, #27AE60, #2ECC71)' : 
                         type === 'error' ? 'linear-gradient(135deg, #E74C3C, #EC7063)' : 
                         type === 'warning' ? 'linear-gradient(135deg, #F39C12, #F1C40F)' : 
                         'linear-gradient(135deg, #4A90E2, #5DADE2)'};
            color: white;
            padding: 14px 28px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            z-index: 10000;
            font-size: 14px;
            font-weight: 600;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            max-width: 400px;
            text-align: center;
        `;
        
        // 添加图标
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        toast.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${message}`;
        
        document.body.appendChild(toast);
        
        // 触发动画
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// 导出
window.ProcrastinationPanel = ProcrastinationPanel;

