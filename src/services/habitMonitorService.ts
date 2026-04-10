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
  private dailySettlementTimeout: NodeJS.Timeout | null = null;
  private dailySettlementInterval: NodeJS.Timeout | null = null;

  initialize() {
    if (this.initialized) return;
    
    console.log('🏺 坏习惯监控服务启动');
    this.initialized = true;
    
    // 立即执行一次检查
    this.checkAllRules();
    
    // 每分钟检查一次任务状态规则（拖延、低效率）
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
    if (this.dailySettlementTimeout) {
      clearTimeout(this.dailySettlementTimeout);
      this.dailySettlementTimeout = null;
    }
    if (this.dailySettlementInterval) {
      clearInterval(this.dailySettlementInterval);
      this.dailySettlementInterval = null;
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
        // 时间阈值规则（熬夜、晚起）- 实时检查
        this.checkTimeThresholdRuleRealtime(habit);
        break;
      case 'keyword':
        // 关键词规则（点外卖、不吃午饭）- 实时检查
        this.checkKeywordRuleRealtime(habit);
        break;
      case 'task_status':
        // 任务状态规则（拖延、低效率）- 实时监控
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
    // 从 localStorage 读取任务的倒计时状态
    const storageKey = `countdown_${task.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      
      const state = JSON.parse(saved);
      const timeoutCount = state.startTimeoutCount || 0;
      
      if (timeoutCount > 0) {
        const { recordOccurrence } = useHabitCanStore.getState();
        const today = this.formatDate(new Date());
        const countPerOccurrence = habit.rule.taskStatusRule?.countPerOccurrence || 1;
        
        // 检查已记录的次数
        const recordedKey = `habit_recorded_start_count_${task.id}_${today}`;
        const recordedCount = parseInt(localStorage.getItem(recordedKey) || '0');
        
        // 只记录新增的超时次数
        const newTimeouts = timeoutCount - recordedCount;
        
        if (newTimeouts > 0) {
          // 每次超时单独记录一条
          for (let i = 0; i < newTimeouts * countPerOccurrence; i++) {
            recordOccurrence(habit.id, today, {
              time: new Date().toTimeString().slice(0, 5),
              reason: `任务「${task.title}」启动超时`,
              relatedTaskId: task.id,
            });
          }
          
          // 更新已记录的次数
          localStorage.setItem(recordedKey, timeoutCount.toString());
          console.log(`🏺 记录拖延: ${task.title} (新增 ${newTimeouts} 次)`);
        }
      }
    } catch (error) {
      console.error('❌ 检查启动超时失败:', error);
    }
  }

  /**
   * 检查完成超时
   */
  private checkCompletionTimeout(habit: BadHabit, task: Task) {
    if (!task.scheduledEnd) return;
    
    // 从 localStorage 读取任务的倒计时状态
    const storageKey = `countdown_${task.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      
      const state = JSON.parse(saved);
      const timeoutCount = state.completeTimeoutCount || 0;
      
      if (timeoutCount > 0) {
        const { recordOccurrence } = useHabitCanStore.getState();
        const today = this.formatDate(new Date());
        const countPerOccurrence = habit.rule.taskStatusRule?.countPerOccurrence || 1;
        
        // 检查已记录的次数
        const recordedKey = `habit_recorded_complete_count_${task.id}_${today}`;
        const recordedCount = parseInt(localStorage.getItem(recordedKey) || '0');
        
        // 只记录新增的超时次数
        const newTimeouts = timeoutCount - recordedCount;
        
        if (newTimeouts > 0) {
          // 每次超时单独记录一条
          for (let i = 0; i < newTimeouts * countPerOccurrence; i++) {
            recordOccurrence(habit.id, today, {
              time: new Date().toTimeString().slice(0, 5),
              reason: `任务「${task.title}」完成超时`,
              relatedTaskId: task.id,
            });
          }
          
          // 更新已记录的次数
          localStorage.setItem(recordedKey, timeoutCount.toString());
          console.log(`🏺 记录低效率: ${task.title} (新增 ${newTimeouts} 次)`);
        }
      }
    } catch (error) {
      console.error('❌ 检查完成超时失败:', error);
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
    
    // 获取"睡眠日"的所有任务（早上7:00到次日早上6:59）
    const dayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      const sleepDate = this.getSleepDate(taskDate);
      return sleepDate === dateStr;
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
   * 获取"睡眠日"日期
   * 规则：早上7:00-23:59属于当天，凌晨0:00-6:59属于前一天
   * 例如：2月13号凌晨4:36 -> 返回 2月12号
   */
  private getSleepDate(date: Date): string {
    const hours = date.getHours();
    
    // 如果是凌晨0:00-6:59，归属到前一天
    if (hours >= 0 && hours < 7) {
      const prevDay = new Date(date);
      prevDay.setDate(prevDay.getDate() - 1);
      return this.formatDate(prevDay);
    }
    
    // 如果是7:00-23:59，归属到当天
    return this.formatDate(date);
  }

  /**
   * 实时检查时间阈值规则（熬夜、晚起）
   */
  private checkTimeThresholdRuleRealtime(habit: BadHabit) {
    if (!habit.rule.timeThreshold) return;
    
    const { time, comparison, checkType } = habit.rule.timeThreshold;
    const { recordOccurrence } = useHabitCanStore.getState();
    const { tasks } = useTaskStore.getState();
    
    const now = new Date();
    const today = this.formatDate(now);
    
    // 获取今天的所有任务
    const todayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = this.formatDate(new Date(task.scheduledStart));
      return taskDate === today;
    });
    
    if (todayTasks.length === 0) return;
    
    let targetTask: any;
    
    if (checkType === 'first_event') {
      // 找到最早的任务（晚起检查）
      targetTask = todayTasks.reduce((earliest, task) => {
        if (!task.scheduledStart) return earliest;
        if (!earliest || !earliest.scheduledStart) return task;
        return new Date(task.scheduledStart) < new Date(earliest.scheduledStart) ? task : earliest;
      });
    } else if (checkType === 'last_event') {
      // 找到最晚的任务（熬夜检查）
      targetTask = todayTasks.reduce((latest, task) => {
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
    
    const taskDateTime = new Date(targetTime);
    const taskTime = taskDateTime.toTimeString().slice(0, 5);
    const taskHour = taskDateTime.getHours();
    const thresholdTime = time;
    
    // 检查是否已经记录过
    const recordKey = `habit_recorded_time_${habit.id}_${targetTask.id}_${today}`;
    if (localStorage.getItem(recordKey)) return;
    
    // 处理跨天情况：凌晨0:00-6:59的时间需要特殊处理
    let isViolation = false;
    
    if (comparison === 'after') {
      // 检查是否晚于阈值（熬夜）
      if (taskHour >= 0 && taskHour < 7) {
        // 凌晨时段（0:00-6:59）：一定算作熬夜
        isViolation = true;
      } else {
        // 正常时段（7:00-23:59）：直接比较时间
        isViolation = taskTime > thresholdTime;
      }
    } else {
      // 检查是否早于阈值（晚起）
      if (taskHour >= 0 && taskHour < 7) {
        // 凌晨时段：不算晚起
        isViolation = false;
      } else {
        // 正常时段：直接比较时间
        isViolation = taskTime < thresholdTime;
      }
    }
    
    if (isViolation) {
      const actualDate = taskDateTime.toLocaleDateString('zh-CN');
      recordOccurrence(habit.id, today, {
        time: taskTime,
        reason: `${checkType === 'first_event' ? '第一个任务' : '最后一个任务'}时间为 ${actualDate} ${taskTime}`,
        relatedTaskId: targetTask.id,
      });
      
      // 标记已记录
      localStorage.setItem(recordKey, 'true');
      console.log(`🏺 记录${habit.name}: ${targetTask.title} (${taskTime})`);
    }
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
    
    const taskDateTime = new Date(targetTime);
    const taskTime = taskDateTime.toTimeString().slice(0, 5);
    const taskHour = taskDateTime.getHours();
    const thresholdTime = time;
    
    // 处理跨天情况：凌晨0:00-6:59的时间需要特殊处理
    let isViolation = false;
    
    if (comparison === 'after') {
      // 检查是否晚于阈值
      if (taskHour >= 0 && taskHour < 7) {
        // 凌晨时段（0:00-6:59）：一定算作熬夜（晚于任何晚上的时间）
        isViolation = true;
      } else {
        // 正常时段（7:00-23:59）：直接比较时间
        isViolation = taskTime > thresholdTime;
      }
    } else {
      // 检查是否早于阈值（晚起）
      if (taskHour >= 0 && taskHour < 7) {
        // 凌晨时段：不算晚起
        isViolation = false;
      } else {
        // 正常时段：直接比较时间
        isViolation = taskTime < thresholdTime;
      }
    }
    
    if (isViolation) {
      const actualDate = taskDateTime.toLocaleDateString('zh-CN');
      recordOccurrence(habit.id, date, {
        time: taskTime,
        reason: `${checkType === 'first_event' ? '第一个任务' : '最后一个任务'}时间为 ${actualDate} ${taskTime}，${comparison === 'after' ? '晚于' : '早于'} ${thresholdTime}`,
        relatedTaskId: targetTask.id,
      });
    }
  }

  /**
   * 实时检查关键词规则（点外卖、不吃午饭）
   */
  private checkKeywordRuleRealtime(habit: BadHabit) {
    if (!habit.rule.keywordRule) return;
    
    const { keywords, matchType, timeRange, shouldExist } = habit.rule.keywordRule;
    const { recordOccurrence } = useHabitCanStore.getState();
    const { tasks } = useTaskStore.getState();
    
    const now = new Date();
    const today = this.formatDate(now);
    const currentTime = now.toTimeString().slice(0, 5);
    
    // 获取今天的所有任务
    const todayTasks = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = this.formatDate(new Date(task.scheduledStart));
      return taskDate === today;
    });
    
    // 过滤时间范围内的任务
    let filteredTasks = todayTasks;
    if (timeRange) {
      filteredTasks = todayTasks.filter((task) => {
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
    if (shouldExist && hasMatch) {
      // 每个匹配的任务记录一次
      matchedTasks.forEach((task) => {
        const recordKey = `habit_recorded_keyword_${habit.id}_${task.id}_${today}`;
        if (!localStorage.getItem(recordKey)) {
          recordOccurrence(habit.id, today, {
            time: task.scheduledStart ? new Date(task.scheduledStart).toTimeString().slice(0, 5) : currentTime,
            reason: `任务「${task.title}」包含关键词`,
            relatedTaskId: task.id,
          });
          
          localStorage.setItem(recordKey, 'true');
          console.log(`🏺 记录${habit.name}: ${task.title}`);
        }
      });
    }
    
    // shouldExist=false: 不存在则记录（如不吃午饭）
    // 只在时间范围结束后检查一次
    if (!shouldExist && timeRange) {
      const rangeEndPassed = currentTime > timeRange.end;
      
      if (rangeEndPassed && !hasMatch) {
        const recordKey = `habit_recorded_keyword_${habit.id}_${today}`;
        if (!localStorage.getItem(recordKey)) {
          recordOccurrence(habit.id, today, {
            time: timeRange.end,
            reason: `${timeRange.start}-${timeRange.end} 未找到包含关键词的任务`,
          });
          
          localStorage.setItem(recordKey, 'true');
          console.log(`🏺 记录${habit.name}: 时间段内无相关任务`);
        }
      }
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
    
    this.dailySettlementTimeout = setTimeout(() => {
      this.performDailySettlement();
      this.dailySettlementTimeout = null;

      // 每24小时执行一次
      this.dailySettlementInterval = setInterval(() => {
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

  /**
   * 手动触发检查所有规则（用于任务完成时立即检查）
   */
  checkNow() {
    console.log('🏺 手动触发坏习惯检查');
    this.checkAllRules();
  }
}

export const habitMonitorService = new TagSyncService();

