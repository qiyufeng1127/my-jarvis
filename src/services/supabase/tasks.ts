import { supabase, TABLES } from './client';
import type { Task, TaskStatus } from '@/types';

/**
 * 创建任务
 */
export async function createTask(task: Partial<Task>): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert({
        user_id: task.userId,
        title: task.title,
        description: task.description,
        task_type: task.taskType,
        priority: task.priority || 2,
        duration_minutes: task.durationMinutes,
        scheduled_start: task.scheduledStart?.toISOString(),
        scheduled_end: task.scheduledEnd?.toISOString(),
        growth_dimensions: task.growthDimensions || {},
        long_term_goals: task.longTermGoals || {},
        identity_tags: task.identityTags || [],
        verification_start: task.verificationStart,
        verification_complete: task.verificationComplete,
        enable_progress_check: task.enableProgressCheck || false,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return mapTaskFromDB(data);
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
}

/**
 * 获取用户的所有任务
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_start', { ascending: true });

    if (error) throw error;

    return data.map(mapTaskFromDB);
  } catch (error) {
    console.error('获取任务失败:', error);
    throw error;
  }
}

/**
 * 获取指定日期的任务
 */
export async function getTasksByDate(userId: string, date: Date): Promise<Task[]> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_start', startOfDay.toISOString())
      .lte('scheduled_start', endOfDay.toISOString())
      .order('scheduled_start', { ascending: true });

    if (error) throw error;

    return data.map(mapTaskFromDB);
  } catch (error) {
    console.error('获取指定日期任务失败:', error);
    throw error;
  }
}

/**
 * 更新任务
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .update({
        title: updates.title,
        description: updates.description,
        task_type: updates.taskType,
        priority: updates.priority,
        duration_minutes: updates.durationMinutes,
        scheduled_start: updates.scheduledStart?.toISOString(),
        scheduled_end: updates.scheduledEnd?.toISOString(),
        actual_start: updates.actualStart?.toISOString(),
        actual_end: updates.actualEnd?.toISOString(),
        growth_dimensions: updates.growthDimensions,
        long_term_goals: updates.longTermGoals,
        identity_tags: updates.identityTags,
        verification_start: updates.verificationStart,
        verification_complete: updates.verificationComplete,
        enable_progress_check: updates.enableProgressCheck,
        progress_checks: updates.progressChecks,
        status: updates.status,
        completion_quality: updates.completionQuality,
        gold_earned: updates.goldEarned,
        penalty_gold: updates.penaltyGold,
      })
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('更新任务失败:', error);
    throw error;
  }
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  try {
    const updates: any = { status };

    // 根据状态更新时间戳
    if (status === 'in_progress') {
      updates.actual_start = new Date().toISOString();
    } else if (status === 'completed') {
      updates.actual_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from(TABLES.TASKS)
      .update(updates)
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('更新任务状态失败:', error);
    throw error;
  }
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
}

/**
 * 获取任务统计
 */
export async function getTaskStats(userId: string, startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('status, gold_earned, duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      completed: data.filter((t) => t.status === 'completed').length,
      failed: data.filter((t) => t.status === 'failed').length,
      totalGold: data.reduce((sum, t) => sum + (t.gold_earned || 0), 0),
      totalMinutes: data.reduce((sum, t) => sum + (t.duration_minutes || 0), 0),
    };

    return stats;
  } catch (error) {
    console.error('获取任务统计失败:', error);
    throw error;
  }
}

/**
 * 从数据库记录映射到 Task 类型
 */
function mapTaskFromDB(data: any): Task {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    taskType: data.task_type,
    priority: data.priority,
    durationMinutes: data.duration_minutes,
    scheduledStart: data.scheduled_start ? new Date(data.scheduled_start) : undefined,
    scheduledEnd: data.scheduled_end ? new Date(data.scheduled_end) : undefined,
    actualStart: data.actual_start ? new Date(data.actual_start) : undefined,
    actualEnd: data.actual_end ? new Date(data.actual_end) : undefined,
    growthDimensions: data.growth_dimensions || {},
    longTermGoals: data.long_term_goals || {},
    identityTags: data.identity_tags || [],
    verificationStart: data.verification_start,
    verificationComplete: data.verification_complete,
    enableProgressCheck: data.enable_progress_check,
    progressChecks: data.progress_checks || [],
    penaltyGold: data.penalty_gold || 0,
    status: data.status,
    completionQuality: data.completion_quality,
    goldEarned: data.gold_earned || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

