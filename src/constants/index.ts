// ============================================
// ManifestOS 常量定义
// ============================================

import type { TaskType, BadHabitType } from '@/types';

// ============================================
// 默认成长维度
// ============================================
export const DEFAULT_GROWTH_DIMENSIONS = [
  {
    name: '执行力',
    description: '按时完成任务的能力',
    icon: '⚡',
    color: '#991B1B',
    displayOrder: 1,
  },
  {
    name: '专注力',
    description: '保持注意力集中的能力',
    icon: '🎯',
    color: '#7C3AED',
    displayOrder: 2,
  },
  {
    name: '健康力',
    description: '身体和心理健康状态',
    icon: '❤️',
    color: '#047857',
    displayOrder: 3,
  },
  {
    name: '财富力',
    description: '财务管理与创造能力',
    icon: '💰',
    color: '#d97706',
    displayOrder: 4,
  },
  {
    name: '魅力值',
    description: '个人形象与社交能力',
    icon: '✨',
    color: '#ec4899',
    displayOrder: 5,
  },
];

// ============================================
// 默认身份层级
// ============================================
export const DEFAULT_IDENTITY_LEVELS = [
  {
    levelOrder: 1,
    name: '成长探索者',
    description: '开始自我成长之旅',
    requiredGrowth: 0,
    icon: '🌱',
  },
  {
    levelOrder: 2,
    name: '自律实践者',
    description: '建立自律习惯',
    requiredGrowth: 200,
    icon: '🎯',
  },
  {
    levelOrder: 3,
    name: '效率掌控者',
    description: '高效管理时间和任务',
    requiredGrowth: 500,
    icon: '⚡',
  },
  {
    levelOrder: 4,
    name: '平衡大师',
    description: '实现工作生活平衡',
    requiredGrowth: 1000,
    icon: '⚖️',
  },
  {
    levelOrder: 5,
    name: '人生设计师',
    description: '掌控人生方向',
    requiredGrowth: 2000,
    icon: '👑',
  },
];

// ============================================
// 任务类型配置
// ============================================
export const TASK_TYPE_CONFIG: Record<TaskType, {
  label: string;
  icon: string;
  color: string;
  multiplier: number;
}> = {
  work: {
    label: '工作',
    icon: '💼',
    color: '#991B1B',
    multiplier: 1.0,
  },
  study: {
    label: '学习',
    icon: '📚',
    color: '#7C3AED',
    multiplier: 1.3,
  },
  health: {
    label: '健康',
    icon: '🏃',
    color: '#047857',
    multiplier: 2.0,
  },
  life: {
    label: '生活',
    icon: '🏠',
    color: '#6b7280',
    multiplier: 0.8,
  },
  finance: {
    label: '财务',
    icon: '💰',
    color: '#d97706',
    multiplier: 1.0,
  },
  creative: {
    label: '创意',
    icon: '🎨',
    color: '#ec4899',
    multiplier: 1.5,
  },
  rest: {
    label: '休息',
    icon: '😴',
    color: '#8b5cf6',
    multiplier: 0.5,
  },
};

// ============================================
// 金币计算配置
// ============================================
export const GOLD_CONFIG = {
  // 基础金币（每30分钟）
  BASE_GOLD_PER_UNIT: {
    simple: 5,
    medium: 8,
    difficult: 12,
    challenge: 20,
  },
  
  // 时长系数（基准单位=30分钟）
  DURATION_MULTIPLIER: {
    '0-30': 1.0,
    '31-60': 1.8,
    '61-120': 3.0,
    '120+': 4.0,
  },
  
  // 连续成就奖励
  STREAK_BONUS: {
    3: 100,
    7: 300,
    15: 800,
    30: 2000,
  },
  
  // 拖延惩罚
  DELAY_PENALTY: {
    '0-5': 20,
    '6-15': 50,
    '15+': 100,
  },
  
  // 坏习惯惩罚
  BAD_HABIT_PENALTY: {
    minor: 20,
    moderate: 50,
    severe: 100,
  },
  
  // 初始金币
  INITIAL_GOLD: 1000,
};

// ============================================
// 坏习惯配置
// ============================================
export const BAD_HABIT_CONFIG: Record<BadHabitType, {
  label: string;
  icon: string;
  defaultSeverity: number;
  detectionRules: Record<string, any>;
}> = {
  procrastination: {
    label: '拖延',
    icon: '⏰',
    defaultSeverity: 5,
    detectionRules: { delayThreshold: 5 },
  },
  stay_up_late: {
    label: '熬夜',
    icon: '🌙',
    defaultSeverity: 7,
    detectionRules: { bedtime: '23:00' },
  },
  wake_up_late: {
    label: '起床晚',
    icon: '🛏️',
    defaultSeverity: 4,
    detectionRules: { wakeTime: '08:00' },
  },
  low_efficiency: {
    label: '低效率',
    icon: '📉',
    defaultSeverity: 6,
    detectionRules: { efficiencyThreshold: 0.5 },
  },
  sedentary: {
    label: '久坐',
    icon: '🪑',
    defaultSeverity: 5,
    detectionRules: { maxSittingMinutes: 60 },
  },
  distraction: {
    label: '分心',
    icon: '🎯',
    defaultSeverity: 5,
    detectionRules: { maxSwitchesPerHour: 5 },
  },
  irregular_meals: {
    label: '饮食不规律',
    icon: '🍽️',
    defaultSeverity: 6,
    detectionRules: { mealTimes: ['08:00', '12:00', '18:00'] },
  },
  custom: {
    label: '自定义',
    icon: '⚙️',
    defaultSeverity: 5,
    detectionRules: {},
  },
};

// ============================================
// 语音交互配置
// ============================================
export const VOICE_CONFIG = {
  WAKE_WORD: 'Kiki宝宝',
  WAKE_TIMEOUT: 8000, // 毫秒
  RECOGNITION_LANGUAGE: 'zh-CN',
  SYNTHESIS_LANGUAGE: 'zh-CN',
  DEFAULT_VOICE_SPEED: 1.0,
  DEFAULT_VOICE_PITCH: 1.0,
};

// ============================================
// 验证配置
// ============================================
export const VERIFICATION_CONFIG = {
  DEFAULT_TIMEOUT: 120, // 秒
  PHOTO_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PHOTO_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MIN_CONFIDENCE: 0.6, // 图像识别最低置信度
};

// ============================================
// 同步配置
// ============================================
export const SYNC_CONFIG = {
  SYNC_CODE_LENGTH: 12,
  VERIFICATION_CODE_LENGTH: 6,
  SYNC_CODE_EXPIRY_HOURS: 72,
  AUTO_SYNC_INTERVAL: 5 * 60 * 1000, // 5分钟
  MAX_DEVICES: 5,
  CONFLICT_RESOLUTION: 'last_write_wins',
};

// ============================================
// UI 配置
// ============================================
export const UI_CONFIG = {
  NOTIFICATION_DURATION: 5000, // 毫秒
  ANIMATION_DURATION: 250, // 毫秒
  DEBOUNCE_DELAY: 300, // 毫秒
  THROTTLE_DELAY: 1000, // 毫秒
  MAX_NOTIFICATIONS: 5,
  TIMELINE_ZOOM_LEVELS: [15, 30, 60], // 分钟
};

// ============================================
// 报告解锁价格
// ============================================
export const REPORT_PRICES = {
  WEEKLY: 100,
  MONTHLY: 300,
  DEEP_ANALYSIS: 500,
  DATA_EXPORT: 50,
};

// ============================================
// 特权道具价格
// ============================================
export const PRIVILEGE_PRICES = {
  NO_VERIFICATION: 200,
  TIME_PAUSE: 100, // 每小时
  DOUBLE_GOLD: 300, // 24小时
  ATTRIBUTE_PROTECTION: 500, // 24小时
  HABIT_FORGIVENESS: 500,
};

// ============================================
// 成就类型
// ============================================
export const ACHIEVEMENT_TYPES = {
  TASK_COMPLETION: 'task_completion',
  STREAK: 'streak',
  GROWTH: 'growth',
  GOAL: 'goal',
  HABIT_BREAK: 'habit_break',
  GOLD: 'gold',
  EXPLORATION: 'exploration',
};

// ============================================
// 时间相关常量
// ============================================
export const TIME_CONSTANTS = {
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  MONTHS_PER_YEAR: 12,
};

// ============================================
// 本地存储键名
// ============================================
export const STORAGE_KEYS = {
  USER_ID: 'manifestos_user_id',
  DEVICE_ID: 'manifestos_device_id',
  ENCRYPTION_KEY: 'manifestos_encryption_key',
  LAST_SYNC: 'manifestos_last_sync',
  SETTINGS: 'manifestos_settings',
  OFFLINE_QUEUE: 'manifestos_offline_queue',
};

// ============================================
// API 端点
// ============================================
export const API_ENDPOINTS = {
  DEEPSEEK: {
    CHAT: '/v1/chat/completions',
  },
  BAIDU: {
    IMAGE_RECOGNITION: '/rest/2.0/image-classify/v2/advanced_general',
    TOKEN: '/oauth/2.0/token',
  },
};

// ============================================
// 错误消息
// ============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SYNC_FAILED: '同步失败，将在网络恢复后重试',
  VERIFICATION_FAILED: '验证失败，请重试',
  VERIFICATION_TIMEOUT: '验证超时，任务未能启动',
  INVALID_SYNC_CODE: '同步码无效或已过期',
  MAX_DEVICES_REACHED: '已达到最大设备数量限制',
  INSUFFICIENT_GOLD: '金币不足',
  TASK_CONFLICT: '任务时间冲突',
  AI_SERVICE_ERROR: 'AI服务暂时不可用',
};

// ============================================
// 成功消息
// ============================================
export const SUCCESS_MESSAGES = {
  TASK_CREATED: '任务创建成功',
  TASK_COMPLETED: '任务完成！获得金币奖励',
  VERIFICATION_PASSED: '验证通过，开始任务',
  SYNC_SUCCESS: '同步成功',
  DEVICE_ADDED: '设备添加成功',
  GOAL_ACHIEVED: '目标达成！恭喜你',
  LEVEL_UP: '身份升级！解锁新特权',
  HABIT_BROKEN: '坏习惯突破！继续保持',
};

// ============================================
// 默认奖励商店项目
// ============================================
export const DEFAULT_REWARDS = [
  { name: '一杯奶茶', category: 'small', goldCost: 300, icon: '🧋' },
  { name: '看一集剧', category: 'small', goldCost: 200, icon: '📺' },
  { name: '吃零食', category: 'small', goldCost: 150, icon: '🍿' },
  { name: '游戏30分钟', category: 'small', goldCost: 250, icon: '🎮' },
  { name: '买一件新衣服', category: 'medium', goldCost: 5000, icon: '👗' },
  { name: '外出晚餐', category: 'medium', goldCost: 3000, icon: '🍽️' },
  { name: '按摩一次', category: 'medium', goldCost: 3500, icon: '💆' },
  { name: '周末短途游', category: 'medium', goldCost: 8000, icon: '🚗' },
  { name: '新款手机', category: 'large', goldCost: 50000, icon: '📱' },
  { name: '度假旅行', category: 'large', goldCost: 30000, icon: '✈️' },
  { name: '专业课程', category: 'large', goldCost: 20000, icon: '📚' },
  { name: '奢侈包包', category: 'large', goldCost: 80000, icon: '👜' },
];

