/**
 * 行为监督服务
 * 分析用户行为，触发主动提醒
 */

import { useTaskStore } from '@/stores/taskStore';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';
import { aiService } from './aiService';

export interface BehaviorAlert {
  id: string;
  type: 'warning' | 'praise' | 'reminder';
  title: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

class BehaviorMonitorService {
  private lastCheckTime: number = 0;
  private checkInterval: number = 5 * 60 * 1000; // 5分钟检查一次
  
  /**
   * 检查用户行为并生成提醒
   */
  async checkBehavior(): Promise<BehaviorAlert[]> {
    const now = Date.now();
    
    // 避免频繁检查
    if (now - this.lastCheckTime < this.checkInterval) {
      return [];
    }
    
    this.lastCheckTime = now;
    
    const alerts: BehaviorAlert[] = [];
    
    // 检查各种行为模式
    const mealAlert = await this.checkMealPattern();
    if (mealAlert) alerts.push(mealAlert);
    
    const sleepAlert = await this.checkSleepPattern();
    if (sleepAlert) alerts.push(sleepAlert);
    
    const taskAlert = await this.checkTaskCompletion();
    if (taskAlert) alerts.push(taskAlert);
    
    const streakAlert = await this.checkStreak();
    if (streakAlert) alerts.push(streakAlert);
    
    return alerts;
  }
  
  /**
   * 检查饮食模式
   */
  private async checkMealPattern(): Promise<BehaviorAlert | null> {
    const { userBehavior, personality } = useAIPersonalityStore.getState();
    const now = Date.now();
    const currentHour = new Date().getHours();
    
    // 检查是否很久没吃饭
    if (userBehavior.lastMealTime) {
      const hoursSinceLastMeal = (now - userBehavior.lastMealTime) / (1000 * 60 * 60);
      
      // 超过6小时没吃饭
      if (hoursSinceLastMeal > 6) {
        const message = await this.generatePersonalizedMessage(
          'meal_warning',
          `用户已经${hoursSinceLastMeal.toFixed(1)}小时没吃饭了`
        );
        
        return {
          id: `meal-${now}`,
          type: 'warning',
          title: '该吃饭了',
          message,
          timestamp: now,
          priority: 'high',
        };
      }
    }
    
    // 检查深夜进食
    if (currentHour >= 21 && currentHour < 24) {
      if (userBehavior.lastMealTime && (now - userBehavior.lastMealTime) < 30 * 60 * 1000) {
        const message = await this.generatePersonalizedMessage(
          'late_night_eating',
          `用户在晚上${currentHour}点吃东西`
        );
        
        return {
          id: `meal-late-${now}`,
          type: 'warning',
          title: '深夜进食',
          message,
          timestamp: now,
          priority: 'medium',
        };
      }
    }
    
    return null;
  }
  
  /**
   * 检查睡眠模式
   */
  private async checkSleepPattern(): Promise<BehaviorAlert | null> {
    const { userBehavior } = useAIPersonalityStore.getState();
    const now = Date.now();
    const currentHour = new Date().getHours();
    
    // 检查熬夜
    if (currentHour >= 0 && currentHour < 6) {
      const tasks = useTaskStore.getState().tasks;
      const recentActivity = tasks.some(t => 
        t.updatedAt && (now - new Date(t.updatedAt).getTime()) < 30 * 60 * 1000
      );
      
      if (recentActivity) {
        const message = await this.generatePersonalizedMessage(
          'staying_up_late',
          `用户在凌晨${currentHour}点还在活动`
        );
        
        return {
          id: `sleep-late-${now}`,
          type: 'warning',
          title: '该睡觉了',
          message,
          timestamp: now,
          priority: 'high',
        };
      }
    }
    
    // 检查睡懒觉
    if (currentHour >= 10 && currentHour < 14) {
      if (userBehavior.lastWakeTime && (now - userBehavior.lastWakeTime) < 30 * 60 * 1000) {
        const message = await this.generatePersonalizedMessage(
          'wake_up_late',
          `用户在${currentHour}点才起床`
        );
        
        return {
          id: `sleep-wake-${now}`,
          type: 'reminder',
          title: '起床有点晚',
          message,
          timestamp: now,
          priority: 'low',
        };
      }
    }
    
    return null;
  }
  
  /**
   * 检查任务完成情况
   */
  private async checkTaskCompletion(): Promise<BehaviorAlert | null> {
    const { tasks } = useTaskStore.getState();
    const { updateUserBehavior } = useAIPersonalityStore.getState();
    const now = Date.now();
    
    // 获取今天的任务
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(t => {
      if (!t.scheduledStart) return false;
      const taskDate = new Date(t.scheduledStart);
      return taskDate >= today;
    });
    
    if (todayTasks.length === 0) return null;
    
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const completionRate = completedTasks.length / todayTasks.length;
    
    // 更新用户行为数据
    updateUserBehavior({ todayTaskCompletionRate: completionRate });
    
    // 完成率很低的警告
    if (todayTasks.length >= 3 && completionRate < 0.3) {
      const currentHour = new Date().getHours();
      
      // 下午或晚上才提醒
      if (currentHour >= 14) {
        const message = await this.generatePersonalizedMessage(
          'low_completion_rate',
          `今天完成了${completedTasks.length}/${todayTasks.length}个任务，完成率${(completionRate * 100).toFixed(0)}%`
        );
        
        return {
          id: `task-low-${now}`,
          type: 'warning',
          title: '任务完成率偏低',
          message,
          timestamp: now,
          priority: 'medium',
        };
      }
    }
    
    // 完成率很高的表扬
    if (todayTasks.length >= 3 && completionRate >= 0.8) {
      const message = await this.generatePersonalizedMessage(
        'high_completion_rate',
        `今天完成了${completedTasks.length}/${todayTasks.length}个任务，完成率${(completionRate * 100).toFixed(0)}%`
      );
      
      return {
        id: `task-high-${now}`,
        type: 'praise',
        title: '完成得很棒',
        message,
        timestamp: now,
        priority: 'low',
      };
    }
    
    return null;
  }
  
  /**
   * 检查连续完成天数
   */
  private async checkStreak(): Promise<BehaviorAlert | null> {
    const { userBehavior, updateUserBehavior } = useAIPersonalityStore.getState();
    const { tasks } = useTaskStore.getState();
    const now = Date.now();
    
    // 计算连续完成天数
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const dayTasks = tasks.filter(t => {
        if (!t.scheduledStart) return false;
        const taskDate = new Date(t.scheduledStart);
        return (
          taskDate.getFullYear() === checkDate.getFullYear() &&
          taskDate.getMonth() === checkDate.getMonth() &&
          taskDate.getDate() === checkDate.getDate()
        );
      });
      
      if (dayTasks.length === 0) break;
      
      const completedCount = dayTasks.filter(t => t.status === 'completed').length;
      const completionRate = completedCount / dayTasks.length;
      
      if (completionRate >= 0.7) {
        streak++;
      } else {
        break;
      }
    }
    
    // 更新连续天数
    if (streak !== userBehavior.consecutiveCompletedDays) {
      updateUserBehavior({ consecutiveCompletedDays: streak });
    }
    
    // 达到里程碑时表扬
    if (streak > 0 && [3, 7, 14, 30, 60, 100].includes(streak)) {
      const message = await this.generatePersonalizedMessage(
        'streak_milestone',
        `用户已经连续${streak}天完成任务`
      );
      
      return {
        id: `streak-${now}`,
        type: 'praise',
        title: `连续${streak}天！`,
        message,
        timestamp: now,
        priority: 'medium',
      };
    }
    
    return null;
  }
  
  /**
   * 生成个性化消息
   */
  private async generatePersonalizedMessage(
    scenario: string,
    context: string
  ): Promise<string> {
    const { personality } = useAIPersonalityStore.getState();
    
    try {
      const response = await aiService.chatWithPersonality(
        `场景：${scenario}\n上下文：${context}`,
        { actionDescription: '' }
      );
      
      if (response.success && response.content) {
        return response.content;
      }
    } catch (error) {
      console.error('生成个性化消息失败:', error);
    }
    
    // 降级：使用预设消息
    return this.getFallbackMessage(scenario, personality.toxicity);
  }
  
  /**
   * 获取降级消息
   */
  private getFallbackMessage(scenario: string, toxicity: number): string {
    const messages: Record<string, { toxic: string; normal: string; gentle: string }> = {
      meal_warning: {
        toxic: '都多久没吃饭了？想饿死自己啊？赶紧去吃点东西！',
        normal: '好久没吃饭了哦，该补充能量了，去吃点东西吧~',
        gentle: '亲，注意到你好久没吃饭了，记得照顾好自己哦💕',
      },
      late_night_eating: {
        toxic: '大晚上的还吃？明天又要喊减肥了吧。',
        normal: '这么晚了还吃东西，对身体不太好哦。',
        gentle: '晚上吃太多会影响睡眠呢，下次早点吃吧~',
      },
      staying_up_late: {
        toxic: '都几点了还不睡？明天又要睡到中午吧。赶紧睡觉！',
        normal: '已经很晚了，该休息了，明天还有事呢。',
        gentle: '亲爱的，已经很晚了，早点休息对身体好哦💤',
      },
      wake_up_late: {
        toxic: '又睡到这个点？一天都过去一半了。',
        normal: '起床有点晚了哦，早起会更有精神~',
        gentle: '睡了个好觉吧，不过早起会让一天更充实哦~',
      },
      low_completion_rate: {
        toxic: '今天任务完成得这么少？是不是又摸鱼了？',
        normal: '今天的任务完成率有点低，加把劲吧！',
        gentle: '今天可能有点累了，不过还有时间，慢慢来~',
      },
      high_completion_rate: {
        toxic: '哟，今天效率不错啊，难得见你这么认真。',
        normal: '今天完成得很棒！继续保持~',
        gentle: '太棒了！你今天真的很努力，为你骄傲💪',
      },
      streak_milestone: {
        toxic: '连续这么多天了？你可以啊，别又三天打鱼两天晒网。',
        normal: '连续完成任务这么多天了，很厉害！',
        gentle: '哇！连续这么多天，你真的太棒了！继续加油🎉',
      },
    };
    
    const messageSet = messages[scenario];
    if (!messageSet) return '继续加油！';
    
    if (toxicity > 70) return messageSet.toxic;
    if (toxicity > 40) return messageSet.normal;
    return messageSet.gentle;
  }
  
  /**
   * 记录用户行为事件
   */
  recordBehaviorEvent(event: 'meal' | 'sleep' | 'wake' | 'task_complete') {
    const { updateUserBehavior } = useAIPersonalityStore.getState();
    const now = Date.now();
    
    switch (event) {
      case 'meal':
        updateUserBehavior({ lastMealTime: now });
        break;
      case 'sleep':
        updateUserBehavior({ lastSleepTime: now });
        break;
      case 'wake':
        updateUserBehavior({ lastWakeTime: now });
        break;
    }
  }
}

export const behaviorMonitorService = new BehaviorMonitorService();


