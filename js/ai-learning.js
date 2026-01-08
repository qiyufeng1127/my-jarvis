// AI深度学习模块 - 个人效率模型学习
const AILearning = {
    // 学习数据存储
    learningData: {
        // 能量周期模式
        energyCycle: {
            morning: { creativity: 0, execution: 0, focus: 0, samples: 0 },
            afternoon: { creativity: 0, execution: 0, focus: 0, samples: 0 },
            evening: { creativity: 0, execution: 0, focus: 0, samples: 0 }
        },
        // 任务类型偏好
        taskPreferences: {},
        // 拖延触发器
        procrastinationTriggers: {
            complexity: { high: 0, medium: 0, low: 0 },
            duration: { long: 0, medium: 0, short: 0 },
            type: {}
        },
        // 时间估算偏差
        timeEstimation: {
            totalEstimated: 0,
            totalActual: 0,
            samples: 0,
            byType: {}
        },
        // 中断恢复时间
        interruptionRecovery: {
            totalRecoveryTime: 0,
            samples: 0,
            byContext: {}
        },
        // 完成率统计
        completionRates: {
            byHour: {},
            byDayOfWeek: {},
            byTaskType: {}
        },
        // 价值偏好排序
        valuePreferences: [],
        // 学习开始时间
        learningStartDate: null,
        // 总样本数
        totalSamples: 0
    },
    
    // 学习到的模式
    learnedPatterns: {
        peakCreativityTime: null,
        peakExecutionTime: null,
        procrastinationRiskFactors: [],
        timeEstimationBias: 0,
        avgInterruptionRecovery: 8,
        optimalTaskOrder: [],
        preferredBreakInterval: 50,
        lastUpdated: null
    },
    
    // 初始化
    init() {
        // 加载学习数据
        const savedData = Storage.load('adhd_learning_data', null);
        if (savedData) {
            this.learningData = { ...this.learningData, ...savedData };
        }
        
        const savedPatterns = Storage.load('adhd_learned_patterns', null);
        if (savedPatterns) {
            this.learnedPatterns = { ...this.learnedPatterns, ...savedPatterns };
        }
        
        if (!this.learningData.learningStartDate) {
            this.learningData.learningStartDate = new Date().toISOString();
        }
        
        // 启动后台学习
        this.startBackgroundLearning();
        
        console.log('AI学习模块初始化完成');
    },
    
    // 启动后台学习
    startBackgroundLearning() {
        // 每10分钟分析一次数据
        setInterval(() => this.analyzeAndLearn(), 10 * 60 * 1000);
        
        // 首次延迟分析
        setTimeout(() => this.analyzeAndLearn(), 5000);
    },
    
    // 记录任务完成事件
    recordTaskCompletion(task, actualDuration, wasDelayed, interruptionCount) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const timeOfDay = this.getTimeOfDay(hour);
        
        // 更新能量周期数据
        const energyData = this.learningData.energyCycle[timeOfDay];
        if (energyData) {
            // 根据任务类型判断是创意还是执行
            const isCreative = this.isCreativeTask(task);
            if (isCreative) {
                energyData.creativity += wasDelayed ? 0.3 : 1;
            } else {
                energyData.execution += wasDelayed ? 0.3 : 1;
            }
            energyData.focus += interruptionCount > 2 ? 0.3 : 1;
            energyData.samples++;
        }
        
        // 更新时间估算偏差
        if (task.duration && actualDuration) {
            this.learningData.timeEstimation.totalEstimated += task.duration;
            this.learningData.timeEstimation.totalActual += actualDuration;
            this.learningData.timeEstimation.samples++;
            
            // 按类型记录
            const taskType = task.category || task.type || '其他';
            if (!this.learningData.timeEstimation.byType[taskType]) {
                this.learningData.timeEstimation.byType[taskType] = { estimated: 0, actual: 0, samples: 0 };
            }
            this.learningData.timeEstimation.byType[taskType].estimated += task.duration;
            this.learningData.timeEstimation.byType[taskType].actual += actualDuration;
            this.learningData.timeEstimation.byType[taskType].samples++;
        }
        
        // 更新完成率
        const hourKey = hour.toString();
        if (!this.learningData.completionRates.byHour[hourKey]) {
            this.learningData.completionRates.byHour[hourKey] = { completed: 0, total: 0 };
        }
        this.learningData.completionRates.byHour[hourKey].completed++;
        this.learningData.completionRates.byHour[hourKey].total++;
        
        // 更新任务类型偏好
        const taskType = task.category || task.type || '其他';
        if (!this.learningData.taskPreferences[taskType]) {
            this.learningData.taskPreferences[taskType] = { 
                completions: 0, 
                totalValue: 0, 
                avgDuration: 0,
                satisfactionScore: 0
            };
        }
        this.learningData.taskPreferences[taskType].completions++;
        this.learningData.taskPreferences[taskType].totalValue += task.value || 0;
        
        this.learningData.totalSamples++;
        this.saveData();
    },
    
    // 记录拖延事件
    recordProcrastination(task, delayMinutes, wasStarted) {
        const complexity = this.getTaskComplexity(task);
        const duration = this.getTaskDurationCategory(task.duration);
        const taskType = task.category || task.type || '其他';
        
        // 更新拖延触发器数据
        this.learningData.procrastinationTriggers.complexity[complexity]++;
        this.learningData.procrastinationTriggers.duration[duration]++;
        
        if (!this.learningData.procrastinationTriggers.type[taskType]) {
            this.learningData.procrastinationTriggers.type[taskType] = 0;
        }
        this.learningData.procrastinationTriggers.type[taskType]++;
        
        this.saveData();
    },
    
    // 记录中断恢复
    recordInterruptionRecovery(recoveryMinutes, context) {
        this.learningData.interruptionRecovery.totalRecoveryTime += recoveryMinutes;
        this.learningData.interruptionRecovery.samples++;
        
        if (context) {
            if (!this.learningData.interruptionRecovery.byContext[context]) {
                this.learningData.interruptionRecovery.byContext[context] = { total: 0, samples: 0 };
            }
            this.learningData.interruptionRecovery.byContext[context].total += recoveryMinutes;
            this.learningData.interruptionRecovery.byContext[context].samples++;
        }
        
        this.saveData();
    },
    
    // 分析并学习模式
    analyzeAndLearn() {
        if (this.learningData.totalSamples < 5) {
            console.log('样本不足，继续收集数据...');
            return;
        }
        
        // 分析能量周期
        this.analyzEnergyCycle();
        
        // 分析时间估算偏差
        this.analyzeTimeEstimation();
        
        // 分析拖延触发器
        this.analyzeProcrastinationTriggers();
        
        // 分析中断恢复
        this.analyzeInterruptionRecovery();
        
        // 分析价值偏好
        this.analyzeValuePreferences();
        
        // 更新时间戳
        this.learnedPatterns.lastUpdated = new Date().toISOString();
        
        // 保存学习结果
        Storage.save('adhd_learned_patterns', this.learnedPatterns);
        
        // 应用学习结果
        this.applyLearnedPatterns();
        
        // 广播学习更新事件
        this.broadcastLearningUpdate();
    },
    
    // 分析能量周期
    analyzEnergyCycle() {
        const cycle = this.learningData.energyCycle;
        let maxCreativity = { time: null, score: 0 };
        let maxExecution = { time: null, score: 0 };
        
        ['morning', 'afternoon', 'evening'].forEach(time => {
            const data = cycle[time];
            if (data.samples > 0) {
                const creativityScore = data.creativity / data.samples;
                const executionScore = data.execution / data.samples;
                
                if (creativityScore > maxCreativity.score) {
                    maxCreativity = { time, score: creativityScore };
                }
                if (executionScore > maxExecution.score) {
                    maxExecution = { time, score: executionScore };
                }
            }
        });
        
        this.learnedPatterns.peakCreativityTime = maxCreativity.time;
        this.learnedPatterns.peakExecutionTime = maxExecution.time;
    },
    
    // 分析时间估算偏差
    analyzeTimeEstimation() {
        const data = this.learningData.timeEstimation;
        if (data.samples > 0) {
            const bias = (data.totalActual - data.totalEstimated) / data.totalEstimated;
            this.learnedPatterns.timeEstimationBias = Math.round(bias * 100);
        }
    },
    
    // 分析拖延触发器
    analyzeProcrastinationTriggers() {
        const triggers = this.learningData.procrastinationTriggers;
        const riskFactors = [];
        
        // 分析复杂度
        const complexityTotal = triggers.complexity.high + triggers.complexity.medium + triggers.complexity.low;
        if (complexityTotal > 0) {
            const highRatio = triggers.complexity.high / complexityTotal;
            if (highRatio > 0.5) {
                riskFactors.push({ factor: '高复杂度任务', risk: 'high', description: '复杂任务容易拖延' });
            }
        }
        
        // 分析时长
        const durationTotal = triggers.duration.long + triggers.duration.medium + triggers.duration.short;
        if (durationTotal > 0) {
            const longRatio = triggers.duration.long / durationTotal;
            if (longRatio > 0.4) {
                riskFactors.push({ factor: '长时间任务', risk: 'high', description: '超长任务需要拆分' });
            }
        }
        
        // 分析任务类型
        const typeEntries = Object.entries(triggers.type);
        if (typeEntries.length > 0) {
            typeEntries.sort((a, b) => b[1] - a[1]);
            const topType = typeEntries[0];
            if (topType[1] > 3) {
                riskFactors.push({ factor: topType[0] + '类任务', risk: 'medium', description: '该类型任务拖延率较高' });
            }
        }
        
        this.learnedPatterns.procrastinationRiskFactors = riskFactors;
    },
    
    // 分析中断恢复
    analyzeInterruptionRecovery() {
        const data = this.learningData.interruptionRecovery;
        if (data.samples > 0) {
            this.learnedPatterns.avgInterruptionRecovery = Math.round(data.totalRecoveryTime / data.samples);
        }
    },
    
    // 分析价值偏好
    analyzeValuePreferences() {
        const prefs = this.learningData.taskPreferences;
        const entries = Object.entries(prefs);
        
        if (entries.length > 0) {
            // 按平均价值排序
            const sorted = entries
                .filter(([_, data]) => data.completions > 0)
                .map(([type, data]) => ({
                    type,
                    avgValue: data.totalValue / data.completions,
                    completions: data.completions
                }))
                .sort((a, b) => b.avgValue - a.avgValue);
            
            this.learnedPatterns.valuePreferences = sorted.map(s => s.type);
        }
    },
    
    // 应用学习结果
    applyLearnedPatterns() {
        // 调整拖延监控参数
        if (typeof ProcrastinationMonitor !== 'undefined') {
            // 如果用户经常拖延复杂任务，提前提醒
            const hasComplexityRisk = this.learnedPatterns.procrastinationRiskFactors
                .some(f => f.factor.includes('复杂度'));
            if (hasComplexityRisk) {
                ProcrastinationMonitor.settings.preAlertTime = 20; // 提前20秒
            }
        }
        
        // 调整时间估算
        if (typeof AIService !== 'undefined' && this.learnedPatterns.timeEstimationBias !== 0) {
            AIService.timeAdjustmentFactor = 1 + (this.learnedPatterns.timeEstimationBias / 100);
        }
    },
    
    // 广播学习更新
    broadcastLearningUpdate() {
        const event = new CustomEvent('aiLearningUpdate', {
            detail: {
                patterns: this.learnedPatterns,
                sampleCount: this.learningData.totalSamples
            }
        });
        document.dispatchEvent(event);
    },
    
    // 获取学习状态报告
    getLearningReport() {
        const daysSinceLearning = this.learningData.learningStartDate ? 
            Math.floor((new Date() - new Date(this.learningData.learningStartDate)) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
            daysSinceLearning,
            totalSamples: this.learningData.totalSamples,
            patterns: {
                energyCycle: this.getEnergyCycleDescription(),
                procrastinationTriggers: this.learnedPatterns.procrastinationRiskFactors,
                valuePreferences: this.learnedPatterns.valuePreferences.slice(0, 3),
                timeEstimationBias: this.learnedPatterns.timeEstimationBias,
                avgInterruptionRecovery: this.learnedPatterns.avgInterruptionRecovery
            },
            appliedOptimizations: this.getAppliedOptimizations()
        };
    },
    
    // 获取能量周期描述
    getEnergyCycleDescription() {
        const creativity = this.learnedPatterns.peakCreativityTime;
        const execution = this.learnedPatterns.peakExecutionTime;
        
        const timeLabels = {
            morning: '早上',
            afternoon: '下午',
            evening: '晚上'
        };
        
        return {
            creativity: creativity ? timeLabels[creativity] + '创意好' : '学习中...',
            execution: execution ? timeLabels[execution] + '执行强' : '学习中...'
        };
    },
    
    // 获取已应用的优化
    getAppliedOptimizations() {
        const optimizations = [];
        
        if (this.learnedPatterns.procrastinationRiskFactors.length > 0) {
            optimizations.push('复杂任务自动提前15分钟提醒');
        }
        
        if (this.learnedPatterns.valuePreferences.length > 0) {
            optimizations.push('高价值任务优先安排在高效时段');
        }
        
        if (this.learnedPatterns.timeEstimationBias > 15) {
            optimizations.push('超长任务自动插入5分钟休息');
        }
        
        if (this.learnedPatterns.avgInterruptionRecovery > 5) {
            optimizations.push('根据你的节奏调整计时器敏感度');
        }
        
        return optimizations;
    },
    
    // 获取任务的智能建议
    getTaskSuggestions(task) {
        const suggestions = [];
        const taskType = task.category || task.type || '其他';
        const complexity = this.getTaskComplexity(task);
        
        // 基于拖延风险的建议
        const isHighRisk = this.learnedPatterns.procrastinationRiskFactors
            .some(f => f.factor.includes(taskType) || (complexity === 'high' && f.factor.includes('复杂度')));
        
        if (isHighRisk) {
            suggestions.push({
                type: 'warning',
                message: '⚠️ 这类任务你容易拖延，建议拆分成小步骤'
            });
        }
        
        // 基于时间估算的建议
        if (this.learnedPatterns.timeEstimationBias > 20) {
            const adjustedDuration = Math.round(task.duration * (1 + this.learnedPatterns.timeEstimationBias / 100));
            suggestions.push({
                type: 'time',
                message: '⏱️ 根据你的习惯，实际可能需要 ' + adjustedDuration + ' 分钟'
            });
        }
        
        // 基于最佳时间的建议
        const isCreative = this.isCreativeTask(task);
        const bestTime = isCreative ? this.learnedPatterns.peakCreativityTime : this.learnedPatterns.peakExecutionTime;
        if (bestTime) {
            const timeLabels = { morning: '上午', afternoon: '下午', evening: '晚上' };
            suggestions.push({
                type: 'timing',
                message: '🎯 建议安排在' + timeLabels[bestTime] + '，这是你的' + (isCreative ? '创意' : '执行') + '高峰期'
            });
        }
        
        return suggestions;
    },
    
    // 辅助方法
    getTimeOfDay(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    },
    
    isCreativeTask(task) {
        const creativeKeywords = ['设计', '创意', '插画', '画', '写', '策划', '构思', '创作'];
        const title = (task.title || '').toLowerCase();
        return creativeKeywords.some(k => title.includes(k));
    },
    
    getTaskComplexity(task) {
        const duration = task.duration || 30;
        const hasSteps = task.steps && task.steps.length > 3;
        
        if (duration > 120 || hasSteps) return 'high';
        if (duration > 45) return 'medium';
        return 'low';
    },
    
    getTaskDurationCategory(duration) {
        if (!duration) return 'medium';
        if (duration > 90) return 'long';
        if (duration > 30) return 'medium';
        return 'short';
    },
    
    saveData() {
        Storage.save('adhd_learning_data', this.learningData);
    }
};

// 导出
window.AILearning = AILearning;

