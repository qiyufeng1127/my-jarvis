// 坏习惯罐头系统类型定义

export type RuleType = 'time_threshold' | 'keyword' | 'task_status' | 'manual';

export interface HabitRule {
  id: string;
  type: RuleType;
  enabled: boolean;
  
  // 时间阈值规则（熬夜、晚起）
  timeThreshold?: {
    time: string; // HH:mm 格式
    comparison: 'before' | 'after';
    checkType: 'first_event' | 'last_event';
  };
  
  // 关键词规则（点外卖、不吃午饭）
  keywordRule?: {
    keywords: string[];
    matchType: 'any' | 'all';
    timeRange?: {
      start: string; // HH:mm
      end: string; // HH:mm
    };
    shouldExist: boolean; // true=存在则记录，false=不存在则记录
  };
  
  // 任务状态规则（拖延、低效率）
  taskStatusRule?: {
    statusType: 'start_timeout' | 'completion_timeout';
    countPerOccurrence?: number; // 每次超时记几次（如拖延每个周期记1次）
  };
}

export interface BadHabit {
  id: string;
  name: string;
  emoji: string;
  isPreset: boolean; // 是否为预设习惯
  enabled: boolean;
  rule: HabitRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitOccurrence {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD 格式
  count: number; // 当天发生次数
  details: HabitOccurrenceDetail[];
  isManual: boolean; // 是否手动添加
}

export interface HabitOccurrenceDetail {
  time: string; // HH:mm 格式
  reason: string; // 触发原因描述
  relatedTaskId?: string; // 关联的任务ID
}

// 日历罐头数据
export interface CanData {
  date: string; // YYYY-MM-DD
  totalCount: number; // 当天坏习惯总次数
  habits: {
    habitId: string;
    habitName: string;
    emoji: string;
    count: number;
  }[];
  colorLevel: 'green' | 'yellow' | 'orange' | 'red'; // 罐头底色（4级）
}

// 周视图数据
export interface WeekViewData {
  date: string;
  totalCount: number;
  change: number; // 与前一天的变化
  topHabits: {
    habitId: string;
    habitName: string;
    emoji: string;
    count: number;
  }[];
}

// 30天趋势数据
export interface TrendData {
  date: string;
  habitCounts: {
    habitId: string;
    habitName: string;
    emoji: string;
    count: number;
    color: string;
  }[];
  totalCount: number;
}

// 热力图数据
export interface HeatmapData {
  habitId: string;
  habitName: string;
  emoji: string;
  dailyData: {
    date: string;
    count: number;
    intensity: number; // 0-1，用于颜色深浅
  }[];
}

// 月报数据
export interface MonthlyReport {
  year: number;
  month: number;
  generatedAt: Date;
  
  // 统计数据
  totalCount: number;
  topHabits: {
    habitId: string;
    habitName: string;
    emoji: string;
    count: number;
    percentage: number;
  }[];
  
  // 改善亮点
  improvements: {
    habitId: string;
    habitName: string;
    emoji: string;
    changePercentage: number; // 正数=恶化，负数=改善
    description: string;
  }[];
  
  // 连续无坏习惯天数
  cleanStreaks: {
    startDate: string;
    endDate: string;
    days: number;
  }[];
  
  // 下月建议
  suggestions: string[];
  
  // 成就
  achievements: Achievement[];
}

// 成就
export interface Achievement {
  id: string;
  type: 'clean_streak' | 'improvement' | 'milestone';
  title: string;
  description: string;
  emoji: string;
  unlockedAt: Date;
  date?: string; // 关联的日期
}

// 预设坏习惯配置
export const PRESET_HABITS: Omit<BadHabit, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '熬夜',
    emoji: '🌙',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'stay-up-late',
      type: 'time_threshold',
      enabled: true,
      timeThreshold: {
        time: '23:00',
        comparison: 'after',
        checkType: 'last_event',
      },
    },
  },
  {
    name: '晚起',
    emoji: '🛌',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'wake-up-late',
      type: 'time_threshold',
      enabled: true,
      timeThreshold: {
        time: '10:30',
        comparison: 'after',
        checkType: 'first_event',
      },
    },
  },
  {
    name: '拖延',
    emoji: '🕒',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'procrastination',
      type: 'task_status',
      enabled: true,
      taskStatusRule: {
        statusType: 'start_timeout',
        countPerOccurrence: 1,
      },
    },
  },
  {
    name: '低效率',
    emoji: '🐢',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'low-efficiency',
      type: 'task_status',
      enabled: true,
      taskStatusRule: {
        statusType: 'completion_timeout',
        countPerOccurrence: 1,
      },
    },
  },
  {
    name: '点外卖',
    emoji: '🍱',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'order-takeout',
      type: 'keyword',
      enabled: true,
      keywordRule: {
        keywords: ['外卖', '美团', '饿了么', '点餐'],
        matchType: 'any',
        shouldExist: true,
      },
    },
  },
  {
    name: '不吃午饭',
    emoji: '🥣',
    isPreset: true,
    enabled: true,
    rule: {
      id: 'skip-lunch',
      type: 'keyword',
      enabled: true,
      keywordRule: {
        keywords: ['午饭', '午餐', '就餐', '吃饭'],
        matchType: 'any',
        timeRange: {
          start: '11:30',
          end: '13:00',
        },
        shouldExist: false, // 不存在则记录
      },
    },
  },
];

