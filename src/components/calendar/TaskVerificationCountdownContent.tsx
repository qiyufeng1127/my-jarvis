import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGoldStore } from '@/stores/goldStore';
import { ImageUploader } from '@/services/taskVerificationService';
import { notificationService } from '@/services/notificationService';
import { backgroundTaskScheduler } from '@/services/backgroundTaskScheduler';
import VerificationFeedback, { VerificationLog } from '@/components/shared/VerificationFeedback';
import TaskCompletionCelebration from '@/components/shared/TaskCompletionCelebration';
import { fixImageOrientation } from '@/utils/imageOrientation';

interface TaskVerificationCountdownContentProps {
  taskId: string;
  taskTitle: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  goldReward?: number;
  hasVerification: boolean;
  startKeywords?: string[];
  completeKeywords?: string[];
  onStart?: (actualStartTime: Date, calculatedEndTime: Date) => void;
  onComplete?: (actualEndTime: Date) => void;
  onTimeoutUpdate?: (startTimeoutCount: number, completeTimeoutCount: number, persistentDelayMarks: number) => void;
}

// 倒计时状态：等待启动 -> 启动倒计时(2分钟) -> 上传验证中 -> 完成倒计时(任务总时长) -> 已完成
type CountdownStatus = 'waiting_start' | 'start_countdown' | 'uploading_start' | 'task_countdown' | 'uploading_complete' | 'completed';

// 持久化状态接口
interface CountdownState {
  status: CountdownStatus;
  startDeadline: string | null; // 启动倒计时截止时间（时间戳）
  taskDeadline: string | null; // 任务倒计时截止时间（时间戳）
  startTimeoutCount: number; // 启动超时次数
  completeTimeoutCount: number; // 完成超时次数
  actualStartTime: string | null; // 实际启动时间
  scheduledStart: string; // 绑定的计划开始时间
  scheduledEnd: string; // 绑定的计划结束时间
}

const createInitialState = (scheduledStart: Date, scheduledEnd: Date): CountdownState => ({
  status: 'waiting_start',
  startDeadline: null,
  taskDeadline: null,
  startTimeoutCount: 0,
  completeTimeoutCount: 0,
  actualStartTime: null,
  scheduledStart: scheduledStart.toISOString(),
  scheduledEnd: scheduledEnd.toISOString(),
});

export default function TaskVerificationCountdownContent({
  taskId,
  taskTitle,
  scheduledStart,
  scheduledEnd,
  goldReward = 0,
  hasVerification,
  startKeywords = [],
  completeKeywords = [],
  onStart,
  onComplete,
  onTimeoutUpdate,
}: TaskVerificationCountdownContentProps) {
  const { penaltyGold, addGold } = useGoldStore();
  const buildTransactionKey = useCallback(
    (type: string, uniquePart: string) => `${taskId}:${type}:${uniquePart}`,
    [taskId]
  );
  const timeoutUpdateRef = useRef(onTimeoutUpdate);
  const persistentDelayMarksRef = useRef(0);
  const lastHandledTimeoutRef = useRef<{ startDeadline: string | null; taskDeadline: string | null }>({
    startDeadline: null,
    taskDeadline: null,
  });
  const scheduleTaskRef = useRef((task: Parameters<typeof backgroundTaskScheduler.scheduleTask>[0]) =>
    backgroundTaskScheduler.scheduleTask(task)
  );
  const updateTaskStatusRef = useRef((
    taskId: string,
    status: Parameters<typeof backgroundTaskScheduler.updateTaskStatus>[1],
    data?: Parameters<typeof backgroundTaskScheduler.updateTaskStatus>[2]
  ) => backgroundTaskScheduler.updateTaskStatus(taskId, status, data));
  const taskMetaRef = useRef({
    taskId,
    taskTitle,
    goldReward,
    hasVerification,
    startKeywords,
    completeKeywords,
    scheduledStartIso: scheduledStart.toISOString(),
    scheduledEndIso: scheduledEnd.toISOString(),
  });

  useEffect(() => {
    timeoutUpdateRef.current = onTimeoutUpdate;
  }, [onTimeoutUpdate]);

  useEffect(() => {
    taskMetaRef.current = {
      taskId,
      taskTitle,
      goldReward,
      hasVerification,
      startKeywords,
      completeKeywords,
      scheduledStartIso: scheduledStart.toISOString(),
      scheduledEndIso: scheduledEnd.toISOString(),
    };
  }, [taskId, taskTitle, goldReward, hasVerification, startKeywords, completeKeywords, scheduledStart, scheduledEnd]);
  
  // 持久化key
  const storageKey = `countdown_${taskId}`;
  const delayMarksStorageKey = `delay_marks_${taskId}`;
  const readStoredDelayMarks = useCallback(() => {
    try {
      const savedMarks = Number(localStorage.getItem(delayMarksStorageKey) || '0');
      return Number.isFinite(savedMarks) ? savedMarks : 0;
    } catch (error) {
      console.error('❌ 读取拖延警告失败:', error);
      return 0;
    }
  }, [delayMarksStorageKey]);
  
  // 从localStorage加载状态
  const loadState = useCallback((): CountdownState | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved) as Partial<CountdownState>;
        const currentScheduledStart = scheduledStart.toISOString();
        const currentScheduledEnd = scheduledEnd.toISOString();

        if (
          state.scheduledStart !== currentScheduledStart ||
          state.scheduledEnd !== currentScheduledEnd
        ) {
          console.log(`🔄 检测到任务时间已变更，重置倒计时状态: ${taskTitle}`);
          return null;
        }

        const normalizedState: CountdownState = {
          status: state.status || 'waiting_start',
          startDeadline: state.startDeadline || null,
          taskDeadline: state.taskDeadline || null,
          startTimeoutCount: state.startTimeoutCount || 0,
          completeTimeoutCount: state.completeTimeoutCount || 0,
          actualStartTime: state.actualStartTime || null,
          scheduledStart: currentScheduledStart,
          scheduledEnd: currentScheduledEnd,
        };

        console.log(`📦 加载倒计时状态: ${taskTitle}`, normalizedState);
        return normalizedState;
      }
    } catch (error) {
      console.error('❌ 加载倒计时状态失败:', error);
    }
    return null;
  }, [storageKey, taskTitle, scheduledStart, scheduledEnd]);
  
  // 保存状态到localStorage
  const saveState = useCallback((state: CountdownState) => {
    try {
      const normalizedState: CountdownState = {
        ...state,
        scheduledStart: state.scheduledStart || scheduledStart.toISOString(),
        scheduledEnd: state.scheduledEnd || scheduledEnd.toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(normalizedState));
      console.log(`💾 保存倒计时状态: ${taskTitle}`, normalizedState);
      
      // 通知父组件超时次数更新
      timeoutUpdateRef.current?.(normalizedState.startTimeoutCount, normalizedState.completeTimeoutCount, persistentDelayMarksRef.current);
    } catch (error) {
      console.error('❌ 保存倒计时状态失败:', error);
    }
  }, [storageKey, taskTitle, scheduledStart, scheduledEnd]);
  
  // 初始化状态
  const initState = useCallback((): CountdownState => {
    // 从 localStorage 加载
    const saved = loadState();
    if (saved) {
      console.log(`📦 从 localStorage 加载状态: ${taskTitle}`, saved);
      return saved;
    }
    
    // 默认状态
    return createInitialState(scheduledStart, scheduledEnd);
  }, [loadState, taskTitle, scheduledStart, scheduledEnd]);
  
  const [state, setState] = useState<CountdownState>(initState);
  const [persistentDelayMarks, setPersistentDelayMarks] = useState(() => readStoredDelayMarks());
  const [snowPhase, setSnowPhase] = useState(0);

  useEffect(() => {
    const nextMarks = readStoredDelayMarks();
    persistentDelayMarksRef.current = nextMarks;
    setPersistentDelayMarks(nextMarks);
    timeoutUpdateRef.current?.(state.startTimeoutCount, state.completeTimeoutCount, nextMarks);
  }, [readStoredDelayMarks, state.startTimeoutCount, state.completeTimeoutCount]);

  const addPersistentDelayMark = useCallback(() => {
    setPersistentDelayMarks(prev => {
      const next = prev + 1;
      persistentDelayMarksRef.current = next;
      try {
        localStorage.setItem(delayMarksStorageKey, String(next));
      } catch (error) {
        console.error('❌ 保存拖延警告失败:', error);
      }
      timeoutUpdateRef.current?.(state.startTimeoutCount, state.completeTimeoutCount, next);
      return next;
    });
  }, [delayMarksStorageKey, state.startTimeoutCount, state.completeTimeoutCount]);

  useEffect(() => {
    lastHandledTimeoutRef.current = {
      startDeadline: null,
      taskDeadline: null,
    };
  }, [taskId, scheduledStart, scheduledEnd]);

  useEffect(() => {
    const nextState = initState();
    const currentScheduledStart = scheduledStart.toISOString();
    const currentScheduledEnd = scheduledEnd.toISOString();
    const shouldReset =
      state.scheduledStart !== currentScheduledStart ||
      state.scheduledEnd !== currentScheduledEnd;

    if (!shouldReset) {
      return;
    }

    setState(nextState);
    saveState(nextState);
    setHasTriggeredBackgroundPenalty(false);
    setTriggeredReminders(new Set());
  }, [initState, saveState, scheduledStart, scheduledEnd, state.scheduledStart, state.scheduledEnd]);
  const [isUploading, setIsUploading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const [showBadHabitHistory, setShowBadHabitHistory] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationGold, setCelebrationGold] = useState(0);
  
  // 🔧 记录已触发的提醒，避免重复触发
  const [triggeredReminders, setTriggeredReminders] = useState<Set<string>>(new Set());
  
  // 🔧 记录是否已经触发过后台拖延扣币（避免重复扣币）
  const [hasTriggeredBackgroundPenalty, setHasTriggeredBackgroundPenalty] = useState(false);
  
  // 🔧 分步日志显示（直接在界面上显示）
  const [verifyLog, setVerifyLog] = useState<string>('正在验证中，请稍后...');
  const [showDetailedLog, setShowDetailedLog] = useState(false);
  const [detailedLogs, setDetailedLogs] = useState<string[]>([]);
  
  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDetailedLogs(prev => [...prev, logMessage]);
    setVerifyLog(message); // 更新主日志显示
  }, []);
  
  // 清空日志
  const clearLogs = useCallback(() => {
    setDetailedLogs([]);
    setVerifyLog('正在验证中，请稍后...');
  }, []);
  
  // 实时计算剩余时间（基于截止时间）- 使用时间戳确保后台运行
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnowPhase(prev => (prev + 1) % 1000);
    }, 1600);

    return () => window.clearInterval(timer);
  }, []);
  
  const startCountdownLeft = state.startDeadline 
    ? Math.max(0, Math.floor((new Date(state.startDeadline).getTime() - currentTime) / 1000))
    : 120;
    
  const taskCountdownLeft = state.taskDeadline
    ? Math.max(0, Math.floor((new Date(state.taskDeadline).getTime() - currentTime) / 1000))
    : 0;

  const getVisibleSnowLevel = () => {
    const persistentBase = persistentDelayMarks * 18;
    const timeoutBase = state.startTimeoutCount * 8 + state.completeTimeoutCount * 10;

    if (state.status === 'start_countdown' && state.startDeadline) {
      const total = 120;
      const elapsed = total - startCountdownLeft;
      return Math.min(82, persistentBase + timeoutBase + (elapsed / total) * 26);
    }

    if (state.status === 'task_countdown' && state.taskDeadline) {
      const total = Math.max(1, Math.floor((new Date(state.taskDeadline).getTime() - new Date(state.actualStartTime || scheduledStart).getTime()) / 1000));
      const elapsed = Math.max(0, total - taskCountdownLeft);
      return Math.min(82, Math.max(persistentBase + timeoutBase, persistentBase + (elapsed / total) * 14));
    }

    return Math.min(82, persistentBase + timeoutBase);
  };

  const visibleSnowLevel = getVisibleSnowLevel();
  const snowBobOffset = (snowPhase % 2 === 0 ? 0 : 2);

  // 🔧 注册任务到后台调度服务
  useEffect(() => {
    console.log(`📋 [组件] 注册任务到后台调度服务: ${taskTitle}`);
    scheduleTaskRef.current({
      taskId,
      taskTitle,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      goldReward,
      hasVerification,
      startKeywords,
      completeKeywords,
    });

    return () => {
      // 组件卸载时不取消调度，让后台继续运行
      console.log(`🧹 [组件] 任务组件卸载，但保持后台调度: ${taskTitle}`);
    };
  }, [taskId]);

  // 🔧 监听任务时间变化，清除过期的提醒记录
  useEffect(() => {
    // 当任务的开始或结束时间发生变化时，清空已触发的提醒记录
    setTriggeredReminders(new Set());
    console.log(`🔄 任务时间已更新，清空提醒记录: ${taskTitle}`);
  }, [scheduledStart.getTime(), scheduledEnd.getTime(), taskTitle]);

  // 检查是否到达预设开始时间，自动触发启动倒计时（支持后台计算拖延）
  useEffect(() => {
    const now = new Date();
    const start = new Date(scheduledStart);
    const hasExistingStartFlow = state.status === 'start_countdown' || state.status === 'uploading_start' || state.status === 'task_countdown' || state.status === 'uploading_complete' || state.status === 'completed';
    
    // 如果当前时间 >= 预设开始时间，且状态为等待启动，则触发启动倒计时
    if (now >= start && state.status === 'waiting_start' && !hasTriggeredBackgroundPenalty && !hasExistingStartFlow) {
      console.log(`⏰ 任务到达预设时间，触发启动倒计时: ${taskTitle}`);
      
      // 🔧 标记已触发，避免重复扣币
      setHasTriggeredBackgroundPenalty(true);
      
      // 🔧 计算已经拖延了多少次（每2分钟算一次拖延）
      const delayMs = now.getTime() - start.getTime();
      const delayMinutes = Math.floor(delayMs / 60000);
      const missedTimeouts = Math.floor(delayMinutes / 2); // 每2分钟一次超时
      
      if (missedTimeouts > 0) {
        console.log(`⚠️ 检测到后台拖延：已错过 ${missedTimeouts} 次启动机会（延迟${delayMinutes}分钟）`);
        
        // 扣除所有错过的金币
        const penaltyPerTimeout = Math.floor(goldReward * 0.2);
        const totalPenalty = penaltyPerTimeout * missedTimeouts;
        penaltyGold(
          totalPenalty,
          `启动拖延（后台累计${missedTimeouts}次）`,
          taskId,
          taskTitle,
          buildTransactionKey('background-start-delay', `${start.toISOString()}:${missedTimeouts}`)
        );
        
        // 触发拖延提醒
        notificationService.notifyProcrastination(taskTitle, missedTimeouts);
        
        // 🔧 额外的语音播报（确保用户听到）
        setTimeout(() => {
          notificationService.speak(`警告！${taskTitle}已拖延${missedTimeouts}次，扣除${totalPenalty}金币`);
        }, 500);
      } else {
        // 没有拖延，播报任务开始
        notificationService.speak(`${taskTitle}已到达开始时间，请尽快启动任务`);
      }
      
      // 计算当前倒计时周期的剩余时间
      const currentCycleElapsed = delayMinutes % 2; // 当前2分钟周期已过去的时间
      const remainingSeconds = (2 - currentCycleElapsed) * 60;
      const deadline = new Date(now.getTime() + remainingSeconds * 1000);
      
      const newState = {
        ...state,
        status: 'start_countdown' as CountdownStatus,
        startDeadline: deadline.toISOString(),
        startTimeoutCount: missedTimeouts, // 记录已拖延次数
      };
      setState(newState);
      saveState(newState);
      
      // 🔧 同步到后台调度服务
      updateTaskStatusRef.current(taskMetaRef.current.taskId, 'start_countdown', {
        startDeadline: deadline.toISOString(),
        startTimeoutCount: missedTimeouts,
      });
      
      console.log(`📊 启动倒计时状态：已拖延${missedTimeouts}次，当前周期剩余${remainingSeconds}秒`);
    }
  }, [scheduledStart.getTime(), state.status, taskTitle, hasTriggeredBackgroundPenalty, goldReward, penaltyGold, taskId]);
  
  // 每秒更新当前时间，用于实时计算剩余时间（使用requestAnimationFrame确保后台运行）
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();
    
    const updateTime = () => {
      const now = Date.now();
      // 即使页面在后台，也要更新时间（基于实际时间戳）
      if (now - lastUpdate >= 1000) {
        setCurrentTime(now);
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };
    
    animationFrameId = requestAnimationFrame(updateTime);
    
    // 额外添加一个定时器作为后备，确保后台也能更新
    const backupTimer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(backupTimer);
    };
  }, []);
  
  // 检查超时并处理
  useEffect(() => {
    // 只在启动倒计时或任务倒计时阶段检查
    if (state.status !== 'start_countdown' && state.status !== 'task_countdown') {
      return;
    }
    
    // 启动倒计时超时
    if (state.status === 'start_countdown' && startCountdownLeft === 0 && state.startDeadline) {
      if (lastHandledTimeoutRef.current.startDeadline === state.startDeadline) {
        return;
      }

      lastHandledTimeoutRef.current = {
        ...lastHandledTimeoutRef.current,
        startDeadline: state.startDeadline,
      };
      
      const penaltyAmount = Math.floor(goldReward * 0.2);
      penaltyGold(
        penaltyAmount,
        `启动超时（第${state.startTimeoutCount + 1}次）`,
        taskId,
        taskTitle,
        buildTransactionKey('start-timeout', state.startDeadline)
      );
      console.log(`⚠️ 启动超时！扣除${penaltyAmount}金币（${state.startTimeoutCount + 1}次）`);
      
      // 触发超时提醒
      notificationService.notifyOvertime(taskTitle, 'start', (state.startTimeoutCount + 1) * 20);
      
      // 触发拖延提醒
      notificationService.notifyProcrastination(taskTitle, state.startTimeoutCount + 1);
      
      const newDeadline = new Date(Date.now() + 2 * 60 * 1000); // 重置为2分钟
      const newState = {
        ...state,
        startTimeoutCount: state.startTimeoutCount + 1,
        startDeadline: newDeadline.toISOString(),
      };
      setState(newState);
      saveState(newState);
      
      // 🔧 同步到后台调度服务
      backgroundTaskScheduler.updateTaskStatus(taskId, 'start_countdown', {
        startDeadline: newDeadline.toISOString(),
        startTimeoutCount: newState.startTimeoutCount,
      });
    }
    
    // 任务倒计时超时
    if (state.status === 'task_countdown' && taskCountdownLeft === 0 && state.taskDeadline) {
      if (lastHandledTimeoutRef.current.taskDeadline === state.taskDeadline) {
        return;
      }

      lastHandledTimeoutRef.current = {
        ...lastHandledTimeoutRef.current,
        taskDeadline: state.taskDeadline,
      };
      
      const penaltyAmount = Math.floor(goldReward * 0.2);
      penaltyGold(
        penaltyAmount,
        `完成超时（第${state.completeTimeoutCount + 1}次）`,
        taskId,
        taskTitle,
        buildTransactionKey('complete-timeout', state.taskDeadline)
      );
      console.log(`⚠️ 完成超时！扣除${penaltyAmount}金币（${state.completeTimeoutCount + 1}次）`);
      
      // 触发超时提醒
      notificationService.notifyOvertime(taskTitle, 'completion', (state.completeTimeoutCount + 1) * 20);
      
      // 触发拖延提醒
      notificationService.notifyProcrastination(taskTitle, state.completeTimeoutCount + 1);
      
      const newDeadline = new Date(Date.now() + 10 * 60 * 1000); // 重置为10分钟
      const newState = {
        ...state,
        completeTimeoutCount: state.completeTimeoutCount + 1,
        taskDeadline: newDeadline.toISOString(),
      };
      setState(newState);
      saveState(newState);
      
      // 🔧 同步到后台调度服务
      updateTaskStatusRef.current(taskMetaRef.current.taskId, 'task_countdown', {
        taskDeadline: newDeadline.toISOString(),
        completeTimeoutCount: newState.completeTimeoutCount,
      });
    }
  }, [state, startCountdownLeft, taskCountdownLeft, goldReward, penaltyGold, taskId, taskTitle, saveState]);
  
  // 任务即将结束提醒（完全遵循用户设置）
  useEffect(() => {
    if (state.status !== 'task_countdown') {
      return;
    }
    
    // 从 localStorage 读取用户设置
    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) {
      return;
    }
    
    try {
      const settings = JSON.parse(settingsStr);
      
      // 检查是否开启了任务结束前提醒
      if (!settings.taskEndBeforeReminder) {
        console.log('⏭️ 任务结束前提醒已关闭（用户设置）');
        return;
      }
      
      // 获取用户设置的提醒时间（分钟）
      const reminderMinutes = settings.taskEndBeforeMinutes || 5;
      
      // 🔧 只在用户设置的时间点提醒（转换为秒），并且只触发一次
      // 🔧 使用范围匹配（±2秒），避免因为时间更新延迟错过提醒
      const targetSeconds = reminderMinutes * 60;
      const isInRange = taskCountdownLeft >= targetSeconds - 2 && taskCountdownLeft <= targetSeconds + 2;
      
      if (isInRange) {
        const reminderKey = `task-end-before-${taskId}-${reminderMinutes}`;
        if (!triggeredReminders.has(reminderKey)) {
          console.log(`⏰ [useEffect] 任务即将结束（${reminderMinutes}分钟）- 遵循用户设置: ${taskTitle}`);
          console.log(`⏰ [useEffect] 当前倒计时: ${taskCountdownLeft}秒，目标: ${targetSeconds}秒`);
          notificationService.notifyTaskEnding(taskTitle, reminderMinutes, hasVerification);
          setTriggeredReminders(prev => new Set(prev).add(reminderKey));
        }
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }
  }, [state.status, taskCountdownLeft, taskTitle, hasVerification, taskId, triggeredReminders]);

  // 🔧 新增：任务开始前提醒（使用定时器精确触发）
  useEffect(() => {
    if (state.status !== 'waiting_start') {
      return;
    }

    const settingsStr = localStorage.getItem('notification_settings');
    if (!settingsStr) {
      return;
    }

    try {
      const settings = JSON.parse(settingsStr);
      
      if (!settings.taskStartBeforeReminder) {
        return;
      }

      const reminderMinutes = settings.taskStartBeforeMinutes || 2;
      const now = new Date();
      const start = new Date(scheduledStart);
      const msUntilStart = start.getTime() - now.getTime();
      const msUntilReminder = msUntilStart - (reminderMinutes * 60 * 1000);

      // 如果提醒时间还没到，设置定时器
      if (msUntilReminder > 0 && msUntilReminder < 24 * 60 * 60 * 1000) { // 24小时内
        const reminderKey = `task-start-before-${taskId}-${reminderMinutes}`;
        
        if (!triggeredReminders.has(reminderKey)) {
          console.log(`⏰ 设置任务开始前提醒定时器: ${taskTitle}, 将在${Math.round(msUntilReminder / 1000)}秒后触发`);
          
          const timerId = setTimeout(() => {
            console.log(`⏰ 任务开始前提醒（${reminderMinutes}分钟）: ${taskTitle}`);
            notificationService.notifyTaskStartBefore(taskTitle, reminderMinutes, hasVerification);
            setTriggeredReminders(prev => new Set(prev).add(reminderKey));
          }, msUntilReminder);

          return () => clearTimeout(timerId);
        }
      }
      // 如果已经过了提醒时间但还没到开始时间，立即提醒一次
      else if (msUntilReminder <= 0 && msUntilStart > 0) {
        const reminderKey = `task-start-before-${taskId}-${reminderMinutes}`;
        if (!triggeredReminders.has(reminderKey)) {
          console.log(`⏰ 任务开始前提醒（立即触发）: ${taskTitle}`);
          notificationService.notifyTaskStartBefore(taskTitle, reminderMinutes, hasVerification);
          setTriggeredReminders(prev => new Set(prev).add(reminderKey));
        }
      }
    } catch (error) {
      console.error('读取通知设置失败:', error);
    }
  }, [state.status, scheduledStart, taskTitle, hasVerification, taskId, triggeredReminders]);

  // 已移除旧的紧急验证提醒
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'start' | 'complete' | null>(null);
  const continueTimeoutRef = useRef<number | null>(null);

  const clearContinueTimeout = useCallback(() => {
    if (continueTimeoutRef.current) {
      window.clearTimeout(continueTimeoutRef.current);
      continueTimeoutRef.current = null;
    }
  }, []);

  const schedulePersistentDelayWarning = useCallback(() => {
    clearContinueTimeout();
    continueTimeoutRef.current = window.setTimeout(() => {
      console.log(`❌ 超过30分钟未继续，记录红叉警告: ${taskTitle}`);
      addPersistentDelayMark();
    }, 30 * 60 * 1000);
  }, [addPersistentDelayMark, clearContinueTimeout, taskTitle]);

  useEffect(() => {
    const isWaitingForContinue = state.status === 'start_countdown' || state.status === 'task_countdown';

    if (isWaitingForContinue) {
      schedulePersistentDelayWarning();
    } else {
      clearContinueTimeout();
    }

    return () => {
      clearContinueTimeout();
    };
  }, [state.status, schedulePersistentDelayWarning, clearContinueTimeout]);

  // 启动任务（无验证直接启动，有验证需上传照片）
  const handleStartTask = useCallback(async (useCamera: boolean = false) => {
    if (!hasVerification) {
      // 无验证：直接启动任务
      const now = new Date();
      const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
      const taskSeconds = duration * 60;
      
      // 关键修复：只有在计划开始时间已到，且当前处于启动倒计时阶段，才算“按时启动”
      // 提前开始不应被归入启动倒计时窗口，更不能被视作拖延或超时
      const scheduledStartTime = new Date(scheduledStart);
      const hasReachedScheduledStart = now.getTime() >= scheduledStartTime.getTime();
      const isWithinStartWindow = hasReachedScheduledStart && state.status === 'start_countdown';
      
      if (isWithinStartWindow) {
        // 2分钟内完成启动，奖励50%金币
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(
          bonusGold,
          `按时启动任务（奖励50%）`,
          taskId,
          taskTitle,
          buildTransactionKey('start-on-time-no-verification', now.toISOString())
        );
        console.log(`✅ 按时启动任务，获得${bonusGold}金币奖励`);
      } else {
        // 提前启动或普通启动，无拖延惩罚
        console.log(`✅ 提前启动/正常启动任务: ${taskTitle}`);
      }
      
      const newState = {
        ...state,
        status: 'task_countdown' as CountdownStatus,
        taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
        actualStartTime: now.toISOString(),
        scheduledStart: state.scheduledStart || scheduledStart.toISOString(),
        scheduledEnd: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
      };
      clearContinueTimeout();
      setState(newState);
      saveState(newState);
      
      // 🔧 同步到后台调度服务
      backgroundTaskScheduler.updateTaskStatus(taskId, 'task_countdown', {
        taskDeadline: newState.taskDeadline,
        actualStartTime: newState.actualStartTime,
      });
      
      // 通知父组件更新开始时间和结束时间（从当前时间开始计算）
      if (onStart) {
        const calculatedEndTime = new Date(now.getTime() + duration * 60000);
        onStart(now, calculatedEndTime);
        console.log(`📅 任务时间已更新: 开始=${now.toLocaleString('zh-CN')}, 结束=${calculatedEndTime.toLocaleString('zh-CN')}`);
      }
      
      console.log(`✅ 启动任务成功: ${taskTitle}，任务时长${duration}分钟`);
      return;
    }
    
    // 有验证：拍摄/上传照片
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.capture = 'environment' as any; // 直接打开相机
    }
    
    // 处理用户点击叉叉取消上传
    input.oncancel = () => {
      console.log('❌ 用户取消拍摄/上传');
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件');
        return;
      }
      
      // 🔧 将图片转换为 base64 并显示预览
      const reader = new FileReader();
      reader.onload = () => {
        const imageBase64 = reader.result as string;
        setPreviewImage(imageBase64);
        setPreviewType('start');
        console.log('📷 照片已拍摄，等待用户确认提交');
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  }, [hasVerification, scheduledStart, scheduledEnd, goldReward, addGold, taskId, taskTitle, onStart, state]);

  // 🔧 新增：确认提交照片（复用上传照片的验证逻辑）
  const handleConfirmSubmit = useCallback(async () => {
    if (!previewImage || !previewType) return;
    
    const isStartVerification = previewType === 'start';
    const keywords = isStartVerification ? startKeywords : completeKeywords;
    
    // 进入验证状态
    const newState = { 
      ...state, 
      status: (isStartVerification ? 'uploading_start' : 'uploading_complete') as CountdownStatus 
    };
    setState(newState);
    saveState(newState);
    setIsUploading(true);
    setVerificationMessage('');
    setVerificationSuccess(null);
    
    try {
      clearLogs();
      addLog('📷 开始验证流程');
      
      // 检查百度API配置
      const apiKey = localStorage.getItem('baidu_api_key');
      const secretKey = localStorage.getItem('baidu_secret_key');
      
      if (!apiKey || !secretKey) {
        throw new Error('百度API未配置');
      }
      
      addLog('✅ API配置检查通过');
      addLog('📋 目标关键词: ' + keywords.join('、'));
      
      // 调用 Vercel Serverless API 验证
      addLog('🔗 正在连接百度AI服务器...');
      
      const requestBody = {
        image: previewImage,
        keywords: keywords,
        apiKey: apiKey,
        secretKey: secretKey,
      };
      
      addLog('📡 正在发送验证请求...');
      const startTime = Date.now();
      
      const response = await fetch('/api/baidu-image-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const endTime = Date.now();
      addLog(`⏱️ 请求耗时: ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ API请求失败: ${response.status}`);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }
      
      const verifyResult = await response.json();
      addLog('✅ 收到API响应');
      
      // 显示识别结果
      if (verifyResult.recognizedObjects && verifyResult.recognizedObjects.length > 0) {
        addLog('🔍 已识别: ' + verifyResult.recognizedObjects.join('、'));
      } else {
        addLog('⚠️ 未识别到任何内容');
      }
      
      // 显示匹配结果
      if (verifyResult.matchedKeywords && verifyResult.matchedKeywords.length > 0) {
        addLog('✅ 匹配到: ' + verifyResult.matchedKeywords.join('、'));
      } else {
        addLog('❌ 未匹配到关键词');
      }
      
      // 判断验证结果
      if (!verifyResult.success) {
        // 验证失败
        addLog('❌ 验证失败: ' + (verifyResult.message || '未匹配到关键词'));
        
        const penaltyAmount = Math.floor(goldReward * 0.2);
        penaltyGold(
          penaltyAmount,
          `${isStartVerification ? '启动' : '完成'}验证失败`,
          taskId,
          taskTitle,
          buildTransactionKey(
            isStartVerification ? 'start-verify-fail' : 'complete-verify-fail',
            `${state.status}:${state.startTimeoutCount}:${state.completeTimeoutCount}`
          )
        );
        addLog(`💸 扣除${penaltyAmount}金币`);
        
        // 返回倒计时
        if (isStartVerification) {
          const newDeadline = new Date(Date.now() + 2 * 60 * 1000);
          const newState = {
            ...state,
            status: 'start_countdown' as CountdownStatus,
            startDeadline: newDeadline.toISOString(),
            startTimeoutCount: state.startTimeoutCount + 1,
          };
          setState(newState);
          saveState(newState);
        } else {
          const newDeadline = new Date(Date.now() + 10 * 60 * 1000);
          const newState = {
            ...state,
            status: 'task_countdown' as CountdownStatus,
            taskDeadline: newDeadline.toISOString(),
            completeTimeoutCount: state.completeTimeoutCount + 1,
          };
          setState(newState);
          saveState(newState);
        }
        
        setIsUploading(false);
        setPreviewImage(null);
        setPreviewType(null);
        
        // 5秒后清除日志
        setTimeout(() => clearLogs(), 5000);
        return;
      }
      
      // 验证成功
      addLog('🎉 验证成功！');
      const now = new Date();
      
      if (isStartVerification) {
        // 启动验证成功
        const duration = Math.floor((new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000);
        const taskSeconds = duration * 60;
        
        // 奖励金币
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(
          bonusGold,
          `按时启动任务`,
          taskId,
          taskTitle,
          buildTransactionKey('start-bonus', now.toISOString())
        );
        addLog(`💰 获得${bonusGold}金币`);
        
        // 进入任务倒计时
        setTimeout(() => {
          const newState = {
            ...state,
            status: 'task_countdown' as CountdownStatus,
            taskDeadline: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
            actualStartTime: now.toISOString(),
            scheduledStart: state.scheduledStart || scheduledStart.toISOString(),
            scheduledEnd: new Date(now.getTime() + taskSeconds * 1000).toISOString(),
          };
          clearContinueTimeout();
          setState(newState);
          saveState(newState);
          setIsUploading(false);
          setPreviewImage(null);
          setPreviewType(null);
          clearLogs();
          
          // 🔧 同步到后台调度服务
          backgroundTaskScheduler.updateTaskStatus(taskId, 'task_countdown', {
            taskDeadline: newState.taskDeadline,
            actualStartTime: newState.actualStartTime,
          });
          
          if (onStart) {
            const calculatedEndTime = new Date(now.getTime() + duration * 60000);
            onStart(now, calculatedEndTime);
          }
        }, 2000);
      } else {
        // 完成验证成功
        const scheduledEndTime = new Date(scheduledEnd);
        const isEarly = now < scheduledEndTime;
        
        if (isEarly) {
          const bonusGold = Math.floor(goldReward * 0.5);
          addGold(
            bonusGold,
            `提前完成任务`,
            taskId,
            taskTitle,
            buildTransactionKey('early-complete-bonus', now.toISOString())
          );
          addLog(`💰 提前完成，获得${bonusGold}金币`);
          
          // 显示庆祝特效
          setCelebrationGold(bonusGold);
          setShowCelebration(true);
        }
        
        // 扣除超时惩罚金
        const totalPenalty = Math.floor(goldReward * 0.2) * state.completeTimeoutCount;
        if (totalPenalty > 0) {
          addLog(`⚠️ 累计扣除${totalPenalty}金币（${state.completeTimeoutCount}次超时）`);
        }
        
        // 完成任务
        setTimeout(() => {
          const newState = {
            ...state,
            status: 'completed' as CountdownStatus,
          };
          setState(newState);
          saveState(newState);
          setIsUploading(false);
          setPreviewImage(null);
          setPreviewType(null);
          clearLogs();
          
          // 关闭庆祝特效
          setShowCelebration(false);
          
          // 🔧 同步到后台调度服务并取消调度
          backgroundTaskScheduler.updateTaskStatus(taskId, 'completed');
          backgroundTaskScheduler.unscheduleTask(taskId);
          
          // 🔧 通知父组件更新任务，保存超时数据
          if (onComplete) {
            onComplete(now);
          }
          
          // 🔧 通过 onTimeoutUpdate 回调将超时数据传递给父组件
          if (onTimeoutUpdate) {
            onTimeoutUpdate(state.startTimeoutCount, state.completeTimeoutCount, persistentDelayMarks);
          }
          
          localStorage.removeItem(storageKey);
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      addLog('❌ 验证异常: ' + errorMsg);
      
      // 扣除金币
      const penaltyAmount = Math.floor(goldReward * 0.2);
      penaltyGold(
        penaltyAmount,
        `${isStartVerification ? '启动' : '完成'}验证异常`,
        taskId,
        taskTitle,
        buildTransactionKey(
          isStartVerification ? 'start-verify-error' : 'complete-verify-error',
          `${state.status}:${state.startTimeoutCount}:${state.completeTimeoutCount}`
        )
      );
      addLog(`💸 扣除${penaltyAmount}金币`);
      
      // 返回倒计时
      if (isStartVerification) {
        const newDeadline = new Date(Date.now() + 2 * 60 * 1000);
        const newState = {
          ...state,
          status: 'start_countdown' as CountdownStatus,
          startDeadline: newDeadline.toISOString(),
          startTimeoutCount: state.startTimeoutCount + 1,
        };
        setState(newState);
        saveState(newState);
      } else {
        const newDeadline = new Date(Date.now() + 10 * 60 * 1000);
        const newState = {
          ...state,
          status: 'task_countdown' as CountdownStatus,
          taskDeadline: newDeadline.toISOString(),
          completeTimeoutCount: state.completeTimeoutCount + 1,
        };
        setState(newState);
        saveState(newState);
      }
      
      setIsUploading(false);
      setPreviewImage(null);
      setPreviewType(null);
      
      // 5秒后清除日志
      setTimeout(() => clearLogs(), 5000);
    }
  }, [previewImage, previewType, startKeywords, completeKeywords, state, goldReward, taskId, taskTitle, scheduledEnd, onStart, onComplete, storageKey, clearContinueTimeout, persistentDelayMarks]);

  // 🔧 新增：取消预览
  const handleCancelPreview = useCallback(() => {
    setPreviewImage(null);
    setPreviewType(null);
    console.log('❌ 用户取消提交照片');
  }, []);

  // 完成任务（无验证直接完成，有验证需上传照片）
  const handleCompleteTask = useCallback(async (useCamera: boolean = false) => {
    if (!hasVerification) {
      // 无验证：直接完成任务
      const now = new Date();
      
      // 🎯 动态更新完成时间：如果提前完成，使用当前时间作为结束时间
      const scheduledEndTime = new Date(scheduledEnd);
      const isEarly = now < scheduledEndTime;
      
      if (isEarly) {
        const bonusGold = Math.floor(goldReward * 0.5);
        addGold(
          bonusGold,
          `提前完成任务（奖励50%）`,
          taskId,
          taskTitle,
          buildTransactionKey('early-complete-no-verification', now.toISOString())
        );
        console.log(`✅ 提前完成任务，获得${bonusGold}金币奖励`);
        
        // 显示庆祝特效
        setCelebrationGold(bonusGold);
        setShowCelebration(true);
        
        // 🔧 2秒后完成任务（庆祝特效会自己消失）
        setTimeout(() => {
          const newState = {
            ...state,
            status: 'completed' as CountdownStatus,
          };
          setState(newState);
          saveState(newState);
          
          // 🔧 同步到后台调度服务并取消调度
          backgroundTaskScheduler.updateTaskStatus(taskId, 'completed');
          backgroundTaskScheduler.unscheduleTask(taskId);
          
          if (onComplete) {
            onComplete(now);
            console.log(`📅 任务完成时间已更新: ${now.toLocaleString('zh-CN')}`);
          }
          
          localStorage.removeItem(storageKey);
          console.log(`✅ 完成任务: ${taskTitle}`);
        }, 2000);
        
        return;
      }
      
      // 扣除超时惩罚金
      const totalPenalty = Math.floor(goldReward * 0.2) * state.completeTimeoutCount;
      if (totalPenalty > 0) {
        console.log(`⚠️ 累计扣除${totalPenalty}金币（${state.completeTimeoutCount}次超时）`);
      }
      
      // 没有提前完成，直接完成任务（无庆祝特效）
      const newState = {
        ...state,
        status: 'completed' as CountdownStatus,
      };
      clearContinueTimeout();
      setState(newState);
      saveState(newState);
      
      // 🔧 同步到后台调度服务并取消调度
      backgroundTaskScheduler.updateTaskStatus(taskId, 'completed');
      backgroundTaskScheduler.unscheduleTask(taskId);
      
      // 🎯 通知父组件更新结束时间（使用当前时间，实现动态完成）
      if (onComplete) {
        onComplete(now);
        console.log(`📅 任务完成时间已更新: ${now.toLocaleString('zh-CN')}`);
      }
      
      // 清除持久化状态
      localStorage.removeItem(storageKey);
      console.log(`✅ 完成任务: ${taskTitle}`);
      return;
    }
    
    // 有验证：拍摄/上传照片
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.capture = 'environment' as any; // 直接打开相机
    }
    
    // 处理用户点击叉叉取消上传
    input.oncancel = () => {
      console.log('❌ 用户取消拍摄/上传');
    };
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        console.log('❌ 未选择文件');
        return;
      }
      
      // 🔧 将图片转换为 base64 并显示预览
      const reader = new FileReader();
      reader.onload = () => {
        const imageBase64 = reader.result as string;
        setPreviewImage(imageBase64);
        setPreviewType('complete');
        console.log('📷 照片已拍摄，等待用户确认提交');
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  }, [hasVerification, scheduledEnd, goldReward, addGold, state.completeTimeoutCount, taskId, taskTitle, onComplete, storageKey, state]);

  // 格式化倒计时显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🔧 照片预览界面
  if (previewImage && previewType) {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent">
        {/* 预览图片 */}
        <div className="w-full mb-3 rounded-lg overflow-hidden shadow-lg">
          <img 
            src={previewImage} 
            alt="预览" 
            className="w-full h-auto"
          />
        </div>
        
        {/* 提示文字 */}
        <div className="text-xs font-medium mb-2 text-gray-600">
          📷 照片已拍摄，请确认后提交验证
        </div>
        
        {/* 按钮组 */}
        <div className="flex items-center gap-2 w-full">
          <button 
            onClick={handleCancelPreview}
            className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: '#6B7280',
              color: '#ffffff',
            }}
          >
            <span>❌</span>
            <span>取消</span>
          </button>
          <button 
            onClick={handleConfirmSubmit}
            disabled={isUploading}
            className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            {isUploading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>验证中...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>确认提交</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 等待启动状态：显示提前启动按钮
  if (state.status === 'waiting_start') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent">
        {/* 提示文字 */}
        <div className="text-xs font-medium mb-2 text-gray-500">
          任务尚未开始，可以提前启动
        </div>
        
        {/* 提前启动按钮 - 无验证任务 */}
        {!hasVerification && (
          <button 
            onClick={() => handleStartTask()}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
            style={{
              backgroundColor: '#6E7FA6',
              color: '#F8F5EF',
              boxShadow: '0 8px 18px rgba(110,127,166,0.22)',
            }}
          >
            <span>🚀</span>
            <span>提前启动</span>
          </button>
        )}
        
        {/* 提前启动按钮 - 验证任务 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStartTask(true)}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#6E7FA6',
                color: '#F8F5EF',
                boxShadow: '0 8px 18px rgba(110,127,166,0.22)',
              }}
            >
              <span>🚀</span>
              <span>拍照启动</span>
            </button>
            <button 
              onClick={() => handleStartTask(false)}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#A46F5A',
                color: '#F8F5EF',
                boxShadow: '0 8px 18px rgba(164,111,90,0.22)',
              }}
            >
              <span>🔥</span>
              <span>上传启动</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 启动倒计时阶段（2分钟）
  if (state.status === 'start_countdown') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {visibleSnowLevel > 0 && (
          <div className="pointer-events-none absolute inset-x-2 bottom-0 z-0 overflow-hidden rounded-b-2xl">
            <div
              className="relative transition-all duration-1000 ease-out"
              style={{
                height: `${visibleSnowLevel}%`,
                transform: `translateY(${snowBobOffset}px)`,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(246,249,255,0.7) 42%, rgba(230,238,247,0.92) 100%)',
              }}
            >
              <div
                className="absolute inset-x-[-6%] top-[-8px] h-4"
                style={{
                  background: 'radial-gradient(circle at 10% 120%, rgba(255,255,255,0.92) 0 15px, transparent 16px), radial-gradient(circle at 34% 120%, rgba(255,255,255,0.95) 0 18px, transparent 19px), radial-gradient(circle at 58% 120%, rgba(255,255,255,0.9) 0 16px, transparent 17px), radial-gradient(circle at 82% 120%, rgba(255,255,255,0.96) 0 17px, transparent 18px)',
                }}
              />
            </div>
          </div>
        )}
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">🐢</span>
              <span className="text-xs font-bold text-yellow-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-black mb-1 flex items-center gap-1.5 tracking-wide" style={{ color: '#6E7FA6' }}>
          <span>🚀</span>
          <span>立即启动</span>
        </div>
        
        {/* 启动倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(startCountdownLeft)}
        </div>
        
        {/* 超时惩罚提示 */}
        {state.startTimeoutCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-red-500 shadow-lg mb-2">
            <span className="text-sm">⚠️</span>
            <p className="text-white text-xs font-bold">
              已扣除 {Math.floor(goldReward * 0.2) * state.startTimeoutCount} 金币（{state.startTimeoutCount}次超时）
            </p>
          </div>
        )}
        
        {/* 验证关键词提示（醒目样式） */}
        {hasVerification && startKeywords.length > 0 && (
          <div className="mb-2 px-4 py-2 rounded-lg shadow-md" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <p className="text-xs font-semibold text-center" style={{ color: '#92400E' }}>
              📷 请拍摄包含：<span className="font-bold">{startKeywords.join(' / ')}</span> 的照片
            </p>
          </div>
        )}
        
        {/* 启动按钮 - 仅无验证任务显示 */}
        {!hasVerification && (
          <button 
            onClick={handleStartTask}
            disabled={isUploading}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{
              backgroundColor: '#6E7FA6',
              color: '#F8F5EF',
              boxShadow: '0 8px 18px rgba(110,127,166,0.22)',
            }}
          >
            <span>🚀</span>
            <span>启动任务</span>
          </button>
        )}
        
        {/* 上传照片按钮 - 仅验证任务显示 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStartTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#6E7FA6',
                color: '#F8F5EF',
                boxShadow: '0 8px 18px rgba(110,127,166,0.22)',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>拍照启动</span>
                </>
              )}
            </button>
            <button 
              onClick={() => handleStartTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#A46F5A',
                color: '#F8F5EF',
                boxShadow: '0 8px 18px rgba(164,111,90,0.22)',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>🔥</span>
                  <span>上传启动</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 上传启动验证中 - 在卡片内显示
  if (state.status === 'uploading_start') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">🐢</span>
              <span className="text-xs font-bold text-yellow-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏱️</span>
          <span>任务剩余</span>
        </div>
        
        {/* 启动倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(startCountdownLeft)}
        </div>
        
        {/* 🔧 显示正在验证的照片 */}
        {previewImage && (
          <div className="w-full mb-2 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={previewImage} 
              alt="验证中" 
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* 🔧 蓝色日志显示框 */}
        <div className="w-full mb-2 px-4 py-3 rounded-lg shadow-md" 
             style={{ 
               backgroundColor: '#DBEAFE', 
               border: '1px solid #93C5FD',
               maxHeight: '200px',
               overflowY: 'auto'
             }}>
          <div className="flex items-start gap-2">
            <span className="animate-spin text-lg flex-shrink-0">⏳</span>
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ color: '#1E40AF' }}>
                {verifyLog}
              </p>
              {/* 详细日志列表 */}
              {detailedLogs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {detailedLogs.slice(-5).map((log, index) => (
                    <p key={index} className="text-xs" style={{ color: '#1E40AF', opacity: 0.8 }}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 任务倒计时阶段（任务总时长）
  if (state.status === 'task_countdown') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {visibleSnowLevel > 0 && (
          <div className="pointer-events-none absolute inset-x-2 bottom-0 z-0 overflow-hidden rounded-b-2xl">
            <div
              className="relative transition-all duration-1000 ease-out"
              style={{
                height: `${visibleSnowLevel}%`,
                transform: `translateY(${snowBobOffset}px)`,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(244,248,255,0.68) 38%, rgba(228,236,246,0.92) 100%)',
              }}
            >
              <div
                className="absolute inset-x-[-6%] top-[-8px] h-4"
                style={{
                  background: 'radial-gradient(circle at 10% 120%, rgba(255,255,255,0.92) 0 15px, transparent 16px), radial-gradient(circle at 34% 120%, rgba(255,255,255,0.95) 0 18px, transparent 19px), radial-gradient(circle at 58% 120%, rgba(255,255,255,0.9) 0 16px, transparent 17px), radial-gradient(circle at 82% 120%, rgba(255,255,255,0.96) 0 17px, transparent 18px)',
                }}
              />
            </div>
          </div>
        )}
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm hover:bg-red-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-red-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏱️</span>
          <span>任务剩余</span>
        </div>
        
        {/* 任务倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(taskCountdownLeft)}
        </div>
        
        {/* 超时惩罚提示 */}
        {state.completeTimeoutCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-red-500 shadow-lg mb-2">
            <span className="text-sm">⚠️</span>
            <p className="text-white text-xs font-bold">
              已扣除 {Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 金币（{state.completeTimeoutCount}次超时）
            </p>
          </div>
        )}
        
        {/* 验证关键词提示（醒目样式） */}
        {hasVerification && completeKeywords.length > 0 && (
          <div className="mb-2 px-4 py-2 rounded-lg shadow-md" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <p className="text-xs font-semibold text-center" style={{ color: '#92400E' }}>
              📷 请拍摄包含：<span className="font-bold">{completeKeywords.join(' / ')}</span> 的照片
            </p>
          </div>
        )}
        
        {/* 完成按钮 - 仅无验证任务显示 */}
        {!hasVerification && (
          <button 
            onClick={handleCompleteTask}
            disabled={isUploading}
            className="px-6 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            <span>✅</span>
            <span>完成任务</span>
          </button>
        )}
        
        {/* 上传照片按钮 - 仅验证任务显示 */}
        {hasVerification && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCompleteTask(true)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#3B82F6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>拍摄照片</span>
                </>
              )}
            </button>
            <button 
              onClick={() => handleCompleteTask(false)}
              disabled={isUploading}
              className="flex-1 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>验证中...</span>
                </>
              ) : (
                <>
                  <span>🖼️</span>
                  <span>上传照片</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 上传完成验证中 - 在卡片内显示
  if (state.status === 'uploading_complete') {
    return (
      <div className="w-full flex flex-col items-center py-2 bg-transparent relative">
        {/* 右上角按钮组 */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* 坏习惯历史按钮 */}
          {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 border border-red-400 shadow-sm hover:bg-red-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">⚠️</span>
              <span className="text-xs font-bold text-red-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
          )}
        </div>
        
        {/* 顶部状态文字 */}
        <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#666' }}>
          <span>⏱️</span>
          <span>任务剩余</span>
        </div>
        
        {/* 任务倒计时（无背景） */}
        <div 
          className="text-4xl font-black mb-2 px-2 py-1"
          style={{
            color: '#000000',
          }}
        >
          {formatTime(taskCountdownLeft)}
        </div>
        
        {/* 🔧 显示正在验证的照片 */}
        {previewImage && (
          <div className="w-full mb-2 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={previewImage} 
              alt="验证中" 
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* 🔧 蓝色日志显示框 */}
        <div className="w-full mb-2 px-4 py-3 rounded-lg shadow-md" 
             style={{ 
               backgroundColor: '#DBEAFE', 
               border: '1px solid #93C5FD',
               maxHeight: '200px',
               overflowY: 'auto'
             }}>
          <div className="flex items-start gap-2">
            <span className="animate-spin text-lg flex-shrink-0">⏳</span>
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ color: '#1E40AF' }}>
                {verifyLog}
              </p>
              {/* 详细日志列表 */}
              {detailedLogs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {detailedLogs.slice(-5).map((log, index) => (
                    <p key={index} className="text-xs" style={{ color: '#1E40AF', opacity: 0.8 }}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 坏习惯历史弹窗 */}
        {showBadHabitHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🐢</span>
                  <span>坏习惯历史</span>
                </h3>
                <button
                  onClick={() => setShowBadHabitHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {/* 启动拖延记录 */}
                {state.startTimeoutCount > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🐢</span>
                      <span className="font-semibold text-yellow-800">启动拖延</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                    </div>
                  </div>
                )}
                
                {/* 完成超时记录 */}
                {state.completeTimeoutCount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="font-semibold text-red-800">完成超时</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                      <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                      <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                    </div>
                  </div>
                )}
                
                {/* 总计 */}
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                    </span>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className="text-xs text-gray-500 text-center mt-4">
                  💡 按时完成验证可避免扣金币哦！
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 已完成状态：只显示坏习惯历史按钮（如果有记录）
  if (state.status === 'completed') {
    return (
      <>
        {/* 任务完成庆祝特效 */}
        {showCelebration && (
          <TaskCompletionCelebration
            taskTitle={taskTitle}
            goldAmount={celebrationGold}
            onComplete={() => {
              console.log('🎉 [父组件] 收到 onComplete 回调，关闭庆祝特效');
              setShowCelebration(false);
            }}
          />
        )}
        
        {/* 坏习惯历史按钮 - 任务完成后也显示 */}
        {(state.startTimeoutCount > 0 || state.completeTimeoutCount > 0) && (
          <div className="w-full flex justify-end py-2 px-2">
            <button
              onClick={() => setShowBadHabitHistory(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200 transition-colors"
              title="查看坏习惯历史"
            >
              <span className="text-base">🐢</span>
              <span className="text-xs font-bold text-yellow-800">
                {state.startTimeoutCount + state.completeTimeoutCount}
              </span>
            </button>
            
            {/* 坏习惯历史弹窗 */}
            {showBadHabitHistory && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBadHabitHistory(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">🐢</span>
                      <span>坏习惯历史</span>
                    </h3>
                    <button
                      onClick={() => setShowBadHabitHistory(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* 启动拖延记录 */}
                    {state.startTimeoutCount > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🐢</span>
                          <span className="font-semibold text-yellow-800">启动拖延</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>• 拖延次数：<span className="font-bold text-yellow-700">{state.startTimeoutCount} 次</span></p>
                          <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.startTimeoutCount} 💰</span></p>
                          <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 完成超时记录 */}
                    {state.completeTimeoutCount > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">⚠️</span>
                          <span className="font-semibold text-red-800">完成超时</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>• 超时次数：<span className="font-bold text-red-700">{state.completeTimeoutCount} 次</span></p>
                          <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * state.completeTimeoutCount} 💰</span></p>
                          <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 总计 */}
                    <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">累计扣除金币</span>
                        <span className="text-xl font-black text-red-600">
                          {Math.floor(goldReward * 0.2) * (state.startTimeoutCount + state.completeTimeoutCount)} 💰
                        </span>
                      </div>
                    </div>
                    
                    {/* 提示 */}
                    <div className="text-xs text-gray-500 text-center mt-4">
                      💡 按时完成验证可避免扣金币哦！
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }
  
  // 其他未知状态：不显示
  return (
    <>
      {/* 任务完成庆祝特效 */}
      {showCelebration && (
        <TaskCompletionCelebration
          taskTitle={taskTitle}
          goldAmount={celebrationGold}
          onComplete={() => {
            console.log('🎉 [父组件] 收到 onComplete 回调，关闭庆祝特效');
            setShowCelebration(false);
          }}
        />
      )}
    </>
  );
}