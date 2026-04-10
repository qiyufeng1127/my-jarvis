import { useHabitStore } from '@/stores/habitStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';
import type { HabitCandidate, HabitFrequency, HabitType } from '@/types/habit';

class HabitRecognitionService {
  private checkInterval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;
  
  /**
   * 启动习惯识别服务
   */
  start() {
    if (this.checkInterval || this.initialTimeout) return;
    
    // 每天检查一次（凌晨1点）
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(1, 0, 0, 0);
    
    const timeUntilCheck = tomorrow.getTime() - now.getTime();
    
    this.initialTimeout = setTimeout(() => {
      this.initialTimeout = null;
      this.analyzeAndGenerateCandidates();
      
      // 之后每24小时检查一次
      this.checkInterval = setInterval(() => {
        this.analyzeAndGenerateCandidates();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCheck);
    
    console.log('🤖 习惯识别服务已启动');
  }
  
  /**
   * 停止服务
   */
  stop() {
    if (this.initialTimeout) {
      clearTimeout(this.initialTimeout);
      this.initialTimeout = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  /**
   * 分析任务并生成候选习惯
   */
  analyzeAndGenerateCandidates() {
    const taskStore = useTaskStore.getState();
    const habitStore = useHabitStore.getState();
    const { autoGenerationRule } = habitStore;
    
    if (!autoGenerationRule.enabled) return;
    
    // 获取最近90天的已完成任务
    const now = new Date();
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const tasks = taskStore.tasks.filter(
      (task) =>
        task.status === 'completed' &&
        task.actualEnd &&
        new Date(task.actualEnd) >= startDate
    );
    
    // 按关键词分组任务
    const keywordGroups = this.groupTasksByKeywords(tasks);
    
    // 分析每个关键词组
    for (const [keyword, groupTasks] of Object.entries(keywordGroups)) {
      // 检查是否已存在相同的习惯或候选
      const existingHabit = habitStore.habits.find((h) =>
        h.recognitionRule?.keywords.includes(keyword)
      );
      const existingCandidate = habitStore.candidates.find(
        (c) => c.detectedKeywords.includes(keyword) && c.status === 'pending'
      );
      
      if (existingHabit || existingCandidate) continue;
      
      // 分析频率
      const dailyPattern = this.analyzeDailyPattern(groupTasks, autoGenerationRule.dailyThreshold);
      const weeklyPattern = this.analyzeWeeklyPattern(
        groupTasks,
        autoGenerationRule.weeklyThreshold,
        autoGenerationRule.weeklyMinCount
      );
      const monthlyPattern = this.analyzeMonthlyPattern(
        groupTasks,
        autoGenerationRule.monthlyThreshold,
        autoGenerationRule.monthlyMinCount
      );
      
      // 生成候选习惯
      if (dailyPattern.qualified) {
        this.createCandidate(keyword, groupTasks, 'daily', dailyPattern);
      } else if (weeklyPattern.qualified) {
        this.createCandidate(keyword, groupTasks, 'weekly', weeklyPattern);
      } else if (monthlyPattern.qualified) {
        this.createCandidate(keyword, groupTasks, 'monthly', monthlyPattern);
      }
    }
  }
  
  /**
   * 按关键词分组任务
   */
  private groupTasksByKeywords(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {};
    
    for (const task of tasks) {
      // 提取关键词（从标题和标签）
      const keywords = this.extractKeywords(task);
      
      for (const keyword of keywords) {
        if (!groups[keyword]) {
          groups[keyword] = [];
        }
        groups[keyword].push(task);
      }
    }
    
    // 过滤掉任务数量太少的组
    return Object.fromEntries(
      Object.entries(groups).filter(([_, tasks]) => tasks.length >= 3)
    );
  }
  
  /**
   * 提取任务的关键词
   */
  private extractKeywords(task: Task): string[] {
    const keywords: string[] = [];
    
    // 从标题提取（简单分词）
    const titleWords = task.title
      .split(/[\s,，、。！？]+/)
      .filter((w) => w.length >= 2 && w.length <= 10);
    keywords.push(...titleWords);
    
    // 从标签提取
    if (task.tags) {
      keywords.push(...task.tags);
    }
    
    return [...new Set(keywords)];
  }
  
  /**
   * 分析日习惯模式
   */
  private analyzeDailyPattern(tasks: Task[], threshold: number) {
    const dateMap = new Map<string, Task[]>();
    
    for (const task of tasks) {
      if (!task.actualEnd) continue;
      const date = new Date(task.actualEnd).toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(task);
    }
    
    const dates = Array.from(dateMap.keys()).sort();
    
    // 计算最长连续天数
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    return {
      qualified: maxStreak >= threshold,
      consecutiveDays: maxStreak,
      avgPerDay: tasks.length / dates.length,
      confidence: Math.min(maxStreak / (threshold * 2), 1),
    };
  }
  
  /**
   * 分析周习惯模式
   */
  private analyzeWeeklyPattern(tasks: Task[], weekThreshold: number, minCount: number) {
    const weekMap = new Map<string, Task[]>();
    
    for (const task of tasks) {
      if (!task.actualEnd) continue;
      const date = new Date(task.actualEnd);
      const weekKey = this.getWeekKey(date);
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(task);
    }
    
    // 过滤出符合最小次数的周
    const qualifiedWeeks = Array.from(weekMap.entries())
      .filter(([_, tasks]) => tasks.length >= minCount)
      .map(([week]) => week)
      .sort();
    
    // 计算连续周数
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < qualifiedWeeks.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevWeek = parseInt(qualifiedWeeks[i - 1].split('-W')[1]);
        const currWeek = parseInt(qualifiedWeeks[i].split('-W')[1]);
        
        if (currWeek === prevWeek + 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    return {
      qualified: maxStreak >= weekThreshold,
      consecutiveWeeks: maxStreak,
      avgPerWeek: tasks.length / weekMap.size,
      confidence: Math.min(maxStreak / (weekThreshold * 2), 1),
    };
  }
  
  /**
   * 分析月习惯模式
   */
  private analyzeMonthlyPattern(tasks: Task[], monthThreshold: number, minCount: number) {
    const monthMap = new Map<string, Task[]>();
    
    for (const task of tasks) {
      if (!task.actualEnd) continue;
      const date = new Date(task.actualEnd);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(task);
    }
    
    // 过滤出符合最小次数的月
    const qualifiedMonths = Array.from(monthMap.entries())
      .filter(([_, tasks]) => tasks.length >= minCount)
      .map(([month]) => month)
      .sort();
    
    // 计算连续月数
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < qualifiedMonths.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const [prevYear, prevMonth] = qualifiedMonths[i - 1].split('-').map(Number);
        const [currYear, currMonth] = qualifiedMonths[i].split('-').map(Number);
        
        const isConsecutive =
          (currYear === prevYear && currMonth === prevMonth + 1) ||
          (currYear === prevYear + 1 && prevMonth === 12 && currMonth === 1);
        
        if (isConsecutive) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    return {
      qualified: maxStreak >= monthThreshold,
      consecutiveMonths: maxStreak,
      avgPerMonth: tasks.length / monthMap.size,
      confidence: Math.min(maxStreak / (monthThreshold * 2), 1),
    };
  }
  
  /**
   * 创建候选习惯
   */
  private createCandidate(
    keyword: string,
    tasks: Task[],
    frequency: HabitFrequency,
    pattern: any
  ) {
    const habitStore = useHabitStore.getState();
    
    // 确定习惯类型
    const avgDuration = tasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) / tasks.length;
    const type: HabitType = avgDuration > 10 ? 'duration' : 'count';
    
    // 生成建议目标
    const suggestedTarget = type === 'duration' ? Math.round(avgDuration) : 1;
    
    // 生成emoji（简单映射）
    const emoji = this.getEmojiForKeyword(keyword);
    
    // 生成发生记录
    const occurrences = tasks.map((task) => ({
      date: task.actualEnd ? new Date(task.actualEnd).toISOString().split('T')[0] : '',
      taskId: task.id,
      taskTitle: task.title,
      value: type === 'duration' ? task.durationMinutes || 0 : 1,
    }));
    
    const candidate: Omit<HabitCandidate, 'id' | 'createdAt' | 'status'> = {
      name: keyword,
      emoji,
      frequency,
      type,
      detectedKeywords: [keyword],
      occurrences,
      totalOccurrences: tasks.length,
      consecutiveDays: pattern.consecutiveDays || 0,
      consecutiveWeeks: pattern.consecutiveWeeks || 0,
      consecutiveMonths: pattern.consecutiveMonths || 0,
      suggestedTarget,
      confidence: pattern.confidence,
    };
    
    habitStore.addCandidate(candidate);
    
    console.log(`🎯 发现新的习惯候选: ${keyword} (${frequency})`);
  }
  
  /**
   * 获取周键（ISO周）
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getISOWeek(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }
  
  /**
   * 获取ISO周数
   */
  private getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
  
  /**
   * 根据关键词获取emoji
   */
  private getEmojiForKeyword(keyword: string): string {
    const emojiMap: Record<string, string> = {
      '跑步': '🏃',
      '运动': '💪',
      '健身': '🏋️',
      '阅读': '📚',
      '学习': '📖',
      '写作': '✍️',
      '冥想': '🧘',
      '喝水': '💧',
      '早起': '🌅',
      '睡眠': '😴',
      '工作': '💼',
      '编程': '💻',
      '画画': '🎨',
      '音乐': '🎵',
      '做饭': '🍳',
      '打卡': '✅',
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (keyword.includes(key)) {
        return emoji;
      }
    }
    
    return '⭐';
  }
  
  /**
   * 手动触发分析（用于测试）
   */
  manualAnalyze() {
    this.analyzeAndGenerateCandidates();
  }
  
  /**
   * 检查任务是否匹配习惯
   */
  checkTaskMatchesHabit(task: Task, habitId: string): boolean {
    const habitStore = useHabitStore.getState();
    const habit = habitStore.getHabitById(habitId);
    
    if (!habit || !habit.recognitionRule) return false;
    
    const { keywords, matchTitle, matchTags, minDuration } = habit.recognitionRule;
    
    // 如果是反向检测规则，不在这里处理
    if (habit.recognitionRule.reverseDetection?.enabled) {
      return false;
    }
    
    // 检查最小时长
    if (minDuration && task.durationMinutes < minDuration) {
      return false;
    }
    
    // 检查标题
    if (matchTitle) {
      for (const keyword of keywords) {
        if (task.title.includes(keyword)) {
          return true;
        }
      }
    }
    
    // 检查标签
    if (matchTags && task.tags) {
      for (const keyword of keywords) {
        if (task.tags.includes(keyword)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 自动记录任务完成到习惯
   */
  autoLogTaskToHabit(task: Task) {
    if (task.status !== 'completed') return;
    
    const habitStore = useHabitStore.getState();
    const habits = habitStore.habits.filter((h) => h.recognitionRule && !h.archivedAt);
    
    for (const habit of habits) {
      // 跳过反向检测规则的习惯
      if (habit.recognitionRule?.reverseDetection?.enabled) {
        continue;
      }
      
      if (this.checkTaskMatchesHabit(task, habit.id)) {
        // 根据目标模式决定记录的值
        let value = 1;
        
        if (habit.targetMode === 'duration') {
          // 按时长模式：记录任务的实际时长
          value = task.durationMinutes || 0;
        } else {
          // 按频率模式：记录1次
          value = 1;
        }
        
        habitStore.logHabit(habit.id, value, undefined, [task.id]);
        console.log(`✅ 自动记录任务到习惯: ${habit.name} (${value})`);
      }
    }
  }
}

export const habitRecognitionService = new HabitRecognitionService();

