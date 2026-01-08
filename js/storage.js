// 本地存储管理模块
const Storage = {
    // 存储键名
    KEYS: {
        API_KEY: 'adhd_focus_api_key',
        TASKS: 'adhd_focus_tasks',
        MEMORIES: 'adhd_focus_memories',
        GAME_STATE: 'adhd_focus_game_state',
        PROMPTS: 'adhd_focus_prompts',
        COMPONENT_POSITIONS: 'adhd_focus_positions',
        USER_PROFILE: 'adhd_focus_user_profile'
    },

    // 保存数据
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    // 读取数据
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },

    // 删除数据
    remove(key) {
        localStorage.removeItem(key);
    },

    // API Key 管理
    getApiKey() {
        return this.load(this.KEYS.API_KEY, '');
    },

    setApiKey(key) {
        return this.save(this.KEYS.API_KEY, key);
    },

    // 任务管理
    getTasks() {
        return this.load(this.KEYS.TASKS, []);
    },

    saveTasks(tasks) {
        return this.save(this.KEYS.TASKS, tasks);
    },

    addTask(task) {
        const tasks = this.getTasks();
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        tasks.push(task);
        this.saveTasks(tasks);
        return task;
    },

    updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            this.saveTasks(tasks);
            return tasks[index];
        }
        return null;
    },

    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filtered);
    },

    // 记忆库管理
    getMemories() {
        return this.load(this.KEYS.MEMORIES, []);
    },

    saveMemories(memories) {
        return this.save(this.KEYS.MEMORIES, memories);
    },

    addMemory(memory) {
        const memories = this.getMemories();
        memory.id = Date.now().toString();
        memory.createdAt = new Date().toISOString();
        memories.unshift(memory);
        this.saveMemories(memories);
        return memory;
    },

    // 游戏状态管理
    getGameState() {
        return this.load(this.KEYS.GAME_STATE, {
            coins: 0,
            energy: 10,
            maxEnergy: 10,
            level: 1,
            exp: 0,
            completedTasks: 0,
            achievements: []
        });
    },

    saveGameState(state) {
        return this.save(this.KEYS.GAME_STATE, state);
    },

    addCoins(amount) {
        const state = this.getGameState();
        state.coins += amount;
        this.saveGameState(state);
        return state;
    },

    useEnergy(amount) {
        const state = this.getGameState();
        state.energy = Math.max(0, state.energy - amount);
        this.saveGameState(state);
        return state;
    },

    restoreEnergy(amount) {
        const state = this.getGameState();
        state.energy = Math.min(state.maxEnergy, state.energy + amount);
        this.saveGameState(state);
        return state;
    },

    // 提示词管理
    getPrompts() {
        return this.load(this.KEYS.PROMPTS, {
            taskParse: `你是一个ADHD助手，负责解析用户的自然语言输入。请按以下规则解析：

输入示例："明天下午3点去洗澡然后敷面膜，心情有点烦躁"

输出格式（严格JSON）：
{
  "tasks": [
    {
      "title": "洗澡",
      "date": "YYYY-MM-DD格式的日期",
      "startTime": "HH:mm格式",
      "duration": 30,
      "type": "日常",
      "coins": 5,
      "energyCost": 2,
      "verification": "拍照验证"
    }
  ],
  "memories": [
    {
      "content": "心情有点烦躁",
      "emotion": "anxious",
      "intensity": 0.6,
      "tags": ["情绪", "日常"]
    }
  ],
  "reply": "友好的回复语，包含鼓励"
}

注意：
- 情绪类型只能是：happy/calm/anxious/sad/angry/none
- 如果提到"明天"请转换为具体日期
- 如果有多个连续任务，自动计算后续任务的开始时间
- 金币根据任务难度分配(1-10)，精力消耗(1-5)
- 回复要温暖友好，适合ADHD用户`,

            taskBreakdown: `请将以下任务拆解为可执行的子任务步骤，每个步骤不超过15分钟：

任务：[任务名称]
描述：[任务描述]  
总时长：[总分钟数]

请输出JSON格式：
{
  "steps": [
    {
      "title": "启动步骤名称（5分钟内可完成的简单动作）",
      "duration": 5,
      "difficulty": 1,
      "tip": "小贴士"
    },
    {
      "title": "核心步骤1",
      "duration": 10,
      "difficulty": 3,
      "tip": "小贴士"
    }
  ],
  "totalTime": 总分钟数,
  "encouragement": "完成后的鼓励语"
}

拆解原则：
1. 启动步骤要极其简单（如：打开水龙头、拿起手机）
2. 每个步骤都要具体可执行
3. 难度评分1-5（1最简单）
4. 为ADHD用户设计，降低启动阻力`,

            gapSuggestion: `用户有两个任务之间有[间隔]分钟的空闲时间。

前一个任务：[任务A]
后一个任务：[任务B]
当前精力值：[精力值]/10

请建议3个适合此间隙的活动，输出JSON格式：
{
  "suggestions": [
    {
      "title": "活动名称",
      "type": "rest",
      "duration": 分钟数,
      "energyEffect": +2,
      "reason": "推荐理由"
    },
    {
      "title": "活动名称", 
      "type": "transition",
      "duration": 分钟数,
      "energyEffect": 0,
      "reason": "为下一个任务做准备的理由"
    },
    {
      "title": "微小任务",
      "type": "micro",
      "duration": 分钟数,
      "energyEffect": -1,
      "reason": "利用碎片时间的理由"
    }
  ]
}

类型说明：
- rest: 休息类（恢复精力）
- transition: 过渡类（为下一个任务做准备）
- micro: 微小任务类（利用碎片时间）`,

            emotionAnalysis: `分析以下文本的情绪状态：

文本：[用户输入]

请输出JSON格式：
{
  "emotion": "happy/calm/anxious/sad/angry",
  "intensity": 0.0-1.0之间的数值,
  "causes": ["可能原因1", "可能原因2"],
  "suggestion": "简短的建议或肯定句，温暖友好",
  "emoji": "合适的表情符号"
}

情绪判断标准：
- happy: 开心、兴奋、满足
- calm: 平静、放松、中性
- anxious: 焦虑、烦躁、紧张、担心
- sad: 难过、失落、沮丧
- angry: 生气、愤怒、不满`,

            coinAllocation: `请为以下任务分配金币奖励值（1-20金币）：

任务：[任务名称]
类型：[类型]
预计时长：[分钟]
难度描述：[描述]

考虑因素（针对ADHD用户）：
1. 启动难度（越难启动越多金币）
2. 所需持续专注时间
3. 任务厌恶程度
4. 对长期目标的重要性
5. 紧急程度

输出JSON格式：
{
  "baseCoins": 基础金币(1-10),
  "difficultyBonus": 难度加成(0-5),
  "durationBonus": 时长加成(0-3),
  "importanceBonus": 重要性加成(0-2),
  "totalCoins": 总金币,
  "energyCost": 精力消耗(1-5),
  "reasoning": "分配理由说明"
}`
        });
    },

    savePrompts(prompts) {
        return this.save(this.KEYS.PROMPTS, prompts);
    },

    // 组件位置管理
    getComponentPositions() {
        return this.load(this.KEYS.COMPONENT_POSITIONS, {});
    },

    saveComponentPosition(componentId, position) {
        const positions = this.getComponentPositions();
        positions[componentId] = position;
        this.save(this.KEYS.COMPONENT_POSITIONS, positions);
    },

    // 用户资料
    getUserProfile() {
        return this.load(this.KEYS.USER_PROFILE, {
            name: 'kiikii',
            avatar: ''
        });
    },

    saveUserProfile(profile) {
        return this.save(this.KEYS.USER_PROFILE, profile);
    }
};

// 导出
window.Storage = Storage;
