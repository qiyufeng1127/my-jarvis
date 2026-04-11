import { useTaskStore } from '@/stores/taskStore';
import { useRPGStore } from '@/stores/rpgStore';
import { RPGNotificationService } from './rpgNotificationService';
import { RPGRadarUpdater } from './rpgRadarUpdater';
import { RPGAIAnalyzer } from './rpgAIAnalyzer';

/**
 * RPG任务监控服务（P1核心功能）
 * 实时监控任务进度，检测超时和低效情况
 */
export class RPGTaskMonitor {
  private static monitorInterval: NodeJS.Timeout | null = null;
  private static isMonitoring = false;
  
  /**
   * 启动任务监控
   */
  static startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️ 任务监控已在运行');
      return;
    }
    
    console.log('🔍 启动RPG任务监控服务...');
    this.isMonitoring = true;
    
    // 每5分钟检查一次
    this.monitorInterval = setInterval(() => {
      this.checkAllTasks();
    }, 5 * 60 * 1000);
    
    // 立即执行一次
    this.checkAllTasks();
  }
  
  /**
   * 停止任务监控
   */
  static stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.isMonitoring = false;
      console.log('🛑 RPG任务监控已停止');
    }
  }
  
  /**
   * 检查所有任务
   */
  private static checkAllTasks(): void {
    const taskStore = useTaskStore.getState();
    const now = new Date();
    
    // 获取今日的RPG任务
    const todayRPGTasks = taskStore.tasks.filter(task => {
      if (!task.metadata?.rpgTaskId) return false;
      if (task.status === 'completed') return false;
      
      const taskDate = task.scheduledStart ? new Date(task.scheduledStart) : null;
      if (!taskDate) return false;
      
      return taskDate.toDateString() === now.toDateString();
    });
    
    console.log('🔍 检查', todayRPGTasks.length, '个RPG任务');
    
    todayRPGTasks.forEach(task => {
      // 检查超时
      if (task.scheduledEnd && new Date(task.scheduledEnd) < now) {
        this.handleTaskTimeout(task);
      }
      
      // 检查即将超时（15分钟内）
      if (task.scheduledEnd) {
        const timeLeft = new Date(task.scheduledEnd).getTime() - now.getTime();
        const minutesLeft = Math.floor(timeLeft / (1000 * 60));
        
        if (minutesLeft > 0 && minutesLeft <= 15 && task.status === 'in_progress') {
          this.handleTaskWarning(task, minutesLeft);
        }
      }
      
      // 检查低效（任务进行中，但耗时超过预期50%）
      if (task.status === 'in_progress' && task.actualStart) {
        const elapsed = now.getTime() - new Date(task.actualStart).getTime();
        const elapsedMinutes = elapsed / (1000 * 60);
        const expectedMinutes = task.durationMinutes;
        
        if (elapsedMinutes > expectedMinutes * 1.5) {
          this.handleLowEfficiency(task, elapsedMinutes, expectedMinutes);
        }
      }
    });
  }
  
  /**
   * 处理任务超时
   */
  private static handleTaskTimeout(task: any): void {
    const now = new Date();
    const scheduledEnd = new Date(task.scheduledEnd);
    const delayMinutes = Math.floor((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
    
    console.log('⏰ 任务超时:', task.title, '延迟', delayMinutes, '分钟');
    
    // 语音提醒
    RPGNotificationService.showWarning(
      '任务超时提醒',
      `「${task.title}」已超时 ${delayMinutes} 分钟`
    );
    
    // 更新负向雷达图
    RPGRadarUpdater.updateRadarOnTaskFail(
      {
        id: task.metadata.rpgTaskId,
        title: task.title,
        description: task.description || '',
        type: task.metadata.rpgTaskType || 'normal',
        difficulty: 'medium',
        expReward: 0,
        goldReward: 0,
        completed: false,
        isImprovement: false,
      },
      'timeout'
    );
  }
  
  /**
   * 处理任务即将超时警告
   */
  private static handleTaskWarning(task: any, minutesLeft: number): void {
    console.log('⚠️ 任务即将超时:', task.title, '剩余', minutesLeft, '分钟');
    
    // 语音提醒
    RPGNotificationService.showTaskReminder(task.title, minutesLeft);
  }
  
  /**
   * 处理低效任务
   */
  private static handleLowEfficiency(task: any, elapsedMinutes: number, expectedMinutes: number): void {
    const efficiency = Math.round((expectedMinutes / elapsedMinutes) * 100);
    
    console.log('🐢 任务低效:', task.title, '效率', efficiency, '%');
    
    // 语音提醒
    RPGNotificationService.showWarning(
      '效率提醒',
      `「${task.title}」耗时超过预期，当前效率 ${efficiency}%`
    );
    
    // 更新负向雷达图
    RPGRadarUpdater.updateRadarOnTaskFail(
      {
        id: task.metadata.rpgTaskId,
        title: task.title,
        description: task.description || '',
        type: task.metadata.rpgTaskType || 'normal',
        difficulty: 'medium',
        expReward: 0,
        goldReward: 0,
        completed: false,
        isImprovement: false,
      },
      'low-efficiency'
    );
  }
  
  /**
   * 为超时任务生成改进任务
   */
  private static async generateImprovementTaskForTimeout(task: any): Promise<void> {
    const rpgStore = useRPGStore.getState();
    
    const improvementTask = {
      id: `improvement-timeout-${Date.now()}`,
      title: '⚠️ 改进拖延：明天准时开始任务',
      description: `今天「${task.title}」超时了。明天尝试在计划时间准时开始，设置提醒！`,
      type: 'improvement' as const,
      difficulty: 'medium' as const,
      expReward: 100,
      goldReward: 60,
      completed: false,
      isImprovement: true,
    };
    
    rpgStore.addDailyTask(improvementTask);
    
    RPGNotificationService.showImprovementComplete('超时改进任务');
    
    console.log('✅ 已生成超时改进任务:', improvementTask.title);
  }
  
  /**
   * 为低效任务生成改进任务
   */
  private static async generateImprovementTaskForLowEfficiency(task: any): Promise<void> {
    const rpgStore = useRPGStore.getState();
    
    const improvementTask = {
      id: `improvement-efficiency-${Date.now()}`,
      title: '⚠️ 提升效率：使用番茄工作法',
      description: `今天「${task.title}」效率较低。明天尝试番茄工作法：25分钟专注+5分钟休息`,
      type: 'improvement' as const,
      difficulty: 'medium' as const,
      expReward: 100,
      goldReward: 60,
      completed: false,
      isImprovement: true,
    };
    
    rpgStore.addDailyTask(improvementTask);
    
    RPGNotificationService.showImprovementComplete('效率改进任务');
    
    console.log('✅ 已生成效率改进任务:', improvementTask.title);
  }
  
  /**
   * 检查任务完成情况并生成每日报告
   */
  static async generateDailyReport(): Promise<{
    completed: number;
    total: number;
    improvements: number;
    efficiency: number;
    suggestions: string[];
  }> {
    const taskStore = useTaskStore.getState();
    const rpgStore = useRPGStore.getState();
    const today = new Date();
    
    // 获取今日RPG任务
    const todayRPGTasks = taskStore.tasks.filter(task => {
      if (!task.metadata?.rpgTaskId) return false;
      
      const taskDate = task.scheduledStart ? new Date(task.scheduledStart) : null;
      if (!taskDate) return false;
      
      return taskDate.toDateString() === today.toDateString();
    });
    
    const completed = todayRPGTasks.filter(t => t.status === 'completed').length;
    const total = todayRPGTasks.length;
    const improvements = todayRPGTasks.filter(t => 
      t.status === 'completed' && t.tags?.includes('改进任务')
    ).length;
    
    // 计算平均效率
    const efficiencyTasks = todayRPGTasks.filter(t => 
      t.status === 'completed' && t.completionEfficiency !== undefined
    );
    const avgEfficiency = efficiencyTasks.length > 0
      ? Math.round(efficiencyTasks.reduce((sum, t) => sum + (t.completionEfficiency || 0), 0) / efficiencyTasks.length)
      : 0;
    
    // 生成建议
    const suggestions: string[] = [];
    
    if (completed === 0) {
      suggestions.push('今天还没有完成任务，从最简单的开始吧！');
    } else if (completed < total * 0.5) {
      suggestions.push('今天完成率较低，明天尝试减少任务数量，专注质量');
    } else if (completed === total) {
      suggestions.push('🎉 今天全部完成！明天可以挑战更难的任务');
    }
    
    if (avgEfficiency < 60) {
      suggestions.push('任务效率偏低，建议使用番茄工作法提高专注力');
    } else if (avgEfficiency >= 80) {
      suggestions.push('✨ 效率很高！保持这个状态');
    }
    
    if (improvements > 0) {
      suggestions.push(`💪 完成了${improvements}个改进任务，持续进步中！`);
    }
    
    return {
      completed,
      total,
      improvements,
      efficiency: avgEfficiency,
      suggestions,
    };
  }
}

