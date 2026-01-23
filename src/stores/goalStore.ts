import { create } from 'zustand';
import type { LongTermGoal, GoalType } from '@/types';

interface GoalState {
  goals: LongTermGoal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadGoals: () => Promise<void>;
  createGoal: (goal: Partial<LongTermGoal>) => Promise<LongTermGoal>;
  updateGoal: (id: string, updates: Partial<LongTermGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoalProgress: (id: string, value: number) => Promise<void>;
  
  // Queries
  getActiveGoals: () => LongTermGoal[];
  getGoalById: (id: string) => LongTermGoal | undefined;
  
  // AI智能匹配
  findMatchingGoals: (taskDescription: string, keywords: string[]) => LongTermGoal[];
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // TODO: 从 Supabase 加载目标
      // 暂时使用本地存储
      const savedGoals = localStorage.getItem('long_term_goals');
      if (savedGoals) {
        const goals = JSON.parse(savedGoals).map((g: any) => ({
          ...g,
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          completedAt: g.completedAt ? new Date(g.completedAt) : undefined,
          createdAt: new Date(g.createdAt),
          updatedAt: new Date(g.updatedAt),
        }));
        set({ goals, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: '加载目标失败', isLoading: false });
      console.error('加载目标失败:', error);
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newGoal: LongTermGoal = {
        id: `goal-${Date.now()}`,
        userId: 'local-user', // TODO: 从 userStore 获取
        name: goalData.name || '',
        description: goalData.description || '',
        goalType: goalData.goalType || 'numeric',
        targetValue: goalData.targetValue,
        currentValue: goalData.currentValue || 0,
        unit: goalData.unit,
        deadline: goalData.deadline,
        relatedDimensions: goalData.relatedDimensions || [],
        milestones: goalData.milestones || [],
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedGoals = [...get().goals, newGoal];
      
      // 保存到本地存储
      localStorage.setItem('long_term_goals', JSON.stringify(updatedGoals));
      
      set({
        goals: updatedGoals,
        isLoading: false,
      });
      
      return newGoal;
    } catch (error) {
      set({ error: '创建目标失败', isLoading: false });
      console.error('创建目标失败:', error);
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const updatedGoals = get().goals.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g
      );
      
      localStorage.setItem('long_term_goals', JSON.stringify(updatedGoals));
      
      set({ goals: updatedGoals });
    } catch (error) {
      set({ error: '更新目标失败' });
      console.error('更新目标失败:', error);
    }
  },

  deleteGoal: async (id) => {
    try {
      const updatedGoals = get().goals.filter((g) => g.id !== id);
      
      localStorage.setItem('long_term_goals', JSON.stringify(updatedGoals));
      
      set({ goals: updatedGoals });
    } catch (error) {
      set({ error: '删除目标失败' });
      console.error('删除目标失败:', error);
    }
  },

  updateGoalProgress: async (id, value) => {
    try {
      const updatedGoals = get().goals.map((g) => {
        if (g.id === id) {
          const isCompleted = value >= (g.targetValue || 0);
          return {
            ...g,
            currentValue: value,
            isCompleted,
            completedAt: isCompleted && !g.completedAt ? new Date() : g.completedAt,
            updatedAt: new Date(),
          };
        }
        return g;
      });
      
      localStorage.setItem('long_term_goals', JSON.stringify(updatedGoals));
      
      set({ goals: updatedGoals });
    } catch (error) {
      set({ error: '更新目标进度失败' });
      console.error('更新目标进度失败:', error);
    }
  },

  getActiveGoals: () => {
    return get().goals.filter((g) => g.isActive && !g.isCompleted);
  },

  getGoalById: (id) => {
    return get().goals.find((g) => g.id === id);
  },

  findMatchingGoals: (taskDescription, keywords) => {
    const goals = get().getActiveGoals();
    const searchText = `${taskDescription} ${keywords.join(' ')}`.toLowerCase();
    
    // 智能匹配算法
    return goals.filter((goal) => {
      const goalText = `${goal.name} ${goal.description}`.toLowerCase();
      
      // 检查关键词匹配
      const goalKeywords = goalText.split(/\s+/);
      const matchCount = keywords.filter((keyword) =>
        goalKeywords.some((gk) => gk.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(gk))
      ).length;
      
      // 检查直接文本匹配
      const directMatch = goalText.includes(taskDescription.toLowerCase()) ||
                         taskDescription.toLowerCase().includes(goal.name.toLowerCase());
      
      return matchCount > 0 || directMatch;
    }).sort((a, b) => {
      // 按匹配度排序
      const aScore = calculateMatchScore(a, searchText);
      const bScore = calculateMatchScore(b, searchText);
      return bScore - aScore;
    });
  },
}));

// 计算匹配分数
function calculateMatchScore(goal: LongTermGoal, searchText: string): number {
  const goalText = `${goal.name} ${goal.description}`.toLowerCase();
  let score = 0;
  
  // 名称完全匹配
  if (searchText.includes(goal.name.toLowerCase())) {
    score += 10;
  }
  
  // 描述匹配
  if (goal.description && searchText.includes(goal.description.toLowerCase())) {
    score += 5;
  }
  
  // 关键词匹配
  const searchWords = searchText.split(/\s+/);
  const goalWords = goalText.split(/\s+/);
  
  searchWords.forEach((sw) => {
    goalWords.forEach((gw) => {
      if (sw.length > 2 && gw.length > 2) {
        if (sw === gw) score += 3;
        else if (sw.includes(gw) || gw.includes(sw)) score += 1;
      }
    });
  });
  
  return score;
}

