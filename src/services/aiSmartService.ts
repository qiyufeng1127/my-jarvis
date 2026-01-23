// ============================================
// AI 智能处理服务
// ============================================

export interface AIProcessRequest {
  user_input: string;
  context: {
    user_id: string;
    current_time: string;
    current_date: string;
    timeline_summary?: any;
    user_preferences?: any;
    conversation_history?: any[];
  };
}

export interface AIProcessResponse {
  message: string;
  data?: any;
  actions?: AIAction[];
  autoExecute?: boolean;
}

export interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold';
  data: any;
  label: string;
}

// ============================================
// DeepSeek API 配置
// ============================================
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// ============================================
// AI 智能处理器
// ============================================
export class AISmartProcessor {
  // 分析输入类型
  static analyzeInputType(input: string): string {
    const lowerInput = input.toLowerCase();

    // 任务分解型
    if (lowerInput.includes('然后') || lowerInput.includes('之后') || lowerInput.includes('接着')) {
      return 'task_decomposition';
    }

    // 时间轴操作型
    if (lowerInput.includes('删除') || lowerInput.includes('复制') || lowerInput.includes('移动')) {
      return 'timeline_operation';
    }

    // 心情记录型
    if (lowerInput.includes('心情') || lowerInput.includes('感觉') || lowerInput.includes('今天')) {
      return 'mood_record';
    }

    // 金币计算型
    if (lowerInput.includes('金币') || lowerInput.includes('奖励')) {
      return 'gold_calculation';
    }

    // 标签生成型
    if (lowerInput.includes('标签') || lowerInput.includes('分类')) {
      return 'tag_generation';
    }

    return 'general';
  }

  // 处理任务分解
  static async handleTaskDecomposition(input: string, context: any): Promise<AIProcessResponse> {
    const prompt = this.buildTaskDecompositionPrompt(input, context);
    
    try {
      const aiResponse = await this.callDeepSeek(prompt);
      const parsed = JSON.parse(aiResponse);

      // 构建用户友好的消息
      let message = `好的，我已经为你分解了任务并安排了时间：\n\n`;
      
      parsed.decomposed_tasks.forEach((task: any, index: number) => {
        message += `${index + 1}. **${task.title}**\n`;
        message += `   ⏰ ${task.scheduled_start} - ${task.scheduled_end} (${task.estimated_duration}分钟)\n`;
        message += `   💰 ${this.calculateGold(task)}金币\n`;
        message += `   🏷️ ${task.category || '生活'}\n\n`;
      });

      const totalGold = parsed.decomposed_tasks.reduce(
        (sum: number, task: any) => sum + this.calculateGold(task),
        0
      );

      message += `总计：${parsed.total_duration}分钟，${totalGold}金币\n\n`;
      message += `是否将这些任务添加到你的时间轴？`;

      // 构建操作
      const actions: AIAction[] = parsed.decomposed_tasks.map((task: any) => ({
        type: 'create_task' as const,
        data: {
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          scheduled_start: task.scheduled_start,
          scheduled_end: task.scheduled_end,
          task_type: task.task_type || 'life',
          category: task.category,
        },
        label: `添加"${task.title}"`,
      }));

      return {
        message,
        data: {
          decomposed_tasks: parsed.decomposed_tasks,
          total_duration: parsed.total_duration,
          total_gold: totalGold,
        },
        actions,
        autoExecute: false,
      };
    } catch (error) {
      console.error('任务分解失败:', error);
      return this.fallbackTaskDecomposition(input, context);
    }
  }

  // 备用任务分解（不依赖 AI）
  static fallbackTaskDecomposition(input: string, context: any): AIProcessResponse {
    const tasks = input.split(/然后|之后|接着/).map(t => t.trim()).filter(Boolean);
    const now = new Date();
    let currentTime = new Date(now.getTime() + 5 * 60000); // 5分钟后开始

    const decomposedTasks = tasks.map((task, index) => {
      const duration = 30; // 默认30分钟
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + duration * 60000);
      
      const taskData = {
        sequence: index + 1,
        title: task,
        description: task,
        estimated_duration: duration,
        scheduled_start: startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_end: endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        task_type: 'life',
        category: '生活',
      };

      currentTime = new Date(endTime.getTime() + 5 * 60000); // 加5分钟间隔
      return taskData;
    });

    const totalGold = decomposedTasks.reduce((sum, t) => sum + this.calculateGold(t), 0);

    let message = `好的，我已经为你分解了任务并安排了时间：\n\n`;
    decomposedTasks.forEach((task, index) => {
      message += `${index + 1}. **${task.title}**\n`;
      message += `   ⏰ ${task.scheduled_start} - ${task.scheduled_end} (${task.estimated_duration}分钟)\n`;
      message += `   💰 ${this.calculateGold(task)}金币\n\n`;
    });
    message += `总计：${decomposedTasks.reduce((sum, t) => sum + t.estimated_duration, 0)}分钟，${totalGold}金币\n\n`;
    message += `是否将这些任务添加到你的时间轴？`;

    return {
      message,
      data: { decomposed_tasks: decomposedTasks, total_gold: totalGold },
      actions: decomposedTasks.map(task => ({
        type: 'create_task' as const,
        data: task,
        label: `添加"${task.title}"`,
      })),
      autoExecute: false,
    };
  }

  // 计算金币
  static calculateGold(task: any): number {
    const duration = task.estimated_duration || 30;
    const taskType = task.task_type || 'life';

    // 金币计算规则
    const goldRules: Record<string, { base: number; perMinute: number }> = {
      standing: { base: 20, perMinute: 10 },
      sitting: { base: 10, perMinute: 5 },
      sport: { base: 30, perMinute: 15 },
      creative: { base: 25, perMinute: 8 },
      learning: { base: 15, perMinute: 6 },
      social: { base: 12, perMinute: 4 },
      rest: { base: 5, perMinute: 2 },
      life: { base: 15, perMinute: 7 },
      work: { base: 20, perMinute: 8 },
    };

    const rule = goldRules[taskType] || goldRules.life;
    return rule.base + duration * rule.perMinute;
  }

  // 构建任务分解提示词
  static buildTaskDecompositionPrompt(input: string, context: any): string {
    return `你是一个专业的时间规划师，请将用户的自然语言指令分解为具体的、有时间安排的任务序列。

当前时间：${context.current_time} (${context.current_date})

用户指令："${input}"

请按照以下步骤处理：
1. 识别所有时间参考点（如"5分钟之后"、"明天上午"、"然后"等）
2. 识别每个任务的描述
3. 为每个任务估算合理时长（基于常识和用户历史数据）
4. 安排具体的时间段
5. 考虑任务间的合理间隔

请特别注意：
- 如果提到"之后"、"然后"，需要考虑任务间的合理过渡时间（建议5-15分钟）
- 如果是连续任务，要确保时间不重叠
- 如果用户没有指定第一个任务的开始时间，基于当前时间推算

输出JSON格式：
{
  "original_instruction": "用户原始指令",
  "reference_time": "时间参考点",
  "decomposed_tasks": [
    {
      "sequence": 1,
      "title": "标准化任务标题",
      "description": "任务详细描述",
      "estimated_duration": 15,
      "scheduled_start": "HH:MM",
      "scheduled_end": "HH:MM",
      "task_type": "personal_care/meal/housework/work/study/exercise/meeting/leisure",
      "category": "生活事务"
    }
  ],
  "total_duration": 120,
  "schedule_notes": "时间安排说明"
}`;
  }

  // 调用 DeepSeek API
  static async callDeepSeek(prompt: string): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API Key 未配置');
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI助手，专门帮助用户管理时间、任务和生活。请始终以JSON格式回复。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // 处理时间轴操作
  static async handleTimelineOperation(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '我理解你想操作时间轴。这个功能正在开发中，敬请期待！',
      data: null,
      actions: [],
      autoExecute: false,
    };
  }

  // 处理心情记录
  static async handleMoodRecord(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: `我记录下了你的心情："${input}"。继续保持好心情！`,
      data: { mood: input, timestamp: new Date() },
      actions: [
        {
          type: 'record_memory' as const,
          data: { content: input, type: 'mood' },
          label: '保存到记忆',
        },
      ],
      autoExecute: true,
    };
  }

  // 处理金币计算
  static async handleGoldCalculation(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '金币计算功能正在开发中，敬请期待！',
      data: null,
      actions: [],
      autoExecute: false,
    };
  }

  // 处理标签生成
  static async handleTagGeneration(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '标签生成功能正在开发中，敬请期待！',
      data: null,
      actions: [],
      autoExecute: false,
    };
  }

  // 处理通用输入
  static async handleGeneralInput(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '我理解了你的意思。你想让我帮你做什么呢？\n\n我可以帮你：\n• 分解任务（如"5分钟后洗漱然后吃饭"）\n• 操作时间轴（如"删除今天的任务"）\n• 记录心情（如"今天心情很好"）',
      data: null,
      actions: [],
      autoExecute: false,
    };
  }

  // 主处理函数
  static async process(request: AIProcessRequest): Promise<AIProcessResponse> {
    const inputType = this.analyzeInputType(request.user_input);

    switch (inputType) {
      case 'task_decomposition':
        return await this.handleTaskDecomposition(request.user_input, request.context);
      case 'timeline_operation':
        return await this.handleTimelineOperation(request.user_input, request.context);
      case 'mood_record':
        return await this.handleMoodRecord(request.user_input, request.context);
      case 'gold_calculation':
        return await this.handleGoldCalculation(request.user_input, request.context);
      case 'tag_generation':
        return await this.handleTagGeneration(request.user_input, request.context);
      default:
        return await this.handleGeneralInput(request.user_input, request.context);
    }
  }
}

