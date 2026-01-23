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

// 验证 UUID 格式
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// 确保用户在 Supabase 中存在
const ensureUserExists = async (userId: string) => {
  if (!isSupabaseConfigured()) return;
  
  try {
    // 使用 upsert 代替 insert，如果用户已存在则更新，不存在则创建
    const { error } = await supabase.from(TABLES.USERS).upsert({
      id: userId,
      local_user_id: userId,
      public_data: {},
      device_list: [],
      settings: {
        verificationStrictness: 'medium',
        enableProgressCheck: true,
        goldRewardMultiplier: 1.0,
        goldPenaltyMultiplier: 1.0,
        enableNotifications: true,
        notificationTimes: ['09:00', '14:00', '21:00'],
        quietHours: { start: '22:00', end: '08:00' },
        theme: 'auto',
        primaryColor: '#991B1B',
        fontSize: 'medium',
        voiceType: 'default',
        voiceSpeed: 1.0,
        wakeWordSensitivity: 0.8,
        autoSync: true,
        syncInterval: 5,
        syncPhotos: false,
      },
    }, {
      onConflict: 'id', // 如果 id 冲突，则更新
      ignoreDuplicates: false, // 不忽略重复，而是更新
    });
    
    if (error) {
      console.error('确保用户存在失败:', error);
    } else {
      console.log('✅ 用户已确保存在于 Supabase:', userId);
    }
  } catch (error) {
    console.error('确保用户存在失败:', error);
  }
};

// 获取当前用户 ID（本地或云端）
export const getCurrentUserId = () => {
  let localUserId = localStorage.getItem('manifestos_user_id');
  
  // 如果没有用户 ID 或格式不正确，生成一个新的 UUID
  if (!localUserId || !isValidUUID(localUserId)) {
    localUserId = crypto.randomUUID();
    localStorage.setItem('manifestos_user_id', localUserId);
    console.log('✅ 生成新的用户 ID:', localUserId);
    
    // 异步确保用户在 Supabase 中存在
    ensureUserExists(localUserId);
  } else {
    // 即使用户 ID 存在，也要确保在 Supabase 中有记录
    ensureUserExists(localUserId);
  }
  
  return localUserId;
};

