import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Habit, 
  HabitLog, 
  HabitCandidate, 
  HabitGroup,
  HabitStats,
  AutoGenerationRule,
  HabitFrequency,
  HabitType
} from '@/types/habit';

interface HabitStore {
  // 数据
  habits: Habit[];
  logs: HabitLog[];
  candidates: HabitCandidate[];
  groups: HabitGroup[];
  
  // 自动生成规则
  autoGenerationRule: AutoGenerationRule;
  
  // 习惯操作
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'currentStreak' | 'longestStreak' | 'totalCount' | 'totalDuration' | 'completionRate' | 'targetMode'> & { targetMode?: 'frequency' | 'duration' }) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  
  // 打卡操作
  logHabit: (habitId: string, value: number, note?: string, relatedTaskIds?: string[]) => void;
  updateLog: (logId: string, updates: Partial<HabitLog>) => void;
  deleteLog: (logId: string) => void;
  
  // 查询
  getHabitById: (id: string) => Habit | undefined;
  getHabitsByFrequency: (frequency: HabitFrequency) => Habit[];
  getLogsForHabit: (habitId: string, startDate?: string, endDate?: string) => HabitLog[];
  getLogsForDate: (date: string) => HabitLog[];
  
  // 统计
  calculateHabitStats: (habitId: string, period: 'week' | 'month' | 'year') => HabitStats;
  updateHabitStats: (habitId: string) => void;
  
  // 候选习惯
  addCandidate: (candidate: Omit<HabitCandidate, 'id' | 'createdAt' | 'status'>) => void;
  acceptCandidate: (candidateId: string) => void;
  rejectCandidate: (candidateId: string) => void;
  
  // 分组
  addGroup: (group: Omit<HabitGroup, 'id'>) => void;
  updateGroup: (id: string, updates: Partial<HabitGroup>) => void;
  deleteGroup: (id: string) => void;
  
  // 规则配置
  updateAutoGenerationRule: (rule: Partial<AutoGenerationRule>) => void;
  
  // 初始化
  initialize: () => void;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      candidates: [],
      groups: [],
      
      autoGenerationRule: {
        enabled: true,
        dailyThreshold: 3, // 连续3天
        weeklyThreshold: 2, // 连续2周
        weeklyMinCount: 3, // 每周至少3次
        monthlyThreshold: 2, // 连续2月
        monthlyMinCount: 8, // 每月至少8次
      },
      
      // 添加习惯
      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentStreak: 0,
          longestStreak: 0,
          totalCount: 0,
          totalDuration: 0,
          completionRate: {},
          targetMode: habitData.targetMode || 'frequency',
        };
        
        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },
      
      // 更新习惯
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, ...updates, updatedAt: new Date() }
              : habit
          ),
        }));
      },
      
      // 删除习惯
      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        }));
      },
      
      // 归档习惯
      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, archivedAt: new Date(), updatedAt: new Date() }
              : habit
          ),
        }));
      },
      
      // 打卡
      logHabit: (habitId, value, note, relatedTaskIds) => {
        const today = new Date().toISOString().split('T')[0];
        const newLog: HabitLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          habitId,
          date: today,
          value,
          timestamp: new Date(),
          note,
          relatedTaskIds,
        };
        
        set((state) => ({
          logs: [...state.logs, newLog],
        }));
        
        // 更新统计
        get().updateHabitStats(habitId);
      },
      
      // 更新日志
      updateLog: (logId, updates) => {
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === logId ? { ...log, ...updates } : log
          ),
        }));
        
        // 更新相关习惯的统计
        const log = get().logs.find((l) => l.id === logId);
        if (log) {
          get().updateHabitStats(log.habitId);
        }
      },
      
      // 删除日志
      deleteLog: (logId) => {
        const log = get().logs.find((l) => l.id === logId);
        set((state) => ({
          logs: state.logs.filter((l) => l.id !== logId),
        }));
        
        // 更新相关习惯的统计
        if (log) {
          get().updateHabitStats(log.habitId);
        }
      },
      
      // 根据ID获取习惯
      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },
      
      // 根据频率获取习惯
      getHabitsByFrequency: (frequency) => {
        return get().habits.filter((h) => h.frequency === frequency && !h.archivedAt);
      },
      
      // 获取习惯的日志
      getLogsForHabit: (habitId, startDate, endDate) => {
        let logs = get().logs.filter((l) => l.habitId === habitId);
        
        if (startDate) {
          logs = logs.filter((l) => l.date >= startDate);
        }
        if (endDate) {
          logs = logs.filter((l) => l.date <= endDate);
        }
        
        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      },
      
      // 获取某天的所有日志
      getLogsForDate: (date) => {
        return get().logs.filter((l) => l.date === date);
      },
      
      // 计算习惯统计
      calculateHabitStats: (habitId, period) => {
        const habit = get().getHabitById(habitId);
        if (!habit) {
          throw new Error('Habit not found');
        }
        
        const now = new Date();
        let startDate: Date;
        let endDate = now;
        
        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }
        
        const logs = get().getLogsForHabit(
          habitId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        // 计算完成天数
        const uniqueDates = new Set(logs.map((l) => l.date));
        const completedDays = uniqueDates.size;
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        
        // 计算连续天数
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        const sortedDates = Array.from(uniqueDates).sort();
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
            
            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);
          
          // 检查是否包含今天
          const today = new Date().toISOString().split('T')[0];
          if (sortedDates[i] === today || (i === sortedDates.length - 1 && tempStreak > 0)) {
            currentStreak = tempStreak;
          }
        }
        
        // 生成每日数据
        const dailyData = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dayLogs = logs.filter((l) => l.date === dateStr);
          const value = dayLogs.reduce((sum, l) => sum + l.value, 0);
          
          dailyData.push({
            date: dateStr,
            value,
            completed: value >= habit.targetValue,
          });
        }
        
        return {
          habitId,
          period,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          completedDays,
          totalDays,
          completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
          currentStreak,
          longestStreak,
          trend: 'stable' as const,
          trendPercentage: 0,
          dailyData,
        };
      },
      
      // 更新习惯统计
      updateHabitStats: (habitId) => {
        const habit = get().getHabitById(habitId);
        if (!habit) return;
        
        const logs = get().getLogsForHabit(habitId);
        
        // 更新总次数和总时长
        const totalCount = logs.length;
        const totalDuration = logs.reduce((sum, l) => sum + l.value, 0);
        
        // 计算连续天数
        const uniqueDates = new Set(logs.map((l) => l.date));
        const sortedDates = Array.from(uniqueDates).sort().reverse();
        
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        for (let i = 0; i < sortedDates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];
          
          if (sortedDates[i] === expectedDateStr) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        // 计算最长连续天数
        let longestStreak = 0;
        let tempStreak = 0;
        const allSortedDates = Array.from(uniqueDates).sort();
        
        for (let i = 0; i < allSortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(allSortedDates[i - 1]);
            const currDate = new Date(allSortedDates[i]);
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
            
            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);
        }
        
        // 计算完成率
        const weekStats = get().calculateHabitStats(habitId, 'week');
        const monthStats = get().calculateHabitStats(habitId, 'month');
        
        get().updateHabit(habitId, {
          totalCount,
          totalDuration,
          currentStreak,
          longestStreak,
          completionRate: {
            weekly: weekStats.completionRate,
            monthly: monthStats.completionRate,
          },
        });
      },
      
      // 添加候选习惯
      addCandidate: (candidateData) => {
        const newCandidate: HabitCandidate = {
          ...candidateData,
          id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          createdAt: new Date(),
        };
        
        set((state) => ({
          candidates: [...state.candidates, newCandidate],
        }));
      },
      
      // 接受候选习惯
      acceptCandidate: (candidateId) => {
        const candidate = get().candidates.find((c) => c.id === candidateId);
        if (!candidate) return;
        
        // 创建习惯
        get().addHabit({
          userId: 'local',
          name: candidate.name,
          emoji: candidate.emoji,
          type: candidate.type,
          frequency: candidate.frequency,
          targetValue: candidate.suggestedTarget,
          targetMode: 'frequency',
          targetPeriod: 1,
          recognitionRule: {
            keywords: candidate.detectedKeywords,
            matchTitle: true,
            matchTags: true,
          },
          autoGenerated: true,
          reminderEnabled: false,
          sortOrder: get().habits.length,
        });
        
        // 更新候选状态
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: 'accepted' as const } : c
          ),
        }));
      },
      
      // 拒绝候选习惯
      rejectCandidate: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: 'rejected' as const } : c
          ),
        }));
      },
      
      // 添加分组
      addGroup: (groupData) => {
        const newGroup: HabitGroup = {
          ...groupData,
          id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
      },
      
      // 更新分组
      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },
      
      // 删除分组
      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        }));
      },
      
      // 更新自动生成规则
      updateAutoGenerationRule: (rule) => {
        set((state) => ({
          autoGenerationRule: { ...state.autoGenerationRule, ...rule },
        }));
      },
      
      // 初始化
      initialize: () => {
        // 可以在这里添加初始化逻辑
        console.log('✅ 习惯追踪系统已初始化');
      },
    }),
    {
      name: 'habit-storage',
      version: 1,
    }
  )
);

