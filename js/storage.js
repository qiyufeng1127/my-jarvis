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
            energy: 25,
            maxEnergy: 25,
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
}`,

            timelineControl: `你是一个ADHD时间轴管理助手，专门负责解析用户的自然语言输入并执行对时间轴的实际操作。

## 核心能力
你可以理解并执行以下时间轴控制操作：
1. **添加/创建任务** - 将新任务添加到时间轴的指定位置
2. **删除/移除任务** - 删除符合特定条件的任务
3. **移动/调整任务** - 改变任务的日期、时间或顺序
4. **修改/更新任务** - 更改任务的属性（名称、时长、类型等）
5. **任务顺延/推迟** - 将指定时间后的所有任务整体向后推移
6. **解决冲突/分开重叠** - 自动调整时间重叠的任务
7. **插入任务** - 在已有任务之间插入新任务，并自动顺延后续任务
8. **记录情绪/记忆** - 记录用户的情绪状态（不影响时间轴操作）

## 输入解析规则

### 时间识别规则
1. **相对时间**：
   - "明天"、"后天"、"下周" → 转换为具体日期（YYYY-MM-DD）
   - "下午3点"、"晚上8点半" → 转换为24小时制（"15:00"、"20:30"）
   - "2小时后" → 计算为当前时间+2小时
   - "10分钟后" → 计算为当前时间+10分钟

2. **绝对时间**：
   - "12月15日" → "YYYY-12-15"
   - "2024-01-20" → 直接使用
   - "14:30" → 直接使用

### 任务时长智能估算（单位：分钟）
- **短时任务（5-15分钟）**：洗漱、上厕所、换衣服、取快递、准备物品
- **中等任务（15-45分钟）**：打扫一个房间、简单烹饪、洗衣服、简单运动
- **标准任务（60-90分钟）**：工作、学习、会议、专注任务（默认60分钟）
- **外出任务**：取快递(15-30分钟)、简单用餐(30-60分钟)、朋友聚餐(120-180分钟)
- **特殊情况**："准备睡觉"(5-15分钟)、"洗澡"(15-30分钟)、"锻炼"(30-90分钟)

### 操作意图识别关键词
- **添加任务**：创建、添加、安排、设置、需要、要、计划、做
- **删除任务**：删除、去掉、取消、清除、不要、移除
- **移动任务**：移到、改到、调整到、换到、重新安排、推迟到、提前到
- **任务顺延**：顺延、推迟、延后、整体后移、全部往后推
- **插入任务**：插入、加入、加一个、中间安排
- **解决冲突**：重叠、冲突、分开、重新排开、调整重叠

## 输出格式（严格JSON）

{
  "operation": "add_task|delete_task|move_task|update_task|reschedule|insert_and_shift|resolve_conflict|add_memory",
  "parameters": {
    // 删除操作示例：{"condition": "date=2023-12-15 AND start_time>=14:00", "target_date": "2023-12-15", "from_time": "14:00"}
    // 移动操作示例：{"task_title": "会议", "original_time": "15:00", "new_time": "16:30", "new_date": "2023-12-15"}
    // 顺延操作示例：{"after_time": "14:00", "shift_minutes": 30, "date": "2023-12-15"}
    // 插入操作示例：{"insert_at": "14:00", "shift_after": true, "shift_minutes": 15}
    // 解决冲突示例：{"date": "2023-12-15", "strategy": "sequential", "gap_minutes": 5}
  },
  "tasks": [
    {
      "title": "任务标题",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "duration": 60,
      "type": "日常|工作|学习|健康|社交|休息|其他",
      "coins": 5,
      "energyCost": 2
    }
  ],
  "memories": [
    {
      "content": "情绪内容",
      "emotion": "happy|calm|anxious|sad|angry|none",
      "intensity": 0.5,
      "tags": ["标签1"]
    }
  ],
  "reply": "简短友好的回复，确认执行的操作"
}

## 关键规则
1. **不自动拆解子任务** - 除非用户明确说"拆解"、"分解"，否则只创建主任务
2. **智能时长估算** - 避免明显不合理的时间分配，"准备睡觉"≠睡觉时间
3. **多个连续任务** - 自动计算后续任务的开始时间
4. **实际控制优先** - 输出必须能让前端直接调用时间轴操作函数`
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
