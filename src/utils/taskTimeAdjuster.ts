/**
 * 任务时间自动调整工具
 * 用于处理任务启动/完成时的时间修正和冲突解决
 */

import type { Task } from '@/types';

/**
 * 检查两个时间段是否有冲突
 */
export function hasTimeConflict(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * 查找最近的空闲时间段
 * @param targetStart 目标开始时间
 * @param duration 任务时长（分钟）
 * @param existingTasks 已存在的任务列表
 * @param excludeTaskId 要排除的任务ID（当前正在调整的任务）
 * @returns 最近的空闲开始时间
 */
export function findNextAvailableSlot(
  targetStart: Date,
  duration: number,
  existingTasks: Task[],
  excludeTaskId?: string
): Date {
  // 过滤出同一天的任务，并排除当前任务
  const sameDayTasks = existingTasks
    .filter(t => {
      if (t.id === excludeTaskId) return false;
      if (!t.scheduledStart || !t.scheduledEnd) return false;
      
      const taskDate = new Date(t.scheduledStart);
      return (
        taskDate.getFullYear() === targetStart.getFullYear() &&
        taskDate.getMonth() === targetStart.getMonth() &&
        taskDate.getDate() === targetStart.getDate()
      );
    })
    .map(t => ({
      start: new Date(t.scheduledStart!),
      end: new Date(t.scheduledEnd!),
      id: t.id,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // 如果没有其他任务，直接返回目标时间
  if (sameDayTasks.length === 0) {
    return targetStart;
  }

  // 尝试从目标时间开始查找空闲时段
  let candidateStart = new Date(targetStart);
  const candidateEnd = new Date(candidateStart.getTime() + duration * 60000);

  // 检查是否与现有任务冲突
  let hasConflict = true;
  let maxIterations = 100; // 防止无限循环
  let iterations = 0;

  while (hasConflict && iterations < maxIterations) {
    hasConflict = false;
    iterations++;

    for (const task of sameDayTasks) {
      if (hasTimeConflict(candidateStart, candidateEnd, task.start, task.end)) {
        // 有冲突，移动到这个任务结束后
        candidateStart = new Date(task.end);
        candidateEnd.setTime(candidateStart.getTime() + duration * 60000);
        hasConflict = true;
        break;
      }
    }
  }

  return candidateStart;
}

/**
 * 调整任务启动时间并处理冲突
 * @param taskId 要启动的任务ID
 * @param actualStartTime 实际启动时间
 * @param allTasks 所有任务列表
 * @returns 更新后的任务列表
 */
export function adjustTaskStartTime(
  taskId: string,
  actualStartTime: Date,
  allTasks: Task[]
): Task[] {
  const task = allTasks.find(t => t.id === taskId);
  if (!task || !task.scheduledStart || !task.scheduledEnd) {
    return allTasks;
  }

  const originalStart = new Date(task.scheduledStart);
  const originalEnd = new Date(task.scheduledEnd);
  const duration = task.durationMinutes || Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000);

  // 计算新的结束时间
  const newEndTime = new Date(actualStartTime.getTime() + duration * 60000);

  console.log('🔧 调整任务启动时间:', {
    taskId,
    taskTitle: task.title,
    originalStart: originalStart.toLocaleString(),
    actualStart: actualStartTime.toLocaleString(),
    newEnd: newEndTime.toLocaleString(),
    duration: `${duration}分钟`,
  });

  // 检查是否有冲突的任务
  const conflictingTasks = allTasks.filter(t => {
    if (t.id === taskId) return false;
    if (!t.scheduledStart || !t.scheduledEnd) return false;
    if (t.status === 'completed' || t.status === 'cancelled') return false;

    const tStart = new Date(t.scheduledStart);
    const tEnd = new Date(t.scheduledEnd);

    // 检查是否在同一天
    const sameDay = (
      tStart.getFullYear() === actualStartTime.getFullYear() &&
      tStart.getMonth() === actualStartTime.getMonth() &&
      tStart.getDate() === actualStartTime.getDate()
    );

    if (!sameDay) return false;

    // 检查时间冲突
    return hasTimeConflict(actualStartTime, newEndTime, tStart, tEnd);
  });

  console.log(`⚠️ 发现 ${conflictingTasks.length} 个冲突任务`);

  // 更新任务列表
  const updatedTasks = allTasks.map(t => {
    // 更新当前启动的任务
    if (t.id === taskId) {
      return {
        ...t,
        scheduledStart: actualStartTime,
        scheduledEnd: newEndTime,
      };
    }

    // 处理冲突任务：自动下移
    const isConflicting = conflictingTasks.some(ct => ct.id === t.id);
    if (isConflicting) {
      const taskDuration = t.durationMinutes || 30;
      
      // 查找最近的空闲时段（从新任务结束时间开始）
      const newStart = findNextAvailableSlot(
        newEndTime, // 从当前任务结束后开始查找
        taskDuration,
        allTasks,
        t.id
      );
      
      const newEnd = new Date(newStart.getTime() + taskDuration * 60000);

      console.log(`📍 任务自动下移: ${t.title}`, {
        原时间: `${new Date(t.scheduledStart!).toLocaleTimeString()} - ${new Date(t.scheduledEnd!).toLocaleTimeString()}`,
        新时间: `${newStart.toLocaleTimeString()} - ${newEnd.toLocaleTimeString()}`,
      });

      return {
        ...t,
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      };
    }

    return t;
  });

  return updatedTasks;
}

/**
 * 调整任务完成时间
 * @param taskId 要完成的任务ID
 * @param actualEndTime 实际完成时间
 * @param allTasks 所有任务列表
 * @returns 更新后的任务列表
 */
export function adjustTaskEndTime(
  taskId: string,
  actualEndTime: Date,
  allTasks: Task[]
): Task[] {
  const task = allTasks.find(t => t.id === taskId);
  if (!task || !task.scheduledEnd) {
    return allTasks;
  }

  const originalEnd = new Date(task.scheduledEnd);

  console.log('🔧 调整任务完成时间:', {
    taskId,
    taskTitle: task.title,
    originalEnd: originalEnd.toLocaleString(),
    actualEnd: actualEndTime.toLocaleString(),
  });

  // 更新任务的结束时间
  const updatedTasks = allTasks.map(t => {
    if (t.id === taskId) {
      return {
        ...t,
        scheduledEnd: actualEndTime,
      };
    }
    return t;
  });

  // 如果提前完成，检查是否有后续任务可以提前
  if (actualEndTime < originalEnd) {
    const timeSaved = originalEnd.getTime() - actualEndTime.getTime();
    console.log(`⏰ 提前完成，节省了 ${Math.round(timeSaved / 60000)} 分钟`);

    // 可以选择性地将后续任务也提前（可选功能）
    // 这里暂时不实现，保持简单
  }

  return updatedTasks;
}

/**
 * 批量调整任务时间（用于处理多个冲突）
 * @param updates 要更新的任务时间映射 { taskId: { start, end } }
 * @param allTasks 所有任务列表
 * @returns 更新后的任务列表
 */
export function batchAdjustTaskTimes(
  updates: Record<string, { start?: Date; end?: Date }>,
  allTasks: Task[]
): Task[] {
  return allTasks.map(task => {
    const update = updates[task.id];
    if (!update) return task;

    return {
      ...task,
      scheduledStart: update.start || task.scheduledStart,
      scheduledEnd: update.end || task.scheduledEnd,
    };
  });
}







