import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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

// 获取当前用户 ID（本地或云端）
export const getCurrentUserId = () => {
  const localUserId = localStorage.getItem('user_id');
  return localUserId || 'anonymous';
};

