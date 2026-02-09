/**
 * 金币计算工具
 * 
 * 规则：
 * - 站立任务：15金币/分钟
 * - 坐着任务：10金币/分钟
 * - 金币会根据任务时长动态调整
 */

export type TaskPosture = 'standing' | 'sitting';

/**
 * 根据任务类型判断姿势
 * @param taskType 任务类型
 * @returns 'standing' | 'sitting'
 */
export function getTaskPosture(taskType: string): TaskPosture {
  // 需要站立的任务类型
  const standingTasks = [
    'health',      // 健康/运动
    'creative',    // 创作（如拍照、绘画）
    'social',      // 社交
    'life',        // 生活（如做饭、打扫）
  ];
  
  return standingTasks.includes(taskType) ? 'standing' : 'sitting';
}

/**
 * 根据任务标签判断姿势
 * @param tags 任务标签数组
 * @returns 'standing' | 'sitting'
 */
export function getTaskPostureByTags(tags: string[]): TaskPosture {
  if (!tags || tags.length === 0) return 'sitting';
  
  // 需要站立的标签关键词
  const standingKeywords = [
    '运动', '健身', '跑步', '瑜伽', '锻炼', '散步',
    '拍摄', '拍照', '摄影', '照相',
    '做饭', '烹饪', '煮饭',
    '打扫', '清洁', '家务', '整理',
    '绘画', '画画', '创作',
    '社交', '聚会', '见面',
    '购物', '逛街',
  ];
  
  // 检查标签中是否包含站立关键词
  const hasStandingKeyword = tags.some(tag => 
    standingKeywords.some(keyword => tag.includes(keyword))
  );
  
  return hasStandingKeyword ? 'standing' : 'sitting';
}

/**
 * 根据任务标题判断姿势
 * @param title 任务标题
 * @returns 'standing' | 'sitting'
 */
export function getTaskPostureByTitle(title: string): TaskPosture {
  if (!title) return 'sitting';
  
  // 需要站立的标题关键词
  const standingKeywords = [
    '运动', '健身', '跑步', '瑜伽', '锻炼', '散步',
    '拍摄', '拍照', '摄影', '照相', '拍',
    '做饭', '烹饪', '煮饭', '做菜',
    '打扫', '清洁', '家务', '整理', '收拾',
    '绘画', '画画', '创作', '画',
    '社交', '聚会', '见面',
    '购物', '逛街',
    '站', '走',
  ];
  
  // 检查标题中是否包含站立关键词
  const hasStandingKeyword = standingKeywords.some(keyword => 
    title.includes(keyword)
  );
  
  return hasStandingKeyword ? 'standing' : 'sitting';
}

/**
 * 智能判断任务姿势（综合考虑类型、标签、标题）
 * @param taskType 任务类型
 * @param tags 任务标签
 * @param title 任务标题
 * @returns 'standing' | 'sitting'
 */
export function smartDetectTaskPosture(
  taskType?: string,
  tags?: string[],
  title?: string
): TaskPosture {
  // 优先级：标题 > 标签 > 类型
  
  // 1. 检查标题
  if (title) {
    const postureByTitle = getTaskPostureByTitle(title);
    if (postureByTitle === 'standing') {
      return 'standing';
    }
  }
  
  // 2. 检查标签
  if (tags && tags.length > 0) {
    const postureByTags = getTaskPostureByTags(tags);
    if (postureByTags === 'standing') {
      return 'standing';
    }
  }
  
  // 3. 检查类型
  if (taskType) {
    return getTaskPosture(taskType);
  }
  
  // 默认坐着
  return 'sitting';
}

/**
 * 计算任务金币奖励（基于预计时长）
 * @param durationMinutes 任务时长（分钟）
 * @param posture 任务姿势 'standing' | 'sitting'
 * @returns 金币数量
 */
export function calculateGoldReward(
  durationMinutes: number,
  posture: TaskPosture
): number {
  const ratePerMinute = posture === 'standing' ? 15 : 10;
  return Math.round(durationMinutes * ratePerMinute);
}

/**
 * 计算任务实际完成金币（基于实际耗时）
 * 
 * 规则：
 * 1. 基础金币 = 实际完成时长（分钟） × 倍率
 *    - 普通任务：10金币/分钟
 *    - "站起来"专属任务：15金币/分钟
 * 2. 超时扣罚：若实际完成时长 > 预计完成时长，直接返回 0 金币
 * 3. 启动验证超时：扣除 30% 金币（最终金币 = 基础金币 × 0.7）
 * 
 * @param actualMinutes 实际耗时（分钟）
 * @param estimatedMinutes 预计时长（分钟）
 * @param posture 任务姿势 'standing' | 'sitting'
 * @param startVerificationTimeout 启动验证是否超时
 * @returns { finalGold, baseGold, penalty, reason }
 */
export function calculateActualGoldReward(
  actualMinutes: number,
  estimatedMinutes: number,
  posture: TaskPosture,
  startVerificationTimeout: boolean = false
): {
  finalGold: number;
  baseGold: number;
  penalty: number;
  reason: string;
} {
  // 参数校验
  if (typeof actualMinutes !== 'number' || actualMinutes < 0) {
    console.error('Invalid actualMinutes:', actualMinutes);
    actualMinutes = 0;
  }
  if (typeof estimatedMinutes !== 'number' || estimatedMinutes <= 0) {
    console.error('Invalid estimatedMinutes:', estimatedMinutes);
    estimatedMinutes = 30; // 默认30分钟
  }

  // 金币倍率：普通任务10，站立任务15
  const ratePerMinute = posture === 'standing' ? 15 : 10;
  
  // 基础金币：实际完成时长（分钟） × 倍率
  const baseGold = Math.round(actualMinutes * ratePerMinute);
  
  let finalGold = baseGold;
  let penalty = 0;
  let reason = '';
  
  // 判断是否超时完成（实际时长 > 预计时长）
  if (actualMinutes > estimatedMinutes) {
    // 超时完成：直接返回 0 金币（无奖励）
    finalGold = 0;
    penalty = baseGold;
    reason = `任务超时完成（实际${actualMinutes}分钟 > 预计${estimatedMinutes}分钟），无金币奖励`;
  } else if (startVerificationTimeout) {
    // 启动验证超时：扣除 30% 金币
    penalty = Math.round(baseGold * 0.3);
    finalGold = baseGold - penalty;
    reason = `启动验证超时，扣除30%金币（-${penalty}金币）`;
  } else {
    // 按时完成：获得全额金币
    reason = `按时完成（实际${actualMinutes}分钟），获得全额金币`;
  }
  
  return {
    finalGold: Math.max(0, finalGold), // 确保不为负数
    baseGold,
    penalty,
    reason,
  };
}

/**
 * 智能计算任务金币（综合判断姿势）
 * @param durationMinutes 任务时长（分钟）
 * @param taskType 任务类型
 * @param tags 任务标签
 * @param title 任务标题
 * @returns 金币数量
 */
export function smartCalculateGoldReward(
  durationMinutes: number,
  taskType?: string,
  tags?: string[],
  title?: string
): number {
  const posture = smartDetectTaskPosture(taskType, tags, title);
  return calculateGoldReward(durationMinutes, posture);
}

/**
 * 获取金币计算说明
 * @param posture 任务姿势
 * @returns 说明文本
 */
export function getGoldCalculationDescription(posture: TaskPosture): string {
  if (posture === 'standing') {
    return '站立任务：15金币/分钟 💪';
  } else {
    return '坐着任务：10金币/分钟 🪑';
  }
}

/**
 * 计算时长调整后的金币变化
 * @param oldDuration 原时长（分钟）
 * @param newDuration 新时长（分钟）
 * @param posture 任务姿势
 * @returns { oldGold, newGold, difference }
 */
export function calculateGoldAdjustment(
  oldDuration: number,
  newDuration: number,
  posture: TaskPosture
) {
  const oldGold = calculateGoldReward(oldDuration, posture);
  const newGold = calculateGoldReward(newDuration, posture);
  const difference = newGold - oldGold;
  
  return {
    oldGold,
    newGold,
    difference,
    description: difference > 0 
      ? `时长增加，金币 +${difference}` 
      : difference < 0 
      ? `时长减少，金币 ${difference}` 
      : '时长未变，金币不变'
  };
}

/**
 * 格式化金币显示
 * @param gold 金币数量
 * @returns 格式化的字符串
 */
export function formatGold(gold: number): string {
  return `${gold} 💰`;
}

/**
 * 示例用法和测试
 */
export const examples = {
  // 站立任务示例
  standing: {
    title: '拍摄10张照片',
    duration: 10,
    gold: calculateGoldReward(10, 'standing'), // 150金币
  },
  
  // 坐着任务示例
  sitting: {
    title: '编写代码',
    duration: 10,
    gold: calculateGoldReward(10, 'sitting'), // 100金币
  },
  
  // 时长调整示例
  adjustment: {
    from: { duration: 5, gold: calculateGoldReward(5, 'sitting') }, // 50金币
    to: { duration: 10, gold: calculateGoldReward(10, 'sitting') }, // 100金币
    difference: 50, // +50金币
  }
};

// 导出常量
export const GOLD_RATE = {
  STANDING: 15, // 站立任务：15金币/分钟
  SITTING: 10,  // 坐着任务：10金币/分钟
} as const;
