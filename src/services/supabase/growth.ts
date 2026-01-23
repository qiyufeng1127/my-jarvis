import { supabase, TABLES } from './client';
import type { GrowthDimension, LongTermGoal, IdentityLevel, GrowthHistory } from '@/types';

/**
 * 获取用户的成长维度
 */
export async function getGrowthDimensions(userId: string): Promise<GrowthDimension[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.GROWTH_DIMENSIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data.map(mapDimensionFromDB);
  } catch (error) {
    console.error('获取成长维度失败:', error);
    throw error;
  }
}

/**
 * 更新成长维度值
 */
export async function updateDimensionValue(
  dimensionId: string,
  newValue: number,
  reason: string,
  relatedTaskId?: string
): Promise<void> {
  try {
    // 获取当前值
    const { data: dimension, error: fetchError } = await supabase
      .from(TABLES.GROWTH_DIMENSIONS)
      .select('current_value, user_id')
      .eq('id', dimensionId)
      .single();

    if (fetchError) throw fetchError;

    const oldValue = dimension.current_value;
    const changeAmount = newValue - oldValue;

    // 更新维度值
    const { error: updateError } = await supabase
      .from(TABLES.GROWTH_DIMENSIONS)
      .update({ current_value: newValue })
      .eq('id', dimensionId);

    if (updateError) throw updateError;

    // 记录历史
    const { error: historyError } = await supabase
      .from(TABLES.GROWTH_HISTORY)
      .insert({
        user_id: dimension.user_id,
        dimension_id: dimensionId,
        old_value: oldValue,
        new_value: newValue,
        change_amount: changeAmount,
        reason,
        related_task_id: relatedTaskId,
      });

    if (historyError) throw historyError;
  } catch (error) {
    console.error('更新维度值失败:', error);
    throw error;
  }
}

/**
 * 获取用户的长期目标
 */
export async function getLongTermGoals(userId: string): Promise<LongTermGoal[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.LONG_TERM_GOALS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapGoalFromDB);
  } catch (error) {
    console.error('获取长期目标失败:', error);
    throw error;
  }
}

/**
 * 创建长期目标
 */
export async function createLongTermGoal(goal: Partial<LongTermGoal>): Promise<LongTermGoal> {
  try {
    const { data, error } = await supabase
      .from(TABLES.LONG_TERM_GOALS)
      .insert({
        user_id: goal.userId,
        name: goal.name,
        description: goal.description,
        goal_type: goal.goalType,
        target_value: goal.targetValue,
        current_value: goal.currentValue || 0,
        unit: goal.unit,
        deadline: goal.deadline?.toISOString(),
        related_dimensions: goal.relatedDimensions || [],
        milestones: goal.milestones || [],
      })
      .select()
      .single();

    if (error) throw error;

    return mapGoalFromDB(data);
  } catch (error) {
    console.error('创建长期目标失败:', error);
    throw error;
  }
}

/**
 * 更新目标进度
 */
export async function updateGoalProgress(goalId: string, currentValue: number): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.LONG_TERM_GOALS)
      .update({ current_value: currentValue })
      .eq('id', goalId);

    if (error) throw error;
  } catch (error) {
    console.error('更新目标进度失败:', error);
    throw error;
  }
}

/**
 * 获取用户的身份层级
 */
export async function getIdentityLevels(userId: string): Promise<IdentityLevel[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.IDENTITY_LEVELS)
      .select('*')
      .eq('user_id', userId)
      .order('level_order', { ascending: true });

    if (error) throw error;

    return data.map(mapLevelFromDB);
  } catch (error) {
    console.error('获取身份层级失败:', error);
    throw error;
  }
}

/**
 * 获取当前身份层级
 */
export async function getCurrentLevel(userId: string): Promise<IdentityLevel | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.IDENTITY_LEVELS)
      .select('*')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapLevelFromDB(data);
  } catch (error) {
    console.error('获取当前层级失败:', error);
    throw error;
  }
}

/**
 * 升级到新层级
 */
export async function levelUp(userId: string, newLevelId: string): Promise<void> {
  try {
    // 取消当前层级
    await supabase
      .from(TABLES.IDENTITY_LEVELS)
      .update({ is_current: false })
      .eq('user_id', userId)
      .eq('is_current', true);

    // 设置新层级
    const { error } = await supabase
      .from(TABLES.IDENTITY_LEVELS)
      .update({
        is_current: true,
        unlocked_at: new Date().toISOString(),
      })
      .eq('id', newLevelId);

    if (error) throw error;
  } catch (error) {
    console.error('升级失败:', error);
    throw error;
  }
}

/**
 * 计算总成长值
 */
export async function calculateTotalGrowth(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(TABLES.GROWTH_DIMENSIONS)
      .select('current_value, weight')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const totalGrowth = data.reduce((sum, dim) => {
      return sum + dim.current_value * dim.weight;
    }, 0);

    return Math.round(totalGrowth);
  } catch (error) {
    console.error('计算总成长值失败:', error);
    throw error;
  }
}

/**
 * 获取成长历史
 */
export async function getGrowthHistory(
  userId: string,
  dimensionId?: string,
  limit: number = 100
): Promise<GrowthHistory[]> {
  try {
    let query = supabase
      .from(TABLES.GROWTH_HISTORY)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dimensionId) {
      query = query.eq('dimension_id', dimensionId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      dimensionId: item.dimension_id,
      oldValue: item.old_value,
      newValue: item.new_value,
      changeAmount: item.change_amount,
      reason: item.reason,
      relatedTaskId: item.related_task_id,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    }));
  } catch (error) {
    console.error('获取成长历史失败:', error);
    throw error;
  }
}

// 映射函数
function mapDimensionFromDB(data: any): GrowthDimension {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    currentValue: data.current_value,
    targetValue: data.target_value,
    weight: data.weight,
    taskTypes: data.task_types || [],
    displayOrder: data.display_order,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapGoalFromDB(data: any): LongTermGoal {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    goalType: data.goal_type,
    targetValue: data.target_value,
    currentValue: data.current_value,
    unit: data.unit,
    deadline: data.deadline ? new Date(data.deadline) : undefined,
    relatedDimensions: data.related_dimensions || [],
    milestones: data.milestones || [],
    isActive: data.is_active,
    isCompleted: data.is_completed,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapLevelFromDB(data: any): IdentityLevel {
  return {
    id: data.id,
    userId: data.user_id,
    levelOrder: data.level_order,
    name: data.name,
    description: data.description,
    requiredGrowth: data.required_growth,
    unlockFeatures: data.unlock_features || [],
    themeSettings: data.theme_settings || {},
    icon: data.icon,
    isCurrent: data.is_current,
    unlockedAt: data.unlocked_at ? new Date(data.unlocked_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

