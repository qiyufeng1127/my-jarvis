// AI预测引擎模块 - 从"记录"到"预测"
const AIPrediction = {
    // 预测数据
    predictionData: {
        // 历史任务模式
        taskPatterns: {
            byDayOfWeek: {},    // 按星期几的任务模式
            byTimeOfDay: {},    // 按时间段的任务模式
            recurring: [],       // 周期性任务
            sequences: []        // 任务序列模式
        },
        // 项目进度追踪
        projects: {},
        // 预测准确度
        accuracy: {
            correct: 0,
            total: 0,
            byType: {}
        }
    },
    
    // 今日预测
    todayPredictions: [],
    
    // 初始化
    init() {
        const savedData = Storage.load('adhd_prediction_data', null);
        if (savedData) {
            this.predictionData = { ...this.predictionData, ...savedData };
        }
        
        // 分析历史数据建立模式
        this.analyzeHistoricalPatterns();
        
        // 生成今日预测
        this.generateDailyPredictions();
        
        // 启动预测服务
        this.startPredictionService();
        
        console.log('AI预测引擎初始化完成');
    },
    
    // 启动预测服务
    startPredictionService() {
        // 每天凌晨重新生成预测
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            this.generateDailyPredictions();
            // 之后每24小时生成一次
            setInterval(() => this.generateDailyPredictions(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
        
        // 监听任务完成事件以学习
        document.addEventListener('taskCompleted', (e) => {
            this.learnFromCompletion(e.detail);
        });
    },
    
    // 分析历史模式
    analyzeHistoricalPatterns() {
        const tasks = Storage.getTasks();
        if (tasks.length < 10) return;
        
        // 分析按星期几的模式
        tasks.forEach(task => {
            if (!task.date) return;
            
            const date = new Date(task.date);
            const dayOfWeek = date.getDay();
            const hour = task.startTime ? parseInt(task.startTime.split(':')[0]) : 9;
            const timeOfDay = this.getTimeOfDay(hour);
            const taskType = task.category || task.type || '其他';
            
            // 按星期几统计
            if (!this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek]) {
                this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek] = {};
            }
            if (!this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek][taskType]) {
                this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek][taskType] = {
                    count: 0,
                    avgDuration: 0,
                    titles: []
                };
            }
            const dayPattern = this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek][taskType];
            dayPattern.count++;
            dayPattern.avgDuration = (dayPattern.avgDuration * (dayPattern.count - 1) + (task.duration || 60)) / dayPattern.count;
            if (!dayPattern.titles.includes(task.title)) {
                dayPattern.titles.push(task.title);
            }
            
            // 按时间段统计
            if (!this.predictionData.taskPatterns.byTimeOfDay[timeOfDay]) {
                this.predictionData.taskPatterns.byTimeOfDay[timeOfDay] = {};
            }
            if (!this.predictionData.taskPatterns.byTimeOfDay[timeOfDay][taskType]) {
                this.predictionData.taskPatterns.byTimeOfDay[timeOfDay][taskType] = 0;
            }
            this.predictionData.taskPatterns.byTimeOfDay[timeOfDay][taskType]++;
        });
        
        // 检测周期性任务
        this.detectRecurringTasks(tasks);
        
        this.saveData();
    },
    
    // 检测周期性任务
    detectRecurringTasks(tasks) {
        const titleCounts = {};
        const titleDates = {};
        
        tasks.forEach(task => {
            const title = task.title.replace(/\d+/g, '').trim(); // 移除数字
            if (!titleCounts[title]) {
                titleCounts[title] = 0;
                titleDates[title] = [];
            }
            titleCounts[title]++;
            if (task.date) {
                titleDates[title].push(new Date(task.date));
            }
        });
        
        // 找出重复出现的任务
        Object.entries(titleCounts).forEach(([title, count]) => {
            if (count >= 3) {
                const dates = titleDates[title].sort((a, b) => a - b);
                const intervals = [];
                
                for (let i = 1; i < dates.length; i++) {
                    const daysDiff = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
                    intervals.push(daysDiff);
                }
                
                if (intervals.length > 0) {
                    const avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
                    
                    // 检测周期类型
                    let pattern = 'irregular';
                    if (avgInterval >= 6 && avgInterval <= 8) pattern = 'weekly';
                    else if (avgInterval >= 13 && avgInterval <= 15) pattern = 'biweekly';
                    else if (avgInterval >= 28 && avgInterval <= 32) pattern = 'monthly';
                    else if (avgInterval === 1) pattern = 'daily';
                    
                    if (pattern !== 'irregular') {
                        this.predictionData.taskPatterns.recurring.push({
                            title,
                            pattern,
                            avgInterval,
                            lastOccurrence: dates[dates.length - 1].toISOString(),
                            count
                        });
                    }
                }
            }
        });
    },
    
    // 生成每日预测
    generateDailyPredictions() {
        const predictions = [];
        const now = new Date();
        const dayOfWeek = now.getDay();
        const existingTasks = Storage.getTasks().filter(t => t.date === this.formatDate(now));
        
        // 1. 基于星期几的模式预测
        const dayPatterns = this.predictionData.taskPatterns.byDayOfWeek[dayOfWeek];
        if (dayPatterns) {
            Object.entries(dayPatterns).forEach(([taskType, data]) => {
                if (data.count >= 2) {
                    // 检查是否已有类似任务
                    const hasExisting = existingTasks.some(t => 
                        (t.category || t.type) === taskType || 
                        data.titles.some(title => t.title.includes(title.substring(0, 5)))
                    );
                    
                    if (!hasExisting) {
                        predictions.push({
                            type: 'pattern',
                            source: 'dayOfWeek',
                            taskType,
                            suggestedTitle: data.titles[0] || taskType + '任务',
                            suggestedDuration: Math.round(data.avgDuration),
                            confidence: Math.min(0.9, 0.5 + data.count * 0.1),
                            reason: `每周${this.getDayName(dayOfWeek)}你通常会做${taskType}类任务`
                        });
                    }
                }
            });
        }
        
        // 2. 基于周期性任务预测
        this.predictionData.taskPatterns.recurring.forEach(recurring => {
            const lastDate = new Date(recurring.lastOccurrence);
            const daysSince = Math.round((now - lastDate) / (1000 * 60 * 60 * 24));
            
            // 如果接近下一个周期
            if (daysSince >= recurring.avgInterval - 1 && daysSince <= recurring.avgInterval + 1) {
                const hasExisting = existingTasks.some(t => 
                    t.title.includes(recurring.title.substring(0, 5))
                );
                
                if (!hasExisting) {
                    predictions.push({
                        type: 'recurring',
                        source: recurring.pattern,
                        suggestedTitle: recurring.title,
                        suggestedDuration: 60,
                        confidence: 0.85,
                        reason: `这是你的${this.getPatternName(recurring.pattern)}任务`
                    });
                }
            }
        });
        
        // 3. 基于项目进度预测
        Object.entries(this.predictionData.projects).forEach(([projectId, project]) => {
            if (project.deadline && project.remainingWork > 0) {
                const deadline = new Date(project.deadline);
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                
                if (daysUntilDeadline <= 5 && daysUntilDeadline > 0) {
                    const dailyWork = Math.ceil(project.remainingWork / daysUntilDeadline);
                    
                    predictions.push({
                        type: 'deadline',
                        source: 'project',
                        projectName: project.name,
                        suggestedTitle: `继续${project.name}`,
                        suggestedDuration: dailyWork,
                        confidence: 0.95,
                        reason: `${project.name}还有${daysUntilDeadline}天截止，剩余${project.remainingWork}分钟工作量`,
                        urgency: daysUntilDeadline <= 2 ? 'high' : 'medium'
                    });
                }
            }
        });
        
        // 4. 基于时间段偏好安排时间
        predictions.forEach(pred => {
            pred.suggestedTime = this.getSuggestedTime(pred.taskType || '其他');
        });
        
        // 按置信度和紧急度排序
        predictions.sort((a, b) => {
            if (a.urgency === 'high' && b.urgency !== 'high') return -1;
            if (b.urgency === 'high' && a.urgency !== 'high') return 1;
            return b.confidence - a.confidence;
        });
        
        this.todayPredictions = predictions.slice(0, 5);
        
        // 计算总体置信度
        const avgConfidence = predictions.length > 0 ?
            Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100) : 0;
        
        // 广播预测结果
        this.broadcastPredictions(avgConfidence);
        
        return this.todayPredictions;
    },
    
    // 获取建议时间
    getSuggestedTime(taskType) {
        const timePatterns = this.predictionData.taskPatterns.byTimeOfDay;
        let bestTime = 'morning';
        let maxCount = 0;
        
        ['morning', 'afternoon', 'evening'].forEach(time => {
            if (timePatterns[time] && timePatterns[time][taskType]) {
                if (timePatterns[time][taskType] > maxCount) {
                    maxCount = timePatterns[time][taskType];
                    bestTime = time;
                }
            }
        });
        
        const timeRanges = {
            morning: '09:00',
            afternoon: '14:00',
            evening: '19:00'
        };
        
        return timeRanges[bestTime];
    },
    
    // 广播预测结果
    broadcastPredictions(confidence) {
        const event = new CustomEvent('predictionsReady', {
            detail: {
                predictions: this.todayPredictions,
                confidence
            }
        });
        document.dispatchEvent(event);
        
        // 显示在聊天中
        if (this.todayPredictions.length > 0 && typeof App !== 'undefined') {
            this.showPredictionsInChat(confidence);
        }
    },
    
    // 在聊天中显示预测
    showPredictionsInChat(confidence) {
        let message = '🔮 **AI预测任务**（基于你的历史数据）\n\n';
        
        this.todayPredictions.forEach((pred, index) => {
            const timeLabel = pred.suggestedTime || '待定';
            const urgencyIcon = pred.urgency === 'high' ? '🔴' : '';
            message += `${index + 1}. ${urgencyIcon}${pred.suggestedTitle}\n`;
            message += `   ⏰ ${timeLabel} · ${pred.suggestedDuration}分钟\n`;
            message += `   💡 ${pred.reason}\n\n`;
        });
        
        message += `📊 置信度：${confidence}%\n`;
        message += `🔄 完成后告诉我预测是否准确~`;
        
        App.addChatMessage('system', message, '🔮');
    },
    
    // 添加项目追踪
    addProject(name, deadline, totalWork) {
        const projectId = 'project_' + Date.now();
        this.predictionData.projects[projectId] = {
            name,
            deadline: deadline.toISOString(),
            totalWork,
            remainingWork: totalWork,
            createdAt: new Date().toISOString()
        };
        this.saveData();
        return projectId;
    },
    
    // 更新项目进度
    updateProjectProgress(projectId, completedMinutes) {
        if (this.predictionData.projects[projectId]) {
            this.predictionData.projects[projectId].remainingWork -= completedMinutes;
            this.saveData();
        }
    },
    
    // 从完成中学习
    learnFromCompletion(taskData) {
        // 记录预测准确度
        const matchingPrediction = this.todayPredictions.find(p => 
            taskData.title.includes(p.suggestedTitle.substring(0, 5)) ||
            p.suggestedTitle.includes(taskData.title.substring(0, 5))
        );
        
        if (matchingPrediction) {
            this.predictionData.accuracy.correct++;
        }
        this.predictionData.accuracy.total++;
        
        this.saveData();
    },
    
    // 记录预测反馈
    recordFeedback(predictionIndex, wasAccurate) {
        this.predictionData.accuracy.total++;
        if (wasAccurate) {
            this.predictionData.accuracy.correct++;
        }
        this.saveData();
        
        const accuracy = Math.round(this.predictionData.accuracy.correct / this.predictionData.accuracy.total * 100);
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', 
                wasAccurate ? 
                    `✅ 感谢反馈！预测准确度：${accuracy}%` :
                    `📝 收到！我会继续学习改进，当前准确度：${accuracy}%`,
                wasAccurate ? '✅' : '📝'
            );
        }
    },
    
    // 获取预测报告
    getPredictionReport() {
        const accuracy = this.predictionData.accuracy.total > 0 ?
            Math.round(this.predictionData.accuracy.correct / this.predictionData.accuracy.total * 100) : 0;
        
        return {
            todayPredictions: this.todayPredictions,
            accuracy,
            totalPredictions: this.predictionData.accuracy.total,
            recurringTasks: this.predictionData.taskPatterns.recurring.length,
            trackedProjects: Object.keys(this.predictionData.projects).length
        };
    },
    
    // 工具方法
    getTimeOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    },
    
    getDayName(dayOfWeek) {
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return days[dayOfWeek];
    },
    
    getPatternName(pattern) {
        const names = {
            daily: '每日',
            weekly: '每周',
            biweekly: '双周',
            monthly: '每月'
        };
        return names[pattern] || '周期性';
    },
    
    formatDate(date) {
        return date.getFullYear() + '-' + 
            (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
            date.getDate().toString().padStart(2, '0');
    },
    
    saveData() {
        Storage.save('adhd_prediction_data', this.predictionData);
    }
};

// 导出
window.AIPrediction = AIPrediction;

