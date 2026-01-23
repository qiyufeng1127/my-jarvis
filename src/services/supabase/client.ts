import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量配置');
}

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
  GROWTH_DIMENSIONS: 'growth_dimensions',
  LONG_TERM_GOALS: 'long_term_goals',
  IDENTITY_LEVELS: 'identity_levels',
  BAD_HABITS: 'bad_habits',
  BAD_HABIT_OCCURRENCES: 'bad_habit_occurrences',
  GOLD_TRANSACTIONS: 'gold_transactions',
  GROWTH_HISTORY: 'growth_history',
  SYNC_LOGS: 'sync_logs',
  REWARD_STORE: 'reward_store',
  REWARD_REDEMPTIONS: 'reward_redemptions',
  ACHIEVEMENTS: 'achievements',
} as const;

