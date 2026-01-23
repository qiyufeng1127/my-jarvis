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
        // 从 Supabase 加载目标
        const userId = getCurrentUserId();
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
      const userId = getCurrentUserId();
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
        
        if (error) throw error;
      }
      
      set({
        goals: [...get().goals, newGoal],
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
      const updatedGoal = {
        ...get().goals.find((g) => g.id === id),
        ...updates,
        updatedAt: new Date(),
      } as LongTermGoal;
      
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
        
        if (error) throw error;
      }
      
      set({
        goals: get().goals.map((g) => (g.id === id ? updatedGoal : g)),
      });
    } catch (error) {
      set({ error: '更新目标失败' });
      console.error('更新目标失败:', error);
    }
  },

  deleteGoal: async (id) => {
    try {
      // 从 Supabase 删除（如果已配置）
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from(TABLES.GOALS)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      set({ goals: get().goals.filter((g) => g.id !== id) });
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
      name: 'goals-storage',
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

