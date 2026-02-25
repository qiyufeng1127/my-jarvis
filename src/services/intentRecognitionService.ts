/**
 * 意图识别服务
 * 将 AI 助手从关键词匹配升级为自然语言意图理解
 */

export interface IntentResult {
  intent: string; // 意图类型
  confidence: number; // 置信度 0-1
  params: Record<string, any>; // 提取的参数
  action: string; // 建议的操作
}

export class IntentRecognitionService {
  /**
   * 识别用户意图
   */
  static recognizeIntent(message: string): IntentResult {
    const normalizedMessage = message.toLowerCase().trim();
    
    // 1. 时间轴删除操作 - 优先级最高
    if (this.isDeleteIntent(normalizedMessage)) {
      return this.parseDeleteIntent(message);
    }
    
    // 2. 时间轴移动操作
    if (this.isMoveIntent(normalizedMessage)) {
      return this.parseMoveIntent(message);
    }
    
    // 3. 任务查询操作
    if (this.isQueryIntent(normalizedMessage)) {
      return this.parseQueryIntent(message);
    }
    
    // 4. 任务创建/分解操作
    if (this.isTaskCreationIntent(normalizedMessage)) {
      return this.parseTaskCreationIntent(message);
    }
    
    // 5. 记录类操作（心情、想法等）
    if (this.isRecordIntent(normalizedMessage)) {
      return this.parseRecordIntent(message);
    }
    
    // 6. 默认：普通对话
    return {
      intent: 'chat',
      confidence: 0.5,
      params: {},
      action: 'respond',
    };
  }
  
  /**
   * 判断是否是删除意图
   */
  private static isDeleteIntent(message: string): boolean {
    const hasDeleteWord = /删除|清空|移除/.test(message);
    const hasTaskWord = /任务/.test(message);
    return hasDeleteWord && hasTaskWord;
  }
  
  /**
   * 解析删除意图
   */
  private static parseDeleteIntent(message: string): IntentResult {
    const params: Record<string, any> = {};
    
    // 提取时间范围
    if (/今天|今日/.test(message)) {
      params.timeRange = 'today';
      params.description = '今天';
    } else if (/昨天|昨日/.test(message)) {
      params.timeRange = 'yesterday';
      params.description = '昨天';
    } else if (/明天|明日/.test(message)) {
      params.timeRange = 'tomorrow';
      params.description = '明天';
    } else if (/本周|这周/.test(message)) {
      params.timeRange = 'this_week';
      params.description = '本周';
    } else if (/所有|全部/.test(message)) {
      params.timeRange = 'all';
      params.description = '所有';
    }
    
    // 提取时间段筛选
    if (/下午|午后/.test(message)) {
      params.timePeriod = 'afternoon';
      if (/2点|14点|两点/.test(message)) {
        params.afterHour = 14;
        if (params.description) {
          params.description += '下午2点之后';
        } else {
          params.description = '下午2点之后';
        }
      }
    } else if (/上午|早上/.test(message)) {
      params.timePeriod = 'morning';
    } else if (/晚上|夜间/.test(message)) {
      params.timePeriod = 'evening';
    }
    
    return {
      intent: 'delete_tasks',
      confidence: 0.95,
      params,
      action: 'execute_delete',
    };
  }
  
  /**
   * 判断是否是移动意图
   */
  private static isMoveIntent(message: string): boolean {
    const hasMoveWord = /挪到|移到|改到|调到|移动/.test(message);
    const hasDateNumber = /\d+号/.test(message);
    return hasMoveWord && hasDateNumber;
  }
  
  /**
   * 解析移动意图
   */
  private static parseMoveIntent(message: string): IntentResult {
    const params: Record<string, any> = {};
    
    // 提取源日期和目标日期
    const fromMatch = message.match(/(\d+)号.*?(挪到|移到|改到|调到|移动)/);
    const toMatch = message.match(/(挪到|移到|改到|调到|移动).*?(\d+)号/);
    
    if (fromMatch) {
      params.fromDay = parseInt(fromMatch[1]);
    }
    
    if (toMatch) {
      params.toDay = parseInt(toMatch[2]);
    }
    
    return {
      intent: 'move_tasks',
      confidence: 0.95,
      params,
      action: 'execute_move',
    };
  }
  
  /**
   * 判断是否是查询意图
   */
  private static isQueryIntent(message: string): boolean {
    const hasQueryWord = /查看|查询|显示|列出|统计/.test(message);
    const hasTaskContext = /任务|进度|完成/.test(message);
    const hasTodayContext = /今天|今日/.test(message) && hasTaskContext;
    
    return hasQueryWord || hasTodayContext;
  }
  
  /**
   * 解析查询意图
   */
  private static parseQueryIntent(message: string): IntentResult {
    const params: Record<string, any> = {};
    
    // 提取查询范围
    if (/今天|今日/.test(message)) {
      params.timeRange = 'today';
    } else if (/昨天|昨日/.test(message)) {
      params.timeRange = 'yesterday';
    } else if (/本周|这周/.test(message)) {
      params.timeRange = 'this_week';
    }
    
    // 提取查询类型
    if (/进度|完成情况/.test(message)) {
      params.queryType = 'progress';
    } else if (/统计/.test(message)) {
      params.queryType = 'statistics';
    } else {
      params.queryType = 'list';
    }
    
    return {
      intent: 'query_tasks',
      confidence: 0.85,
      params,
      action: 'show_tasks',
    };
  }
  
  /**
   * 判断是否是任务创建意图
   */
  private static isTaskCreationIntent(message: string): boolean {
    // 包含动作词
    const hasActionWord = /创建|添加|新建|安排|计划|做|完成|学习|工作|运动|分解|拆解/.test(message);
    
    // 包含任务关键词
    const hasTaskKeyword = /洗漱|洗碗|猫粮|洗衣服|收拾|吃饭|垃圾|打扫|整理/.test(message);
    
    // 包含时间词
    const hasTimeWord = /分钟后|小时后|之后|然后|接着|再/.test(message);
    
    // 长文本（可能是任务描述）
    const isLongText = message.length > 10;
    
    return hasActionWord || hasTaskKeyword || hasTimeWord || isLongText;
  }
  
  /**
   * 解析任务创建意图
   */
  private static parseTaskCreationIntent(message: string): IntentResult {
    const params: Record<string, any> = {
      content: message,
    };
    
    // 判断是否需要分解
    const needsDecompose = 
      /分解|拆解|详细安排|具体步骤/.test(message) || 
      message.length > 10 || 
      /然后|接着|再|之后|，|、/.test(message);
    
    params.needsDecompose = needsDecompose;
    
    return {
      intent: 'create_task',
      confidence: 0.8,
      params,
      action: needsDecompose ? 'decompose_task' : 'create_simple_task',
    };
  }
  
  /**
   * 判断是否是记录意图
   */
  private static isRecordIntent(message: string): boolean {
    return /心情|感觉|情绪|碎碎念|想法|突然想到|记录一下|成功|完成了|做到了|达成|感恩|感谢|幸运|庆幸/.test(message);
  }
  
  /**
   * 解析记录意图
   */
  private static parseRecordIntent(message: string): IntentResult {
    const params: Record<string, any> = {
      content: message,
    };
    
    // 判断记录类型
    if (/心情|感觉|情绪/.test(message)) {
      params.recordType = 'mood';
    } else if (/碎碎念|想法|突然想到|记录一下/.test(message)) {
      params.recordType = 'thought';
    } else if (/成功|完成了|做到了|达成/.test(message)) {
      params.recordType = 'success';
    } else if (/感恩|感谢|幸运|庆幸/.test(message)) {
      params.recordType = 'gratitude';
    }
    
    return {
      intent: 'record',
      confidence: 0.85,
      params,
      action: 'save_record',
    };
  }
}

