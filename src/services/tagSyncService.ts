/**
 * 标签同步服务
 * 负责将任务数据同步到标签统计
 */

import { useTaskStore } from '@/stores/taskStore';
import { useTagStore } from '@/stores/tagStore';
import type { Task } from '@/types';

class TagSyncService {
  private unsubscribe: (() => void) | null = null;

  /**
   * 当任务完成时，同步数据到标签
   */
  syncTaskToTags(task: Task) {
    if (!task.tags || task.tags.length === 0) {
      return;
    }

    const tagStore = useTagStore.getState();
    const { recordTagUsage, addFinanceRecord, addTag, getTagByName } = tagStore;

    // 计算任务实际时长
    const duration = this.calculateTaskDuration(task);
    
    // 判断是否为无效时长
    const isInvalid = this.isInvalidDuration(task);

    // 为每个标签记录使用情况
    task.tags.forEach(tagName => {
      // 确保标签存在，如果不存在则创建
      const existingTag = getTagByName(tagName);
      if (!existingTag) {
        console.log(`📝 创建新标签: ${tagName}`);
        addTag(tagName);
      } else {
        // 标签已存在，手动增加使用次数
        const tags = useTagStore.getState().tags;
        useTagStore.setState({
          tags: {
            ...tags,
            [tagName]: {
              ...tags[tagName],
              usageCount: tags[tagName].usageCount + 1,
              lastUsedAt: new Date(),
            },
          },
        });
      }

      // 记录时长
      if (duration > 0) {
        recordTagUsage(
          tagName,
          task.id,
          task.title,
          duration,
          isInvalid
        );
      }

      // 记录收入（如果有金币奖励）
      if (task.goldEarned > 0) {
        addFinanceRecord(
          tagName,
          task.goldEarned,
          'income',
          `完成任务：${task.title}`,
          task.id
        );
      }

      // 记录支出（如果有惩罚）
      if (task.penaltyGold > 0) {
        addFinanceRecord(
          tagName,
          task.penaltyGold,
          'expense',
          `任务惩罚：${task.title}`,
          task.id
        );
      }
    });

    console.log(`✅ 已同步任务 "${task.title}" 到 ${task.tags.length} 个标签`);
  }

  /**
   * 计算任务实际时长（分钟）
   */
  private calculateTaskDuration(task: Task): number {
    if (task.actualStart && task.actualEnd) {
      const duration = Math.round(
        (task.actualEnd.getTime() - task.actualStart.getTime()) / 1000 / 60
      );
      return Math.max(0, duration);
    }

    // 如果没有实际时间，使用计划时长
    return task.durationMinutes || 0;
  }

  /**
   * 判断是否为无效时长
   * 无效时长的判断标准：
   * 1. 任务失败或取消
   * 2. 任务超时
   * 3. 任务质量评分过低（<3）
   */
  private isInvalidDuration(task: Task): boolean {
    // 任务失败或取消
    if (task.status === 'failed' || task.status === 'cancelled') {
      return true;
    }

    // 任务超时
    if (task.startVerificationTimeout || task.completionDeadline) {
      const now = new Date();
      if (task.completionDeadline && now > task.completionDeadline) {
        return true;
      }
    }

    // 任务质量评分过低
    if (task.completionQuality && task.completionQuality < 3) {
      return true;
    }

    return false;
  }

  /**
   * 批量同步所有已完成的任务到标签
   * 用于初始化或修复数据
   */
  syncAllCompletedTasks() {
    const { tasks } = useTaskStore.getState();
    const completedTasks = tasks.filter(
      task => task.status === 'completed' && task.tags && task.tags.length > 0
    );

    console.log(`🔄 开始批量同步 ${completedTasks.length} 个已完成任务...`);

    completedTasks.forEach(task => {
      this.syncTaskToTags(task);
    });

    console.log(`✅ 批量同步完成！`);
  }

  /**
   * 重新计算所有标签的统计数据
   * 清空现有数据，从任务重新计算
   */
  recalculateAllTagStats() {
    const { tasks } = useTaskStore.getState();
    const tagStore = useTagStore.getState();
    const allTags = tagStore.getAllTags();

    console.log(`🔄 开始重新计算所有标签统计数据...`);

    // 重置所有标签的统计数据
    const resetTags: Record<string, any> = {};
    allTags.forEach(tag => {
      resetTags[tag.name] = {
        ...tag,
        usageCount: 0,
        totalDuration: 0,
        totalIncome: 0,
        totalExpense: 0,
        netIncome: 0,
        hourlyRate: 0,
        invalidDuration: 0,
      };
    });

    // 更新标签store
    useTagStore.setState({
      tags: resetTags,
      durationRecords: [],
      financeRecords: [],
    });

    // 重新同步所有已完成的任务
    this.syncAllCompletedTasks();

    console.log(`✅ 重新计算完成！`);
  }

  /**
   * 监听任务状态变化，自动同步到标签
   */
  startAutoSync() {
    // 订阅任务store的变化
    useTaskStore.subscribe((state, prevState) => {
      // 检查是否有任务状态变为completed
      state.tasks.forEach(task => {
        const prevTask = prevState.tasks.find(t => t.id === task.id);
        
        // 如果任务刚刚完成，同步到标签
        if (
          task.status === 'completed' &&
          prevTask &&
          prevTask.status !== 'completed'
        ) {
          this.syncTaskToTags(task);
        }
      });
    });

    console.log('🎯 标签自动同步已启动');
  }
}

export const tagSyncService = new TagSyncService();

