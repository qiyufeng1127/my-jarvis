/**
 * 任务卡片组件 - 从 NewTimelineView 拆分出来
 * 负责单个任务的渲染和交互
 */

import React, { useState, useEffect } from 'react';
import TaskCardVerification from '@/components/verification/FullScreenVerification';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  verificationState: {
    status: 'pending' | 'started' | 'completed';
    startTime?: Date;
    actualStartTime?: Date;
  };
  onStartVerification: (taskId: string) => void;
  onCompleteVerification: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
  children?: React.ReactNode; // 原有的任务卡片内容
}

export default function TaskCard({
  task,
  verificationState,
  onStartVerification,
  onCompleteVerification,
  onTaskClick,
  children,
}: TaskCardProps) {
  const now = new Date();
  const taskStart = task.scheduledStart ? new Date(task.scheduledStart) : null;
  const taskEnd = task.scheduledEnd ? new Date(task.scheduledEnd) : null;

  // 判断是否需要显示验证界面
  const needsStartVerification = 
    task.verificationStart && 
    verificationState.status === 'pending' &&
    taskStart && 
    now >= taskStart &&
    task.status !== 'completed';

  const needsCompleteVerification = 
    task.verificationComplete &&
    verificationState.status === 'started' &&
    taskEnd &&
    task.status !== 'completed';

  // 计算剩余时间
  const getTimeLeft = () => {
    if (needsStartVerification) {
      // 启动验证：2分钟倒计时
      const startDeadline = verificationState.startTime || new Date(taskStart!.getTime() + 2 * 60 * 1000);
      return Math.max(0, Math.floor((startDeadline.getTime() - now.getTime()) / 1000));
    } else if (needsCompleteVerification) {
      // 完成验证：任务时长倒计时
      const actualStart = verificationState.actualStartTime || taskStart!;
      const elapsed = Math.floor((now.getTime() - actualStart.getTime()) / 1000);
      const total = task.durationMinutes * 60;
      return Math.max(0, total - elapsed);
    }
    return 0;
  };

  // 如果需要验证，显示验证界面
  if (needsStartVerification || needsCompleteVerification) {
    return (
      <div className="task-card-verification">
        <TaskCardVerification
          type={needsStartVerification ? 'start' : 'complete'}
          taskTitle={task.title}
          timeLeft={getTimeLeft()}
          onVerify={() => {
            if (needsStartVerification) {
              onStartVerification(task.id);
            } else {
              onCompleteVerification(task.id);
            }
          }}
        />
      </div>
    );
  }

  // 正常的任务卡片
  return (
    <div 
      className="task-card-normal"
      onClick={() => onTaskClick?.(task)}
    >
      {children}
    </div>
  );
}

