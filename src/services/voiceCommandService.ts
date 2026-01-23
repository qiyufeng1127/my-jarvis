// 语音指令类型定义
export interface VoiceCommand {
  type: 'task' | 'query' | 'control' | 'emotion' | 'unknown';
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  originalText: string;
}

// 语音响应类型
export interface VoiceResponse {
  text: string;
  action?: string;
  data?: any;
}

// 语音指令解析器
export class VoiceCommandParser {
  static parse(text: string): VoiceCommand {
    const normalizedText = text.toLowerCase().trim();

    // 任务相关指令
    if (this.isTaskCommand(normalizedText)) {
      return this.parseTaskCommand(normalizedText);
    }

    // 查询相关指令
    if (this.isQueryCommand(normalizedText)) {
      return this.parseQueryCommand(normalizedText);
    }

    // 控制相关指令
    if (this.isControlCommand(normalizedText)) {
      return this.parseControlCommand(normalizedText);
    }

    // 情感相关指令
    if (this.isEmotionCommand(normalizedText)) {
      return this.parseEmotionCommand(normalizedText);
    }

    // 未知指令
    return {
      type: 'unknown',
      intent: 'unknown',
      entities: {},
      confidence: 0,
      originalText: text,
    };
  }

  private static isTaskCommand(text: string): boolean {
    const taskKeywords = ['创建', '添加', '新建', '删除', '完成', '取消', '任务'];
    return taskKeywords.some(keyword => text.includes(keyword));
  }

  private static isQueryCommand(text: string): boolean {
    const queryKeywords = ['查看', '显示', '今天', '明天', '成长', '进度', '目标'];
    return queryKeywords.some(keyword => text.includes(keyword));
  }

  private static isControlCommand(text: string): boolean {
    const controlKeywords = ['专注', '暂停', '休息', '兑换', '设置'];
    return controlKeywords.some(keyword => text.includes(keyword));
  }

  private static isEmotionCommand(text: string): boolean {
    const emotionKeywords = ['累了', '焦虑', '开心', '难过', '压力', '鼓励'];
    return emotionKeywords.some(keyword => text.includes(keyword));
  }

  private static parseTaskCommand(text: string): VoiceCommand {
    // 创建任务
    if (text.includes('创建') || text.includes('添加') || text.includes('新建')) {
      const timeMatch = text.match(/(\d+)点|(\d+):(\d+)|明天|后天/);
      const durationMatch = text.match(/(\d+)分钟|(\d+)小时/);
      
      // 提取任务描述
      let description = text
        .replace(/创建|添加|新建|任务/g, '')
        .replace(/(\d+)点|(\d+):(\d+)|明天|后天/g, '')
        .replace(/(\d+)分钟|(\d+)小时/g, '')
        .trim();

      return {
        type: 'task',
        intent: 'create',
        entities: {
          description,
          time: timeMatch ? timeMatch[0] : null,
          duration: durationMatch ? durationMatch[1] || (parseInt(durationMatch[2]) * 60) : null,
        },
        confidence: 0.8,
        originalText: text,
      };
    }

    // 删除任务
    if (text.includes('删除') || text.includes('取消')) {
      const taskName = text.replace(/删除|取消|任务/g, '').trim();
      return {
        type: 'task',
        intent: 'delete',
        entities: { taskName },
        confidence: 0.8,
        originalText: text,
      };
    }

    return {
      type: 'task',
      intent: 'unknown',
      entities: {},
      confidence: 0.5,
      originalText: text,
    };
  }

  private static parseQueryCommand(text: string): VoiceCommand {
    // 查看任务
    if (text.includes('任务')) {
      const timeScope = text.includes('明天') ? 'tomorrow' : 'today';
      return {
        type: 'query',
        intent: 'view_tasks',
        entities: { timeScope },
        confidence: 0.9,
        originalText: text,
      };
    }

    // 查看成长
    if (text.includes('成长')) {
      let subIntent = 'overview';
      
      if (text.includes('专注')) subIntent = 'focus';
      else if (text.includes('执行')) subIntent = 'execution';
      else if (text.includes('健康')) subIntent = 'health';
      else if (text.includes('财富')) subIntent = 'wealth';
      else if (text.includes('魅力')) subIntent = 'charm';
      else if (text.includes('故事')) subIntent = 'story';

      return {
        type: 'query',
        intent: 'view_growth',
        entities: { subIntent },
        confidence: 0.9,
        originalText: text,
      };
    }

    return {
      type: 'query',
      intent: 'unknown',
      entities: {},
      confidence: 0.5,
      originalText: text,
    };
  }

  private static parseControlCommand(text: string): VoiceCommand {
    // 专注模式
    if (text.includes('专注')) {
      return {
        type: 'control',
        intent: 'focus_mode',
        entities: {},
        confidence: 0.9,
        originalText: text,
      };
    }

    // 暂停/休息
    if (text.includes('暂停') || text.includes('休息')) {
      const durationMatch = text.match(/(\d+)分钟/);
      return {
        type: 'control',
        intent: 'pause',
        entities: {
          duration: durationMatch ? durationMatch[1] + '分钟' : '10分钟',
        },
        confidence: 0.9,
        originalText: text,
      };
    }

    // 兑换
    if (text.includes('兑换')) {
      const reward = text.replace(/兑换/g, '').trim();
      return {
        type: 'control',
        intent: 'redeem',
        entities: { reward },
        confidence: 0.8,
        originalText: text,
      };
    }

    return {
      type: 'control',
      intent: 'unknown',
      entities: {},
      confidence: 0.5,
      originalText: text,
    };
  }

  private static parseEmotionCommand(text: string): VoiceCommand {
    let intent = 'support';

    if (text.includes('累') || text.includes('疲惫')) intent = 'tired';
    else if (text.includes('焦虑') || text.includes('压力')) intent = 'anxious';
    else if (text.includes('开心') || text.includes('高兴')) intent = 'happy';
    else if (text.includes('难过') || text.includes('伤心')) intent = 'sad';
    else if (text.includes('鼓励')) intent = 'encourage';

    return {
      type: 'emotion',
      intent,
      entities: {},
      confidence: 0.7,
      originalText: text,
    };
  }
}

// 语音响应生成器
export class VoiceResponseGenerator {
  static taskCreated(task: any): VoiceResponse {
    return {
      text: `好的，已为你创建任务"${task.title}"`,
      action: 'task_created',
      data: task,
    };
  }

  static taskList(tasks: any[], timeScope: string): VoiceResponse {
    const scopeText = timeScope === 'tomorrow' ? '明天' : '今天';
    
    if (tasks.length === 0) {
      return {
        text: `${scopeText}没有安排任务`,
        action: 'task_list',
        data: tasks,
      };
    }

    const taskNames = tasks.slice(0, 3).map(t => t.title).join('、');
    const moreText = tasks.length > 3 ? `等${tasks.length}个任务` : '';
    
    return {
      text: `${scopeText}有${taskNames}${moreText}`,
      action: 'task_list',
      data: tasks,
    };
  }

  static growthStatus(dimension: string, current: number, target: number): VoiceResponse {
    const progress = Math.round((current / target) * 100);
    return {
      text: `你的${dimension}当前是${current}点，目标${target}点，已完成${progress}%`,
      action: 'growth_status',
      data: { dimension, current, target, progress },
    };
  }

  static focusMode(enabled: boolean): VoiceResponse {
    return {
      text: enabled ? '好的，已进入专注模式，加油！' : '专注模式已关闭',
      action: 'focus_mode',
      data: { enabled },
    };
  }

  static pause(duration: string): VoiceResponse {
    return {
      text: `好的，休息${duration}，放松一下吧`,
      action: 'pause',
      data: { duration },
    };
  }

  static emotionalSupport(emotion: string): VoiceResponse {
    const responses: Record<string, string> = {
      tired: '辛苦了，要不要休息一下？记得劳逸结合哦',
      anxious: '深呼吸，放轻松，一切都会好起来的。要不要听听音乐放松一下？',
      happy: '太好了！继续保持这份好心情，你真棒！',
      sad: '抱抱你，没关系的，明天又是新的一天',
      encourage: '你已经很努力了！相信自己，你一定可以的！',
      support: '我一直在这里陪着你，有什么需要随时告诉我',
    };

    return {
      text: responses[emotion] || responses.support,
      action: 'emotional_support',
      data: { emotion },
    };
  }

  static error(message: string): VoiceResponse {
    return {
      text: message,
      action: 'error',
    };
  }

  static unknown(): VoiceResponse {
    return {
      text: '抱歉，我还不太明白你的意思，可以换个说法试试吗？',
      action: 'unknown',
    };
  }
}

