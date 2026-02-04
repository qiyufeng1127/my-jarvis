// ============================================
// AI 智能处理服务 - 完整版
// ============================================

import { MoneyAIProcessor } from './moneyAIService';
import { useAIStore } from '@/stores/aiStore';

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

    // 任务分解型（多个任务）- 优化识别逻辑
    // 1. 包含明确的连接词
    if (
      lowerInput.includes('然后') || 
      lowerInput.includes('之后') || 
      lowerInput.includes('接着') ||
      lowerInput.includes('、') ||
      lowerInput.includes('，')
    ) {
      return 'task_decomposition';
    }
    
    // 2. 移除时间前缀后，检查是否包含多个动词（表示多个任务）
    const cleanInput = input.replace(/^[一二三四五六七八九十\d]+分钟[后之]后?/i, '').trim();
    const actionVerbs = ['去', '吃', '洗', '刷', '做', '打扫', '收拾', '整理', '拖', '扫', '倒', '喂', '买', '看', '读', '写', '学', '练', '跑', '走', '睡', '起', '穿', '换', '拿', '放'];
    let verbCount = 0;
    for (const verb of actionVerbs) {
      const regex = new RegExp(verb, 'g');
      const matches = cleanInput.match(regex);
      if (matches) {
        verbCount += matches.length;
      }
    }
    // 如果包含2个或以上动词，认为是任务分解
    if (verbCount >= 2) {
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
    
    // 清理每个任务标题：移除末尾的时长信息（如"20分钟"）
    const cleanedTasks = tasks.map(task => {
      // 移除末尾的时长（如"处理微信的客户问题吧照片处理了并且寄出去20分钟"）
      return task.replace(/\d+分钟$/i, '').trim();
    });
    
    return cleanedTasks.filter(Boolean);
  }

  // 解析时间表达式（支持日期关键词和智能时间识别）
  static parseTimeExpression(input: string): Date | null {
    const now = new Date();
    
    // 识别日期关键词
    let targetDate: Date | null = null;
    
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

  // 使用 AI 智能分析任务（替代所有手动规则）
  static async analyzeTaskWithAI(taskTitle: string, extractedDuration?: number): Promise<{
    tags: string[];
    location: string;
    duration: number;
    taskType: string;
    category: string;
    color: string;
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
    
    const prompt = `分析任务并返回JSON。

任务：${taskTitle}
${extractedDuration ? `时长：${extractedDuration}分钟` : ''}

返回格式（纯JSON，无注释）：
{
  "tags": ["标签1", "标签2"],
  "location": "位置",
  "duration": ${extractedDuration || 30},
  "taskType": "life",
  "category": "分类"
}

位置选项：厕所、工作区、客厅、卧室、拍摄间、厨房、全屋、室外
taskType选项：work, study, health, life, finance, creative, rest

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
      
      // 根据第一个标签获取颜色
      const color = this.getColorForTag(result.tags[0]);
      
      console.log('🤖 AI分析结果:', {
        title: taskTitle,
        tags: result.tags,
        color: color,
        location: result.location,
        duration: result.duration,
      });
      
      return {
        tags: result.tags || ['日常'],
        location: result.location || '全屋',
        duration: result.duration || 30,
        taskType: result.taskType || 'life',
        category: result.category || '生活事务',
        color: color,
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
      };
    }
  }

  // 处理任务分解（使用AI智能分析）
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
    
    // 分割任务（原始输入，包含时长信息）
    const rawInput = input.replace(/^[一二三四五六七八九十\d]+分钟[后之]后?/i, '').trim();
    
    console.log('📋 清理后的输入:', rawInput);
    console.log('📋 输入长度:', rawInput.length);
    console.log('📋 输入字符:', Array.from(rawInput).map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(' '));
    
    const splitResult = rawInput.split(/[、，,]|然后|之后|接着/);
    console.log('📋 分割结果（未过滤）:', splitResult);
    console.log('📋 分割结果数量:', splitResult.length);
    
    const rawTasks = splitResult
      .map(t => t.trim())
      .filter(Boolean);
    
    console.log('📋 原始任务列表:', rawTasks);
    console.log('📋 任务数量:', rawTasks.length);
    
    if (rawTasks.length === 0) {
      return {
        message: '抱歉，我没有识别到任何任务。请重新输入。',
        autoExecute: false,
      };
    }

    // 使用AI分析每个任务
    const decomposedTasks = [];
    let currentTime = new Date(startTime);
    let hasError = false;
    let errorMessage = '';
    
    try {
      for (let index = 0; index < rawTasks.length; index++) {
        const rawTask = rawTasks[index];
        
        // 提取时长信息
        const extractedDuration = this.extractDurationFromTask(rawTask);
        
        // 清理任务标题（移除时长）
        const cleanTitle = rawTask.replace(/\d+分钟$/i, '').trim();
        
        console.log(`📝 任务 ${index + 1}: "${cleanTitle}", 指定时长: ${extractedDuration || '无'}`);
        
        try {
          // 使用AI智能分析任务
          const aiAnalysis = await this.analyzeTaskWithAI(cleanTitle, extractedDuration || undefined);
          
          const start = new Date(currentTime);
          const end = new Date(currentTime.getTime() + aiAnalysis.duration * 60000);
          const goal = this.identifyGoal(cleanTitle);
          
          const task = {
            sequence: index + 1,
            title: cleanTitle,
            description: cleanTitle,
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
          };

          decomposedTasks.push(task);
          
          // 下一个任务开始时间
          currentTime = new Date(end.getTime());
        } catch (taskError: any) {
          console.error(`❌ 任务 ${index + 1} 分析失败:`, taskError);
          hasError = true;
          errorMessage = taskError.message || '任务分析失败';
          break;
        }
      }
    } catch (error: any) {
      console.error('❌ 任务分解过程出错:', error);
      return {
        message: `❌ 任务分解失败\n\n${error.message || '未知错误'}\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 端点是否可访问`,
        autoExecute: false,
      };
    }

    // 如果有错误且没有成功分析任何任务
    if (hasError && decomposedTasks.length === 0) {
      return {
        message: `❌ 任务分解失败\n\n${errorMessage}\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. API 端点是否可访问\n\n你可以在右上角 ⚙️ 中重新配置 API。`,
        autoExecute: false,
      };
    }

    const groupedByLocation = this.groupTasksByLocation(decomposedTasks);
    console.log('✅ AI智能分析完成:', decomposedTasks);

    // 构建消息
    let message = hasError 
      ? `⚠️ 部分任务分析成功（${decomposedTasks.length}/${rawTasks.length}）：\n\n`
      : `✅ AI已智能分析 ${decomposedTasks.length} 个任务：\n\n`;
    
    decomposedTasks.forEach((task, index) => {
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
    
    if (hasError) {
      message += `⚠️ 错误信息：${errorMessage}\n\n`;
    }
    
    message += `💡 正在打开事件卡片编辑器，你可以：\n`;
    message += `   • 双击任意字段进行编辑\n`;
    message += `   • 使用上下箭头调整任务顺序\n`;
    message += `   • 修改完成后点击"🚀 全部推送到时间轴"`;

    return {
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

现有任务列表：
${tasksInfo.map((t, i) => `${i + 1}. ${t.title} (${t.start})`).join('\n')}

请返回以下格式的JSON（必须是有效的JSON）：
{
  "operation": "delete",  // 操作类型：delete(删除) | move(移动) | modify(修改) | add(添加) | delay(顺延)
  "filters": {
    "date": "today",  // 日期过滤：today | yesterday | tomorrow | 具体日期
    "timeRange": { "start": "15:00", "end": "18:00" },  // 时间范围（可选）
    "all": true  // 是否全部（可选）
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
              },
              label: '确认删除',
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
      
      const targetDate = new Date(today);
      if (filters.date === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (filters.date === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      filtered = filtered.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === targetDate.getTime();
      });
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
