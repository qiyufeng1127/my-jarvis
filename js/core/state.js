// ============================================================
// 全局状态管理 v4.0
// 单一数据源，所有组件通过此模块访问和修改状态
// ============================================================

const GlobalState = {
    // 版本
    version: '4.0.0',
    
    // ==================== 核心状态 ====================
    
    // 用户信息
    user: {
        name: 'kiikii',
        avatar: '',
        apiKey: '',
        isConnected: false
    },
    
    // 金币系统（虚拟激励货币）
    coins: {
        balance: 0,           // 当前金币余额
        totalEarned: 0,       // 累计获得
        totalSpent: 0,        // 累计消费
        history: []           // 金币变动历史
    },
    
    // 人民币账本（真实财务）
    finance: {
        balance: 0,           // 当前余额（可为负，表示欠款）
        debt: 0,              // 欠款总额
        monthlyExpense: 0,    // 月固定支出
        monthlyTarget: 0,     // 月收入目标
        todayEarned: 0,       // 今日收入
        totalEarned: 0,       // 累计收入
        history: []           // 收支历史
    },
    
    // 游戏化状态
    game: {
        level: 1,
        exp: 0,
        energy: 25,
        maxEnergy: 25,
        achievements: [],
        streakDays: 0         // 连续打卡天数
    },
    
    // 任务列表
    tasks: [],
    
    // 记忆库
    memories: [],
    
    // 监控状态
    monitor: {
        currentTask: null,        // 当前监控的任务
        isActive: false,          // 是否激活监控
        elapsedSeconds: 0,        // 已过去秒数
        currentCycle: 1,          // 当前循环
        totalPaidCoins: 0,        // 累计扣除金币
        isPaused: false,          // 是否暂停
        pauseEndTime: null        // 暂停结束时间
    },
    
    // 语音助手状态
    assistant: {
        isListening: false,       // 是否在监听
        isEnabled: true,          // 是否启用
        lastCommand: '',          // 最后一条指令
        wakeWord: '嘿助手'        // 唤醒词
    },
    
    // UI状态
    ui: {
        theme: 'light',
        currentView: 'smartInput',
        componentPositions: {},
        componentZIndex: {},
        topZIndex: 100
    },
    
    // ==================== 事件订阅系统 ====================
    
    _listeners: {},
    
    // 订阅状态变化
    subscribe(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        
        // 返回取消订阅函数
        return () => {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        };
    },
    
    // 触发事件
    emit(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`事件处理错误 [${event}]:`, e);
                }
            });
        }
        
        // 同时触发通用变化事件
        if (event !== 'stateChanged') {
            this.emit('stateChanged', { event, data });
        }
    },
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('GlobalState 初始化...');
        this.loadFromStorage();
        this.startAutoSave();
        console.log('GlobalState 初始化完成');
    },
    
    // 从本地存储加载
    loadFromStorage() {
        try {
            // 用户信息
            const savedUser = localStorage.getItem('adhd_user');
            if (savedUser) Object.assign(this.user, JSON.parse(savedUser));
            
            // API Key
            this.user.apiKey = localStorage.getItem('adhd_focus_api_key') || '';
            
            // 金币
            const savedCoins = localStorage.getItem('adhd_coins');
            if (savedCoins) Object.assign(this.coins, JSON.parse(savedCoins));
            
            // 兼容旧版游戏状态
            const oldGameState = localStorage.getItem('adhd_focus_game_state');
            if (oldGameState) {
                const old = JSON.parse(oldGameState);
                this.coins.balance = old.coins || 0;
                this.game.energy = old.energy || 25;
                this.game.maxEnergy = old.maxEnergy || 25;
                this.game.level = old.level || 1;
                this.game.exp = old.exp || 0;
            }
            
            // 财务
            const savedFinance = localStorage.getItem('adhd_finance');
            if (savedFinance) Object.assign(this.finance, JSON.parse(savedFinance));
            
            // 兼容旧版价值显化器
            const oldValueFinance = localStorage.getItem('adhd_value_finance');
            if (oldValueFinance) {
                const old = JSON.parse(oldValueFinance);
                this.finance.debt = old.debt || 0;
                this.finance.monthlyExpense = old.monthlyExpense || 0;
                this.finance.monthlyTarget = old.monthlyTarget || 0;
            }
            
            // 游戏化
            const savedGame = localStorage.getItem('adhd_game');
            if (savedGame) Object.assign(this.game, JSON.parse(savedGame));
            
            // 任务
            const savedTasks = localStorage.getItem('adhd_focus_tasks');
            if (savedTasks) this.tasks = JSON.parse(savedTasks);
            
            // 记忆
            const savedMemories = localStorage.getItem('adhd_focus_memories');
            if (savedMemories) this.memories = JSON.parse(savedMemories);
            
            // UI状态
            const savedUI = localStorage.getItem('adhd_ui');
            if (savedUI) Object.assign(this.ui, JSON.parse(savedUI));
            
            // 组件位置
            const savedPositions = localStorage.getItem('adhd_focus_positions');
            if (savedPositions) this.ui.componentPositions = JSON.parse(savedPositions);
            
            console.log('状态已从本地存储加载');
        } catch (e) {
            console.error('加载状态失败:', e);
        }
    },
    
    // 保存到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('adhd_user', JSON.stringify(this.user));
            localStorage.setItem('adhd_coins', JSON.stringify(this.coins));
            localStorage.setItem('adhd_finance', JSON.stringify(this.finance));
            localStorage.setItem('adhd_game', JSON.stringify(this.game));
            localStorage.setItem('adhd_focus_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('adhd_focus_memories', JSON.stringify(this.memories));
            localStorage.setItem('adhd_ui', JSON.stringify(this.ui));
            localStorage.setItem('adhd_focus_positions', JSON.stringify(this.ui.componentPositions));
            
            // 兼容旧版
            localStorage.setItem('adhd_focus_game_state', JSON.stringify({
                coins: this.coins.balance,
                energy: this.game.energy,
                maxEnergy: this.game.maxEnergy,
                level: this.game.level,
                exp: this.game.exp,
                completedTasks: this.tasks.filter(t => t.completed).length,
                achievements: this.game.achievements
            }));
        } catch (e) {
            console.error('保存状态失败:', e);
        }
    },
    
    // 自动保存（每30秒）
    startAutoSave() {
        setInterval(() => this.saveToStorage(), 30000);
    },
    
    // ==================== 金币操作（统一入口）====================
    
    // 添加金币
    addCoins(amount, reason = '', source = 'unknown') {
        if (amount <= 0) return false;
        
        this.coins.balance += amount;
        this.coins.totalEarned += amount;
        
        // 记录历史
        this.coins.history.push({
            type: 'earn',
            amount: amount,
            reason: reason,
            source: source,
            timestamp: new Date().toISOString()
        });
        
        // 只保留最近200条
        if (this.coins.history.length > 200) {
            this.coins.history = this.coins.history.slice(-200);
        }
        
        this.saveToStorage();
        this.emit('coinsChanged', { balance: this.coins.balance, change: amount, reason });
        
        return true;
    },
    
    // 扣除金币
    deductCoins(amount, reason = '', source = 'unknown') {
        if (amount <= 0) return false;
        
        const actualAmount = Math.min(amount, this.coins.balance);
        this.coins.balance -= actualAmount;
        this.coins.totalSpent += actualAmount;
        
        // 记录历史
        this.coins.history.push({
            type: 'spend',
            amount: -actualAmount,
            reason: reason,
            source: source,
            timestamp: new Date().toISOString()
        });
        
        if (this.coins.history.length > 200) {
            this.coins.history = this.coins.history.slice(-200);
        }
        
        this.saveToStorage();
        this.emit('coinsChanged', { balance: this.coins.balance, change: -actualAmount, reason });
        
        return actualAmount;
    },
    
    // 检查金币是否足够
    hasEnoughCoins(amount) {
        return this.coins.balance >= amount;
    },
    
    // ==================== 人民币操作 ====================
    
    // 记录收入
    addIncome(amount, description = '', category = '其他') {
        if (amount <= 0) return false;
        
        this.finance.todayEarned += amount;
        this.finance.totalEarned += amount;
        this.finance.balance += amount;
        
        // 记录历史
        this.finance.history.push({
            type: 'income',
            amount: amount,
            description: description,
            category: category,
            timestamp: new Date().toISOString()
        });
        
        if (this.finance.history.length > 500) {
            this.finance.history = this.finance.history.slice(-500);
        }
        
        this.saveToStorage();
        this.emit('financeChanged', { type: 'income', amount, description });
        
        return true;
    },
    
    // 记录支出
    addExpense(amount, description = '', category = '其他') {
        if (amount <= 0) return false;
        
        this.finance.balance -= amount;
        
        this.finance.history.push({
            type: 'expense',
            amount: -amount,
            description: description,
            category: category,
            timestamp: new Date().toISOString()
        });
        
        if (this.finance.history.length > 500) {
            this.finance.history = this.finance.history.slice(-500);
        }
        
        this.saveToStorage();
        this.emit('financeChanged', { type: 'expense', amount, description });
        
        return true;
    },
    
    // 人民币兑换金币
    exchangeToCoins(yuanAmount, exchangeRate = 1) {
        if (yuanAmount <= 0 || this.finance.balance < yuanAmount) {
            return { success: false, message: '余额不足' };
        }
        
        const coinsToAdd = Math.floor(yuanAmount * exchangeRate);
        
        // 扣除人民币
        this.finance.balance -= yuanAmount;
        this.finance.history.push({
            type: 'exchange',
            amount: -yuanAmount,
            description: `兑换 ${coinsToAdd} 金币`,
            category: '兑换',
            timestamp: new Date().toISOString()
        });
        
        // 添加金币
        this.addCoins(coinsToAdd, `从 ¥${yuanAmount} 兑换`, 'exchange');
        
        this.saveToStorage();
        this.emit('exchangeCompleted', { yuan: yuanAmount, coins: coinsToAdd });
        
        return { success: true, coins: coinsToAdd };
    },
    
    // ==================== 任务操作 ====================
    
    // 添加任务
    addTask(task) {
        const newTask = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            completed: false,
            ...task
        };
        
        this.tasks.push(newTask);
        this.saveToStorage();
        this.emit('taskAdded', newTask);
        
        return newTask;
    },
    
    // 更新任务
    updateTask(taskId, updates) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) return null;
        
        this.tasks[index] = { ...this.tasks[index], ...updates };
        this.saveToStorage();
        this.emit('taskUpdated', this.tasks[index]);
        
        return this.tasks[index];
    },
    
    // 完成任务
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return null;
        
        task.completed = true;
        task.completedAt = new Date().toISOString();
        
        // 使用金币规则引擎计算奖励
        const reward = CoinEngine.calculateTaskReward(task);
        if (reward > 0) {
            this.addCoins(reward, `完成任务: ${task.title}`, 'task_complete');
        }
        
        this.saveToStorage();
        this.emit('taskCompleted', { task, reward });
        
        return { task, reward };
    },
    
    // 删除任务
    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) return false;
        
        const task = this.tasks.splice(index, 1)[0];
        this.saveToStorage();
        this.emit('taskDeleted', task);
        
        return true;
    },
    
    // 获取今日任务
    getTodayTasks() {
        const today = this.formatDate(new Date());
        return this.tasks.filter(t => t.date === today);
    },
    
    // ==================== 记忆库操作 ====================
    
    // 添加记忆
    addMemory(memory) {
        const newMemory = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...memory
        };
        
        this.memories.unshift(newMemory);
        
        // 只保留最近500条
        if (this.memories.length > 500) {
            this.memories = this.memories.slice(0, 500);
        }
        
        this.saveToStorage();
        this.emit('memoryAdded', newMemory);
        
        return newMemory;
    },
    
    // ==================== 能量操作 ====================
    
    // 消耗能量
    useEnergy(amount) {
        const actual = Math.min(amount, this.game.energy);
        this.game.energy -= actual;
        this.saveToStorage();
        this.emit('energyChanged', { energy: this.game.energy, change: -actual });
        return actual;
    },
    
    // 恢复能量
    restoreEnergy(amount) {
        const actual = Math.min(amount, this.game.maxEnergy - this.game.energy);
        this.game.energy += actual;
        this.saveToStorage();
        this.emit('energyChanged', { energy: this.game.energy, change: actual });
        return actual;
    },
    
    // ==================== 工具方法 ====================
    
    formatDate(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + 
               (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               d.getDate().toString().padStart(2, '0');
    },
    
    // 获取状态快照（用于调试）
    getSnapshot() {
        return {
            user: { ...this.user, apiKey: '***' },
            coins: { ...this.coins },
            finance: { ...this.finance },
            game: { ...this.game },
            tasksCount: this.tasks.length,
            memoriesCount: this.memories.length,
            monitor: { ...this.monitor },
            assistant: { ...this.assistant }
        };
    }
};

// ============================================================
// 金币规则引擎 - 统一的金币计算逻辑
// ============================================================

const CoinEngine = {
    // 配置
    config: {
        // 任务完成奖励
        taskBase: 5,              // 基础奖励
        taskPerMinute: 0.5,       // 每分钟额外奖励
        taskDifficultyMultiplier: 1.2,  // 难度系数
        taskEfficiencyBonus: 2,   // 效率加成（提前完成）
        
        // 拖延惩罚
        procrastinationBase: 5,   // 基础扣除
        procrastinationIncrement: 1.5,  // 递增系数
        procrastinationMax: 50,   // 最大扣除
        
        // 启动奖励
        startupReward: 3,         // 按时启动奖励
        quickStartBonus: 2,       // 快速启动额外奖励（30秒内）
        
        // 习惯打卡
        habitBase: 10,            // 习惯打卡基础
        streakBonus: 1,           // 连续打卡每天额外
        streakMax: 20,            // 连续打卡最大额外
        
        // 兑换比率
        exchangeRate: 1           // 1元 = 1金币
    },
    
    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('adhd_coin_config');
        if (saved) {
            Object.assign(this.config, JSON.parse(saved));
        }
    },
    
    // 保存配置
    saveConfig() {
        localStorage.setItem('adhd_coin_config', JSON.stringify(this.config));
    },
    
    // 计算任务完成奖励
    calculateTaskReward(task) {
        let reward = this.config.taskBase;
        
        // 时长加成
        const duration = task.duration || 30;
        reward += Math.floor(duration * this.config.taskPerMinute);
        
        // 难度加成
        const difficulty = task.difficulty || 1;
        if (difficulty > 1) {
            reward = Math.floor(reward * Math.pow(this.config.taskDifficultyMultiplier, difficulty - 1));
        }
        
        // 任务自带金币值
        if (task.coins && task.coins > 0) {
            reward = task.coins;
        }
        
        // 效率加成（如果提前完成）
        if (task.completedAt && task.startTime) {
            const plannedEnd = this.addMinutes(task.startTime, duration);
            const actualEnd = new Date(task.completedAt);
            const plannedEndDate = this.parseTime(plannedEnd, task.date);
            
            if (actualEnd < plannedEndDate) {
                reward += this.config.taskEfficiencyBonus;
            }
        }
        
        return Math.max(1, Math.floor(reward));
    },
    
    // 计算拖延惩罚
    calculateProcrastinationPenalty(cycle) {
        const penalty = Math.floor(
            this.config.procrastinationBase * 
            Math.pow(this.config.procrastinationIncrement, cycle - 1)
        );
        return Math.min(penalty, this.config.procrastinationMax);
    },
    
    // 计算启动奖励
    calculateStartupReward(elapsedSeconds) {
        let reward = this.config.startupReward;
        
        if (elapsedSeconds < 30) {
            reward += this.config.quickStartBonus;
        } else if (elapsedSeconds < 60) {
            reward += 1;
        }
        
        return reward;
    },
    
    // 计算习惯打卡奖励
    calculateHabitReward(streakDays) {
        const streakBonus = Math.min(
            streakDays * this.config.streakBonus,
            this.config.streakMax
        );
        return this.config.habitBase + streakBonus;
    },
    
    // 工具方法
    addMinutes(timeStr, minutes) {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return newH.toString().padStart(2, '0') + ':' + newM.toString().padStart(2, '0');
    },
    
    parseTime(timeStr, dateStr) {
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date(dateStr);
        date.setHours(h, m, 0, 0);
        return date;
    }
};

// 导出
window.GlobalState = GlobalState;
window.CoinEngine = CoinEngine;

// 注意：不自动初始化，由 app-main.js 统一管理
// 如果需要手动初始化，调用 GlobalState.init()

