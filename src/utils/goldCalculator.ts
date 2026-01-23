import { GOLD_CONFIG, TASK_TYPE_CONFIG } from '@/constants';
import type { Task, TaskType } from '@/types';

/**
 * 计算任务应获得的金币
 */
export function calculateTaskGold(task: Task): number {
  // 1. 确定基础金币
  const difficulty = task.priority === 1 ? 'challenge' : task.priority === 2 ? 'difficult' : task.priority === 3 ? 'medium' : 'simple';
  const baseGold = GOLD_CONFIG.BASE_GOLD_PER_UNIT[difficulty];

  // 2. 计算时长系数
  const durationMultiplier = getDurationMultiplier(task.durationMinutes);

  // 3. 任务类型系数
  const typeMultiplier = TASK_TYPE_CONFIG[task.taskType]?.multiplier || 1.0;

  // 4. 时间段系数（假设高效时段为 9-12, 14-17）
  const timeMultiplier = getTimeMultiplier(task.scheduledStart);

  // 5. 成长关联系数
  const growthMultiplier = getGrowthMultiplier(task.growthDimensions);

  // 计算最终金币
  const finalGold = Math.round(
    baseGold * durationMultiplier * typeMultiplier * timeMultiplier * growthMultiplier
  );

  return finalGold;
}

/**
 * 获取时长系数
 */
function getDurationMultiplier(minutes: number): number {
  if (minutes <= 30) return 1.0;
  if (minutes <= 60) return 1.8;
  if (minutes <= 120) return 3.0;
  return 4.0 + ((minutes - 120) / 30) * 0.5;
}

/**
 * 获取时间段系数
 */
function getTimeMultiplier(scheduledStart?: Date): number {
  if (!scheduledStart) return 1.0;

  const hour = scheduledStart.getHours();
  
  // 高效时段：9-12, 14-17
  if ((hour >= 9 && hour < 12) || (hour >= 14 && hour < 17)) {
    return 1.3;
  }
  
  // 低效时段：0-6, 22-24
  if (hour < 6 || hour >= 22) {
    return 0.7;
  }
  
  return 1.0;
}

/**
 * 获取成长关联系数
 */
function getGrowthMultiplier(growthDimensions: Record<string, number>): number {
  const dimensionCount = Object.keys(growthDimensions).length;
  
  if (dimensionCount === 0) return 1.0;
  if (dimensionCount === 1) return 1.1;
  if (dimensionCount === 2) return 1.3;
  return 1.5; // 最多3个维度
}

/**
 * 计算连续完成奖励
 */
export function calculateStreakBonus(consecutiveDays: number): number {
  if (consecutiveDays >= 30) return GOLD_CONFIG.STREAK_BONUS[30];
  if (consecutiveDays >= 15) return GOLD_CONFIG.STREAK_BONUS[15];
  if (consecutiveDays >= 7) return GOLD_CONFIG.STREAK_BONUS[7];
  if (consecutiveDays >= 3) return GOLD_CONFIG.STREAK_BONUS[3];
  return 0;
}

/**
 * 计算拖延惩罚
 */
export function calculateDelayPenalty(delayMinutes: number): number {
  if (delayMinutes <= 5) return GOLD_CONFIG.DELAY_PENALTY['0-5'];
  if (delayMinutes <= 15) return GOLD_CONFIG.DELAY_PENALTY['6-15'];
  return GOLD_CONFIG.DELAY_PENALTY['15+'];
}

/**
 * 计算坏习惯惩罚
 */
export function calculateHabitPenalty(severity: number): number {
  if (severity <= 3) return GOLD_CONFIG.BAD_HABIT_PENALTY.minor;
  if (severity <= 7) return GOLD_CONFIG.BAD_HABIT_PENALTY.moderate;
  return GOLD_CONFIG.BAD_HABIT_PENALTY.severe;
}

/**
 * 计算任务完成质量加成
 */
export function calculateQualityBonus(quality: number, baseGold: number): number {
  if (quality === 5) return Math.round(baseGold * 0.5); // 完美完成 +50%
  if (quality === 4) return Math.round(baseGold * 0.2); // 优秀完成 +20%
  if (quality === 3) return 0; // 正常完成
  if (quality === 2) return Math.round(baseGold * -0.2); // 勉强完成 -20%
  return Math.round(baseGold * -0.5); // 低质量完成 -50%
}

