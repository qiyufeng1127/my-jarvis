import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LongTermGoal, GoalType } from '@/types';

interface GoalState {
  goals: LongTermGoal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadGoals: () => void;
  createGoal: (goal: Partial<LongTermGoal>) => LongTermGoal;
  updateGoal: (id: string, updates: Partial<LongTermGoal>) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (id: string, value: number) => void;
  
  // Queries
  getActiveGoals: () => LongTermGoal[];
  getGoalById: (id: string) => LongTermGoal | undefined;
  
  // AI智能匹配
  findMatchingGoals: (taskDescription: string, keywords: string[]) => LongTermGoal[];
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: () => {
    // 纯本地模式，persist 会自动加载
    console.log('📦 使用本地存储的目标');
  },

  createGoal: (goalData) => {
    const userId = 'local-user';
    const newGoal: LongTermGoal = {
      id: `goal-${Date.now()}`,
      userId,
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
    
    set({
      goals: [...get().goals, newGoal],
    });
    
    console.log('🎯 目标已创建:', newGoal.name);
    return newGoal;
  },

  updateGoal: (id, updates) => {
    const updatedGoal = {
      ...get().goals.find((g) => g.id === id),
      ...updates,
      updatedAt: new Date(),
    } as LongTermGoal;
    
    set({
      goals: get().goals.map((g) => (g.id === id ? updatedGoal : g)),
    });
    
    console.log('✅ 目标已更新:', id);
  },

  deleteGoal: (id) => {
    set({ goals: get().goals.filter((g) => g.id !== id) });
    console.log('🗑️ 目标已删除:', id);
  },

  updateGoalProgress: (id, value) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;
    
    const isCompleted = value >= (goal.targetValue || 0);
    const updates = {
      currentValue: value,
      isCompleted,
      completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
    };
    
    get().updateGoal(id, updates);
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
    }),
    {
      name: 'manifestos-goals-storage', // 使用唯一的存储 key
      version: 1, // 添加版本号
      partialize: (state) => ({ 
        goals: state.goals, // 只持久化 goals
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.goals) {
              parsed.state.goals = parsed.state.goals.map((goal: any) => ({
                ...goal,
                deadline: goal.deadline ? new Date(goal.deadline) : undefined,
                completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined,
                createdAt: new Date(goal.createdAt),
                updatedAt: new Date(goal.updatedAt),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取目标存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 目标数据已保存到本地存储，共', value?.state?.goals?.length || 0, '个目标');
          } catch (error) {
            console.error('❌ 保存目标存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除目标存储失败:', error);
          }
        },
      },
      // 合并策略：保留本地数据
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并目标数据...');
        return {
          ...currentState,
          goals: persistedState?.goals || currentState.goals,
        };
      },
    }
  )
);

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

