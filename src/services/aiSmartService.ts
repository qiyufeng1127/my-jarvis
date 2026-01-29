// ============================================
// AI 智能处理服务 - 完整版
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
    existing_tasks?: any[]; // 现有任务列表，用于冲突检测
  };
}

export interface AIProcessResponse {
  message: string;
  data?: any;
  actions?: AIAction[];
  autoExecute?: boolean;
  needsConfirmation?: boolean;
  conflictDetected?: boolean;
  conflictOptions?: ConflictOption[];
}

export interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold' | 'add_to_inbox' | 'smart_schedule';
  data: any;
  label: string;
}

export interface ConflictOption {
  id: string;
  label: string;
  description: string;
  action: 'inbox' | 'postpone' | 'replace' | 'cancel';
}

export interface TaskInInbox {
  id: string;
  title: string;
  description: string;
  estimatedDuration: number;
  taskType: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// ============================================
// 收集箱管理器
// ============================================
export class InboxManager {
  private static STORAGE_KEY = 'task_inbox';

  // 获取收集箱任务
  static getInboxTasks(): TaskInInbox[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // 添加任务到收集箱
  static addToInbox(task: Omit<TaskInInbox, 'id' | 'createdAt'>): TaskInInbox {
    const tasks = this.getInboxTasks();
    const newTask: TaskInInbox = {
      ...task,
      id: `inbox-${Date.now()}`,
      createdAt: new Date(),
    };
    tasks.push(newTask);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    return newTask;
  }

  // 从收集箱移除任务
  static removeFromInbox(taskId: string): void {
    const tasks = this.getInboxTasks().filter(t => t.id !== taskId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  }

  // 智能分配收集箱任务到时间轴
  static smartScheduleInboxTasks(existingTasks: any[]): any[] {
    const inboxTasks = this.getInboxTasks();
    const scheduledTasks: any[] = [];
    
    // 按优先级排序
    const sortedTasks = [...inboxTasks].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 找到可用时间段
    const now = new Date();
    let currentTime = new Date(now.getTime() + 30 * 60000); // 30分钟后开始

    for (const task of sortedTasks) {
      // 查找下一个空闲时间段
      const freeSlot = this.findNextFreeSlot(currentTime, task.estimatedDuration, existingTasks);
      
      if (freeSlot) {
        scheduledTasks.push({
          ...task,
          scheduledStart: freeSlot.start.toISOString(),
          scheduledEnd: freeSlot.end.toISOString(),
        });
        currentTime = freeSlot.end;
      }
    }

    return scheduledTasks;
  }

  // 查找下一个空闲时间段
  private static findNextFreeSlot(
    startFrom: Date,
    durationMinutes: number,
    existingTasks: any[]
  ): { start: Date; end: Date } | null {
    const proposedStart = new Date(startFrom);
    const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000);

    // 检查是否与现有任务冲突
    const hasConflict = existingTasks.some(task => {
      const taskStart = new Date(task.scheduledStart);
      const taskEnd = new Date(task.scheduledEnd || taskStart.getTime() + task.durationMinutes * 60000);
      
      return (
        (proposedStart >= taskStart && proposedStart < taskEnd) ||
        (proposedEnd > taskStart && proposedEnd <= taskEnd) ||
        (proposedStart <= taskStart && proposedEnd >= taskEnd)
      );
    });

    if (!hasConflict) {
      return { start: proposedStart, end: proposedEnd };
    }

    // 如果有冲突，尝试下一个时间段
    const nextStart = new Date(proposedEnd.getTime() + 15 * 60000); // 15分钟后
    return this.findNextFreeSlot(nextStart, durationMinutes, existingTasks);
  }
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
  // 检测时间冲突
  static detectTimeConflict(
    proposedStart: Date,
    proposedEnd: Date,
    existingTasks: any[]
  ): any | null {
    return existingTasks.find(task => {
      const taskStart = new Date(task.scheduledStart);
      const taskEnd = new Date(task.scheduledEnd || taskStart.getTime() + task.durationMinutes * 60000);
      
      return (
        (proposedStart >= taskStart && proposedStart < taskEnd) ||
        (proposedEnd > taskStart && proposedEnd <= taskEnd) ||
        (proposedStart <= taskStart && proposedEnd >= taskEnd)
      );
    });
  }

  // 分析输入类型
  static analyzeInputType(input: string): string {
    const lowerInput = input.toLowerCase();

    // 任务分解型（多个任务）
    if (
      lowerInput.includes('然后') || 
      lowerInput.includes('之后') || 
      lowerInput.includes('接着') ||
      lowerInput.includes('、') ||
      lowerInput.includes('，')
    ) {
      return 'task_decomposition';
    }

    // 指定时间添加任务
    if (
      lowerInput.match(/\d+[:：]\d+/) || // 匹配时间格式
      lowerInput.includes('在') ||
      lowerInput.includes('添加')
    ) {
      return 'scheduled_task';
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

  // 智能分割任务（支持多种分隔符）
  static splitTasks(input: string): string[] {
    // 移除时间前缀（如"5分钟后"）
    let cleanInput = input.replace(/^\d+分钟[后之]后?/i, '').trim();
    
    // 按多种分隔符分割
    const tasks = cleanInput
      .split(/[、，,]|然后|之后|接着/)
      .map(t => t.trim())
      .filter(Boolean);
    
    return tasks;
  }

  // 解析时间表达式
  static parseTimeExpression(input: string): Date | null {
    const now = new Date();
    
    // 匹配 "X分钟后"
    const minutesMatch = input.match(/(\d+)分钟[后之]后?/i);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      return new Date(now.getTime() + minutes * 60000);
    }
    
    // 匹配 "HH:MM" 格式
    const timeMatch = input.match(/(\d{1,2})[:：](\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      // 如果时间已过，设置为明天
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      return targetTime;
    }
    
    // 匹配 "在X:XX"
    const atTimeMatch = input.match(/在\s*(\d{1,2})[:：](\d{2})/);
    if (atTimeMatch) {
      const hours = parseInt(atTimeMatch[1]);
      const minutes = parseInt(atTimeMatch[2]);
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      if (targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      return targetTime;
    }
    
    return null;
  }

  // 处理指定时间的任务（带冲突检测）
  static async handleScheduledTask(input: string, context: any): Promise<AIProcessResponse> {
    const startTime = this.parseTimeExpression(input);
    
    if (!startTime) {
      return {
        message: '抱歉，我无法识别时间。请使用格式如："在13:17添加XX任务" 或 "5分钟后XX"',
        autoExecute: false,
      };
    }

    // 提取任务标题
    const taskTitle = input
      .replace(/^\d+分钟[后之]后?/i, '')
      .replace(/在\s*\d{1,2}[:：]\d{2}/i, '')
      .replace(/添加/g, '')
      .trim();

    const duration = 30; // 默认30分钟
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 检测冲突
    const existingTasks = context.existing_tasks || [];
    const conflictTask = this.detectTimeConflict(startTime, endTime, existingTasks);

    if (conflictTask) {
      // 有冲突，询问用户
      return {
        message: `⚠️ 时间冲突检测\n\n该时段（${startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}）已有任务：\n\n📌 ${conflictTask.title}\n\n请选择处理方式：`,
        conflictDetected: true,
        conflictOptions: [
          {
            id: 'inbox',
            label: '📥 放入收集箱',
            description: '暂时保存，稍后手动安排',
            action: 'inbox',
          },
          {
            id: 'postpone',
            label: '⏭️ 自动顺延',
            description: '安排到下一个空闲时段',
            action: 'postpone',
          },
          {
            id: 'replace',
            label: '🔄 替换现有任务',
            description: '删除冲突任务，添加新任务',
            action: 'replace',
          },
          {
            id: 'cancel',
            label: '❌ 取消',
            description: '不添加此任务',
            action: 'cancel',
          },
        ],
        data: {
          newTask: {
            title: taskTitle,
            scheduledStart: startTime.toISOString(),
            estimatedDuration: duration,
          },
          conflictTask,
        },
        autoExecute: false,
      };
    }

    // 无冲突，直接添加
    return {
      message: `✅ 已为你安排任务：\n\n📌 ${taskTitle}\n⏰ ${startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}\n💰 ${this.calculateGold({ estimated_duration: duration, task_type: 'life' })}金币`,
      actions: [
        {
          type: 'create_task',
          data: {
            title: taskTitle,
            scheduled_time: startTime.toISOString(),
            estimated_duration: duration,
            task_type: 'life',
          },
          label: '确认添加',
        },
      ],
      autoExecute: true,
    };
  }

  // 处理任务分解（多任务识别）
  static async handleTaskDecomposition(input: string, context: any): Promise<AIProcessResponse> {
    // 解析时间起点
    const startTime = this.parseTimeExpression(input) || new Date(Date.now() + 5 * 60000);
    
    // 分割任务
    const taskTitles = this.splitTasks(input);
    
    if (taskTitles.length === 0) {
      return {
        message: '抱歉，我没有识别到任何任务。请重新输入。',
        autoExecute: false,
      };
    }

    // 构建任务列表
    let currentTime = new Date(startTime);
    const decomposedTasks = taskTitles.map((title, index) => {
      const duration = this.estimateTaskDuration(title);
      const start = new Date(currentTime);
      const end = new Date(currentTime.getTime() + duration * 60000);
      
      const task = {
        sequence: index + 1,
        title: title,
        description: title,
        estimated_duration: duration,
        scheduled_start: start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_end: end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_start_iso: start.toISOString(),
        task_type: this.inferTaskType(title),
        category: this.inferCategory(title),
        gold: this.calculateGold({ estimated_duration: duration, task_type: this.inferTaskType(title) }),
      };

      // 下一个任务开始时间 = 当前任务结束 + 5分钟间隔
      currentTime = new Date(end.getTime() + 5 * 60000);
      
      return task;
    });

    // 构建消息（压缩格式，每个任务最多2行）
    let message = `✅ 已识别 ${decomposedTasks.length} 个任务：\n\n`;
    
    decomposedTasks.forEach((task, index) => {
      // 第一行：序号、标题、时间
      message += `${index + 1}. **${task.title}** ⏰ ${task.scheduled_start}-${task.scheduled_end}\n`;
      // 第二行：时长、金币、类型（压缩在一行）
      message += `   ${task.estimated_duration}分钟 | 💰${task.gold} | 🏷️${task.category}\n\n`;
    });

    const totalDuration = decomposedTasks.reduce((sum, t) => sum + t.estimated_duration, 0);
    const totalGold = decomposedTasks.reduce((sum, t) => sum + t.gold, 0);

    message += `📊 总计：${totalDuration}分钟 | 💰${totalGold}金币`;

    return {
      message,
      data: {
        decomposed_tasks: decomposedTasks,
        total_duration: totalDuration,
        total_gold: totalGold,
      },
      actions: [
        {
          type: 'create_task',
          data: { tasks: decomposedTasks },
          label: '✅ 全部添加到时间轴',
        },
      ],
      needsConfirmation: true,
      autoExecute: false,
    };
  }

  // 估算任务时长
  static estimateTaskDuration(taskTitle: string): number {
    const title = taskTitle.toLowerCase();
    
    // 快速任务（5-15分钟）
    if (title.includes('洗漱') || title.includes('刷牙') || title.includes('洗脸')) {
      return 10;
    }
    
    // 短任务（15-30分钟）
    if (title.includes('吃饭') || title.includes('午餐') || title.includes('晚餐') || title.includes('早餐')) {
      return 20;
    }
    
    // 中等任务（30-60分钟）
    if (title.includes('会议') || title.includes('讨论') || title.includes('优化')) {
      return 45;
    }
    
    // 长任务（60-120分钟）
    if (title.includes('写') || title.includes('设计') || title.includes('开发') || title.includes('文档')) {
      return 90;
    }
    
    // 默认30分钟
    return 30;
  }

  // 推断任务类型
  static inferTaskType(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('吃') || title.includes('餐') || title.includes('洗漱')) return 'life';
    if (title.includes('运动') || title.includes('跑步') || title.includes('健身')) return 'sport';
    if (title.includes('工作') || title.includes('会议') || title.includes('开发')) return 'work';
    if (title.includes('学习') || title.includes('阅读') || title.includes('课程')) return 'learning';
    if (title.includes('写') || title.includes('设计') || title.includes('创作')) return 'creative';
    
    return 'life';
  }

  // 推断任务分类
  static inferCategory(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('吃') || title.includes('餐')) return '饮食';
    if (title.includes('洗漱') || title.includes('洗澡')) return '个人护理';
    if (title.includes('运动') || title.includes('健身')) return '运动健康';
    if (title.includes('工作') || title.includes('会议')) return '工作事务';
    if (title.includes('学习') || title.includes('阅读')) return '学习成长';
    if (title.includes('写') || title.includes('设计')) return '创意工作';
    
    return '生活事务';
  }

  // 计算金币
  static calculateGold(task: any): number {
    const duration = task.estimated_duration || 30;
    const taskType = task.task_type || 'life';

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
    return Math.round(rule.base + duration * rule.perMinute);
  }

  // 处理时间轴操作
  static async handleTimelineOperation(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '我理解你想操作时间轴。这个功能正在开发中，敬请期待！',
      autoExecute: false,
    };
  }

  // 处理心情记录
  static async handleMoodRecord(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: `📝 我记录下了你的心情：\n\n"${input}"\n\n继续保持好心情！`,
      data: { mood: input, timestamp: new Date() },
      actions: [
        {
          type: 'record_memory',
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
      message: '💰 金币计算功能正在开发中，敬请期待！',
      autoExecute: false,
    };
  }

  // 处理标签生成
  static async handleTagGeneration(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '🏷️ 标签生成功能正在开发中，敬请期待！',
      autoExecute: false,
    };
  }

  // 处理通用输入
  static async handleGeneralInput(input: string, context: any): Promise<AIProcessResponse> {
    return {
      message: '我理解了你的意思。你想让我帮你做什么呢？\n\n我可以帮你：\n• 📅 分解任务（如"5分钟后洗漱、吃饭、优化工作区"）\n• ⏰ 指定时间添加任务（如"在13:17添加开会"）\n• 📝 记录心情（如"今天心情很好"）\n• 💰 计算金币和成长值',
      autoExecute: false,
    };
  }

  // 主处理函数
  static async process(request: AIProcessRequest): Promise<AIProcessResponse> {
    const inputType = this.analyzeInputType(request.user_input);

    switch (inputType) {
      case 'scheduled_task':
        return await this.handleScheduledTask(request.user_input, request.context);
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
