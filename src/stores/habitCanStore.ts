import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BadHabit, HabitOccurrence, CanData, WeekViewData, TrendData, HeatmapData, MonthlyReport, Achievement } from '@/types/habitTypes';
import { PRESET_HABITS as PRESETS } from '@/types/habitTypes';

interface HabitCanState {
  habits: BadHabit[];
  occurrences: HabitOccurrence[];
  achievements: Achievement[];
  monthlyReports: MonthlyReport[];
  isLoading: boolean;
  
  // Actions
  initializePresets: () => void;
  createHabit: (habit: Omit<BadHabit, 'id' | 'createdAt' | 'updatedAt'>) => BadHabit;
  updateHabit: (id: string, updates: Partial<BadHabit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, enabled: boolean) => void;
  
  // 记录坏习惯
  recordOccurrence: (habitId: string, date: string, detail: { time: string; reason: string; relatedTaskId?: string }) => void;
  recordManualOccurrence: (habitId: string, date: string, count: number, reason: string) => void;
  deleteOccurrence: (habitId: string, date: string) => void;
  
  // 查询
  getHabitById: (id: string) => BadHabit | undefined;
  getOccurrencesByDate: (date: string) => HabitOccurrence[];
  getOccurrencesByDateRange: (startDate: string, endDate: string) => HabitOccurrence[];
  getCanData: (date: string) => CanData;
  getMonthCanData: (year: number, month: number) => CanData[];
  getMostFrequentHabit: (startDate: string, endDate: string) => { habit: BadHabit; count: number } | null;
  
  // 新增：数据视图
  getWeekViewData: (endDate: string) => WeekViewData[];
  getTrendData: (days: number) => TrendData[];
  getHeatmapData: (habitId: string, year: number, month: number) => HeatmapData;
  
  // 新增：月报和成就
  generateMonthlyReport: (year: number, month: number) => MonthlyReport;
  getMonthlyReport: (year: number, month: number) => MonthlyReport | undefined;
  unlockAchievement: (achievement: Omit<Achievement, 'id' | 'unlockedAt'>) => void;
  getAchievementsByDate: (date: string) => Achievement[];
}

export const useHabitCanStore = create<HabitCanState>()(
  persist(
    (set, get) => ({
      habits: [],
      occurrences: [],
      achievements: [],
      monthlyReports: [],
      isLoading: false,

      initializePresets: () => {
        const existingHabits = get().habits;
        if (existingHabits.length > 0) {
          console.log('🏺 预设习惯已存在，跳过初始化');
          return;
        }

        const presetHabits: BadHabit[] = PRESETS.map((preset) => ({
          ...preset,
          id: `preset-${preset.rule.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        set({ habits: presetHabits });
        console.log('🏺 预设习惯已初始化:', presetHabits.length);
      },

      createHabit: (habitData) => {
        const newHabit: BadHabit = {
          ...habitData,
          id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set({ habits: [...get().habits, newHabit] });
        console.log('🏺 新习惯已创建:', newHabit.name, newHabit.emoji);
        return newHabit;
      },

      updateHabit: (id, updates) => {
        set({
          habits: get().habits.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: new Date() } : h
          ),
        });
        console.log('✏️ 习惯已更新:', id);
      },

      deleteHabit: (id) => {
        const habit = get().habits.find((h) => h.id === id);
        if (habit?.isPreset) {
          console.warn('⚠️ 预设习惯不能删除，只能禁用');
          return;
        }
        set({ 
          habits: get().habits.filter((h) => h.id !== id),
          occurrences: get().occurrences.filter((o) => o.habitId !== id),
        });
        console.log('🗑️ 习惯已删除:', id);
      },

      toggleHabit: (id, enabled) => {
        get().updateHabit(id, { enabled });
        console.log(`${enabled ? '✅' : '❌'} 习惯已${enabled ? '启用' : '禁用'}:`, id);
      },

      recordOccurrence: (habitId, date, detail) => {
        const occurrences = get().occurrences;
        const existingIndex = occurrences.findIndex(
          (o) => o.habitId === habitId && o.date === date
        );

        if (existingIndex >= 0) {
          // 更新现有记录
          const existing = occurrences[existingIndex];
          const updated: HabitOccurrence = {
            ...existing,
            count: existing.count + 1,
            details: [...existing.details, detail],
          };
          
          set({
            occurrences: [
              ...occurrences.slice(0, existingIndex),
              updated,
              ...occurrences.slice(existingIndex + 1),
            ],
          });
        } else {
          // 创建新记录
          const newOccurrence: HabitOccurrence = {
            id: `occ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            habitId,
            date,
            count: 1,
            details: [detail],
            isManual: false,
          };
          
          set({ occurrences: [...occurrences, newOccurrence] });
        }

        const habit = get().getHabitById(habitId);
        console.log('📝 记录坏习惯:', habit?.name, habit?.emoji, date);
      },

      recordManualOccurrence: (habitId, date, count, reason) => {
        const occurrences = get().occurrences;
        const existingIndex = occurrences.findIndex(
          (o) => o.habitId === habitId && o.date === date
        );

        const detail = {
          time: new Date().toTimeString().slice(0, 5),
          reason: `手动添加: ${reason}`,
        };

        if (existingIndex >= 0) {
          const existing = occurrences[existingIndex];
          const updated: HabitOccurrence = {
            ...existing,
            count: existing.count + count,
            details: [...existing.details, detail],
            isManual: true,
          };
          
          set({
            occurrences: [
              ...occurrences.slice(0, existingIndex),
              updated,
              ...occurrences.slice(existingIndex + 1),
            ],
          });
        } else {
          const newOccurrence: HabitOccurrence = {
            id: `occ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            habitId,
            date,
            count,
            details: [detail],
            isManual: true,
          };
          
          set({ occurrences: [...occurrences, newOccurrence] });
        }

        console.log('✍️ 手动记录坏习惯:', habitId, date, count);
      },

      deleteOccurrence: (habitId, date) => {
        set({
          occurrences: get().occurrences.filter(
            (o) => !(o.habitId === habitId && o.date === date)
          ),
        });
        console.log('🗑️ 删除坏习惯记录:', habitId, date);
      },

      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      getOccurrencesByDate: (date) => {
        return get().occurrences.filter((o) => o.date === date);
      },

      getOccurrencesByDateRange: (startDate, endDate) => {
        return get().occurrences.filter(
          (o) => o.date >= startDate && o.date <= endDate
        );
      },

      getCanData: (date) => {
        const occurrences = get().getOccurrencesByDate(date);
        const habits = get().habits;
        
        const totalCount = occurrences.reduce((sum, o) => sum + o.count, 0);
        
        const habitCounts = occurrences.map((occ) => {
          const habit = habits.find((h) => h.id === occ.habitId);
          return {
            habitId: occ.habitId,
            habitName: habit?.name || '未知',
            emoji: habit?.emoji || '❓',
            count: occ.count,
          };
        });

        // 更新颜色分级：0=绿，1-10=黄，11-20=橙，20+=红
        let colorLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';
        if (totalCount > 20) colorLevel = 'red';
        else if (totalCount > 10) colorLevel = 'orange';
        else if (totalCount > 0) colorLevel = 'yellow';

        return {
          date,
          totalCount,
          habits: habitCounts,
          colorLevel,
        };
      },

      getMonthCanData: (year, month) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const canDataList: CanData[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          canDataList.push(get().getCanData(date));
        }

        return canDataList;
      },

      getMostFrequentHabit: (startDate, endDate) => {
        const occurrences = get().getOccurrencesByDateRange(startDate, endDate);
        const habits = get().habits;
        
        const habitCountMap = new Map<string, number>();
        
        occurrences.forEach((occ) => {
          const current = habitCountMap.get(occ.habitId) || 0;
          habitCountMap.set(occ.habitId, current + occ.count);
        });

        let maxCount = 0;
        let maxHabitId = '';
        
        habitCountMap.forEach((count, habitId) => {
          if (count > maxCount) {
            maxCount = count;
            maxHabitId = habitId;
          }
        });

        if (!maxHabitId) return null;

        const habit = habits.find((h) => h.id === maxHabitId);
        if (!habit) return null;

        return { habit, count: maxCount };
      },

      // 周视图数据
      getWeekViewData: (endDate) => {
        const end = new Date(endDate);
        const weekData: WeekViewData[] = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(end);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const canData = get().getCanData(dateStr);
          
          // 计算与前一天的变化
          let change = 0;
          if (i < 6) {
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            const prevCanData = get().getCanData(prevDateStr);
            change = canData.totalCount - prevCanData.totalCount;
          }
          
          // 获取Top3坏习惯
          const topHabits = [...canData.habits]
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          
          weekData.push({
            date: dateStr,
            totalCount: canData.totalCount,
            change,
            topHabits,
          });
        }
        
        return weekData;
      },

      // 30天趋势数据
      getTrendData: (days) => {
        const trendData: TrendData[] = [];
        const today = new Date();
        const habits = get().habits;
        
        // 为每个习惯分配颜色
        const habitColors = new Map<string, string>();
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        habits.forEach((habit, index) => {
          habitColors.set(habit.id, colors[index % colors.length]);
        });
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const occurrences = get().getOccurrencesByDate(dateStr);
          const habitCounts = occurrences.map((occ) => {
            const habit = habits.find((h) => h.id === occ.habitId);
            return {
              habitId: occ.habitId,
              habitName: habit?.name || '未知',
              emoji: habit?.emoji || '❓',
              count: occ.count,
              color: habitColors.get(occ.habitId) || '#6b7280',
            };
          });
          
          const totalCount = habitCounts.reduce((sum, h) => sum + h.count, 0);
          
          trendData.push({
            date: dateStr,
            habitCounts,
            totalCount,
          });
        }
        
        return trendData;
      },

      // 热力图数据
      getHeatmapData: (habitId, year, month) => {
        const habit = get().getHabitById(habitId);
        if (!habit) {
          return {
            habitId,
            habitName: '未知',
            emoji: '❓',
            dailyData: [],
          };
        }
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData: HeatmapData['dailyData'] = [];
        let maxCount = 0;
        
        // 第一遍：收集数据并找到最大值
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const occurrences = get().getOccurrencesByDate(date);
          const occurrence = occurrences.find((o) => o.habitId === habitId);
          const count = occurrence?.count || 0;
          
          if (count > maxCount) maxCount = count;
          
          dailyData.push({
            date,
            count,
            intensity: 0, // 稍后计算
          });
        }
        
        // 第二遍：计算强度（0-1）
        dailyData.forEach((data) => {
          data.intensity = maxCount > 0 ? data.count / maxCount : 0;
        });
        
        return {
          habitId,
          habitName: habit.name,
          emoji: habit.emoji,
          dailyData,
        };
      },

      // 生成月报
      generateMonthlyReport: (year, month) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const daysInMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
        
        const occurrences = get().getOccurrencesByDateRange(startDate, endDate);
        const habits = get().habits;
        
        // 统计总数和Top习惯
        const habitCountMap = new Map<string, number>();
        occurrences.forEach((occ) => {
          const current = habitCountMap.get(occ.habitId) || 0;
          habitCountMap.set(occ.habitId, current + occ.count);
        });
        
        const totalCount = Array.from(habitCountMap.values()).reduce((sum, count) => sum + count, 0);
        
        const topHabits = Array.from(habitCountMap.entries())
          .map(([habitId, count]) => {
            const habit = habits.find((h) => h.id === habitId);
            return {
              habitId,
              habitName: habit?.name || '未知',
              emoji: habit?.emoji || '❓',
              count,
              percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        // 计算改善情况（与上月对比）
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
        const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevDaysInMonth).padStart(2, '0')}`;
        
        const prevOccurrences = get().getOccurrencesByDateRange(prevStartDate, prevEndDate);
        const prevHabitCountMap = new Map<string, number>();
        prevOccurrences.forEach((occ) => {
          const current = prevHabitCountMap.get(occ.habitId) || 0;
          prevHabitCountMap.set(occ.habitId, current + occ.count);
        });
        
        const improvements = topHabits.map((habit) => {
          const prevCount = prevHabitCountMap.get(habit.habitId) || 0;
          const changePercentage = prevCount > 0 
            ? ((habit.count - prevCount) / prevCount) * 100 
            : habit.count > 0 ? 100 : 0;
          
          let description = '';
          if (changePercentage < -10) {
            description = `较上月下降 ${Math.abs(changePercentage).toFixed(0)}%，进步明显！`;
          } else if (changePercentage > 10) {
            description = `较上月上升 ${changePercentage.toFixed(0)}%，需要注意`;
          } else {
            description = '与上月持平';
          }
          
          return {
            habitId: habit.habitId,
            habitName: habit.habitName,
            emoji: habit.emoji,
            changePercentage,
            description,
          };
        });
        
        // 查找连续无坏习惯天数
        const cleanStreaks: MonthlyReport['cleanStreaks'] = [];
        let streakStart: string | null = null;
        let streakDays = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const canData = get().getCanData(date);
          
          if (canData.totalCount === 0) {
            if (!streakStart) streakStart = date;
            streakDays++;
          } else {
            if (streakStart && streakDays >= 3) {
              const prevDay = day - 1;
              const endDate = `${year}-${String(month).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
              cleanStreaks.push({
                startDate: streakStart,
                endDate,
                days: streakDays,
              });
            }
            streakStart = null;
            streakDays = 0;
          }
        }
        
        // 最后一段连续
        if (streakStart && streakDays >= 3) {
          cleanStreaks.push({
            startDate: streakStart,
            endDate,
            days: streakDays,
          });
        }
        
        // 生成建议
        const suggestions: string[] = [];
        topHabits.forEach((habit) => {
          const h = habits.find((hb) => hb.id === habit.habitId);
          if (!h) return;
          
          if (h.name === '拖延' && habit.count > 10) {
            suggestions.push('将大任务拆分为 25 分钟小任务，降低启动压力');
          } else if (h.name === '熬夜' && habit.count > 5) {
            suggestions.push(`将熬夜阈值调整到 ${h.rule.timeThreshold?.time || '23:00'}，设置睡前提醒`);
          } else if (h.name === '晚起' && habit.count > 5) {
            suggestions.push('设置早起闹钟，安排晨间任务增加动力');
          } else if (h.name === '低效率' && habit.count > 8) {
            suggestions.push('使用番茄工作法，每 25 分钟休息 5 分钟');
          }
        });
        
        if (suggestions.length === 0) {
          suggestions.push('继续保持良好习惯！');
        }
        
        // 检查成就
        const achievements: Achievement[] = [];
        
        // 连续无坏习惯成就
        cleanStreaks.forEach((streak) => {
          if (streak.days >= 7) {
            get().unlockAchievement({
              type: 'clean_streak',
              title: `连续 ${streak.days} 天无坏习惯`,
              description: `从 ${streak.startDate} 到 ${streak.endDate}`,
              emoji: '🏆',
              date: streak.endDate,
            });
          }
        });
        
        // 改善成就
        improvements.forEach((imp) => {
          if (imp.changePercentage < -50) {
            get().unlockAchievement({
              type: 'improvement',
              title: `${imp.habitName}大幅改善`,
              description: `${imp.emoji} 次数下降 ${Math.abs(imp.changePercentage).toFixed(0)}%`,
              emoji: '🎉',
            });
          }
        });
        
        const report: MonthlyReport = {
          year,
          month,
          generatedAt: new Date(),
          totalCount,
          topHabits,
          improvements,
          cleanStreaks,
          suggestions,
          achievements: get().achievements.filter((a) => {
            const aDate = new Date(a.unlockedAt);
            return aDate.getFullYear() === year && aDate.getMonth() + 1 === month;
          }),
        };
        
        // 保存月报
        set({
          monthlyReports: [...get().monthlyReports.filter((r) => !(r.year === year && r.month === month)), report],
        });
        
        return report;
      },

      getMonthlyReport: (year, month) => {
        return get().monthlyReports.find((r) => r.year === year && r.month === month);
      },

      unlockAchievement: (achievement) => {
        const newAchievement: Achievement = {
          ...achievement,
          id: `achievement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          unlockedAt: new Date(),
        };
        
        set({
          achievements: [...get().achievements, newAchievement],
        });
        
        console.log('🏆 解锁成就:', newAchievement.title);
      },

      getAchievementsByDate: (date) => {
        return get().achievements.filter((a) => a.date === date);
      },
    }),
    {
      name: 'manifestos-habit-can-storage',
      version: 2,
      partialize: (state) => ({
        habits: state.habits,
        occurrences: state.occurrences,
        achievements: state.achievements,
        monthlyReports: state.monthlyReports,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复日期对象
          state.habits = state.habits.map((h: any) => ({
            ...h,
            createdAt: new Date(h.createdAt),
            updatedAt: new Date(h.updatedAt),
          }));
          
          // 初始化预设习惯
          state.initializePresets();
        }
      },
    }
  )
);

