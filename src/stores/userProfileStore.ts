import { create } from 'zustand';
import { UserProfileService, type UserProfile } from '@/services/userProfileService';

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // 头像设置
  userAvatar: string;
  aiAvatar: string;
  
  // Actions
  initializeProfile: () => Promise<void>;
  updateProfile: () => Promise<void>;
  getProfile: () => UserProfile | null;
  setUserAvatar: (avatar: string) => void;
  setAIAvatar: (avatar: string) => void;
  
  // Getters
  getUnderstandingLevel: () => number;
  getUnderstandingStage: () => string;
  getUsageDays: () => number;
}

/**
 * 用户画像 Store
 */
export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isInitialized: false,
  
  // 默认头像
  userAvatar: localStorage.getItem('userAvatar') || '👤',
  aiAvatar: localStorage.getItem('aiAvatar') || '🤖',

  // 初始化用户画像
  initializeProfile: async () => {
    set({ isLoading: true });
    
    try {
      let profile = UserProfileService.getUserProfile();
      
      if (!profile) {
        profile = UserProfileService.initializeProfile();
        console.log('✅ 用户画像初始化完成');
      } else {
        console.log('✅ 用户画像已存在，使用天数:', profile.usageDays);
      }
      
      set({ profile, isInitialized: true });
    } catch (error) {
      console.error('❌ 用户画像初始化失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 更新用户画像
  updateProfile: async () => {
    set({ isLoading: true });
    
    try {
      const profile = await UserProfileService.updateProfile();
      set({ profile });
      console.log('✅ 用户画像更新完成，了解度:', profile.understandingLevel + '%');
    } catch (error) {
      console.error('❌ 用户画像更新失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取用户画像
  getProfile: () => {
    return get().profile;
  },

  // 设置用户头像
  setUserAvatar: (avatar: string) => {
    localStorage.setItem('userAvatar', avatar);
    set({ userAvatar: avatar });
  },

  // 设置AI头像
  setAIAvatar: (avatar: string) => {
    localStorage.setItem('aiAvatar', avatar);
    set({ aiAvatar: avatar });
  },

  // 获取了解度
  getUnderstandingLevel: () => {
    return get().profile?.understandingLevel || 0;
  },

  // 获取了解度阶段
  getUnderstandingStage: () => {
    return get().profile?.understandingStage || '初识阶段';
  },

  // 获取使用天数
  getUsageDays: () => {
    return get().profile?.usageDays || 0;
  },
}));

// 自动初始化用户画像
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useUserProfileStore.getState().initializeProfile();
  }, 0);
}


