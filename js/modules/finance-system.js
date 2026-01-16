// ============================================================
// 价值显化系统 v1.0
// 真实收入记录、赚钱效率分析、财务健康管理
// 与智能输入、游戏系统深度联动
// ============================================================

const FinanceSystem = {
    version: '1.0.0',
    
    // ==================== 数据结构 ====================
    
    // 收入记录
    incomes: [],
    
    // 支出记录
    expenses: [],
    
    // 固定支出
    fixedExpenses: [],
    
    // 赚钱项目
    projects: [],
    
    // 赚钱想法
    ideas: [],
    
    // 财务状态
    state: {
        balance: 0,           // 当前余额
        debt: 0,              // 负债
        monthlyGoal: 10000,   // 月目标
        currency: '¥'         // 货币符号
    },
    
    // 设置
    settings: {
        enableNotifications: true,
        enableVoiceAnnounce: true,
        autoCategories: true
    },
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('FinanceSystem 初始化...');
        this.loadData();
        this.setupEventListeners();
        console.log('FinanceSystem 初始化完成');
    },
    
    loadData() {
        this.incomes = JSON.parse(localStorage.getItem('finance_incomes') || '[]');
        this.expenses = JSON.parse(localStorage.getItem('finance_expenses') || '[]');
        this.fixedExpenses = JSON.parse(localStorage.getItem('finance_fixed_expenses') || '[]');
        this.projects = JSON.parse(localStorage.getItem('finance_projects') || '[]');
        this.ideas = JSON.parse(localStorage.getItem('finance_ideas') || '[]');
        
        const savedState = localStorage.getItem('finance_state');
        if (savedState) {
            Object.assign(this.state, JSON.parse(savedState));
        }
        
        const savedSettings = localStorage.getItem('finance_settings');
        if (savedSettings) {
            Object.assign(this.settings, JSON.parse(savedSettings));
        }
        
        // 初始化默认项目
        if (this.projects.length === 0) {
            this.projects = [
                { id: 'design', name: '设计', icon: '🎨', color: '#9B59B6', totalIncome: 0, totalHours: 0 },
                { id: 'coding', name: '编程', icon: '💻', color: '#3498DB', totalIncome: 0, totalHours: 0 },
                { id: 'writing', name: '写作', icon: '✍️', color: '#1ABC9C', totalIncome: 0, totalHours: 0 },
                { id: 'consulting', name: '咨询', icon: '💼', color: '#E67E22', totalIncome: 0, totalHours: 0 },
                { id: 'other', name: '其他', icon: '📦', color: '#95A5A6', totalIncome: 0, totalHours: 0 }
            ];
            this.saveProjects();
        }
    },
    
    saveIncomes() {
        localStorage.setItem('finance_incomes', JSON.stringify(this.incomes.slice(-500)));
    },
    
    saveExpenses() {
        localStorage.setItem('finance_expenses', JSON.stringify(this.expenses.slice(-500)));
    },
    
    saveFixedExpenses() {
        localStorage.setItem('finance_fixed_expenses', JSON.stringify(this.fixedExpenses));
    },
    
    saveProjects() {
        localStorage.setItem('finance_projects', JSON.stringify(this.projects));
    },
    
    saveIdeas() {
        localStorage.setItem('finance_ideas', JSON.stringify(this.ideas));
    },
    
    saveState() {
        localStorage.setItem('finance_state', JSON.stringify(this.state));
    },
    
    saveSettings() {
        localStorage.setItem('finance_settings', JSON.stringify(this.settings));
    },
    
    // ==================== 事件监听 ====================
    
    setupEventListeners() {
        // 监听智能输入的消息
        document.addEventListener('smartInputMessage', (e) => {
            if (e.detail && e.detail.message) {
                this.parseAndRecord(e.detail.message);
            }
        });
        
        // 监听任务完成事件 - 可以关联收入
        document.addEventListener('taskCompleted', (e) => {
            if (e.detail && e.detail.task && e.detail.task.income) {
                this.addIncome({
                    amount: e.detail.task.income,
                    project: e.detail.task.project || 'other',
                    description: `完成任务: ${e.detail.task.title}`,
                    hours: (e.detail.task.duration || 30) / 60
                });
            }
        });
    },
    
    // ==================== 智能解析 ====================
    
    /**
     * 解析用户输入，自动识别收入/支出
     */
    parseAndRecord(text) {
        // 收入关键词
        const incomePatterns = [
            /(?:赚了?|收入|入账|到账|收到|获得|挣了?)[\s]*[¥￥]?(\d+(?:\.\d{1,2})?)/,
            /[¥￥]?(\d+(?:\.\d{1,2})?)[\s]*(?:收入|入账|到账)/,
            /(?:画|做|写|接|完成).*?(?:赚了?|收入|获得)[\s]*[¥￥]?(\d+(?:\.\d{1,2})?)/
        ];
        
        // 支出关键词
        const expensePatterns = [
            /(?:花了?|支出|消费|付了?|买了?)[\s]*[¥￥]?(\d+(?:\.\d{1,2})?)/,
            /[¥￥]?(\d+(?:\.\d{1,2})?)[\s]*(?:支出|消费)/,
            /(?:房租|水电|话费|订阅|会员)[\s]*[¥￥]?(\d+(?:\.\d{1,2})?)/
        ];
        
        // 时间关键词
        const hoursPattern = /(?:花了?|用了?|耗时|做了?)[\s]*(\d+(?:\.\d{1,2})?)[\s]*(?:小时|h|H)/;
        
        // 项目关键词映射
        const projectKeywords = {
            'design': ['插画', '设计', 'UI', 'logo', '海报', '头像', '美术'],
            'coding': ['编程', '代码', '开发', '网站', 'APP', '程序', '软件'],
            'writing': ['写作', '文章', '文案', '稿子', '公众号', '小说'],
            'consulting': ['咨询', '顾问', '培训', '课程', '教学'],
            'other': []
        };
        
        let amount = 0;
        let isIncome = false;
        let isExpense = false;
        let hours = 0;
        let projectId = 'other';
        
        // 检测收入
        for (const pattern of incomePatterns) {
            const match = text.match(pattern);
            if (match) {
                amount = parseFloat(match[1]);
                isIncome = true;
                break;
            }
        }
        
        // 检测支出
        if (!isIncome) {
            for (const pattern of expensePatterns) {
                const match = text.match(pattern);
                if (match) {
                    amount = parseFloat(match[1]);
                    isExpense = true;
                    break;
                }
            }
        }
        
        // 检测时间
        const hoursMatch = text.match(hoursPattern);
        if (hoursMatch) {
            hours = parseFloat(hoursMatch[1]);
        }
        
        // 检测项目类型
        for (const [pid, keywords] of Object.entries(projectKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    projectId = pid;
                    break;
                }
            }
            if (projectId !== 'other') break;
        }
        
        // 记录
        if (isIncome && amount > 0) {
            this.addIncome({
                amount,
                project: projectId,
                description: text,
                hours: hours || 1
            });
            return { type: 'income', amount, project: projectId };
        } else if (isExpense && amount > 0) {
            this.addExpense({
                amount,
                category: this.detectExpenseCategory(text),
                description: text
            });
            return { type: 'expense', amount };
        }
        
        return null;
    },
    
    /**
     * 检测支出类别
     */
    detectExpenseCategory(text) {
        const categories = {
            'rent': ['房租', '租金', '房费'],
            'food': ['吃饭', '外卖', '餐', '食', '饭'],
            'transport': ['交通', '打车', '地铁', '公交', '油费'],
            'subscription': ['订阅', '会员', '月费', '年费'],
            'utilities': ['水电', '电费', '水费', '燃气'],
            'phone': ['话费', '流量', '手机'],
            'shopping': ['购物', '买', '淘宝', '京东'],
            'entertainment': ['娱乐', '电影', '游戏'],
            'other': []
        };
        
        for (const [cat, keywords] of Object.entries(categories)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    return cat;
                }
            }
        }
        return 'other';
    },
    
    // ==================== 收入管理 ====================
    
    /**
     * 添加收入
     */
    addIncome(data) {
        const income = {
            id: 'inc_' + Date.now(),
            amount: data.amount,
            project: data.project || 'other',
            description: data.description || '',
            hours: data.hours || 1,
            date: data.date || new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.incomes.unshift(income);
        this.saveIncomes();
        
        // 更新项目统计
        this.updateProjectStats(income.project, income.amount, income.hours);
        
        // 更新余额
        this.state.balance += income.amount;
        this.saveState();
        
        // 触发事件
        this.emitEvent('incomeAdded', income);
        
        // 语音播报
        if (this.settings.enableVoiceAnnounce && typeof EnhancedTTS !== 'undefined') {
            const project = this.projects.find(p => p.id === income.project);
            const projectName = project ? project.name : '';
            EnhancedTTS.speak(`记录收入${income.amount}元，${projectName}项目`, { emotion: 'happy' });
        }
        
        // 刷新UI
        if (typeof App !== 'undefined' && App.loadValuePanel) {
            App.loadValuePanel();
        }
        
        // 检查是否达成目标
        this.checkGoalProgress();
        
        return income;
    },
    
    /**
     * 更新项目统计
     */
    updateProjectStats(projectId, amount, hours) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.totalIncome = (project.totalIncome || 0) + amount;
            project.totalHours = (project.totalHours || 0) + hours;
            this.saveProjects();
        }
    },
    
    // ==================== 支出管理 ====================
    
    /**
     * 添加支出
     */
    addExpense(data) {
        const expense = {
            id: 'exp_' + Date.now(),
            amount: data.amount,
            category: data.category || 'other',
            description: data.description || '',
            isFixed: data.isFixed || false,
            date: data.date || new Date().toISOString(),
            timestamp: Date.now()
        };
        
        this.expenses.unshift(expense);
        this.saveExpenses();
        
        // 更新余额
        this.state.balance -= expense.amount;
        this.saveState();
        
        // 触发事件
        this.emitEvent('expenseAdded', expense);
        
        // 刷新UI
        if (typeof App !== 'undefined' && App.loadValuePanel) {
            App.loadValuePanel();
        }
        
        return expense;
    },
    
    /**
     * 添加固定支出
     */
    addFixedExpense(data) {
        const fixed = {
            id: 'fix_' + Date.now(),
            name: data.name,
            amount: data.amount,
            category: data.category || 'other',
            dayOfMonth: data.dayOfMonth || 1,
            icon: data.icon || '📅'
        };
        
        this.fixedExpenses.push(fixed);
        this.saveFixedExpenses();
        
        return fixed;
    },
    
    // ==================== 统计计算 ====================
    
    /**
     * 获取今日收入
     */
    getTodayIncome() {
        const today = new Date().toDateString();
        return this.incomes
            .filter(i => new Date(i.date).toDateString() === today)
            .reduce((sum, i) => sum + i.amount, 0);
    },
    
    /**
     * 获取本月收入
     */
    getMonthIncome(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return this.incomes
            .filter(i => {
                const d = new Date(i.date);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .reduce((sum, i) => sum + i.amount, 0);
    },
    
    /**
     * 获取本月支出
     */
    getMonthExpense(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth();
        return this.expenses
            .filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .reduce((sum, e) => sum + e.amount, 0);
    },
    
    /**
     * 获取收入趋势数据（最近6个月）
     */
    getIncomeTrend() {
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthIncome = this.getMonthIncome(date);
            months.push({
                label: `${date.getMonth() + 1}月`,
                value: monthIncome,
                date: date
            });
        }
        
        return months;
    },
    
    /**
     * 获取项目效率排行
     */
    getProjectRanking() {
        return this.projects
            .map(p => ({
                ...p,
                hourlyRate: p.totalHours > 0 ? Math.round(p.totalIncome / p.totalHours) : 0
            }))
            .filter(p => p.totalIncome > 0)
            .sort((a, b) => b.hourlyRate - a.hourlyRate);
    },
    
    /**
     * 获取收入来源分布
     */
    getIncomeDistribution() {
        const distribution = {};
        const monthIncomes = this.incomes.filter(i => {
            const d = new Date(i.date);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        
        monthIncomes.forEach(i => {
            distribution[i.project] = (distribution[i.project] || 0) + i.amount;
        });
        
        return Object.entries(distribution).map(([projectId, amount]) => {
            const project = this.projects.find(p => p.id === projectId) || { name: '其他', icon: '📦', color: '#95A5A6' };
            return {
                id: projectId,
                name: project.name,
                icon: project.icon,
                color: project.color,
                amount
            };
        }).sort((a, b) => b.amount - a.amount);
    },
    
    /**
     * 获取支出分布
     */
    getExpenseDistribution() {
        const categoryNames = {
            'rent': { name: '房租', icon: '🏠', color: '#E74C3C' },
            'food': { name: '餐饮', icon: '🍜', color: '#F39C12' },
            'transport': { name: '交通', icon: '🚗', color: '#3498DB' },
            'subscription': { name: '订阅', icon: '📱', color: '#9B59B6' },
            'utilities': { name: '水电', icon: '💡', color: '#1ABC9C' },
            'phone': { name: '话费', icon: '📞', color: '#E67E22' },
            'shopping': { name: '购物', icon: '🛒', color: '#E91E63' },
            'entertainment': { name: '娱乐', icon: '🎮', color: '#673AB7' },
            'other': { name: '其他', icon: '📦', color: '#95A5A6' }
        };
        
        const distribution = {};
        const monthExpenses = this.expenses.filter(e => {
            const d = new Date(e.date);
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        
        monthExpenses.forEach(e => {
            distribution[e.category] = (distribution[e.category] || 0) + e.amount;
        });
        
        return Object.entries(distribution).map(([cat, amount]) => {
            const info = categoryNames[cat] || categoryNames.other;
            return {
                id: cat,
                ...info,
                amount
            };
        }).sort((a, b) => b.amount - a.amount);
    },
    
    /**
     * 获取固定支出总额
     */
    getTotalFixedExpenses() {
        return this.fixedExpenses.reduce((sum, f) => sum + f.amount, 0);
    },
    
    /**
     * 获取目标进度
     */
    getGoalProgress() {
        const monthIncome = this.getMonthIncome();
        const progress = Math.min(100, Math.round((monthIncome / this.state.monthlyGoal) * 100));
        const remaining = Math.max(0, this.state.monthlyGoal - monthIncome);
        
        // 计算预计达成天数
        const now = new Date();
        const dayOfMonth = now.getDate();
        const dailyAverage = dayOfMonth > 0 ? monthIncome / dayOfMonth : 0;
        const daysToGoal = dailyAverage > 0 ? Math.ceil(remaining / dailyAverage) : 999;
        
        return {
            current: monthIncome,
            goal: this.state.monthlyGoal,
            progress,
            remaining,
            daysToGoal,
            dailyAverage: Math.round(dailyAverage)
        };
    },
    
    /**
     * 检查目标进度
     */
    checkGoalProgress() {
        const progress = this.getGoalProgress();
        
        if (progress.progress >= 100 && this.settings.enableNotifications) {
            // 达成目标！
            if (typeof App !== 'undefined' && App.addChatMessage) {
                App.addChatMessage('system', `🎉 恭喜！你已达成本月收入目标 ${this.state.currency}${this.state.monthlyGoal}！`, '🏆');
            }
            
            // 庆祝动画
            if (typeof CelebrationEffects !== 'undefined') {
                CelebrationEffects.celebrate('confetti');
            }
        }
    },
    
    /**
     * 获取最近收入记录
     */
    getRecentIncomes(limit = 10) {
        return this.incomes.slice(0, limit).map(i => {
            const project = this.projects.find(p => p.id === i.project) || { name: '其他', icon: '📦' };
            return {
                ...i,
                projectName: project.name,
                projectIcon: project.icon,
                hourlyRate: i.hours > 0 ? Math.round(i.amount / i.hours) : 0
            };
        });
    },
    
    /**
     * 获取赚钱热力图数据
     */
    getIncomeHeatmap() {
        const heatmap = {};
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // 初始化
        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 4; hour++) {
                heatmap[`${day}_${hour}`] = 0;
            }
        }
        
        // 统计
        this.incomes.forEach(i => {
            const d = new Date(i.date);
            if (d >= monthStart) {
                const day = d.getDay();
                const hour = Math.floor(d.getHours() / 6); // 0-5, 6-11, 12-17, 18-23
                const key = `${day}_${hour}`;
                heatmap[key] = (heatmap[key] || 0) + i.amount;
            }
        });
        
        return heatmap;
    },
    
    // ==================== 想法管理 ====================
    
    /**
     * 添加赚钱想法
     */
    addIdea(data) {
        const idea = {
            id: 'idea_' + Date.now(),
            title: data.title,
            estimatedIncome: data.estimatedIncome || 0,
            feasibility: data.feasibility || 3,
            status: data.status || 'thinking', // thinking, researching, started, achieved
            notes: data.notes || '',
            createdAt: new Date().toISOString()
        };
        
        this.ideas.unshift(idea);
        this.saveIdeas();
        
        return idea;
    },
    
    /**
     * 更新想法状态
     */
    updateIdeaStatus(ideaId, status) {
        const idea = this.ideas.find(i => i.id === ideaId);
        if (idea) {
            idea.status = status;
            this.saveIdeas();
        }
    },
    
    // ==================== 工具方法 ====================
    
    /**
     * 格式化金额
     */
    formatMoney(amount) {
        if (amount >= 10000) {
            return (amount / 10000).toFixed(1) + '万';
        }
        return amount.toLocaleString();
    },
    
    /**
     * 触发事件
     */
    emitEvent(eventName, data) {
        document.dispatchEvent(new CustomEvent('finance_' + eventName, { detail: data }));
    },
    
    /**
     * 设置月目标
     */
    setMonthlyGoal(amount) {
        this.state.monthlyGoal = amount;
        this.saveState();
        
        if (typeof App !== 'undefined' && App.loadValuePanel) {
            App.loadValuePanel();
        }
    },
    
    /**
     * 更新余额
     */
    setBalance(amount) {
        this.state.balance = amount;
        this.saveState();
        
        if (typeof App !== 'undefined' && App.loadValuePanel) {
            App.loadValuePanel();
        }
    }
};

// 导出
window.FinanceSystem = FinanceSystem;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FinanceSystem.init());
} else {
    FinanceSystem.init();
}

