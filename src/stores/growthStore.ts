import { create } from 'zustand';
import type { GrowthDimension, LongTermGoal, IdentityLevel } from '@/types';

interface GrowthState {
  dimensions: GrowthDimension[];
  goals: LongTermGoal[];
  levels: IdentityLevel[];
  currentLevel: IdentityLevel | null;
  totalGrowth: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadGrowthData: () => Promise<void>;
  updateDimension: (id: string, value: number) => Promise<void>;
  updateGoalProgress: (id: string, value: number) => Promise<void>;
  checkLevelUp: () => Promise<void>;
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  dimensions: [],
  goals: [],
  levels: [],
  currentLevel: null,
  totalGrowth: 0,
  isLoading: false,
  error: null,

  loadGrowthData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: 从 Supabase 加载成长数据
      set({ isLoading: false });
    } catch (error) {
      set({ error: '加载成长数据失败', isLoading: false });
      console.error('加载成长数据失败:', error);
    }
  },

  updateDimension: async (id, value) => {
    try {
      // TODO: 更新到 Supabase 并记录历史
      
      set((state) => ({
        dimensions: state.dimensions.map((d) =>
          d.id === id ? { ...d, currentValue: value, updatedAt: new Date() } : d
        ),
      }));
      
      // 检查是否升级
      await get().checkLevelUp();
    } catch (error) {
      set({ error: '更新维度失败' });
      console.error('更新维度失败:', error);
    }
  },

  updateGoalProgress: async (id, value) => {
    try {
      // TODO: 更新到 Supabase
      
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, currentValue: value, updatedAt: new Date() } : g
        ),
      }));
    } catch (error) {
      set({ error: '更新目标进度失败' });
      console.error('更新目标进度失败:', error);
    }
  },

  checkLevelUp: async () => {
    const { totalGrowth, levels, currentLevel } = get();
    
    // 找到应该达到的等级
    const nextLevel = levels
      .filter((l) => l.requiredGrowth <= totalGrowth)
      .sort((a, b) => b.requiredGrowth - a.requiredGrowth)[0];
    
    if (nextLevel && nextLevel.id !== currentLevel?.id) {
      // 升级！
      set({ currentLevel: nextLevel });
      
      // TODO: 触发升级动画和奖励
      console.log('恭喜升级！', nextLevel.name);
    }
  },
}));

