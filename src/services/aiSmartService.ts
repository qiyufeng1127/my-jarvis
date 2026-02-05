// ============================================
// AI 智能处理服务 - 完整版
// ============================================

import { MoneyAIProcessor } from './moneyAIService';
import { useAIStore } from '@/stores/aiStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';

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
    existing_side_hustles?: any[]; // 现有副业列表
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
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold' | 'add_to_inbox' | 'smart_schedule' | 'add_income' | 'add_expense' | 'create_side_hustle' | 'add_debt';
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
  priority: number; // 1=低, 2=中, 3=高
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
    
    // 按优先级排序（priority 是数字：1=低, 2=中, 3=高）
    const sortedTasks = [...inboxTasks].sort((a, b) => {
      return b.priority - a.priority;
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

    // 副业追踪相关（优先级最高）
    if (
      lowerInput.includes('赚了') ||
      lowerInput.includes('收入') ||
      lowerInput.includes('花了') ||
      lowerInput.includes('支出') ||
      lowerInput.includes('买了') ||
      lowerInput.includes('欠了') ||
      lowerInput.includes('副业') ||
      (lowerInput.includes('新建') && (lowerInput.includes('项目') || lowerInput.includes('副业')))
    ) {
      return 'money_tracking';
    }

    // 时间轴操作型（优先级最高）
    if (
      lowerInput.includes('删除') || 
      lowerInput.includes('移动') || 
      lowerInput.includes('修改') ||
      lowerInput.includes('顺延') ||
      lowerInput.includes('推迟') ||
      lowerInput.includes('提前') ||
      lowerInput.includes('清空') ||
      lowerInput.includes('取消')
    ) {
      return 'timeline_operation';
    }

    // 指定时间添加任务（优先级高于任务分解）
    if (
      lowerInput.match(/\d+[:：]\d+/) || // 匹配时间格式
      lowerInput.includes('在') ||
      lowerInput.includes('添加')
    ) {
      return 'scheduled_task';
    }

    // 任务分解型 - 重要修改：现在所有任务都走这个流程
    // AI 会自动判断是否需要拆分子任务
    // 只要不是上面的特殊类型，都作为任务处理
    return 'task_decomposition';
  }

  // 清理语音输入（去除语气词、重复表述）
  static cleanVoiceInput(input: string): string {
    let cleaned = input;
    
    // 1. 去除常见语气词
    const fillerWords = [
      '那个', '这个', '就是', '然后呢', '嗯', '啊', '呃', '哦', '哎',
      '把那个', '把这个', '那个那个', '这个这个',
    ];
    
    fillerWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      cleaned = cleaned.replace(regex, '');
    });
    
    // 2. 去除重复的动词短语（如"把那个把那个"）
    cleaned = cleaned.replace(/(.{1,3})\1+/g, '$1');
    
    // 3. 方言/口语转书面语
    const dialectMap: Record<string, string> = {
      '整一下': '处理',
      '搞一下': '处理',
      '弄一下': '处理',
      '搞定': '完成',
      '整好': '完成',
      '咋办': '怎么办',
      '咋整': '怎么做',
      '木有': '没有',
      '酱紫': '这样',
    };
    
    Object.entries(dialectMap).forEach(([dialect, standard]) => {
      const regex = new RegExp(dialect, 'g');
      cleaned = cleaned.replace(regex, standard);
    });
    
    // 4. 去除多余空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log('🎤 语音输入清理:', { original: input, cleaned });
    
    return cleaned;
  }

  // 智能分割任务（支持多种分隔符）
  static splitTasks(input: string): string[] {
    // 移除开头的时间前缀（如"5分钟后"、"五分钟之后"）
    let cleanInput = input.replace(/^[一二三四五六七八九十\d]+分钟[后之]后?/i, '').trim();
    
    // 按多种分隔符分割
    let tasks = cleanInput
      .split(/[、，,]|然后|之后|接着/)
      .map(t => t.trim())
      .filter(Boolean);
    
    // 如果只有一个任务，尝试按动词分割（如"去煮稀饭吃午饭 刷牙洗脸"）
    if (tasks.length === 1) {
      const actionVerbs = ['去', '吃', '洗', '刷', '做', '打扫', '收拾', '整理', '拖', '扫', '倒', '喂', '买', '看', '读', '写', '学', '练', '跑', '走', '睡', '起', '穿', '换', '拿', '放'];
      
      // 尝试在动词前分割（保留动词）
      let splitTasks: string[] = [];
      let currentTask = '';
      
      for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i];
        currentTask += char;
        
        // 检查是否遇到动词（且不是第一个字符）
        if (i > 0 && actionVerbs.includes(char)) {
          // 检查前一个字符是否是空格或其他分隔符
          const prevChar = cleanInput[i - 1];
          if (prevChar === ' ' || prevChar === '\n' || prevChar === '\t') {
            // 保存之前的任务（去掉最后的动词）
            const prevTask = currentTask.slice(0, -1).trim();
            if (prevTask) {
              splitTasks.push(prevTask);
            }
            // 开始新任务（从当前动词开始）
            currentTask = char;
          }
        }
      }
      
      // 添加最后一个任务
      if (currentTask.trim()) {
        splitTasks.push(currentTask.trim());
      }
      
      // 如果成功分割出多个任务，使用分割结果
      if (splitTasks.length > 1) {
        tasks = splitTasks;
      }
    }
    
    // 清理每个任务标题：移除时间相关字眼
    const cleanedTasks = tasks.map(task => {
      return task
        // 移除末尾的时长（如"20分钟"、"大概10分钟"、"做10分钟"）
        .replace(/(?:大概|做|持续|约)?(\d+)分钟?$/i, '')
        // 移除"X分钟后"、"X分钟之后"
        .replace(/[一二三四五六七八九十\d]+分钟[后之]后?/gi, '')
        // 移除单独的数字（如末尾的"10"）
        .replace(/\s+\d+$/i, '')
        .trim();
    });
    
    return cleanedTasks.filter(Boolean);
  }

  // 解析时间表达式（支持日期关键词和智能时间识别）
  static parseTimeExpression(input: string): Date | null {
    const now = new Date();
    
    // 识别日期关键词
    let targetDate: Date | null = null;
    
    // 优先检查"X分钟后" - 这应该是相对于当前时间，不涉及日期
    // 修复：确保识别的是"X分钟后"而不是其他包含"分钟"的表达
    const minutesMatch = input.match(/^(\d+)分钟[后之]后?/i);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      const targetTime = new Date(now.getTime() + minutes * 60000);
      console.log(`⏰ 识别到"${minutes}分钟后"，目标时间: ${targetTime.toLocaleString('zh-CN')}`);
      return targetTime;
    }
    
    // 1. 识别"明天"、"后天"、"昨天"、"今天"
    if (input.includes('明天') || input.includes('明日')) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (input.includes('后天')) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (input.includes('昨天') || input.includes('昨日')) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (input.includes('今天') || input.includes('今日')) {
      targetDate = new Date(now);
    }
    
    // 2. 识别"本周X"（本周一、本周二、本周三等）
    const weekdayMatch = input.match(/本周([一二三四五六日天])/);
    if (weekdayMatch) {
      const weekdayMap: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0
      };
      const targetWeekday = weekdayMap[weekdayMatch[1]];
      const currentWeekday = now.getDay();
      let dayDiff = targetWeekday - currentWeekday;
      
      // 如果目标日期已过，跳到下周
      if (dayDiff < 0) {
        dayDiff += 7;
      }
      
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayDiff);
    }
    
    // 3. 识别"这个月X号"、"本月X号"
    const thisMonthMatch = input.match(/(?:这个月|本月)(\d{1,2})号/);
    if (thisMonthMatch) {
      const day = parseInt(thisMonthMatch[1]);
      targetDate = new Date(now.getFullYear(), now.getMonth(), day);
      
      // 如果日期已过，跳到下个月
      if (targetDate < now) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
    }
    
    // 4. 识别"下个月X号"、"下月X号"
    const nextMonthMatch = input.match(/(?:下个月|下月)(\d{1,2})号/);
    if (nextMonthMatch) {
      const day = parseInt(nextMonthMatch[1]);
      targetDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
    }
    
    // 5. 识别"X月X号"
    const monthDayMatch = input.match(/(\d{1,2})月(\d{1,2})号/);
    if (monthDayMatch) {
      const month = parseInt(monthDayMatch[1]) - 1; // 月份从0开始
      const day = parseInt(monthDayMatch[2]);
      targetDate = new Date(now.getFullYear(), month, day);
      
      // 如果日期已过，跳到明年
      if (targetDate < now) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
    }
    
    // 6. 识别中文时间表达（如"十点半"、"九点"、"下午三点"）
    const chineseTimeMatch = input.match(/([上下早晚中]?[午晨]?)?([零一二三四五六七八九十百]+)点([一二三四五]?十?[零一二三四五六七八九]?分?|半|整)?/);
    if (chineseTimeMatch) {
      const period = chineseTimeMatch[1] || ''; // 上午/下午/早上/晚上
      const hourStr = chineseTimeMatch[2];
      const minuteStr = chineseTimeMatch[3] || '整';
      
      // 转换中文数字到阿拉伯数字
      const hours = this.chineseNumberToArabic(hourStr);
      let minutes = 0;
      
      if (minuteStr === '半') {
        minutes = 30;
      } else if (minuteStr === '整' || !minuteStr) {
        minutes = 0;
      } else {
        // 解析"十五分"、"四十五分"等
        const minStr = minuteStr.replace(/分$/, '');
        minutes = this.chineseNumberToArabic(minStr);
      }
      
      // 智能识别上午/下午
      let finalHours = hours;
      if (period.includes('下午') || period.includes('午后')) {
        finalHours = hours === 12 ? 12 : hours + 12;
      } else if (period.includes('晚上') || period.includes('夜')) {
        finalHours = hours === 12 ? 0 : hours + 12;
      } else if (period.includes('上午') || period.includes('早') || period.includes('晨')) {
        finalHours = hours;
      } else {
        // 没有明确指定，使用智能判断
        finalHours = this.smartDetectTimeOfDay(input, hours);
      }
      
      const targetTime = targetDate ? new Date(targetDate) : new Date(now);
      targetTime.setHours(finalHours, minutes, 0, 0);
      
      // 如果没有明确日期关键词，且时间已过，设置为明天
      if (!targetDate && targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      console.log(`⏰ 识别到中文时间: ${hourStr}点${minuteStr} → ${finalHours}:${minutes.toString().padStart(2, '0')}`);
      return targetTime;
    }
    
    // 7. 匹配 "HH:MM" 格式
    const timeMatch = input.match(/(\d{1,2})[:：](\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      // 智能识别上午/晚上
      const smartHours = this.smartDetectTimeOfDay(input, hours);
      
      const targetTime = targetDate ? new Date(targetDate) : new Date(now);
      targetTime.setHours(smartHours, minutes, 0, 0);

      // 如果没有明确日期关键词，且时间已过，设置为明天
      if (!targetDate && targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      return targetTime;
    }
    
    // 匹配 "在X:XX"
    const atTimeMatch = input.match(/在\s*(\d{1,2})[:：](\d{2})/);
    if (atTimeMatch) {
      const hours = parseInt(atTimeMatch[1]);
      const minutes = parseInt(atTimeMatch[2]);
      
      // 智能识别上午/晚上
      const smartHours = this.smartDetectTimeOfDay(input, hours);
      
      const targetTime = targetDate ? new Date(targetDate) : new Date(now);
      targetTime.setHours(smartHours, minutes, 0, 0);
      
      // 如果没有明确日期关键词，且时间已过，设置为明天
      if (!targetDate && targetTime < now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      return targetTime;
    }
    
    // 如果只有日期没有时间，返回当天的当前时间
    if (targetDate) {
      targetDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      return targetDate;
    }
    
    return null;
  }
  
  // 中文数字转阿拉伯数字
  static chineseNumberToArabic(chineseNum: string): number {
    const chineseMap: Record<string, number> = {
      '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
      '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
      '十': 10, '百': 100
    };
    
    // 处理特殊情况
    if (chineseNum === '十') return 10;
    if (chineseNum === '百') return 100;
    
    let result = 0;
    let temp = 0;
    let hasShiPrefix = false;
    
    for (let i = 0; i < chineseNum.length; i++) {
      const char = chineseNum[i];
      const num = chineseMap[char];
      
      if (num === undefined) continue;
      
      if (num === 10) {
        if (temp === 0 && i === 0) {
          // "十X" 表示 10+X
          hasShiPrefix = true;
          temp = 10;
        } else if (temp > 0) {
          // "X十" 表示 X*10
          temp = temp * 10;
        }
      } else if (num === 100) {
        temp = temp * 100;
      } else {
        if (hasShiPrefix || temp === 10) {
          // "十X" → 10 + X
          result = temp + num;
          temp = 0;
          hasShiPrefix = false;
        } else if (temp > 0 && temp % 10 === 0) {
          // "X十Y" → X*10 + Y
          result = temp + num;
          temp = 0;
        } else {
          temp = num;
        }
      }
    }
    
    result += temp;
    return result || 0;
  }
  
  // 智能识别时间是上午还是晚上
  static smartDetectTimeOfDay(input: string, hours: number): number {
    // 如果已经是24小时制（>12），直接返回
    if (hours > 12) {
      return hours;
    }
    
    // 如果明确指定了上午/下午/晚上
    if (input.includes('上午') || input.includes('早上') || input.includes('早晨')) {
      return hours;
    }
    if (input.includes('下午') || input.includes('午后')) {
      return hours === 12 ? 12 : hours + 12;
    }
    if (input.includes('晚上') || input.includes('夜里') || input.includes('夜晚')) {
      return hours === 12 ? 0 : hours + 12;
    }
    
    // 智能识别关键词
    const morningKeywords = ['起床', '穿衣', '洗漱', '刷牙', '早餐', '上班', '上学', '晨练'];
    const eveningKeywords = ['睡觉', '入睡', '休息', '晚餐', '下班', '回家', '洗澡'];
    
    const lowerInput = input.toLowerCase();
    
    // 检查是否包含早上的关键词
    for (const keyword of morningKeywords) {
      if (lowerInput.includes(keyword)) {
        return hours; // 上午
      }
    }
    
    // 检查是否包含晚上的关键词
    for (const keyword of eveningKeywords) {
      if (lowerInput.includes(keyword)) {
        return hours === 12 ? 0 : hours + 12; // 晚上
      }
    }
    
    // 根据时间段智能判断
    if (hours >= 6 && hours <= 11) {
      return hours; // 6-11点默认上午
    } else if (hours === 12) {
      return 12; // 12点默认中午
    } else if (hours >= 1 && hours <= 5) {
      // 1-5点需要根据上下文判断
      // 如果包含"起床"等关键词，是凌晨；否则是下午
      return hours + 12; // 默认下午
    }
    
    return hours;
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

  // 从任务描述中提取时长信息
  static extractDurationFromTask(taskTitle: string): number | null {
    // 匹配各种时长表达（20分钟、10分钟、40分钟等）
    const durationMatch = taskTitle.match(/(\d+)分钟/);
    if (durationMatch) {
      return parseInt(durationMatch[1]);
    }
    return null;
  }

  // 使用 AI 智能分析任务（增强版：支持优先级识别、语义理解、子任务拆分）
  static async analyzeTaskWithAI(taskTitle: string, extractedDuration?: number, context?: string): Promise<{
    tags: string[];
    location: string;
    duration: number;
    taskType: string;
    category: string;
    color: string;
    priority: number; // 1=低, 2=中, 3=高
    actionSteps?: string[]; // 动作步骤分解
    isComplex?: boolean; // 是否是复杂任务
    optimizedTitle?: string; // 优化后的标题（纠正错别字、简化表达）
    subtasks?: Array<{ title: string; duration: number; order: number }>; // 子任务列表
  }> {
    // 从 AI Store 获取配置
    const { config, isConfigured } = useAIStore.getState();
    
    if (!isConfigured()) {
      console.error('❌ API Key 未配置');
      throw new Error('API Key 未配置，请先在 AI 设置中配置');
    }
    
    const { apiKey, apiEndpoint, model } = config;
    
    // 强制使用 deepseek-chat 而不是 deepseek-reasoner（reasoner 不适合结构化输出）
    const useModel = model === 'deepseek-reasoner' ? 'deepseek-chat' : (model || 'deepseek-chat');
    
    const prompt = `你是任务分析专家。请深度分析任务，识别任务复杂度、纠正错误、优化表达、拆解子任务。

任务：${taskTitle}
${extractedDuration ? `指定时长：${extractedDuration}分钟` : ''}
${context ? `上下文：${context}` : ''}

用户家庭布局：
- 楼下：厕所、工作区、厨房（含猫砂和猫相关物品）、客厅
- 楼上：拍摄间、卧室

分析要求：
1. **纠错优化**：纠正错别字、语法错误、口语化表达，生成简洁清晰的标题
2. **复杂度识别**（重要！严格判断）：
   - **简单任务**（不拆分子任务）：
     * 15个字以内的任务
     * 单一动作（如"洗澡"、"吃饭"、"铲粑粑"、"收拾垃圾"、"拖地"、"扫地"）
     * 日常琐事、家务活
     * 不包含"把...全部"、"整套"、"流程"、"步骤"等关键词
     → isComplex: false，subtasks: []
   
   - **复杂任务**（需要拆分子任务）：
     * 包含"把...全部"、"整套"、"一系列"、"流程"、"步骤"等关键词
     * 用户已经在描述中列出了多个步骤或要求
     * 需要多个阶段完成的工作
     → isComplex: true，拆分为3-6个子任务

3. **子任务拆分原则**（仅复杂任务）：
   - **严格基于用户的原始描述**，不要自己想象或添加内容
   - 从用户的描述中提取关键步骤，不要编造新的步骤
   - 例如："把一整套Ins穿搭图的sop相关的工作流跟步骤全部都写好"
     → 拆分为：1. 整理工作流 2. 编写步骤 3. 完善文档
     → 而不是：1. 前期策划与准备 2. 场景与设备准备 3. 模特准备与造型...（这些都是瞎编的）
   - 每个子任务要具体、可执行、有明确的完成标准
   - 子任务按执行顺序排列（order: 1, 2, 3...）
   - 每个子任务估算时长（duration，单位：分钟）

4. **位置优化**：根据用户家庭布局，推断任务位置，优化任务顺序以减少走动
5. **优先级判断**：识别任务的紧急程度和重要性

返回格式（纯JSON，无注释）：
{
  "optimizedTitle": "优化后的标题（纠正错别字、简化表达）",
  "isComplex": false,
  "tags": ["标签1", "标签2"],
  "location": "位置",
  "duration": ${extractedDuration || 30},
  "taskType": "life",
  "category": "分类",
  "priority": 2,
  "actionSteps": ["步骤1", "步骤2"],
  "subtasks": []
}

位置选项：厕所、工作区、客厅、卧室、拍摄间、厨房、全屋、室外
taskType选项：work, study, health, life, finance, creative, rest
priority说明：
  - 1（低）：日常琐事、可延期的任务
  - 2（中）：常规任务、需按时完成
  - 3（高）：紧急重要、有截止日期、考试、寄件等

优先级判断规则：
- 包含"考试"、"截止"、"紧急"、"重要"、"必须" → 高优先级(3)
- 包含"寄件"、"快递"、"预约"、"会议" → 高优先级(3)
- 包含"身份证"、"准考证"等重要物品 → 高优先级(3)
- 工作、学习相关 → 中优先级(2)
- 日常家务、休闲娱乐 → 低优先级(1)

注意：
- **大部分任务都是简单任务，不需要拆分子任务**
- 只有明确包含多个步骤或阶段的任务才拆分
- 拆分时严格基于用户的原始描述，不要自己想象
- 如果是简单任务，subtasks 必须返回空数组 []
- 如果是复杂任务，子任务数量控制在3-6个

只返回JSON对象，不要任何其他文字。`;

    try {
      console.log('🚀 开始调用AI API:', { apiEndpoint, model: useModel });
      
      // 添加超时控制（30秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: useModel,
          messages: [
            { role: 'system', content: '你是任务分析助手。只返回纯JSON对象，不要markdown代码块，不要注释，不要其他文字。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API响应错误:', response.status, errorText);
        throw new Error(`AI分析失败 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API响应成功:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回格式错误');
      }
      
      const aiResponse = data.choices[0].message.content;
      console.log('🤖 AI原始响应:', aiResponse);
      
      // 提取JSON（处理可能的markdown代码块）
      let jsonStr = aiResponse.trim();
      
      // 移除 markdown 代码块标记
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }
      
      // 尝试提取 JSON 对象（处理可能的额外文本）
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // 移除 JSON 中的注释（// 和 /* */）
      jsonStr = jsonStr
        .replace(/\/\/.*$/gm, '')  // 移除单行注释
        .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
        .trim();
      
      console.log('📝 清理后的JSON字符串:', jsonStr);
      
      // 验证 JSON 是否完整
      if (!jsonStr || jsonStr.trim() === '' || jsonStr === '{}') {
        console.error('❌ JSON字符串为空或无效');
        throw new Error('AI返回的JSON为空');
      }
      
      let result;
      try {
        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError);
        console.error('原始响应:', aiResponse);
        console.error('清理后字符串:', jsonStr);
        throw new Error('JSON格式错误');
      }
      
      // 验证必需字段
      if (!result.tags || !Array.isArray(result.tags)) {
        console.warn('⚠️ tags字段缺失或格式错误，使用默认值');
        result.tags = ['日常'];
      }
      if (!result.location) {
        console.warn('⚠️ location字段缺失，使用默认值');
        result.location = '全屋';
      }
      if (!result.duration) {
        console.warn('⚠️ duration字段缺失，使用默认值');
        result.duration = extractedDuration || 30;
      }
      if (!result.priority || result.priority < 1 || result.priority > 3) {
        console.warn('⚠️ priority字段缺失或无效，使用默认值');
        result.priority = 2;
      }
      
      // 根据第一个标签获取颜色
      const color = this.getColorForTag(result.tags[0]);
      
      console.log('🤖 AI分析结果:', {
        title: taskTitle,
        optimizedTitle: result.optimizedTitle,
        isComplex: result.isComplex,
        tags: result.tags,
        color: color,
        location: result.location,
        duration: result.duration,
        priority: result.priority,
        actionSteps: result.actionSteps,
        subtasks: result.subtasks,
      });
      
      return {
        tags: result.tags || ['日常'],
        location: result.location || '全屋',
        duration: result.duration || 30,
        taskType: result.taskType || 'life',
        category: result.category || '生活事务',
        color: color,
        priority: result.priority || 2,
        actionSteps: result.actionSteps || [],
        isComplex: result.isComplex || false,
        optimizedTitle: result.optimizedTitle || taskTitle,
        subtasks: result.subtasks || [],
      };
    } catch (error: any) {
      console.error('❌ AI分析失败，使用默认值:', error);
      
      // 如果是超时错误
      if (error.name === 'AbortError') {
        console.error('⏱️ API请求超时（30秒）');
        throw new Error('AI请求超时，请检查网络连接或稍后重试');
      }
      
      // 如果是网络错误
      if (error.message.includes('fetch')) {
        console.error('🌐 网络连接失败');
        throw new Error('网络连接失败，请检查网络设置');
      }
      
      // 其他错误，返回默认值
      console.warn('⚠️ 使用默认值继续');
      return {
        tags: ['日常', '待办'],
        location: '全屋',
        duration: extractedDuration || 30,
        taskType: 'life',
        category: '生活事务',
        color: '#6A7334',
        priority: 2,
        actionSteps: [],
        isComplex: false,
        optimizedTitle: taskTitle,
        subtasks: [],
      };
    }
  }

  // 检测重复任务（智能合并）
  static detectDuplicateTasks(tasks: any[]): { duplicates: any[][]; suggestions: string[] } {
    const duplicates: any[][] = [];
    const suggestions: string[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < tasks.length; i++) {
      if (processed.has(i)) continue;

      const task1 = tasks[i];
      const relatedTasks = [task1];

      for (let j = i + 1; j < tasks.length; j++) {
        if (processed.has(j)) continue;

        const task2 = tasks[j];
        
        // 检测重复关键词
        const keywords1 = this.extractKeywords(task1.title);
        const keywords2 = this.extractKeywords(task2.title);
        
        const commonKeywords = keywords1.filter(k => keywords2.includes(k));
        
        // 如果有共同关键词，认为是相关任务
        if (commonKeywords.length > 0) {
          relatedTasks.push(task2);
          processed.add(j);
        }
      }

      if (relatedTasks.length > 1) {
        duplicates.push(relatedTasks);
        
        // 生成合并建议
        const titles = relatedTasks.map(t => t.title).join('、');
        const mergedTitle = this.generateMergedTitle(relatedTasks);
        suggestions.push(`建议合并：${titles} → ${mergedTitle}`);
      }
    }

    return { duplicates, suggestions };
  }

  // 提取关键词
  static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const importantWords = ['身份证', '准考证', '钥匙', '手机', '钱包', '考试', '寄件', '快递', '照片', '文档'];
    
    importantWords.forEach(word => {
      if (text.includes(word)) {
        keywords.push(word);
      }
    });
    
    return keywords;
  }

  // 生成合并后的标题
  static generateMergedTitle(tasks: any[]): string {
    const keywords = new Set<string>();
    tasks.forEach(task => {
      this.extractKeywords(task.title).forEach(k => keywords.add(k));
    });
    
    if (keywords.size > 0) {
      const keywordList = Array.from(keywords);
      return `准备${keywordList.join('和')}（${tasks[0].category || '待办'}）`;
    }
    
    return tasks[0].title;
  }

  // 处理任务分解（使用AI智能分析）
  // 智能识别：如果包含多个"然后"，拆分成多个大任务；否则作为一个大任务
  static async handleTaskDecomposition(input: string, context: any): Promise<AIProcessResponse> {
    console.log('🔍 开始处理任务分解:', input);
    
    // 检查 API 配置
    const { isConfigured } = useAIStore.getState();
    if (!isConfigured()) {
      console.error('❌ API Key 未配置');
      return {
        message: '❌ API Key 未配置\n\n请先在 AI 设置中配置 API Key 和 API 端点。\n\n点击右上角的 ⚙️ 图标进行配置。',
        autoExecute: false,
      };
    }
    
    // 解析时间起点
    let startTime = this.parseTimeExpression(input);
    if (!startTime) {
      startTime = new Date(Date.now() + 5 * 60000);
    }
    console.log('⏰ 起始时间:', startTime.toLocaleString('zh-CN'));
    
    // 清理输入（移除时间前缀）
    const rawInput = input.replace(/^[一二三四五六七八九十\d]+分钟[后之]后?/i, '').trim();
    
    console.log('📋 清理后的输入:', rawInput);
    
    if (!rawInput) {
      return {
        message: '抱歉，我没有识别到任何任务。请重新输入。',
        autoExecute: false,
      };
    }

    // 智能判断：如果包含多个"然后"或"，"，说明用户想要多个独立的任务
    const hasMultipleTasks = (rawInput.match(/然后|，|、/g) || []).length >= 2;
    
    console.log('🤔 是否包含多个任务:', hasMultipleTasks);
    
    let hasError = false;
    let errorMessage = '';
    
    try {
      // 如果包含多个任务，按分隔符拆分
      if (hasMultipleTasks) {
        console.log('📋 检测到多个任务，开始拆分...');
        
        // 按"然后"、"，"、"、"拆分
        const taskList = rawInput
          .split(/然后|，|、/)
          .map(t => t.trim())
          .filter(Boolean);
        
        console.log('📋 拆分结果:', taskList);
        
        const allTasks: any[] = [];
        let currentTime = new Date(startTime);
        
        // 为每个任务单独调用 AI 分析
        for (let i = 0; i < taskList.length; i++) {
          const taskText = taskList[i];
          const extractedDuration = this.extractDurationFromTask(taskText);
          const cleanTitle = taskText.replace(/\d+分钟$/i, '').trim();
          
          console.log(`📝 任务 ${i + 1}: "${cleanTitle}"`);
          
          try {
            const aiAnalysis = await this.analyzeTaskWithAI(cleanTitle, extractedDuration || undefined);
            
            const start = new Date(currentTime);
            const end = new Date(currentTime.getTime() + aiAnalysis.duration * 60000);
            const goal = this.identifyGoal(cleanTitle);
            const finalTitle = aiAnalysis.optimizedTitle || cleanTitle;
            
            const subtasks = aiAnalysis.isComplex && aiAnalysis.subtasks && aiAnalysis.subtasks.length > 0
              ? aiAnalysis.subtasks.map((sub, idx) => ({
                  id: crypto.randomUUID(),
                  title: sub.title,
                  isCompleted: false,
                  durationMinutes: sub.duration,
                  order: sub.order || idx + 1,
                }))
              : undefined;
            
            const task = {
              sequence: i + 1,
              title: finalTitle,
              description: finalTitle,
              estimated_duration: aiAnalysis.duration,
              scheduled_start: start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              scheduled_end: end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              scheduled_start_iso: start.toISOString(),
              task_type: aiAnalysis.taskType,
              category: aiAnalysis.category,
              location: aiAnalysis.location,
              tags: aiAnalysis.tags,
              goal: goal,
              gold: this.calculateGold({ estimated_duration: aiAnalysis.duration, task_type: aiAnalysis.taskType }),
              color: aiAnalysis.color,
              priority: aiAnalysis.priority || 2,
              actionSteps: aiAnalysis.actionSteps || [],
              isComplex: aiAnalysis.isComplex || false,
              subtasks: subtasks,
            };
            
            allTasks.push(task);
            currentTime = new Date(end.getTime());
          } catch (taskError: any) {
            console.error(`❌ 任务 ${i + 1} 分析失败:`, taskError);
            hasError = true;
            errorMessage = taskError.message || '任务分析失败';
            break;
          }
        }
        
        if (allTasks.length === 0) {
          throw new Error('没有成功分析任何任务');
        }
        
        console.log(`✅ 成功分析 ${allTasks.length} 个任务`);
        
        // 构建消息
        let message = hasError 
          ? `⚠️ 部分任务分析成功（${allTasks.length}/${taskList.length}）：\n\n`
          : `✅ AI已智能分析 ${allTasks.length} 个任务：\n\n`;
        
        allTasks.forEach((task) => {
          const priorityEmoji = task.priority === 3 ? '🔴' : task.priority === 2 ? '🟡' : '🟢';
          const complexEmoji = task.isComplex ? '📦' : '📝';
          message += `${task.sequence}. ${priorityEmoji}${complexEmoji} **${task.title}** 📍${task.location}\n`;
          message += `   ⏰ ${task.scheduled_start}-${task.scheduled_end} | ${task.estimated_duration}分钟 | 💰${task.gold}\n`;
          message += `   🏷️ ${task.tags.join(' ')}`;
          if (task.goal) {
            message += ` | 🎯 ${task.goal}`;
          }
          if (task.subtasks && task.subtasks.length > 0) {
            message += `\n   📋 子任务 (${task.subtasks.length}个):\n`;
            task.subtasks.forEach((sub: any) => {
              message += `      ${sub.order}. ${sub.title} (${sub.durationMinutes}分钟)\n`;
            });
          }
          message += `\n`;
        });
        
        const totalDuration = allTasks.reduce((sum, t) => sum + t.estimated_duration, 0);
        const totalGold = allTasks.reduce((sum, t) => sum + t.gold, 0);
        message += `📊 总计：${totalDuration}分钟 | 💰${totalGold}金币\n\n`;
        message += `💡 正在打开事件卡片编辑器，你可以编辑后推送到时间轴`;
        
        return {
          message,
          data: {
            decomposed_tasks: allTasks,
            total_duration: totalDuration,
            total_gold: totalGold,
            grouped_by_location: this.groupTasksByLocation(allTasks),
            duplicate_suggestions: [],
          },
          actions: [
            {
              type: 'create_task' as const,
              data: { tasks: allTasks },
              label: '✅ 确认并添加到时间轴',
            },
          ],
          needsConfirmation: true,
          autoExecute: false,
        };
      } else {
        // 单个任务，作为一个大任务处理
        console.log('📝 单个任务，作为大任务处理');
        
        const extractedDuration = this.extractDurationFromTask(rawInput);
        const cleanTitle = rawInput.replace(/\d+分钟$/i, '').trim();
        
        console.log(`📝 大任务: "${cleanTitle}", 指定时长: ${extractedDuration || '无'}`);
        
        const aiAnalysis = await this.analyzeTaskWithAI(cleanTitle, extractedDuration || undefined, rawInput);
        
        const start = new Date(startTime);
        const end = new Date(startTime.getTime() + aiAnalysis.duration * 60000);
        const goal = this.identifyGoal(cleanTitle);
        const finalTitle = aiAnalysis.optimizedTitle || cleanTitle;
        
        const subtasks = aiAnalysis.isComplex && aiAnalysis.subtasks && aiAnalysis.subtasks.length > 0
          ? aiAnalysis.subtasks.map((sub, idx) => ({
              id: crypto.randomUUID(),
              title: sub.title,
              isCompleted: false,
              durationMinutes: sub.duration,
              order: sub.order || idx + 1,
            }))
          : undefined;
        
        const mainTask = {
          sequence: 1,
          title: finalTitle,
          description: finalTitle,
          estimated_duration: aiAnalysis.duration,
          scheduled_start: start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          scheduled_end: end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          scheduled_start_iso: start.toISOString(),
          task_type: aiAnalysis.taskType,
          category: aiAnalysis.category,
          location: aiAnalysis.location,
          tags: aiAnalysis.tags,
          goal: goal,
          gold: this.calculateGold({ estimated_duration: aiAnalysis.duration, task_type: aiAnalysis.taskType }),
          color: aiAnalysis.color,
          priority: aiAnalysis.priority || 2,
          actionSteps: aiAnalysis.actionSteps || [],
          isComplex: aiAnalysis.isComplex || false,
          subtasks: subtasks,
        };

        console.log('✅ AI智能分析完成:', mainTask);

        const priorityEmoji = mainTask.priority === 3 ? '🔴' : mainTask.priority === 2 ? '🟡' : '🟢';
        const complexEmoji = mainTask.isComplex ? '📦' : '📝';
        
        let message = `✅ AI已智能分析任务：\n\n`;
        message += `${priorityEmoji}${complexEmoji} **${mainTask.title}** 📍${mainTask.location}\n`;
        message += `⏰ ${mainTask.scheduled_start}-${mainTask.scheduled_end} | ${mainTask.estimated_duration}分钟 | 💰${mainTask.gold}\n`;
        message += `🏷️ ${mainTask.tags.join(' ')}`;
        if (mainTask.goal) {
          message += ` | 🎯 ${mainTask.goal}`;
        }
        message += `\n`;
        
        if (mainTask.subtasks && mainTask.subtasks.length > 0) {
          message += `\n📋 子任务 (${mainTask.subtasks.length}个):\n`;
          mainTask.subtasks.forEach((sub: any) => {
            message += `   ${sub.order}. ${sub.title} (${sub.durationMinutes}分钟)\n`;
          });
          message += `\n`;
        }
        
        message += `\n💡 正在打开事件卡片编辑器，你可以编辑后推送到时间轴`;

        return {
          message,
          data: {
            decomposed_tasks: [mainTask],
            total_duration: mainTask.estimated_duration,
            total_gold: mainTask.gold,
            grouped_by_location: { [mainTask.location]: [mainTask] },
            duplicate_suggestions: [],
          },
          actions: [
            {
              type: 'create_task' as const,
              data: { tasks: [mainTask] },
              label: '✅ 确认并添加到时间轴',
            },
          ],
          needsConfirmation: true,
          autoExecute: false,
        };
      }
    } catch (error: any) {
      console.error('❌ 任务分析失败:', error);
      return {
        message: `❌ 任务分析失败\n\n${error.message || '未知错误'}\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. API 端点是否可访问\n\n你可以在右上角 ⚙️ 中重新配置 API。`,
        autoExecute: false,
      };
    }
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

  // 按位置排序任务（增强版：优先级+动线优化+家庭布局）
  static sortTasksByLocationAndPriority(grouped: Record<string, any[]>): any[] {
    const sorted: any[] = [];
    let currentTime = new Date();
    
    // 位置优先级（按照用户家里的实际格局和动线）
    // 楼下：厕所 → 工作区 → 厨房（含猫） → 客厅
    // 楼上：拍摄间 → 卧室
    // 优化原则：先完成楼下的事情，再上楼；同一楼层按动线顺序
    const locationPriority = ['厕所', '工作区', '厨房', '客厅', '拍摄间', '卧室', '全屋', '室外'];
    
    // 按位置分组后，每组内按优先级排序
    locationPriority.forEach(location => {
      if (grouped[location]) {
        // 组内按优先级排序（高优先级优先）
        const sortedByPriority = grouped[location].sort((a, b) => {
          return (b.priority || 2) - (a.priority || 2);
        });
        
        sortedByPriority.forEach(task => {
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

  // 生成区域批次任务包
  static generateLocationBatches(tasks: any[]): { location: string; tasks: any[]; totalDuration: number; totalGold: number }[] {
    const grouped = this.groupTasksByLocation(tasks);
    const batches: { location: string; tasks: any[]; totalDuration: number; totalGold: number }[] = [];
    
    Object.entries(grouped).forEach(([location, locationTasks]) => {
      const totalDuration = locationTasks.reduce((sum, t) => sum + t.estimated_duration, 0);
      const totalGold = locationTasks.reduce((sum, t) => sum + t.gold, 0);
      
      batches.push({
        location,
        tasks: locationTasks,
        totalDuration,
        totalGold,
      });
    });
    
    // 按任务数量排序（任务多的区域优先）
    return batches.sort((a, b) => b.tasks.length - a.tasks.length);
  }

  // 根据标签获取颜色（使用用户提供的色号）
  static getColorForTag(tag: string): string {
    const colorMap: Record<string, string> = {
      // 家务类 - Muddy Green (泥绿色)
      '家务': '#6A7334',
      '清洁': '#6A7334',
      '日常': '#6A7334',
      '猫咪': '#6A7334',
      '拖地': '#6A7334',
      '扫地': '#6A7334',
      '洗衣服': '#6A7334',
      '铲猫砂': '#6A7334',
      '收纳': '#6A7334',
      '整理': '#6A7334',
      '打扫': '#6A7334',
      '卫生': '#6A7334',
      
      // 工作类 - Carolina Blue (卡罗莱纳蓝)
      '工作': '#A0BBEB',
      '重要': '#A0BBEB',
      '会议': '#A0BBEB',
      '编程': '#A0BBEB',
      '设计': '#A0BBEB',
      '开发': '#A0BBEB',
      '技术': '#A0BBEB',
      '文档': '#A0BBEB',
      '职业': '#A0BBEB',
      
      // 社交类 - Raspberry Rose (覆盆子玫瑰)
      '社交': '#B34568',
      '朋友': '#B34568',
      '聚会': '#B34568',
      '人际': '#B34568',
      '关系': '#B34568',
      
      // 娱乐类 - Illusion (幻影粉)
      '娱乐': '#FB9FC9',
      '休闲': '#FB9FC9',
      '游戏': '#FB9FC9',
      '放松': '#FB9FC9',
      
      // 学习类 - Pastel Purple (淡紫色)
      '学习': '#AA9FBE',
      '成长': '#AA9FBE',
      '阅读': '#AA9FBE',
      '课程': '#AA9FBE',
      '教育': '#AA9FBE',
      '提升': '#AA9FBE',
      
      // 运动健康类 - Brass (黄铜色)
      '运动': '#A6B13C',
      '健康': '#A6B13C',
      '健身': '#A6B13C',
      '跑步': '#A6B13C',
      '锻炼': '#A6B13C',
      '瑜伽': '#A6B13C',
      
      // 饮食类 - Butter Yellow (奶油黄)
      '饮食': '#FFE288',
      '个人护理': '#F1E69F',
      '早餐': '#FFE288',
      '午餐': '#FFE288',
      '晚餐': '#FFE288',
      '做饭': '#FFE288',
      '美容': '#F1E69F',
      '护肤': '#F1E69F',
      
      // 外出类 - Muddy Green (泥绿色)
      '购物': '#6A7334',
      '室外': '#6A7334',
      '外出': '#6A7334',
    };
    
    return colorMap[tag] || '#6A7334'; // 默认返回泥绿色
  }

  // 获取任务的主色调（基于第一个标签）
  static getTaskColor(tags: string[]): string {
    if (tags.length === 0) return '#6A7334';
    return this.getColorForTag(tags[0]);
  }

  // 推断任务位置（简化版，用于编辑器实时更新）
  static inferLocation(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('厕所') || title.includes('洗漱') || title.includes('刷牙') || title.includes('洗脸')) {
      return '厕所';
    }
    if (title.includes('工作') || title.includes('编程') || title.includes('写代码') || title.includes('电脑')) {
      return '工作区';
    }
    if (title.includes('客厅') || title.includes('沙发')) {
      return '客厅';
    }
    if (title.includes('卧室') || title.includes('睡觉') || title.includes('床')) {
      return '卧室';
    }
    if (title.includes('拍摄') || title.includes('录制') || title.includes('视频')) {
      return '拍摄间';
    }
    if (title.includes('厨房') || title.includes('做饭') || title.includes('煮') || title.includes('炒')) {
      return '厨房';
    }
    if (title.includes('室外') || title.includes('外出') || title.includes('购物') || title.includes('散步')) {
      return '室外';
    }
    
    return '全屋';
  }

  // 生成任务标签（简化版，用于编辑器实时更新）
  static generateTags(taskTitle: string): string[] {
    const title = taskTitle.toLowerCase();
    const tags: string[] = [];
    
    // 家务类
    if (title.includes('打扫') || title.includes('清洁') || title.includes('拖地') || title.includes('扫地')) {
      tags.push('家务', '清洁');
    } else if (title.includes('猫') || title.includes('铲猫砂') || title.includes('喂猫')) {
      tags.push('家务', '猫咪');
    } else if (title.includes('洗衣') || title.includes('晾衣')) {
      tags.push('家务', '日常');
    }
    // 工作类
    else if (title.includes('工作') || title.includes('编程') || title.includes('开发') || title.includes('会议')) {
      tags.push('工作');
    }
    // 学习类
    else if (title.includes('学习') || title.includes('阅读') || title.includes('看书') || title.includes('课程')) {
      tags.push('学习', '成长');
    }
    // 运动类
    else if (title.includes('运动') || title.includes('健身') || title.includes('跑步') || title.includes('锻炼')) {
      tags.push('运动', '健康');
    }
    // 饮食类
    else if (title.includes('吃') || title.includes('早餐') || title.includes('午餐') || title.includes('晚餐') || title.includes('做饭')) {
      tags.push('饮食');
    }
    // 个人护理
    else if (title.includes('洗漱') || title.includes('刷牙') || title.includes('洗脸') || title.includes('护肤')) {
      tags.push('个人护理');
    }
    // 默认
    else {
      tags.push('日常');
    }
    
    return tags;
  }

  // 推断任务类型（简化版，用于编辑器实时更新）
  static inferTaskType(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('工作') || title.includes('会议') || title.includes('编程')) {
      return 'work';
    }
    if (title.includes('学习') || title.includes('阅读') || title.includes('课程')) {
      return 'learning';
    }
    if (title.includes('运动') || title.includes('健身') || title.includes('跑步')) {
      return 'sport';
    }
    if (title.includes('创作') || title.includes('写作') || title.includes('设计')) {
      return 'creative';
    }
    if (title.includes('社交') || title.includes('朋友') || title.includes('聚会')) {
      return 'social';
    }
    if (title.includes('休息') || title.includes('睡觉') || title.includes('放松')) {
      return 'rest';
    }
    
    return 'life';
  }

  // 推断任务分类（简化版，用于编辑器实时更新）
  static inferCategory(taskTitle: string): string {
    const title = taskTitle.toLowerCase();
    
    if (title.includes('工作') || title.includes('会议')) {
      return '工作事务';
    }
    if (title.includes('学习') || title.includes('阅读')) {
      return '学习成长';
    }
    if (title.includes('运动') || title.includes('健身')) {
      return '运动健康';
    }
    if (title.includes('家务') || title.includes('打扫')) {
      return '家务清洁';
    }
    
    return '生活事务';
  }

  // 估算任务时长（增强版：基于历史数据）
  static estimateTaskDuration(taskTitle: string, taskType?: string, category?: string): number {
    const title = taskTitle.toLowerCase();
    
    // 1. 优先从历史记录中获取
    try {
      const historyStore = useTaskHistoryStore.getState();
      
      // 尝试获取相似任务的平均时长
      const avgDuration = historyStore.getAverageDuration(taskTitle);
      if (avgDuration) {
        console.log(`📊 基于历史数据预估时长: ${avgDuration}分钟`);
        return avgDuration;
      }
      
      // 尝试按类型获取
      if (taskType) {
        const typeDuration = historyStore.getAverageDurationByType(taskType);
        if (typeDuration) {
          console.log(`📊 基于任务类型预估时长: ${typeDuration}分钟`);
          return typeDuration;
        }
      }
      
      // 尝试按分类获取
      if (category) {
        const categoryDuration = historyStore.getAverageDurationByCategory(category);
        if (categoryDuration) {
          console.log(`📊 基于任务分类预估时长: ${categoryDuration}分钟`);
          return categoryDuration;
        }
      }
    } catch (error) {
      console.warn('⚠️ 无法从历史记录获取时长，使用默认规则');
    }
    
    // 2. 使用默认规则
    // 快速任务（5-15分钟）
    if (title.includes('刷牙') || title.includes('洗脸') || title.includes('喝水')) {
      return 5;
    }
    if (title.includes('洗漱') || title.includes('穿衣')) {
      return 10;
    }
    
    // 中等任务（20-40分钟）
    if (title.includes('吃饭') || title.includes('早餐') || title.includes('午餐') || title.includes('晚餐')) {
      return 20;
    }
    if (title.includes('打扫') || title.includes('拖地') || title.includes('扫地')) {
      return 30;
    }
    
    // 长任务（60分钟以上）
    if (title.includes('工作') || title.includes('学习') || title.includes('会议')) {
      return 60;
    }
    if (title.includes('做饭') || title.includes('煮饭')) {
      return 40;
    }
    
    // 默认30分钟
    return 30;
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

  // 使用AI智能解析时间轴操作指令
  static async parseTimelineOperationWithAI(
    input: string, 
    existingTasks: any[]
  ): Promise<{
    operation: 'delete' | 'move' | 'modify' | 'add' | 'delay';
    filters?: {
      date?: string; // 'today' | 'yesterday' | 'tomorrow' | '2024-01-31'
      timeRange?: { start: string; end: string }; // '15:00' - '18:00'
      taskIds?: string[];
      all?: boolean;
      targetDate?: string; // 移动任务的目标日期
    };
    newTask?: {
      title: string;
      time: string;
      duration: number;
    };
    delayMinutes?: number;
  }> {
    // 从 AI Store 获取配置
    const { config, isConfigured } = useAIStore.getState();
    
    if (!isConfigured()) {
      throw new Error('API Key 未配置，请先在 AI 设置中配置');
    }
    
    const { apiKey, apiEndpoint, model } = config;
    
    const tasksInfo = existingTasks.map(t => ({
      id: t.id,
      title: t.title,
      start: t.scheduledStart ? new Date(t.scheduledStart).toLocaleString('zh-CN') : '',
    }));

    const prompt = `你是一个时间轴操作助手。请分析用户的指令并返回JSON格式的操作。

用户指令：${input}

当前时间：${new Date().toLocaleString('zh-CN')}
当前日期：${new Date().toLocaleDateString('zh-CN')} (${new Date().getMonth() + 1}月${new Date().getDate()}号)

现有任务列表：
${tasksInfo.map((t, i) => `${i + 1}. ${t.title} (${t.start})`).join('\n')}

请返回以下格式的JSON（必须是有效的JSON）：
{
  "operation": "delete",  // 操作类型：delete(删除) | move(移动) | modify(修改) | add(添加) | delay(顺延)
  "filters": {
    "date": "today",  // 日期过滤：today | yesterday | tomorrow | 具体日期
    "timeRange": { "start": "15:00", "end": "18:00" },  // 时间范围（可选）
    "all": true,  // 是否全部（可选）
    "targetDate": "today"  // 移动任务的目标日期（仅用于move操作）
  },
  "newTask": {  // 如果是添加任务（可选）
    "title": "任务名称",
    "time": "15:40",
    "duration": 30
  },
  "delayMinutes": 60  // 如果是顺延，延迟多少分钟（可选）
}

示例：
1. "删除今天所有的任务" → {"operation": "delete", "filters": {"date": "today", "all": true}}
2. "删除今天下午3点以后的任务" → {"operation": "delete", "filters": {"date": "today", "timeRange": {"start": "15:00", "end": "23:59"}}}
3. "在今天下午3:40增加一个开会任务" → {"operation": "add", "newTask": {"title": "开会", "time": "15:40", "duration": 60}}
4. "把今天的任务往后推1小时" → {"operation": "delay", "filters": {"date": "today"}, "delayMinutes": 60}
5. "把5号的任务移动到4号" → {"operation": "move", "filters": {"date": "2024-02-05"}, "targetDate": "2024-02-04"}
6. "把明天的任务移动到今天" → {"operation": "move", "filters": {"date": "tomorrow"}, "targetDate": "today"}

只返回JSON，不要其他文字。`;

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个时间轴操作助手，专门解析用户的时间轴操作指令。只返回JSON格式，不要其他内容。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('AI解析失败');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // 提取JSON
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      
      const result = JSON.parse(jsonStr);
      
      console.log('🤖 AI解析时间轴操作:', result);
      
      return result;
    } catch (error) {
      console.error('AI解析失败:', error);
      throw new Error('无法理解你的指令，请重新描述');
    }
  }

  // 处理时间轴操作
  static async handleTimelineOperation(input: string, context: any): Promise<AIProcessResponse> {
    // 从 AI Store 获取配置
    const { isConfigured } = useAIStore.getState();
    
    if (!isConfigured()) {
      return {
        message: '⚠️ 请先配置API Key才能使用AI智能操作功能',
        autoExecute: false,
      };
    }

    try {
      const existingTasks = context.existing_tasks || [];
      const operation = await this.parseTimelineOperationWithAI(input, existingTasks);
      
      // 根据操作类型执行不同的逻辑
      if (operation.operation === 'delete') {
        // 删除任务
        const tasksToDelete = this.filterTasks(existingTasks, operation.filters);
        
        if (tasksToDelete.length === 0) {
          return {
            message: '❌ 没有找到符合条件的任务',
            autoExecute: false,
          };
        }
        
        return {
          message: `⚠️ 确认删除以下 ${tasksToDelete.length} 个任务？\n\n${tasksToDelete.map(t => `• ${t.title}`).join('\n')}`,
          actions: [
            {
              type: 'update_timeline',
              data: {
                operation: 'delete',
                taskIds: tasksToDelete.map(t => t.id),
                navigateToTimeline: true, // 添加导航标记
              },
              label: '确认删除',
            },
          ],
          needsConfirmation: true,
          autoExecute: false,
        };
      } else if (operation.operation === 'move') {
        // 移动任务到指定日期
        const tasksToMove = this.filterTasks(existingTasks, operation.filters);
        
        if (tasksToMove.length === 0) {
          return {
            message: '❌ 没有找到符合条件的任务',
            autoExecute: false,
          };
        }
        
        // 解析目标日期
        const targetDateStr = operation.filters?.targetDate || 'today';
        let targetDate = new Date();
        targetDate.setHours(0, 0, 0, 0); // 重置到当天0点
        
        if (targetDateStr === 'yesterday') {
          targetDate.setDate(targetDate.getDate() - 1);
        } else if (targetDateStr === 'tomorrow') {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (targetDateStr !== 'today') {
          // 尝试解析具体日期（如"2024-02-04"）
          const parsedDate = new Date(targetDateStr);
          if (!isNaN(parsedDate.getTime())) {
            targetDate = parsedDate;
            targetDate.setHours(0, 0, 0, 0);
          }
        }
        
        return {
          message: `⏰ 准备将以下 ${tasksToMove.length} 个任务移动到 ${targetDate.toLocaleDateString('zh-CN')}：\n\n${tasksToMove.map(t => `• ${t.title}`).join('\n')}`,
          actions: [
            {
              type: 'update_timeline',
              data: {
                operation: 'move',
                taskIds: tasksToMove.map(t => t.id),
                targetDate: targetDate.toISOString(),
                navigateToTimeline: true,
              },
              label: '确认移动',
            },
          ],
          needsConfirmation: true,
          autoExecute: false,
        };
      } else if (operation.operation === 'add') {
        // 添加任务
        const newTask = operation.newTask!;
        const today = new Date();
        const [hours, minutes] = newTask.time.split(':');
        const scheduledTime = new Date(today.setHours(parseInt(hours), parseInt(minutes), 0, 0));
        
        return {
          message: `✅ 准备在 ${newTask.time} 添加任务：${newTask.title}`,
          actions: [
            {
              type: 'create_task',
              data: {
                title: newTask.title,
                scheduled_time: scheduledTime.toISOString(),
                estimated_duration: newTask.duration,
                task_type: 'work',
              },
              label: '确认添加',
            },
          ],
          autoExecute: true,
        };
      } else if (operation.operation === 'delay') {
        // 顺延任务
        const tasksToDelay = this.filterTasks(existingTasks, operation.filters);
        
        if (tasksToDelay.length === 0) {
          return {
            message: '❌ 没有找到符合条件的任务',
            autoExecute: false,
          };
        }
        
        const delayMinutes = operation.delayMinutes || 60;
        
        return {
          message: `⏰ 准备将以下 ${tasksToDelay.length} 个任务往后推 ${delayMinutes} 分钟：\n\n${tasksToDelay.map(t => `• ${t.title}`).join('\n')}`,
          actions: [
            {
              type: 'update_timeline',
              data: {
                operation: 'delay',
                taskIds: tasksToDelay.map(t => t.id),
                delayMinutes: delayMinutes,
              },
              label: '确认顺延',
            },
          ],
          needsConfirmation: true,
          autoExecute: false,
        };
      } else {
        return {
          message: '⚠️ 该操作类型暂不支持，敬请期待！',
          autoExecute: false,
        };
      }
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '操作失败，请重新描述你的需求'}`,
        autoExecute: false,
      };
    }
  }

  // 过滤任务
  static filterTasks(tasks: any[], filters?: any): any[] {
    if (!filters) return tasks;
    
    let filtered = [...tasks];
    
    // 日期过滤
    if (filters.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let targetDate = new Date(today);
      
      if (filters.date === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (filters.date === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (filters.date !== 'today') {
        // 尝试解析具体日期（如"2024-02-05"）
        const parsedDate = new Date(filters.date);
        if (!isNaN(parsedDate.getTime())) {
          targetDate = parsedDate;
          targetDate.setHours(0, 0, 0, 0);
        }
      }
      
      console.log('🔍 过滤任务 - 目标日期:', targetDate.toLocaleDateString('zh-CN'));
      
      filtered = filtered.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        taskDate.setHours(0, 0, 0, 0);
        const match = taskDate.getTime() === targetDate.getTime();
        if (match) {
          console.log('✅ 匹配任务:', task.title, taskDate.toLocaleDateString('zh-CN'));
        }
        return match;
      });
      
      console.log('🔍 过滤结果:', filtered.length, '个任务');
    }
    
    // 时间范围过滤
    if (filters.timeRange) {
      const { start, end } = filters.timeRange;
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      
      filtered = filtered.filter(task => {
        if (!task.scheduledStart) return false;
        const taskTime = new Date(task.scheduledStart);
        const taskHour = taskTime.getHours();
        const taskMin = taskTime.getMinutes();
        const taskMinutes = taskHour * 60 + taskMin;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return taskMinutes >= startMinutes && taskMinutes <= endMinutes;
      });
    }
    
    return filtered;
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

  // 处理副业追踪
  static async handleMoneyTracking(input: string, context: any): Promise<AIProcessResponse> {
    try {
      const moneyResponse = await MoneyAIProcessor.process({
        user_input: input,
        context: {
          user_id: context.user_id,
          current_time: context.current_time,
          current_date: context.current_date,
          existing_side_hustles: context.existing_side_hustles || [],
        },
      });

      // 转换 MoneyAIResponse 到 AIProcessResponse
      return {
        message: moneyResponse.message,
        data: moneyResponse.data,
        actions: moneyResponse.actions as any[],
        autoExecute: moneyResponse.autoExecute,
        needsConfirmation: moneyResponse.needsConfirmation,
      };
    } catch (error: any) {
      return {
        message: `❌ ${error.message || '处理失败'}`,
        autoExecute: false,
      };
    }
  }

  // 主处理函数
  static async process(request: AIProcessRequest): Promise<AIProcessResponse> {
    console.log('🤖 AISmartProcessor.process - 输入:', request.user_input);
    
    const inputType = this.analyzeInputType(request.user_input);
    console.log('🤖 AISmartProcessor.process - 识别类型:', inputType);

    switch (inputType) {
      case 'money_tracking':
        return await this.handleMoneyTracking(request.user_input, request.context);
      case 'scheduled_task':
        return await this.handleScheduledTask(request.user_input, request.context);
      case 'task_decomposition':
        console.log('🤖 AISmartProcessor.process - 调用 handleTaskDecomposition');
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
