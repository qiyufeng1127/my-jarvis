import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils';
import { supabase, TABLES, isSupabaseConfigured, getCurrentUserId } from '@/lib/supabase';

interface UserState {
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  goldBalance: number; // 金币余额
  
  // Actions
  initializeUser: () => Promise<void>;
  createUser: () => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  logout: () => void;
  
  // 金币管理
  addGold: (amount: number, reason: string) => void;
  deductGold: (amount: number, reason: string) => boolean;
  getGoldBalance: () => number;
}

const defaultSettings: UserSettings = {
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isInitialized: false,
      isLoading: false,
      error: null,
      goldBalance: 1000, // 初始金币

      initializeUser: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const localUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
          
          if (localUserId) {
            // 用户已存在，使用本地数据
            const user: User = {
              id: generateId(),
              localUserId,
              publicData: {},
              deviceList: [],
              settings: defaultSettings,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            set({ user, isInitialized: true, isLoading: false });
            console.log('✅ 用户已初始化（本地模式）');
          } else {
            // 新用户，创建用户
            await get().createUser();
          }
        } catch (error) {
          set({ error: '初始化用户失败', isLoading: false });
          console.error('初始化用户失败:', error);
        }
      },

      createUser: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const localUserId = generateId();
          localStorage.setItem(STORAGE_KEYS.USER_ID, localUserId);
          
          const newUser: User = {
            id: generateId(),
            localUserId,
            publicData: {},
            deviceList: [],
            settings: defaultSettings,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set({ user: newUser, isInitialized: true, isLoading: false });
          console.log('✅ 新用户已创建（本地模式）');
          return newUser;
        } catch (error) {
          set({ error: '创建用户失败', isLoading: false });
          console.error('创建用户失败:', error);
          throw error;
        }
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date(),
          };
          
          set({ user: updatedUser });
          console.log('✅ 用户信息已更新');
        } catch (error) {
          set({ error: '更新用户失败' });
          console.error('更新用户失败:', error);
        }
      },

      updateSettings: async (settings) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const updatedSettings = {
            ...user.settings,
            ...settings,
          };
          
          await get().updateUser({ settings: updatedSettings });
        } catch (error) {
          set({ error: '更新设置失败' });
          console.error('更新设置失败:', error);
        }
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        set({ user: null, isInitialized: false, goldBalance: 1000 });
      },

      // 增加金币
      addGold: (amount, reason) => {
        const { goldBalance } = get();
        const newBalance = goldBalance + amount;
        set({ goldBalance: newBalance });
        
        console.log(`💰 金币增加: +${amount} (${reason}) | 余额: ${newBalance}`);
        
        // TODO: 记录金币交易历史
        // 可以在这里调用 GoldTransaction 相关的 store
      },

      // 扣除金币
      deductGold: (amount, reason) => {
        const { goldBalance } = get();
        
        if (goldBalance < amount) {
          console.warn(`⚠️ 金币不足: 需要${amount}，当前${goldBalance}`);
          return false;
        }
        
        const newBalance = goldBalance - amount;
        set({ goldBalance: newBalance });
        
        console.log(`💸 金币扣除: -${amount} (${reason}) | 余额: ${newBalance}`);
        
        // TODO: 记录金币交易历史
        return true;
      },

      // 获取金币余额
      getGoldBalance: () => {
        return get().goldBalance;
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, goldBalance: state.goldBalance }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch (error) {
            console.warn('读取存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('保存存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('删除存储失败:', error);
          }
        },
      },
    }
  )
);

