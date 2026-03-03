import { useRPGStore } from '@/stores/rpgStore';
import type { DailyTask } from '@/stores/rpgStore';

/**
 * RPG雷达图更新服务（P0-5核心功能）
 * 根据任务完成情况实时更新角色能力值
 */
export class RPGRadarUpdater {
  /**
   * 任务完成后更新雷达图
   */
  static updateRadarOnTaskComplete(task: DailyTask, taskData?: any): void {
    console.log('📊 开始更新雷达图，任务:', task.title);
    
    const rpgStore = useRPGStore.getState();
    const { character } = rpgStore;
    
    // 1. 更新正向能力
    const positiveUpdates = this.calculatePositiveUpdates(task, taskData);
    const newPositiveStats = character.positiveStats.map(stat => {
      const update = positiveUpdates[stat.label];
      if (update) {
        const newValue = Math.min(100, Math.max(0, stat.value + update));
        console.log(`  ✅ ${stat.label}: ${stat.value} → ${newValue} (${update > 0 ? '+' : ''}${update})`);
        return { ...stat, value: newValue };
      }
      return stat;
    });
    
    // 2. 更新负向行为（如果是改进任务）
    let newNegativeStats = character.negativeStats;
    if (task.isImprovement) {
      const negativeUpdates = this.calculateNegativeUpdates(task, taskData);
      newNegativeStats = character.negativeStats.map(stat => {
        const update = negativeUpdates[stat.label];
        if (update) {
          const newValue = Math.min(100, Math.max(0, stat.value + update));
          console.log(`  ⚠️ ${stat.label}: ${stat.value} → ${newValue} (${update > 0 ? '+' : ''}${update})`);
          return { ...stat, value: newValue };
        }
        return stat;
      });
    }
    
    // 3. 更新store
    rpgStore.updateCharacter({
      positiveStats: newPositiveStats,
      negativeStats: newNegativeStats,
    });
    
    console.log('✅ 雷达图更新完成');
  }
  
  /**
   * 任务超时/低效时更新雷达图
   */
  static updateRadarOnTaskFail(task: DailyTask, reason: 'timeout' | 'low-efficiency'): void {
    console.log('⚠️ 任务失败，更新负向行为，原因:', reason);
    
    const rpgStore = useRPGStore.getState();
    const { character } = rpgStore;
    
    const negativeUpdates: Record<string, number> = {};
    
    if (reason === 'timeout') {
      negativeUpdates['拖延'] = 5;
      negativeUpdates['逃避'] = 3;
    } else if (reason === 'low-efficiency') {
      negativeUpdates['分心'] = 5;
      negativeUpdates['焦虑'] = 3;
    }
    
    const newNegativeStats = character.negativeStats.map(stat => {
      const update = negativeUpdates[stat.label];
      if (update) {
        const newValue = Math.min(100, stat.value + update);
        console.log(`  ⚠️ ${stat.label}: ${stat.value} → ${newValue} (+${update})`);
        return { ...stat, value: newValue };
      }
      return stat;
    });
    
    rpgStore.updateCharacter({
      negativeStats: newNegativeStats,
    });
    
    console.log('✅ 负向行为已更新');
  }
  
  /**
   * 计算正向能力更新值
   */
  private static calculatePositiveUpdates(task: DailyTask, taskData?: any): Record<string, number> {
    const updates: Record<string, number> = {};
    
    // 基础更新：所有任务完成都增加执行力
    updates['执行力'] = 3;
    
    // 根据任务类型更新不同能力
    const taskType = taskData?.taskType || 'work';
    
    switch (taskType) {
      case 'work':
        updates['赚钱能力'] = 2;
        updates['专注力'] = 2;
        break;
      case 'study':
        updates['学习力'] = 3;
        updates['专注力'] = 2;
        break;
      case 'exercise':
        updates['健康'] = 4;
        updates['执行力'] = 2;
        break;
      case 'social':
        updates['社交力'] = 3;
        updates['情绪管理'] = 2;
        break;
      case 'creative':
        updates['创造力'] = 3;
        updates['学习力'] = 1;
        break;
      case 'rest':
        updates['健康'] = 2;
        updates['情绪管理'] = 2;
        break;
      default:
        updates['执行力'] = 2;
    }
    
    // 根据任务难度加成
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5,
    };
    const multiplier = difficultyMultiplier[task.difficulty];
    
    Object.keys(updates).forEach(key => {
      updates[key] = Math.round(updates[key] * multiplier);
    });
    
    // 如果任务效率高，额外加成
    if (taskData?.completionEfficiency && taskData.completionEfficiency >= 80) {
      updates['专注力'] = (updates['专注力'] || 0) + 2;
      updates['执行力'] = (updates['执行力'] || 0) + 1;
    }
    
    // 改进任务额外加成
    if (task.isImprovement) {
      updates['执行力'] = (updates['执行力'] || 0) + 3;
      updates['情绪管理'] = (updates['情绪管理'] || 0) + 2;
    }
    
    return updates;
  }
  
  /**
   * 计算负向行为更新值（改进任务完成时降低）
   */
  private static calculateNegativeUpdates(task: DailyTask, taskData?: any): Record<string, number> {
    const updates: Record<string, number> = {};
    
    // 根据任务标题判断改进的是哪个行为
    const title = task.title.toLowerCase();
    
    if (title.includes('拖延') || title.includes('立即开始')) {
      updates['拖延'] = -10;
      updates['逃避'] = -5;
    }
    
    if (title.includes('效率') || title.includes('专注')) {
      updates['分心'] = -10;
      updates['拖延'] = -3;
    }
    
    if (title.includes('一致') || title.includes('连续')) {
      updates['拖延'] = -8;
      updates['自我怀疑'] = -5;
    }
    
    if (title.includes('焦虑') || title.includes('放松')) {
      updates['焦虑'] = -10;
      updates['消极'] = -5;
    }
    
    if (title.includes('完美主义')) {
      updates['完美主义'] = -10;
      updates['焦虑'] = -3;
    }
    
    // 如果没有匹配到具体行为，默认降低拖延
    if (Object.keys(updates).length === 0) {
      updates['拖延'] = -8;
    }
    
    return updates;
  }
  
  /**
   * 批量更新雷达图（基于历史数据重新计算）
   */
  static async recalculateRadarFromHistory(): Promise<void> {
    console.log('🔄 开始重新计算雷达图...');
    
    const { useTaskStore } = await import('@/stores/taskStore');
    const taskStore = useTaskStore.getState();
    
    // 获取最近30天的已完成任务
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const recentCompletedTasks = taskStore.tasks.filter(task => {
      if (task.status !== 'completed') return false;
      const taskDate = task.actualEnd ? new Date(task.actualEnd) : new Date(task.createdAt);
      return taskDate >= cutoffDate;
    });
    
    console.log('📊 找到', recentCompletedTasks.length, '个已完成任务');
    
    // 初始化能力值
    const positiveStats: Record<string, number> = {
      '健康': 50,
      '学习力': 50,
      '赚钱能力': 50,
      '执行力': 50,
      '专注力': 50,
      '创造力': 50,
      '社交力': 50,
      '情绪管理': 50,
    };
    
    const negativeStats: Record<string, number> = {
      '拖延': 50,
      '焦虑': 50,
      '分心': 50,
      '完美主义': 50,
      '自我怀疑': 50,
      '逃避': 50,
      '冲动': 50,
      '消极': 50,
    };
    
    // 根据任务类型统计
    const typeCount: Record<string, number> = {};
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    let delayCount = 0;
    
    recentCompletedTasks.forEach(task => {
      const type = task.taskType || 'work';
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // 统计效率
      if (task.completionEfficiency !== undefined) {
        totalEfficiency += task.completionEfficiency;
        efficiencyCount++;
      }
      
      // 统计拖延
      if (task.scheduledStart && task.actualStart) {
        const scheduled = new Date(task.scheduledStart);
        const actual = new Date(task.actualStart);
        const delayMinutes = (actual.getTime() - scheduled.getTime()) / (1000 * 60);
        if (delayMinutes > 15) {
          delayCount++;
        }
      }
    });
    
    // 根据任务类型分布更新能力值
    const totalTasks = recentCompletedTasks.length;
    
    if (totalTasks > 0) {
      // 工作任务多 → 赚钱能力、专注力高
      if (typeCount['work']) {
        const ratio = typeCount['work'] / totalTasks;
        positiveStats['赚钱能力'] += Math.round(ratio * 30);
        positiveStats['专注力'] += Math.round(ratio * 20);
      }
      
      // 学习任务多 → 学习力高
      if (typeCount['study']) {
        const ratio = typeCount['study'] / totalTasks;
        positiveStats['学习力'] += Math.round(ratio * 30);
        positiveStats['专注力'] += Math.round(ratio * 15);
      }
      
      // 运动任务多 → 健康高
      if (typeCount['exercise']) {
        const ratio = typeCount['exercise'] / totalTasks;
        positiveStats['健康'] += Math.round(ratio * 40);
      }
      
      // 社交任务多 → 社交力高
      if (typeCount['social']) {
        const ratio = typeCount['social'] / totalTasks;
        positiveStats['社交力'] += Math.round(ratio * 30);
      }
      
      // 创意任务多 → 创造力高
      if (typeCount['creative']) {
        const ratio = typeCount['creative'] / totalTasks;
        positiveStats['创造力'] += Math.round(ratio * 30);
      }
      
      // 执行力基于完成任务数
      positiveStats['执行力'] += Math.min(30, Math.round(totalTasks / 2));
      
      // 情绪管理基于任务多样性
      const diversity = Object.keys(typeCount).length;
      positiveStats['情绪管理'] += Math.round(diversity * 5);
    }
    
    // 根据效率更新能力值
    if (efficiencyCount > 0) {
      const avgEfficiency = totalEfficiency / efficiencyCount;
      if (avgEfficiency >= 80) {
        positiveStats['专注力'] += 15;
        positiveStats['执行力'] += 10;
        negativeStats['分心'] -= 15;
      } else if (avgEfficiency < 50) {
        negativeStats['分心'] += 15;
        negativeStats['焦虑'] += 10;
      }
    }
    
    // 根据拖延情况更新
    if (totalTasks > 0) {
      const delayRatio = delayCount / totalTasks;
      if (delayRatio > 0.3) {
        negativeStats['拖延'] += Math.round(delayRatio * 30);
        negativeStats['逃避'] += Math.round(delayRatio * 20);
      } else if (delayRatio < 0.1) {
        negativeStats['拖延'] -= 20;
        positiveStats['执行力'] += 10;
      }
    }
    
    // 限制范围 0-100
    Object.keys(positiveStats).forEach(key => {
      positiveStats[key] = Math.min(100, Math.max(0, positiveStats[key]));
    });
    
    Object.keys(negativeStats).forEach(key => {
      negativeStats[key] = Math.min(100, Math.max(0, negativeStats[key]));
    });
    
    // 更新store
    const rpgStore = useRPGStore.getState();
    rpgStore.updateCharacter({
      positiveStats: Object.entries(positiveStats).map(([label, value]) => ({ label, value })),
      negativeStats: Object.entries(negativeStats).map(([label, value]) => ({ label, value })),
    });
    
    console.log('✅ 雷达图重新计算完成');
    console.log('正向能力:', positiveStats);
    console.log('负向行为:', negativeStats);
  }
}

