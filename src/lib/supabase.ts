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

// 用户创建 Promise 缓存，避免重复创建
const userCreationPromises = new Map<string, Promise<void>>();

// 确保用户在 Supabase 中存在（异步，返回 Promise）
export const ensureUserExists = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  
  // 如果已经有正在进行的创建请求，直接返回该 Promise
  if (userCreationPromises.has(userId)) {
    return userCreationPromises.get(userId)!;
  }
  
  const promise = (async () => {
    try {
      const defaultSettings = {
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
      };
      
      // 使用 upsert，以 local_user_id 作为冲突键
      const { error } = await supabase.from(TABLES.USERS).upsert({
        id: userId,
        local_user_id: userId,
        public_data: {},
        device_list: [],
        settings: defaultSettings,
      }, {
        onConflict: 'local_user_id',
        ignoreDuplicates: true,
      });
      
      if (error) {
        // 如果失败，尝试用 id 作为冲突键
        const { error: error2 } = await supabase.from(TABLES.USERS).upsert({
          id: userId,
          local_user_id: userId,
          public_data: {},
          device_list: [],
          settings: defaultSettings,
        }, {
          onConflict: 'id',
          ignoreDuplicates: true,
        });
        
        if (error2) {
          console.error('确保用户存在失败:', error2);
          throw error2;
        }
      }
      
      console.log('✅ 用户已确保存在于 Supabase:', userId);
    } catch (error) {
      console.error('确保用户存在失败:', error);
      throw error;
    } finally {
      // 完成后从缓存中移除
      userCreationPromises.delete(userId);
    }
  })();
  
  userCreationPromises.set(userId, promise);
  return promise;
};

// 获取当前用户 ID（同步）
export const getCurrentUserId = (): string => {
  let localUserId = localStorage.getItem('manifestos_user_id');
  
  // 如果没有用户 ID 或格式不正确，生成一个新的 UUID
  if (!localUserId || !isValidUUID(localUserId)) {
    localUserId = crypto.randomUUID();
    localStorage.setItem('manifestos_user_id', localUserId);
    console.log('✅ 生成新的用户 ID:', localUserId);
  }
  
  return localUserId;
};

