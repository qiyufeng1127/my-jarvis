import { supabase, TABLES } from './client';
import type { BadHabit, BadHabitOccurrence } from '@/types';

/**
 * 获取用户的坏习惯列表
 */
export async function getBadHabits(userId: string): Promise<BadHabit[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.BAD_HABITS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('occurrence_count', { ascending: false });

    if (error) throw error;

    return data.map(mapHabitFromDB);
  } catch (error) {
    console.error('获取坏习惯列表失败:', error);
    throw error;
  }
}

/**
 * 创建坏习惯记录
 */
export async function createBadHabit(habit: Partial<BadHabit>): Promise<BadHabit> {
  try {
    const { data, error } = await supabase
      .from(TABLES.BAD_HABITS)
      .insert({
        user_id: habit.userId,
        habit_type: habit.habitType,
        custom_name: habit.customName,
        detection_rules: habit.detectionRules || {},
        severity: habit.severity || 5,
      })
      .select()
      .single();

    if (error) throw error;

    return mapHabitFromDB(data);
  } catch (error) {
    console.error('创建坏习惯记录失败:', error);
    throw error;
  }
}

/**
 * 记录坏习惯发生
 */
export async function recordHabitOccurrence(
  userId: string,
  habitId: string,
  severity: number,
  context?: Record<string, any>,
  relatedTaskId?: string
): Promise<void> {
  try {
    // 1. 创建发生记录
    const { error: occurrenceError } = await supabase
      .from(TABLES.BAD_HABIT_OCCURRENCES)
      .insert({
        user_id: userId,
        bad_habit_id: habitId,
        severity,
        context: context || {},
        related_task_id: relatedTaskId,
      });

    if (occurrenceError) throw occurrenceError;

    // 2. 更新坏习惯统计
    const { data: habit, error: fetchError } = await supabase
      .from(TABLES.BAD_HABITS)
      .select('occurrence_count, consecutive_success_days')
      .eq('id', habitId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from(TABLES.BAD_HABITS)
      .update({
        occurrence_count: habit.occurrence_count + 1,
        last_occurred_at: new Date().toISOString(),
        consecutive_success_days: 0, // 重置连续成功天数
      })
      .eq('id', habitId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('记录坏习惯发生失败:', error);
    throw error;
  }
}

/**
 * 更新连续成功天数
 */
export async function updateSuccessStreak(habitId: string): Promise<void> {
  try {
    const { data: habit, error: fetchError } = await supabase
      .from(TABLES.BAD_HABITS)
      .select('consecutive_success_days, best_streak')
      .eq('id', habitId)
      .single();

    if (fetchError) throw fetchError;

    const newStreak = habit.consecutive_success_days + 1;
    const newBestStreak = Math.max(newStreak, habit.best_streak);

    const { error: updateError } = await supabase
      .from(TABLES.BAD_HABITS)
      .update({
        consecutive_success_days: newStreak,
        best_streak: newBestStreak,
      })
      .eq('id', habitId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('更新连续成功天数失败:', error);
    throw error;
  }
}

/**
 * 获取坏习惯发生记录
 */
export async function getHabitOccurrences(
  userId: string,
  habitId?: string,
  limit: number = 50
): Promise<BadHabitOccurrence[]> {
  try {
    let query = supabase
      .from(TABLES.BAD_HABIT_OCCURRENCES)
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (habitId) {
      query = query.eq('bad_habit_id', habitId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      badHabitId: item.bad_habit_id,
      occurredAt: new Date(item.occurred_at),
      severity: item.severity,
      context: item.context || {},
      relatedTaskId: item.related_task_id,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('获取坏习惯发生记录失败:', error);
    throw error;
  }
}

/**
 * 获取坏习惯统计
 */
export async function getHabitStats(userId: string, startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from(TABLES.BAD_HABIT_OCCURRENCES)
      .select('bad_habit_id, severity')
      .eq('user_id', userId)
      .gte('occurred_at', startDate.toISOString())
      .lte('occurred_at', endDate.toISOString());

    if (error) throw error;

    // 按习惯分组统计
    const stats = data.reduce((acc, item) => {
      if (!acc[item.bad_habit_id]) {
        acc[item.bad_habit_id] = {
          count: 0,
          totalSeverity: 0,
        };
      }
      acc[item.bad_habit_id].count++;
      acc[item.bad_habit_id].totalSeverity += item.severity;
      return acc;
    }, {} as Record<string, { count: number; totalSeverity: number }>);

    return stats;
  } catch (error) {
    console.error('获取坏习惯统计失败:', error);
    throw error;
  }
}

/**
 * 设置改进计划
 */
export async function setImprovementPlan(
  habitId: string,
  plan: {
    duration: number;
    dailyTasks: string[];
    strategies: string[];
  }
): Promise<void> {
  try {
    const improvementPlan = {
      startDate: new Date().toISOString(),
      duration: plan.duration,
      phase: 'awareness',
      dailyTasks: plan.dailyTasks,
      strategies: plan.strategies,
      progress: 0,
    };

    const { error } = await supabase
      .from(TABLES.BAD_HABITS)
      .update({ improvement_plan: improvementPlan })
      .eq('id', habitId);

    if (error) throw error;
  } catch (error) {
    console.error('设置改进计划失败:', error);
    throw error;
  }
}

/**
 * 更新改进计划进度
 */
export async function updateImprovementProgress(
  habitId: string,
  progress: number,
  phase?: 'awareness' | 'adjustment' | 'consolidation'
): Promise<void> {
  try {
    const { data: habit, error: fetchError } = await supabase
      .from(TABLES.BAD_HABITS)
      .select('improvement_plan')
      .eq('id', habitId)
      .single();

    if (fetchError) throw fetchError;

    const updatedPlan = {
      ...habit.improvement_plan,
      progress,
      ...(phase && { phase }),
    };

    const { error: updateError } = await supabase
      .from(TABLES.BAD_HABITS)
      .update({ improvement_plan: updatedPlan })
      .eq('id', habitId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('更新改进计划进度失败:', error);
    throw error;
  }
}

// 映射函数
function mapHabitFromDB(data: any): BadHabit {
  return {
    id: data.id,
    userId: data.user_id,
    habitType: data.habit_type,
    customName: data.custom_name,
    detectionRules: data.detection_rules || {},
    severity: data.severity,
    occurrenceCount: data.occurrence_count,
    lastOccurredAt: data.last_occurred_at ? new Date(data.last_occurred_at) : undefined,
    improvementPlan: data.improvement_plan,
    consecutiveSuccessDays: data.consecutive_success_days,
    bestStreak: data.best_streak,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

