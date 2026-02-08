import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BadHabit {
  id: string;
  name: string;
  description?: string;
  severity: number; // 1-5星
  triggerScenarios: string[]; // 触发场景
  occurrences: BadHabitOccurrence[]; // 发生记录
  createdAt: Date;
  updatedAt: Date;
}

export interface BadHabitOccurrence {
  id: string;
  habitId: string;
  occurredAt: Date;
  context?: string; // 发生时的情境
  emotion?: string; // 当时的情绪
  notes?: string; // 备注
}

interface BadHabitState {
  habits: BadHabit[];
  isLoading: boolean;
  
  // Actions
  loadHabits: () => void;
  createHabit: (habit: Partial<BadHabit>) => BadHabit;
  updateHabit: (id: string, updates: Partial<BadHabit>) => void;
  deleteHabit: (id: string) => void;
  recordOccurrence: (habitId: string, occurrence: Partial<BadHabitOccurrence>) => void;
  
  // Queries
  getHabitById: (id: string) => BadHabit | undefined;
  getRecentOccurrences: (days: number) => BadHabitOccurrence[];
  getHabitScore: () => number; // 0-100，越高越差
}

export const useBadHabitStore = create<BadHabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      isLoading: false,

      loadHabits: () => {
        console.log('📦 使用本地存储的坏习惯数据');
      },

      createHabit: (habitData) => {
        const newHabit: BadHabit = {
          id: `habit-${Date.now()}`,
          name: habitData.name || '',
          description: habitData.description,
          severity: habitData.severity || 3,
          triggerScenarios: habitData.triggerScenarios || [],
          occurrences: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set({
          habits: [...get().habits, newHabit],
        });
        
        console.log('⚠️ 坏习惯已创建:', newHabit.name);
        return newHabit;
      },

      updateHabit: (id, updates) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: new Date() } : h
          ),
        });
        console.log('✅ 坏习惯已更新:', id);
      },

      deleteHabit: (id) => {
        set({ habits: get().habits.filter((h) => h.id !== id) });
        console.log('🗑️ 坏习惯已删除:', id);
      },

      recordOccurrence: (habitId, occurrenceData) => {
        const habit = get().habits.find((h) => h.id === habitId);
        if (!habit) return;

        const newOccurrence: BadHabitOccurrence = {
          id: `occurrence-${Date.now()}`,
          habitId,
          occurredAt: new Date(),
          context: occurrenceData.context,
          emotion: occurrenceData.emotion,
          notes: occurrenceData.notes,
        };

        const updatedHabit = {
          ...habit,
          occurrences: [...habit.occurrences, newOccurrence],
          updatedAt: new Date(),
        };

        set({
          habits: get().habits.map((h) => (h.id === habitId ? updatedHabit : h)),
        });

        console.log('📝 坏习惯发生记录已添加:', habit.name);
      },

      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      getRecentOccurrences: (days) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const allOccurrences: BadHabitOccurrence[] = [];
        get().habits.forEach((habit) => {
          habit.occurrences.forEach((occ) => {
            if (new Date(occ.occurredAt) >= cutoffDate) {
              allOccurrences.push(occ);
            }
          });
        });

        return allOccurrences.sort(
          (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
      },

      getHabitScore: () => {
        const habits = get().habits;
        if (habits.length === 0) return 0;

        // 计算最近7天的坏习惯发生次数
        const recentOccurrences = get().getRecentOccurrences(7);
        
        // 基础分数：根据坏习惯数量
        let score = Math.min(habits.length * 10, 30);

        // 根据最近发生次数增加分数
        score += Math.min(recentOccurrences.length * 5, 40);

        // 根据严重程度加权
        const avgSeverity = habits.reduce((sum, h) => sum + h.severity, 0) / habits.length;
        score += avgSeverity * 6;

        return Math.min(Math.round(score), 100);
      },
    }),
    {
      name: 'manifestos-bad-habits-storage',
      version: 1,
      partialize: (state) => ({
        habits: state.habits,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.habits) {
              parsed.state.habits = parsed.state.habits.map((habit: any) => ({
                ...habit,
                createdAt: new Date(habit.createdAt),
                updatedAt: new Date(habit.updatedAt),
                occurrences: habit.occurrences.map((occ: any) => ({
                  ...occ,
                  occurredAt: new Date(occ.occurredAt),
                })),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取坏习惯存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 坏习惯数据已保存到本地存储');
          } catch (error) {
            console.error('❌ 保存坏习惯存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除坏习惯存储失败:', error);
          }
        },
      },
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并坏习惯数据...');
        return {
          ...currentState,
          habits: persistedState?.habits || currentState.habits,
        };
      },
    }
  )
);

