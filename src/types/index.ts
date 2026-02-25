// ============================================
// ManifestOS 核心类型定义
// ============================================

// ============================================
// 用户相关类型
// ============================================
export interface User {
  id: string;
  localUserId: string;
  syncCode?: string;
  syncCodeExpiresAt?: Date;
  verificationCode?: string;
  encryptedData?: string;
  publicData: Record<string, any>;
  deviceList: Device[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  lastSyncAt: Date;
  isOnline: boolean;
}

export interface UserSettings {
  // 防拖延设置
  verificationStrictness: 'low' | 'medium' | 'high';
  enableProgressCheck: boolean;
  
  // 金币经济设置
  goldRewardMultiplier: number;
  goldPenaltyMultiplier: number;
  
  // 通知设置
  enableNotifications: boolean;
  notificationTimes: string[];
  quietHours: { start: string; end: string };
  
  // 外观设置
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // 语音设置
  voiceType: string;
  voiceSpeed: number;
  wakeWordSensitivity: number;
  
  // 同步设置
  autoSync: boolean;
  syncInterval: number;
  syncPhotos: boolean;
  
  // API配置（云端同步）
  baiduApiKey?: string;
  baiduSecretKey?: string;
}

// ============================================
// 任务相关类型
// ============================================
export type TaskType = 'work' | 'study' | 'health' | 'life' | 'finance' | 'creative' | 'rest';
export type TaskStatus = 'pending' | 'scheduled' | 'waiting_start' | 'verifying_start' | 'in_progress' | 'verifying_complete' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 1 | 2 | 3 | 4; // 1最高，4最低

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  durationMinutes: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  
  // 成长关联
  growthDimensions: Record<string, number>; // dimensionId -> points
  longTermGoals: Record<string, number>; // goalId -> contribution percentage
  identityTags: string[];
  
  // 副业关联
  sideHustleId?: string; // 关联的副业ID
  
  // 防拖延设置
  verificationStart?: VerificationConfig;
  verificationComplete?: VerificationConfig;
  enableProgressCheck: boolean;
  progressChecks: ProgressCheck[];
  penaltyGold: number;
  
  // 倒计时相关（新增）
  startVerificationDeadline?: Date; // 启动验证截止时间（2分钟倒计时）
  startVerificationTimeout?: boolean; // 启动验证是否超时
  completionDeadline?: Date; // 完成验证截止时间（任务总时长倒计时）
  
  // 子任务
  subtasks?: SubTask[];
  
  // 参与者
  participants?: Participant[];
  
  // 状态
  status: TaskStatus;
  completionQuality?: 1 | 2 | 3 | 4 | 5;
  goldEarned: number;
  
  // AI 智能助手添加的字段
  tags?: string[]; // 任务标签
  color?: string; // 任务颜色
  location?: string; // 任务位置
  goldReward?: number; // 预估金币奖励
  
  // 验证关键词（持久化）
  verificationEnabled?: boolean; // 是否启用验证
  startKeywords?: string[]; // 启动验证关键词
  completeKeywords?: string[]; // 完成验证关键词
  
  // 照片附件
  images?: TaskImage[]; // 任务照片列表
  coverImageUrl?: string; // 封面图片URL（第一张照片）
  
  // 效率追踪
  requireImageUpload?: boolean; // 是否需要上传图片
  plannedImageCount?: number; // 计划拍照次数
  actualImageCount?: number; // 实际拍照次数
  completionEfficiency?: number; // 完成效率 (0-100)
  efficiencyLevel?: 'excellent' | 'good' | 'average' | 'poor'; // 效率等级
  completionNotes?: string; // 完成笔记/反思
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskImage {
  id: string;
  url: string;
  type: 'cover' | 'attachment' | 'verification_start' | 'verification_complete';
  uploadedAt: Date;
  description?: string;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  durationMinutes?: number;
  order: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface VerificationConfig {
  type: 'photo' | 'upload' | 'file'; // 拍照验证、图片上传验证、文件上传验证
  requirement: string; // 验证要求描述
  timeout: number; // 秒
  acceptedFileTypes?: string[]; // 接受的文件类型（用于文件上传）
  maxFileSize?: number; // 最大文件大小（MB）
}

export interface ProgressCheck {
  checkTime: Date;
  passed: boolean;
  evidence?: string;
  notes?: string;
}

// ============================================
// 成长系统相关类型
// ============================================
export interface GrowthDimension {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  currentValue: number; // 0-100
  targetValue: number;
  weight: number; // 0.5-2.0
  taskTypes: TaskType[];
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType = 'numeric' | 'milestone' | 'habit';

export interface LongTermGoal {
  id: string;
  userId: string;
  name: string;
  description: string;
  goalType: GoalType;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  deadline?: Date;
  relatedDimensions: string[]; // dimension IDs
  milestones: Milestone[];
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  name: string;
  targetValue: number;
  isReached: boolean;
  reachedAt?: Date;
}

export interface IdentityLevel {
  id: string;
  userId: string;
  levelOrder: number;
  name: string;
  description: string;
  requiredGrowth: number;
  unlockFeatures: string[];
  themeSettings: Record<string, any>;
  icon: string;
  isCurrent: boolean;
  unlockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthHistory {
  id: string;
  userId: string;
  dimensionId: string;
  oldValue: number;
  newValue: number;
  changeAmount: number;
  reason: string;
  relatedTaskId?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================
// 金币经济相关类型
// ============================================
export type TransactionType = 'earn' | 'spend' | 'penalty' | 'bonus';

export interface GoldTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  category: string;
  description: string;
  balanceAfter: number;
  relatedTaskId?: string;
  relatedHabitId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface RewardItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  goldCost: number;
  icon: string;
  isActive: boolean;
  displayOrder: number;
  redemptionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  goldSpent: number;
  redeemedAt: Date;
  notes?: string;
  createdAt: Date;
}

// ============================================
// 坏习惯相关类型
// ============================================
export type BadHabitType = 'procrastination' | 'stay_up_late' | 'wake_up_late' | 'low_efficiency' | 'sedentary' | 'distraction' | 'irregular_meals' | 'custom';

export interface BadHabit {
  id: string;
  userId: string;
  habitType: BadHabitType;
  customName?: string;
  detectionRules: Record<string, any>;
  severity: number; // 1-10
  occurrenceCount: number;
  lastOccurredAt?: Date;
  improvementPlan?: ImprovementPlan;
  consecutiveSuccessDays: number;
  bestStreak: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadHabitOccurrence {
  id: string;
  userId: string;
  badHabitId: string;
  occurredAt: Date;
  severity: number;
  context: Record<string, any>;
  relatedTaskId?: string;
  notes?: string;
  createdAt: Date;
}

export interface ImprovementPlan {
  startDate: Date;
  duration: number; // 天数
  phase: 'awareness' | 'adjustment' | 'consolidation';
  dailyTasks: string[];
  strategies: string[];
  progress: number; // 0-100
}

// ============================================
// 成就相关类型
// ============================================
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  goldReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  progress: Record<string, any>;
  createdAt: Date;
}

// ============================================
// 同步相关类型
// ============================================
export interface SyncLog {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  operation: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  dataBefore?: Record<string, any>;
  dataAfter?: Record<string, any>;
  syncTimestamp: Date;
  resolvedConflict: boolean;
  conflictResolution?: Record<string, any>;
  createdAt: Date;
}

// ============================================
// AI 相关类型
// ============================================
export interface AITaskSuggestion {
  task: Partial<Task>;
  growthDimensions: Record<string, number>;
  longTermGoals: Record<string, number>;
  verificationStart?: VerificationConfig;
  verificationComplete?: VerificationConfig;
  estimatedGold: number;
  identityTags: string[];
  confidence: number; // 0-1
}

export interface AICoachMessage {
  type: 'encouragement' | 'warning' | 'suggestion' | 'celebration';
  message: string;
  actionable?: {
    label: string;
    action: string;
  };
  priority: 'low' | 'medium' | 'high';
}

export interface DailyGrowthStory {
  date: Date;
  summary: string;
  highlights: string[];
  dimensionChanges: Record<string, number>;
  goalProgress: Record<string, number>;
  achievements: string[];
  tomorrowSuggestions: string[];
  mood: 'excellent' | 'good' | 'normal' | 'challenging';
}

// ============================================
// 报告相关类型
// ============================================
export interface DailyReport {
  date: Date;
  tasksCompleted: number;
  tasksTotal: number;
  totalTimeSpent: number; // 分钟
  goldEarned: number;
  goldSpent: number;
  growthPoints: number;
  highlights: string[];
  improvements: string[];
  tomorrowSuggestions: string[];
}

export interface WeeklyReport extends DailyReport {
  weekStart: Date;
  weekEnd: Date;
  efficiencyAnalysis: {
    completionRate: number;
    averageDelay: number;
    highEfficiencyHours: number[];
    lowEfficiencyHours: number[];
  };
  growthAnalysis: {
    dimensionChanges: Record<string, number>;
    topDimensions: string[];
    needsAttention: string[];
  };
  habitAnalysis: {
    badHabitFrequency: Record<string, number>;
    improvementRate: number;
    consecutiveSuccessDays: number;
  };
  personalizedSuggestions: string[];
}

export interface MonthlyReport extends WeeklyReport {
  monthStart: Date;
  monthEnd: Date;
  behaviorInsights: {
    patterns: string[];
    correlations: string[];
    breakthroughs: string[];
  };
  growthTrajectory: {
    currentLevel: string;
    nextLevel: string;
    estimatedDaysToNextLevel: number;
    monthlyGrowthRate: number;
  };
  predictions: {
    nextMonthGoals: string[];
    estimatedGrowth: number;
    riskWarnings: string[];
  };
  personalizedRoadmap: {
    focus: string[];
    strategies: string[];
    milestones: string[];
  };
}

// ============================================
// 语音交互相关类型
// ============================================
export interface VoiceCommand {
  type: 'task' | 'query' | 'control' | 'emotion';
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  rawText: string;
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
  action?: {
    type: string;
    payload: any;
  };
  emotion: 'neutral' | 'encouraging' | 'celebratory' | 'supportive';
}

// ============================================
// UI 状态相关类型
// ============================================
export type ViewMode = 'timeline' | 'kanban' | 'list' | 'calendar';

export interface UIState {
  currentView: ViewMode;
  selectedDate: Date;
  selectedTask?: string;
  isVoiceActive: boolean;
  isSyncing: boolean;
  showGrowthPanel: boolean;
  showGoalsPanel: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  createdAt: Date;
}

// ============================================
// 副业追踪相关类型
// ============================================
export interface SideHustle {
  id: string;
  userId: string;
  name: string; // 副业名称，例如：ins穿搭账号
  icon: string; // 图标
  color: string; // 颜色
  
  // 时间信息
  startDate?: Date; // 开始日期（可选）
  totalHours: number; // 总时长（小时）
  
  // 财务信息
  totalIncome: number; // 总收入
  totalExpense: number; // 总支出
  profit: number; // 利润 = 收入 - 支出
  
  // 效率指标
  hourlyRate: number; // 时薪 = 收入 / 时长
  roi: number; // ROI = (收入 - 支出) / 支出
  
  // 目标关联
  goalId?: string; // 关联的长期目标ID
  
  // AI 分析
  aiAnalysis?: {
    feasibility: number; // 可行性评分 0-100
    expectedIncome: number; // 预期收入
    recommendation: string; // AI 建议
    risks: string[]; // 风险提示
  };
  
  status: 'active' | 'idea'; // 活跃 | 想法
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeRecord {
  id: string;
  sideHustleId: string; // 关联的副业ID
  amount: number; // 金额
  description?: string; // 备注
  date: Date; // 日期
  createdAt: Date;
}

export interface ExpenseRecord {
  id: string;
  sideHustleId: string; // 关联的副业ID
  amount: number; // 金额
  description?: string; // 备注
  date: Date; // 日期
  createdAt: Date;
}

export interface TimeRecord {
  id: string;
  sideHustleId: string; // 关联的副业ID
  duration: number; // 时长（分钟）
  date: Date; // 日期
  taskId: string; // 关联的待办任务ID
  taskTitle: string; // 任务标题
  createdAt: Date;
}

export interface DebtRecord {
  id: string;
  userId: string;
  amount: number; // 欠债金额
  description: string; // 描述
  dueDate?: Date; // 还款日期
  isPaid: boolean; // 是否已还
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 工具类型
// ============================================
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

