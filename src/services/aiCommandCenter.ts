/**
 * AI指挥中枢 - 智能管家系统
 * 
 * 这是整个网站的AI大脑，负责：
 * 1. 理解用户的真实意图（不是关键词匹配）
 * 2. 决定调用哪些功能
 * 3. 协调各个组件的操作
 * 4. 像贾维斯一样智能对话
 */

import { aiService } from './aiService';
import { useTaskStore } from '@/stores/taskStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useGoalStore } from '@/stores/goalStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

/**
 * AI意图识别结果
 */
export interface AIIntent {
  // 用户的真实意图
  intent: string; // 'create_task' | 'record_mutter' | 'delete_task' | 'move_task' | 'query_info' | 'chat' | 'set_goal' | 'record_income' | 'analyze_mood' | 'remind_me' | 'other'
  
  // 置信度
  confidence: number;
  
  // AI的理解
  understanding: string;
  
  // 需要执行的操作
  actions: Array<{
    type: string;
    description: string;
    params: any;
  }>;
  
  // AI的回复
  reply: string;
  
  // 是否需要用户确认
  needsConfirmation: boolean;
}

/**
 * AI指挥中枢类
 */
class AICommandCenter {
  /**
   * 智能处理用户输入
   * 这是核心方法，完全依赖AI的语义理解
   */
  async processUserInput(
    userInput: string,
    context: {
      conversationHistory: Array<{ role: string; content: string }>;
      currentTime: Date;
      userBehavior: any;
      recentTasks: any[];
      recentMemories: any[];
    }
  ): Promise<AIIntent> {
    console.log('🧠 [AI指挥中枢] 开始处理用户输入:', userInput);
    
    // 构建超级智能的系统提示词
    const systemPrompt = this.buildIntelligentSystemPrompt(context);
    
    // 调用AI进行深度理解
    const response = await aiService.chat([
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory.slice(-10), // 保留最近10轮对话
      { role: 'user', content: userInput },
    ]);
    
    if (!response.success || !response.content) {
      console.error('🧠 [AI指挥中枢] AI调用失败');
      return this.getFallbackIntent(userInput);
    }
    
    // 解析AI的响应
    try {
      const intent = this.parseAIResponse(response.content);
      console.log('🧠 [AI指挥中枢] AI理解结果:', intent);
      return intent;
    } catch (error) {
      console.error('🧠 [AI指挥中枢] 解析失败:', error);
      return this.getFallbackIntent(userInput);
    }
  }
  
  /**
   * 构建超级智能的系统提示词
   */
  private buildIntelligentSystemPrompt(context: any): string {
    const { personality } = useAIPersonalityStore.getState();
    const now = context.currentTime;
    const hour = now.getHours();
    
    return `你是${personality.name}，用户的智能AI管家，就像电影《钢铁侠》中的贾维斯一样。

**你的核心能力：**
1. 🧠 **深度语义理解**：你能真正理解用户的意图，而不是简单的关键词匹配
2. 🎯 **智能决策**：你能判断用户需要什么功能，并自动调用
3. 💬 **自然对话**：你能像真人一样聊天，不是机械回复
4. 🔮 **上下文理解**：你记得之前的对话，能理解省略和指代
5. 🎨 **情感识别**：你能感知用户的情绪和心情

**你能管理的功能：**

1. **时间轴管理**
   - 创建任务（智能分解、安排时间、打标签）
   - 删除任务（今天的、昨天的、某个时间段的）
   - 移动任务（改时间、改日期）
   - 修改任务（改标题、改时长、改优先级）
   - 查询任务（今天的、明天的、本周的）

2. **记忆管理**
   - 记录碎碎念（心情、吐槽、随想）
   - 记录日记（成功、感恩）
   - 分析情绪和心情
   - 智能打标签

3. **目标管理**
   - 设置长期目标
   - 关联任务到目标
   - 查询目标进度

4. **副业管理**
   - 记录收入
   - 记录支出
   - 创业想法收集

5. **智能提醒**
   - 根据用户行为主动提醒
   - 监督作息和健康

**当前上下文：**
- 时间：${now.toLocaleString('zh-CN')}
- 时段：${hour < 6 ? '深夜' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上'}
- 最近任务：${context.recentTasks.length}个
- 最近记忆：${context.recentMemories.length}条

**你的性格：**
- 毒舌程度：${personality.toxicity}/100
- 严格程度：${personality.strictness}/100
- 正式程度：${personality.formality}/100
- 称呼用户：${personality.callUserAs}

**重要原则：**
1. **理解真实意图**：不要被表面文字迷惑，要理解用户真正想做什么
2. **智能判断**：自己决定需要调用什么功能，不要问用户
3. **自然对话**：像朋友一样聊天，不要太机械
4. **主动思考**：如果用户说的不清楚，用你的智能去推断
5. **记住上下文**：利用对话历史理解省略和指代

**响应格式（必须返回JSON）：**
\`\`\`json
{
  "intent": "用户意图类型",
  "confidence": 0.95,
  "understanding": "我理解你想要...",
  "actions": [
    {
      "type": "create_task",
      "description": "创建任务：XXX",
      "params": {
        "title": "任务标题",
        "time": "时间",
        "duration": 30,
        "tags": ["标签1", "标签2"]
      }
    }
  ],
  "reply": "好的${personality.callUserAs}，我帮你...",
  "needsConfirmation": false
}
\`\`\`

**意图类型：**
- create_task: 创建任务/日程
- record_mutter: 记录碎碎念/心情/日记
- delete_task: 删除任务
- move_task: 移动/修改任务
- query_info: 查询信息
- set_goal: 设置目标
- record_income: 记录收入/支出
- analyze_mood: 分析心情
- remind_me: 设置提醒
- chat: 纯聊天（不需要执行功能）

**示例1：智能理解任务创建**
用户："待会儿去打扫卫生"
理解：用户想创建一个任务，"待会儿"表示很快，可能是15-30分钟后
\`\`\`json
{
  "intent": "create_task",
  "confidence": 0.95,
  "understanding": "你想在15分钟后开始打扫卫生",
  "actions": [{
    "type": "create_task",
    "description": "创建任务：打扫卫生",
    "params": {
      "title": "打扫卫生",
      "startTime": "15分钟后",
      "duration": 30,
      "location": "厕所",
      "tags": ["家务", "清洁"]
    }
  }],
  "reply": "好的，15分钟后提醒你去打扫卫生。别又找借口拖延啊。",
  "needsConfirmation": false
}
\`\`\`

**示例2：智能理解碎碎念**
用户："我今天大姨妈来了好痛"
理解：这是在吐槽身体不适，不是任务，是碎碎念
\`\`\`json
{
  "intent": "record_mutter",
  "confidence": 0.98,
  "understanding": "你在表达身体不适和痛苦",
  "actions": [{
    "type": "record_mutter",
    "description": "记录碎碎念",
    "params": {
      "content": "我今天大姨妈来了好痛",
      "mood": "不舒服",
      "moodEmoji": "😣",
      "tags": ["健康", "生理期"]
    }
  }],
  "reply": "大姨妈来了确实很难受。多喝热水，好好休息，别硬撑。需要我提醒你吃止痛药吗？",
  "needsConfirmation": false
}
\`\`\`

**示例3：智能理解删除操作**
用户："把今天的任务都删了吧"
理解：用户想删除今天的所有任务
\`\`\`json
{
  "intent": "delete_task",
  "confidence": 0.92,
  "understanding": "你想删除今天的所有任务",
  "actions": [{
    "type": "delete_tasks",
    "description": "删除今天的所有任务",
    "params": {
      "timeRange": "today"
    }
  }],
  "reply": "确定要删除今天的所有任务吗？这可是${context.recentTasks.length}个任务啊。",
  "needsConfirmation": true
}
\`\`\`

**示例4：智能理解纯聊天**
用户："你觉得我今天表现怎么样"
理解：用户在寻求评价和鼓励，不需要执行功能
\`\`\`json
{
  "intent": "chat",
  "confidence": 0.90,
  "understanding": "你想听听我对你今天表现的评价",
  "actions": [],
  "reply": "今天你完成了3个任务，虽然有点拖延，但最后还是搞定了。不错，继续保持。明天能不能更快点？",
  "needsConfirmation": false
}
\`\`\`

**记住：**
1. 你是智能AI，不是关键词匹配机器
2. 要理解用户的真实意图，不要被表面文字迷惑
3. 自己做决策，不要总是问用户
4. 像真人一样对话，保持你的性格
5. 必须返回有效的JSON格式

现在，请分析用户的输入并返回JSON响应。`;
  }
  
  /**
   * 解析AI的响应
   */
  private parseAIResponse(content: string): AIIntent {
    // 提取JSON
    let jsonContent = content.trim();
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
      intent: result.intent || 'chat',
      confidence: result.confidence || 0.5,
      understanding: result.understanding || '',
      actions: result.actions || [],
      reply: result.reply || '',
      needsConfirmation: result.needsConfirmation || false,
    };
  }
  
  /**
   * 降级处理（当AI不可用时）
   */
  private getFallbackIntent(userInput: string): AIIntent {
    // 简单的关键词匹配作为降级方案
    if (/删除|清空/.test(userInput)) {
      return {
        intent: 'delete_task',
        confidence: 0.6,
        understanding: '你想删除任务',
        actions: [],
        reply: '我理解你想删除任务，但AI服务暂时不可用。请稍后再试。',
        needsConfirmation: true,
      };
    }
    
    return {
      intent: 'chat',
      confidence: 0.3,
      understanding: '我不太确定你的意图',
      actions: [],
      reply: '抱歉，我现在有点理解不了。能再说清楚一点吗？',
      needsConfirmation: false,
    };
  }
  
  /**
   * 执行AI决定的操作
   */
  async executeActions(actions: AIIntent['actions']): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];
    
    for (const action of actions) {
      try {
        console.log('🎯 [执行操作]', action.type, action.description);
        
        switch (action.type) {
          case 'create_task':
            const task = await this.createTask(action.params);
            results.push({ type: 'task_created', data: task });
            break;
            
          case 'record_mutter':
            const mutter = await this.recordMutter(action.params);
            results.push({ type: 'mutter_recorded', data: mutter });
            break;
            
          case 'delete_tasks':
            const deleted = await this.deleteTasks(action.params);
            results.push({ type: 'tasks_deleted', data: deleted });
            break;
            
          case 'move_task':
            const moved = await this.moveTask(action.params);
            results.push({ type: 'task_moved', data: moved });
            break;
            
          case 'set_goal':
            const goal = await this.setGoal(action.params);
            results.push({ type: 'goal_set', data: goal });
            break;
            
          case 'record_income':
            const income = await this.recordIncome(action.params);
            results.push({ type: 'income_recorded', data: income });
            break;
            
          default:
            console.warn('🎯 [执行操作] 未知操作类型:', action.type);
        }
      } catch (error) {
        console.error('🎯 [执行操作] 失败:', error);
        errors.push(`${action.description}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    return {
      success: errors.length === 0,
      results,
      errors,
    };
  }
  
  // ==================== 具体功能实现 ====================
  
  private async createTask(params: any) {
    const { createTask } = useTaskStore.getState();
    // 实现任务创建逻辑
    return await createTask(params);
  }
  
  private async recordMutter(params: any) {
    const { addMemory } = useMemoryStore.getState();
    // 实现碎碎念记录逻辑
    return addMemory(params);
  }
  
  private async deleteTasks(params: any) {
    const { deleteTask, tasks } = useTaskStore.getState();
    // 实现任务删除逻辑
    const tasksToDelete = tasks.filter(/* 根据params筛选 */);
    for (const task of tasksToDelete) {
      await deleteTask(task.id);
    }
    return tasksToDelete;
  }
  
  private async moveTask(params: any) {
    const { updateTask } = useTaskStore.getState();
    // 实现任务移动逻辑
    return await updateTask(params.taskId, params.updates);
  }
  
  private async setGoal(params: any) {
    const { createGoal } = useGoalStore.getState();
    // 实现目标设置逻辑
    return createGoal(params);
  }
  
  private async recordIncome(params: any) {
    const { addIncome } = useSideHustleStore.getState();
    // 实现收入记录逻辑
    return addIncome(params);
  }
}

// 导出单例
export const aiCommandCenter = new AICommandCenter();

