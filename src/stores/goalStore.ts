import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LongTermGoal, GoalType } from '@/types';
import { supabase, TABLES, isSupabaseConfigured, getCurrentUserId } from '@/lib/supabase';

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

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  loadGoals: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (isSupabaseConfigured()) {
        // 获取当前登录用户
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('⚠️ 未登录，使用本地数据');
          set({ isLoading: false });
          return;
        }
        
        const userId = session.user.id;
        const { data, error } = await supabase
          .from(TABLES.GOALS)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const goals: LongTermGoal[] = (data || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          goalType: row.goal_type,
          targetValue: row.target_value,
          currentValue: row.current_value,
          unit: row.unit,
          deadline: row.deadline ? new Date(row.deadline) : undefined,
          relatedDimensions: row.related_dimensions || [],
          milestones: row.milestones || [],
          isActive: row.is_active,
          isCompleted: row.is_completed,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));
        
        set({ goals, isLoading: false });
      } else {
        // 从 localStorage 加载（离线模式）
        const savedGoals = localStorage.getItem('goals-storage');
        if (savedGoals) {
          const parsed = JSON.parse(savedGoals);
          const goals = (parsed.state?.goals || []).map((g: any) => ({
            ...g,
            deadline: g.deadline ? new Date(g.deadline) : undefined,
            completedAt: g.completedAt ? new Date(g.completedAt) : undefined,
            createdAt: new Date(g.createdAt),
            updatedAt: new Date(g.updatedAt),
          }));
          set({ goals, isLoading: false });
        } else {
          set({ goals: [], isLoading: false });
        }
      }
    } catch (error) {
      set({ error: '加载目标失败', isLoading: false });
      console.error('加载目标失败:', error);
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    
    try {
      // 获取当前登录用户
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('未登录');
      }
      const userId = session.user.id;
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
      
      // 先添加到本地状态
      set({
        goals: [...get().goals, newGoal],
        isLoading: false,
      });
      
      // 保存到 Supabase（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from(TABLES.GOALS).insert({
          id: newGoal.id,
          user_id: newGoal.userId,
          name: newGoal.name,
          description: newGoal.description,
          goal_type: newGoal.goalType,
          target_value: newGoal.targetValue,
          current_value: newGoal.currentValue,
          unit: newGoal.unit,
          deadline: newGoal.deadline?.toISOString(),
          related_dimensions: newGoal.relatedDimensions,
          milestones: newGoal.milestones,
          is_active: newGoal.isActive,
          is_completed: newGoal.isCompleted,
        });
        
        if (error) {
          console.warn('⚠️ 目标创建云端同步失败:', error);
        } else {
          console.log('✅ 目标已同步到云端');
        }
      }
      
      return newGoal;
    } catch (error) {
      set({ error: '创建目标失败', isLoading: false });
      console.error('创建目标失败:', error);
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const updatedGoal = {
        ...get().goals.find((g) => g.id === id),
        ...updates,
        updatedAt: new Date(),
      } as LongTermGoal;
      
      // 先更新本地状态
      set({
        goals: get().goals.map((g) => (g.id === id ? updatedGoal : g)),
      });
      
      // 更新到 Supabase（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.GOALS)
          .update({
            name: updatedGoal.name,
            description: updatedGoal.description,
            goal_type: updatedGoal.goalType,
            target_value: updatedGoal.targetValue,
            current_value: updatedGoal.currentValue,
            unit: updatedGoal.unit,
            deadline: updatedGoal.deadline?.toISOString(),
            related_dimensions: updatedGoal.relatedDimensions,
            milestones: updatedGoal.milestones,
            is_active: updatedGoal.isActive,
            is_completed: updatedGoal.isCompleted,
            completed_at: updatedGoal.completedAt?.toISOString(),
            updated_at: updatedGoal.updatedAt.toISOString(),
          })
          .eq('id', id);
        
        if (error) {
          console.warn('⚠️ 目标更新云端同步失败:', error);
        } else {
          console.log('✅ 目标更新已同步到云端');
        }
      }
    } catch (error) {
      set({ error: '更新目标失败' });
      console.error('更新目标失败:', error);
    }
  },

  deleteGoal: async (id) => {
    try {
      // 先从本地删除
      set({ goals: get().goals.filter((g) => g.id !== id) });
      
      // 从 Supabase 删除（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.GOALS)
          .delete()
          .eq('id', id);
        
        if (error) {
          console.warn('⚠️ 目标删除云端同步失败:', error);
        } else {
          console.log('✅ 目标删除已同步到云端');
        }
      }
    } catch (error) {
      set({ error: '删除目标失败' });
      console.error('删除目标失败:', error);
    }
  },

  updateGoalProgress: async (id, value) => {
    try {
      const goal = get().goals.find((g) => g.id === id);
      if (!goal) return;
      
      const isCompleted = value >= (goal.targetValue || 0);
      const updates = {
        currentValue: value,
        isCompleted,
        completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
      };
      
      await get().updateGoal(id, updates);
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

