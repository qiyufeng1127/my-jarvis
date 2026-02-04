import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
  // 是否是首次使用
  isFirstTime: boolean;
  
  // 已完成的引导
  completedOnboarding: string[];
  
  // 是否显示用户指南
  showUserGuide: boolean;
  
  // 当前激活的引导
  activeOnboarding: string | null;
  
  // Actions
  setFirstTime: (isFirst: boolean) => void;
  completeOnboarding: (id: string) => void;
  setShowUserGuide: (show: boolean) => void;
  setActiveOnboarding: (id: string | null) => void;
  resetTutorial: () => void;
  
  // 检查是否需要显示引导
  shouldShowOnboarding: (id: string) => boolean;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      isFirstTime: true,
      completedOnboarding: [],
      showUserGuide: false,
      activeOnboarding: null,

      setFirstTime: (isFirst) => set({ isFirstTime: isFirst }),

      completeOnboarding: (id) => {
        const { completedOnboarding } = get();
        if (!completedOnboarding.includes(id)) {
          set({ 
            completedOnboarding: [...completedOnboarding, id],
            activeOnboarding: null,
          });
        }
      },

      setShowUserGuide: (show) => set({ showUserGuide: show }),

      setActiveOnboarding: (id) => set({ activeOnboarding: id }),

      resetTutorial: () => set({
        isFirstTime: true,
        completedOnboarding: [],
        showUserGuide: false,
        activeOnboarding: null,
      }),

      shouldShowOnboarding: (id) => {
        const { completedOnboarding, isFirstTime } = get();
        return isFirstTime && !completedOnboarding.includes(id);
      },
    }),
    {
      name: 'tutorial-storage',
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

