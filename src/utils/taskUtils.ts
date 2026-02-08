// ============================================
// 任务相关工具函数
// ============================================

// 家里格局配置（用于动线优化）
export const HOME_LAYOUT = {
  entrance: { left: 'bathroom', right: 'workspace' },
  forward: { left: 'kitchen', right: 'livingroom' },
  upstairs: { left: 'bedroom', right: 'studio' },
};

// 位置顺序（按照动线最优排序）
export const LOCATION_ORDER = [
  'bathroom',      // 厕所
  'workspace',     // 工作区
  'kitchen',       // 厨房
  'livingroom',    // 客厅
  'bedroom',       // 卧室
  'studio',        // 拍摄间
];

// 位置名称映射（支持中英文）
export const LOCATION_NAMES: Record<string, string> = {
  bathroom: '厕所',
  workspace: '工作区',
  kitchen: '厨房',
  livingroom: '客厅',
  bedroom: '卧室',
  studio: '拍摄间',
  // 中文映射
  '厕所': '厕所',
  '工作区': '工作区',
  '厨房': '厨房',
  '客厅': '客厅',
  '卧室': '卧室',
  '拍摄间': '拍摄间',
};

// 位置图标映射（支持中英文）
export const LOCATION_ICONS: Record<string, string> = {
  bathroom: '🚽',
  workspace: '💻',
  kitchen: '🍳',
  livingroom: '🛋️',
  bedroom: '🛏️',
  studio: '📸',
  // 中文映射
  '厕所': '🚽',
  '工作区': '💻',
  '厨房': '🍳',
  '客厅': '🛋️',
  '卧室': '🛏️',
  '拍摄间': '📸',
};

// 任务时长参考（分钟）
export const DURATION_REFERENCE: Record<string, number> = {
  work: 60,           // 工作：1小时起步
  cleaning: 10,       // 打扫：10分钟
  eating_home: 30,    // 在家吃饭：30分钟
  eating_out: 120,    // 外出吃饭：2小时
  drinking: 240,      // 外出喝酒：4小时
  sleep: 5,           // 上楼睡觉：5分钟
  medicine: 2,        // 吃药：2分钟
  washing: 5,         // 洗漱：5分钟
  tidying: 5,         // 简单收拾：5分钟
};

/**
 * 智能识别任务位置
 */
export function detectTaskLocation(title: string): string | undefined {
  const titleLower = title.toLowerCase();
  
  // 厕所相关
  if (/厕所|洗手间|卫生间|洗漱|洗衣|洗澡|刷牙|洗脸/.test(title)) return 'bathroom';
  
  // 工作区相关
  if (/工作|电脑|办公|写代码|编程|学习|写作|设计|吃药|艾司唑仑/.test(title)) return 'workspace';
  
  // 厨房相关
  if (/厨房|做饭|洗碗|猫粮|倒水|煮|炒|吃饭|用餐|喝水/.test(title)) return 'kitchen';
  
  // 客厅相关
  if (/客厅|看电视|沙发|垃圾|收拾客厅/.test(title)) return 'livingroom';
  
  // 卧室相关
  if (/卧室|睡觉|床|休息|收拾卧室/.test(title)) return 'bedroom';
  
  // 拍摄间相关
  if (/拍摄间|拍摄|录制|录像|收拾拍摄间/.test(title)) return 'studio';
  
  return undefined;
}

/**
 * 智能识别任务时长
 */
export function detectTaskDuration(title: string): number {
  // 首先检查是否明确指定了时长
  const durationMatch = title.match(/(\d+)(分钟|小时)/);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2];
    return unit === '小时' ? value * 60 : value;
  }

  // 根据任务类型推断
  if (/工作|编程|写代码|开发/.test(title)) return DURATION_REFERENCE.work;
  if (/打扫|收拾|整理/.test(title)) return DURATION_REFERENCE.cleaning;
  if (/吃饭/.test(title) && /外出|出去/.test(title)) return DURATION_REFERENCE.eating_out;
  if (/吃饭|用餐/.test(title)) return DURATION_REFERENCE.eating_home;
  if (/喝酒|聚会|应酬/.test(title)) return DURATION_REFERENCE.drinking;
  if (/睡觉|上楼|休息/.test(title)) return DURATION_REFERENCE.sleep;
  if (/吃药|服药/.test(title)) return DURATION_REFERENCE.medicine;
  if (/洗漱|刷牙|洗脸/.test(title)) return DURATION_REFERENCE.washing;
  if (/洗碗|倒猫粮|洗衣服/.test(title)) return DURATION_REFERENCE.tidying;
  
  // 默认根据任务类型推断
  if (/学习|阅读|看书/.test(title)) return 30;
  if (/运动|锻炼|健身/.test(title)) return 30;
  return 15; // 默认15分钟
}

/**
 * 按动线优化任务顺序
 */
export function optimizeTasksByLocation<T extends { location?: string }>(tasks: T[]): T[] {
  // 位置优先级映射（支持中英文）
  const locationPriorityMap: Record<string, number> = {
    'workspace': 1,
    '工作区': 1,
    'bathroom': 2,
    '厕所': 2,
    'kitchen': 3,
    '厨房': 3,
    'livingroom': 4,
    '客厅': 4,
    'bedroom': 5,
    '卧室': 5,
    'studio': 6,
    '拍摄间': 6,
  };
  
  return [...tasks].sort((a, b) => {
    const locA = a.location || 'unknown';
    const locB = b.location || 'unknown';
    
    const priorityA = locationPriorityMap[locA] || 999;
    const priorityB = locationPriorityMap[locB] || 999;
    
    return priorityA - priorityB;
  });
}

/**
 * 解析开始时间
 */
export function parseStartTime(message: string): Date {
  const startTime = new Date();
  
  console.log('🔍 [parseStartTime] 原始消息:', message);
  
  // 检查用户是否指定了开始时间（支持空格）
  const minuteMatch = message.match(/(\d+)\s*分钟\s*(之后|后)/);
  const hourMatch = message.match(/(\d+)\s*(个)?\s*小时\s*(之后|后)/);
  
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    console.log(`🔍 [parseStartTime] 匹配到小时: ${hours}小时后`);
    startTime.setHours(startTime.getHours() + hours);
  } else if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1]);
    console.log(`🔍 [parseStartTime] 匹配到分钟: ${minutes}分钟后`);
    startTime.setMinutes(startTime.getMinutes() + minutes);
  } else {
    console.log('🔍 [parseStartTime] 未匹配到延迟时间，使用当前时间');
  }
  
  console.log('🔍 [parseStartTime] 解析后的时间:', startTime.toLocaleTimeString('zh-CN'));
  
  return startTime;
}

/**
 * 获取优先级图标
 */
export function getPriorityEmoji(priority: 'high' | 'medium' | 'low'): string {
  return priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
}

