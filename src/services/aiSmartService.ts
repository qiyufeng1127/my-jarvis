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
    console.log('🔍 开始处理任务分解:', input);
    
    // 解析时间起点 - 如果没有指定时间，默认5分钟后
    let startTime = this.parseTimeExpression(input);
    if (!startTime) {
      startTime = new Date(Date.now() + 5 * 60000);
    }
    console.log('⏰ 起始时间:', startTime.toLocaleString('zh-CN'));
    
    // 分割任务
    const taskTitles = this.splitTasks(input);
    console.log('📋 分割后的任务:', taskTitles);
    
    if (taskTitles.length === 0) {
      return {
        message: '抱歉，我没有识别到任何任务。请重新输入。',
        autoExecute: false,
      };
    }

    // 构建任务列表 - 保持用户输入的顺序，不重新排序
    let currentTime = new Date(startTime);
    const decomposedTasks = taskTitles.map((title, index) => {
      const duration = this.estimateTaskDuration(title);
      const start = new Date(currentTime);
      const end = new Date(currentTime.getTime() + duration * 60000);
      const location = this.inferLocation(title);
      const tags = this.generateTags(title);
      const goal = this.identifyGoal(title);
      
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
        location: location,
        tags: tags,
        goal: goal,
        gold: this.calculateGold({ estimated_duration: duration, task_type: this.inferTaskType(title) }),
        color: this.getTaskColor(tags), // 添加颜色
      };

      // 下一个任务开始时间 = 当前任务结束（无间隔）
      currentTime = new Date(end.getTime());
      
      return task;
    });

    // 按位置分组（仅用于显示统计信息）
    const groupedByLocation = this.groupTasksByLocation(decomposedTasks);

    console.log('✅ 最终任务列表（保持原顺序）:', decomposedTasks);

    // 构建消息（按用户输入顺序显示）
    let message = `✅ 已识别 ${decomposedTasks.length} 个任务，按你说的顺序排列：\n\n`;
    
    decomposedTasks.forEach((task, index) => {
      // 任务信息（3行格式）
      message += `${task.sequence}. **${task.title}** 📍${task.location}\n`;
      message += `   ⏰ ${task.scheduled_start}-${task.scheduled_end} | ${task.estimated_duration}分钟 | 💰${task.gold}\n`;
      message += `   🏷️ ${task.tags.join(' ')}`;
      if (task.goal) {
        message += ` | 🎯 ${task.goal}`;
      }
      message += `\n\n`;
    });

    const totalDuration = decomposedTasks.reduce((sum, t) => sum + t.estimated_duration, 0);
    const totalGold = decomposedTasks.reduce((sum, t) => sum + t.gold, 0);

    message += `📊 总计：${totalDuration}分钟 | 💰${totalGold}金币\n\n`;
    message += `💡 正在打开事件卡片编辑器，你可以：\n`;
    message += `   • 双击任意字段进行编辑（名称、时长、金币、目标等）\n`;
    message += `   • 使用上下箭头调整任务顺序\n`;
    message += `   • 修改完成后点击"🚀 全部推送到时间轴"`;

    const response = {
      message,
      data: {
        decomposed_tasks: decomposedTasks,
        total_duration: totalDuration,
        total_gold: totalGold,
        grouped_by_location: groupedByLocation,
      },
      actions: [
        {
          type: 'create_task' as const,
          data: { tasks: decomposedTasks },
          label: '✅ 确认并添加到时间轴',
        },
      ],
      needsConfirmation: true,
      autoExecute: false,
    };

    console.log('📤 返回响应:', response);
    return response;
  }

  // 按位置分组任务
  static groupTasksByLocation(tasks: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    tasks.forEach(task => {
      const location = task.location || '其他';
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(task);
    });
    
    return grouped;
  }

  // 按位置排序任务（相同位置的任务连续安排）
  static sortTasksByLocation(grouped: Record<string, any[]>): any[] {
    const sorted: any[] = [];
    let currentTime = new Date();
    
    // 位置优先级（按照用户家里的实际格局和动线）
    const locationPriority = ['厕所', '工作区', '客厅', '卧室', '拍摄间', '厨房', '全屋', '室外'];
    
    locationPriority.forEach(location => {
      if (grouped[location]) {
        grouped[location].forEach(task => {
          // 重新计算时间
          const start = new Date(currentTime);
          const end = new Date(start.getTime() + task.estimated_duration * 60000);
          
          task.scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          task.scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          task.scheduled_start_iso = start.toISOString();
          
          sorted.push(task);
          
          // 下一个任务时间（无间隔）
          currentTime = new Date(end.getTime());
        });
      }
    });
    
    return sorted;
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

  // 推断任务位置（根据用户家庭格局）
  static inferLocation(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    // 室外（外出相关）
    if (title.includes('下楼') || title.includes('买菜') || title.includes('快递') || 
        title.includes('超市') || title.includes('购物') || title.includes('外出') ||
        title.includes('散步') || title.includes('遛') || title.includes('取') ||
        title.includes('寄') || title.includes('邮局')) {
      return '室外';
    }
    
    // 厨房相关（猫咪相关任务都在厨房）
    if (title.includes('猫粮') || title.includes('铲') || title.includes('猫砂') || 
        title.includes('粑粑') || title.includes('猫') || title.includes('悠悠') ||
        title.includes('做饭') || title.includes('煮') || title.includes('炒')) {
      return '厨房';
    }
    
    // 工作区（所有工作相关）
    if (title.includes('工作') || title.includes('会议') || title.includes('开发') || 
        title.includes('写代码') || title.includes('设计') || title.includes('优化') ||
        title.includes('学习') || title.includes('写') || title.includes('编程')) {
      return '工作区';
    }
    
    // 厕所（个人护理）
    if (title.includes('洗漱') || title.includes('洗澡') || title.includes('刷牙') || 
        title.includes('洗脸') || title.includes('上厕所')) {
      return '厕所';
    }
    
    // 卧室（睡眠相关）
    if (title.includes('睡觉') || title.includes('起床') || title.includes('叠被') || 
        title.includes('休息') || title.includes('午睡')) {
      return '卧室';
    }
    
    // 拍摄间（拍摄、录制相关）
    if (title.includes('拍摄') || title.includes('录制') || title.includes('视频') || 
        title.includes('直播') || title.includes('拍照')) {
      return '拍摄间';
    }
    
    // 客厅（娱乐、休闲）
    if (title.includes('看电视') || title.includes('看剧') || title.includes('聊天') || 
        title.includes('休闲')) {
      return '客厅';
    }
    
    // 全屋（打扫、收拾等全屋性任务）
    if (title.includes('打扫') || title.includes('拖地') || title.includes('扫地') || 
        title.includes('收拾') || title.includes('整理') || title.includes('垃圾') ||
        title.includes('清洁') || title.includes('卫生')) {
      return '全屋';
    }
    
    return '全屋';
  }

  // 智能生成标签
  static generateTags(taskTitle: string): string[] {
    const title = taskTitle.toLowerCase();
    const tags: string[] = [];
    
    // 基础分类标签
    if (title.includes('打扫') || title.includes('拖地') || title.includes('扫地')) {
      tags.push('日常', '家务', '清洁');
    } else if (title.includes('猫') || title.includes('悠悠')) {
      tags.push('猫咪', '家务', '日常');
    } else if (title.includes('做饭') || title.includes('煮') || title.includes('炒')) {
      tags.push('饮食', '家务', '日常');
    } else if (title.includes('洗漱') || title.includes('洗澡')) {
      tags.push('个人护理', '日常');
    } else if (title.includes('工作') || title.includes('会议')) {
      tags.push('工作', '重要');
    } else if (title.includes('学习') || title.includes('阅读')) {
      tags.push('学习', '成长');
    } else if (title.includes('运动') || title.includes('健身')) {
      tags.push('健康', '运动');
    } else if (title.includes('社交') || title.includes('聚会') || title.includes('朋友')) {
      tags.push('社交', '娱乐');
    } else if (title.includes('娱乐') || title.includes('看剧') || title.includes('游戏')) {
      tags.push('娱乐', '休闲');
    } else {
      tags.push('日常');
    }
    
    return [...new Set(tags)]; // 去重
  }

  // 根据标签获取颜色（使用用户提供的色号）
  static getColorForTag(tag: string): string {
    const colorMap: Record<string, string> = {
      // 家务类 - Muddy Green (泥绿色)
      '家务': '#6A7334',
      '清洁': '#6A7334',
      '日常': '#6A7334',
      '猫咪': '#6A7334',
      
      // 工作类 - Carolina Blue (卡罗莱纳蓝)
      '工作': '#A0BBEB',
      '重要': '#A0BBEB',
      '会议': '#A0BBEB',
      
      // 社交类 - Raspberry Rose (覆盆子玫瑰)
      '社交': '#B34568',
      '朋友': '#B34568',
      '聚会': '#B34568',
      
      // 娱乐类 - Illusion (幻影粉)
      '娱乐': '#FB9FC9',
      '休闲': '#FB9FC9',
      '游戏': '#FB9FC9',
      
      // 学习类 - Pastel Purple (淡紫色)
      '学习': '#AA9FBE',
      '成长': '#AA9FBE',
      '阅读': '#AA9FBE',
      
      // 运动健康类 - Brass (黄铜色)
      '运动': '#A6B13C',
      '健康': '#A6B13C',
      '健身': '#A6B13C',
      
      // 饮食类 - Butter Yellow (奶油黄)
      '饮食': '#FFE288',
      '个人护理': '#F1E69F',
    };
    
    return colorMap[tag] || '#6A7334'; // 默认返回泥绿色
  }

  // 获取任务的主色调（基于第一个标签）
  static getTaskColor(tags: string[]): string {
    if (tags.length === 0) return '#6A7334';
    return this.getColorForTag(tags[0]);
  }

  // 识别关联的长期目标
  static identifyGoal(taskTitle: string): string | null {
    const title = taskTitle.toLowerCase();
    
    // 这里可以从 goalStore 中获取用户的长期目标列表
    // 暂时返回一些常见的目标匹配
    if (title.includes('健身') || title.includes('运动')) {
      return '保持健康体魄';
    }
    if (title.includes('学习') || title.includes('阅读')) {
      return '持续学习成长';
    }
    if (title.includes('工作') || title.includes('项目')) {
      return '职业发展';
    }
    
    return null;
  }

  // 计算金币（从用户设置中读取系数）
  static calculateGold(task: any): number {
    const duration = task.estimated_duration || 30;
    const taskType = task.task_type || 'life';

    // 默认金币规则
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

    // 从 localStorage 读取用户设置
    let baseMultiplier = 1.0;
    let typeMultiplier = 1.0;
    
    try {
      const userStorage = localStorage.getItem('user-storage');
      if (userStorage) {
        const userData = JSON.parse(userStorage);
        const settings = userData.state?.user?.settings;
        
        if (settings) {
          baseMultiplier = settings.goldRewardMultiplier || 1.0;
          
          // 任务类型系数（从设置中读取，如果没有则使用默认值）
          const taskTypeCoefficients = settings.taskTypeCoefficients || {
            work: 1.2,
            learning: 1.5,
            sport: 1.0,
            life: 0.8,
            creative: 1.3,
            social: 0.9,
            rest: 0.5,
          };
          
          typeMultiplier = taskTypeCoefficients[taskType] || 1.0;
        }
      }
    } catch (error) {
      console.error('读取用户设置失败:', error);
    }

    const rule = goldRules[taskType] || goldRules.life;
    const baseGold = rule.base + duration * rule.perMinute;
    
    // 应用系数
    return Math.round(baseGold * baseMultiplier * typeMultiplier);
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
