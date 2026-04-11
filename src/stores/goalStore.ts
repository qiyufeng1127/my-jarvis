import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LongTermGoal } from '@/types';

interface GoalState {
  goals: LongTermGoal[];
  isLoading: boolean;
  error: string | null;

  loadGoals: () => void;
  createGoal: (goal: Partial<LongTermGoal>) => LongTermGoal;
  updateGoal: (id: string, updates: Partial<LongTermGoal>) => void;
  deleteGoal: (id: string) => void;
  updateGoalProgress: (id: string, value: number) => void;

  getActiveGoals: () => LongTermGoal[];
  getGoalById: (id: string) => LongTermGoal | undefined;
  findMatchingGoals: (taskDescription: string, keywords: string[]) => LongTermGoal[];
}

const defaultTheme = {
  color: '#0A84FF',
  label: '海蓝',
};

function alignRecentGoalDateToCurrentCycle(date: Date, referenceDate: Date) {
  const normalizedDate = new Date(date);
  const normalizedReference = new Date(referenceDate);
  normalizedDate.setHours(0, 0, 0, 0);
  normalizedReference.setHours(0, 0, 0, 0);

  if (normalizedDate.getTime() >= normalizedReference.getTime()) {
    return new Date(date);
  }

  const adjusted = new Date(
    normalizedReference.getFullYear(),
    normalizedDate.getMonth(),
    normalizedDate.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );

  if (adjusted.getTime() < normalizedReference.getTime()) {
    adjusted.setFullYear(adjusted.getFullYear() + 1);
  }

  return adjusted;
}

function normalizeLegacyRecentGoalDates(goalData: Partial<LongTermGoal>) {
  const createdAt = goalData.createdAt ? new Date(goalData.createdAt) : new Date();
  const now = new Date();
  const daysSinceCreated = Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const startDate = goalData.startDate ? new Date(goalData.startDate) : undefined;
  const endDate = goalData.endDate ? new Date(goalData.endDate) : goalData.deadline ? new Date(goalData.deadline) : undefined;

  if (daysSinceCreated > 21 || !startDate || !endDate) {
    return {
      startDate,
      endDate,
    };
  }

  const tooOldStart = now.getFullYear() - startDate.getFullYear() >= 1;
  const tooOldEnd = now.getFullYear() - endDate.getFullYear() >= 1;

  if (!tooOldStart && !tooOldEnd) {
    return {
      startDate,
      endDate,
    };
  }

  const normalizedStart = tooOldStart ? alignRecentGoalDateToCurrentCycle(startDate, createdAt) : startDate;
  const normalizedEndBase = tooOldEnd ? alignRecentGoalDateToCurrentCycle(endDate, normalizedStart || createdAt) : endDate;
  const normalizedEnd = normalizedStart && normalizedEndBase < normalizedStart
    ? alignRecentGoalDateToCurrentCycle(normalizedEndBase, normalizedStart)
    : normalizedEndBase;

  return {
    startDate: normalizedStart,
    endDate: normalizedEnd,
  };
}

function buildGoal(goalData: Partial<LongTermGoal>): LongTermGoal {
  const { startDate: normalizedLegacyStartDate, endDate: normalizedLegacyEndDate } = normalizeLegacyRecentGoalDates(goalData);

  const normalizeGoalEndDate = (start?: Date, end?: Date, isCompleted?: boolean) => {
    if (!start || !end || isCompleted) return end;
    if (end >= start) return end;

    const adjusted = new Date(start.getFullYear(), end.getMonth(), end.getDate());
    if (adjusted < start) {
      adjusted.setFullYear(adjusted.getFullYear() + 1);
    }
    adjusted.setHours(23, 59, 59, 999);
    return adjusted;
  };

  const startDate = normalizedLegacyStartDate;
  const rawEndDate = normalizedLegacyEndDate;
  const endDate = normalizeGoalEndDate(startDate, rawEndDate, goalData.isCompleted);
  const estimatedTotalHours = goalData.estimatedTotalHours ?? 0;
  const durationDays = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : undefined;

  const dimensions = (goalData.dimensions || []).map((dimension, index) => ({
    id: dimension.id || `metric-${Date.now()}-${index}`,
    name: dimension.name || `维度 ${index + 1}`,
    unit: dimension.unit || '',
    targetValue: dimension.targetValue || 0,
    currentValue: dimension.currentValue || 0,
    weight: dimension.weight || 0,
  }));

  const targetValue = goalData.targetValue ?? dimensions.reduce((sum, dimension) => sum + dimension.targetValue, 0);
  const currentValue = goalData.currentValue ?? dimensions.reduce((sum, dimension) => sum + dimension.currentValue, 0);

  return {
    id: goalData.id || `goal-${Date.now()}`,
    userId: goalData.userId || 'local-user',
    name: goalData.name || '',
    description: goalData.description || '',
    goalType: goalData.goalType || 'numeric',
    targetValue,
    currentValue,
    unit: goalData.unit || dimensions[0]?.unit || '',
    deadline: endDate,
    startDate,
    endDate,
    estimatedTotalHours,
    estimatedDailyHours: goalData.estimatedDailyHours ?? (durationDays ? Number((estimatedTotalHours / durationDays).toFixed(1)) : 0),
    targetIncome: goalData.targetIncome ?? 0,
    currentIncome: goalData.currentIncome ?? 0,
    dimensions,
    projectBindings: goalData.projectBindings || [],
    theme: goalData.theme || defaultTheme,
    showInFuture30Chart: goalData.showInFuture30Chart ?? true,
    relatedDimensions: goalData.relatedDimensions || [],
    milestones: goalData.milestones || [],
    isActive: goalData.isActive ?? true,
    isCompleted: goalData.isCompleted ?? false,
    completedAt: goalData.completedAt,
    createdAt: goalData.createdAt ? new Date(goalData.createdAt) : new Date(),
    updatedAt: new Date(),
  };
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      loadGoals: () => {
        console.log('📦 使用本地存储的目标');
      },

      createGoal: (goalData) => {
        const newGoal = buildGoal(goalData);

        set({
          goals: [...get().goals, newGoal],
        });

        console.log('🎯 目标已创建:', newGoal.name);
        return newGoal;
      },

      updateGoal: (id, updates) => {
        const currentGoal = get().goals.find((g) => g.id === id);
        if (!currentGoal) return;

        const updatedGoal = buildGoal({
          ...currentGoal,
          ...updates,
          id: currentGoal.id,
          userId: currentGoal.userId,
          createdAt: currentGoal.createdAt,
          completedAt: updates.isCompleted ? updates.completedAt || currentGoal.completedAt || new Date() : currentGoal.completedAt,
        });

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
        const dimensionTargetTotal = goal.dimensions.reduce((sum, item) => sum + item.targetValue, 0);
        const nextDimensions = dimensionTargetTotal > 0
          ? goal.dimensions.map((item) => ({
              ...item,
              currentValue: Number(((value / dimensionTargetTotal) * item.targetValue).toFixed(2)),
            }))
          : goal.dimensions;

        get().updateGoal(id, {
          currentValue: value,
          dimensions: nextDimensions,
          isCompleted,
          completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
        });
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

        return goals.filter((goal) => {
          const goalText = `${goal.name} ${goal.description} ${goal.projectBindings.map((item) => item.name).join(' ')}`.toLowerCase();
          const goalKeywords = goalText.split(/\s+/);
          const matchCount = keywords.filter((keyword) =>
            goalKeywords.some((gk) => gk.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(gk))
          ).length;

          const directMatch = goalText.includes(taskDescription.toLowerCase()) ||
            taskDescription.toLowerCase().includes(goal.name.toLowerCase());

          return matchCount > 0 || directMatch;
        }).sort((a, b) => {
          const aScore = calculateMatchScore(a, searchText);
          const bScore = calculateMatchScore(b, searchText);
          return bScore - aScore;
        });
      },
    }),
    {
      name: 'manifestos-goals-storage',
      version: 2,
      partialize: (state) => ({
        goals: state.goals,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            if (parsed?.state?.goals) {
              parsed.state.goals = parsed.state.goals.map((goal: any) => buildGoal({
                ...goal,
                deadline: goal.deadline ? new Date(goal.deadline) : undefined,
                startDate: goal.startDate ? new Date(goal.startDate) : undefined,
                endDate: goal.endDate ? new Date(goal.endDate) : undefined,
                completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined,
                createdAt: goal.createdAt ? new Date(goal.createdAt) : undefined,
                updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : undefined,
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

function calculateMatchScore(goal: LongTermGoal, searchText: string): number {
  const goalText = `${goal.name} ${goal.description} ${goal.projectBindings.map((item) => item.name).join(' ')}`.toLowerCase();
  let score = 0;

  if (searchText.includes(goal.name.toLowerCase())) {
    score += 10;
  }

  if (goal.description && searchText.includes(goal.description.toLowerCase())) {
    score += 5;
  }

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
