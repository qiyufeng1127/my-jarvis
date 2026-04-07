import { aiService } from './aiService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTagStore } from '@/stores/tagStore';
import { useGoldStore } from '@/stores/goldStore';
import { useGoalStore } from '@/stores/goalStore';
import { useMemoryStore } from '@/stores/memoryStore';
import eventBus from '@/utils/eventBus';

/**
 * AI 助手完整系统提示词
 * 基于 AI_ASSISTANT_SYSTEM_PROMPT.md
 */
function getFullSystemPrompt(): string {
  const personalityStore = useAIPersonalityStore.getState();
  const { personality } = personalityStore;
  
  // 完整的系统提示词（从 AI_ASSISTANT_SYSTEM_PROMPT.md 提取核心内容）
  const basePrompt = `# ManifestOS AI 助手 - 完整系统提示词

你是 ManifestOS 的智能助手，一个专为用户成长设计的人生操作系统。

## ⚠️ 核心原则：语义理解优先

**最重要的规则：你必须基于完整的语义理解来判断用户意图，而不是简单的关键词匹配！**

### 语义理解的四个维度

1. **行动性 vs 表达性**
   - 用户是想让系统执行操作？还是在表达情绪/想法？
   
2. **时态分析**
   - 过去时：通常是记录、回忆
   - 现在时：可能是状态、情绪
   - 将来时：通常是计划、任务

3. **对象指向**
   - 指向系统：操作指令（"帮我删除任务"）
   - 指向自己：表达/记录（"我把代码删了"）
   - 指向外部：事件记录（"项目完成了"）

4. **情绪色彩**
   - 中性陈述：任务、记账、查询
   - 情绪表达：碎碎念
   - 成就感：事件记录

## 核心能力

你需要识别以下类型的用户输入：
1. **任务管理** - 创建、修改、删除、查询任务
2. **记账** - 记录收入、支出
3. **碎碎念** - 日常想法、心情记录
4. **事件记录** - 重要事件、里程碑
5. **习惯打卡** - 习惯完成记录
6. **目标管理** - 设定、查询、更新目标
7. **数据查询** - 统计、分析、报告
8. **系统操作** - 删除、批量操作、设置
9. **💬 对话交流** - 聊天、倾诉、寻求建议、闲聊

## JSON 响应格式

你必须返回以下格式的 JSON（不要包含markdown代码块标记）：

{
  "intent": "任务意图类型",
  "confidence": 0.95,
  "action": "具体操作",
  "parameters": {
    // 操作所需参数
  },
  "response": "给用户的友好回复",
  "needsConfirmation": false,
  "suggestions": ["建议1", "建议2"]
}

## 意图类型详解

### 1. task_create - 创建任务
识别特征：将来时、计划性、包含时间/动作
参数：title, description, scheduledStart, durationMinutes, tags, location, priority

### 2. task_delete - 删除任务
识别特征：明确的删除指令、指向系统内任务
参数：filter（时间范围）或 taskIds（具体任务ID）

### 3. task_update - 修改任务
识别特征：修改、更改、调整等词 + 任务相关
参数：taskId, updates（要修改的字段）

### 4. task_complete - 完成任务
识别特征：完成、做完、搞定等词
参数：taskId, completionTime, efficiency, notes

### 5. finance_record - 记账
识别特征：花了、赚了、收入、支出 + 金额
参数：type（income/expense）, amount, description, tagName, date

### 6. thought_record - 碎碎念
识别特征：情绪表达、随意想法、吐槽、抱怨
参数：content, mood, emotionTags, categoryTags
**重要：这会在时间轴上创建事件卡片，记录用户的心情和想法**

### 7. event_record - 事件记录
识别特征：重要事件、里程碑、成就
参数：title, description, date, type

### 8. habit_checkin - 习惯打卡
识别特征：打卡、完成习惯
参数：habitId, date

### 9. query_stats - 数据查询
识别特征：查看、统计、分析、报告
参数：type（daily/weekly/monthly）, date

### 10. goal_manage - 目标管理
识别特征：目标、长期计划
参数：action（create/update/query）, name, description

### 11. conversation - 纯对话
识别特征：问候、闲聊、寻求建议、情感支持
参数：无

### 12. mixed - 混合意图
识别特征：一句话包含多个操作
参数：actions（数组）

## 示例

### 示例1：创建任务
用户："5分钟后洗漱，然后洗衣服"
{
  "intent": "task_create",
  "action": "create_multiple_tasks",
  "parameters": {
    "tasks": [
      {
        "title": "洗漱",
        "scheduledStart": "当前时间+5分钟",
        "durationMinutes": 10,
        "location": "厕所",
        "tags": ["日常", "生活"]
      },
      {
        "title": "洗衣服",
        "scheduledStart": "洗漱结束时间",
        "durationMinutes": 15,
        "location": "厕所",
        "tags": ["家务", "生活"]
      }
    ]
  },
  "response": "好的！已经为你安排了洗漱和洗衣服，5分钟后开始~",
  "confidence": 0.95
}

### 示例2：碎碎念（会创建事件卡片）
用户："今天不小心把代码都删了，好烦"
{
  "intent": "thought_record",
  "action": "record_thought",
  "parameters": {
    "content": "今天不小心把代码都删了，好烦",
    "mood": "frustrated",
    "emotionTags": ["frustrated", "anxious"],
    "categoryTags": ["work"]
  },
  "response": "哎呀，听起来今天遇到了点小麻烦😔 已经帮你记录下来了，代码删了可以恢复吗？需要我帮你安排时间重写吗？",
  "confidence": 0.92
}
**执行结果：在时间轴上创建一个事件卡片，显示"今天不小心把代码都删了，好烦"，带有情绪标签**

### 示例3：记账
用户："午餐花了50块"
{
  "intent": "finance_record",
  "action": "record_expense",
  "parameters": {
    "type": "expense",
    "amount": 50,
    "description": "午餐",
    "tagName": "餐饮",
    "date": "当前时间"
  },
  "response": "已记录支出50元（午餐）💰",
  "confidence": 0.98
}

### 示例4：纯对话
用户："今天心情不错"
{
  "intent": "conversation",
  "action": "chat",
  "parameters": {},
  "response": "太好了！看到你心情好我也很开心😊 今天有什么开心的事吗？",
  "confidence": 0.85
}
`;

  // 获取性格设置
  const personalityPrompt = getPersonalityPrompt(personality);
  
  return basePrompt + '\n\n' + personalityPrompt;
}

/**
 * 根据性格设置生成性格提示词
 */
function getPersonalityPrompt(personality: any): string {
  const { type, strictness, humor, formality, emoji, verbosity } = personality;
  
  let prompt = `## 🎭 你的性格设置\n\n`;
  
  // 性格类型
  switch (type) {
    case 'gentle':
      prompt += `**性格类型：温柔鼓励型**\n`;
      prompt += `- 温暖、体贴、总是正面鼓励\n`;
      prompt += `- 语气柔和、关怀，多用"💕"、"🌸"、"✨"\n`;
      prompt += `- 示例："没关系呀~偶尔对自己好一点也是应该的💕"\n\n`;
      break;
    case 'strict':
      prompt += `**性格类型：严格督促型**\n`;
      prompt += `- 直接、严格、会批评但出于关心\n`;
      prompt += `- 语气严肃、直接，多用"⚠️"、"❗"、"💪"\n`;
      prompt += `- 示例："100块？！这个月才赚了多少钱你心里没数吗？❗"\n\n`;
      break;
    case 'humorous':
      prompt += `**性格类型：幽默吐槽型**\n`;
      prompt += `- 幽默、调侃、轻松但不失关心\n`;
      prompt += `- 语气俏皮、调侃，多用"😏"、"🤣"、"😅"\n`;
      prompt += `- 示例："哟呵~100块的饭，吃的是米其林吗？😏"\n\n`;
      break;
    case 'analytical':
      prompt += `**性格类型：理性分析型**\n`;
      prompt += `- 客观、数据导向、提供分析\n`;
      prompt += `- 语气专业、理性，多用"📊"、"💡"、"🔍"\n`;
      prompt += `- 示例："📊 数据分析：本次支出100元，本月餐饮850元..."\n\n`;
      break;
    case 'bestie':
      prompt += `**性格类型：闺蜜陪伴型**\n`;
      prompt += `- 亲密、八卦、像闺蜜一样聊天\n`;
      prompt += `- 语气亲昵、八卦，多用"姐妹"、"宝"、"💅"\n`;
      prompt += `- 示例："姐妹！100块吃的啥呀？是不是又去那家网红店了？💅"\n\n`;
      break;
    case 'chill':
      prompt += `**性格类型：佛系随和型**\n`;
      prompt += `- 随和、不评判、顺其自然\n`;
      prompt += `- 语气轻松、随意，多用"🌿"、"☺️"、"🍃"\n`;
      prompt += `- 示例："嗯嗯，吃得开心就好~🌿 钱嘛，花了就花了"\n\n`;
      break;
  }
  
  // 性格参数微调
  prompt += `**性格参数：**\n`;
  prompt += `- 严格度：${strictness}/1.0 ${strictness > 0.7 ? '(非常严格)' : strictness > 0.4 ? '(适度严格)' : '(比较宽容)'}\n`;
  prompt += `- 幽默度：${humor}/1.0 ${humor > 0.7 ? '(经常开玩笑)' : humor > 0.4 ? '(偶尔幽默)' : '(比较严肃)'}\n`;
  prompt += `- 正式度：${formality}/1.0 ${formality > 0.7 ? '(正式专业)' : formality > 0.4 ? '(自然得体)' : '(口语化)'}\ n`;
  prompt += `- Emoji使用：${emoji}/1.0 ${emoji > 0.7 ? '(经常使用)' : emoji > 0.4 ? '(适度使用)' : '(很少使用)'}\n`;
  prompt += `- 话痨程度：${verbosity}/1.0 ${verbosity > 0.7 ? '(话比较多)' : verbosity > 0.4 ? '(适中)' : '(简洁)'}\ n\n`;
  
  prompt += `**回复要求：**\n`;
  prompt += `1. 严格按照你的性格类型回复\n`;
  prompt += `2. 回复要简短有力，${verbosity > 0.7 ? '可以多说几句' : verbosity > 0.4 ? '2-3句话' : '不超过2句话'}\n`;
  prompt += `3. 如果执行了操作，先确认操作，再给出个性化评论\n`;
  prompt += `4. 根据用户行为数据，适时监督或鼓励\n`;
  prompt += `5. 保持你的性格特征，自然真实\n\n`;
  
  return prompt;
}

/**
 * AI 助手服务类
 */
class AIAssistantService {
  /**
   * 处理用户输入，返回结构化响应
   */
  async processUserInput(userInput: string, context?: {
    conversationHistory?: any[];
    userBehavior?: any;
  }): Promise<{
    success: boolean;
    intent?: string;
    action?: string;
    parameters?: any;
    response?: string;
    needsConfirmation?: boolean;
    suggestions?: string[];
    error?: string;
  }> {
    try {
      console.log('🎯 [AI助手] 用户输入:', userInput);
      
      // 获取完整的系统提示词
      const systemPrompt = getFullSystemPrompt();
      console.log('📝 [AI助手] 系统提示词长度:', systemPrompt.length);
      
      // 构建消息
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...(context?.conversationHistory || []),
        { role: 'user', content: userInput },
      ];
      
      // 调用 AI
      console.log('🤖 [AI助手] 调用 AI...');
      const response = await aiService.chat(messages);
      
      if (!response.success || !response.content) {
        console.error('❌ [AI助手] AI 调用失败:', response.error);
        return {
          success: false,
          error: response.error || 'AI 调用失败',
        };
      }
      
      console.log('✅ [AI助手] AI 返回内容:', response.content);
      
      // 解析 JSON 响应
      const result = this.parseAIResponse(response.content);
      console.log('📊 [AI助手] 解析结果:', result);
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('❌ [AI助手] 处理失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
  
  /**
   * 解析 AI 返回的 JSON
   */
  private parseAIResponse(content: string): any {
    try {
      console.log('🔍 [AI助手] 开始解析 AI 响应...');
      
      // 提取 JSON
      let jsonContent = content.trim();
      
      // 如果包含```json，提取其中的JSON
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        console.log('📦 [AI助手] 从代码块中提取 JSON');
      } else {
        // 尝试提取{}之间的内容
        const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
        if (braceMatch) {
          jsonContent = braceMatch[1];
          console.log('📦 [AI助手] 从文本中提取 JSON');
        }
      }
      
      console.log('📄 [AI助手] 提取的 JSON:', jsonContent.substring(0, 200) + '...');
      
      const parsed = JSON.parse(jsonContent);
      console.log('✅ [AI助手] JSON 解析成功:', parsed);
      
      return parsed;
    } catch (error) {
      console.error('❌ [AI助手] 解析 AI 响应失败:', error);
      console.error('❌ [AI助手] 原始内容:', content);
      
      // 如果解析失败，返回纯文本响应
      return {
        intent: 'conversation',
        action: 'chat',
        response: content,
      };
    }
  }
  
  /**
   * 执行 AI 返回的操作
   */
  async executeAction(intent: string, action: string, parameters: any): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      switch (intent) {
        case 'task_create':
          return await this.createTask(parameters);
        case 'task_delete':
          return await this.deleteTasks(parameters);
        case 'task_update':
          return await this.updateTask(parameters);
        case 'task_complete':
          return await this.completeTask(parameters);
        case 'finance_record':
          return await this.recordFinance(parameters);
        case 'thought_record':
          return await this.recordThought(parameters);
        case 'event_record':
          return await this.recordEvent(parameters);
        case 'habit_checkin':
          return await this.checkinHabit(parameters);
        case 'query_stats':
          return await this.queryStats(parameters);
        case 'goal_manage':
          return await this.manageGoal(parameters);
        case 'conversation':
          // 纯对话，不需要执行操作
          return { success: true, message: '对话' };
        default:
          return { success: false, error: `未知的意图类型: ${intent}` };
      }
    } catch (error) {
      console.error('执行操作失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
      };
    }
  }
  
  // ========== 具体操作实现 ==========

  private normalizeTaskDraft(rawTask: any, fallbackStart?: Date, sequence: number = 1) {
    const scheduledStart = rawTask?.scheduledStart
      ? new Date(rawTask.scheduledStart)
      : rawTask?.scheduled_start_iso
      ? new Date(rawTask.scheduled_start_iso)
      : fallbackStart || new Date();

    const estimatedDuration = rawTask?.durationMinutes || rawTask?.estimated_duration || 30;
    const scheduledEnd = new Date(scheduledStart.getTime() + estimatedDuration * 60000);
    const rawPriority = rawTask?.priority;

    return {
      sequence,
      title: rawTask?.title || `任务${sequence}`,
      description: rawTask?.description || '',
      estimated_duration: estimatedDuration,
      scheduled_start: scheduledStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      scheduled_end: scheduledEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      scheduled_start_iso: scheduledStart.toISOString(),
      task_type: rawTask?.taskType || rawTask?.task_type || 'life',
      category: rawTask?.category || '生活事务',
      location: rawTask?.location || '全屋',
      tags: rawTask?.tags || [],
      goal: rawTask?.goal || null,
      gold: rawTask?.goldReward || rawTask?.gold || 0,
      color: rawTask?.color || '#6A7334',
      priority:
        rawPriority === 1 || rawPriority === 'high'
          ? 'high'
          : rawPriority === 3 || rawPriority === 'low'
          ? 'low'
          : 'medium',
    };
  }

  private openTaskEditor(taskDrafts: any[]) {
    eventBus.emit('ai:open-task-editor', { tasks: taskDrafts });
  }

  private buildTaskCreateMessage(taskDrafts: any[]) {
    if (taskDrafts.length === 1) {
      return `已识别到 1 个任务，已为你打开任务编辑器，确认后就会推送到时间轴。`;
    }

    return `已识别到 ${taskDrafts.length} 个任务，已为你打开任务编辑器，确认后就会一起推送到时间轴。`;
  }

  private async createTask(params: any) {
    const now = new Date();
    const rawTasks = Array.isArray(params?.tasks) && params.tasks.length > 0
      ? params.tasks
      : [params];

    const taskDrafts: any[] = [];

    rawTasks.forEach((task, index) => {
      let fallbackStart = now;

      if (task?.scheduledStart) {
        fallbackStart = new Date(task.scheduledStart);
      } else if (task?.scheduled_start_iso) {
        fallbackStart = new Date(task.scheduled_start_iso);
      } else if (index > 0) {
        const previousDraft = taskDrafts[index - 1];
        const previousStart = new Date(previousDraft.scheduled_start_iso);
        const previousDuration = previousDraft.estimated_duration || 30;
        fallbackStart = new Date(previousStart.getTime() + previousDuration * 60000);
      }

      taskDrafts.push(this.normalizeTaskDraft(task, fallbackStart, index + 1));
    });

    this.openTaskEditor(taskDrafts);

    return {
      success: true,
      message: this.buildTaskCreateMessage(taskDrafts),
      data: {
        tasks: taskDrafts,
        openTaskEditor: true,
      },
    };
  }
  
  private async deleteTasks(params: any) {
    const taskStore = useTaskStore.getState();
    const { filter, taskIds } = params;
    
    if (taskIds && taskIds.length > 0) {
      // 删除指定的任务
      taskIds.forEach((id: string) => taskStore.deleteTask(id));
      return {
        success: true,
        message: `已删除 ${taskIds.length} 个任务`,
      };
    }
    
    // 根据过滤条件删除
    // TODO: 实现过滤逻辑
    return {
      success: true,
      message: '已删除任务',
    };
  }
  
  private async updateTask(params: any) {
    const taskStore = useTaskStore.getState();
    const { taskId, updates } = params;
    
    taskStore.updateTask(taskId, updates);
    
    return {
      success: true,
      message: `已更新任务`,
    };
  }
  
  private async completeTask(params: any) {
    const taskStore = useTaskStore.getState();
    const { taskId, completionTime, efficiency, notes } = params;
    
    taskStore.completeTask(taskId, {
      completionTime: completionTime ? new Date(completionTime) : new Date(),
      efficiency,
      notes,
    });
    
    return {
      success: true,
      message: `任务已完成`,
    };
  }
  
  private async recordFinance(params: any) {
    const tagStore = useTagStore.getState();
    const { type, amount, description, tagName, date } = params;
    
    if (tagName) {
      tagStore.addFinanceRecord(tagName, {
        amount: type === 'income' ? amount : -amount,
        type,
        description,
        date: date ? new Date(date) : new Date(),
      });
    }
    
    return {
      success: true,
      message: `已记录${type === 'income' ? '收入' : '支出'}：${amount}元`,
    };
  }
  
  private async recordThought(params: any) {
    const memoryStore = useMemoryStore.getState();
    const { content, mood, emotionTags = [], categoryTags = [] } = params;
    
    // 添加到全景记忆
    memoryStore.addMemory({
      type: 'thought',
      content,
      emotionTags,
      categoryTags,
      rewards: {
        gold: 5, // 记录碎碎念奖励5金币
        growth: 2,
      },
    });
    
    return {
      success: true,
      message: `已记录你的想法`,
    };
  }
  
  private async recordEvent(params: any) {
    const memoryStore = useMemoryStore.getState();
    const { content, type = 'success', emotionTags = [], categoryTags = [] } = params;
    
    // 添加到全景记忆和日记
    memoryStore.addMemory({
      type: type === 'success' ? 'success' : 'gratitude',
      content,
      emotionTags,
      categoryTags,
      rewards: {
        gold: 10, // 记录事件奖励10金币
        growth: 5,
      },
    });
    
    return {
      success: true,
      message: `已记录${type === 'success' ? '成功事件' : '感恩事件'}`,
    };
  }
  
  private async checkinHabit(params: any) {
    // TODO: 实现习惯打卡
    return {
      success: true,
      message: '打卡成功',
    };
  }
  
  private async queryStats(params: any) {
    // TODO: 实现数据查询
    return {
      success: true,
      message: '查询成功',
      data: {},
    };
  }
  
  private async manageGoal(params: any) {
    const goalStore = useGoalStore.getState();
    
    if (params.action === 'create') {
      const goal = goalStore.createGoal({
        name: params.name,
        description: params.description,
        goalType: params.type || 'boolean',
        isActive: true,
      });
      
      return {
        success: true,
        message: `已创建目标：${params.name}`,
        data: goal,
      };
    }
    
    return {
      success: true,
      message: '目标操作成功',
    };
  }
}

export const aiAssistantService = new AIAssistantService();

