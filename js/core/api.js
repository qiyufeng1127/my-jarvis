// ============================================================
// 统一API层 v4.0
// 所有AI服务调用的统一入口
// ============================================================

const UnifiedAPI = {
    // 配置
    config: {
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        maxTokens: 2000,
        temperature: 0.7
    },
    
    // 状态
    isConnected: false,
    lastError: null,
    
    // ==================== 核心方法 ====================
    
    // 获取API Key
    getApiKey() {
        return GlobalState?.user?.apiKey || localStorage.getItem('adhd_focus_api_key') || '';
    },
    
    // 设置API Key
    setApiKey(key) {
        if (GlobalState) {
            GlobalState.user.apiKey = key;
            GlobalState.saveToStorage();
        }
        localStorage.setItem('adhd_focus_api_key', key);
    },
    
    // 检查连接
    async checkConnection() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            this.isConnected = false;
            return false;
        }
        
        try {
            const response = await fetch(`${this.config.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            this.isConnected = response.ok;
            return this.isConnected;
        } catch (e) {
            console.error('API连接检查失败:', e);
            this.isConnected = false;
            return false;
        }
    },
    
    // 通用聊天请求
    async chat(messages, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('未配置API Key');
        }
        
        try {
            const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: options.model || this.config.model,
                    messages: messages,
                    max_tokens: options.maxTokens || this.config.maxTokens,
                    temperature: options.temperature || this.config.temperature
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API请求失败');
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) {
            this.lastError = e.message;
            throw e;
        }
    },
    
    // ==================== 业务方法 ====================
    
    // 解析用户输入（智能分发）
    async parseUserInput(text, context = null) {
        const systemPrompt = this.getParsePrompt();
        const userPrompt = this.buildUserPrompt(text, context);
        
        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
        
        return this.parseResponse(response);
    },
    
    // 语音指令解析
    async parseVoiceCommand(command) {
        const systemPrompt = `你是一个ADHD助手的语音指令解析器。
用户会通过语音给你指令，你需要理解意图并返回结构化的操作指令。

支持的操作类型：
1. start_timer - 开始倒计时/专注
2. complete_task - 完成任务
3. add_task - 添加任务
4. add_income - 记录收入
5. add_expense - 记录支出
6. query_status - 查询状态
7. control_monitor - 控制监控（开始/停止/暂停）
8. unknown - 无法识别

请严格按JSON格式输出：
{
  "action": "操作类型",
  "params": {
    // 操作参数
  },
  "reply": "回复用户的话"
}`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: command }
        ]);
        
        return this.parseJSON(response);
    },
    
    // AI智能安排任务
    async arrangeTasksAI(tasks, currentTime, today) {
        const systemPrompt = `你是一个专业的任务安排助手，擅长优化日程和动线规划。
请根据用户的任务列表，智能安排时间，考虑：
1. 任务类型和体力消耗
2. 动线优化（减少来回走动）
3. 合理的休息间隔
4. 固定时间任务（如用餐）

请严格按JSON格式输出，不要有其他文字。`;

        const userPrompt = `当前时间：${currentTime}
今天日期：${today}

请安排以下任务：
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

输出格式：
{
  "tasks": [
    {
      "title": "任务名称",
      "startTime": "HH:MM",
      "duration": 30,
      "type": "standing/sitting",
      "energyCost": 1-5,
      "location": "位置",
      "coins": 金币数
    }
  ],
  "summary": {
    "totalTasks": 数量,
    "totalDuration": 总分钟,
    "explanation": "安排说明"
  }
}`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
        
        return this.parseJSON(response);
    },
    
    // AI拆解任务步骤
    async breakdownTask(task) {
        const systemPrompt = `你是一个ADHD任务拆解专家。
请将任务拆解为可执行的小步骤，每个步骤不超过15分钟。
第一个步骤必须是"启动步骤"，要极其简单（5分钟内可完成）。

输出JSON格式：
{
  "steps": [
    {
      "title": "步骤名称",
      "duration": 分钟数,
      "difficulty": 1-5,
      "tip": "小贴士"
    }
  ],
  "totalTime": 总分钟,
  "encouragement": "鼓励语"
}`;

        const userPrompt = `请拆解任务：${task.title}
预计时长：${task.duration || 30}分钟
任务描述：${task.description || '无'}`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
        
        return this.parseJSON(response);
    },
    
    // 情绪分析
    async analyzeEmotion(text) {
        const systemPrompt = `分析文本的情绪状态，输出JSON：
{
  "emotion": "happy/calm/anxious/sad/angry/none",
  "intensity": 0.0-1.0,
  "causes": ["可能原因"],
  "suggestion": "建议",
  "emoji": "表情"
}`;

        const response = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ]);
        
        return this.parseJSON(response);
    },
    
    // ==================== 提示词模板 ====================
    
    getParsePrompt() {
        return `你是一个ADHD智能助手，负责解析用户的自然语言输入并智能分发。

你需要判断用户输入的内容类型：
1. 任务/待办 - 需要安排到时间轴
2. 情绪/心情 - 需要记录到记忆库
3. 收入记录 - 需要记录到财务账本
4. 支出记录 - 需要记录到财务账本
5. 想法/笔记 - 需要记录到记忆库
6. 查询/问题 - 需要回答

输出格式（严格JSON）：
{
  "type": "task/emotion/income/expense/note/query",
  "tasks": [
    {
      "title": "任务标题",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "duration": 30,
      "coins": 5,
      "energyCost": 2
    }
  ],
  "memories": [
    {
      "content": "内容",
      "emotion": "happy/calm/anxious/sad/angry/none",
      "intensity": 0.5,
      "tags": ["标签"]
    }
  ],
  "finance": {
    "type": "income/expense",
    "amount": 金额数字,
    "description": "描述",
    "category": "分类"
  },
  "reply": "友好的回复"
}

注意：
- 如果提到"明天"请转换为具体日期
- 金额识别：支持"1500元"、"¥200"、"500块"等格式
- 收入关键词：收入、赚了、卖出、到账、收款
- 支出关键词：花了、买了、支出、付款
- 情绪类型只能是：happy/calm/anxious/sad/angry/none`;
    },
    
    buildUserPrompt(text, context) {
        const now = new Date();
        const today = now.getFullYear() + '-' + 
            (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
            now.getDate().toString().padStart(2, '0');
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
            now.getMinutes().toString().padStart(2, '0');
        
        let prompt = `当前日期：${today}
当前时间：${currentTime}

用户输入：${text}`;

        if (context) {
            prompt += `\n\n上下文信息：${JSON.stringify(context)}`;
        }
        
        return prompt;
    },
    
    // ==================== 工具方法 ====================
    
    // 解析AI响应
    parseResponse(response) {
        try {
            return this.parseJSON(response);
        } catch (e) {
            // 如果解析失败，返回默认结构
            return {
                type: 'query',
                tasks: [],
                memories: [],
                finance: null,
                reply: response
            };
        }
    },
    
    // 解析JSON（处理markdown代码块）
    parseJSON(text) {
        let jsonStr = text.trim();
        
        // 提取JSON代码块
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        
        // 找到JSON对象
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }
        
        return JSON.parse(jsonStr);
    }
};

// 导出
window.UnifiedAPI = UnifiedAPI;

// 兼容旧版AIService
window.AIService = {
    checkConnection: () => UnifiedAPI.checkConnection(),
    parseUserInput: (text, context) => UnifiedAPI.parseUserInput(text, context),
    chat: (messages) => UnifiedAPI.chat(messages),
    breakdownTask: (task) => UnifiedAPI.breakdownTask(task)
};

