import { useHabitStore } from '@/stores/habitStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';

class HabitReverseDetectionService {
  /**
   * 检查反向检测规则（每天凌晨执行）
   */
  checkReverseDetectionRules() {
    const habitStore = useHabitStore.getState();
    const taskStore = useTaskStore.getState();
    
    const habits = habitStore.habits.filter(
      (h) => !h.archivedAt && h.recognitionRule?.reverseDetection?.enabled
    );
    
    if (habits.length === 0) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    for (const habit of habits) {
      const rule = habit.recognitionRule!.reverseDetection!;
      
      // 检查昨天在指定时间段内是否有匹配的任务
      const hasMatchingTask = this.checkTimeRangeForKeywords(
        taskStore.tasks,
        yesterdayStr,
        rule.timeRange,
        rule.notFoundKeywords
      );
      
      // 如果没有找到匹配的任务，说明完成了习惯（如：不熬夜）
      if (!hasMatchingTask) {
        habitStore.logHabit(habit.id, 1, '反向检测：未找到关键词');
        console.log(`✅ 反向检测完成: ${habit.name}`);
      } else {
        console.log(`❌ 反向检测未完成: ${habit.name}`);
      }
    }
  }
  
  /**
   * 检查指定时间段内是否有包含关键词的任务
   */
  private checkTimeRangeForKeywords(
    tasks: Task[],
    dateStr: string,
    timeRange: { startTime: string; endTime: string; crossDay: boolean },
    keywords: string[]
  ): boolean {
    const date = new Date(dateStr);
    
    // 构建时间范围
    const [startHour, startMinute] = timeRange.startTime.split(':').map(Number);
    const [endHour, endMinute] = timeRange.endTime.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    let endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // 如果跨天，结束时间加一天
    if (timeRange.crossDay && endHour < startHour) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    // 筛选在时间范围内的任务
    const tasksInRange = tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      
      const taskTime = new Date(task.scheduledStart);
      return taskTime >= startTime && taskTime <= endTime;
    });
    
    // 检查是否有任务包含关键词
    for (const task of tasksInRange) {
      for (const keyword of keywords) {
        if (
          task.title.includes(keyword) ||
          task.tags?.includes(keyword)
        ) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 启动定时检查（每天凌晨1点）
   */
  start() {
    // 计算到明天凌晨1点的时间
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(1, 0, 0, 0);
    
    const timeUntilCheck = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.checkReverseDetectionRules();
      
      // 之后每24小时检查一次
      setInterval(() => {
        this.checkReverseDetectionRules();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCheck);
    
    console.log('🌙 反向检测服务已启动');
  }
  
  /**
   * 手动触发检查（用于测试）
   */
  manualCheck() {
    this.checkReverseDetectionRules();
  }
}

export const habitReverseDetectionService = new HabitReverseDetectionService();


