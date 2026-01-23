import { supabase, TABLES } from './client';
import type { User, UserSettings } from '@/types';
import { DEFAULT_GROWTH_DIMENSIONS, DEFAULT_IDENTITY_LEVELS, GOLD_CONFIG } from '@/constants';

/**
 * 创建新用户并初始化默认数据
 */
export async function createUser(localUserId: string): Promise<User> {
  try {
    // 1. 创建用户记录
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .insert({
        local_user_id: localUserId,
        public_data: {},
        device_list: [],
        settings: {},
      })
      .select()
      .single();

    if (userError) throw userError;

    const userId = userData.id;

    // 2. 创建默认成长维度
    const dimensionsData = DEFAULT_GROWTH_DIMENSIONS.map((dim) => ({
      user_id: userId,
      name: dim.name,
      description: dim.description,
      icon: dim.icon,
      color: dim.color,
      display_order: dim.displayOrder,
      current_value: 50,
      target_value: 100,
      weight: 1.0,
    }));

    const { error: dimensionsError } = await supabase
      .from(TABLES.GROWTH_DIMENSIONS)
      .insert(dimensionsData);

    if (dimensionsError) throw dimensionsError;

    // 3. 创建默认身份层级
    const levelsData = DEFAULT_IDENTITY_LEVELS.map((level) => ({
      user_id: userId,
      level_order: level.levelOrder,
      name: level.name,
      description: level.description,
      required_growth: level.requiredGrowth,
      icon: level.icon,
      is_current: level.levelOrder === 1,
      unlocked_at: level.levelOrder === 1 ? new Date().toISOString() : null,
    }));

    const { error: levelsError } = await supabase
      .from(TABLES.IDENTITY_LEVELS)
      .insert(levelsData);

    if (levelsError) throw levelsError;

    // 4. 创建默认坏习惯追踪
    const habitsData = [
      { user_id: userId, habit_type: 'procrastination', custom_name: '拖延', detection_rules: { delayThreshold: 5 } },
      { user_id: userId, habit_type: 'stay_up_late', custom_name: '熬夜', detection_rules: { bedtime: '23:00' } },
      { user_id: userId, habit_type: 'wake_up_late', custom_name: '起床晚', detection_rules: { wakeTime: '08:00' } },
      { user_id: userId, habit_type: 'low_efficiency', custom_name: '低效率', detection_rules: { efficiencyThreshold: 0.5 } },
    ];

    const { error: habitsError } = await supabase
      .from(TABLES.BAD_HABITS)
      .insert(habitsData);

    if (habitsError) throw habitsError;

    // 5. 初始化金币余额
    const { error: goldError } = await supabase
      .from(TABLES.GOLD_TRANSACTIONS)
      .insert({
        user_id: userId,
        amount: GOLD_CONFIG.INITIAL_GOLD,
        transaction_type: 'bonus',
        category: 'welcome',
        description: '欢迎奖励',
        balance_after: GOLD_CONFIG.INITIAL_GOLD,
      });

    if (goldError) throw goldError;

    return {
      id: userData.id,
      localUserId: userData.local_user_id,
      publicData: userData.public_data || {},
      deviceList: userData.device_list || [],
      settings: userData.settings || {},
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

/**
 * 根据本地用户ID获取用户信息
 */
export async function getUserByLocalId(localUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('local_user_id', localUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 未找到
      throw error;
    }

    return {
      id: data.id,
      localUserId: data.local_user_id,
      syncCode: data.sync_code,
      syncCodeExpiresAt: data.sync_code_expires_at ? new Date(data.sync_code_expires_at) : undefined,
      verificationCode: data.verification_code,
      encryptedData: data.encrypted_data,
      publicData: data.public_data || {},
      deviceList: data.device_list || [],
      settings: data.settings || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('获取用户失败:', error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({
        sync_code: updates.syncCode,
        sync_code_expires_at: updates.syncCodeExpiresAt?.toISOString(),
        verification_code: updates.verificationCode,
        encrypted_data: updates.encryptedData,
        public_data: updates.publicData,
        device_list: updates.deviceList,
        settings: updates.settings,
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

/**
 * 更新用户设置
 */
export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
  try {
    // 先获取当前设置
    const { data: userData, error: fetchError } = await supabase
      .from(TABLES.USERS)
      .select('settings')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // 合并设置
    const updatedSettings = {
      ...userData.settings,
      ...settings,
    };

    // 更新设置
    const { error: updateError } = await supabase
      .from(TABLES.USERS)
      .update({ settings: updatedSettings })
      .eq('id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('更新用户设置失败:', error);
    throw error;
  }
}

/**
 * 生成同步码
 */
export async function generateSyncCode(userId: string): Promise<{ syncCode: string; verificationCode: string }> {
  try {
    const syncCode = generateRandomCode(12);
    const verificationCode = generateRandomCode(6, true);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72小时后过期

    const { error } = await supabase
      .from(TABLES.USERS)
      .update({
        sync_code: syncCode,
        verification_code: verificationCode,
        sync_code_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return { syncCode, verificationCode };
  } catch (error) {
    console.error('生成同步码失败:', error);
    throw error;
  }
}

/**
 * 验证同步码
 */
export async function verifySyncCode(
  syncCode: string,
  verificationCode: string
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('sync_code', syncCode)
      .eq('verification_code', verificationCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // 检查是否过期
    if (data.sync_code_expires_at) {
      const expiresAt = new Date(data.sync_code_expires_at);
      if (expiresAt < new Date()) {
        return null; // 已过期
      }
    }

    // 使用后清除同步码
    await supabase
      .from(TABLES.USERS)
      .update({
        sync_code: null,
        verification_code: null,
        sync_code_expires_at: null,
      })
      .eq('id', data.id);

    return {
      id: data.id,
      localUserId: data.local_user_id,
      publicData: data.public_data || {},
      deviceList: data.device_list || [],
      settings: data.settings || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error) {
    console.error('验证同步码失败:', error);
    throw error;
  }
}

/**
 * 生成随机码
 */
function generateRandomCode(length: number, numbersOnly: boolean = false): string {
  const chars = numbersOnly ? '0123456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

