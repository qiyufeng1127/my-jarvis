// AI使用报告与个性化建议模块
const AIReport = {
    // 生成周报
    generateWeeklyReport() {
        const memories = AIMemory ? AIMemory.getAllMemories() : {};
        const learning = typeof AILearning !== 'undefined' ? AILearning.getData() : {};
        const tasks = Storage.getTasks() || [];
        const gameState = Storage.getGameState() || {};
        
        // 获取本周数据
        const weekData = this.getWeekData(tasks);
        
        const report = {
            generatedAt: new Date().toISOString(),
            period: this.getWeekPeriod(),
            
            // 效率分析
            productivity: {
                tasksCompleted: weekData.completed,
                totalTasks: weekData.total,
                completionRate: weekData.total > 0 ? Math.round((weekData.completed / weekData.total) * 100) : 0,
                totalEarned: weekData.totalEarned,
                avgDailyEarned: Math.round(weekData.totalEarned / 7),
                bestDay: weekData.bestDay,
                worstDay: weekData.worstDay
            },
            
            // 时间模式
            timePatterns: {
                peakHours: this.analyzePeakHours(tasks),
                peakDays: this.analyzePeakDays(tasks),
                avgTaskDuration: this.calculateAvgDuration(tasks),
                procrastinationRate: this.calculateProcrastinationRate()
            },
            
            // 情绪趋势
            emotionTrend: {
                overall: this.analyzeEmotionTrend(memories),
                positiveCount: this.countEmotions(memories, 'positive'),
                negativeCount: this.countEmotions(memories, 'negative'),
                mainTriggers: this.getMainEmotionTriggers(memories)
            },
            
            // 习惯洞察
            habits: {
                goodHabits: memories.habits?.good || [],
                procrastinationTriggers: memories.habits?.procrastination?.triggers || [],
                distractions: memories.habits?.productivity?.distractions || [],
                improvements: this.detectImprovements(learning)
            },
            
            // 财务概览
            finance: {
                weeklyEarned: weekData.totalEarned,
                targetProgress: this.calculateTargetProgress(),
                topIncomeStreams: this.getTopIncomeStreams(),
                projectedMonthly: this.projectMonthlyIncome(weekData.totalEarned)
            },
            
            // AI建议
            suggestions: this.generateSuggestions(weekData, memories, learning)
        };
        
        // 保存报告
        this.saveReport(report);
        
        return report;
    },
    
    // 获取本周数据
    getWeekData(tasks) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= weekStart && taskDate <= now;
        });
        
        const completed = weekTasks.filter(t => t.completed);
        const dailyEarnings = {};
        
        completed.forEach(t => {
            const day = new Date(t.completedAt || t.date).toLocaleDateString('zh-CN', { weekday: 'long' });
            dailyEarnings[day] = (dailyEarnings[day] || 0) + (t.value || 0);
        });
        
        const days = Object.entries(dailyEarnings);
        const bestDay = days.length > 0 ? days.reduce((a, b) => a[1] > b[1] ? a : b) : null;
        const worstDay = days.length > 0 ? days.reduce((a, b) => a[1] < b[1] ? a : b) : null;
        
        return {
            total: weekTasks.length,
            completed: completed.length,
            totalEarned: completed.reduce((sum, t) => sum + (t.value || 0), 0),
            bestDay: bestDay ? { day: bestDay[0], earned: bestDay[1] } : null,
            worstDay: worstDay ? { day: worstDay[0], earned: worstDay[1] } : null
        };
    },
    
    // 获取本周时间范围
    getWeekPeriod() {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        
        const formatDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
        return `${formatDate(weekStart)} - ${formatDate(now)}`;
    },
    
    // 分析高效时段
    analyzePeakHours(tasks) {
        const hourCounts = {};
        const completedTasks = tasks.filter(t => t.completed && t.completedAt);
        
        completedTasks.forEach(t => {
            const hour = new Date(t.completedAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
        return sorted.slice(0, 3).map(([hour, count]) => ({
            hour: parseInt(hour),
            label: `${hour}:00-${parseInt(hour) + 1}:00`,
            count: count
        }));
    },
    
    // 分析高效日期
    analyzePeakDays(tasks) {
        const dayCounts = {};
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const completedTasks = tasks.filter(t => t.completed);
        
        completedTasks.forEach(t => {
            const day = new Date(t.date).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        
        const sorted = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);
        return sorted.slice(0, 3).map(([day, count]) => ({
            day: parseInt(day),
            label: dayNames[parseInt(day)],
            count: count
        }));
    },
    
    // 计算平均任务时长
    calculateAvgDuration(tasks) {
        const completedWithDuration = tasks.filter(t => t.completed && t.duration);
        if (completedWithDuration.length === 0) return 0;
        
        const totalDuration = completedWithDuration.reduce((sum, t) => sum + t.duration, 0);
        return Math.round(totalDuration / completedWithDuration.length);
    },
    
    // 计算拖延率
    calculateProcrastinationRate() {
        if (typeof ProcrastinationMonitor === 'undefined') return 0;
        const history = ProcrastinationMonitor.history || [];
        if (history.length === 0) return 0;
        
        const delayed = history.filter(h => h.status === 'delayed' || h.status === 'paid').length;
        return Math.round((delayed / history.length) * 100);
    },
    
    // 分析情绪趋势
    analyzeEmotionTrend(memories) {
        const moodHistory = memories.emotions?.moodHistory || [];
        if (moodHistory.length === 0) return 'unknown';
        
        const recent = moodHistory.slice(-20);
        const positive = recent.filter(m => m.type === 'positive').length;
        const negative = recent.filter(m => m.type === 'negative').length;
        
        if (positive > negative * 2) return 'very_positive';
        if (positive > negative) return 'positive';
        if (negative > positive * 2) return 'very_negative';
        if (negative > positive) return 'negative';
        return 'neutral';
    },
    
    // 统计情绪数量
    countEmotions(memories, type) {
        const moodHistory = memories.emotions?.moodHistory || [];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return moodHistory.filter(m => {
            const moodDate = new Date(m.date);
            return m.type === type && moodDate >= weekAgo;
        }).length;
    },
    
    // 获取主要情绪触发器
    getMainEmotionTriggers(memories) {
        const moodHistory = memories.emotions?.moodHistory || [];
        const triggers = {};
        
        moodHistory.forEach(m => {
            if (m.emotion) {
                triggers[m.emotion] = (triggers[m.emotion] || 0) + 1;
            }
        });
        
        return Object.entries(triggers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([emotion, count]) => ({ emotion, count }));
    },
    
    // 检测改进
    detectImprovements(learning) {
        const improvements = [];
        
        if (learning.timeEstimationBias) {
            const bias = learning.timeEstimationBias;
            if (Math.abs(bias) < 10) {
                improvements.push('时间估算越来越准确了！');
            }
        }
        
        if (learning.energyCycles) {
            improvements.push('已识别出你的精力周期模式');
        }
        
        return improvements;
    },
    
    // 计算目标进度
    calculateTargetProgress() {
        if (typeof ValueVisualizer === 'undefined') return 0;
        const finance = ValueVisualizer.finance || {};
        const monthEarned = ValueVisualizer.getMonthEarned ? ValueVisualizer.getMonthEarned() : 0;
        const target = finance.monthlyTarget || finance.monthlyExpense || 0;
        
        if (target === 0) return 100;
        return Math.round((monthEarned / target) * 100);
    },
    
    // 获取主要收入来源
    getTopIncomeStreams() {
        if (typeof ValueVisualizer === 'undefined') return [];
        const streams = ValueVisualizer.getStreamStats ? ValueVisualizer.getStreamStats() : [];
        return streams.slice(0, 3);
    },
    
    // 预测月收入
    projectMonthlyIncome(weeklyEarned) {
        return Math.round(weeklyEarned * 4.3);
    },
    
    // 生成个性化建议
    generateSuggestions(weekData, memories, learning) {
        const suggestions = [];
        
        // 基于高效时段的建议
        const peakHours = this.analyzePeakHours(Storage.getTasks() || []);
        if (peakHours.length > 0) {
            const bestHour = peakHours[0];
            suggestions.push({
                type: 'time',
                icon: '⏰',
                title: '最佳工作时间',
                content: `我发现你在 ${bestHour.label} 效率最高，建议把重要任务安排在这个时段。`,
                priority: 'high'
            });
        }
        
        // 基于高效日期的建议
        const peakDays = this.analyzePeakDays(Storage.getTasks() || []);
        if (peakDays.length > 0) {
            const bestDay = peakDays[0];
            suggestions.push({
                type: 'schedule',
                icon: '📅',
                title: '高效日安排',
                content: `${bestDay.label} 是你完成任务最多的日子，可以在这天安排更多重要工作。`,
                priority: 'medium'
            });
        }
        
        // 基于拖延率的建议
        const procrastinationRate = this.calculateProcrastinationRate();
        if (procrastinationRate > 50) {
            suggestions.push({
                type: 'habit',
                icon: '🎯',
                title: '减少拖延',
                content: `本周拖延率 ${procrastinationRate}%，建议把任务拆解得更小，降低启动难度。`,
                priority: 'high'
            });
        } else if (procrastinationRate < 20) {
            suggestions.push({
                type: 'praise',
                icon: '🌟',
                title: '执行力很棒！',
                content: `本周拖延率只有 ${procrastinationRate}%，继续保持！`,
                priority: 'low'
            });
        }
        
        // 基于情绪的建议
        const emotionTrend = this.analyzeEmotionTrend(memories);
        if (emotionTrend === 'negative' || emotionTrend === 'very_negative') {
            suggestions.push({
                type: 'wellbeing',
                icon: '💆',
                title: '关注身心健康',
                content: '最近负面情绪较多，建议适当休息，做些让自己开心的事。',
                priority: 'high'
            });
        }
        
        // 基于收入的建议
        if (weekData.totalEarned > 0 && weekData.bestDay) {
            suggestions.push({
                type: 'finance',
                icon: '💰',
                title: '收入洞察',
                content: `${weekData.bestDay.day} 赚了 ¥${weekData.bestDay.earned}，是本周最高！分析一下那天做了什么。`,
                priority: 'medium'
            });
        }
        
        // 基于分心因素的建议
        const distractions = memories.habits?.productivity?.distractions || [];
        if (distractions.length > 0) {
            suggestions.push({
                type: 'focus',
                icon: '🎧',
                title: '减少干扰',
                content: `你提到过容易被 ${distractions.slice(0, 2).join('、')} 分心，工作时可以试试屏蔽这些。`,
                priority: 'medium'
            });
        }
        
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    },
    
    // 保存报告
    saveReport(report) {
        const reports = Storage.load('adhd_weekly_reports', []);
        reports.push(report);
        // 只保留最近12周的报告
        if (reports.length > 12) {
            reports.shift();
        }
        Storage.save('adhd_weekly_reports', reports);
    },
    
    // 获取历史报告
    getReports(limit = 4) {
        const reports = Storage.load('adhd_weekly_reports', []);
        return reports.slice(-limit).reverse();
    },
    
    // 生成理想日程
    generateIdealSchedule() {
        const memories = AIMemory ? AIMemory.getAllMemories() : {};
        const tasks = Storage.getTasks() || [];
        
        // 分析高效时段
        const peakHours = this.analyzePeakHours(tasks);
        
        // 分析任务类型偏好
        const taskPatterns = memories.work?.workPatterns || [];
        
        // 生成建议日程
        const schedule = {
            morning: [],    // 6-12
            afternoon: [],  // 12-18
            evening: []     // 18-24
        };
        
        // 根据高效时段安排重要任务
        if (peakHours.length > 0) {
            peakHours.forEach(peak => {
                const hour = peak.hour;
                const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
                schedule[period].push({
                    time: `${hour}:00`,
                    suggestion: '高效时段 - 安排重要/困难任务',
                    type: 'peak',
                    icon: '⭐'
                });
            });
        }
        
        // 根据习惯添加建议
        const routines = memories.life?.routines || [];
        routines.forEach(routine => {
            if (routine.includes('早') || routine.includes('晨')) {
                schedule.morning.push({
                    suggestion: routine,
                    type: 'routine',
                    icon: '🌅'
                });
            }
        });
        
        // 添加休息建议
        schedule.morning.push({
            time: '10:30',
            suggestion: '短暂休息 - 喝水、伸展',
            type: 'break',
            icon: '☕'
        });
        
        schedule.afternoon.push({
            time: '15:00',
            suggestion: '下午茶时间 - 补充能量',
            type: 'break',
            icon: '🍵'
        });
        
        return schedule;
    },
    
    // 获取今日个性化建议
    getTodaySuggestions() {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const suggestions = [];
        
        // 基于时间的建议
        const peakHours = this.analyzePeakHours(Storage.getTasks() || []);
        const isPeakHour = peakHours.some(p => p.hour === hour);
        
        if (isPeakHour) {
            suggestions.push({
                icon: '⚡',
                text: '现在是你的高效时段！抓紧处理重要任务。',
                action: '查看任务',
                actionType: 'viewTasks'
            });
        }
        
        // 基于星期的建议
        const peakDays = this.analyzePeakDays(Storage.getTasks() || []);
        const isPeakDay = peakDays.some(p => p.day === dayOfWeek);
        
        if (isPeakDay) {
            suggestions.push({
                icon: '📈',
                text: '今天通常是你效率较高的日子，可以多安排一些任务。',
                action: '添加任务',
                actionType: 'addTask'
            });
        }
        
        // 基于情绪的建议
        if (AIMemory) {
            const moodTrend = AIMemory.getRecentMoodTrend();
            if (moodTrend === 'negative' || moodTrend === 'very_negative') {
                suggestions.push({
                    icon: '💆',
                    text: '最近压力有点大，记得适当休息哦。',
                    action: '休息一下',
                    actionType: 'takeBreak'
                });
            }
        }
        
        return suggestions;
    }
};

// 导出
window.AIReport = AIReport;

