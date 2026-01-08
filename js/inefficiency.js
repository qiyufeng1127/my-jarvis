// 低效率监控模块 - 监控任务执行过程中的卡顿情况
const InefficiencyMonitor = {
    // 状态
    monitorTimer: null,         // 监控定时器（每秒检查）
    currentTask: null,          // 当前监控的任务
    currentStepIndex: 0,        // 当前步骤索引
    elapsedSeconds: 0,          // 当前步骤已停留秒数
    isAlertActive: false,       // 是否处于警报状态
    currentCycle: 1,            // 当前循环次数
    totalPaidCoins: 0,          // 本次步骤累计支付金币
    halfwayAlertShown: false,   // 是否已显示半程提醒
    efficiencyScore: 100,       // 当前效率评分
    history: [],                // 低效率历史记录
    
    // 设置项
    settings: {
        enabled: true,              // 是否启用监控
        thresholdMinutes: 60,       // 判定时长（分钟）
        halfwayAlert: true,         // 半程提醒
        baseCost: 3,                // 基础金币成本
        costIncrement: 2.0,         // 成本递增比率（+100%）
        maxCost: 50,                // 最高成本上限
        halfwayMessage: "🤔 一切顺利吗？您已在此步骤停留{minutes}分钟了",
        alertMessage: "🚨 您在此步骤已停留{minutes}分钟，可能陷入低效循环",
        focusMusic: false,          // 专注音乐
        whiteNoise: false           // 白噪音
    },
    
    // 初始化
    init() {
        // 加载历史记录
        this.history = Storage.load('adhd_inefficiency_history', []);
        
        // 加载设置
        const savedSettings = Storage.load('adhd_inefficiency_settings', null);
        if (savedSettings) {
            Object.assign(this.settings, savedSettings);
        }
    },
    
    // 开始监控任务
    startMonitoring(task) {
        if (!task) return;
        
        this.currentTask = task;
        this.currentStepIndex = 0;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        this.halfwayAlertShown = false;
        this.efficiencyScore = 100;
        
        // 获取当前步骤
        const currentStep = this.getCurrentStep();
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🎯 开始监控任务【" + task.title + "】\n" +
                "当前步骤：【" + currentStep + "】\n" +
                "判定时长：" + this.settings.thresholdMinutes + "分钟\n" +
                "专注加油！💪", 
                "🎯"
            );
        }
        
        // 开始计时
        this.startTimer();
        
        if (typeof App !== 'undefined') {
            App.loadInefficiencyPanel();
        }
    },
    
    // 获取当前步骤名称
    getCurrentStep() {
        if (!this.currentTask) return '执行任务';
        
        if (this.currentTask.substeps && this.currentTask.substeps.length > this.currentStepIndex) {
            return this.currentTask.substeps[this.currentStepIndex].title;
        }
        return '执行任务';
    },
    
    // 开始计时器
    startTimer() {
        const self = this;
        
        // 清除之前的计时器
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
        }
        
        this.monitorTimer = setInterval(function() {
            self.elapsedSeconds++;
            
            // 更新效率评分
            self.updateEfficiencyScore();
            
            const thresholdSeconds = self.settings.thresholdMinutes * 60;
            const halfwaySeconds = thresholdSeconds / 2;
            
            // 半程提醒
            if (self.settings.halfwayAlert && !self.halfwayAlertShown && self.elapsedSeconds >= halfwaySeconds) {
                self.halfwayAlertShown = true;
                self.showHalfwayAlert();
            }
            
            // 检查是否超时
            if (self.elapsedSeconds >= thresholdSeconds && !self.isAlertActive) {
                self.isAlertActive = true;
                self.triggerAlert();
            }
            
            // 更新显示
            self.updateDisplay();
            
        }, 1000);
    },
    
    // 更新效率评分
    updateEfficiencyScore() {
        const thresholdSeconds = this.settings.thresholdMinutes * 60;
        const progress = this.elapsedSeconds / thresholdSeconds;
        
        // 效率评分随时间递减
        if (progress < 0.5) {
            this.efficiencyScore = Math.max(70, 100 - Math.floor(progress * 60));
        } else if (progress < 1) {
            this.efficiencyScore = Math.max(40, 70 - Math.floor((progress - 0.5) * 60));
        } else {
            this.efficiencyScore = Math.max(10, 40 - Math.floor((progress - 1) * 30));
        }
    },
    
    // 显示半程提醒
    showHalfwayAlert() {
        const minutes = Math.floor(this.elapsedSeconds / 60);
        var message = this.settings.halfwayMessage.replace('{minutes}', minutes);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", message, "🤔");
        }
    },
    
    // 触发低效率警报
    triggerAlert() {
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const currentStep = this.getCurrentStep();
        
        // 计算需要扣除的金币
        const cost = this.calculateCurrentCost();
        
        // 扣除金币
        const state = Storage.getGameState();
        const actualCost = Math.min(cost, state.coins);
        state.coins -= actualCost;
        Storage.saveGameState(state);
        
        this.totalPaidCoins += actualCost;
        
        var message = this.settings.alertMessage
            .replace('{minutes}', minutes);
        
        // 获取价值损失警告
        var lossWarning = '';
        if (typeof ValueVisualizer !== 'undefined') {
            const minuteLoss = ValueVisualizer.calculateInefficiencyLoss(this.currentTask);
            if (minuteLoss > 0) {
                lossWarning = '\n⚠️ 效率损失：每分钟少赚 ' + ValueVisualizer.formatMoney(minuteLoss) + '！';
            }
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🚨 低效率警报！\n" +
                message + lossWarning + "\n" +
                "已扣除 " + actualCost + " 金币\n" +
                "第 " + this.currentCycle + " 次循环，累计扣除：" + this.totalPaidCoins + " 金币", 
                "🚨"
            );
            App.updateGameStatus();
            App.loadInefficiencyPanel();
        }
        
        // 开始新的循环
        this.currentCycle++;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.halfwayAlertShown = false;
    },
    
    // 计算当前需要支付的金币
    calculateCurrentCost() {
        const cost = Math.floor(this.settings.baseCost * Math.pow(this.settings.costIncrement, this.currentCycle - 1));
        return Math.min(cost, this.settings.maxCost);
    },
    
    // 完成当前步骤
    completeStep() {
        if (!this.currentTask) return;
        
        const currentStep = this.getCurrentStep();
        const duration = this.formatDuration(this.elapsedSeconds);
        
        // 记录历史
        this.addHistory({
            taskId: this.currentTask.id,
            taskTitle: this.currentTask.title,
            stepName: currentStep,
            status: 'completed',
            duration: duration,
            durationSeconds: this.elapsedSeconds,
            coins: this.totalPaidCoins > 0 ? -this.totalPaidCoins : (this.currentCycle === 1 ? 2 : 0),
            cycles: this.currentCycle,
            efficiencyScore: this.efficiencyScore
        });
        
        // 奖励金币（如果没有超时）
        if (this.currentCycle === 1 && this.elapsedSeconds < this.settings.thresholdMinutes * 60) {
            const state = Storage.getGameState();
            state.coins += 2;
            Storage.saveGameState(state);
            
            if (typeof App !== 'undefined') {
                App.updateGameStatus();
                App.showCoinAnimation(2);
                App.addChatMessage("system", 
                    "✅ 步骤【" + currentStep + "】完成！\n" +
                    "用时：" + duration + "，效率评分：" + this.efficiencyScore + "/100\n" +
                    "获得 2 金币奖励！🎉", 
                    "✅"
                );
            }
        } else {
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "✅ 步骤【" + currentStep + "】完成！\n" +
                    "用时：" + duration + "\n" +
                    (this.totalPaidCoins > 0 ? "本步骤共扣除 " + this.totalPaidCoins + " 金币" : ""), 
                    "✅"
                );
            }
        }
        
        // 移动到下一步骤
        this.moveToNextStep();
    },
    
    // 标记卡顿
    markStuck() {
        const currentStep = this.getCurrentStep();
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "⏸️ 已标记步骤【" + currentStep + "】为卡顿状态\n" +
                "建议尝试：\n" +
                "1. 🤖 让AI帮你拆解这个步骤\n" +
                "2. 🧘 做5分钟正念呼吸\n" +
                "3. 🔄 先切换到其他简单任务", 
                "⏸️"
            );
        }
    },
    
    // 切换到下一步骤
    moveToNextStep() {
        if (!this.currentTask) return;
        
        const hasMoreSteps = this.currentTask.substeps && 
                            this.currentTask.substeps.length > this.currentStepIndex + 1;
        
        if (hasMoreSteps) {
            // 重置状态，进入下一步
            this.currentStepIndex++;
            this.elapsedSeconds = 0;
            this.isAlertActive = false;
            this.currentCycle = 1;
            this.totalPaidCoins = 0;
            this.halfwayAlertShown = false;
            this.efficiencyScore = 100;
            
            const nextStep = this.getCurrentStep();
            
            if (typeof App !== 'undefined') {
                App.addChatMessage("system", 
                    "🔄 进入下一步骤：【" + nextStep + "】\n" +
                    "计时器已重置，继续加油！💪", 
                    "🔄"
                );
                App.loadInefficiencyPanel();
            }
        } else {
            // 任务完成
            this.completeTask();
        }
    },
    
    // 完成整个任务
    completeTask() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        
        const task = this.currentTask;
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🎉 恭喜！任务【" + task.title + "】已全部完成！\n" +
                "你太棒了！🏆", 
                "🎉"
            );
        }
        
        // 重置状态
        this.currentTask = null;
        this.currentStepIndex = 0;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        
        if (typeof App !== 'undefined') {
            App.loadInefficiencyPanel();
        }
    },
    
    // 停止监控
    stopMonitoring() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        
        if (this.currentTask && this.totalPaidCoins > 0) {
            // 记录历史
            this.addHistory({
                taskId: this.currentTask.id,
                taskTitle: this.currentTask.title,
                stepName: this.getCurrentStep(),
                status: 'stopped',
                duration: this.formatDuration(this.elapsedSeconds),
                durationSeconds: this.elapsedSeconds,
                coins: -this.totalPaidCoins,
                cycles: this.currentCycle,
                efficiencyScore: this.efficiencyScore
            });
        }
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", "已停止低效率监控", "⏹️");
        }
        
        // 重置状态
        this.currentTask = null;
        this.currentStepIndex = 0;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.currentCycle = 1;
        this.totalPaidCoins = 0;
        
        if (typeof App !== 'undefined') {
            App.loadInefficiencyPanel();
        }
    },
    
    // 支付金币重置
    payToReset() {
        const cost = this.calculateCurrentCost();
        const state = Storage.getGameState();
        
        if (state.coins < cost) {
            alert("金币不足！需要 " + cost + " 金币，当前只有 " + state.coins + " 金币");
            return;
        }
        
        // 扣除金币
        state.coins -= cost;
        Storage.saveGameState(state);
        
        this.totalPaidCoins += cost;
        this.currentCycle++;
        this.elapsedSeconds = 0;
        this.isAlertActive = false;
        this.halfwayAlertShown = false;
        this.efficiencyScore = 100;
        
        const nextCost = this.calculateCurrentCost();
        
        if (typeof App !== 'undefined') {
            App.updateGameStatus();
            App.addChatMessage("system", 
                "🔄 已支付 " + cost + " 金币重置计时\n" +
                "专注时钟已重置为 " + this.settings.thresholdMinutes + " 分钟\n" +
                "下次重置需要 " + nextCost + " 金币", 
                "🔄"
            );
            App.loadInefficiencyPanel();
        }
    },
    
    // AI微调步骤
    async aiAdjustStep() {
        const currentStep = this.getCurrentStep();
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", "🤖 正在AI分析步骤【" + currentStep + "】...", "🤖");
            
            try {
                const microTask = {
                    title: currentStep,
                    duration: 15
                };
                const steps = await AIService.breakdownTask(microTask);
                
                if (steps.length > 0) {
                    var stepsText = "🔧 AI建议将【" + currentStep + "】拆解为：\n";
                    for (var i = 0; i < steps.length; i++) {
                        stepsText += "\n" + (i + 1) + ". " + steps[i].title;
                        if (steps[i].tip) {
                            stepsText += "\n   💡 " + steps[i].tip;
                        }
                    }
                    stepsText += "\n\n试试从第1个小步骤开始！";
                    
                    const messages = document.getElementById("chatMessages");
                    if (messages && messages.lastChild) messages.removeChild(messages.lastChild);
                    App.addChatMessage("system", stepsText, "🎯");
                }
            } catch (e) {
                const messages = document.getElementById("chatMessages");
                if (messages && messages.lastChild) messages.removeChild(messages.lastChild);
                App.addChatMessage("system", "AI分析失败，请检查API连接~", "😅");
            }
        }
    },
    
    // 5分钟正念呼吸
    startMindfulness() {
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                "🧘 开始5分钟正念呼吸\n\n" +
                "1. 找一个舒适的姿势坐好\n" +
                "2. 闭上眼睛，深呼吸\n" +
                "3. 吸气4秒...保持4秒...呼气4秒\n" +
                "4. 专注于呼吸的感觉\n" +
                "5. 如果走神了，轻轻把注意力拉回来\n\n" +
                "5分钟后回来继续任务~", 
                "🧘"
            );
        }
    },
    
    // 更新显示
    updateDisplay() {
        if (typeof App !== 'undefined') {
            const container = document.querySelector('.inefficiency-monitor');
            if (container) {
                container.innerHTML = App.renderInefficiencyMonitor();
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
        
        Storage.save('adhd_inefficiency_history', this.history);
    },
    
    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        Storage.save('adhd_inefficiency_settings', this.settings);
    },
    
    // 切换启用状态
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        Storage.save('adhd_inefficiency_settings', this.settings);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage("system", 
                this.settings.enabled ? "✅ 低效率监控已启用" : "⏸️ 低效率监控已暂停", 
                this.settings.enabled ? "✅" : "⏸️"
            );
            App.loadInefficiencyPanel();
        }
    },
    
    // 格式化时长
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return hours + '小时' + minutes + '分' + secs + '秒';
        } else if (minutes > 0) {
            return minutes + '分' + secs + '秒';
        } else {
            return secs + '秒';
        }
    },
    
    // 格式化倒计时
    formatCountdown(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return hours.toString().padStart(2, '0') + ':' + 
               minutes.toString().padStart(2, '0') + ':' + 
               secs.toString().padStart(2, '0');
    },
    
    // 获取统计数据
    getStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        var weeklyStuck = 0;
        var totalSpent = 0;
        var completedCount = 0;
        var stuckSteps = {};
        var hourlyEfficiency = {};
        
        for (var i = 0; i < this.history.length; i++) {
            const item = this.history[i];
            const itemDate = new Date(item.timestamp);
            
            if (itemDate > oneWeekAgo) {
                if (item.cycles > 1) weeklyStuck++;
                if (item.status === 'completed') completedCount++;
                
                // 统计卡顿步骤
                if (item.cycles > 1 && item.stepName) {
                    stuckSteps[item.stepName] = (stuckSteps[item.stepName] || 0) + 1;
                }
                
                // 统计小时效率
                const hour = itemDate.getHours();
                if (!hourlyEfficiency[hour]) {
                    hourlyEfficiency[hour] = { total: 0, count: 0 };
                }
                hourlyEfficiency[hour].total += item.efficiencyScore || 50;
                hourlyEfficiency[hour].count++;
            }
            
            if (item.coins < 0) totalSpent += Math.abs(item.coins);
        }
        
        // 找出常见卡顿点
        var commonStuck = Object.keys(stuckSteps).sort(function(a, b) {
            return stuckSteps[b] - stuckSteps[a];
        }).slice(0, 3);
        
        // 找出高效时间段
        var bestHour = null;
        var bestAvg = 0;
        for (var h in hourlyEfficiency) {
            const avg = hourlyEfficiency[h].total / hourlyEfficiency[h].count;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestHour = h;
            }
        }
        
        return {
            weeklyStuck: weeklyStuck,
            completedCount: completedCount,
            totalSpent: totalSpent,
            commonStuck: commonStuck.length > 0 ? commonStuck.join('、') : '暂无数据',
            bestHour: bestHour ? bestHour + ':00-' + (parseInt(bestHour) + 1) + ':00' : '暂无数据'
        };
    }
};

// 导出
window.InefficiencyMonitor = InefficiencyMonitor;

