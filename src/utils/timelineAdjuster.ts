/**
 * 时间轴位置调整工具
 * 独立模块，仅用于调整任务在时间轴上的位置
 * 不影响任务的其他属性（如时长、金币规则）
 */

import type { Task } from '@/types';

/**
 * 调整任务启动时间
 * @param taskId 任务ID
 * @param actualStartTime 实际启动时间
 * @param tasks 所有任务列表
 * @param onTaskUpdate 任务更新回调
 */
export function adjustTaskStartTime(
  taskId: string,
  actualStartTime: Date,
  tasks: Task[],
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
): void {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // 仅更新任务的开始时间，不修改其他属性
  onTaskUpdate(taskId, {
    startTime: actualStartTime.toISOString(),
  });

  // 检查是否有时间冲突，如果有则调整冲突任务
  const taskDuration = task.duration || 30; // 默认30分钟
  const taskEndTime = new Date(actualStartTime.getTime() + taskDuration * 60000);
  
  handleTimeConflicts(taskId, actualStartTime, taskEndTime, tasks, onTaskUpdate);
}

/**
 * 调整任务结束时间
 * @param taskId 任务ID
 * @param actualEndTime 实际结束时间
 * @param tasks 所有任务列表
 * @param onTaskUpdate 任务更新回调
 */
export function adjustTaskEndTime(
  taskId: string,
  actualEndTime: Date,
  tasks: Task[],
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
): void {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const startTime = new Date(task.startTime);
  const actualDuration = Math.round((actualEndTime.getTime() - startTime.getTime()) / 60000);

  // 仅更新任务的实际完成时间，不修改金币规则
  onTaskUpdate(taskId, {
    actualDuration,
    actualEndTime: actualEndTime.toISOString(),
  });
}

/**
 * 查找指定时间后最近的空闲时段
 * @param startTime 开始时间
 * @param duration 任务时长（分钟）
 * @param tasks 所有任务列表
 * @param excludeTaskId 排除的任务ID（当前任务）
 * @returns 空闲时段的开始时间
 */
export function findFreeTimeSlot(
  startTime: Date,
  duration: number,
  tasks: Task[],
  excludeTaskId?: string
): Date {
  // 参数校验
  if (!startTime || isNaN(startTime.getTime())) {
    console.error('Invalid startTime:', startTime);
    return new Date();
  }
  if (typeof duration !== 'number' || duration <= 0) {
    console.error('Invalid duration:', duration);
    duration = 30; // 默认30分钟
  }

  // 获取同一天的所有任务，按开始时间排序
  const dayStart = new Date(startTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startTime);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDayTasks = tasks
    .filter(t => {
      if (t.id === excludeTaskId) return false;
      const taskStart = new Date(t.startTime);
      return taskStart >= dayStart && taskStart <= dayEnd;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 从指定时间开始查找空闲时段
  let candidateStart = new Date(startTime);
  const candidateEnd = new Date(candidateStart.getTime() + duration * 60000);

  for (const task of sameDayTasks) {
    const taskStart = new Date(task.startTime);
    const taskDuration = task.duration || 30;
    const taskEnd = new Date(taskStart.getTime() + taskDuration * 60000);

    // 检查是否有时间冲突
    if (candidateStart < taskEnd && candidateEnd > taskStart) {
      // 有冲突，将候选时间移到该任务结束后
      candidateStart = new Date(taskEnd);
      candidateEnd.setTime(candidateStart.getTime() + duration * 60000);
    }
  }

  return candidateStart;
}

/**
 * 处理时间冲突，将冲突的任务下移
 * @param currentTaskId 当前任务ID
 * @param startTime 当前任务开始时间
 * @param endTime 当前任务结束时间
 * @param tasks 所有任务列表
 * @param onTaskUpdate 任务更新回调
 */
function handleTimeConflicts(
  currentTaskId: string,
  startTime: Date,
  endTime: Date,
  tasks: Task[],
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
): void {
  // 参数校验
  if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error('Invalid time parameters:', { startTime, endTime });
    return;
  }

  // 查找与当前任务时间冲突的任务
  const conflictingTasks = tasks.filter(t => {
    if (t.id === currentTaskId) return false;
    
    const taskStart = new Date(t.startTime);
    if (isNaN(taskStart.getTime())) return false;
    
    const taskDuration = t.duration || 30;
    const taskEnd = new Date(taskStart.getTime() + taskDuration * 60000);

    // 检查是否有时间重叠
    return taskStart < endTime && taskEnd > startTime;
  });

  // 将冲突任务下移到空闲时段
  conflictingTasks.forEach(task => {
    const taskDuration = task.duration || 30;
    const newStartTime = findFreeTimeSlot(endTime, taskDuration, tasks, task.id);
    
    // 仅更新任务的开始时间，不修改其他属性
    onTaskUpdate(task.id, {
      startTime: newStartTime.toISOString(),
    });
  });
}

/**
 * 计算实际耗时（分钟）
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 实际耗时（分钟）
 */
export function calculateActualDuration(startTime: Date, endTime: Date): number {
  // 参数校验
  if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error('Invalid time parameters:', { startTime, endTime });
    return 0;
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  return Math.max(0, Math.round(durationMs / 60000));
}

