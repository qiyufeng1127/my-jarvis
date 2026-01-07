// 低效率面板管理系统
const InefficiencyPanel = {
    currentTask: null,
    monitoringTimer: null,
    checkInterval: 30, // 30秒检查一次
    inefficiencyThreshold: 3, // 连续3次低效触发警告
    inefficiencyCount: 0,
    totalInefficiencyTime: 0,
    currentScore: 100,
    penalties: [],
    isMonitoring: false,
    lastCheckTime: null,
    sessionStartTime: null,

    init() {
        this.loadHistory();
        this.bindEvents();
        // 添加示例任务
        this.addExampleTasks();
    },

    bindEvents() {
        const self = this;
        
        document.addEventListener('click', function(e) {
            // 开始监控
            if (e.target.classList.contains('btn-start-monitor')) {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    const taskName = taskItem.querySelector('.task-name').textContent;
                    const taskTime = taskItem.querySelector('.task-time').textContent;
                    self.startMonitoring({
                        name: taskName,
                        estimatedTime: taskTime,
                        startTime: new Date()
                    });
                }
            }
            
            // 停止监控
            if (e.target.classList.contains('btn-stop-monitor')) {
                self.stopMonitoring(true);
            }
            
            // 暂停监控
            if (e.target.classList.contains('btn-pause-monitor')) {
                self.pauseMonitoring();
            }
            
            // 恢复监控
            if (e.target.classList.contains('btn-resume-monitor')) {
                self.resumeMonitoring();
            }
            
            // 支付金币消除惩罚
            if (e.target.classList.contains('btn-pay-penalty')) {
                const penaltyItem = e.target.closest('.penalty-item');
                if (penaltyItem) {
                    const index = Array.from(penaltyItem.parentElement.children).indexOf(penaltyItem);
                    self.payPenalty(index);
                }
            }
            
            // 查看详细报告
            if (e.target.classList.contains('btn-view-report')) {
                self.showDetailedReport();
            }
            
            // 设置折叠
            if (e.target.closest('#inefficiencyPanel') && e.target.classList.contains('settings-toggle')) {
                self.toggleSettings();
            }
        });
        
        // 设置滑块
        const panel = document.getElementById('inefficiencyPanel');
        if (panel) {
            const slider = panel.querySelector('.setting-slider');
            if (slider) {
                slider.addEventListener('input', function(e) {
                    const value = e.target.value;
                    const valueSpan = e.target.nextElementSibling;
                    if (valueSpan) {
                        valueSpan.textContent = value + '秒';
                    }
                    self.checkInterval = parseInt(value);
                });
            }
        }
    },

    addExampleTasks() {
        const tasks = [
            { name: '写项目文档', time: '45分钟', priority: 'high' },
            { name: '回复邮件', time: '20分钟', priority: 'medium' },
            { name: '代码review', time: '30分钟', priority: 'high' }
        ];
        
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const taskList = panel.querySelector('.task-list');
        if (!taskList) return;
        
        taskList.innerHTML = tasks.map(task => `
            <div class="task-item" data-priority="${task.priority}">
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-meta">
                        <span class="task-time">⏱ ${task.time}</span>
                        <span class="task-priority priority-${task.priority}">
                            ${task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                    </div>
                </div>
                <button class="btn-start-monitor">开始监控</button>
            </div>
        `).join('');
    },

    startMonitoring(task) {
        this.currentTask = task;
        this.isMonitoring = true;
        this.inefficiencyCount = 0;
        this.currentScore = 100;
        this.penalties = [];
        this.sessionStartTime = new Date();
        this.lastCheckTime = new Date();
        
        this.updateMonitoringCard();
        this.startChecking();
        this.showToast('🎯 开始监控任务：' + task.name, 'info');
        this.playStartSound();
    },

    startChecking() {
        const self = this;
        if (this.monitoringTimer) clearInterval(this.monitoringTimer);
        
        this.monitoringTimer = setInterval(function() {
            if (self.isMonitoring) {
                self.performCheck();
            }
        }, this.checkInterval * 1000);
    },

    performCheck() {
        // 模拟检测（实际应该检测窗口焦点、鼠标活动等）
        const isEfficient = Math.random() > 0.3; // 70%概率高效
        
        this.lastCheckTime = new Date();
        this.updateElapsedTime();
        
        if (!isEfficient) {
            this.inefficiencyCount++;
            this.totalInefficiencyTime += this.checkInterval;
            
            // 扣分
            const penalty = 5;
            this.currentScore = Math.max(0, this.currentScore - penalty);
            
            this.showToast('⚠️ 检测到低效行为！-' + penalty + '分', 'warning');
            this.playWarningSound();
            
            // 连续低效触发惩罚
            if (this.inefficiencyCount >= this.inefficiencyThreshold) {
                this.triggerPenalty();
                this.inefficiencyCount = 0;
            }
        } else {
            // 重置连续计数
            if (this.inefficiencyCount > 0) {
                this.inefficiencyCount = Math.max(0, this.inefficiencyCount - 1);
            }
        }
        
        this.updateMonitoringCard();
        this.updateScoreDisplay();
    },

    triggerPenalty() {
        const penaltyCost = 10 + this.penalties.length * 5; // 递增惩罚
        const penaltyTime = new Date();
        
        this.penalties.push({
            time: penaltyTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            reason: '连续低效行为',
            cost: penaltyCost,
            paid: false
        });
        
        this.updatePenaltyList();
        this.showToast('🚨 触发惩罚！需支付' + penaltyCost + '金币', 'error');
        this.playPenaltySound();
    },

    updateMonitoringCard() {
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const monitorCard = panel.querySelector('.monitoring-card');
        if (!monitorCard) return;
        
        // 显示监控卡片
        monitorCard.style.display = 'block';
        
        // 更新任务名称
        const taskName = monitorCard.querySelector('.monitoring-task-name');
        if (taskName) taskName.textContent = `【${this.currentTask.name}】`;
        
        // 更新状态
        const status = monitorCard.querySelector('.monitoring-status');
        if (status) {
            status.textContent = this.isMonitoring ? '监控中' : '已暂停';
            status.className = 'monitoring-status ' + (this.isMonitoring ? 'status-active' : 'status-paused');
        }
        
        // 更新统计
        this.updateElapsedTime();
    },

    updateElapsedTime() {
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const elapsed = Math.floor((new Date() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeValue = panel.querySelector('.stat-item:nth-child(1) .stat-value');
        if (timeValue) {
            timeValue.textContent = `${minutes}分${seconds}秒`;
        }
        
        const inefficiencyValue = panel.querySelector('.stat-item:nth-child(2) .stat-value');
        if (inefficiencyValue) {
            inefficiencyValue.textContent = `${this.totalInefficiencyTime}秒`;
        }
        
        const efficiencyRate = elapsed > 0 ? Math.round((1 - this.totalInefficiencyTime / elapsed) * 100) : 100;
        const rateValue = panel.querySelector('.stat-item:nth-child(3) .stat-value');
        if (rateValue) {
            rateValue.textContent = efficiencyRate + '%';
            rateValue.style.color = efficiencyRate >= 80 ? '#27AE60' : efficiencyRate >= 60 ? '#F39C12' : '#E74C3C';
        }
    },

    updateScoreDisplay() {
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const scoreValue = panel.querySelector('.score-value');
        const scoreBar = panel.querySelector('.score-bar-fill');
        
        if (scoreValue) {
            scoreValue.textContent = this.currentScore;
            
            // 根据分数改变颜色
            if (this.currentScore >= 80) {
                scoreValue.style.color = '#27AE60';
            } else if (this.currentScore >= 60) {
                scoreValue.style.color = '#F39C12';
            } else {
                scoreValue.style.color = '#E74C3C';
            }
        }
        
        if (scoreBar) {
            scoreBar.style.width = this.currentScore + '%';
            
            if (this.currentScore >= 80) {
                scoreBar.style.background = 'linear-gradient(90deg, #27AE60, #2ECC71)';
            } else if (this.currentScore >= 60) {
                scoreBar.style.background = 'linear-gradient(90deg, #F39C12, #F1C40F)';
            } else {
                scoreBar.style.background = 'linear-gradient(90deg, #E74C3C, #EC7063)';
            }
        }
    },

    updatePenaltyList() {
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const penaltyList = panel.querySelector('.penalty-list');
        if (!penaltyList) return;
        
        if (this.penalties.length === 0) {
            penaltyList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无惩罚记录</div>';
            return;
        }
        
        penaltyList.innerHTML = this.penalties.map((penalty, index) => `
            <div class="penalty-item ${penalty.paid ? 'penalty-paid' : ''}">
                <div class="penalty-info">
                    <div class="penalty-time">${penalty.time}</div>
                    <div class="penalty-reason">${penalty.reason}</div>
                    <div class="penalty-cost">💰 ${penalty.cost}金币</div>
                </div>
                ${!penalty.paid ? `<button class="btn-pay-penalty">支付消除</button>` : '<span class="penalty-status">已支付</span>'}
            </div>
        `).join('');
    },

    payPenalty(index) {
        if (index < 0 || index >= this.penalties.length) return;
        
        const penalty = this.penalties[index];
        if (penalty.paid) return;
        
        const currentCoins = this.getCoins();
        if (currentCoins < penalty.cost) {
            this.showToast('❌ 金币不足！需要' + penalty.cost + '金币', 'error');
            return;
        }
        
        // 扣除金币
        this.deductCoins(penalty.cost);
        penalty.paid = true;
        
        // 恢复部分分数
        this.currentScore = Math.min(100, this.currentScore + 10);
        
        this.updatePenaltyList();
        this.updateScoreDisplay();
        this.showToast('✅ 已支付' + penalty.cost + '金币，恢复10分', 'success');
        this.playPaySound();
    },

    stopMonitoring(completed = false) {
        if (!this.currentTask) return;
        
        this.isMonitoring = false;
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        // 记录历史
        const elapsed = Math.floor((new Date() - this.sessionStartTime) / 1000);
        const efficiencyRate = elapsed > 0 ? Math.round((1 - this.totalInefficiencyTime / elapsed) * 100) : 100;
        const unpaidPenalties = this.penalties.filter(p => !p.paid).length;
        
        this.recordHistory({
            taskName: this.currentTask.name,
            duration: elapsed,
            inefficiencyTime: this.totalInefficiencyTime,
            efficiencyRate: efficiencyRate,
            finalScore: this.currentScore,
            penalties: this.penalties.length,
            unpaidPenalties: unpaidPenalties,
            completed: completed
        });
        
        if (completed) {
            // 根据效率给予奖励
            let reward = 0;
            if (efficiencyRate >= 90) {
                reward = 20;
            } else if (efficiencyRate >= 80) {
                reward = 15;
            } else if (efficiencyRate >= 70) {
                reward = 10;
            } else if (efficiencyRate >= 60) {
                reward = 5;
            }
            
            if (reward > 0) {
                this.addCoins(reward);
                this.showToast(`🎉 任务完成！效率${efficiencyRate}%，获得${reward}金币`, 'success');
            } else {
                this.showToast(`✅ 任务完成，效率${efficiencyRate}%`, 'info');
            }
        }
        
        // 重置
        this.currentTask = null;
        this.totalInefficiencyTime = 0;
        
        const panel = document.getElementById('inefficiencyPanel');
        if (panel) {
            const monitorCard = panel.querySelector('.monitoring-card');
            if (monitorCard) monitorCard.style.display = 'none';
        }
        
        this.loadHistory();
    },

    pauseMonitoring() {
        this.isMonitoring = false;
        this.showToast('⏸ 监控已暂停', 'info');
        this.updateMonitoringCard();
    },

    resumeMonitoring() {
        this.isMonitoring = true;
        this.lastCheckTime = new Date();
        this.showToast('▶️ 监控已恢复', 'info');
        this.updateMonitoringCard();
    },

    recordHistory(data) {
        const history = this.getHistory();
        const now = new Date();
        
        history.unshift({
            time: now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            ...data
        });
        
        // 只保留最近10条
        if (history.length > 10) history.length = 10;
        
        localStorage.setItem('inefficiency_history', JSON.stringify(history));
    },

    loadHistory() {
        const history = this.getHistory();
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const historyList = panel.querySelector('.history-list');
        if (!historyList) return;
        
        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无历史记录</div>';
            return;
        }
        
        historyList.innerHTML = history.map(item => {
            const minutes = Math.floor(item.duration / 60);
            const seconds = item.duration % 60;
            const durationStr = `${minutes}分${seconds}秒`;
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-time">${item.time}</span>
                        <span class="history-status ${item.completed ? 'status-completed' : 'status-stopped'}">
                            ${item.completed ? '✅ 已完成' : '⏹ 已停止'}
                        </span>
                    </div>
                    <div class="history-task">${item.taskName}</div>
                    <div class="history-stats">
                        <span class="history-stat">⏱ ${durationStr}</span>
                        <span class="history-stat">📊 效率${item.efficiencyRate}%</span>
                        <span class="history-stat">🎯 得分${item.finalScore}</span>
                        ${item.penalties > 0 ? `<span class="history-stat penalty">⚠️ ${item.penalties}次惩罚</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    getHistory() {
        const data = localStorage.getItem('inefficiency_history');
        return data ? JSON.parse(data) : [];
    },

    showDetailedReport() {
        const history = this.getHistory();
        if (history.length === 0) {
            this.showToast('📊 暂无数据', 'info');
            return;
        }
        
        const totalTasks = history.length;
        const completedTasks = history.filter(h => h.completed).length;
        const avgEfficiency = Math.round(history.reduce((sum, h) => sum + h.efficiencyRate, 0) / totalTasks);
        const totalPenalties = history.reduce((sum, h) => sum + h.penalties, 0);
        
        this.showToast(
            `📊 效率报告\n` +
            `总任务数：${totalTasks}\n` +
            `完成率：${Math.round(completedTasks / totalTasks * 100)}%\n` +
            `平均效率：${avgEfficiency}%\n` +
            `总惩罚次数：${totalPenalties}`,
            'info'
        );
    },

    toggleSettings() {
        const panel = document.getElementById('inefficiencyPanel');
        if (!panel) return;
        
        const section = panel.querySelector('.settings-section');
        if (section) {
            section.classList.toggle('collapsed');
        }
    },

    // 音效系统
    playStartSound() {
        console.log('🎵 播放开始监控音效');
    },

    playWarningSound() {
        console.log('⚠️ 播放警告音效');
    },

    playPenaltySound() {
        console.log('🚨 播放惩罚音效');
    },

    playPaySound() {
        console.log('💰 播放支付音效');
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
        const panel = document.getElementById('inefficiencyPanel');
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
            white-space: pre-line;
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
window.InefficiencyPanel = InefficiencyPanel;

