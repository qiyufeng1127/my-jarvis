import { useHabitCanStore } from '@/stores/habitCanStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';
import type { BadHabit } from '@/types/habitTypes';

/**
 * 坏习惯监控服务
 * 自动监控时间轴事件并根据规则记录坏习惯
 */
class HabitMonitorService {
  private initialized = false;
  private checkInterval: NodeJS.Timeout | null = null;

  initialize() {
    if (this.initialized) return;
    
    console.log('🏺 坏习惯监控服务启动');
    this.initialized = true;
    
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkAllRules();
    }, 60000);
    
    // 每天 00:01 执行日结算
    this.scheduleDailySettlement();
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.initialized = false;
    console.log('🏺 坏习惯监控服务已停止');
  }

  /**
   * 检查所有启用的规则
   */
  private checkAllRules() {
    const { habits } = useHabitCanStore.getState();
    const enabledHabits = habits.filter((h) => h.enabled && h.rule.enabled);
    
    enabledHabits.forEach((habit) => {
      this.checkHabitRule(habit);
    });
  }

  /**
   * 检查单个习惯规则
   */
  private checkHabitRule(habit: BadHabit) {
    const { rule } = habit;
    
    switch (rule.type) {
      case 'time_threshold':
        // 时间阈值规则在日结算时检查
        break;
      case 'keyword':
        // 关键词规则在日结算时检查
        break;
      case 'task_status':
        // 任务状态规则实时监控
        this.checkTaskStatusRule(habit);
        break;
      case 'manual':
        // 手动规则不需要自动检查
        break;
    }
  }

  /**
   * 检查任务状态规则（拖延、低效率）
   */
  private checkTaskStatusRule(habit: BadHabit) {
    const { tasks } = useTaskStore.getState();
    const { recordOccurrence } = useHabitCanStore.getState();
    const today = this.formatDate(new Date());
    
    const todayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = this.formatDate(new Date(task.scheduledStart));
      return taskDate === today;
    });

    todayTasks.forEach((task) => {
      if (habit.rule.taskStatusRule?.statusType === 'start_timeout') {
        // 检查启动超时（拖延）
        this.checkStartTimeout(habit, task);
      } else if (habit.rule.taskStatusRule?.statusType === 'completion_timeout') {
        // 检查完成超时（低效率）
        this.checkCompletionTimeout(habit, task);
      }
    });
  }

  /**
   * 检查启动超时
   */
  private checkStartTimeout(habit: BadHabit, task: Task) {
    // 这里需要从任务的验证数据中获取超时次数
    // 假设任务有 startTimeoutCount 字段记录超时次数
    const timeoutCount = (task as any).startTimeoutCount || 0;
    
    if (timeoutCount > 0) {
      const { recordOccurrence } = useHabitCanStore.getState();
      const today = this.formatDate(new Date());
      const countPerOccurrence = habit.rule.taskStatusRule?.countPerOccurrence || 1;
      
      // 记录每次超时
      for (let i = 0; i < timeoutCount * countPerOccurrence; i++) {
        recordOccurrence(habit.id, today, {
          time: new Date().toTimeString().slice(0, 5),
          reason: `任务「${task.title}」启动超时`,
          relatedTaskId: task.id,
        });
      }
    }
  }

  /**
   * 检查完成超时
   */
  private checkCompletionTimeout(habit: BadHabit, task: Task) {
    if (!task.scheduledEnd) return;
    
    const now = new Date();
    const endTime = new Date(task.scheduledEnd);
    
    // 如果任务已过期但未完成
    if (now > endTime && task.status !== 'completed') {
      const { recordOccurrence } = useHabitCanStore.getState();
      const today = this.formatDate(new Date());
      
      recordOccurrence(habit.id, today, {
        time: new Date().toTimeString().slice(0, 5),
        reason: `任务「${task.title}」预设时长内未完成`,
        relatedTaskId: task.id,
      });
    }
  }

  /**
   * 每日结算（检查时间阈值和关键词规则）
   */
  async performDailySettlement(date?: Date) {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);
    
    console.log('🏺 执行每日坏习惯结算:', dateStr);
    
    const { habits } = useHabitCanStore.getState();
    const { tasks } = useTaskStore.getState();
    
    // 获取当天的所有任务
    const dayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = this.formatDate(new Date(task.scheduledStart));
      return taskDate === dateStr;
    });

    // 检查每个启用的习惯
    habits.forEach((habit) => {
      if (!habit.enabled || !habit.rule.enabled) return;
      
      if (habit.rule.type === 'time_threshold') {
        this.checkTimeThresholdRule(habit, dayTasks, dateStr);
      } else if (habit.rule.type === 'keyword') {
        this.checkKeywordRule(habit, dayTasks, dateStr);
      }
    });
  }

  /**
   * 检查时间阈值规则（熬夜、晚起）
   */
  private checkTimeThresholdRule(habit: BadHabit, tasks: Task[], date: string) {
    if (!habit.rule.timeThreshold) return;
    
    const { time, comparison, checkType } = habit.rule.timeThreshold;
    const { recordOccurrence } = useHabitCanStore.getState();
    
    if (tasks.length === 0) return;
    
    let targetTask: Task | undefined;
    
    if (checkType === 'first_event') {
      // 找到最早的任务
      targetTask = tasks.reduce((earliest, task) => {
        if (!task.scheduledStart) return earliest;
        if (!earliest || !earliest.scheduledStart) return task;
        return new Date(task.scheduledStart) < new Date(earliest.scheduledStart) ? task : earliest;
      });
    } else if (checkType === 'last_event') {
      // 找到最晚的任务
      targetTask = tasks.reduce((latest, task) => {
        if (!task.scheduledEnd) return latest;
        if (!latest || !latest.scheduledEnd) return task;
        return new Date(task.scheduledEnd) > new Date(latest.scheduledEnd) ? task : latest;
      });
    }
    
    if (!targetTask) return;
    
    const targetTime = checkType === 'first_event' 
      ? targetTask.scheduledStart 
      : targetTask.scheduledEnd;
    
    if (!targetTime) return;
    
    const taskTime = new Date(targetTime).toTimeString().slice(0, 5);
    const thresholdTime = time;
    
    const isViolation = comparison === 'after' 
      ? taskTime > thresholdTime 
      : taskTime < thresholdTime;
    
    if (isViolation) {
      recordOccurrence(habit.id, date, {
        time: taskTime,
        reason: `${checkType === 'first_event' ? '第一个任务' : '最后一个任务'}时间为 ${taskTime}，${comparison === 'after' ? '晚于' : '早于'} ${thresholdTime}`,
        relatedTaskId: targetTask.id,
      });
    }
  }

  /**
   * 检查关键词规则（点外卖、不吃午饭）
   */
  private checkKeywordRule(habit: BadHabit, tasks: Task[], date: string) {
    if (!habit.rule.keywordRule) return;
    
    const { keywords, matchType, timeRange, shouldExist } = habit.rule.keywordRule;
    const { recordOccurrence } = useHabitCanStore.getState();
    
    // 过滤时间范围内的任务
    let filteredTasks = tasks;
    if (timeRange) {
      filteredTasks = tasks.filter((task) => {
        if (!task.scheduledStart) return false;
        const taskTime = new Date(task.scheduledStart).toTimeString().slice(0, 5);
        return taskTime >= timeRange.start && taskTime <= timeRange.end;
      });
    }
    
    // 检查关键词匹配
    const matchedTasks = filteredTasks.filter((task) => {
      const text = `${task.title} ${task.description || ''} ${task.tags?.join(' ') || ''}`.toLowerCase();
      
      if (matchType === 'any') {
        return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
      } else {
        return keywords.every((keyword) => text.includes(keyword.toLowerCase()));
      }
    });
    
    const hasMatch = matchedTasks.length > 0;
    
    // shouldExist=true: 存在则记录（如点外卖）
    // shouldExist=false: 不存在则记录（如不吃午饭）
    if ((shouldExist && hasMatch) || (!shouldExist && !hasMatch)) {
      if (shouldExist) {
        // 每个匹配的任务记录一次
        matchedTasks.forEach((task) => {
          recordOccurrence(habit.id, date, {
            time: task.scheduledStart ? new Date(task.scheduledStart).toTimeString().slice(0, 5) : '00:00',
            reason: `任务「${task.title}」包含关键词: ${keywords.join('、')}`,
            relatedTaskId: task.id,
          });
        });
      } else {
        // 不存在则记录一次
        recordOccurrence(habit.id, date, {
          time: timeRange?.start || '12:00',
          reason: `${timeRange ? `${timeRange.start}-${timeRange.end}` : '全天'}未找到包含关键词的任务: ${keywords.join('、')}`,
        });
      }
    }
  }

  /**
   * 安排每日结算任务
   */
  private scheduleDailySettlement() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 00:01
    
    const timeUntilSettlement = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.performDailySettlement();
      // 每24小时执行一次
      setInterval(() => {
        this.performDailySettlement();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilSettlement);
    
    console.log('🏺 每日结算已安排，下次执行时间:', tomorrow.toLocaleString());
  }

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 手动触发某天的结算（用于补算历史数据）
   */
  async settlementForDate(date: Date) {
    await this.performDailySettlement(date);
  }
}

export const habitMonitorService = new HabitMonitorService();

