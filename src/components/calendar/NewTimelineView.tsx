import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Camera, Check, ChevronDown, ChevronUp, Edit2, Trash2, GripVertical, Star, Clock, FileText, Upload, X, ShieldAlert } from 'lucide-react';
import eventBus from '@/utils/eventBus';
import type { Task, LongTermGoal } from '@/types';
import { 
  generateVerificationKeywords, 
  generateSubTasks, 
  SoundEffects, 
  ImageUploader,
  VoiceReminder,
  TaskMonitor,
  TaskTimeAdjuster,
  type TaskImage,
  type SubTask,
  type TaskVerification
} from '@/services/taskVerificationService';
import TaskVerificationDialog from './TaskVerificationDialog';
import TaskStatusIndicator from './TaskStatusIndicator';
import NowTimeline from './NowTimeline';
import { useAIStore } from '@/stores/aiStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTagStore } from '@/stores/tagStore';
import { useGoalStore } from '@/stores/goalStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { useHQBridgeStore } from '@/stores/hqBridgeStore';
import { useTaskHistoryStore } from '@/stores/taskHistoryStore';
import CelebrationEffect from '@/components/effects/CelebrationEffect';
import { 
  adjustTaskStartTime, 
  adjustTaskEndTime, 
  calculateActualDuration 
} from '@/utils/timelineAdjuster';
import { 
  calculateActualGoldReward, 
  smartDetectTaskPosture,
  calculateGoldReward
} from '@/utils/goldCalculator';
import { baiduImageRecognition } from '@/services/baiduImageRecognition';
import { notificationService } from '@/services/notificationService';
import TaskVerificationExtension from './TaskVerificationExtension';
import TaskVerificationCountdownContent from './TaskVerificationCountdownContent';
import GoldDetailsModal from '@/components/gold/GoldDetailsModal';
import TaskCompletionEfficiencyModal from './TaskCompletionEfficiencyModal';
import CompactTaskEditModal from './CompactTaskEditModal';
import { useTaskStore } from '@/stores/taskStore';
import SaveToSOPButton from '@/components/sop/SaveToSOPButton';
import TaskRecurrenceDialog, { RecurrenceRule } from './TaskRecurrenceDialog';
import TaskStatusBadge from './TaskStatusBadge';

interface NewTimelineViewProps {
  tasks: Task[];
  selectedDate: Date;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  bgColor?: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  isDark: boolean;
  onEditingChange?: (isEditing: boolean) => void; // 新增：通知父组件编辑状态
}

export default function NewTimelineView({
  tasks,
  selectedDate,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  bgColor = '#ffffff',
  textColor,
  accentColor,
  borderColor,
  isDark,
  onEditingChange,
}: NewTimelineViewProps) {
  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  // 添加定时刷新状态，用于触发倒计时检查
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 使用金币store
  const goldBalance = useGoldStore(state => state.balance);
  const goals = useGoalStore(state => state.goals);
  const addGoalContributionRecord = useGoalContributionStore(state => state.addRecord);
  const existingGoalContributionRecords = useGoalContributionStore(state => state.records);
  const addTaskHistoryRecord = useTaskHistoryStore(state => state.addRecord);
  const activeLoop = useHQBridgeStore((state) => state.activeLoop);
  const setActiveLoop = useHQBridgeStore((state) => state.setActiveLoop);

  const START_DELAY_FORM_THRESHOLD = 5;
  const LOW_EFFICIENCY_DELAY_MINUTES = 60;
  const MANDATORY_REFLECTION_QUESTIONS: Record<'start_delay' | 'low_efficiency', string[]> = {
    start_delay: [
      '你已经连续多次在启动窗口内没有开始。你刚才究竟在逃避什么？',
      '此刻你实际正在做什么，与当前任务冲突的诱因是什么？',
      '如果总部现在追问，你最不能自圆其说的借口是什么？',
      '你准备立刻做出的纠偏动作是什么？请写可执行动作。',
    ],
    low_efficiency: [
      '任务已经严重超时。真正拖慢你的关键障碍到底是什么？',
      '这段时间你在反复想什么、刷什么、耗在什么地方？',
      '如果继续这样低效下去，最直接损失的是哪一个目标或承诺？',
      '你接下来准备如何止损，并避免下一次再次失控？',
    ],
  };
  
  // 使用任务store
  const updateTaskEfficiency = useTaskStore(state => state.updateTaskEfficiency);
  
  // 效率模态框状态
  const [efficiencyModalOpen, setEfficiencyModalOpen] = useState(false);
  const [efficiencyModalTask, setEfficiencyModalTask] = useState<{
    id: string;
    title: string;
    plannedImageCount: number;
    actualImageCount: number;
    actualEndTime: Date;
    goldReward?: number; // 🔧 新增：金币奖励数量
    forceMandatoryReflection?: boolean;
  } | null>(null);
  const [mandatoryReflectionTaskId, setMandatoryReflectionTaskId] = useState<string | null>(null);
  const [mandatoryReflectionDraft, setMandatoryReflectionDraft] = useState<Record<string, string>>({});
  






  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 每秒更新当前时间，用于触发倒计时检查
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartTime, setDragStartTime] = useState<Date | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // 通知父组件编辑状态变化
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(editingTask !== null);
    }
  }, [editingTask, onEditingChange]);
  
  // 新增状态
  const [taskImages, setTaskImages] = useState<Record<string, TaskImage[]>>({});
  const [taskSubTasks, setTaskSubTasks] = useState<Record<string, SubTask[]>>({});
  const [taskVerifications, setTaskVerifications] = useState<Record<string, TaskVerification>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [generatingSubTasks, setGeneratingSubTasks] = useState<string | null>(null);
  const [startingTask, setStartingTask] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [verifyingTask, setVerifyingTask] = useState<string | null>(null); // 正在验证的任务
  const [verifyingType, setVerifyingType] = useState<'start' | 'complete' | null>(null); // 验证类型
  
  // 🔧 新增：间隔任务创建状态
  const [creatingGapTask, setCreatingGapTask] = useState<{
    startTime: Date;
    endTime: Date;
    maxDuration: number;
  } | null>(null);
  const [taskStartTimeouts, setTaskStartTimeouts] = useState<Record<string, boolean>>({}); // 启动验证超时标记
  const [taskFinishTimeouts, setTaskFinishTimeouts] = useState<Record<string, boolean>>({}); // 完成验证超时标记
  const [taskActualStartTimes, setTaskActualStartTimes] = useState<Record<string, Date>>({}); // 任务实际启动时间
  const [goalContributionTaskId, setGoalContributionTaskId] = useState<string | null>(null);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [goalContributionDrafts, setGoalContributionDrafts] = useState<Record<string, {
    goalId: string;
    note: string;
    durationMinutes: string;
    values: Record<string, string>;
  }>>({});
  const [goalContributionError, setGoalContributionError] = useState<string | null>(null);
  const [goalContributionSuccess, setGoalContributionSuccess] = useState<string | null>(null);
  const [goalContributionSaving, setGoalContributionSaving] = useState(false);
  const [editingVerification, setEditingVerification] = useState<string | null>(null);
  const [addingSubTask, setAddingSubTask] = useState<string | null>(null);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement>>({});
  const [showGoldModal, setShowGoldModal] = useState(false); // 金币详情弹窗
  const [isSmartAssigning, setIsSmartAssigning] = useState(false); // 智能分配加载状态
  
  useEffect(() => {
    const handleNavigate = (payload?: { module?: string; taskId?: string }) => {
      if (payload?.module && payload.module !== 'timeline') return;
      if (!payload?.taskId) return;

      setLinkedTaskId(payload.taskId);
      setExpandedCards((prev) => new Set([...prev, payload.taskId as string]));
    };

    eventBus.on('dashboard:navigate-module', handleNavigate);
    return () => {
      eventBus.off('dashboard:navigate-module', handleNavigate);
    };
  }, []);

  // 🔄 从任务对象恢复验证设置和照片
  useEffect(() => {
    const newVerifications: Record<string, TaskVerification> = {};
    const newImages: Record<string, TaskImage[]> = {};
    const newStartTimeouts: Record<string, boolean> = {};
    const newFinishTimeouts: Record<string, boolean> = {};
    
    tasks.forEach(task => {
      // 恢复验证设置
      if (task.verificationEnabled && task.startKeywords && task.completeKeywords) {
        const scheduledStart = task.scheduledStart ? new Date(task.scheduledStart) : new Date();
        const scheduledEnd = task.scheduledEnd 
          ? new Date(task.scheduledEnd) 
          : new Date(scheduledStart.getTime() + (task.durationMinutes || 30) * 60 * 1000);
        
        newVerifications[task.id] = {
          enabled: true,
          startKeywords: task.startKeywords,
          completionKeywords: task.completeKeywords,
          startDeadline: new Date(scheduledStart.getTime() + 2 * 60 * 1000),
          completionDeadline: scheduledEnd,
          startFailedAttempts: 0,
          startTimeoutCount: 0,
          startRetryDeadline: null,
          completionFailedAttempts: 0,
          completionTimeoutCount: 0,
          completionExtensionCount: 0,
          status: 'pending',
          actualStartTime: null,
          actualCompletionTime: null,
          startGoldEarned: 0,
          completionGoldEarned: 0,
          totalGoldPenalty: 0,
          startPenaltyGold: 0,
        };
        
        console.log(`✅ 恢复任务 ${task.title} 的验证设置:`, {
          startKeywords: task.startKeywords,
          completeKeywords: task.completeKeywords,
        });
      }
      
      // 恢复照片
      if (task.images && task.images.length > 0) {
        newImages[task.id] = task.images;
        console.log(`✅ 恢复任务 ${task.title} 的 ${task.images.length} 张照片`);
      }
      
      // 恢复超时状态（即使任务已完成也要显示）
      if (task.startVerificationTimeout) {
        newStartTimeouts[task.id] = true;
        console.log(`✅ 恢复任务 ${task.title} 的启动超时标记`);
      }
      if (task.completionTimeout) {
        newFinishTimeouts[task.id] = true;
        console.log(`✅ 恢复任务 ${task.title} 的完成超时标记`);
      }
    });
    
    setTaskVerifications(newVerifications);
    setTaskImages(newImages);
    setTaskStartTimeouts(newStartTimeouts);
    setTaskFinishTimeouts(newFinishTimeouts);
  }, [tasks]);
  
  // 智能识别任务类型：是否为照片任务
  const detectPhotoTaskType = (title: string): { isPhotoTask: boolean; targetCount: number; unit: string } => {
    // 匹配模式：数字 + 量词（张、个、次、幅、份等）
    const patterns = [
      /(\d+)\s*张/,  // 10张、5张
      /(\d+)\s*个/,  // 10个、5个
      /(\d+)\s*次/,  // 10次、3次
      /(\d+)\s*幅/,  // 10幅、5幅
      /(\d+)\s*份/,  // 10份、5份
      /(\d+)\s*件/,  // 10件、5件
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        const unit = match[0].replace(/\d+\s*/, ''); // 提取量词
        return { isPhotoTask: true, targetCount: count, unit };
      }
    }
    
    return { isPhotoTask: false, targetCount: 0, unit: '' };
  };
  
  // 获取任务的照片进度
  const getPhotoTaskProgress = (taskId: string, targetCount: number) => {
    const images = taskImages[taskId] || [];
    const uploadedCount = images.length;
    const progress = Math.min(100, Math.round((uploadedCount / targetCount) * 100));
    return { uploadedCount, progress };
  };
  
  // 编辑任务的状态
  const [editedTaskData, setEditedTaskData] = useState<Task | null>(null);
  
  // 任务重复设置状态
  const [recurrenceDialogTask, setRecurrenceDialogTask] = useState<Task | null>(null);
  
  // 使用 AI Store 获取 API 配置
  const { config, isConfigured } = useAIStore();
  
  // 使用金币系统
  const { addGold, penaltyGold } = useGoldStore();
  
  // 使用标签系统
  const { recordTagUsage } = useTagStore();
  
  // 庆祝效果状态
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGold, setCelebrationGold] = useState(0);

  const isMandatoryReflectionPending = (task?: Task | null) => !!task?.mandatoryReflection?.required && !task?.mandatoryReflection?.resolved;

  const syncReflectionToHQ = (
    task: Task,
    trigger: 'start_delay' | 'low_efficiency',
    answers: Array<{ question: string; answer: string }>
  ) => {
    const matchedGoals = getMatchedGoalsForTask(task);
    const primaryGoal = matchedGoals[0];

    setActiveLoop({
      ...(activeLoop || {}),
      goalId: primaryGoal?.id || activeLoop?.goalId,
      goalName: primaryGoal?.name || activeLoop?.goalName,
      taskId: task.id,
      taskTitle: task.title,
      painLabel: trigger === 'start_delay' ? '启动拖延失控' : '严重低效率',
      promise: trigger === 'start_delay' ? '立即进入启动动作，不再拖延启动窗口。' : '立即止损，收束分心，恢复目标推进效率。',
      accountabilityForm: {
        trigger,
        triggeredAt: task.mandatoryReflection?.triggeredAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        answers,
      },
    });
  };

  const openMandatoryReflection = (taskId: string, trigger: 'start_delay' | 'low_efficiency') => {
    const task = allTasks.find((item) => item.id === taskId);
    if (!task) return;

    const existingAnswers = task.mandatoryReflection?.answers || [];
    const questions = MANDATORY_REFLECTION_QUESTIONS[trigger];
    const nextDraft = questions.reduce<Record<string, string>>((acc, question, index) => {
      acc[question] = existingAnswers[index]?.answer || '';
      return acc;
    }, {});

    setMandatoryReflectionDraft(nextDraft);
    setMandatoryReflectionTaskId(taskId);
  };

  const ensureMandatoryReflection = (taskId: string, trigger: 'start_delay' | 'low_efficiency') => {
    const task = allTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (isMandatoryReflectionPending(task)) {
      openMandatoryReflection(taskId, task.mandatoryReflection?.trigger || trigger);
      return;
    }

    onTaskUpdate(taskId, {
      mandatoryReflection: {
        required: true,
        resolved: false,
        trigger,
        triggeredAt: new Date().toISOString(),
        answers: [],
      },
    });
    openMandatoryReflection(taskId, trigger);
  };
  
  // 判断颜色是否为深色
  const isColorDark = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };
  
  // 根据背景色获取文字颜色
  const getTextColor = (bgColor: string): string => {
    return isColorDark(bgColor) ? '#ffffff' : '#000000';
  };
  
  // 使用真实任务（不再需要示范任务）
  const allTasks = tasks;
  const isHistoricalGapRecordTask = (task?: Task | null) => {
    if (!task) return false;
    const hasInternalBackfillFlag = (task.identityTags || []).includes('system:backfill-record');
    const hasLegacyGapTag = (task.tags || []).includes('间隔补录记录');
    const hasBackfillTitle = task.title === '补录记录';
    const isBackfillRecord = hasInternalBackfillFlag || hasLegacyGapTag || hasBackfillTitle;
    if (!isBackfillRecord || !task.scheduledStart) return false;
    return new Date(task.scheduledStart).getTime() < Date.now();
  };

  // 根据任务内容智能分配颜色 - 优化版，避免重复
  const getTaskColor = (task: Task): string => {
    const title = task.title.toLowerCase();
    const tags = task.tags || [];
    const description = (task.description || '').toLowerCase();
    
    // 优先级从高到低，确保精确匹配
    
    // 1. 照相馆/小红书工作 - 紫色系（最高优先级，避免被其他规则覆盖）
    if (
      title.includes('照相馆') || title.includes('小红书') || 
      title.includes('修图') || title.includes('摄影') ||
      tags.some(t => t.includes('照相馆') || t.includes('摄影') || t.includes('小红书'))
    ) {
      return '#9B59B6'; // 紫色
    }
    
    // 2. ins穿搭/社交媒体运营 - 玫红色
    if (
      title.includes('ins') || title.includes('穿搭') || 
      title.includes('推广') || title.includes('营销') ||
      tags.some(t => t.includes('ins') || t.includes('穿搭') || t.includes('运营'))
    ) {
      return '#C85A7C'; // 玫红色
    }
    
    // 3. 文创设计工作 - 橙色系
    if (
      title.includes('设计') || title.includes('文创') || title.includes('创意') ||
      title.includes('作品') || title.includes('绘画') ||
      tags.some(t => t.includes('设计') || t.includes('文创') || t.includes('创意'))
    ) {
      return '#E67E22'; // 橙色
    }
    
    // 4. 家务类 - 蓝色系
    if (
      title.includes('收拾') || title.includes('打扫') || title.includes('整理') ||
      title.includes('洗碗') || title.includes('做饭') || title.includes('垃圾') ||
      title.includes('厨房') || title.includes('客厅') || title.includes('卧室') ||
      tags.some(t => t.includes('家务') || t.includes('清洁'))
    ) {
      return '#4A90E2'; // 蓝色
    }
    
    // 5. 学习成长 - 绿色系
    if (
      title.includes('学习') || title.includes('读书') || title.includes('课程') ||
      title.includes('成长') || title.includes('技能') ||
      tags.some(t => t.includes('学习') || t.includes('成长') || t.includes('读书'))
    ) {
      return '#27AE60'; // 绿色
    }
    
    // 6. 日常生活 - 粉色系
    if (
      title.includes('起床') || title.includes('洗漱') || title.includes('吃饭') ||
      title.includes('睡觉') || title.includes('休息') ||
      tags.some(t => t.includes('生活') || t.includes('日常'))
    ) {
      return '#E91E63'; // 粉色
    }
    
    // 7. 自我管理 - 青色系
    if (
      title.includes('计划') || title.includes('总结') || title.includes('反思') ||
      title.includes('目标') || title.includes('管理') ||
      tags.some(t => t.includes('管理') || t.includes('计划'))
    ) {
      return '#00BCD4'; // 青色
    }
    
    // 8. 创业相关（通用） - 深橙色
    if (
      title.includes('创业') || description.includes('创业') ||
      tags.some(t => t.includes('创业'))
    ) {
      return '#FF6B35'; // 深橙色
    }
    
    // 9. 默认：根据任务类型
  const categoryColors: Record<string, string> = {
    work: '#C85A7C',      // 玫红色 - 工作
      study: '#27AE60',     // 绿色 - 学习
      health: '#2ECC71',    // 浅绿色 - 健康
      life: '#E91E63',      // 粉色 - 生活
      social: '#FF6B35',    // 深橙色 - 社交
      finance: '#F39C12',   // 金色 - 财务
      creative: '#E67E22',  // 橙色 - 创意
      rest: '#95A5A6',      // 灰色 - 休息
      other: '#4A90E2',     // 蓝色 - 其他
    };
    
    return categoryColors[task.taskType] || '#4A90E2';
  };

  // 根据任务类型获取标签
  const getTaskTags = (taskType: string, title: string): string[] => {
    const tags: string[] = [];
    
    // 根据任务类型添加标签
    if (taskType === 'life') tags.push('#生活');
    if (taskType === 'work') tags.push('#运营');
    if (taskType === 'creative') tags.push('#照相馆工作');
    
    // 根据标题添加更多标签
    if (title.includes('起床')) tags.push('#起床');
    if (title.includes('ins') || title.includes('穿搭')) {
      tags.push('#ins穿搭账号');
      tags.push('#创业');
    }
    if (title.includes('小红书') || title.includes('照相馆')) {
      tags.push('#运营');
      tags.push('#创业');
    }
    
    return tags.slice(0, 3); // 最多显示3个标签
  };

  // 根据任务标题智能获取 emoji
  const getTaskEmoji = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    
    // 家务类
    if (lowerTitle.includes('客厅')) return '🛋️';
    if (lowerTitle.includes('垃圾')) return '🗑️';
    if (lowerTitle.includes('打扫') || lowerTitle.includes('清洁')) return '🧹';
    if (lowerTitle.includes('洗碗')) return '🍽️';
    if (lowerTitle.includes('做饭') || lowerTitle.includes('厨房')) return '🍳';
    if (lowerTitle.includes('卧室')) return '🛏️';
    if (lowerTitle.includes('整理') || lowerTitle.includes('收拾')) return '📦';
    
    // 工作类
    if (lowerTitle.includes('照相馆') || lowerTitle.includes('摄影')) return '📷';
    if (lowerTitle.includes('小红书')) return '📱';
    if (lowerTitle.includes('设计')) return '🎨';
    if (lowerTitle.includes('文创')) return '✨';
    if (lowerTitle.includes('创意')) return '💡';
    
    // 学习类
    if (lowerTitle.includes('学习') || lowerTitle.includes('读书')) return '📚';
    if (lowerTitle.includes('课程')) return '🎓';
    if (lowerTitle.includes('写作')) return '✍️';
    
    // 生活类
    if (lowerTitle.includes('起床')) return '⏰';
    if (lowerTitle.includes('衣服') || lowerTitle.includes('穿搭')) return '👗';
    if (lowerTitle.includes('运动') || lowerTitle.includes('健身')) return '💪';
    if (lowerTitle.includes('吃饭')) return '🍽️';
    if (lowerTitle.includes('睡觉')) return '😴';
    
    // 创业类
    if (lowerTitle.includes('ins')) return '📸';
    if (lowerTitle.includes('运营')) return '📊';
    if (lowerTitle.includes('推广')) return '📢';
    if (lowerTitle.includes('营销')) return '💼';
    
    // 默认
    return '✅';
  };

  // 根据任务获取关联目标文本
  const getGoalText = (task: Task): string => {
    const linkedGoalIds = Object.keys(task.longTermGoals || {}).filter((goalId) => (task.longTermGoals?.[goalId] || 0) > 0);
    const linkedGoal = linkedGoalIds
      .map((goalId) => goals.find((goal) => goal.id === goalId))
      .find(Boolean);

    if (linkedGoal?.name) return `@${linkedGoal.name}`;
    if ((task.tags || []).includes('总部承诺')) return '@总部整改闭环';
    if (task.title.includes('起床')) return '@挑战早起30天';
    if (task.title.includes('ins') || task.title.includes('穿搭')) return '@ins穿搭账号100天1w粉丝';
    if (task.title.includes('照相馆') || task.title.includes('小红书')) return '@坚持100天每天发照相馆小红书 @月入5w';
    if (task.description) return `@${task.description}`;
    return '@完成目标';
  };

  const getTaskSourceBadges = (task: Task): string[] => {
    const badges: string[] = [];

    if ((task.tags || []).includes('总部承诺')) {
      badges.push('总部联动');
    }

    const linkedGoalIds = Object.keys(task.longTermGoals || {}).filter((goalId) => (task.longTermGoals?.[goalId] || 0) > 0);
    if (linkedGoalIds.length > 0) {
      badges.push('目标挂载');
    }

    return badges;
  };

  // 转换任务为时间块（使用合并后的任务列表）
  const timeBlocks = allTasks
    .filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      return (
        taskDate.getFullYear() === selectedDate.getFullYear() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getDate() === selectedDate.getDate()
      );
    })
    .map((task) => {
      // 优先使用任务的实际开始/结束时间，如果没有则使用计划时间
      const startTime = task.startTime ? new Date(task.startTime) : new Date(task.scheduledStart!);
      // 优先使用scheduledEnd（验证完成后会更新），其次是endTime，最后计算
      const endTime = task.scheduledEnd ? new Date(task.scheduledEnd) : (task.endTime ? new Date(task.endTime) : new Date(startTime.getTime() + (task.durationMinutes || 60) * 60000));
      
      // 默认子任务（如果任务没有子任务）
      const defaultSubtasks = task.title.includes('ins') || task.title.includes('穿搭') ? [
        '先收集两套穿搭图',
        '更收集两套场景动作图',
        '把穿搭图换成正面站立的动作以及平头',
        '把服装穿在准备好的模特身上',
        '使用换好衣服的模特换背景和动作',
      ] : [];
      
      // 使用任务自带的颜色、标签、金币，如果没有则使用智能分配
      const taskColor = task.color || getTaskColor(task);
      const taskTags = task.tags && task.tags.length > 0 ? task.tags : getTaskTags(task.taskType, task.title);
      const sourceBadges = getTaskSourceBadges(task);
      // 使用新的金币计算器：站立15金币/分钟，坐着10金币/分钟
      const taskGold = task.goldReward || (() => {
        const duration = task.durationMinutes || 60;
        const posture = smartDetectTaskPosture(task.taskType, task.tags, task.title);
        return calculateGoldReward(duration, posture);
      })();
      
      console.log('🎨 任务显示信息:', {
        title: task.title,
        color: taskColor,
        tags: taskTags,
        goldReward: taskGold,
        原始任务: task,
      });
      
      return {
        id: task.id,
        title: task.title,
        startTime,
        endTime,
        duration: task.durationMinutes || 60,
        color: taskColor, // 使用任务的颜色
        category: task.taskType,
        description: task.description,
        isCompleted: task.status === 'completed',
        isLinkedHQTask: activeLoop?.taskId === task.id || (task.tags || []).includes('总部承诺'),
        goldReward: taskGold, // 使用任务的金币
        tags: taskTags, // 使用任务的标签
        sourceBadges,
        goalText: getGoalText(task),
        emoji: getTaskEmoji(task.title),
        subtasks: task.subtasks?.map(st => st.title) || defaultSubtasks,
      };
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // 计算间隔
  const gaps: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  }> = [];

  for (let i = 0; i < timeBlocks.length - 1; i++) {
    const currentEnd = timeBlocks[i].endTime;
    const nextStart = timeBlocks[i + 1].startTime;
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;
    
    if (gapMinutes > 0) {
      gaps.push({
        id: `gap-${i}`,
        startTime: currentEnd,
        endTime: nextStart,
        durationMinutes: Math.round(gapMinutes),
      });
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  // 处理长按开始拖拽
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, taskId: string, startTime: Date) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDraggedTask(taskId);
    setDragStartY(clientY);
    setDragStartTime(startTime);
  };
  
  // 处理拖拽移动
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedTask || !dragStartTime) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;
    
    // 每60px代表30分钟
    const minutesChange = Math.round((deltaY / 60) * 30);
    
    if (Math.abs(minutesChange) >= 5) {
      const newStartTime = new Date(dragStartTime.getTime() + minutesChange * 60000);
      
      // 更新任务时间
      onTaskUpdate(draggedTask, {
        scheduledStart: newStartTime,
      });
      
      // 重置拖拽起点
      setDragStartY(clientY);
      setDragStartTime(newStartTime);
    }
  };
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragStartY(0);
    setDragStartTime(null);
  };
  
  // 添加全局事件监听
  useEffect(() => {
    if (draggedTask) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [draggedTask]);
  
  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      TaskMonitor.stopAll();
    };
  }, []);
  
  // 【低侵入式集成】监听任务是否到时间，触发验证扩展组件（仅新增此段代码）
  useEffect(() => {
    const checkTaskTime = () => {
      const now = new Date();
      allTasks.forEach(task => {
        // 判断任务是否到时间且需要验证
        if (task.scheduledStart && task.verificationStart && task.status !== 'completed') {
          const taskStart = new Date(task.scheduledStart);
          if (now >= taskStart && !task.verificationStarted) {
            // 触发事件，传递必要数据给验证扩展组件
            eventBus.emit('taskTimeArrived', {
              taskId: task.id,
              taskTitle: task.title,
              subTasks: task.subTasks || [],
              durationMinutes: task.durationMinutes || 60,
              onStartVerify: () => handleStartVerification(task.id),
              onCompleteVerify: () => handleCompleteVerification(task.id)
            });
            // 标记已触发，避免重复触发
            onTaskUpdate(task.id, { verificationStarted: true });
          }
        }
      });
    };
    
    // 每秒检查一次
    const timer = setInterval(checkTaskTime, 1000);
    return () => clearInterval(timer);
  }, [allTasks, onTaskUpdate]);
  
  // 处理图片上传
  const handleImageUpload = async (taskId: string, files: FileList, type: 'cover' | 'attachment' = 'attachment') => {
    try {
      setUploadingImage(taskId);
      
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      const uploadedImages: TaskImage[] = [];
      
      // 上传所有选中的图片
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 压缩图片
        const compressedFile = await ImageUploader.compressImage(file);
        
        // 上传图片
        const imageUrl = await ImageUploader.uploadImage(compressedFile);
        
        // 保存图片信息
        const newImage: TaskImage = {
          id: `img-${Date.now()}-${i}`,
          url: imageUrl,
          type: 'attachment', // 统一管理封面，第一张自动为封面
          uploadedAt: new Date(),
        };
        
        uploadedImages.push(newImage);
      }
      
      setTaskImages(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...uploadedImages],
      }));
      
      // 检查是否为照片任务
      const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(task.title);
      
      if (isPhotoTask) {
        const { uploadedCount, progress } = getPhotoTaskProgress(taskId, targetCount);
        const newCount = uploadedCount + uploadedImages.length;
        
        console.log(`📸 照片任务进度: ${newCount}/${targetCount} ${unit} (${Math.round((newCount / targetCount) * 100)}%)`);
        
        // 播放上传成功音效
        SoundEffects.playCoinSound();
        
        // 如果达到目标数量，自动完成任务
        if (newCount >= targetCount) {
          console.log('🎉 照片任务已完成！');
          
          // 计算金币奖励 - 使用新的金币计算器
          const duration = task.durationMinutes || 60;
          const posture = smartDetectTaskPosture(task.taskType, task.tags, task.title);
          const goldReward = task.goldReward || calculateGoldReward(duration, posture);
          
          // 添加金币
          addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(goldReward);
          setShowCelebration(true);
          
          // 播放音效
          SoundEffects.playSuccessSound();
          SoundEffects.playCoinSound();
          
          // 语音提示
          VoiceReminder.congratulateCompletion(task.title, goldReward);
          
          // 更新任务状态为完成
          onTaskUpdate(taskId, { status: 'completed', isCompleted: true });
        } else {
          // 显示进度提示
          console.log(`✅ 成功上传 ${uploadedImages.length} 张图片！还需 ${targetCount - newCount} ${unit}`);
        }
      } else {
      console.log(`✅ 成功上传 ${uploadedImages.length} 张图片`);
      }
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImage(null);
    }
  };
  
  // 打开图片选择器
  const handleOpenImagePicker = (taskId: string) => {
    // 创建或获取该任务的 input 元素
    if (!imageInputRefs.current[taskId]) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true; // 支持多选
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          handleImageUpload(taskId, files, 'attachment');
        }
      };
      imageInputRefs.current[taskId] = input;
    }
    
    imageInputRefs.current[taskId].click();
  };
  
  // 添加手动子任务
  const handleAddManualSubTask = (taskId: string) => {
    if (!newSubTaskTitle.trim()) {
      alert('请输入子任务标题');
      return;
    }
    
    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubTaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };
    
    setTaskSubTasks(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), newSubTask],
    }));
    
    setNewSubTaskTitle('');
    setAddingSubTask(null);
    
    console.log('✅ 手动添加子任务成功');
  };
  
  // 切换子任务完成状态
  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    setTaskSubTasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ),
    }));
  };
  
  // AI 生成子任务
  const handleGenerateSubTasks = async (taskId: string, taskTitle: string, taskDescription?: string) => {
    try {
      setGeneratingSubTasks(taskId);
      
      // 使用 AI Store 的配置
      if (!isConfigured()) {
        alert('请先在 AI 智能输入中配置 API Key');
        return;
      }
      
      const subTaskTitles = await generateSubTasks(taskTitle, taskDescription || '', config.apiKey, config.apiEndpoint);
      
      const newSubTasks: SubTask[] = subTaskTitles.map(title => ({
        id: `subtask-${Date.now()}-${Math.random()}`,
        title,
        completed: false,
        createdAt: new Date(),
      }));
      
      setTaskSubTasks(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...newSubTasks],
      }));
      
      console.log('✅ AI 生成子任务成功');
    } catch (error) {
      console.error('❌ AI 生成子任务失败:', error);
      alert('AI 生成失败，请重试');
    } finally {
      setGeneratingSubTasks(null);
    }
  };
  
  // 启用任务验证（点击立即生成关键词）
  const handleEnableVerification = async (taskId: string, taskTitle: string, taskType: string) => {
    try {
      // 获取任务的开始和结束时间
      const task = allTasks.find(t => t.id === taskId);
      if (!task || !task.scheduledStart) {
        alert('任务缺少时间信息');
        return;
      }
      
      const scheduledStart = new Date(task.scheduledStart);
      const scheduledEnd = task.scheduledEnd 
        ? new Date(task.scheduledEnd) 
        : new Date(scheduledStart.getTime() + (task.durationMinutes || 30) * 60 * 1000);
      
      // 直接创建空的验证配置，不调用AI（用户可以从预设组选择）
      const verification: TaskVerification = {
        enabled: true,
        startKeywords: [], // 空数组，用户从预设组选择或手动输入
        completionKeywords: [], // 空数组，用户从预设组选择或手动输入
        startDeadline: new Date(scheduledStart.getTime() + 2 * 60 * 1000),
        completionDeadline: scheduledEnd,
        
        // 启动验证追踪
        startFailedAttempts: 0,
        startTimeoutCount: 0,
        startRetryDeadline: null,
        
        // 完成验证追踪
        completionFailedAttempts: 0,
        completionTimeoutCount: 0,
        completionExtensionCount: 0,
        
        status: 'pending',
        actualStartTime: null,
        actualCompletionTime: null,
        
        // 金币追踪
        startGoldEarned: 0,
        completionGoldEarned: 0,
        totalGoldPenalty: 0,
        startPenaltyGold: 0, // 启动阶段扣除的金币
      };
      
      setTaskVerifications(prev => ({
        ...prev,
        [taskId]: verification,
      }));
      
      // 开始监控任务
      TaskMonitor.startMonitoring(
        taskId,
        taskTitle,
        scheduledStart,
        scheduledEnd,
        task.durationMinutes || 30,
        task.goldReward || 100, // 任务总金币
        verification,
        () => {
          // 任务开始提醒回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'waiting_start',
            },
          }));
        },
        () => {
          // 任务结束提醒回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'waiting_completion',
            },
          }));
        },
        (timeoutCount, penalty) => {
          // 启动超时回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              startTimeoutCount: timeoutCount,
              totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
              status: timeoutCount < 3 ? 'start_retry' : 'failed',
              startRetryDeadline: timeoutCount < 3 
                ? new Date(Date.now() + 2 * 60 * 1000) 
                : null,
            },
          }));
        },
        (extensionCount, penalty) => {
          // 完成超时回调
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              completionExtensionCount: extensionCount,
              totalGoldPenalty: prev[taskId].totalGoldPenalty + penalty,
              status: extensionCount < 3 ? 'completion_extension' : 'failed',
              completionDeadline: extensionCount < 3
                ? new Date(Date.now() + 10 * 60 * 1000)
                : null,
            },
          }));
        }
      );
      
      console.log('✅ 任务验证已启用');
      console.log('启动关键词:', verification.startKeywords);
      console.log('完成关键词:', verification.completionKeywords);
      
      // 💾 持久化：保存验证设置到任务对象
      onTaskUpdate(taskId, {
        verificationEnabled: true,
        startKeywords: verification.startKeywords,
        completeKeywords: verification.completionKeywords,
      });
      
      console.log('💾 验证设置已保存到任务对象');
      
      // 打开编辑对话框
      setEditingVerification(taskId);
    } catch (error) {
      console.error('❌ 启用验证失败:', error);
      alert('启用验证失败，请重试');
    }
  };
  
  // 更新验证设置（从对话框保存）
  const handleUpdateVerification = (taskId: string, verification: TaskVerification) => {
    setTaskVerifications(prev => ({
      ...prev,
      [taskId]: verification,
    }));
    
    // 💾 持久化：保存到任务对象
    onTaskUpdate(taskId, {
      verificationEnabled: true,
      startKeywords: verification.startKeywords,
      completeKeywords: verification.completionKeywords,
    });
    
    console.log('💾 验证设置已更新并保存');
  };
  
  // 取消验证设置
  const handleDisableVerification = (taskId: string) => {
    // 从状态中移除
    setTaskVerifications(prev => {
      const newVerifications = { ...prev };
      delete newVerifications[taskId];
      return newVerifications;
    });
    
    // 💾 持久化：从任务对象中移除
    onTaskUpdate(taskId, {
      verificationEnabled: false,
      startKeywords: [],
      completeKeywords: [],
    });
    
    console.log('💾 验证设置已取消');
  };
  
  // 启动任务（带验证）
  // 启动验证超时处理
  const handleStartVerificationTimeout = (taskId: string) => {
    setTaskStartTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 启动验证超时，完成时将扣除30%金币`);
  };

  // 完成验证超时处理
  const handleFinishVerificationTimeout = (taskId: string) => {
    setTaskFinishTimeouts(prev => ({ ...prev, [taskId]: true }));
    console.log(`任务 ${taskId} 完成超时，将无金币奖励`);
  };

  const handleStartTask = async (taskId: string) => {
    console.log('🎯 [handleStartTask] 点击开始按钮，任务ID:', taskId);
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    console.log('📋 [handleStartTask] 任务信息:', task);
    console.log('🔧 [handleStartTask] 验证信息:', verification);
    
    if (!task) {
      console.log('❌ [handleStartTask] 任务不存在');
      return;
    }
    
    // 检查是否配置了启动验证
    if (verification?.enabled && verification?.startKeywords?.length > 0) {
      console.log('📷 [handleStartTask] 任务有启动验证，创建启动倒计时状态');
      
      // 创建启动倒计时状态
      const countdownState = {
        status: 'start_countdown',
        startDeadline: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2分钟后
        taskDeadline: null,
        startTimeoutCount: 0,
        completeTimeoutCount: 0,
        actualStartTime: null,
      };
      
      // 保存到localStorage
      localStorage.setItem(`countdown_${taskId}`, JSON.stringify(countdownState));
      console.log('✅ [handleStartTask] 已创建启动倒计时状态:', countdownState);
      
      // 更新任务状态为waiting_start，触发倒计时组件显示
      onTaskUpdate(taskId, { 
        status: 'waiting_start',
        scheduledStart: new Date().toISOString(),
      });
      
      // 展开任务卡片，显示倒计时组件
      setExpandedTasks(prev => new Set([...prev, taskId]));
      
      console.log('✅ [handleStartTask] 已进入启动倒计时阶段，任务卡片已展开');
    } else {
      // 没有启动验证，直接启动任务
      console.log('✅ [handleStartTask] 无启动验证，直接启动任务');
      
      const now = new Date();
      const duration = task.duration || task.durationMinutes || 30;
      const endTime = new Date(now.getTime() + duration * 60 * 1000);
      
      onTaskUpdate(taskId, { 
        status: 'in_progress',
        scheduledStart: now.toISOString(),
        scheduledEnd: endTime.toISOString(),
      });
      
      // 记录实际开始时间
      setTaskActualStartTimes(prev => ({
        ...prev,
        [taskId]: now
      }));
      
      console.log('✅ [handleStartTask] 任务已直接启动，开始时间:', now.toISOString(), '结束时间:', endTime.toISOString());
    }
  };
  
  // 处理验证图片
  const handleVerificationImage = async (e: Event, taskId: string, type: 'start' | 'complete') => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
        // 防止重复验证
        if (type === 'start' && verification.status === 'started') {
          alert('⚠️ 该任务已经完成启动验证，不能重复验证！');
          setStartingTask(null);
          setVerifyingTask(null);
          setVerifyingType(null);
          return;
        }
        
        if (type === 'complete' && verification.status === 'completed') {
          alert('⚠️ 该任务已经完成验证，不能重复验证！');
          setCompletingTask(null);
          setVerifyingTask(null);
          setVerifyingType(null);
          return;
        }
        
        // 设置验证状态 - 显示"正在验证..."
        setVerifyingTask(taskId);
        setVerifyingType(type);
        
        const keywords = type === 'start' ? verification.startKeywords : verification.completionKeywords;
        
        // 检查是否需要验证（如果没有关键词，直接通过）
        const needsVerification = keywords.length > 0;
        
        if (needsVerification) {
          // 使用百度AI进行宽松的图像识别验证
          console.log(`🔍 开始${type === 'start' ? '启动' : '完成'}验证（宽松模式）`);
          console.log(`📝 您设定的规则关键词:`, keywords);
          
          const verifyResult = await baiduImageRecognition.smartVerifyImage(
            file,
            keywords,
            0.3 // 30%匹配率（超宽松）
          );
          
          console.log(`✅ ${type === 'start' ? '启动' : '完成'}验证结果:`, verifyResult);
          
          if (!verifyResult.success) {
            // 验证失败（极少发生）
            setVerifyingTask(null);
            setVerifyingType(null);
            throw new Error(verifyResult.description);
          }
          
          // 验证成功 - 显示简洁提示
          console.log(`✅ ${type === 'start' ? '启动' : '完成'}验证通过！`);
        }
        
        // 保存验证照片到任务图片列表（统一管理）
        try {
          const compressedFile = await ImageUploader.compressImage(file);
          const imageUrl = await ImageUploader.uploadImage(compressedFile);
          
          const newImage: TaskImage = {
            id: `img-${Date.now()}-verification`,
            url: imageUrl,
            type: type === 'start' ? 'verification_start' : 'verification_complete',
            uploadedAt: new Date(),
          };
          
          // 更新本地状态
          const updatedImages = [...(taskImages[taskId] || []), newImage];
          setTaskImages(prev => ({
            ...prev,
            [taskId]: updatedImages,
          }));
          
          // 💾 持久化：保存照片到任务对象
          const coverImageUrl = updatedImages.length === 1 ? imageUrl : task.coverImageUrl;
          onTaskUpdate(taskId, {
            images: updatedImages,
            coverImageUrl, // 第一张照片作为封面
          });
          
          console.log('📸 验证照片已保存到任务图片列表和任务对象');
          console.log('📸 封面图片:', coverImageUrl);
        } catch (error) {
          console.error('⚠️ 验证照片保存失败，但验证已通过:', error);
            }
            
            const now = new Date();
        const totalGold = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
            
        if (type === 'start') {
          // 启动验证通过 - 修正任务开始时间
          const scheduledStart = new Date(task.scheduledStart!);
          const delayMinutes = Math.floor((now.getTime() - scheduledStart.getTime()) / 60000);
          
          console.log(`⏰ 预设开始时间: ${scheduledStart.toLocaleTimeString()}`);
          console.log(`⏰ 实际开始时间: ${now.toLocaleTimeString()}`);
          console.log(`⏰ 延迟时间: ${delayMinutes} 分钟`);
          
          // 计算启动超时扣除的金币（已经在超时回调中扣除）
          const timeoutCount = verification.startTimeoutCount || 0;
          let totalPenalty = 0;
          for (let i = 1; i <= timeoutCount; i++) {
            totalPenalty += Math.round(totalGold * (i * 0.1)); // 10%, 20%, 30%...
          }
          
          // 启动阶段奖励40%金币
          const startGold = Math.round(totalGold * 0.4);
          
          console.log(`💰 启动验证通过奖励：${startGold} 金币`);
          if (totalPenalty > 0) {
            console.log(`⚠️ 启动超时已扣除：${totalPenalty} 金币（完成任务后会返还）`);
          }
          
          // 更新验证状态
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: 'started',
                actualStartTime: now,
                startFailedAttempts: 0,
              startGoldEarned: startGold,
              startPenaltyGold: totalPenalty, // 记录启动阶段扣除的金币
              },
            }));
            
          // 记录实际启动时间并调整时间轴位置
          setTaskActualStartTimes(prev => ({ ...prev, [taskId]: now }));
          adjustTaskStartTime(taskId, now, allTasks, onTaskUpdate);
            
          // 播放音效
            SoundEffects.playSuccessSound();
            SoundEffects.playCoinSound();
          
          // 添加金币
          addGold(startGold, `启动任务：${task.title}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(startGold);
          setShowCelebration(true);
          
          // 语音提示
          VoiceReminder.congratulateCompletion(task.title, startGold);
          
          // 修正任务开始时间和结束时间
          const newEndTime = new Date(now.getTime() + (task.durationMinutes || 60) * 60000);
          onTaskUpdate(taskId, { 
            status: 'in_progress',
            scheduledStart: now.toISOString(),
            scheduledEnd: newEndTime.toISOString(),
          });
          
          // 发送任务开始通知
          notificationService.notifyTaskStart(task.title, false).catch(err => 
            console.error('发送任务开始通知失败:', err)
          );
            
          console.log('✅ 任务启动验证成功，时间已自动修正');
        } else {
          // 完成验证通过 - 计算提前完成奖励
          const actualStartTime = verification.actualStartTime || new Date(task.scheduledStart!);
          const actualDuration = Math.floor((now.getTime() - actualStartTime.getTime()) / 60000);
          const scheduledDuration = task.durationMinutes || 60;
          const savedMinutes = scheduledDuration - actualDuration;
          const savedPercentage = (savedMinutes / scheduledDuration) * 100;
          
          console.log(`⏰ 预设时长: ${scheduledDuration} 分钟`);
          console.log(`⏰ 实际时长: ${actualDuration} 分钟`);
          console.log(`⏰ 提前完成: ${savedMinutes} 分钟 (${savedPercentage.toFixed(1)}%)`);
          
          // 完成阶段基础奖励60%金币
          let completionGold = Math.round(totalGold * 0.6);
          let bonusGold = 0;
          let bonusMessage = '';
          
          // 计算提前完成奖励
          if (savedPercentage >= 50) {
            // 提前50%以上：额外奖励100%金币
            bonusGold = totalGold;
            bonusMessage = '🎉 提前50%以上完成！额外奖励100%金币！';
          } else if (savedPercentage >= 20) {
            // 提前20%-50%：额外奖励33%金币
            bonusGold = Math.round(totalGold * 0.33);
            bonusMessage = '🎉 提前20%-50%完成！额外奖励33%金币！';
          }
          
          // 返还启动阶段扣除的金币
          const startPenalty = verification.startPenaltyGold || 0;
          
          // 总金币 = 完成奖励 + 提前奖励 + 返还启动扣除
          const finalGold = completionGold + bonusGold + startPenalty;
          
          console.log(`💰 完成验证通过奖励：${completionGold} 金币`);
          if (bonusGold > 0) {
            console.log(`🎁 提前完成奖励：${bonusGold} 金币`);
          }
          if (startPenalty > 0) {
            console.log(`💰 返还启动扣除：${startPenalty} 金币`);
          }
          console.log(`💰 总计获得：${finalGold} 金币`);
          
          // 更新验证状态
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'completed',
              actualCompletionTime: now,
              completionFailedAttempts: 0,
              completionGoldEarned: finalGold,
            },
          }));
          
          // 调整任务结束时间
          adjustTaskEndTime(taskId, now, allTasks, onTaskUpdate);
          
          // 播放音效
          SoundEffects.playSuccessSound();
          SoundEffects.playCoinSound();
          
          // 添加金币
          addGold(finalGold, `完成任务：${task.title}${bonusMessage}`, taskId, task.title);
          
          // 显示庆祝效果
          setCelebrationGold(finalGold);
          setShowCelebration(true);
          
          // 语音提示
          if (bonusMessage) {
            VoiceReminder.speak(bonusMessage);
          }
          VoiceReminder.congratulateCompletion(task.title, finalGold);
          
          // 修正任务结束时间
          onTaskUpdate(taskId, { 
            status: 'completed', 
            isCompleted: true,
            scheduledEnd: now.toISOString(),
          });
          
          // 发送任务完成通知
          notificationService.notifyTaskEnd(task.title, false).catch(err => 
            console.error('发送任务完成通知失败:', err)
          );
          
          // 记录标签使用时长
          if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tagName => {
              recordTagUsage(tagName, taskId, task.title, actualDuration);
              console.log(`📊 记录标签使用: ${tagName} - ${actualDuration}分钟`);
            });
          }
          
          console.log('✅ 任务完成验证成功，时间已自动修正');
        }
        
        // 清除验证状态
        setVerifyingTask(null);
        setVerifyingType(null);
          } catch (error) {
        // 清除验证状态
        setVerifyingTask(null);
        setVerifyingType(null);
        
            // 验证失败
        const failedAttemptsKey = type === 'start' ? 'startFailedAttempts' : 'completionFailedAttempts';
        const newFailedAttempts = (verification[failedAttemptsKey] || 0) + 1;
            
            setTaskVerifications(prev => ({
              ...prev,
              [taskId]: {
                ...prev[taskId],
            [failedAttemptsKey]: newFailedAttempts,
              },
            }));
            
            SoundEffects.playFailSound();
            
            if (newFailedAttempts >= 3) {
              SoundEffects.playAlarmSound();
              VoiceReminder.speak('连续三次验证失败！扣除50金币！请认真完成任务！');
          penaltyGold(50, `${type === 'start' ? '启动' : '完成'}验证失败：${task.title}`, taskId, task.title);
              alert('⚠️ 连续三次验证失败！扣除50金币！');
            } else {
          const errorMsg = error instanceof Error ? error.message : '验证失败';
          alert(`❌ ${errorMsg}\n\n剩余尝试次数：${3 - newFailedAttempts}`);
            }
          }
        }
      
    if (type === 'start') {
      setStartingTask(null);
    } else {
      setCompletingTask(null);
    }
  };
  
  // 完成任务（带验证）
  const handleCompleteTask = async (taskId: string) => {
    const verification = taskVerifications[taskId];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // 🔧 验证开关判断：如果任务没有设置验证，直接完成
    if (task.status === 'in_progress' && (!verification || !verification.enabled)) {
      // 计算实际完成时长
      const actualStartTime = task.startTime ? new Date(task.startTime) : new Date(task.scheduledStart!);
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - actualStartTime.getTime()) / 60000);
      
      const goldReward = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
      addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
      setCelebrationGold(goldReward);
      setShowCelebration(true);
      SoundEffects.playSuccessSound();
      SoundEffects.playCoinSound();
      
      // 更新任务状态，记录实际结束时间
      onTaskUpdate(taskId, { 
        status: 'completed',
        endTime: now.toISOString()
      });

      if (activeLoop?.taskId === taskId) {
        setActiveLoop({
          ...activeLoop,
          taskId,
          taskTitle: task.title,
        });
      }

      if (activeLoop?.taskId === taskId) {
        setActiveLoop({
          ...activeLoop,
          taskId,
          taskTitle: task.title,
        });
      }
      
      // 记录标签使用时长 - 使用实际时长
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tagName => {
          recordTagUsage(tagName, taskId, task.title, actualDuration);
          console.log(`📊 记录标签使用: ${tagName} - ${actualDuration}分钟（实际时长）`);
        });
      }
      return;
    }
    
    // 如果任务已完成，点击取消完成
    if (task.status === 'completed') {
      if (confirm('确定要取消完成这个任务吗？')) {
        onTaskUpdate(taskId, { status: 'in_progress' });
        
        // 更新验证状态
        if (verification && verification.enabled) {
          setTaskVerifications(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'started',
              actualCompletionTime: null,
            },
          }));
        }
      }
      return;
    }
    
    // 如果启用了验证但还没有开始任务，不能完成
    if (verification && verification.enabled && verification.status !== 'started') {
      alert('⚠️ 请先完成启动验证才能标记完成！');
      return;
    }
    
    if (verification && verification.enabled && verification.status === 'started') {
      // 需要完成验证 - 拍照验证完成
      setCompletingTask(taskId);
      
      // 创建一个带关键词提示的相机界面
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 bg-black/90 flex flex-col';
      modal.innerHTML = `
        <div class="flex-1 flex flex-col">
          <!-- 关键词提示区域 -->
          <div class="bg-gradient-to-b from-black/80 to-transparent p-4">
            <div class="flex flex-wrap gap-2 justify-center mb-2">
              ${verification.completionKeywords.map(keyword => `
                <div class="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                  <span class="text-2xl">✅</span>
                  <span class="text-white font-semibold text-sm">${keyword}</span>
                </div>
              `).join('')}
            </div>
            <p class="text-white/90 text-center text-sm">✅ 请拍摄或上传包含以上内容的照片</p>
          </div>
          
          <!-- 按钮区域 -->
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <button id="camera-btn-complete" class="mb-4 px-8 py-4 bg-green-600 text-white rounded-2xl text-lg font-bold hover:bg-green-700 transition-all shadow-lg">
                📷 拍照验证
              </button>
              <br>
              <button id="upload-btn-complete" class="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg">
                🖼️ 相册上传
              </button>
              <br>
              <button id="cancel-btn-complete" class="mt-4 px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all">
                取消
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 处理拍照
      const cameraBtn = modal.querySelector('#camera-btn-complete');
      cameraBtn?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment' as any;
        input.onchange = (e) => handleVerificationImage(e, taskId, 'complete');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理上传
      const uploadBtn = modal.querySelector('#upload-btn-complete');
      uploadBtn?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => handleVerificationImage(e, taskId, 'complete');
        input.click();
        document.body.removeChild(modal);
      });
      
      // 处理取消
      const cancelBtn = modal.querySelector('#cancel-btn-complete');
      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(modal);
        setCompletingTask(null);
      });
    } else {
      // 无需验证，直接完成
      // 计算实际完成时长
      const actualStartTime = task.startTime ? new Date(task.startTime) : new Date(task.scheduledStart!);
      const now = new Date();
      const actualDuration = Math.floor((now.getTime() - actualStartTime.getTime()) / 60000);
      
      const goldReward = task.goldReward || Math.floor((task.durationMinutes || 60) * 0.8);
      
      // 添加金币
      addGold(goldReward, `完成任务：${task.title}`, taskId, task.title);
      
      // 显示庆祝效果
      setCelebrationGold(goldReward);
      setShowCelebration(true);
            
      // 播放音效
      SoundEffects.playSuccessSound();
      SoundEffects.playCoinSound();
            
      // 更新任务状态，记录实际结束时间
      onTaskUpdate(taskId, { 
        status: 'completed',
        endTime: now.toISOString()
      });

      if (activeLoop?.taskId === taskId) {
        setActiveLoop({
          ...activeLoop,
          taskId,
          taskTitle: task.title,
        });
      }
      
      // 记录标签使用时长 - 使用实际时长
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tagName => {
          recordTagUsage(tagName, taskId, task.title, actualDuration);
          console.log(`📊 记录标签使用: ${tagName} - ${actualDuration}分钟（实际时长）`);
        });
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // 处理保存重复规则
  const handleSaveRecurrenceRule = (rule: RecurrenceRule | null) => {
    if (!recurrenceDialogTask) return;
    
    onTaskUpdate(recurrenceDialogTask.id, {
      recurrenceRule: rule || undefined,
      isRecurring: !!rule,
    });
    
    console.log('✅ 重复规则已保存:', rule);
  };

  // 处理移动任务到明天
  const handleMoveToTomorrow = () => {
    if (!recurrenceDialogTask) return;
    
    const tomorrow = new Date(selectedDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const currentStart = new Date(recurrenceDialogTask.scheduledStart!);
    const newStart = new Date(tomorrow);
    newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
    
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + (recurrenceDialogTask.durationMinutes || 30));
    
    onTaskUpdate(recurrenceDialogTask.id, {
      scheduledStart: newStart.toISOString(),
      scheduledEnd: newEnd.toISOString(),
    });
    
    console.log('✅ 任务已移动到明天:', newStart.toISOString());
    alert('✅ 任务已移动到明天！');
  };
  
  // 处理复制任务到指定日期
  const handleCopyTask = (targetDate: Date, targetTime: string) => {
    if (!recurrenceDialogTask) return;
    
    const [hours, minutes] = targetTime.split(':').map(Number);
    const newStart = new Date(targetDate);
    newStart.setHours(hours, minutes, 0, 0);
    
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + (recurrenceDialogTask.durationMinutes || 30));
    
    // 创建新任务（复制）
    const newTask = {
      ...recurrenceDialogTask,
      id: undefined, // 让系统生成新ID
      scheduledStart: newStart.toISOString(),
      scheduledEnd: newEnd.toISOString(),
      status: 'pending' as const,
      isCompleted: false,
    };
    
    onTaskCreate(newTask);
    
    console.log('✅ 任务已复制到:', newStart.toISOString());
  };

  const getMatchedGoalsForTask = (task: Task) => {
    if (goals.length === 0) return [] as LongTermGoal[];

    const explicitGoalText = [
      (task as Task & { goals?: string }).goals,
      task.description,
      ...(task.tags || []),
    ].filter(Boolean).join(' ');

    const matched = explicitGoalText.trim().length > 0
      ? useGoalStore.getState().findMatchingGoals(task.title, explicitGoalText.split(/\s+/).filter(Boolean))
      : useGoalStore.getState().findMatchingGoals(task.title, task.tags || []);

    return matched.slice(0, 3);
  };

  const createContributionDraft = (task: Task, matchedGoals: LongTermGoal[]) => {
    const primaryGoal = matchedGoals[0];
    const existingRecord = existingGoalContributionRecords.find((record) => record.taskId === task.id && record.goalId === primaryGoal?.id);

    return {
      goalId: primaryGoal?.id || '',
      note: existingRecord?.note || '',
      durationMinutes: String(existingRecord?.durationMinutes ?? task.durationMinutes ?? 0),
      values: (primaryGoal?.dimensions || []).reduce<Record<string, string>>((acc, dimension) => {
        const existingValue = existingRecord?.dimensionResults.find((item) => item.dimensionId === dimension.id)?.value;
        acc[dimension.id] = existingValue !== undefined ? String(existingValue) : '';
        return acc;
      }, {}),
    };
  };

  const getGoalContributionStep = (dimension: LongTermGoal['dimensions'][number]) => {
    return Number.isInteger(dimension.targetValue) ? 1 : 0.1;
  };

  const updateGoalContributionDimensionValue = (taskId: string, dimensionId: string, nextValue: number) => {
    const safeValue = Math.max(0, Number(nextValue.toFixed(1)));

    handleGoalContributionDraftChange(taskId, {
      values: {
        ...(goalContributionDrafts[taskId]?.values || {}),
        [dimensionId]: safeValue === 0 ? '' : String(safeValue),
      },
    });
  };

  const getGoalContributionDimensionProgress = (goalId: string, taskId: string, dimensionId: string, currentValue: number) => {
    const historicalTotal = existingGoalContributionRecords
      .filter((record) => record.goalId === goalId && record.taskId !== taskId)
      .reduce((sum, record) => {
        const matchedDimension = record.dimensionResults.find((item) => item.dimensionId === dimensionId);
        return sum + (matchedDimension?.value || 0);
      }, 0);

    return historicalTotal + currentValue;
  };


  const openGoalContributionModal = (taskId: string) => {
    const task = allTasks.find((item) => item.id === taskId);
    if (!task) return;

    const matchedGoals = getMatchedGoalsForTask(task);
    const draft = createContributionDraft(task, matchedGoals);

    setGoalContributionDrafts((prev) => ({
      ...prev,
      [taskId]: prev[taskId]
        ? {
            ...prev[taskId],
            durationMinutes: prev[taskId].durationMinutes || String(task.durationMinutes || 0),
          }
        : draft,
    }));
    setGoalContributionTaskId(taskId);
    setGoalContributionError(null);
    setGoalContributionSuccess(null);
  };

  const handleGoalContributionDraftChange = (taskId: string, updates: Partial<{ goalId: string; note: string; durationMinutes: string; values: Record<string, string> }>) => {
    setGoalContributionDrafts((prev) => ({
      ...prev,
      [taskId]: {
        goalId: updates.goalId ?? prev[taskId]?.goalId ?? '',
        note: updates.note ?? prev[taskId]?.note ?? '',
        durationMinutes: updates.durationMinutes ?? prev[taskId]?.durationMinutes ?? '0',
        values: updates.values ?? prev[taskId]?.values ?? {},
      },
    }));
  };

  const handleSaveGoalContribution = () => {
    if (!goalContributionTaskId) return;

    const task = allTasks.find((item) => item.id === goalContributionTaskId);
    const draft = goalContributionDrafts[goalContributionTaskId];
    const goal = goals.find((item) => item.id === draft?.goalId);

    if (!task || !draft || !goal) {
      setGoalContributionError('请选择一个目标后再保存关键结果。');
      return;
    }

    const effectiveDuration = Math.max(0, Number(draft.durationMinutes || 0));

    const dimensionResults = goal.dimensions
      .map((dimension) => ({
        dimensionId: dimension.id,
        dimensionName: dimension.name,
        unit: dimension.unit,
        value: Number(draft.values[dimension.id] || 0),
      }))
      .filter((dimension) => dimension.value > 0);

    const accountabilitySnapshot = task.mandatoryReflection?.resolved
      ? {
          trigger: task.mandatoryReflection.trigger,
          painLabel: task.mandatoryReflection.trigger === 'start_delay' ? '启动拖延失控' : '严重低效率',
          answers: task.mandatoryReflection.answers || [],
          submittedAt: task.mandatoryReflection.submittedAt,
        }
      : undefined;

    if (dimensionResults.length === 0) {
      setGoalContributionError('请至少填写一个大于 0 的关键结果。');
      return;
    }

    setGoalContributionSaving(true);
    setGoalContributionError(null);

    const existingRecord = existingGoalContributionRecords.find((record) => record.taskId === task.id && record.goalId === goal.id);
    const contributionRecordedAt = new Date().toISOString();
    const closureNote = accountabilitySnapshot
      ? `追责表单、HQ桥接、目标贡献记录已完成，等待总部复盘确认。`
      : activeLoop?.closureNote;

    if (existingRecord) {
      useGoalContributionStore.getState().updateRecord(existingRecord.id, {
        note: draft.note,
        durationMinutes: effectiveDuration,
        startTime: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
        endTime: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
        dimensionResults,
        accountabilitySnapshot,
      });
    } else {
      addGoalContributionRecord({
        goalId: goal.id,
        taskId: task.id,
        taskTitle: task.title,
        startTime: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
        endTime: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
        durationMinutes: effectiveDuration,
        note: draft.note,
        source: 'timeline',
        accountabilitySnapshot,
        dimensionResults,
      });
    }

    addTaskHistoryRecord({
      taskTitle: task.title,
      taskType: task.taskType,
      category: goal.name,
      location: task.location || '时间轴',
      estimatedDuration: task.durationMinutes || 0,
      actualDuration: effectiveDuration,
      tags: Array.from(new Set([...(task.tags || []), goal.name])),
    });

    const nextDimensions = goal.dimensions.map((dimension) => ({
      ...dimension,
      currentValue: Number((dimension.currentValue + (dimensionResults.find((item) => item.dimensionId === dimension.id)?.value || 0)).toFixed(2)),
    }));

    useGoalStore.getState().updateGoal(goal.id, {
      dimensions: nextDimensions,
      currentValue: nextDimensions.reduce((sum, item) => sum + item.currentValue, 0),
      targetValue: nextDimensions.reduce((sum, item) => sum + item.targetValue, 0),
    });

    if (activeLoop?.taskId === task.id) {
      setActiveLoop({
        ...activeLoop,
        goalId: goal.id,
        goalName: goal.name,
        taskId: task.id,
        taskTitle: task.title,
        goalContributionRecordedAt: contributionRecordedAt,
        closureNote,
      });
    }

    setGoalContributionSuccess(`已把 ${task.title} 的关键结果写入 ${goal.name}`);
    window.setTimeout(() => {
      setGoalContributionTaskId(null);
      setGoalContributionSaving(false);
      setGoalContributionSuccess(null);
    }, 900);
  };

  // 计算距离今日结束的剩余时间
  const calculateTimeUntilEndOfDay = () => {
    if (timeBlocks.length === 0) return null;
    
    const lastBlock = timeBlocks[timeBlocks.length - 1];
    const lastEndTime = lastBlock.endTime;
    const now = new Date();
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 🔧 智能选择开始时间：
    // 1. 如果最后一个任务结束时间 < 当前时间：从当前时间开始
    // 2. 如果最后一个任务结束时间 >= 当前时间：从最后任务结束时间开始
    const startTime = lastEndTime < now ? now : lastEndTime;
    
    const remainingMinutes = Math.floor((endOfDay.getTime() - startTime.getTime()) / 60000);
    
    if (remainingMinutes <= 0) return null;
    
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    
    return { hours, mins, totalMinutes: remainingMinutes, startTime };
  };
  
  // 计算今日已过去的时间
  const calculateTimePassedToday = () => {
    if (timeBlocks.length === 0) return null;
    
    const now = new Date();
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const firstBlock = timeBlocks[0];
    const firstStartTime = firstBlock.startTime;
    
    // 如果第一个任务还没开始，计算从今天0点到第一个任务开始的时间
    if (firstStartTime > now) {
      const passedMinutes = Math.floor((now.getTime() - startOfDay.getTime()) / 60000);
      const hours = Math.floor(passedMinutes / 60);
      const mins = passedMinutes % 60;
      return { hours, mins, totalMinutes: passedMinutes, endTime: now };
    }
    
    // 如果第一个任务已经开始，计算从今天0点到第一个任务开始的时间
    const passedMinutes = Math.floor((firstStartTime.getTime() - startOfDay.getTime()) / 60000);
    const hours = Math.floor(passedMinutes / 60);
    const mins = passedMinutes % 60;
    return { hours, mins, totalMinutes: passedMinutes, endTime: firstStartTime };
  };

  const timeUntilEnd = calculateTimeUntilEndOfDay();
  const timePassed = calculateTimePassedToday();

  return (
    <div className="space-y-3 pb-4 relative">
      {/* 今日已过去提示 - 在第一个任务前 */}
      {timePassed && timePassed.totalMinutes > 0 && (
        <div className="flex items-center gap-3 mb-2">
          {/* 左侧时间对齐 */}
          <div className="w-12 flex-shrink-0 text-left">
            <div className="text-sm font-semibold" style={{ color: accentColor }}>
              00:00
            </div>
          </div>

          {/* 今日已过去按钮 */}
          <button
            onClick={() => {
              // 可以添加一些交互，比如显示详细统计
              alert(`今天已经过去了 ${timePassed.hours}小时${timePassed.mins}分钟`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                border: `2px dashed ${borderColor}`,
              }}
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#3B82F6' }}
              >
                <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: textColor }}>
              今日已过去
              {timePassed.hours > 0 && ` ${timePassed.hours}小时`}
              {timePassed.mins > 0 && ` ${timePassed.mins}分钟`}
            </span>
          </button>
          
          {/* 金币显示按钮 */}
          <button
            onClick={() => setShowGoldModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105 shadow-lg"
            style={{ 
              backgroundColor: goldBalance >= 0 
                ? (isDark ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.15)')
                : (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'),
              border: goldBalance >= 0 ? `2px solid #FFD700` : `2px solid #EF4444`,
            }}
            title="点击查看金币明细和奖励商店"
          >
            <span className="text-xl">💰</span>
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-80" style={{ color: goldBalance >= 0 ? '#FFD700' : '#EF4444' }}>
                金币
              </span>
              <span className="text-sm font-bold" style={{ color: goldBalance >= 0 ? '#FFD700' : '#EF4444' }}>
                {goldBalance >= 0 ? goldBalance : `${goldBalance}`}
              </span>
            </div>
          </button>
        </div>
      )}
      
      {/* 庆祝效果 */}
      <CelebrationEffect 
        show={showCelebration} 
        goldAmount={celebrationGold}
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* 【低侵入式集成】验证扩展组件 - 完全独立，不影响原有代码 */}
      <TaskVerificationExtension />
      
      {/* 金币详情弹窗 */}
      <GoldDetailsModal 
        isOpen={showGoldModal}
        onClose={() => setShowGoldModal(false)}
        isDark={isDark}
      />
      
      {/* 验证关键词编辑对话框 */}
      {editingVerification && taskVerifications[editingVerification] && (
        <TaskVerificationDialog
          taskId={editingVerification}
          taskTitle={allTasks.find(t => t.id === editingVerification)?.title || ''}
          verification={taskVerifications[editingVerification]}
          onClose={() => setEditingVerification(null)}
          onUpdate={(verification) => {
            handleUpdateVerification(editingVerification, verification);
          }}
          onDisable={() => {
            handleDisableVerification(editingVerification);
          }}
          isDark={isDark}
          accentColor={accentColor}
        />
      )}
      

      {/* 关键结果填写弹层 */}
      {goalContributionTaskId && (() => {
        const currentTask = allTasks.find((item) => item.id === goalContributionTaskId);
        if (!currentTask) return null;

        const matchedGoals = getMatchedGoalsForTask(currentTask);
        const draft = goalContributionDrafts[goalContributionTaskId] || createContributionDraft(currentTask, matchedGoals);
        const currentGoal = goals.find((item) => item.id === draft.goalId) || matchedGoals[0];
        const currentGoalIncome = currentGoal?.currentIncome || 0;
        const currentGoalTargetIncome = currentGoal?.targetIncome || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-3 pt-6 backdrop-blur-sm">
            <div
              className="w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
              style={{
                maxHeight: 'calc(100vh - 24px)',
                paddingBottom: 'calc(148px + env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-[#6b7280]">时间轴任务关键结果</div>
                  <div className="mt-1 text-lg font-semibold text-[#111827]">{currentTask.title}</div>
                </div>
                <button
                  onClick={() => {
                    setGoalContributionTaskId(null);
                    setGoalContributionError(null);
                    setGoalContributionSuccess(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f4f6] text-[#111827]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {currentGoal && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] bg-[#f7f8fb] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-[#9ca3af]">目标收入</div>
                      <div className="mt-1 text-[20px] font-semibold text-[#111827]">¥{currentGoalTargetIncome}</div>
                    </div>
                    <div className="rounded-[18px] bg-[#f5fbf7] px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.14em] text-[#9ca3af]">累计收入</div>
                      <div className="mt-1 text-[20px] font-semibold text-[#34c759]">¥{currentGoalIncome}</div>
                    </div>
                  </div>
                )}

                <div className="rounded-[22px] bg-[#f7f8fb] p-3">
                  <div className="mb-2 text-sm font-medium text-[#111827]">有效时间</div>
                  <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#9ca3af]">当前换算</div>
                        <div className="mt-2 text-[18px] font-medium text-[#6b7280]">
                          {(Number(draft.durationMinutes || currentTask.durationMinutes || 0) / 60).toFixed(1)} 小时
                        </div>
                      </div>
                      <div className="rounded-full bg-[#edf5ff] px-3 py-1 text-[24px] font-semibold tracking-[-0.04em] text-[#0A84FF]">
                        {Math.round((Number(draft.durationMinutes || currentTask.durationMinutes || 0) / Math.max(currentTask.durationMinutes || 1, 1)) * 100)}%
                      </div>
                    </div>

                    <div className="relative mt-5 px-1">
                      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#dbeafe]" />
                      <div
                        className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#0A84FF] shadow-[0_0_18px_rgba(10,132,255,0.35)]"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(draft.durationMinutes || currentTask.durationMinutes || 0) /
                              Math.max(Math.max((currentTask.durationMinutes || 60) * 2, 240), 1)) *
                              100
                          )}%`,
                        }}
                      />
                      <div
                        className="pointer-events-none absolute top-1/2 z-[1] h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#111827]/30"
                        style={{
                          left: `${Math.min(
                            100,
                            ((currentTask.durationMinutes || 0) /
                              Math.max(Math.max((currentTask.durationMinutes || 60) * 2, 240), 1)) *
                              100
                          )}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={Math.max((currentTask.durationMinutes || 60) * 2, 240)}
                        step={5}
                        value={Number(draft.durationMinutes || currentTask.durationMinutes || 0)}
                        onChange={(e) => handleGoalContributionDraftChange(goalContributionTaskId, { durationMinutes: e.target.value })}
                        className="relative z-[2] h-8 w-full cursor-pointer appearance-none bg-transparent accent-[#0A84FF]"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-[#9ca3af]">
                      <span>0 分钟</span>
                      <span>原任务 {currentTask.durationMinutes || 0} 分钟</span>
                      <span>{Math.max((currentTask.durationMinutes || 60) * 2, 240)} 分钟</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-[#d9ecff] bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-[#6b7280]">有效时间</div>
                        <div className="mt-2 text-[42px] font-semibold tracking-[-0.06em] text-[#111827]">
                          {Number(draft.durationMinutes || currentTask.durationMinutes || 0)}
                        </div>
                        <div className="text-base text-[#6b7280]">分钟</div>
                      </div>
                      <div className="rounded-[18px] bg-[#f5f9ff] px-3 py-2 text-right">
                        <div className="text-xs uppercase tracking-[0.16em] text-[#9ca3af]">默认值</div>
                        <div className="mt-1 text-sm font-semibold text-[#111827]">{currentTask.durationMinutes || 0} 分钟</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">关联目标</div>
                  <select
                    value={draft.goalId}
                    onChange={(e) => handleGoalContributionDraftChange(goalContributionTaskId, {
                      goalId: e.target.value,
                      durationMinutes: draft.durationMinutes,
                      values: (goals.find((goal) => goal.id === e.target.value)?.dimensions || []).reduce<Record<string, string>>((acc, dimension) => {
                        acc[dimension.id] = '';
                        return acc;
                      }, {}),
                    })}
                    className="w-full rounded-[18px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="">请选择目标</option>
                    {matchedGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.name}</option>
                    ))}
                    {matchedGoals.length === 0 && goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.name}</option>
                    ))}
                  </select>
                </div>

                {currentGoal && (
                  <div className="rounded-[22px] bg-[#f7f8fb] p-3">
                    <div className="mb-3 text-sm font-medium text-[#111827]">填写本次产出</div>
                    <div className="space-y-3">
                      {currentGoal.dimensions.map((dimension) => {
                        const step = getGoalContributionStep(dimension);
                        const currentValue = Number(draft.values[dimension.id] || 0);
                        const cumulativeValue = getGoalContributionDimensionProgress(currentGoal.id, currentTask.id, dimension.id, currentValue);
                        const progressPercent = Math.min(100, (cumulativeValue / Math.max(dimension.targetValue, 1)) * 100);

                        return (
                          <div key={dimension.id} className="rounded-[20px] bg-white px-3 py-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-[#111827]">{dimension.name}</div>
                                <div className="mt-1 text-xs text-[#9ca3af]">目标 {dimension.targetValue} {dimension.unit}</div>
                              </div>
                              <div className="rounded-full bg-[#f5f9ff] px-3 py-1 text-sm font-semibold text-[#0A84FF] shadow-sm">
                                {cumulativeValue}/{dimension.targetValue}
                              </div>
                            </div>

                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e7eef8]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#67b7ff] via-[#0A84FF] to-[#3b82f6] transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-[#94a3b8]">
                              <span>本次 +{currentValue} {dimension.unit}</span>
                              <span>{progressPercent.toFixed(0)}%</span>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateGoalContributionDimensionValue(goalContributionTaskId, dimension.id, Math.max(0, currentValue - step))}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eef2ff] text-[24px] font-semibold text-[#4f46e5] shadow-sm active:scale-95"
                              >
                                −
                              </button>

                              <div className="flex flex-1 items-center justify-center rounded-[18px] border border-[#dbe4f0] bg-[#fcfcfd] px-3 py-3 shadow-sm">
                                <div className="text-center leading-none">
                                  <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#111827]">
                                    {draft.values[dimension.id] || '0'}
                                  </div>
                                  <div className="mt-1 text-[11px] text-[#6b7280]">本次增加 {dimension.unit}</div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => updateGoalContributionDimensionValue(goalContributionTaskId, dimension.id, currentValue + step)}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#e8fff3] text-[24px] font-semibold text-[#16a34a] shadow-sm active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">关键结果说明</div>
                  <textarea
                    value={draft.note}
                    onChange={(e) => handleGoalContributionDraftChange(goalContributionTaskId, { note: e.target.value })}
                    rows={3}
                    className="w-full rounded-[18px] border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] outline-none"
                    placeholder="例如：今天完成 2 条脚本、1 次复盘，推进了目标数据。"
                  />
                </div>

                {(goalContributionError || goalContributionSuccess) && (
                  <div className={`rounded-[16px] px-3 py-2 text-sm ${goalContributionError ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#ecfdf3] text-[#16a34a]'}`}>
                    {goalContributionError || goalContributionSuccess}
                  </div>
                )}
              </div>

              <div
                className="fixed left-1/2 z-[60] flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 gap-3 rounded-[24px] bg-white/96 px-4 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
                style={{
                  bottom: 'calc(76px + env(safe-area-inset-bottom))',
                  paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
              >
                <button
                  onClick={() => setGoalContributionTaskId(null)}
                  className="flex-1 rounded-full bg-[#eef0f6] px-4 py-3 text-sm font-medium text-[#111827]"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveGoalContribution}
                  disabled={goalContributionSaving}
                  className="flex-1 rounded-full bg-[#0A84FF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {goalContributionSaving ? '保存中...' : '写入分析'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 强制追责表单 */}
      {mandatoryReflectionTaskId && (() => {
        const task = allTasks.find((item) => item.id === mandatoryReflectionTaskId);
        if (!task?.mandatoryReflection) return null;

        const trigger = task.mandatoryReflection.trigger;
        const questions = MANDATORY_REFLECTION_QUESTIONS[trigger];
        const isReady = questions.every((question) => (mandatoryReflectionDraft[question] || '').trim().length > 0);

        return (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-3 pt-6 backdrop-blur-sm">
            <div
              className="w-full max-w-md overflow-y-auto rounded-t-[28px] bg-[#fffaf7] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
              style={{
                maxHeight: 'calc(100vh - 24px)',
                paddingBottom: 'calc(148px + env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex items-start gap-3 rounded-[24px] border border-red-300 bg-red-50 px-4 py-4 text-red-900">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />
                <div>
                  <div className="text-base font-bold">总部追责记录 · 必填</div>
                  <div className="mt-1 text-sm leading-6">
                    该任务已经触发{trigger === 'start_delay' ? '启动拖延' : '严重低效率'}追责。你必须如实填写，提交后任务才允许继续完成；当前不允许退出、不允许跳过、不允许删除任务。
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">任务</div>
                <div className="mt-2 text-lg font-semibold text-[#111827]">{task.title}</div>
                <div className="mt-2 text-sm text-[#b42318]">
                  触发时间：{new Date(task.mandatoryReflection.triggeredAt).toLocaleString('zh-CN')}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {questions.map((question, index) => (
                  <div key={question} className="rounded-[22px] bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-[#111827]">{index + 1}. {question}</div>
                    <textarea
                      value={mandatoryReflectionDraft[question] || ''}
                      onChange={(e) => setMandatoryReflectionDraft((prev) => ({ ...prev, [question]: e.target.value }))}
                      rows={4}
                      className="mt-3 w-full rounded-[18px] border border-[#f0d5d0] bg-[#fff7f5] px-4 py-3 text-sm text-[#111827] outline-none"
                      placeholder="必须如实填写。总部后续会据此问责。"
                    />
                  </div>
                ))}
              </div>

              <div
                className="fixed left-1/2 z-[81] flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 gap-3 rounded-t-[24px] bg-white/96 px-4 pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur"
                style={{
                  bottom: 'calc(88px + env(safe-area-inset-bottom))',
                  paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
              >
                <button
                  onClick={() => {
                    if (!isReady) {
                      alert('所有问题都必须填写完成，才允许提交。');
                      return;
                    }

                    const answers = questions.map((question) => ({
                      question,
                      answer: (mandatoryReflectionDraft[question] || '').trim(),
                    }));
                    const matchedGoals = getMatchedGoalsForTask(task);
                    const primaryGoal = matchedGoals[0];

                    onTaskUpdate(task.id, {
                      mandatoryReflection: {
                        ...task.mandatoryReflection,
                        required: true,
                        resolved: true,
                        submittedAt: new Date().toISOString(),
                        answers,
                      },
                    });

                    syncReflectionToHQ(task, trigger, answers);

                    if (primaryGoal) {
                      const existingRecord = existingGoalContributionRecords.find((record) => record.taskId === task.id && record.goalId === primaryGoal.id);
                      if (existingRecord) {
                        useGoalContributionStore.getState().updateRecord(existingRecord.id, {
                          accountabilitySnapshot: {
                            trigger,
                            painLabel: trigger === 'start_delay' ? '启动拖延失控' : '严重低效率',
                            answers,
                            submittedAt: new Date().toISOString(),
                          },
                        });
                      } else {
                        addGoalContributionRecord({
                          goalId: primaryGoal.id,
                          taskId: task.id,
                          taskTitle: task.title,
                          startTime: task.scheduledStart ? new Date(task.scheduledStart) : undefined,
                          endTime: task.scheduledEnd ? new Date(task.scheduledEnd) : undefined,
                          durationMinutes: task.durationMinutes || 0,
                          note: `【追责记录】${trigger === 'start_delay' ? '启动拖延' : '低效率超时'}已提交`,
                          source: 'timeline',
                          accountabilitySnapshot: {
                            trigger,
                            painLabel: trigger === 'start_delay' ? '启动拖延失控' : '严重低效率',
                            answers,
                            submittedAt: new Date().toISOString(),
                          },
                          dimensionResults: [],
                        });
                      }
                    }
                    setMandatoryReflectionTaskId(null);
                    setMandatoryReflectionDraft({});

                    if (efficiencyModalTask?.id === task.id && efficiencyModalTask.forceMandatoryReflection) {
                      setEfficiencyModalTask((prev) => prev ? { ...prev, forceMandatoryReflection: false } : prev);
                    }
                  }}
                  className="flex-1 rounded-full bg-[#b42318] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  提交追责记录
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 编辑任务弹窗 - 紧凑优化版 */}
      {editingTask && (() => {
        const task = allTasks.find(t => t.id === editingTask);
        if (!task) return null;
        
        // 初始化编辑数据（首次打开时）
        if (!editedTaskData || editedTaskData.id !== editingTask) {
          setTimeout(() => setEditedTaskData(task), 0);
        }
        
        const currentEditData = editedTaskData?.id === editingTask ? editedTaskData : task;
        
        console.log('🎨 NewTimelineView 编辑弹窗已渲染 - 智能分配按钮应该可见');
        
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3" style={{ paddingBottom: '100px' }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
              {/* 头部 - 只显示关闭按钮 */}
              <div className="flex-shrink-0 px-3 py-2 flex items-center justify-end border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setEditedTaskData(null);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: isDark ? '#ffffff' : '#000000' }} />
                </button>
              </div>
            
              {/* 表单内容 - 紧凑布局 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* 任务标题 - 直接显示输入框 */}
                <div>
                  <input
                    type="text"
                    value={currentEditData.title}
                    onChange={(e) => setEditedTaskData({ ...currentEditData, title: e.target.value })}
                    onFocus={(e) => {
                      // 点击时自动滚动到可见区域
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    placeholder="任务标题"
                    className="w-full px-2.5 py-1.5 rounded-lg border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ 
                      borderColor: isDark ? '#4b5563' : '#d1d5db',
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                </div>
                
                {/* 任务描述 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>📄 任务描述</label>
                  <textarea
                    value={currentEditData.description || ''}
                    onChange={(e) => setEditedTaskData({ ...currentEditData, description: e.target.value })}
                    onFocus={(e) => {
                      // 点击时自动滚动到可见区域
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ 
                      borderColor: isDark ? '#4b5563' : '#d1d5db',
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                    placeholder="详细描述..."
                  />
                </div>
                
                {/* 时间和时长 - 并排 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>⏰ 开始时间</label>
                    <input
                      type="time"
                      value={currentEditData.scheduledStart ? new Date(currentEditData.scheduledStart).toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(currentEditData.scheduledStart || new Date());
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setEditedTaskData({ ...currentEditData, scheduledStart: newDate.toISOString() });
                      }}
                      onFocus={(e) => {
                        // 点击时自动滚动到可见区域
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>⏱️ 时长（分）</label>
                    <input
                      type="number"
                      value={currentEditData.durationMinutes}
                      onChange={(e) => setEditedTaskData({ ...currentEditData, durationMinutes: parseInt(e.target.value) || 0 })}
                      onFocus={(e) => {
                        // 点击时自动滚动到可见区域
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                      min={5}
                      max={480}
                    />
                  </div>
                </div>
                
                {/* 金币奖励 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold" style={{ color: isDark ? '#ffffff' : '#000000' }}>💰 金币奖励</label>
                    <button
                      onClick={async () => {
                        console.log('🎨 智能分配按钮被点击');
                        const taskTitle = currentEditData.title;
                        
                        if (!taskTitle || taskTitle.trim() === '') {
                          alert('请先输入任务标题');
                          return;
                        }
                        
                        // 立即设置加载状态
                        setIsSmartAssigning(true);
                        
                        try {
                          console.log('🤖 开始AI智能分配...');
                          
                          // 导入 aiService
                          const { aiService } = await import('@/services/aiService');
                          
                          // 获取用户已有的标签
                          const allTags = useTagStore.getState().getAllTags();
                          const userTags = allTags.map(tag => tag.name);
                          const userTagsStr = userTags.length > 0 
                            ? `\n\n**用户已有标签（优先使用）：**\n${userTags.join('、')}\n请优先从用户已有标签中选择。`
                            : '';
                          
                          const prompt = `请根据任务标题"${taskTitle}"，智能推荐以下内容（请严格按照JSON格式返回，不要有任何其他文字）：${userTagsStr}

{
  "goldReward": 推荐的金币奖励数值（数字，范围10-500，根据任务难度和时长），
  "tags": 推荐的标签数组（最多3个中文标签，例如：["学习", "工作"]${userTags.length > 0 ? `，优先从：${userTags.join('、')} 中选择` : ''}），
  "goals": 推荐的关联目标（字符串，例如："月入5w"、"健康生活"），
  "location": 推荐的位置（字符串，例如："厨房"、"卧室"、"工作区"）
}

**示例：**
任务："学习英语1小时"
返回：{"goldReward": 100, "tags": ["学习", "英语"], "goals": "提升英语水平", "location": "工作区"}

任务："洗碗"
返回：{"goldReward": 30, "tags": ["家务", "厨房"], "goals": "保持整洁", "location": "厨房"}

只返回JSON，不要其他内容。`;
                          
                          const response = await aiService.chat([
                            { role: 'system', content: '你是一个任务分析助手，根据任务标题智能推荐金币奖励、标签、目标和位置。' },
                            { role: 'user', content: prompt }
                          ]);
                          
                          console.log('🤖 AI返回结果:', response);
                          
                          if (!response.success || !response.content) {
                            alert(response.error || '智能分配失败，请重试');
                            return;
                          }
                          
                          // 解析AI返回的JSON
                          let jsonContent = response.content.trim();
                          const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                          if (jsonMatch) {
                            jsonContent = jsonMatch[1].trim();
                          } else {
                            const braceMatch = jsonContent.match(/(\{[\s\S]*\})/);
                            if (braceMatch) {
                              jsonContent = braceMatch[1];
                            }
                          }
                          
                          const aiSuggestion = JSON.parse(jsonContent);
                          console.log('✅ 解析成功:', aiSuggestion);
                          
                          // 自动填充表单
                          setEditedTaskData({
                            ...currentEditData,
                            goldReward: aiSuggestion.goldReward || currentEditData.goldReward,
                            tags: aiSuggestion.tags || currentEditData.tags,
                            goals: aiSuggestion.goals || currentEditData.goals,
                            location: aiSuggestion.location || currentEditData.location
                          });
                          
                          console.log('✅ 智能分配完成');
                        } catch (error) {
                          console.error('❌ 智能分配失败:', error);
                          alert(`智能分配失败：${error instanceof Error ? error.message : '未知错误'}`);
                        } finally {
                          // 无论成功还是失败，都要恢复按钮状态
                          setIsSmartAssigning(false);
                        }
                      }}
                      disabled={isSmartAssigning}
                      className="px-2 py-0.5 rounded-md text-xs font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      style={{
                        backgroundColor: '#8B5CF6',
                        color: '#ffffff'
                      }}
                    >
                      {isSmartAssigning ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>分配中...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>智能分配</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={currentEditData.goldReward || 0}
                    onChange={(e) => setEditedTaskData({ ...currentEditData, goldReward: parseInt(e.target.value) || 0 })}
                    onFocus={(e) => {
                      // 点击时自动滚动到可见区域
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 border-yellow-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20"
                    style={{ color: isDark ? '#ffffff' : '#000000' }}
                    min={0}
                  />
                </div>
                
                {/* 标签 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>🏷️ 标签</label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {(currentEditData.tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm"
                        style={{
                          backgroundColor: isDark ? '#374151' : '#f3f4f6',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = [...(currentEditData.tags || [])];
                            newTags.splice(idx, 1);
                            setEditedTaskData({ ...currentEditData, tags: newTags });
                          }}
                          className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        const newTag = prompt('✨ 输入新标签：');
                        if (newTag) {
                          setEditedTaskData({ 
                            ...currentEditData, 
                            tags: [...(currentEditData.tags || []), newTag] 
                          });
                        }
                      }}
                      className="px-2 py-0.5 rounded-md text-xs font-medium border border-dashed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      style={{
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    >
                      + 添加标签
                    </button>
                  </div>
                </div>
                
                {/* 关联目标 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>🎯 关联目标</label>
                  <div className="flex gap-2">
                    <select
                      value={currentEditData.goals || ''}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          // 添加新目标
                          const newGoalName = prompt('✨ 输入新目标名称：');
                          if (newGoalName && newGoalName.trim()) {
                            // 创建新目标
                            const newGoal = useGoalStore.getState().createGoal({
                              name: newGoalName.trim(),
                              description: '',
                              goalType: 'boolean',
                              isActive: true,
                            });
                            // 设置为当前任务的关联目标
                            setEditedTaskData({ ...currentEditData, goals: newGoal.name });
                          }
                        } else {
                          setEditedTaskData({ ...currentEditData, goals: e.target.value });
                        }
                      }}
                      onFocus={(e) => {
                        // 点击时自动滚动到可见区域
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      style={{ 
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000'
                      }}
                    >
                      <option value="">选择目标...</option>
                      {useGoalStore.getState().getActiveGoals().map((goal) => (
                        <option key={goal.id} value={goal.name}>
                          {goal.name}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: 'bold', color: '#10B981' }}>
                        ➕ 添加新目标
                      </option>
                    </select>
                    {currentEditData.goals && (
                      <button
                        onClick={() => setEditedTaskData({ ...currentEditData, goals: '' })}
                        className="px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="清除目标"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 位置 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>📍 位置</label>
                  <input
                    type="text"
                    value={currentEditData.location || ''}
                    onChange={(e) => setEditedTaskData({ ...currentEditData, location: e.target.value })}
                    onFocus={(e) => {
                      // 点击时自动滚动到可见区域
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    placeholder="例如：厨房、卧室..."
                    className="w-full px-2.5 py-1.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    style={{ 
                      borderColor: isDark ? '#4b5563' : '#d1d5db',
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                </div>
                
                {/* 照片上传 */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>📷 照片</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {taskImages[editingTask] && taskImages[editingTask].map((image, idx) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={image.url} alt={`照片 ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setTaskImages(prev => ({
                              ...prev,
                              [editingTask]: prev[editingTask].filter(img => img.id !== image.id)
                            }));
                          }}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 rounded-full hover:bg-red-600 shadow-sm"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleOpenImagePicker(editingTask)}
                      className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      style={{
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDark ? '#374151' : '#f9fafb'
                      }}
                    >
                      <Camera className="w-5 h-5" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
                    </button>
                  </div>
                </div>
                
                {/* 效率追踪设置（独立功能） */}
                <div className="border-t pt-2" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: isDark ? '#ffffff' : '#000000' }}>
                    📊 效率追踪
                  </label>
                  <div className="p-2 rounded-lg space-y-2" style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: isDark ? '#d1d5db' : '#6b7280' }}>
                        📸 计划拍照次数（用于效率评估）
                      </label>
                      <input
                        type="number"
                        value={taskVerifications[editingTask]?.plannedImageCount || 0}
                        onChange={(e) => {
                          const verification = taskVerifications[editingTask] || {
                            enabled: false,
                            startKeywords: [],
                            completionKeywords: [],
                            startDeadline: null,
                            completionDeadline: null,
                            startFailedAttempts: 0,
                            startTimeoutCount: 0,
                            startRetryDeadline: null,
                            completionFailedAttempts: 0,
                            completionTimeoutCount: 0,
                            completionExtensionCount: 0,
                            plannedImageCount: 0,
                            status: 'pending' as const,
                            actualStartTime: null,
                            actualCompletionTime: null,
                            startGoldEarned: 0,
                            completionGoldEarned: 0,
                            totalGoldPenalty: 0,
                            startPenaltyGold: 0,
                          };
                          
                          setTaskVerifications(prev => ({
                            ...prev,
                            [editingTask]: {
                              ...verification,
                              plannedImageCount: parseInt(e.target.value) || 0
                            }
                          }));
                        }}
                        className="w-full px-2 py-1 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ 
                          borderColor: isDark ? '#4b5563' : '#d1d5db',
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                        min={0}
                        placeholder="0 = 不限制"
                      />
                      <p className="text-xs mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                        完成任务时会对比实际上传照片数量，评估完成效率
                      </p>
                    </div>
                  </div>
                </div>
              </div>
                
              {/* 底部按钮 - 紧凑布局 */}
              <div className="flex-shrink-0 border-t px-3 py-2 flex gap-2 bg-gray-50 dark:bg-gray-800/50" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                <button
                  onClick={() => {
                    if (onTaskDelete && confirm('🗑️ 确定要删除这个任务吗？')) {
                      onTaskDelete(editingTask);
                      setEditingTask(null);
                      setEditedTaskData(null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 text-sm"
                  style={{ backgroundColor: '#EF4444', color: 'white' }}
                >
                  删除此任务
                </button>
                
                <button
                  onClick={() => {
                    // 保存任务数据
                    const verification = taskVerifications[editingTask];
                    const images = taskImages[editingTask];
                    
                    onTaskUpdate(editingTask, {
                      ...currentEditData,
                      // 保存验证设置
                      verificationEnabled: verification?.enabled || false,
                      startKeywords: verification?.startKeywords || [],
                      completeKeywords: verification?.completionKeywords || [],
                      // 保存照片
                      images: images || [],
                      coverImageUrl: images && images.length > 0 ? images[0].url : undefined,
                      // 保存计划拍照次数
                      plannedImageCount: verification?.plannedImageCount || 0,
                    });
                    
                    setEditingTask(null);
                    setEditedTaskData(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-lg text-sm"
                  style={{ backgroundColor: '#10B981', color: 'white' }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {console.log('📊 [timeBlocks] 总数:', timeBlocks.length, '任务:', timeBlocks.map(b => b.title))}
      
      {/* 任务列表容器 - 包含NOW线 */}
      <div className="relative">
        {/* NOW时间线 - 相对于任务列表定位 */}
        <NowTimeline 
          timeBlocks={timeBlocks.map(block => ({
            id: block.id,
            startTime: block.startTime,
            endTime: block.endTime,
            title: block.title,
          }))}
          isDark={isDark}
        />
        
        {timeBlocks.map((block, index) => {
        const isExpanded = expandedCards.has(block.id);
        const gap = gaps.find(g => g.id === `gap-${index}`);

        return (
          <div key={block.id}>
              {/* 🔧 零侵入添加：验证倒计时组件（独立模块，高优先级显示） */}
              
              
            {/* 任务卡片 */}
            <div className="relative flex items-start gap-3 mb-0">
              {/* 左侧时间列 */}
              <div className={`${isMobile ? 'w-10' : 'w-12'} flex-shrink-0 text-left flex flex-col`}>
                {/* 开始时间 */}
                <div className={`${isMobile ? 'text-sm' : 'text-base'} font-bold leading-none mb-1`} style={{ color: textColor }}>
                  {formatTime(block.startTime)}
                </div>
                {/* 占位，让结束时间对齐卡片底部 */}
                <div className="flex-1"></div>
                {/* 结束时间 - 对齐卡片底部 */}
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold leading-none`} style={{ color: accentColor }}>
                  {formatTime(block.endTime)}
                </div>
              </div>

              {/* 任务卡片主体 - 手机版缩小 */}
              <div 
                data-task-id={block.id}
                className={`flex-1 ${isMobile ? 'rounded-xl' : 'rounded-2xl'} shadow-lg overflow-hidden relative`}
                style={{ 
                  backgroundColor: block.color,
                  opacity: block.isCompleted ? 0.6 : 1,
                  filter: block.isCompleted ? 'saturate(0.5)' : 'none',
                }}
              >
                {/* 任务状态标记 - 右上角显示超时和低效率标记 */}
                <TaskStatusBadge
                  taskId={block.id}
                  taskTitle={block.title}
                  goldReward={block.goldReward}
                  isCompleted={block.isCompleted}
                  startTimeoutCount={allTasks.find(t => t.id === block.id)?.startTimeoutCount || 0}
                  completeTimeoutCount={allTasks.find(t => t.id === block.id)?.completeTimeoutCount || 0}
                  efficiencyLevel={block.efficiencyLevel}
                  completionEfficiency={block.completionEfficiency}
                  mandatoryReflection={allTasks.find(t => t.id === block.id)?.mandatoryReflection}
                  position="top-right"
                  size={isMobile ? 'small' : 'medium'}
                />
                
                {/* 🔥 验证倒计时组件 - 预设时间到达或任务进行中时显示 */}
                {(() => {
                  const now = new Date();
                  const scheduledStart = new Date(block.startTime);
                  const hasReachedStartTime = now >= scheduledStart;
                  const isInProgress = block.status === 'in_progress';
                  const isCompleted = block.isCompleted;
                  
                  // 显示条件：预设时间已到达 且 未完成，且不是“间隔补录记录”任务
                  const taskRecord = allTasks.find((item) => item.id === block.id);
                  const shouldShow = hasReachedStartTime && !isCompleted && !isHistoricalGapRecordTask(taskRecord);
                  
                  return shouldShow;
                })() && (
                  <TaskVerificationCountdownContent
                     key={block.id}
                     taskId={block.id}
                     taskTitle={block.title}
                     scheduledStart={block.startTime}
                     scheduledEnd={block.endTime}
                     goldReward={block.goldReward || 0}
                     onStart={(actualStartTime, calculatedEndTime) => {
                       // 更新任务的实际开始和结束时间（核心需求：时间动态更新）
                       console.log(`🚀 [时间更新] 任务启动: ${block.title}`);
                       console.log(`  预设开始: ${new Date(block.startTime).toLocaleTimeString()}`);
                       console.log(`  实际开始: ${actualStartTime.toLocaleTimeString()}`);
                       console.log(`  预计结束: ${calculatedEndTime.toLocaleTimeString()}`);
                       
                       onTaskUpdate(block.id, {
                         scheduledStart: actualStartTime.toISOString(),
                         scheduledEnd: calculatedEndTime.toISOString(),
                         status: 'in_progress',
                       });
                     }}
                     onComplete={(actualEndTime) => {
                       // 更新任务的实际结束时间（核心需求：事件卡片结束时间自动更新为实际完成时间）
                       console.log(`✅ [时间更新] 任务完成: ${block.title}`);
                       console.log(`  预设结束: ${new Date(block.endTime).toLocaleTimeString()}`);
                       console.log(`  实际结束: ${actualEndTime.toLocaleTimeString()}`);
                       
                       const taskRecord = allTasks.find((item) => item.id === block.id);
                       if (isMandatoryReflectionPending(taskRecord)) {
                         openMandatoryReflection(block.id, taskRecord?.mandatoryReflection?.trigger || 'low_efficiency');
                         return;
                       }

                       if (taskRecord && activeLoop?.taskId === taskRecord.id) {
                         setActiveLoop({
                           ...activeLoop,
                           taskId: taskRecord.id,
                           taskTitle: taskRecord.title,
                           timelineTaskCompletedAt: actualEndTime.toISOString(),
                           closureNote: activeLoop?.goalContributionRecordedAt
                             ? '追责动作与目标贡献都已补齐，等待总部复盘确认。'
                             : '整改任务已执行完成，下一步补写目标贡献记录。',
                         });
                       }

                       // 🎯 更新任务的实际结束时间
                       onTaskUpdate(block.id, {
                         endTime: actualEndTime.toISOString(),
                         status: 'completed'
                       });
                       
                       const isHistoricalGapTask = isHistoricalGapRecordTask(taskRecord);

                       // 🎯 所有普通任务完成时都显示效率评估模态框；过去的间隔补录记录任务不进入该流程
                       if (isHistoricalGapTask) {
                         onTaskUpdate(block.id, {
                           scheduledEnd: actualEndTime.toISOString(),
                           endTime: actualEndTime.toISOString(),
                           isCompleted: true,
                           status: 'completed'
                         });
                         return;
                       }
                       
                       // 🎯 所有普通任务完成时都显示效率评估模态框
                       const verification = taskVerifications[block.id];
                       const plannedImageCount = verification?.plannedImageCount || 0;
                       const actualImageCount = taskImages[block.id]?.length || 0;
                       const actualDurationMinutes = taskRecord?.scheduledStart
                         ? Math.max(0, Math.floor((actualEndTime.getTime() - new Date(taskRecord.scheduledStart).getTime()) / 60000))
                         : 0;
                       const isLowEfficiencyOvertime = actualDurationMinutes >= ((taskRecord?.durationMinutes || block.duration || 0) + LOW_EFFICIENCY_DELAY_MINUTES);
                       
                       // 馃敡 璁＄畻閲戝竵濂栧姳锛堟彁鍓嶅畬鎴愬鍔?0%锛塦r
                       const scheduledEndTime = new Date(block.endTime);
                       const scheduledStartTime = new Date(block.startTime);
                       const now = new Date();
                       
                       // 判断是否为补录历史任务（任务开始时间早于当前时间）
                       const isHistoricalTask = scheduledStartTime < now;
                       const isBackfillRecord = isHistoricalGapRecordTask(taskRecord);
                       
                       const isEarly = actualEndTime < scheduledEndTime;
                       // 如果是补录历史任务，不发金币；否则按提前完成计算
                       const goldReward = isBackfillRecord
                         ? 0
                         : (isHistoricalTask 
                           ? (block.goldReward || 0) 
                           : (isEarly ? Math.floor((block.goldReward || 0) * 0.5) : 0));
                       
                       setEfficiencyModalTask({
                         id: block.id,
                         title: block.title,
                         plannedImageCount,
                         actualImageCount,
                         actualEndTime,
                         goldReward,
                         forceMandatoryReflection: isLowEfficiencyOvertime,
                       });
                       setEfficiencyModalOpen(true);
                     }}
                     onTimeoutUpdate={(startTimeoutCount, completeTimeoutCount) => {
                       // 保存超时数据到任务对象
                       console.log(`💾 保存超时数据: 启动${startTimeoutCount}次, 完成${completeTimeoutCount}次`);
                       
                       onTaskUpdate(block.id, {
                         startVerificationTimeout: startTimeoutCount > 0,
                         startTimeoutCount: startTimeoutCount,
                         completionTimeout: completeTimeoutCount > 0,
                         completeTimeoutCount: completeTimeoutCount,
                       });

                       if (startTimeoutCount >= START_DELAY_FORM_THRESHOLD) {
                         ensureMandatoryReflection(block.id, 'start_delay');
                       }
                       
                       if (startTimeoutCount > 0) {
                         setTaskStartTimeouts(prev => ({ ...prev, [block.id]: true }));
                       }
                       if (completeTimeoutCount > 0) {
                         setTaskFinishTimeouts(prev => ({ ...prev, [block.id]: true }));
                       }
                     }}
                     hasVerification={!!taskVerifications[block.id]?.enabled}
                     startKeywords={taskVerifications[block.id]?.startKeywords || ['启动', '开始']}
                     completeKeywords={taskVerifications[block.id]?.completionKeywords || ['完成', '结束']}
                   />
                )}
{/* 完成划线 */}
                {block.isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div 
                      className="w-full h-1.5 bg-white opacity-90"
                      style={{ 
                        transform: 'rotate(-8deg)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    />
                  </div>
                )}

                {/* 验证中遮罩层 */}
                {verifyingTask === block.id && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-3 animate-pulse">⏳</div>
                      <div className="text-lg font-bold mb-2">
                        正在进行{verifyingType === 'start' ? '启动' : '完成'}验证...
                      </div>
                      <div className="text-sm opacity-80">
                        AI正在识别图片内容
                      </div>
                    </div>
                  </div>
                )}

                {/* 未展开：横向长条形布局 - 完全按照设计图，手机版缩小并压缩空白 */}
                {!isExpanded && (
                  <div className={`${isMobile ? 'p-1.5' : 'p-2.5'} text-white`} style={{ color: getTextColor(block.color) }}>
                    {linkedTaskId === block.id && (
                      <div
                        className="mb-2 rounded-full px-3 py-1 text-[10px] font-black tracking-[0.14em]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff7ed' }}
                      >
                        总部刚刚把你带到这条任务，先把它处理掉。
                      </div>
                    )}
                    {block.isLinkedHQTask && linkedTaskId !== block.id && (
                      <div
                        className="mb-2 rounded-full px-3 py-1 text-[10px] font-black tracking-[0.14em]"
                        style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff7ed' }}
                      >
                        总部整改主任务，建议优先完成并补 KR。
                      </div>
                    )}
                    {/* 第一行：拖拽手柄 + 标签 + 时长 + 编辑按钮 - 减少下边距 */}
                    <div className={`flex items-center justify-between ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {/* 拖拽手柄 */}
                        <div
                          className="cursor-move p-0.5 rounded hover:bg-white/20 transition-colors"
                          onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                          onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                        >
                          <GripVertical className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-60`} />
                        </div>
                        
                        <div className={`flex ${isMobile ? 'gap-1' : 'gap-1'} flex-wrap`}>
                          {[...block.tags, ...(block.sourceBadges || [])].map((tag, idx) => (
                            <span 
                              key={`${tag}-${idx}`}
                              className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-semibold ${isMobile ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full`}
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {/* 金币显示 */}
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className="text-sm">💰</span>
                          <span className="text-xs font-bold">{block.goldReward}</span>
                        </div>
                        
                        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: '#ff69b4' }}>
                          *{(() => {
                            // 计算实际时长：从实际开始时间到实际结束时间
                            const startTime = new Date(block.startTime);
                            const endTime = new Date(block.endTime);
                            const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                            return actualDuration;
                          })()} min
                        </div>
                        
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => setEditingTask(block.id)}
                          className={`${isMobile ? 'p-0.5' : 'p-1'} rounded-full hover:bg-white/20 transition-colors`}
                          title="编辑任务"
                        >
                          <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                        </button>
                      </div>
                    </div>

                    {/* 第二行：图片 + 标题区域 - 手机版缩小并减少边距 */}
                    <div className={`flex ${isMobile ? 'gap-1.5 mb-0.5' : 'gap-2 mb-1'}`}>
                      {/* 圆形图片 */}
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative`}
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        title="点击上传照片（支持多选）"
                      >
                        {taskImages[block.id] && taskImages[block.id].length > 0 ? (
                          <img 
                            src={taskImages[block.id][0].url} 
                            alt="封面"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Camera className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} opacity-60`} />
                        )}
                        {uploadingImage === block.id && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <span className={`text-white ${isMobile ? 'text-[8px]' : 'text-[10px]'}`}>上传中</span>
                          </div>
                        )}
                      </div>

                      {/* 标题 + 目标 + 状态指示器 */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className={`flex items-center ${isMobile ? 'gap-1 mb-0' : 'gap-1 mb-0.5'}`}>
                          <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className={`${isMobile ? 'text-base' : 'text-lg'}`}>{block.emoji}</span>
                        </div>
                        
                        {/* 照片任务进度条 */}
                        {(() => {
                          const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                          if (isPhotoTask) {
                            const { uploadedCount, progress } = getPhotoTaskProgress(block.id, targetCount);
                            return (
                              <div className={`${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-bold whitespace-nowrap`}>
                                    {uploadedCount}/{targetCount}{unit}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* 状态指示器 */}
                        {block.status === 'in_progress' && (
                          <div className="mb-1">
                            <TaskStatusIndicator
                              status={block.status}
                              taskTitle={block.title}
                              taskColor={block.color}
                              isProcrastinating={taskVerifications[block.id]?.isProcrastinating}
                              isLowEfficiency={taskVerifications[block.id]?.isLowEfficiency}
                            />
                          </div>
                        )}
                        
                        <div className={`${isMobile ? 'text-[9px]' : 'text-xs'} opacity-90`}>
                          {block.goalText}
                          {block.isCompleted && (block.sourceBadges || []).includes('总部联动') && (
                            <span className="ml-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] text-white/95">
                              已向总部回写完成
                            </span>
                          )}
                        </div>

                        {block.isLinkedHQTask && (
                          <div className="mt-1 rounded-xl bg-white/12 px-2 py-1 text-[10px] leading-4 text-white/95">
                            <div className="font-bold tracking-[0.08em]">总部即时纠偏</div>
                            <div className="mt-0.5">{activeLoop?.promise || '先止损，再按总部要求回到主线。'}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 第三行：按钮 + 金币 + start - 手机版缩小 */}
                    <div className="flex items-center justify-between">
                      {/* 左侧：圆形按钮 */}
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {/* AI拆解子任务 */}
                        <button
                          onClick={() => handleGenerateSubTasks(block.id, block.title, block.description)}
                          disabled={generatingSubTasks === block.id}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="AI拆解子任务"
                        >
                          <span className="text-sm">{generatingSubTasks === block.id ? '⏳' : '⭐'}</span>
                        </button>
                        
                        {/* 启用/编辑验证 */}
                        <button
                          onClick={() => {
                            const verification = taskVerifications[block.id];
                            if (verification && verification.enabled) {
                              setEditingVerification(block.id);
                            } else {
                              handleEnableVerification(block.id, block.title, block.taskType || 'work');
                            }
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: taskVerifications[block.id]?.enabled 
                              ? 'rgba(34,197,94,0.4)' 
                              : 'rgba(255,255,255,0.25)' 
                          }}
                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用拖延验证'}
                        >
                          <span className="text-sm">⏱️</span>
                        </button>

                        {/* 关键结果 */}
                        <button
                          onClick={() => openGoalContributionModal(block.id)}
                          className="rounded-full px-2 py-1 text-[10px] font-bold transition-all hover:scale-105"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="填写关键结果"
                        >
                          KR
                        </button>
                      </div>

                      {/* 右侧：start + 展开 */}
                      <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
                        {!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
                          <button
                            onClick={() => handleStartTask(block.id)}
                            disabled={startingTask === block.id}
                            className="px-2 py-0.5 text-xs rounded-full font-bold transition-all hover:scale-105 disabled:opacity-50"
                            style={{ 
                              backgroundColor: taskVerifications[block.id]?.status === 'started' 
                                ? 'rgba(34,197,94,0.3)' 
                                : 'rgba(255,255,255,0.95)',
                              color: taskVerifications[block.id]?.status === 'started'
                                ? 'rgba(255,255,255,0.95)'
                                : block.color,
                            }}
                            title={
                              taskVerifications[block.id]?.status === 'started'
                                ? '已启动验证'
                                : taskVerifications[block.id]?.enabled 
                                ? '拍照验证启动' 
                                : '开始任务'
                            }
                          >
                            {startingTask === block.id 
                              ? '⏳' 
                              : taskVerifications[block.id]?.status === 'started'
                              ? '✅已启动'
                              : '*start'}
                          </button>
                        )}
                        
                        {/* 宸插惎鍔ㄦ爣璇?*/}
                        {taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
                          <div 
                            className={` rounded-full font-bold`}
                            style={{ 
                              backgroundColor: 'rgba(34,197,94,0.3)',
                              color: 'rgba(255,255,255,0.95)',
                            }}
                          >
                            鉁呭凡鍚姩
                          </div>
                        )}
                        
                        {block.status === 'in_progress' && (
                          <div 
                            className="px-2 py-0.5 text-xs rounded-full font-bold"
                            style={{ 
                              backgroundColor: 'rgba(34,197,94,0.3)',
                              color: 'rgba(255,255,255,0.95)',
                            }}
                          >
                            进行中
                          </div>
                        )}
                        
                        {/* SOP按钮 - 始终显示 */}
                        <button
                          onClick={() => {
                            const taskData = allTasks.find(t => t.id === block.id);
                            if (taskData) {
                              eventBus.emit('openSOPDialog', taskData);
                            }
                          }}
                          className="px-2 py-0.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                          style={{ 
                            backgroundColor: 'rgba(59, 130, 246, 0.3)',
                            color: 'rgb(255, 255, 255)',
                          }}
                          title="保存到SOP"
                        >
                          SOP
                        </button>
                        
                        {/* 任务重复按钮 */}
                        <button
                          onClick={() => setRecurrenceDialogTask(allTasks.find(t => t.id === block.id) || null)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: block.isRecurring ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)',
                          }}
                          title={block.isRecurring ? '已设置重复' : '设置任务重复'}
                        >
                          <span className="text-sm">🔄</span>
                        </button>
                        <button
                          onClick={() => toggleExpand(block.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 验证中遮罩层（展开状态） */}
                {verifyingTask === block.id && isExpanded && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-3 animate-pulse">⏳</div>
                      <div className="text-lg font-bold mb-2">
                        正在进行{verifyingType === 'start' ? '启动' : '完成'}验证...
                      </div>
                      <div className="text-sm opacity-80">
                        AI正在识别图片内容
                      </div>
                    </div>
                  </div>
                )}

                {/* 展开：竖向长方形布局 */}
                {isExpanded && (
                  <div className="p-4 text-white" style={{ color: getTextColor(block.color) }}>
                    {/* 顶部：拖拽手柄 + 标签和时长 + 编辑按钮 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        {/* 拖拽手柄 */}
                        <div
                          className="cursor-move p-1 rounded hover:bg-white/20 transition-colors mt-1"
                          onMouseDown={(e) => handleDragStart(e, block.id, block.startTime)}
                          onTouchStart={(e) => handleDragStart(e, block.id, block.startTime)}
                        >
                          <GripVertical className="w-4 h-4 opacity-60" />
                        </div>
                        
                        <div className="flex gap-1.5 flex-wrap">
                          {block.tags.map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: '#ff69b4' }}>
                          *{block.duration} min
                        </span>
                        
                        {/* 保存到SOP按钮 */}
                        {(block.status === 'in_progress' || block.isCompleted) && (
                          <SaveToSOPButton 
                            task={allTasks.find(t => t.id === block.id)!}
                            isDark={isDark}
                            size="small"
                          />
                        )}
                        
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => setEditingTask(block.id)}
                          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                          title="编辑任务"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 主体：图片+标题 */}
                    <div className="flex gap-2 mb-2">
                      {/* 图片上传区 */}
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity relative"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        title="点击上传照片（支持多选）"
                      >
                        {taskImages[block.id] && taskImages[block.id].length > 0 ? (
                          <img 
                            src={taskImages[block.id][0].url} 
                            alt="封面"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Camera className="w-6 h-6 opacity-60" />
                        )}
                        {uploadingImage === block.id && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xs">上传中...</span>
                          </div>
                        )}
                      </div>

                      {/* 标题区 */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className={`text-base font-bold ${block.isCompleted ? 'line-through' : ''}`}>
                            {block.title}
                          </h3>
                          <span className="text-xl">{block.emoji}</span>
                        </div>
                        
                        {/* 照片任务进度条（展开状态） */}
                        {(() => {
                          const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                          if (isPhotoTask) {
                            const { uploadedCount, progress } = getPhotoTaskProgress(block.id, targetCount);
                            return (
                              <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold whitespace-nowrap">
                                    {uploadedCount}/{targetCount}{unit}
                                  </span>
                                </div>
                                <div className="text-[10px] opacity-80">
                                  📸 每上传1张照片 = 完成{Math.round(100/targetCount)}%任务
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* 虚线 */}
                        <div 
                          className="w-full my-1"
                          style={{ borderTop: '2px dashed rgba(255,255,255,0.4)' }}
                        />

                        {/* 关联目标 */}
                        <div className="text-xs opacity-90">
                          <span className="font-medium">{block.goalText}</span>
                        </div>
                      </div>
                    </div>

                    {/* 功能按钮栏 */}
                    <div className="flex items-center justify-between mb-2">
                      {/* 左侧功能图标 */}
                      <div className="flex items-center gap-1.5">
                        {/* AI拆解子任务 */}
                        <button
                          onClick={() => handleGenerateSubTasks(block.id, block.title, block.description)}
                          disabled={generatingSubTasks === block.id}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="AI拆解子任务"
                        >
                          <span className="text-sm">{generatingSubTasks === block.id ? '⏳' : '⭐'}</span>
                        </button>
                        
                        {/* 启用/编辑验证 */}
                        <button
                          onClick={() => {
                            const verification = taskVerifications[block.id];
                            if (verification && verification.enabled) {
                              // 已启用，打开编辑对话框
                              setEditingVerification(block.id);
                            } else {
                              // 未启用，启用验证
                              handleEnableVerification(block.id, block.title, block.taskType || 'work');
                            }
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            backgroundColor: taskVerifications[block.id]?.enabled 
                              ? 'rgba(34,197,94,0.4)' 
                              : 'rgba(255,255,255,0.25)' 
                          }}
                          title={taskVerifications[block.id]?.enabled ? '编辑验证关键词' : '启用拖延验证'}
                        >
                          <span className="text-sm">⏱️</span>
                        </button>

                        <button
                          onClick={() => openGoalContributionModal(block.id)}
                          className="rounded-full px-2 py-1 text-[10px] font-bold transition-all hover:scale-105"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          title="填写关键结果"
                        >
                          KR
                        </button>
                      </div>

                      {/* 倒计时显示 - 整合到卡片内，不展开时也显示 */}
                      {taskVerifications[block.id]?.enabled && (
                        <>
                          {/* 启动验证倒计时 - 仅在等待启动时显示 */}
                          {taskVerifications[block.id]?.status === 'waiting_start' && (() => {
                            const now = new Date();
                            const scheduledStart = new Date(block.scheduledStart || block.startTime);
                            const diffMs = scheduledStart.getTime() - now.getTime();
                            const diffMinutes = Math.floor(diffMs / 60000);
                            const diffSeconds = Math.floor((diffMs % 60000) / 1000);
                            
                            if (diffMs <= 0) {
                              // 时间到了，显示启动提示
                              return (
                                <div className="mt-2 text-center">
                                  <div className="text-lg font-bold mb-1">⏰ 马上进行启动验证</div>
                                  <div className="text-xs opacity-80 mb-2">
                                    请拍摄包含【{taskVerifications[block.id]?.startKeywords?.join('、')}】的照片
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* 完成验证倒计时 - 仅在已启动未完成时显示 */}
                          {taskVerifications[block.id]?.status === 'started' && (() => {
                            const startTime = taskActualStartTimes[block.id] || taskVerifications[block.id]?.actualStartTime || new Date(block.startTime);
                            const estimatedMinutes = block.duration || block.durationMinutes || 30;
                            const endTime = new Date(startTime.getTime() + estimatedMinutes * 60000);
                            const now = new Date();
                            const remainingMs = endTime.getTime() - now.getTime();
                            const remainingMinutes = Math.floor(remainingMs / 60000);
                            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
                            
                            return (
                              <div className="mt-2 text-center">
                                <div className="text-lg font-bold mb-1">
                                  ⏱️ 距离任务完成还有 {remainingMinutes}分{remainingSeconds}秒
                                </div>
                                <div className="text-xs opacity-80">
                                  完成后请拍摄包含【{taskVerifications[block.id]?.completionKeywords?.join('、')}】的照片
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      )}

                      {/* 右侧：金币和完成按钮 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.3)' }}>
                          <span className="text-base">💰</span>
                          <span className="text-xs font-bold">{block.goldReward}</span>
                        </div>

                        {/* 完成验证按钮 */}
                        <button
                          onClick={() => handleCompleteTask(block.id)}
                          disabled={
                            completingTask === block.id || 
                            (taskVerifications[block.id]?.enabled && taskVerifications[block.id]?.status !== 'started')
                          }
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                          style={{ 
                            backgroundColor: block.isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                            borderColor: 'rgba(255,255,255,0.8)',
                          }}
                          title={
                            block.isCompleted 
                              ? '点击取消完成'
                              : taskVerifications[block.id]?.enabled 
                                ? (taskVerifications[block.id]?.status === 'started' ? '拍照验证完成' : '请先完成启动验证')
                                : '标记完成'
                          }
                        >
                          {completingTask === block.id ? (
                            <span className="text-sm">⏳</span>
                          ) : block.isCompleted ? (
                            <Check className="w-5 h-5" style={{ color: block.color }} />
                          ) : null}
                        </button>
                      </div>
                    </div>

                    {/* Start按钮和收起按钮 */}
                    <div className="flex items-center justify-end gap-2">
                      {!block.isCompleted && block.status !== 'in_progress' && taskVerifications[block.id]?.status !== 'started' && (
                        <button
                          onClick={() => handleStartTask(block.id)}
                          disabled={startingTask === block.id}
                          className="px-4 py-1.5 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            color: block.color,
                          }}
                          title={
                            taskVerifications[block.id]?.enabled 
                              ? '拍照验证启动' 
                              : '开始任务'
                          }
                        >
                          {startingTask === block.id ? '⏳' : '*start'}
                        </button>
                      )}
                       
                       {/* 宸插惎鍔ㄦ爣璇?*/}
                       {taskVerifications[block.id]?.status === 'started' && !block.isCompleted && (
                         <div 
                           className="px-4 py-1.5 rounded-full font-bold text-sm"
                           style={{ 
                             backgroundColor: 'rgba(34,197,94,0.3)',
                             color: 'rgba(255,255,255,0.95)',
                           }}
                         >
                           鉁?宸插惎鍔?                         </div>
                       )}
                      
                      {block.status === 'in_progress' && (
                        <div 
                          className="px-4 py-1.5 rounded-full font-bold text-sm"
                          style={{ 
                            backgroundColor: 'rgba(34,197,94,0.3)',
                            color: 'rgba(255,255,255,0.95)',
                          }}
                        >
                          进行中...
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleExpand(block.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 展开区域：子任务和文件 */}
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '2px dashed rgba(255,255,255,0.3)' }}>
                      {/* 照片任务：显示照片网格 */}
                      {(() => {
                        const { isPhotoTask, targetCount, unit } = detectPhotoTaskType(block.title);
                        if (isPhotoTask) {
                          const images = taskImages[block.id] || [];
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium opacity-90">
                                  📸 照片任务进度
                                </div>
                                <div className="text-xs opacity-80">
                                  {images.length}/{targetCount}{unit}
                                </div>
                              </div>
                              
                              {/* 照片网格 */}
                              <div className="grid grid-cols-3 gap-2">
                                {images.map((image, idx) => (
                                  <div 
                                    key={image.id}
                                    className="relative aspect-square rounded-lg overflow-hidden group"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  >
                                    <img 
                                      src={image.url} 
                                      alt={`照片 ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {idx === 0 && (
                                      <div 
                                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                      >
                                        封面
                                      </div>
                                    )}
                                    <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/80 text-white">
                                      ✓ {idx + 1}
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (confirm('确定要删除这张照片吗？')) {
                                          setTaskImages(prev => ({
                                            ...prev,
                                            [block.id]: prev[block.id].filter(img => img.id !== image.id)
                                          }));
                                        }
                                      }}
                                      className="absolute bottom-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                ))}
                                
                                {/* 添加照片按钮 */}
                                {images.length < targetCount && (
                                  <div 
                                    onClick={() => handleOpenImagePicker(block.id)}
                                    className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ 
                                      backgroundColor: 'rgba(255,255,255,0.15)',
                                      border: '2px dashed rgba(255,255,255,0.4)'
                                    }}
                                  >
                                    <Camera className="w-6 h-6 mb-1 opacity-60" />
                                    <span className="text-[10px] opacity-80">
                                      还需{targetCount - images.length}{unit}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {images.length >= targetCount && (
                                <div className="text-center py-2 px-3 rounded-lg bg-green-500/20">
                                  <span className="text-sm font-bold">🎉 已完成所有照片上传！</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* 普通任务：显示文字子任务 */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && (
                      <div className="space-y-1.5">
                        {/* 显示已有子任务 */}
                        {(taskSubTasks[block.id] || []).map((subtask) => (
                          <div 
                            key={subtask.id}
                            className="flex items-center gap-2 pl-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                            onClick={() => handleToggleSubTask(block.id, subtask.id)}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                              style={{ 
                                borderColor: 'rgba(255,255,255,0.8)',
                                backgroundColor: subtask.completed ? 'rgba(255,255,255,0.9)' : 'transparent',
                              }}
                            >
                              {subtask.completed && <Check className="w-3 h-3" style={{ color: block.color }} />}
                            </div>
                            <span className={`text-xs ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                        
                        {/* 显示默认子任务 */}
                        {(taskSubTasks[block.id] || []).length === 0 && block.subtasks.map((subtask, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-2 pl-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                          >
                            <div 
                              className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                              style={{ borderColor: 'rgba(255,255,255,0.8)' }}
                            />
                            <span className="text-xs">{subtask}</span>
                          </div>
                        ))}
                        
                        {/* 添加子任务输入框 */}
                        {addingSubTask === block.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newSubTaskTitle}
                              onChange={(e) => setNewSubTaskTitle(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddManualSubTask(block.id);
                                }
                              }}
                              placeholder="输入子任务标题..."
                              className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: getTextColor(block.color),
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddManualSubTask(block.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setAddingSubTask(null);
                                setNewSubTaskTitle('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingSubTask(block.id)}
                            className="w-full py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                          >
                            + 添加子任务
                          </button>
                        )}
                      </div>
                      )}

                      {/* 附件列表（仅普通任务显示） */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && taskImages[block.id] && taskImages[block.id].length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium opacity-80">附件列表</div>
                          <div className="grid grid-cols-3 gap-2">
                            {taskImages[block.id].map((image, idx) => (
                              <div 
                                key={image.id}
                                className="relative aspect-square rounded-lg overflow-hidden group"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                              >
                                <img 
                                  src={image.url} 
                                  alt={`附件 ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 && (
                                  <div 
                                    className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                                  >
                                    封面
                                  </div>
                                )}
                                {/* 删除按钮 - 长按或点击删除 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('确定要删除这张图片吗？')) {
                                      setTaskImages(prev => ({
                                        ...prev,
                                        [block.id]: prev[block.id].filter(img => img.id !== image.id)
                                      }));
                                    }
                                  }}
                                  className="absolute bottom-1 right-1 p-1.5 bg-red-500/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="删除图片"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 文件上传区（仅普通任务显示） */}
                      {!detectPhotoTaskType(block.title).isPhotoTask && (
                      <div 
                        onClick={() => handleOpenImagePicker(block.id)}
                        className="rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          border: '2px dashed rgba(255,255,255,0.4)'
                        }}
                      >
                        <Plus className="w-6 h-6 mb-1 opacity-60" />
                        <span className="text-xs font-medium opacity-80">点击添加照片/附件</span>
                        <span className="text-[10px] opacity-60 mt-1">支持多选，第一张为封面</span>
                      </div>
                      )}
                      
                      {/* 完成笔记/反思 */}
                      {block.completionNotes && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium opacity-80">📝 完成笔记</div>
                          <div 
                            className="rounded-lg p-3 text-xs leading-relaxed"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          >
                            {block.completionNotes}
                          </div>
                        </div>
                      )}

                      {block.isLinkedHQTask && activeLoop?.accountabilityForm?.answers?.length ? (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium opacity-80">🧭 总部即时纠偏建议</div>
                          <div
                            className="rounded-lg p-3 text-xs leading-relaxed"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          >
                            <div className="font-bold">先做什么</div>
                            <div className="mt-1">{activeLoop.promise || '立刻止损，把注意力拉回这条总部整改任务。'}</div>
                            <div className="mt-2 font-bold">刚才你自己承认的问题</div>
                            <div className="mt-1 space-y-1">
                              {activeLoop.accountabilityForm.answers.slice(0, 2).map((item, index) => (
                                <div key={`linked-hq-answer-${block.id}-${index}`}>• {item.answer}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      
                      {/* 效率评分 */}
                      {block.completionEfficiency !== undefined && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium opacity-80">⚡ 完成效率</div>
                          <div 
                            className="rounded-lg p-3 flex items-center justify-between"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {block.completionEfficiency >= 80 ? '🌟' : 
                                 block.completionEfficiency >= 60 ? '👍' : 
                                 block.completionEfficiency >= 40 ? '😐' : '😔'}
                              </span>
                              <div>
                                <div className="text-sm font-bold">{block.completionEfficiency}%</div>
                                <div className="text-[10px] opacity-70">
                                  {block.plannedImageCount && block.actualImageCount !== undefined && 
                                    `计划${block.plannedImageCount}张 / 实际${block.actualImageCount}张`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧完成圆圈 - 靠右不占卡片空间 */}
              <div className="w-8 flex-shrink-0 flex justify-end pt-3">
                <div 
                  className="w-6 h-6 rounded-full border-2"
                  style={{ 
                    borderColor: block.isCompleted ? block.color : borderColor,
                    backgroundColor: block.isCompleted ? block.color : 'transparent',
                  }}
                />
              </div>
            </div>

            {/* 间隔添加按钮 - 只在间隔大于0时显示 */}
            {gap && gap.durationMinutes > 0 && (
              <div className="flex items-center gap-3 my-2">
                {/* 左侧时间对齐 */}
                <div className="w-12 flex-shrink-0 text-left">
                  <div className="text-sm font-semibold" style={{ color: accentColor }}>
                    {formatTime(gap.startTime)}
                  </div>
                </div>

                {/* 间隔按钮 */}
                <button
                  onClick={() => {
                    // 🔧 修复：打开任务创建对话框，而不是直接创建任务
                    setCreatingGapTask({
                      startTime: gap.startTime,
                      endTime: gap.endTime,
                      maxDuration: gap.durationMinutes,
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                    border: `2px dashed ${borderColor}`,
                  }}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#C85A7C' }}
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: textColor }}>
                    (间隔{formatDuration(gap.durationMinutes)})
                  </span>
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>
      {/* 任务列表容器结束 */}

      {/* 今日结束剩余时间按钮 - 在最后一个任务后面 */}
      {timeUntilEnd && (
        <div className="flex items-center gap-3 mt-2">
          {/* 左侧时间对齐 */}
          <div className="w-12 flex-shrink-0 text-left">
            <div className="text-sm font-semibold" style={{ color: accentColor }}>
              {formatTime(timeUntilEnd.startTime)}
            </div>
          </div>

          {/* 今日结束按钮 */}
          <button
            onClick={() => {
              try {
                // 固定添加30分钟的任务
                const startTime = new Date(timeUntilEnd.startTime);
                const endTime = new Date(startTime.getTime() + 30 * 60000);
                const newTask = {
                  title: '新任务',
                  scheduledStart: startTime.toISOString(),
                  scheduledEnd: endTime.toISOString(),
                  durationMinutes: 30, // 固定30分钟
                  taskType: 'work',
                  status: 'pending' as const,
                };
                onTaskCreate(newTask);
              } catch (error) {
                console.error('创建今日结束任务失败:', error);
                alert('创建任务失败: ' + (error instanceof Error ? error.message : String(error)));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ 
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
              border: `2px dashed ${borderColor}`,
            }}
          >
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#C85A7C' }}
            >
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: textColor }}>
              今日结束还剩
              {timeUntilEnd.hours > 0 && ` ${timeUntilEnd.hours}小时`}
              {timeUntilEnd.mins > 0 && ` ${timeUntilEnd.mins}分钟`}
            </span>
          </button>
        </div>
      )}

      {/* 空状态 */}
      {timeBlocks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-3xl mb-3">📅</div>
          <p className="text-base font-semibold mb-2" style={{ color: textColor }}>
            今天还没有任务
          </p>
          <p className="text-xs mb-3" style={{ color: accentColor }}>
            点击下方按钮添加第一个任务
          </p>
          <button
            onClick={() => {
              // 使用当前时间作为开始时间
              const now = new Date();
              const endTime = new Date(now.getTime() + 30 * 60000); // 30分钟后
              const newTask = {
                title: '新任务',
                scheduledStart: now.toISOString(),
                scheduledEnd: endTime.toISOString(),
                durationMinutes: 30, // 默认30分钟
                taskType: 'work',
                status: 'pending' as const,
              };
              onTaskCreate(newTask);
            }}
            className="px-5 py-2 rounded-full font-semibold text-sm transition-all hover:scale-105"
            style={{ 
              backgroundColor: '#C85A7C',
              color: 'white',
            }}
          >
            + 添加任务
          </button>
        </div>
      )}
      
      {/* 效率模态框 */}
      {efficiencyModalTask && (
        <TaskCompletionEfficiencyModal
          isOpen={efficiencyModalOpen}
          onClose={() => {
            if (efficiencyModalTask.forceMandatoryReflection) {
              ensureMandatoryReflection(efficiencyModalTask.id, 'low_efficiency');
              return;
            }
            setEfficiencyModalOpen(false);
            setEfficiencyModalTask(null);
          }}
          onConfirm={(efficiency, notes) => {
            const task = allTasks.find((item) => item.id === efficiencyModalTask.id);
            const actualDuration = task?.scheduledStart
              ? Math.max(0, Math.floor((efficiencyModalTask.actualEndTime.getTime() - new Date(task.scheduledStart).getTime()) / 60000))
              : (task?.durationMinutes || 0);
            const shouldRequireLowEfficiencyReflection = !!efficiencyModalTask.forceMandatoryReflection;

            if (shouldRequireLowEfficiencyReflection) {
              onTaskUpdate(efficiencyModalTask.id, {
                scheduledEnd: efficiencyModalTask.actualEndTime.toISOString(),
                endTime: efficiencyModalTask.actualEndTime.toISOString(),
                completionEfficiency: efficiency,
                efficiencyLevel: efficiency >= 80 ? 'excellent' : efficiency >= 60 ? 'good' : efficiency >= 40 ? 'average' : 'poor',
                completionNotes: notes,
                actualDuration,
                startVerificationTimeout: taskStartTimeouts[efficiencyModalTask.id],
                completionTimeout: taskFinishTimeouts[efficiencyModalTask.id],
              });

              setEfficiencyModalOpen(false);
              ensureMandatoryReflection(efficiencyModalTask.id, 'low_efficiency');
              return;
            }

            updateTaskEfficiency(
              efficiencyModalTask.id,
              efficiency,
              efficiencyModalTask.actualImageCount
            );

            onTaskUpdate(efficiencyModalTask.id, {
              scheduledEnd: efficiencyModalTask.actualEndTime.toISOString(),
              endTime: efficiencyModalTask.actualEndTime.toISOString(),
              isCompleted: true,
              status: 'completed',
              completionEfficiency: efficiency,
              efficiencyLevel: efficiency >= 80 ? 'excellent' : efficiency >= 60 ? 'good' : efficiency >= 40 ? 'average' : 'poor',
              completionNotes: notes,
              actualDuration,
              startVerificationTimeout: taskStartTimeouts[efficiencyModalTask.id],
              completionTimeout: taskFinishTimeouts[efficiencyModalTask.id],
            });

            if (task) {
              const matchedGoals = getMatchedGoalsForTask(task);
              const baseDraft = createContributionDraft(task, matchedGoals);
              setGoalContributionDrafts((prev) => ({
                ...prev,
                [task.id]: {
                  ...(prev[task.id] || baseDraft),
                  durationMinutes: prev[task.id]?.durationMinutes || String(actualDuration),
                  note: prev[task.id]?.note || notes || baseDraft.note,
                },
              }));
              setGoalContributionTaskId(task.id);
            }

            setEfficiencyModalOpen(false);
            setEfficiencyModalTask(null);
          }}
          taskTitle={efficiencyModalTask.title}
          plannedImageCount={efficiencyModalTask.plannedImageCount}
          actualImageCount={efficiencyModalTask.actualImageCount}
          isDark={isDark}
          accentColor={accentColor}
          goldReward={efficiencyModalTask.goldReward || 0}
          forceMandatoryReflection={!!efficiencyModalTask.forceMandatoryReflection}
        />
      )}
      
      {/* 编辑任务模态框 */}
      {editingTask && (() => {
        const task = allTasks.find(t => t.id === editingTask);
        if (!task) return null;
        
        return (
          <CompactTaskEditModal
            task={task}
            onClose={() => {
              const currentTask = allTasks.find((item) => item.id === editingTask);
              if (isMandatoryReflectionPending(currentTask)) {
                alert('该任务已触发强制追责表单，提交前不能直接关闭。');
                openMandatoryReflection(editingTask, currentTask?.mandatoryReflection?.trigger || 'low_efficiency');
                return;
              }
              setEditingTask(null);
            }}
            onSave={(updates) => {
              onTaskUpdate(editingTask, updates);
              setEditingTask(null);
            }}
            onDelete={(taskId) => {
              const currentTask = allTasks.find((item) => item.id === taskId);
              if (isMandatoryReflectionPending(currentTask)) {
                alert('该任务已触发强制追责表单，提交前禁止删除任务。');
                openMandatoryReflection(taskId, currentTask?.mandatoryReflection?.trigger || 'low_efficiency');
                return;
              }
              if (onTaskDelete) {
                onTaskDelete(taskId);
              }
              setEditingTask(null);
            }}
          />
        );
      })()}
      
      {/* 任务重复设置对话框 */}
      {recurrenceDialogTask && (
        <TaskRecurrenceDialog
          taskTitle={recurrenceDialogTask.title}
          currentRule={recurrenceDialogTask.recurrenceRule}
          onSave={handleSaveRecurrenceRule}
          onMoveToTomorrow={handleMoveToTomorrow}
          onCopyTask={handleCopyTask}
          onClose={() => setRecurrenceDialogTask(null)}
          isDark={isDark}
        />
      )}
      
      {/* 🔧 新增：间隔任务创建对话框 */}
      {creatingGapTask && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCreatingGapTask(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>
              添加任务到间隔时间
            </h3>
            
            <div className="space-y-4">
              {/* 时间范围提示 */}
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: accentColor 
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">可用时间段</span>
                </div>
                <div>
                  {creatingGapTask.startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {creatingGapTask.endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  （最多 {creatingGapTask.maxDuration} 分钟）
                </div>
              </div>
              
              {/* 任务标题输入 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                  任务标题
                </label>
                <input
                  type="text"
                  id="gap-task-title"
                  placeholder="例如：打扫卫生"
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-pink-500"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                    borderColor: borderColor,
                    color: textColor 
                  }}
                  autoFocus
                />
              </div>
              
              {/* 持续时间输入 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                  持续时间（分钟）
                </label>
                <input
                  type="number"
                  id="gap-task-duration"
                  placeholder="30"
                  min="1"
                  max={creatingGapTask.maxDuration}
                  defaultValue={creatingGapTask.maxDuration}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-pink-500"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                    borderColor: borderColor,
                    color: textColor 
                  }}
                />
              </div>
              
              {/* 按钮组 */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCreatingGapTask(null)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: accentColor 
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const titleInput = document.getElementById('gap-task-title') as HTMLInputElement;
                    const durationInput = document.getElementById('gap-task-duration') as HTMLInputElement;
                    
                    const title = titleInput?.value.trim() || '新任务';
                    const duration = Math.min(
                      parseInt(durationInput?.value) || creatingGapTask.maxDuration,
                      creatingGapTask.maxDuration
                    );
                    
                    // 创建任务
                    const startTime = new Date(creatingGapTask.startTime);
                    const endTime = new Date(startTime.getTime() + duration * 60000);
                    
                    onTaskCreate({
                      title,
                      scheduledStart: startTime.toISOString(),
                      scheduledEnd: endTime.toISOString(),
                      durationMinutes: duration,
                      taskType: 'work',
                      status: 'pending' as const,
                      tags: ['间隔补录记录'],
                    });
                    
                    setCreatingGapTask(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-bold transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: '#C85A7C',
                    color: 'white' 
                  }}
                >
                  确定添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



