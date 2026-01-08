// AI财务智能感知模块
const AIFinance = {
    // 财务数据
    financeData: {
        // 收入记录
        income: {
            records: [],
            byMonth: {},
            bySource: {},
            patterns: []
        },
        // 支出记录
        expenses: {
            fixed: [],      // 固定支出（房租、信用卡等）
            variable: [],   // 可变支出
            upcoming: [],   // 即将到来的支出
            byCategory: {}
        },
        // 财务目标
        goals: {
            monthlySavings: 0,
            emergencyFund: 0,
            dailyMinimum: 0
        },
        // 统计数据
        stats: {
            avgMonthlyIncome: 0,
            avgMonthlyExpense: 0,
            incomeVolatility: 0,
            safetyBuffer: 0
        }
    },
    
    // 初始化
    init() {
        const savedData = Storage.load('adhd_finance_data', null);
        if (savedData) {
            this.financeData = { ...this.financeData, ...savedData };
        }
        
        // 启动财务监控
        this.startFinanceMonitoring();
        
        // 检查即将到来的支出
        this.checkUpcomingExpenses();
        
        console.log('AI财务模块初始化完成');
    },
    
    // 启动财务监控
    startFinanceMonitoring() {
        // 每小时检查一次财务状况
        setInterval(() => this.checkFinancialHealth(), 60 * 60 * 1000);
        
        // 监听聊天消息中的财务信息
        document.addEventListener('chatMessage', (e) => {
            this.parseFinanceFromChat(e.detail.message);
        });
    },
    
    // 从聊天中解析财务信息
    parseFinanceFromChat(message) {
        if (!message) return;
        
        // 解析收入信息
        const incomePatterns = [
            /(\d+)\s*[元块].*?(插画|摄影|设计|文案|运营|项目|工作)/i,
            /(插画|摄影|设计|文案|运营|项目|工作).*?(\d+)\s*[元块]/i,
            /收入.*?(\d+)/i,
            /赚.*?(\d+)/i
        ];
        
        for (const pattern of incomePatterns) {
            const match = message.match(pattern);
            if (match) {
                const amount = parseInt(match[1]) || parseInt(match[2]);
                if (amount > 0 && amount < 100000) {
                    const source = match[2] || match[1] || '其他';
                    this.recordIncome(amount, typeof source === 'string' ? source : '任务收入');
                    break;
                }
            }
        }
        
        // 解析支出信息
        const expensePatterns = [
            /房租.*?(\d+)/i,
            /信用卡.*?(\d+)/i,
            /还款.*?(\d+)/i,
            /交.*?(\d+).*?(房租|水电|网费)/i,
            /要[付交].*?(\d+)/i
        ];
        
        for (const pattern of expensePatterns) {
            const match = message.match(pattern);
            if (match) {
                const amount = parseInt(match[1]);
                if (amount > 0) {
                    const category = this.detectExpenseCategory(message);
                    this.recordExpense(amount, category, message.includes('每月') || message.includes('固定'));
                    break;
                }
            }
        }
    },
    
    // 检测支出类别
    detectExpenseCategory(text) {
        if (text.includes('房租') || text.includes('租金')) return '房租';
        if (text.includes('信用卡') || text.includes('还款')) return '信用卡';
        if (text.includes('水电') || text.includes('电费') || text.includes('水费')) return '水电';
        if (text.includes('网费') || text.includes('话费')) return '通讯';
        if (text.includes('吃') || text.includes('餐') || text.includes('外卖')) return '餐饮';
        return '其他';
    },
    
    // 记录收入
    recordIncome(amount, source, date = new Date()) {
        const record = {
            id: 'income_' + Date.now(),
            amount,
            source,
            date: date.toISOString(),
            month: this.getMonthKey(date)
        };
        
        this.financeData.income.records.push(record);
        
        // 按月统计
        const monthKey = record.month;
        if (!this.financeData.income.byMonth[monthKey]) {
            this.financeData.income.byMonth[monthKey] = 0;
        }
        this.financeData.income.byMonth[monthKey] += amount;
        
        // 按来源统计
        if (!this.financeData.income.bySource[source]) {
            this.financeData.income.bySource[source] = 0;
        }
        this.financeData.income.bySource[source] += amount;
        
        // 更新统计
        this.updateStats();
        this.saveData();
        
        // 广播收入事件
        this.broadcastFinanceUpdate('income', record);
    },
    
    // 记录支出
    recordExpense(amount, category, isFixed = false, dueDate = null) {
        const record = {
            id: 'expense_' + Date.now(),
            amount,
            category,
            isFixed,
            dueDate: dueDate ? dueDate.toISOString() : null,
            createdAt: new Date().toISOString()
        };
        
        if (isFixed) {
            // 检查是否已存在同类固定支出
            const existingIndex = this.financeData.expenses.fixed
                .findIndex(e => e.category === category);
            if (existingIndex >= 0) {
                this.financeData.expenses.fixed[existingIndex] = record;
            } else {
                this.financeData.expenses.fixed.push(record);
            }
        } else {
            this.financeData.expenses.variable.push(record);
        }
        
        // 按类别统计
        if (!this.financeData.expenses.byCategory[category]) {
            this.financeData.expenses.byCategory[category] = 0;
        }
        this.financeData.expenses.byCategory[category] += amount;
        
        this.updateStats();
        this.saveData();
    },
    
    // 添加即将到来的支出
    addUpcomingExpense(amount, category, dueDate, description = '') {
        const expense = {
            id: 'upcoming_' + Date.now(),
            amount,
            category,
            dueDate: dueDate.toISOString(),
            description,
            reminded: false
        };
        
        this.financeData.expenses.upcoming.push(expense);
        this.saveData();
        
        return expense;
    },
    
    // 检查即将到来的支出
    checkUpcomingExpenses() {
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        const upcomingAlerts = [];
        
        // 检查固定支出（假设每月同一天）
        this.financeData.expenses.fixed.forEach(expense => {
            // 简单假设固定支出在每月1号或25号
            const dayOfMonth = now.getDate();
            const daysUntilDue = expense.category === '信用卡' ? 
                (25 - dayOfMonth + 30) % 30 : 
                (1 - dayOfMonth + 30) % 30;
            
            if (daysUntilDue <= 3 && daysUntilDue > 0) {
                upcomingAlerts.push({
                    ...expense,
                    daysUntil: daysUntilDue
                });
            }
        });
        
        // 检查手动添加的即将支出
        this.financeData.expenses.upcoming.forEach(expense => {
            const dueDate = new Date(expense.dueDate);
            const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 3 && daysUntil > 0 && !expense.reminded) {
                upcomingAlerts.push({
                    ...expense,
                    daysUntil
                });
                expense.reminded = true;
            }
        });
        
        // 生成提醒
        if (upcomingAlerts.length > 0) {
            this.generateExpenseAlert(upcomingAlerts);
        }
        
        this.saveData();
    },
    
    // 生成支出提醒
    generateExpenseAlert(alerts) {
        const totalAmount = alerts.reduce((sum, a) => sum + a.amount, 0);
        const minDays = Math.min(...alerts.map(a => a.daysUntil));
        const dailyNeeded = Math.ceil(totalAmount / minDays);
        
        const alertMessage = {
            type: 'expense_warning',
            title: '💰 财务提醒',
            content: this.formatExpenseAlert(alerts, totalAmount, dailyNeeded),
            suggestions: this.getIncomeSuggestions(dailyNeeded),
            urgency: minDays <= 1 ? 'high' : 'medium'
        };
        
        // 广播提醒
        this.broadcastFinanceUpdate('alert', alertMessage);
        
        // 显示在聊天中
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', alertMessage.content, '💰');
        }
    },
    
    // 格式化支出提醒
    formatExpenseAlert(alerts, total, dailyNeeded) {
        let message = '检测到即将到来的支出：\n\n';
        
        alerts.forEach(alert => {
            message += `• ${alert.category}：¥${alert.amount}（${alert.daysUntil}天后）\n`;
        });
        
        message += `\n📊 总计：¥${total}\n`;
        message += `📅 每日需完成：¥${dailyNeeded}\n\n`;
        message += '💡 建议优先接高单价项目';
        
        return message;
    },
    
    // 获取收入建议
    getIncomeSuggestions(dailyNeeded) {
        const suggestions = [];
        const sources = Object.entries(this.financeData.income.bySource)
            .sort((a, b) => b[1] - a[1]);
        
        if (sources.length > 0) {
            const topSource = sources[0][0];
            suggestions.push(`优先安排${topSource}类任务`);
        }
        
        if (dailyNeeded > 500) {
            suggestions.push('考虑接急单或加价项目');
        }
        
        return suggestions;
    },
    
    // 更新统计数据
    updateStats() {
        const income = this.financeData.income;
        const expenses = this.financeData.expenses;
        
        // 计算平均月收入
        const monthlyIncomes = Object.values(income.byMonth);
        if (monthlyIncomes.length > 0) {
            this.financeData.stats.avgMonthlyIncome = 
                Math.round(monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length);
        }
        
        // 计算固定月支出
        const fixedTotal = expenses.fixed.reduce((sum, e) => sum + e.amount, 0);
        this.financeData.stats.avgMonthlyExpense = fixedTotal;
        
        // 计算每日最低需求
        const daysInMonth = 30;
        this.financeData.goals.dailyMinimum = Math.ceil(fixedTotal / daysInMonth);
        
        // 计算安全缓冲
        this.financeData.stats.safetyBuffer = 
            this.financeData.stats.avgMonthlyIncome - fixedTotal;
    },
    
    // 获取财务仪表盘数据
    getDashboardData() {
        const now = new Date();
        const currentMonth = this.getMonthKey(now);
        const dayOfMonth = now.getDate();
        const daysRemaining = 30 - dayOfMonth;
        
        // 本月收入
        const monthlyIncome = this.financeData.income.byMonth[currentMonth] || 0;
        
        // 本月目标
        const monthlyTarget = this.financeData.stats.avgMonthlyExpense * 1.2; // 支出的1.2倍
        
        // 进度
        const progress = monthlyTarget > 0 ? Math.round((monthlyIncome / monthlyTarget) * 100) : 0;
        
        // 剩余需要
        const remaining = Math.max(0, monthlyTarget - monthlyIncome);
        const dailyNeeded = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0;
        
        return {
            monthlyIncome,
            monthlyTarget,
            progress,
            remaining,
            dailyNeeded,
            daysRemaining,
            fixedExpenses: this.financeData.expenses.fixed,
            topIncomeSources: this.getTopIncomeSources(),
            healthStatus: this.getFinancialHealthStatus(progress)
        };
    },
    
    // 获取收入来源排行
    getTopIncomeSources() {
        return Object.entries(this.financeData.income.bySource)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([source, amount]) => ({ source, amount }));
    },
    
    // 获取财务健康状态
    getFinancialHealthStatus(progress) {
        if (progress >= 100) return { status: 'excellent', label: '超额完成', color: '#27AE60' };
        if (progress >= 80) return { status: 'good', label: '进度良好', color: '#2ECC71' };
        if (progress >= 50) return { status: 'normal', label: '正常进度', color: '#F39C12' };
        if (progress >= 30) return { status: 'warning', label: '需要加速', color: '#E67E22' };
        return { status: 'danger', label: '进度落后', color: '#E74C3C' };
    },
    
    // 检查财务健康
    checkFinancialHealth() {
        const dashboard = this.getDashboardData();
        
        // 如果进度落后，主动提醒
        if (dashboard.progress < 50 && dashboard.daysRemaining < 15) {
            this.generateHealthAlert(dashboard);
        }
    },
    
    // 生成健康提醒
    generateHealthAlert(dashboard) {
        const message = `📊 本月收入进度：${dashboard.progress}%\n\n` +
            `已完成：¥${dashboard.monthlyIncome}\n` +
            `目标：¥${dashboard.monthlyTarget}\n` +
            `剩余${dashboard.daysRemaining}天，每天需要：¥${dashboard.dailyNeeded}\n\n` +
            `💪 加油，你可以的！`;
        
        if (typeof App !== 'undefined') {
            App.addChatMessage('system', message, '📊');
        }
    },
    
    // 广播财务更新
    broadcastFinanceUpdate(type, data) {
        const event = new CustomEvent('financeUpdate', {
            detail: { type, data }
        });
        document.dispatchEvent(event);
    },
    
    // 工具方法
    getMonthKey(date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0');
    },
    
    saveData() {
        Storage.save('adhd_finance_data', this.financeData);
    }
};

// 导出
window.AIFinance = AIFinance;

