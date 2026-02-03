import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nucvylmszllecoupjfbh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Y3Z5bG1zemxsZWNvdXBqZmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTU3MTksImV4cCI6MjA4MzA5MTcxOX0.RJHmvesPdQWe-vYxxVjK_yLJ9PvpFc07S6p_ecnuT9o';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
});

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  TASKS: 'tasks',
  GOALS: 'long_term_goals',
  MEMORIES: 'memories',
  JOURNALS: 'journals',
  GROWTH_RECORDS: 'growth_records',
  NOTIFICATIONS: 'notifications',
} as const;

// 检查 Supabase 是否已配置
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// 验证 UUID 格式
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// 获取当前用户 ID（同步）
export const getCurrentUserId = (): string => {
  // 优先使用 Supabase Auth 的用户 ID
  const authUserId = localStorage.getItem('supabase.auth.token');
  if (authUserId) {
    try {
      const authData = JSON.parse(authUserId);
      if (authData?.currentSession?.user?.id) {
        console.log('✅ 使用 Supabase Auth 用户 ID:', authData.currentSession.user.id);
        return authData.currentSession.user.id;
      }
    } catch (e) {
      // 解析失败，继续使用本地 ID
    }
  }
  
  // 如果没有 Auth 用户，使用本地 ID
  let localUserId = localStorage.getItem('manifestos_user_id');
  
  // 如果没有用户 ID 或格式不正确，生成一个新的 UUID
  if (!localUserId || !isValidUUID(localUserId)) {
    localUserId = crypto.randomUUID();
    localStorage.setItem('manifestos_user_id', localUserId);
    console.log('✅ 生成新的本地用户 ID:', localUserId);
  }
  
  return localUserId;
};

// 获取当前认证用户 ID（异步，推荐使用）
export const getAuthUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      console.log('✅ 获取到认证用户 ID:', session.user.id);
      return session.user.id;
    }
    return null;
  } catch (error) {
    console.error('❌ 获取认证用户 ID 失败:', error);
    return null;
  }
};

// 确保用户在 Supabase 中存在 - 简化版，不抛出错误
export const ensureUserExists = async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase 未配置');
    return false;
  }
  
  try {
    // 1. 先检查用户是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('local_user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ 检查用户失败:', checkError);
      return false;
    }
    
    if (existingUser) {
      console.log('✅ 用户已存在');
      return true;
    }
    
    // 2. 用户不存在，创建新用户
    const { error: insertError } = await supabase.from(TABLES.USERS).insert({
      local_user_id: userId,
      public_data: {},
      device_list: [],
      settings: {
        goldRewardMultiplier: 1.0,
        taskTypeCoefficients: {
          work: 1.2,
          learning: 1.5,
          sport: 1.0,
          life: 0.8,
          creative: 1.3,
          social: 0.9,
          rest: 0.5,
        },
      },
    });
    
    if (insertError) {
      // 如果是唯一性冲突（用户已存在），也算成功
      if (insertError.code === '23505') {
        console.log('✅ 用户已存在（并发创建）');
        return true;
      }
      console.error('❌ 创建用户失败:', insertError);
      return false;
    }
    
    console.log('✅ 用户创建成功');
    return true;
  } catch (error) {
    console.error('❌ ensureUserExists 异常:', error);
    return false;
  }
};
