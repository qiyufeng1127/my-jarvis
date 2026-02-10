/**
 * 任务验证管理器
 * 负责自动触发验证、提醒、金币奖励等
 */

import { useEffect, useRef } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useVerificationStates } from './useVerificationStates';
import type { Task } from '@/types';

interface VerificationReminder {
  taskId: string;
  type: 'start' | 'complete_soon' | 'complete';
  scheduledTime: Date;
}

export function useTaskVerificationManager() {
  const { tasks, updateTask } = useTaskStore();
  const { getState } = useVerificationStates();
  const remindersRef = useRef<VerificationReminder[]>([]);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 计算任务的基础金币奖励
  const calculateBaseGold = (task: Task): number => {
    return Math.floor(task.durationMinutes * 1.5);
  };

  // 计算启动验证奖励（30%）
  const calculateStartGold = (task: Task): number => {
    return Math.floor(calculateBaseGold(task) * 0.3);
  };

  // 计算完成验证奖励（70%）
  const calculateCompleteGold = (task: Task): number => {
    return Math.floor(calculateBaseGold(task) * 0.7);
  };

  // 语音提醒
  const speakReminder = (message: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 显示全屏提醒
  const showFullScreenReminder = (task: Task, type: 'start' | 'complete') => {
    const event = new CustomEvent('show-verification-modal', {
      detail: {
        taskId: task.id,
        taskTitle: task.title,
        verificationType: type,
        requirement: type === 'start' 
          ? task.verificationStart?.requirement 
          : task.verificationComplete?.requirement,
        timeout: type === 'start'
          ? task.verificationStart?.timeout || 120
          : task.verificationComplete?.timeout || 120,
      },
    });
    window.dispatchEvent(event);
  };

  // 处理启动验证
  const handleStartVerification = async (task: Task) => {
    console.log('🚀 [验证管理器] 触发启动验证:', task.title);

    // 更新任务状态为"验证开始中"
    await updateTask(task.id, {
      status: 'verifying_start',
    });

    // 语音提醒
    speakReminder(`任务${task.title}启动验证已开始，请拍摄照片`);

    // 显示全屏验证界面
    showFullScreenReminder(task, 'start');
  };

  // 处理启动验证成功
  const handleStartVerificationSuccess = async (task: Task) => {
    console.log('✅ [验证管理器] 启动验证成功:', task.title);

    const startGold = calculateStartGold(task);

    // 更新任务状态为"进行中"，并给予30%金币
    await updateTask(task.id, {
      status: 'in_progress',
      actualStart: new Date(),
      goldEarned: startGold,
    });

    // 语音提醒
    speakReminder(`启动验证通过，获得${startGold}金币，任务已开始`);

    // 安排完成提醒（提前5分钟）
    if (task.scheduledEnd) {
      const completeReminderTime = new Date(task.scheduledEnd);
      completeReminderTime.setMinutes(completeReminderTime.getMinutes() - 5);

      remindersRef.current.push({
        taskId: task.id,
        type: 'complete_soon',
        scheduledTime: completeReminderTime,
      });
    }
  };

  // 处理启动验证失败
  const handleStartVerificationFailure = async (task: Task, reason: string) => {
    console.log('❌ [验证管理器] 启动验证失败:', task.title, reason);

    const baseGold = calculateBaseGold(task);
    const penalty = Math.floor(baseGold * 0.5); // 惩罚50%

    // 更新任务状态为"失败"，并扣除金币
    await updateTask(task.id, {
      status: 'failed',
      penaltyGold: penalty,
    });

    // 语音提醒
    speakReminder(`启动验证失败，扣除${penalty}金币`);
  };

  // 处理完成提醒（提前5分钟）
  const handleCompleteReminder = (task: Task) => {
    console.log('⏰ [验证管理器] 任务即将完成提醒:', task.title);

    // 语音提醒
    speakReminder(`任务${task.title}即将完成，请准备拍摄照片进行验证`);

    // 显示通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('任务即将完成', {
        body: `${task.title} 将在5分钟后完成，请准备验证照片`,
        icon: '/icon.png',
      });
    }
  };

  // 处理完成验证
  const handleCompleteVerification = async (task: Task) => {
    console.log('🏁 [验证管理器] 触发完成验证:', task.title);

    // 更新任务状态为"验证完成中"
    await updateTask(task.id, {
      status: 'verifying_complete',
    });

    // 语音提醒
    speakReminder(`任务${task.title}完成验证已开始，请拍摄照片`);

    // 显示全屏验证界面
    showFullScreenReminder(task, 'complete');
  };

  // 处理完成验证成功
  const handleCompleteVerificationSuccess = async (task: Task) => {
    console.log('✅ [验证管理器] 完成验证成功:', task.title);

    const completeGold = calculateCompleteGold(task);
    const totalGold = (task.goldEarned || 0) + completeGold;

    // 更新任务状态为"已完成"，并给予剩余70%金币
    await updateTask(task.id, {
      status: 'completed',
      actualEnd: new Date(),
      goldEarned: totalGold,
    });

    // 语音提醒
    speakReminder(`完成验证通过，获得${completeGold}金币，任务已完成，总共获得${totalGold}金币`);
  };

  // 处理完成验证失败
  const handleCompleteVerificationFailure = async (task: Task, reason: string) => {
    console.log('❌ [验证管理器] 完成验证失败:', task.title, reason);

    const baseGold = calculateBaseGold(task);
    const penalty = Math.floor(baseGold * 0.3); // 惩罚30%

    // 更新任务状态为"失败"，并扣除金币
    await updateTask(task.id, {
      status: 'failed',
      penaltyGold: (task.penaltyGold || 0) + penalty,
    });

    // 语音提醒
    speakReminder(`完成验证失败，扣除${penalty}金币`);
  };

  // 检查是否需要触发验证或提醒
  const checkReminders = () => {
    const now = new Date();

    // 检查所有任务
    tasks.forEach((task) => {
      // 跳过已完成、失败、取消的任务
      if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        return;
      }

      // 检查启动验证
      if (
        task.status === 'scheduled' &&
        task.verificationStart &&
        task.scheduledStart
      ) {
        // 🔧 修复：检查验证状态，避免重复触发
        const verificationState = getState(task.id);
        
        // 如果已经启动过验证（started 或 completed），跳过
        if (verificationState.status === 'started' || verificationState.status === 'completed') {
          console.log(`⏭️ [验证管理器] 任务 ${task.title} 已完成启动验证，跳过自动触发`);
          return;
        }
        
        const startTime = new Date(task.scheduledStart);
        const timeDiff = startTime.getTime() - now.getTime();

        // 如果到了开始时间（误差±30秒），触发启动验证
        if (Math.abs(timeDiff) <= 30000) {
          console.log(`🚀 [验证管理器] 时间到达，触发启动验证: ${task.title}`);
          handleStartVerification(task);
        }
      }

      // 检查完成提醒（提前5分钟）
      const completeReminder = remindersRef.current.find(
        (r) => r.taskId === task.id && r.type === 'complete_soon'
      );

      if (completeReminder) {
        const timeDiff = completeReminder.scheduledTime.getTime() - now.getTime();

        // 如果到了提醒时间（误差±30秒），触发提醒
        if (Math.abs(timeDiff) <= 30000) {
          handleCompleteReminder(task);
          // 移除已触发的提醒
          remindersRef.current = remindersRef.current.filter(
            (r) => r !== completeReminder
          );
        }
      }
    });
  };

  // 启动定时检查
  useEffect(() => {
    // 每10秒检查一次
    checkIntervalRef.current = setInterval(checkReminders, 10000);

    // 立即检查一次
    checkReminders();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [tasks]);

  // 监听验证结果事件
  useEffect(() => {
    const handleVerificationResult = (event: CustomEvent) => {
      const { taskId, verificationType, success, reason } = event.detail;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (verificationType === 'start') {
        if (success) {
          handleStartVerificationSuccess(task);
        } else {
          handleStartVerificationFailure(task, reason);
        }
      } else if (verificationType === 'complete') {
        if (success) {
          handleCompleteVerificationSuccess(task);
        } else {
          handleCompleteVerificationFailure(task, reason);
        }
      }
    };

    window.addEventListener('verification-result', handleVerificationResult as EventListener);

    return () => {
      window.removeEventListener('verification-result', handleVerificationResult as EventListener);
    };
  }, [tasks]);

  return {
    handleStartVerification,
    handleCompleteVerification,
    calculateBaseGold,
    calculateStartGold,
    calculateCompleteGold,
  };
}

