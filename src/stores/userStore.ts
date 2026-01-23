import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils';

interface UserState {
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeUser: () => Promise<void>;
  createUser: () => Promise<User>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  logout: () => void;
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

      initializeUser: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const localUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
          
          if (localUserId) {
            // 用户已存在，加载用户数据
            // TODO: 从 Supabase 加载用户数据
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
          
          // TODO: 保存到 Supabase 并初始化默认数据
          
          set({ user: newUser, isInitialized: true, isLoading: false });
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
          
          // TODO: 更新到 Supabase
          
          set({ user: updatedUser });
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
        set({ user: null, isInitialized: false });
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

