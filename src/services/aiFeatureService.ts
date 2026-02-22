/**
 * AI功能管理服务
 * 用于管理AI助手的功能列表、版本更新通知等
 */

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'task' | 'growth' | 'memory' | 'finance' | 'query';
  addedVersion: string;
  addedDate: string;
}

export interface AIFeatureUpdate {
  version: string;
  date: string;
  features: AIFeature[];
  improvements: string[];
}

/**
 * AI功能列表（按类别分组）
 */
export const AI_FEATURES: AIFeature[] = [
  // 任务管理类
  {
    id: 'task_decompose',
    name: '智能任务分解',
    description: '将复杂任务自动分解为多个子任务，并智能安排时间',
    icon: '📋',
    category: 'task',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'smart_schedule',
    name: '智能时间安排',
    description: '根据任务优先级、时长、位置等因素智能安排时间',
    icon: '⏰',
    category: 'task',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'timeline_modify',
    name: '时间轴修改',
    description: '快速修改、删除、移动、顺延时间轴上的任务',
    icon: '🕒',
    category: 'task',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'location_optimize',
    name: '智能动线优化',
    description: '根据家里格局自动优化任务顺序，减少走动',
    icon: '🏠',
    category: 'task',
    addedVersion: '1.1.0',
    addedDate: '2024-01-15',
  },
  {
    id: 'auto_tags',
    name: '智能标签生成',
    description: 'AI自动理解任务内容，生成精准标签并学习你的习惯',
    icon: '🏷️',
    category: 'task',
    addedVersion: '1.2.0',
    addedDate: '2024-02-01',
  },
  
  // 成长追踪类
  {
    id: 'gold_calculate',
    name: '金币自动计算',
    description: '根据任务难度、时长、优先级自动分配金币奖励',
    icon: '💰',
    category: 'growth',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'goal_link',
    name: '目标智能关联',
    description: '自动识别任务与长期目标的关联，追踪成长进度',
    icon: '🎯',
    category: 'growth',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  
  // 记忆记录类
  {
    id: 'mood_record',
    name: '心情记录',
    description: '记录当下的心情、感受、情绪状态',
    icon: '😊',
    category: 'memory',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'thought_record',
    name: '碎碎念记录',
    description: '记录日常想法、灵感、随笔',
    icon: '💭',
    category: 'memory',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'gratitude_record',
    name: '感恩记录',
    description: '记录值得感恩的人和事',
    icon: '🙏',
    category: 'memory',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'success_record',
    name: '成功记录',
    description: '记录今天的成就和进步',
    icon: '🎉',
    category: 'memory',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  
  // 财务管理类
  {
    id: 'side_hustle_idea',
    name: '副业想法收集',
    description: '收集创业想法到副业追踪器，自动分类管理',
    icon: '💡',
    category: 'finance',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  {
    id: 'income_expense',
    name: '收支快速记录',
    description: '快速记录副业收入和支出，自动关联项目',
    icon: '💸',
    category: 'finance',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
  
  // 查询统计类
  {
    id: 'task_query',
    name: '任务进度查询',
    description: '查询今天/本周的任务完成情况和统计数据',
    icon: '📊',
    category: 'query',
    addedVersion: '1.0.0',
    addedDate: '2024-01-01',
  },
];

/**
 * 功能更新历史
 */
export const FEATURE_UPDATES: AIFeatureUpdate[] = [
  {
    version: '1.2.0',
    date: '2024-02-08',
    features: [
      AI_FEATURES.find(f => f.id === 'auto_tags')!,
    ],
    improvements: [
      '标签学习系统：AI会记住你的标签修改习惯',
      '从通用标签（工作、学习）进化到精准标签（摄影棚工作、网站开发）',
      '基于关键词匹配和使用频率的智能推荐',
    ],
  },
  {
    version: '1.1.0',
    date: '2024-01-15',
    features: [
      AI_FEATURES.find(f => f.id === 'location_optimize')!,
    ],
    improvements: [
      '智能动线优化：根据家里格局自动排序任务',
      '减少不必要的走动，提高效率',
    ],
  },
  {
    version: '1.0.0',
    date: '2024-01-01',
    features: AI_FEATURES.filter(f => f.addedVersion === '1.0.0'),
    improvements: [
      'AI智能助手正式上线',
      '支持任务分解、时间安排、金币计算等核心功能',
    ],
  },
];

/**
 * AI功能服务
 */
export class AIFeatureService {
  private static readonly STORAGE_KEY = 'ai_feature_last_version';
  private static readonly CURRENT_VERSION = '1.2.0';

  /**
   * 获取所有功能列表
   */
  static getAllFeatures(): AIFeature[] {
    return AI_FEATURES;
  }

  /**
   * 按类别获取功能
   */
  static getFeaturesByCategory(category: AIFeature['category']): AIFeature[] {
    return AI_FEATURES.filter(f => f.category === category);
  }

  /**
   * 生成欢迎消息
   */
  static generateWelcomeMessage(): string {
    const categories = {
      task: '任务管理',
      growth: '成长追踪',
      memory: '记忆记录',
      finance: '财务管理',
      query: '查询统计',
    };

    let message = '你好！我是你的AI智能助手 🤖\n\n';
    message += '我可以帮你：\n\n';

    // 按类别分组显示功能
    Object.entries(categories).forEach(([key, label]) => {
      const features = this.getFeaturesByCategory(key as AIFeature['category']);
      if (features.length > 0) {
        message += `【${label}】\n`;
        features.forEach(f => {
          message += `${f.icon} ${f.name}：${f.description}\n`;
        });
        message += '\n';
      }
    });

    message += '💬 直接对我说话，我会理解你的意图并帮你完成任务！';

    return message;
  }

  /**
   * 检查是否有新功能更新
   */
  static checkForUpdates(): AIFeatureUpdate | null {
    const lastVersion = localStorage.getItem(this.STORAGE_KEY);
    
    if (!lastVersion || lastVersion !== this.CURRENT_VERSION) {
      // 找到最新的更新
      const latestUpdate = FEATURE_UPDATES[0];
      return latestUpdate;
    }

    return null;
  }

  /**
   * 标记已查看更新
   */
  static markUpdateAsViewed(): void {
    localStorage.setItem(this.STORAGE_KEY, this.CURRENT_VERSION);
  }

  /**
   * 生成更新通知消息
   */
  static generateUpdateMessage(update: AIFeatureUpdate): string {
    let message = `🎉 AI助手更新啦！(v${update.version})\n\n`;

    if (update.features.length > 0) {
      message += '【新增功能】\n';
      update.features.forEach(f => {
        message += `${f.icon} ${f.name}\n${f.description}\n\n`;
      });
    }

    if (update.improvements.length > 0) {
      message += '【功能优化】\n';
      update.improvements.forEach(imp => {
        message += `✨ ${imp}\n`;
      });
    }

    message += '\n快来试试新功能吧！';

    return message;
  }

  /**
   * 获取当前版本
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }
}






