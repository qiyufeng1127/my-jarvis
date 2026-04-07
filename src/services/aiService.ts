import { useAIStore } from '@/stores/aiStore';

const resolveApiEndpoint = (endpoint: string) => {
  if (import.meta.env.DEV && endpoint.includes('api.deepseek.com')) {
    return '/ai-api';
  }

  return endpoint;
};

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// AI服务类
class AIService {
  // 调用AI API
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const { config, isConfigured } = useAIStore.getState();

    console.log('🔍 [AI Service] chat 方法被调用');
    console.log('🔍 [AI Service] isConfigured:', isConfigured());
    console.log('🔍 [AI Service] config:', { 
      apiEndpoint: config.apiEndpoint, 
      model: config.model,
      hasApiKey: !!config.apiKey,
      apiKeyLength: config.apiKey?.length 
    });

    if (!isConfigured()) {
      console.error('❌ [AI Service] API未配置');
      return {
        success: false,
        error: '请先在设置中配置 API Key',
      };
    }

    try {
      const requestEndpoint = resolveApiEndpoint(config.apiEndpoint);

      console.log('🔍 [AI Service] 准备发送请求到:', requestEndpoint);
      console.log('🔍 [AI Service] 请求体:', {
        model: config.model,
        messages: messages.map(m => ({ role: m.role, contentLength: m.content.length })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      const response = await fetch(requestEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      console.log('🔍 [AI Service] 收到响应，状态码:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI Service] API返回错误:', errorText);
        
        let errorMessage = '调用AI服务失败';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        return {
          success: false,
          error: `API错误 (${response.status}): ${errorMessage}`,
        };
      }

      const data = await response.json();
      console.log('✅ [AI Service] API调用成功');
      console.log('🔍 [AI Service] 返回数据结构:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0] ? {
          hasMessage: !!data.choices[0].message,
          hasContent: !!data.choices[0].message?.content,
          contentLength: data.choices[0].message?.content?.length
        } : null
      });
      
      const content = data.choices[0]?.message?.content || '';
      console.log('🔍 [AI Service] 提取的内容长度:', content.length);
      
      return {
        success: true,
        content: content,
      };
    } catch (error) {
      console.error('❌ [AI Service] 网络请求异常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 处理语音指令 - 集成所有AI助手功能
  async processVoiceCommand(command: string, tasks: any[]): Promise<{
    type: 'create_tasks' | 'query' | 'delete' | 'update' | 'chat';
    message: string;
    tasks?: any[];
    taskIds?: string[];
    updates?: Array<{ taskId: string; changes: any }>;
  }> {
    console.log('🎤 [语音处理] 收到指令:', command);

    // 模糊匹配 - 查询当前任务
    if (/现在|正在|当前|目前/.test(command) && /任务|做|干/.test(command)) {
      const now = new Date();
      const currentTask = tasks.find(t => {
        if (!t.scheduledStart || !t.scheduledEnd) return false;
        const start = new Date(t.scheduledStart);
        const end = new Date(t.scheduledEnd);
        return now >= start && now <= end && t.status === 'in_progress';
      });

      if (currentTask) {
        const elapsed = Math.floor((now.getTime() - new Date(currentTask.scheduledStart!).getTime()) / 60000);
        return {
          type: 'query',
          message: `当前正在进行${currentTask.title}，已经进行了${elapsed}分钟`,
        };
      } else {
        return {
          type: 'query',
          message: '当前没有正在进行的任务',
        };
      }
    }

    // 模糊匹配 - 查询下一个任务
    if (/下一个|接下来|下个|然后/.test(command) && /任务|做|干/.test(command)) {
      const now = new Date();
      const nextTask = tasks
        .filter(t => t.scheduledStart && new Date(t.scheduledStart) > now)
        .sort((a, b) => new Date(a.scheduledStart!).getTime() - new Date(b.scheduledStart!).getTime())[0];

      if (nextTask) {
        const timeUntil = Math.floor((new Date(nextTask.scheduledStart!).getTime() - now.getTime()) / 60000);
        return {
          type: 'query',
          message: `下一个任务是${nextTask.title}，还有${timeUntil}分钟开始`,
        };
      } else {
        return {
          type: 'query',
          message: '今天没有更多任务了',
        };
      }
    }

    // 模糊匹配 - 删除任务
    if (/删除|清空|取消/.test(command) && /任务/.test(command)) {
      const now = new Date();
      let tasksToDelete: any[] = [];

      if (/今天|今日/.test(command)) {
        tasksToDelete = tasks.filter(t => {
          if (!t.scheduledStart) return false;
          const taskDate = new Date(t.scheduledStart);
          return taskDate.toDateString() === now.toDateString();
        });
      } else if (/昨天/.test(command)) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        tasksToDelete = tasks.filter(t => {
          if (!t.scheduledStart) return false;
          const taskDate = new Date(t.scheduledStart);
          return taskDate.toDateString() === yesterday.toDateString();
        });
      }

      if (tasksToDelete.length > 0) {
        return {
          type: 'delete',
          message: `已删除${tasksToDelete.length}个任务`,
          taskIds: tasksToDelete.map(t => t.id),
        };
      } else {
        return {
          type: 'query',
          message: '没有找到要删除的任务',
        };
      }
    }

    // 模糊匹配 - 创建任务（包含时间延迟）
    if (/分钟|小时|之后|后面|然后/.test(command) || /去|做|完成|开始/.test(command)) {
      console.log('🎤 [语音处理] 识别为创建任务指令');
      
      // 使用AI分解任务
      const result = await this.decomposeTask(command);
      
      if (result.success && result.tasks) {
        return {
          type: 'create_tasks',
          message: `好的，我为您准备了${result.tasks.length}个任务`,
          tasks: result.tasks,
        };
      } else {
        return {
          type: 'chat',
          message: '抱歉，我没有理解您的任务安排，请再说一遍',
        };
      }
    }

    // 默认：使用AI对话
    const response = await this.chatWithUser(command);
    return {
      type: 'chat',
      message: response.content || '抱歉，我没有理解您的意思',
    };
  }

  // 智能识别内容类型并决定分配目标
  async classifyContent(message: string): Promise<{
    contentType: 'task' | 'mood' | 'thought' | 'gratitude' | 'success' | 'startup' | 'timeline_control';
    targetComponent: 'timeline' | 'memory' | 'journal' | 'sidehustle' | 'none';
    emotionTags: string[];
    categoryTags: string[];
    confidence: number;
    reason: string;
    moodDescription?: string; // 新增：心情描述
    moodEmoji?: string; // 新增：心情emoji
  }> {
    const systemPrompt = `你是一个智能内容分类助手，负责分析用户输入并决定应该分配到哪个组件。

请分析以下内容，返回JSON格式：
{
  "contentType": "内容类型",
  "targetComponent": "目标组件",
  "emotionTags": ["情绪标签数组"],
  "categoryTags": ["分类标签数组"],
  "confidence": 0.0-1.0的置信度,
  "reason": "分类理由（简短说明）",
  "moodDescription": "心情描述（如果是心情或碎碎念）",
  "moodEmoji": "心情emoji（如果是心情或碎碎念）"
}

**内容类型（contentType）：**
- task: 待办任务、计划、安排（例如："明天要开会"、"学习英语1小时"、"去健身房"）
- mood: 心情记录（例如："今天很开心"、"感觉有点累"、"心情不错"）
- thought: 碎碎念、想法、灵感、吐槽、抱怨（例如："突然想到一个点子"、"今天的天气真好"、"我刚才去大姨妈了糟死了"、"啊啊啊好烦"）
- gratitude: 感恩内容（例如："感谢朋友的帮助"、"很庆幸遇到你"）
- success: 成功日记（例如："今天完成了项目"、"成功减肥5斤"）
- startup: 创业想法、商业计划（例如："想做一个APP"、"新的商业模式"、"产品创意"）
- timeline_control: 时间轴控制指令（例如："删除今天的任务"、"修改任务时间"、"查看明天的安排"）

**目标组件（targetComponent）：**
- timeline: 时间轴（用于 task 和 timeline_control，以及 mood/thought 的记录卡片）
- memory: 全景记忆栏（用于 mood、thought）
- journal: 成功&感恩日记（用于 gratitude、success）
- sidehustle: 副业追踪（用于 startup）
- none: 不分配（无法识别或不适合任何组件）

**情绪标签（emotionTags）：**
happy, excited, calm, grateful, proud, anxious, sad, angry, frustrated, tired, annoyed, uncomfortable

**分类标签（categoryTags）：**
work, study, life, housework, health, social, hobby, startup, finance, family, personal

**分类规则：**
1. 如果包含明确的时间、地点、动作 → task → timeline
2. 如果表达心情、感受 → mood → memory + timeline（创建记录卡片）
3. 如果是随意的想法、碎碎念、吐槽、抱怨 → thought → memory + timeline（创建记录卡片）
4. 如果表达感恩、感谢 → gratitude → journal
5. 如果记录成功、成就 → success → journal
6. 如果是创业想法、商业计划、产品创意 → startup → sidehustle
7. 如果是控制时间轴的指令 → timeline_control → timeline

**碎碎念识别特征：**
- 口语化表达（"啊啊啊"、"哎呀"、"天哪"、"糟了"）
- 情绪宣泄（"好烦"、"累死了"、"受不了"）
- 生活琐事（"大姨妈"、"肚子疼"、"睡不着"）
- 随意吐槽（"今天真倒霉"、"又迟到了"）

**示例：**
输入："明天下午2点开会"
输出：{"contentType": "task", "targetComponent": "timeline", "emotionTags": [], "categoryTags": ["work"], "confidence": 0.95, "reason": "明确的任务安排"}

输入："今天心情不错，阳光很好"
输出：{"contentType": "mood", "targetComponent": "timeline", "emotionTags": ["happy", "calm"], "categoryTags": ["life"], "confidence": 0.9, "reason": "表达心情感受", "moodDescription": "心情不错", "moodEmoji": "😊"}

输入："我刚才去大姨妈了糟死了都啊啊啊啊"
输出：{"contentType": "thought", "targetComponent": "timeline", "emotionTags": ["frustrated", "uncomfortable"], "categoryTags": ["health", "personal"], "confidence": 0.95, "reason": "碎碎念吐槽", "moodDescription": "不舒服烦躁", "moodEmoji": "😣"}

输入："啊啊啊好烦今天什么都不顺"
输出：{"contentType": "thought", "targetComponent": "timeline", "emotionTags": ["frustrated", "annoyed"], "categoryTags": ["life"], "confidence": 0.92, "reason": "情绪宣泄", "moodDescription": "烦躁", "moodEmoji": "😤"}

**只返回JSON，不要其他内容。**`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    if (!response.success || !response.content) {
      // 如果AI调用失败，返回默认值
      return {
        contentType: 'thought',
        targetComponent: 'memory',
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
        reason: 'AI分析失败，默认分类为碎碎念',
      };
    }

    try {
      let jsonContent = response.content.trim();
      
      // 提取JSON
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }
      
      const result = JSON.parse(jsonContent);
      return {
        contentType: result.contentType || 'thought',
        targetComponent: result.targetComponent || 'timeline',
        emotionTags: result.emotionTags || [],
        categoryTags: result.categoryTags || [],
        confidence: result.confidence || 0,
        reason: result.reason || '',
        moodDescription: result.moodDescription,
        moodEmoji: result.moodEmoji,
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return {
        contentType: 'thought',
        targetComponent: 'timeline',
        emotionTags: [],
        categoryTags: [],
        confidence: 0,
        reason: '解析失败，默认分类为碎碎念',
      };
    }
  }

  // 智能分析消息类型和标签（保留旧方法以兼容）
  async analyzeMessage(message: string): Promise<{
    type?: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude';
    emotionTags: string[];
    categoryTags: string[];
    confidence: number;
  }> {
    // 使用新的 classifyContent 方法
    const result = await this.classifyContent(message);
    
    // 转换为旧格式
    let type: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude' | undefined;
    if (result.contentType === 'task') type = 'todo';
    else if (result.contentType === 'mood') type = 'mood';
    else if (result.contentType === 'thought') type = 'thought';
    else if (result.contentType === 'success') type = 'success';
    else if (result.contentType === 'gratitude') type = 'gratitude';
    
    return {
      type,
      emotionTags: result.emotionTags,
      categoryTags: result.categoryTags,
      confidence: result.confidence,
    };
  }

  // 智能对话
  async chatWithUser(userMessage: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
    const systemPrompt = `你是一个温暖、专业的AI助手，帮助用户管理任务、记录心情、实现目标。

你的特点：
1. 温暖友好，像朋友一样交流
2. 专业高效，能准确理解用户需求
3. 积极正面，给予鼓励和支持
4. 简洁明了，不啰嗦

你可以帮助用户：
- 记录心情和想法
- 创建和管理任务
- 分析情绪和行为模式
- 提供个性化建议
- 关联任务到长期目标

请用简洁、温暖的语气回复用户。`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return await this.chat(messages);
  }

  // 带性格的AI回复（新增）
  async chatWithPersonality(
    userMessage: string,
    context: {
      actionDescription?: string; // 执行的操作描述
      userBehavior?: any; // 用户行为数据
      conversationHistory?: AIMessage[];
    } = {}
  ): Promise<AIResponse> {
    try {
      // 动态导入 personality store
      const { useAIPersonalityStore } = await import('@/stores/aiPersonalityStore');
      const { getSystemPrompt, personality } = useAIPersonalityStore.getState();
      
      // 获取带性格的系统提示词
      const systemPrompt = getSystemPrompt();
      
      // 构建用户消息
      let userPrompt = '';
      
      if (context.actionDescription) {
        userPrompt += `[已执行操作]\n${context.actionDescription}\n\n`;
      }
      
      userPrompt += `[用户输入]\n${userMessage}\n\n`;
      userPrompt += `请用符合你性格的方式回复用户。回复要求：\n`;
      userPrompt += `1. 简短有力，不超过3句话\n`;
      userPrompt += `2. 如果执行了操作，先确认操作，再给出个性化评论\n`;
      userPrompt += `3. 根据用户行为数据，适时监督或鼓励\n`;
      userPrompt += `4. 保持你的性格特征，自然真实\n`;
      
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(context.conversationHistory || []),
        { role: 'user', content: userPrompt },
      ];
      
      return await this.chat(messages);
    } catch (error) {
      console.error('带性格的AI回复失败:', error);
      // 降级到普通回复
      return await this.chatWithUser(userMessage, context.conversationHistory);
    }
  }

  // 智能任务分解
  async decomposeTask(taskDescription: string, currentTime?: Date): Promise<{
    success: boolean;
    tasks?: Array<{
      title: string;
      duration: number;
      startTime?: string;
      category: string;
      priority: 'low' | 'medium' | 'high';
      location?: string;
      tags?: string[];
      goldReward?: number;
    }>;
    error?: string;
  }> {
    console.log('🔍 [AI Service] decomposeTask 被调用');
    console.log('🔍 [AI Service] 任务描述:', taskDescription);
    
    const now = currentTime || new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    console.log('🔍 [AI Service] 当前时间:', currentTimeStr);
    
    // 获取用户已有的标签（优先使用）
    let userTags: string[] = [];
    try {
      const { useTagStore } = await import('@/stores/tagStore');
      const tagStore = useTagStore.getState();
      const allTags = tagStore.getAllTags();
      userTags = allTags.map(tag => tag.name);
      console.log('🔍 [AI Service] 用户已有标签:', userTags);
    } catch (error) {
      console.warn('⚠️ [AI Service] 获取用户标签失败:', error);
    }
    
    // 获取 AI 学习记录
    let learningHints = '';
    try {
      const { useWorkflowStore } = await import('@/stores/workflowStore');
      const workflowStore = useWorkflowStore.getState();
      const records = workflowStore.learningRecords;
      
      if (Object.keys(records).length > 0) {
        learningHints = '\n\n**AI 学习记录（用户偏好）：**\n';
        Object.values(records).forEach(record => {
          if (record.count >= 2) {
            learningHints += `- "${record.taskKeyword}" → ${record.userCorrectedLocation}\n`;
          }
        });
        learningHints += '\n请优先使用用户偏好的位置。';
        console.log('🔍 [AI Service] 应用学习记录:', learningHints);
      }
    } catch (error) {
      console.warn('⚠️ [AI Service] 获取学习记录失败:', error);
    }
    
    const userTagsStr = userTags.length > 0 
      ? `\n\n**用户已有标签（优先使用）：**\n${userTags.join('、')}\n\n请优先从用户已有标签中选择，如果都不适合再创建新标签。`
      : '';
    
    const systemPrompt = `你是一个任务分解专家。用户会描述一个任务或计划，你需要将其分解为**多个独立的**子任务。

**当前时间：${currentTimeStr}**${userTagsStr}${learningHints}

**重要规则：**

1. **识别每个独立的动作和时间段**：
   - "洗漱" 是一个任务
   - "洗衣服" 是另一个任务
   - "在Pinterest找文创设计30分钟" 是一个任务（包含地点+动作+时长）
   - "做文创设计" 是另一个任务
   - **关键词识别**：
     - 时间词："然后"、"接着"、"之后"、"再"、"完了"
     - 地点词："在XX"、"去XX"、"到XX"
     - 动作词："做"、"去"、"完成"、"开始"
   - **每个"然后"、"接着"都表示一个新任务！**
   - 不要合并多个动作！

2. **智能理解时间延迟和时长**：
   - 用户说"5分钟后"、"5分钟之后"、"5 分钟后"（有空格）都是一样的意思
   - **第一个任务开始时间 = 当前时间 + 延迟时间**
   - **重要：严格按照数学计算时间！**
   - 例如：当前时间 01:40，用户说"5分钟后吃药"，吃药任务应该在 **01:45** 开始（01:40 + 5分钟 = 01:45）
   - 例如：当前时间 13:20，用户说"10分钟之后洗漱"，洗漱任务应该在 **13:30** 开始（13:20 + 10分钟 = 13:30）
   - 例如：当前时间 14:00，用户说"5分钟后去洗漱"，洗漱任务应该在 **14:05** 开始（14:00 + 5分钟 = 14:05）
   - **绝对不要返回 14:40 或 14:45！必须是 14:05！**
   - **后续任务 = 前一个任务结束时间**
   - **如果用户明确说了时长（如"30分钟"），使用该时长；否则根据任务类型估算**

3. **智能分配中文标签**（至少2个）：
   ${userTags.length > 0 ? `- **优先从用户已有标签中选择**：${userTags.join('、')}` : ''}
   - 吃药 → ["健康", "日常"]
   - 给猫咪铲粑粑 → ["宠物", "家务"]
   - 洗衣服 → ["家务", "生活"]
   - 在Pinterest找文创设计 → ["设计", "灵感", "工作"]
   - 照相馆工作 → ["照相馆工作", "工作"]（如果用户有自定义标签，优先使用）
   - **不要使用英文标签！全部用中文！**

4. **智能识别位置**（用中文）：
   - 吃药、工作、学习、设计 → "工作区"
   - 洗漱、洗衣服、铲粑粑 → "厕所"
   - 吃饭、洗碗、倒猫粮 → "厨房"
   - 在线活动（Pinterest、小红书等）→ "工作区"

返回JSON格式：
{
  "tasks": [
    {
      "title": "任务标题",
      "duration": 分钟数,
      "startTime": "HH:MM",
      "category": "life",
      "priority": "medium",
      "location": "中文位置",
      "tags": ["中文标签1", "中文标签2"]
    }
  ]
}

**示例1：**
输入："5分钟之后吃药"
当前时间：01:40
输出：
{
  "tasks": [
    {"title": "吃药", "duration": 2, "startTime": "01:45", "category": "life", "priority": "high", "location": "工作区", "tags": ["健康", "日常"]}
  ]
}

**示例2：**
输入："5分钟后给猫咪铲粑粑，然后洗漱，然后洗衣服，然后洗碗"
当前时间：01:40
输出：
{
  "tasks": [
    {"title": "给猫咪铲粑粑", "duration": 5, "startTime": "01:45", "category": "life", "priority": "medium", "location": "厕所", "tags": ["宠物", "家务"]},
    {"title": "洗漱", "duration": 10, "startTime": "01:50", "category": "life", "priority": "medium", "location": "厕所", "tags": ["日常", "生活"]},
    {"title": "洗衣服", "duration": 15, "startTime": "02:00", "category": "life", "priority": "medium", "location": "厕所", "tags": ["家务", "生活"]},
    {"title": "洗碗", "duration": 5, "startTime": "02:15", "category": "life", "priority": "medium", "location": "厨房", "tags": ["家务", "厨房"]}
  ]
}

**示例3：**
输入："5分钟后在Pinterest找文创设计30分钟，然后做文创设计"
当前时间：14:00
输出：
{
  "tasks": [
    {"title": "在Pinterest找文创设计", "duration": 30, "startTime": "14:05", "category": "work", "priority": "medium", "location": "工作区", "tags": ["设计", "灵感", "工作"]},
    {"title": "做文创设计", "duration": 60, "startTime": "14:35", "category": "work", "priority": "high", "location": "工作区", "tags": ["设计", "创作", "工作"]}
  ]
}

**示例4：**
输入："1小时后开会"
当前时间：14:30
输出：
{
  "tasks": [
    {"title": "开会", "duration": 60, "startTime": "15:30", "category": "work", "priority": "high", "location": "工作区", "tags": ["工作", "会议"]}
  ]
}

**只返回JSON，不要其他内容。记住：**
1. **每个独立动作分解成单独任务（识别"然后"、"接着"等关键词）**
2. **正确计算时间（5分钟后 = 当前时间 + 5分钟）**
3. **识别用户明确说的时长（如"30分钟"）**
4. **识别地点+动作的组合（如"在Pinterest找设计"）**
5. 所有标签必须是中文
6. 位置必须是中文
7. **优先使用用户已有的标签**
8. 每个任务至少2个标签`;

    console.log('🔍 [AI Service] 准备调用 chat 方法');

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: taskDescription },
    ]);

    console.log('🔍 [AI Service] chat 方法返回:', response);

    if (!response.success || !response.content) {
      console.error('❌ [AI Service] AI调用失败:', response.error);
      return {
        success: false,
        error: response.error || '任务分解失败',
      };
    }

    try {
      console.log('🔍 [AI Service] 开始解析AI返回内容');
      console.log('🔍 [AI Service] 原始内容:', response.content);
      
      // 尝试提取JSON（有时AI会返回带解释的内容）
      let jsonContent = response.content.trim();
      
      // 如果内容包含```json，提取其中的JSON
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        console.log('🔍 [AI Service] 从代码块中提取JSON');
      } else {
        // 尝试提取{}之间的内容
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
          console.log('🔍 [AI Service] 从文本中提取JSON');
        }
      }
      
      console.log('🔍 [AI Service] 提取后的JSON:', jsonContent);
      
      const result = JSON.parse(jsonContent);
      console.log('🔍 [AI Service] JSON解析成功:', result);
      
      // 验证返回的任务数组
      if (!result.tasks || !Array.isArray(result.tasks)) {
        console.error('❌ [AI Service] AI返回的数据格式不正确:', result);
        return {
          success: false,
          error: 'AI返回的数据格式不正确',
        };
      }
      
      console.log('🔍 [AI Service] 任务数组长度:', result.tasks.length);
      
      // 验证每个任务是否有必要的字段
      let validTasks = result.tasks.filter((task: any) => 
        task.title && typeof task.duration === 'number'
      );
      
      console.log('🔍 [AI Service] 有效任务数量:', validTasks.length);
      
      if (validTasks.length === 0) {
        console.error('❌ [AI Service] 没有有效的任务');
        return {
          success: false,
          error: '没有有效的任务',
        };
      }
      
      // 位置优先级映射
      const locationPriority: Record<string, number> = {
        '工作区': 1,
        'workspace': 1,
        '厕所': 2,
        'bathroom': 2,
        '厨房': 3,
        'kitchen': 3,
        '客厅': 4,
        'livingroom': 4,
        '卧室': 5,
        'bedroom': 5,
        '拍摄间': 6,
        'studio': 6,
        '楼下': 7,
        'downstairs': 7,
      };
      
      // 按位置排序任务
      validTasks.sort((a: any, b: any) => {
        const priorityA = locationPriority[a.location || ''] || 999;
        const priorityB = locationPriority[b.location || ''] || 999;
        return priorityA - priorityB;
      });
      
      console.log('🔍 [AI Service] 任务排序完成');
      
      // 导入金币计算器
      const { smartCalculateGoldReward } = await import('@/utils/goldCalculator');
      
      // 重新计算所有任务的开始时间（确保时间连续）并计算金币
      let currentTime = now;
      validTasks = validTasks.map((task: any, index: number) => {
        let startTime: string;
        
        if (index === 0 && task.startTime) {
          // 第一个任务使用AI返回的时间
          startTime = task.startTime;
          const [hours, minutes] = startTime.split(':').map(Number);
          currentTime = new Date(now);
          currentTime.setHours(hours, minutes, 0, 0);
        } else {
          // 后续任务基于前一个任务的结束时间
          startTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 更新当前时间为下一个任务的开始时间
        currentTime = new Date(currentTime.getTime() + task.duration * 60000);
        
        // 智能计算金币奖励（根据任务类型、标签、标题判断姿势）
        const goldReward = smartCalculateGoldReward(
          task.duration,
          task.category,
          task.tags,
          task.title
        );
        
        console.log(`💰 [金币计算] ${task.title}: ${task.duration}分钟 = ${goldReward}金币`);
        
        return {
          ...task,
          startTime,
          goldReward,
        };
      });
      
      console.log('✅ [AI Service] 任务分解成功，共', validTasks.length, '个任务');
      
      return {
        success: true,
        tasks: validTasks,
      };
    } catch (error) {
      console.error('❌ [AI Service] 解析任务分解结果失败:', error);
      console.error('❌ [AI Service] AI返回内容:', response.content);
      return {
        success: false,
        error: `解析结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 生成成长故事
  async generateGrowthStory(data: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    stats: {
      tasksCompleted: number;
      totalTasks: number;
      focusTime: number;
      goldEarned: number;
      growthPoints: number;
      habits: Array<{ name: string; count: number }>;
    };
  }): Promise<AIResponse> {
    const periodNames = {
      daily: '今日',
      weekly: '本周',
      monthly: '本月',
      yearly: '今年',
    };

    const systemPrompt = `你是一个成长故事作家，擅长用温暖、鼓励的语言讲述用户的成长历程。

根据用户的数据，写一段${periodNames[data.period]}成长故事。

要求：
1. 语言温暖、真诚，像朋友一样
2. 突出亮点和进步
3. 对不足给予理解和鼓励
4. 展望未来，给予信心
5. 200-300字左右
6. 分2-3段，每段之间空一行

数据：
- 完成任务：${data.stats.tasksCompleted}/${data.stats.totalTasks}
- 专注时长：${Math.floor(data.stats.focusTime / 60)}小时${data.stats.focusTime % 60}分钟
- 获得金币：${data.stats.goldEarned}
- 成长值：${data.stats.growthPoints}
- 坏习惯：${data.stats.habits.map(h => `${h.name}(${h.count}次)`).join('、')}

请直接返回故事内容，不要标题。`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成成长故事' },
    ]);
  }

  // 智能建议
  async getSuggestions(context: {
    recentTasks: string[];
    recentMoods: string[];
    goals: string[];
  }): Promise<AIResponse> {
    const systemPrompt = `你是一个个人成长顾问，根据用户的任务、心情和目标，提供个性化建议。

用户信息：
- 最近任务：${context.recentTasks.join('、')}
- 最近心情：${context.recentMoods.join('、')}
- 长期目标：${context.goals.join('、')}

请提供3-5条简洁的建议，每条建议一行，以"• "开头。

建议要：
1. 具体可行
2. 针对性强
3. 积极正面
4. 简洁明了`;

    return await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请给我一些建议' },
    ]);
  }

  // 任务验证 - 图片验证
  async verifyTaskImage(imageBase64: string, requirement: string, taskTitle: string): Promise<{
    success: boolean;
    isValid: boolean;
    confidence: number;
    reason?: string;
    error?: string;
    matchedKeywords?: string[];
    matchedObjects?: string[];
    recognizedObjects?: string[];
  }> {
    try {
      // 优先使用百度图像识别API
      console.log('🔍 [验证] 尝试使用百度图像识别API');
      
      // 获取用户设置中的百度API配置
      let baiduApiKey: string | undefined;
      let baiduSecretKey: string | undefined;
      
      try {
        // 从localStorage读取用户设置
        const settingsStr = localStorage.getItem('user-settings');
        if (settingsStr) {
          const settings = JSON.parse(settingsStr);
          baiduApiKey = settings.baiduApiKey;
          baiduSecretKey = settings.baiduSecretKey;
        }
      } catch (e) {
        console.warn('⚠️ [验证] 读取百度API配置失败:', e);
      }

      // 如果配置了百度API，使用百度图像识别
      if (baiduApiKey && baiduSecretKey) {
        console.log('✅ [验证] 使用百度图像识别API');
        const { baiduImageService } = await import('./baiduImageService');
        
        const result = await baiduImageService.verifyTaskImage(
          imageBase64,
          taskTitle,
          requirement,
          baiduApiKey,
          baiduSecretKey
        );

        if (result.success) {
          return result;
        } else {
          console.warn('⚠️ [验证] 百度API验证失败，降级到AI验证');
        }
      } else {
        console.log('⚠️ [验证] 未配置百度API，使用AI验证');
      }

      // 降级方案：使用AI验证（如果配置了OpenAI等）
      const systemPrompt = `你是一个任务验证专家，负责通过图片验证用户是否真实执行了任务。

**任务信息：**
- 任务标题：${taskTitle}
- 验证要求：${requirement}

**你的职责：**
1. 仔细分析图片内容
2. 判断图片是否符合验证要求
3. 给出验证结果和置信度
4. 如果不通过，说明原因

**验证标准：**
- 图片内容必须与任务相关
- 图片必须清晰可辨认
- 图片不能是网络图片或截图（除非任务要求）
- 图片必须符合验证要求的描述

**返回JSON格式：**
{
  "isValid": true/false,
  "confidence": 0.0-1.0的置信度,
  "reason": "验证结果说明（简短，50字以内）"
}

**示例：**
任务：去健身房锻炼
要求：拍摄健身房内的照片
- ✅ 通过：照片显示健身器材、健身房环境
- ❌ 不通过：照片是家里、户外、或与健身无关的场景

任务：完成作业
要求：上传作业完成截图
- ✅ 通过：截图显示作业内容、完成状态
- ❌ 不通过：截图模糊、内容不相关、或明显是网络图片

**只返回JSON，不要其他内容。**`;

      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `请验证这张图片是否符合任务要求。\n\n图片数据：${imageBase64.substring(0, 100)}...\n\n注意：由于当前模型限制，如果无法直接分析图片，请返回一个基于任务描述的合理判断。` 
        },
      ]);

      if (!response.success || !response.content) {
        return {
          success: false,
          isValid: false,
          confidence: 0,
          error: response.error || '验证失败',
        };
      }

      // 解析AI返回的JSON
      let jsonContent = response.content.trim();
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }

      const result = JSON.parse(jsonContent);

      return {
        success: true,
        isValid: result.isValid || false,
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('❌ [验证] 图片验证失败:', error);
      return {
        success: false,
        isValid: false,
        confidence: 0,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  }

  // 任务验证 - 文件验证
  async verifyTaskFile(fileName: string, fileSize: number, fileType: string, requirement: string, taskTitle: string): Promise<{
    success: boolean;
    isValid: boolean;
    confidence: number;
    reason?: string;
    error?: string;
  }> {
    const systemPrompt = `你是一个任务验证专家，负责通过文件信息验证用户是否真实执行了任务。

**任务信息：**
- 任务标题：${taskTitle}
- 验证要求：${requirement}

**文件信息：**
- 文件名：${fileName}
- 文件大小：${(fileSize / 1024 / 1024).toFixed(2)} MB
- 文件类型：${fileType}

**你的职责：**
1. 分析文件名是否与任务相关
2. 判断文件类型是否符合要求
3. 评估文件大小是否合理
4. 给出验证结果和置信度

**验证标准：**
- 文件名应该与任务内容相关
- 文件类型必须符合验证要求
- 文件大小应该合理（不能太小，说明可能是空文件）
- 文件不能是明显的测试文件（如 test.txt, 111.docx 等）

**返回JSON格式：**
{
  "isValid": true/false,
  "confidence": 0.0-1.0的置信度,
  "reason": "验证结果说明（简短，50字以内）"
}

**示例：**
任务：完成项目报告
要求：上传报告文档
- ✅ 通过：项目报告.docx (2.5MB, Word文档)
- ❌ 不通过：test.txt (1KB, 文本文件) - 文件太小且名称不相关

任务：制作视频
要求：上传视频文件
- ✅ 通过：产品介绍视频.mp4 (50MB, 视频文件)
- ❌ 不通过：111.mp4 (100KB, 视频文件) - 文件太小，可能不是真实视频

**只返回JSON，不要其他内容。**`;

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请验证这个文件是否符合任务要求。' },
      ]);

      if (!response.success || !response.content) {
        return {
          success: false,
          isValid: false,
          confidence: 0,
          error: response.error || '验证失败',
        };
      }

      // 解析AI返回的JSON
      let jsonContent = response.content.trim();
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
        }
      }

      const result = JSON.parse(jsonContent);

      return {
        success: true,
        isValid: result.isValid || false,
        confidence: result.confidence || 0,
        reason: result.reason || '',
      };
    } catch (error) {
      console.error('AI验证文件失败:', error);
      return {
        success: false,
        isValid: false,
        confidence: 0,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  }
}

export const aiService = new AIService();

