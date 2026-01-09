// 价值显化器模块 - 将努力实时变成看得见的钱
const ValueVisualizer = {
    // 状态
    todayEarned: 0,              // 今日已赚
    totalEarned: 0,              // 总计已赚
    pendingTasks: [],            // 待完成任务（带价值）
    completedToday: [],          // 今日已完成
    incomeStreams: {},           // 收入流分类
    
    // 财务数据
    finance: {
        debt: 0,                 // 欠款
        monthlyExpense: 0,       // 月固定支出
        monthlyTarget: 0,        // 月收入目标
        dailyTarget: 0,          // 日目标（AI计算）
        daysRemaining: 0,        // 本月剩余天数
        totalRequired: 0         // 本月还需赚
    },
    
    // 设置
    settings: {
        initialized: false,      // 是否已初始化设置
        currency: '¥',           // 货币符号
        soundEnabled: true,      // 收入音效
        autoPrice: true,         // AI自动定价
        showLossWarning: true    // 显示损失警告
    },
    
    // 价格参考库（AI学习用）
    priceReference: {
        '插画': { min: 200, max: 2000, avgHourly: 150 },
        '修图': { min: 30, max: 100, avgHourly: 80 },
        '拍照': { min: 500, max: 5000, avgHourly: 300 },
        '设计': { min: 300, max: 3000, avgHourly: 200 },
        '写作': { min: 100, max: 1000, avgHourly: 100 },
        '视频': { min: 500, max: 5000, avgHourly: 250 },
        '小红书': { min: 50, max: 500, avgHourly: 80 },
        '咨询': { min: 200, max: 1000, avgHourly: 300 },
        '默认': { min: 50, max: 500, avgHourly: 100 }
    },
    
    // 初始化
    init() {
        // 加载保存的数据
        this.loadData();
        
        // 计算今日目标
        this.calculateDailyTarget();
        
        // 标记为已初始化（不再显示设置弹窗）
        if (!this.settings.initialized) {
            this.settings.initialized = true;
            this.saveSettings();
        }
    },
    
    // 加载数据
    loadData() {
        const savedFinance = Storage.load('adhd_value_finance', null);
        if (savedFinance) {
            Object.assign(this.finance, savedFinance);
        }
        
        const savedSettings = Storage.load('adhd_value_settings', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
        
        // 加载今日数据
        const today = this.formatDate(new Date());
        const savedToday = Storage.load('adhd_value_today', {});
        if (savedToday.date === today) {
            this.todayEarned = savedToday.earned || 0;
            this.completedToday = savedToday.completed || [];
        } else {
            // 新的一天，重置
            this.todayEarned = 0;
            this.completedToday = [];
            this.saveTodayData();
        }
        
        this.totalEarned = Storage.load('adhd_value_total', 0);
        this.incomeStreams = Storage.load('adhd_value_streams', {});
        this.priceReference = Storage.load('adhd_value_prices', this.priceReference);
    },
    
    // 保存今日数据
    saveTodayData() {
        Storage.save('adhd_value_today', {
            date: this.formatDate(new Date()),
            earned: this.todayEarned,
            completed: this.completedToday
        });
    },
    
    // 保存财务数据
    saveFinance() {
        Storage.save('adhd_value_finance', this.finance);
    },
    
    // 保存设置
    saveSettings() {
        Storage.save('adhd_value_settings', this.settings);
    },
    
    // 计算每日目标
    calculateDailyTarget() {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        this.finance.daysRemaining = lastDay - currentDay + 1;
        
        // 本月还需赚 = 欠款 + 月支出 + 目标 - 已赚
        const monthEarned = this.getMonthEarned();
        this.finance.totalRequired = Math.max(0, 
            this.finance.debt + this.finance.monthlyExpense - monthEarned
        );
        
        // 日目标 = 还需赚 / 剩余天数
        this.finance.dailyTarget = this.finance.daysRemaining > 0 ? 
            Math.ceil(this.finance.totalRequired / this.finance.daysRemaining) : 0;
    },
    
    // 获取本月已赚
    getMonthEarned() {
        const now = new Date();
        const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);
        const monthData = Storage.load('adhd_value_month_' + monthKey, { earned: 0 });
        return monthData.earned;
    },
    
    // 更新本月已赚
    updateMonthEarned(amount) {
        const now = new Date();
        const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);
        const monthData = Storage.load('adhd_value_month_' + monthKey, { earned: 0 });
        monthData.earned += amount;
        Storage.save('adhd_value_month_' + monthKey, monthData);
    },
    
    // AI估算任务价值
    estimateTaskValue(task) {
        if (!task) return 0;
        
        const title = task.title || '';
        const duration = task.duration || 60; // 默认60分钟
        
        // 匹配任务类型
        let matchedType = '默认';
        let maxMatch = 0;
        
        for (const type in this.priceReference) {
            if (type !== '默认' && title.includes(type)) {
                if (type.length > maxMatch) {
                    matchedType = type;
                    maxMatch = type.length;
                }
            }
        }
        
        // 关键词匹配
        const keywords = {
            '插画': ['插画', '画', '绘', '手绘', 'illustration'],
            '修图': ['修图', 'P图', '精修', '调色', '后期'],
            '拍照': ['拍照', '拍摄', '摄影', '样片', '写真', '婚纱'],
            '设计': ['设计', 'logo', '海报', '排版', 'UI'],
            '写作': ['写', '文案', '文章', '稿', '文字'],
            '视频': ['视频', '剪辑', '拍摄', 'vlog'],
            '小红书': ['小红书', '笔记', '种草', '推广'],
            '咨询': ['咨询', '指导', '培训', '教学']
        };
        
        for (const type in keywords) {
            for (const kw of keywords[type]) {
                if (title.toLowerCase().includes(kw.toLowerCase())) {
                    matchedType = type;
                    break;
                }
            }
        }
        
        const ref = this.priceReference[matchedType];
        
        // 根据时长估算价值
        const hourlyRate = ref.avgHourly;
        const estimatedValue = Math.round((duration / 60) * hourlyRate);
        
        // 限制在合理范围内
        return Math.max(ref.min, Math.min(ref.max, estimatedValue));
    },
    
    // AI拆解任务价值
    breakdownTaskValue(task, totalValue, substeps) {
        if (!substeps || substeps.length === 0) return [];
        
        // 根据步骤复杂度分配价值
        const totalDuration = substeps.reduce((sum, s) => sum + (s.duration || 10), 0);
        
        return substeps.map(step => {
            const stepDuration = step.duration || 10;
            const stepValue = Math.round((stepDuration / totalDuration) * totalValue);
            return {
                ...step,
                value: stepValue
            };
        });
    },
    
    // 完成步骤，获得收入
    earnFromStep(task, stepIndex, stepValue) {
        if (!stepValue || stepValue <= 0) return;
        
        // 更新今日收入
        this.todayEarned += stepValue;
        this.totalEarned += stepValue;
        
        // 记录完成
        this.completedToday.push({
            taskId: task.id,
            taskTitle: task.title,
            stepIndex: stepIndex,
            value: stepValue,
            time: new Date().toISOString()
        });
        
        // 更新收入流
        const stream = this.detectIncomeStream(task.title);
        if (!this.incomeStreams[stream]) {
            this.incomeStreams[stream] = { total: 0, count: 0 };
        }
        this.incomeStreams[stream].total += stepValue;
        this.incomeStreams[stream].count++;
        
        // 保存数据
        this.saveTodayData();
        Storage.save('adhd_value_total', this.totalEarned);
        Storage.save('adhd_value_streams', this.incomeStreams);
        this.updateMonthEarned(stepValue);
        
        // 重新计算日目标
        this.calculateDailyTarget();
        
        // 播放即时价值冲击动画（大金额时显示大动画）
        if (stepValue >= 100 && typeof ValueImpact !== 'undefined') {
            ValueImpact.showBigEarnAnimation(stepValue, task.title);
        } else {
            // 小金额显示普通动画
            this.playEarnEffect(stepValue);
        }
        
        // 更新界面
        if (typeof App !== 'undefined') {
            App.loadValuePanel();
            
            // 计算对应金币
            const earnedCoins = Math.round(stepValue / 10); // 10元=1金币
            
            App.addChatMessage("system", 
                "💰 叮咚！收入 +" + this.settings.currency + stepValue + "！\n" +
                "🪙 获得 " + earnedCoins + " 金币\n" +
                "今日已赚：" + this.settings.currency + this.todayEarned + "\n" +
                (this.todayEarned >= this.finance.dailyTarget ? 
                    "🎉 今日目标已达成！" : 
                    "距今日目标还差：" + this.settings.currency + (this.finance.dailyTarget - this.todayEarned)),
                "💰"
            );
            
            // 同步增加游戏金币
            const gameState = Storage.getGameState();
            gameState.coins = (gameState.coins || 0) + earnedCoins;
            Storage.saveGameState(gameState);
            App.updateGameStatus();
        }
        
        // 检查是否可以兑换奖励
        this.checkRewardAvailability();
    },
    
    // 检查奖励可用性
    checkRewardAvailability() {
        if (typeof RewardSystem === 'undefined') return;
        
        const upcoming = RewardSystem.getUpcomingRewards();
        if (upcoming.length > 0) {
            const nearest = upcoming[0];
            if (nearest.progress >= 90) {
                // 即将可以兑换，显示提示
                if (typeof Settings !== 'undefined') {
                    Settings.showToast('info', '🎁 即将解锁奖励', 
                        `再赚 ${nearest.coinsNeeded} 金币就能兑换【${nearest.name}】啦！`);
                }
            }
        }
    },
    
    // 格式化双重价值（金币+人民币）
    formatDualValue(moneyValue) {
        const coins = Math.round(moneyValue / 10);
        return {
            money: moneyValue,
            coins: coins,
            html: `<div class="event-dual-value">
                <span class="coins">🪙 ${coins}</span>
                <span class="separator">≈</span>
                <span class="money">¥${moneyValue}</span>
            </div>`
        };
    },
    
    // 检测收入流类型
    detectIncomeStream(title) {
        const streams = {
            '照相馆': ['拍照', '拍摄', '摄影', '样片', '写真', '婚纱', '证件照'],
            '插画': ['插画', '画', '绘', '手绘'],
            '设计': ['设计', 'logo', '海报', 'UI'],
            '小红书': ['小红书', '笔记', '种草'],
            '视频': ['视频', '剪辑', 'vlog'],
            '写作': ['写', '文案', '文章'],
            '其他': []
        };
        
        for (const stream in streams) {
            for (const kw of streams[stream]) {
                if (title.includes(kw)) return stream;
            }
        }
        return '其他';
    },
    
    // 播放收入效果
    playEarnEffect(amount) {
        // 播放音效
        if (this.settings.soundEnabled) {
            this.playSound('earn');
        }
        
        // 显示金额飘动动画
        this.showEarnAnimation(amount);
    },
    
    // 播放音效
    playSound(type) {
        // 使用Web Audio API创建简单音效
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'earn') {
                // 收入音效：上升音调
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // 音频不可用，静默失败
        }
    },
    
    // 显示收入动画
    showEarnAnimation(amount) {
        const container = document.getElementById('coinAnimationContainer');
        if (!container) return;
        
        const anim = document.createElement('div');
        anim.className = 'earn-animation';
        anim.innerHTML = '+' + this.settings.currency + amount;
        anim.style.left = (window.innerWidth / 2 - 50) + 'px';
        anim.style.top = (window.innerHeight / 2) + 'px';
        
        container.appendChild(anim);
        
        setTimeout(() => anim.remove(), 1500);
    },
    
    // 获取AI赚钱排行榜
    getEarningRanking() {
        const tasks = Storage.getTasks();
        const today = this.formatDate(new Date());
        
        // 筛选今天和未来的未完成任务
        const pendingTasks = tasks.filter(t => {
            return !t.completed && t.date >= today;
        });
        
        // 为每个任务计算价值和优先级
        const rankedTasks = pendingTasks.map(task => {
            const value = task.value || this.estimateTaskValue(task);
            const duration = task.duration || 60;
            const hourlyRate = (value / duration) * 60;
            
            // 计算紧急度（截止日期越近越紧急）
            const daysUntilDue = this.getDaysUntil(task.date);
            const urgency = daysUntilDue <= 0 ? 100 : Math.max(0, 100 - daysUntilDue * 10);
            
            // 综合评分 = 时薪 * 0.4 + 紧急度 * 0.4 + 价值 * 0.2
            const score = (hourlyRate / 10) * 0.4 + urgency * 0.4 + (value / 100) * 0.2;
            
            return {
                ...task,
                value: value,
                hourlyRate: Math.round(hourlyRate),
                urgency: urgency,
                score: score,
                daysUntilDue: daysUntilDue
            };
        });
        
        // 按评分排序
        rankedTasks.sort((a, b) => b.score - a.score);
        
        return rankedTasks.slice(0, 5);
    },
    
    // 计算距离某日期的天数
    getDaysUntil(dateStr) {
        const target = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    },
    
    // 计算拖延损失
    calculateProcrastinationLoss(task) {
        if (!task) return 0;
        const value = task.value || this.estimateTaskValue(task);
        const duration = task.duration || 60;
        // 每小时损失 = 任务价值 / 预计时长(小时)
        return Math.round(value / (duration / 60));
    },
    
    // 计算低效率损失
    calculateInefficiencyLoss(task) {
        if (!task) return 0;
        const value = task.value || this.estimateTaskValue(task);
        const duration = task.duration || 60;
        // 每分钟损失
        return Math.round(value / duration);
    },
    
    // 显示设置弹窗
    showSetupModal() {
        // 先加载已保存的数据
        this.loadData();
        
        // 移除已存在的弹窗
        const existingModal = document.getElementById('valueSetupModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'value-setup-modal';
        modal.id = 'valueSetupModal';
        modal.innerHTML = `
            <div class="value-setup-content">
                <div class="setup-header">
                    <span class="setup-icon">💰</span>
                    <h2>设置你的财务目标</h2>
                    <p>${this.settings.initialized ? '修改你的财务设置' : '只需设置一次，AI会每天帮你计算'}</p>
                </div>
                <div class="setup-body">
                    <div class="setup-group">
                        <label>💳 当前欠款（信用卡、花呗等）</label>
                        <div class="setup-input-row">
                            <span class="currency">¥</span>
                            <input type="number" id="setupDebt" value="${this.finance.debt || 0}" placeholder="0" inputmode="decimal">
                        </div>
                    </div>
                    <div class="setup-group">
                        <label>🏠 每月固定支出（房租、生活费等）</label>
                        <div class="setup-input-row">
                            <span class="currency">¥</span>
                            <input type="number" id="setupExpense" value="${this.finance.monthlyExpense || 0}" placeholder="0" inputmode="decimal">
                        </div>
                    </div>
                    <div class="setup-group">
                        <label>🎯 每月收入目标（可选）</label>
                        <div class="setup-input-row">
                            <span class="currency">¥</span>
                            <input type="number" id="setupTarget" value="${this.finance.monthlyTarget || 0}" placeholder="0" inputmode="decimal">
                        </div>
                    </div>
                </div>
                <div class="setup-footer">
                    <button class="setup-btn skip" type="button" id="valueSetupCancelBtn">取消</button>
                    <button class="setup-btn confirm" type="button" id="valueSetupConfirmBtn">${this.settings.initialized ? '保存修改' : '开始赚钱！'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const self = this;
        
        // 取消按钮事件
        const cancelBtn = document.getElementById('valueSetupCancelBtn');
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.closeSetupModal();
        });
        cancelBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.closeSetupModal();
        }, { passive: false });
        
        // 确认按钮事件
        const confirmBtn = document.getElementById('valueSetupConfirmBtn');
        confirmBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.saveSetup();
        });
        confirmBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.saveSetup();
        }, { passive: false });
        
        // 让弹窗内容可以滚动
        const content = modal.querySelector('.value-setup-content');
        content.addEventListener('touchstart', function(e) {
            // 允许触摸
        }, { passive: true });
        content.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        // 点击遮罩关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                self.closeSetupModal();
            }
        });
        
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    // 关闭设置弹窗
    closeSetupModal() {
        const modal = document.getElementById('valueSetupModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },
    
    // 保存设置
    saveSetup() {
        const debt = parseFloat(document.getElementById('setupDebt').value) || 0;
        const expense = parseFloat(document.getElementById('setupExpense').value) || 0;
        const target = parseFloat(document.getElementById('setupTarget').value) || 0;
        
        this.finance.debt = debt;
        this.finance.monthlyExpense = expense;
        this.finance.monthlyTarget = target;
        
        this.settings.initialized = true;
        
        this.saveFinance();
        this.saveSettings();
        this.calculateDailyTarget();
        
        this.closeSetupModal();
        
        if (typeof App !== 'undefined') {
            App.loadValuePanel();
            App.addChatMessage("system", 
                "💰 财务目标已设置！\n" +
                "欠款：¥" + debt + "\n" +
                "月支出：¥" + expense + "\n" +
                "今日目标：¥" + this.finance.dailyTarget + "\n\n" +
                "开始赚钱吧！每完成一个任务步骤，都能看到收入增加！",
                "🎯"
            );
        }
    },
    
    // 更新财务设置
    updateFinance(key, value) {
        this.finance[key] = parseFloat(value) || 0;
        this.saveFinance();
        this.calculateDailyTarget();
        
        if (typeof App !== 'undefined') {
            App.loadValuePanel();
        }
    },
    
    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + "-" + 
               (d.getMonth() + 1).toString().padStart(2, "0") + "-" + 
               d.getDate().toString().padStart(2, "0");
    },
    
    // 格式化金额
    formatMoney(amount) {
        return this.settings.currency + amount.toLocaleString();
    },
    
    // 获取今日进度百分比
    getTodayProgress() {
        if (this.finance.dailyTarget <= 0) return 100;
        return Math.min(100, Math.round((this.todayEarned / this.finance.dailyTarget) * 100));
    },
    
    // 获取收入流统计
    getStreamStats() {
        const streams = [];
        for (const name in this.incomeStreams) {
            streams.push({
                name: name,
                total: this.incomeStreams[name].total,
                count: this.incomeStreams[name].count
            });
        }
        streams.sort((a, b) => b.total - a.total);
        return streams;
    }
};

// 导出
window.ValueVisualizer = ValueVisualizer;

