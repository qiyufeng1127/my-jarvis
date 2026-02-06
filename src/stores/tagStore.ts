import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 标签类型
export type TagType = 'business' | 'life_essential'; // 业务类 | 生活必需类

// 标签数据结构
export interface TagData {
  name: string;
  emoji: string;
  color: string;
  usageCount: number;
  totalDuration: number; // 总时长（分钟）
  lastUsedAt: Date;
  createdAt: Date;
  isDisabled?: boolean; // 是否禁用
  tagType?: TagType; // 标签类型
  
  // 财务数据
  totalIncome: number; // 总收入
  totalExpense: number; // 总支出
  netIncome: number; // 净收支
  
  // 效率数据
  hourlyRate: number; // 单位时间收益（元/小时）
  invalidDuration: number; // 无效时长（分钟）
}

// 标签时长记录
export interface TagDurationRecord {
  tagName: string;
  taskId: string;
  taskTitle: string;
  duration: number; // 分钟
  date: Date;
  isInvalid?: boolean; // 是否无效时长
}

// 标签收支记录
export interface TagFinanceRecord {
  id: string;
  tagName: string;
  amount: number; // 金额（正数=收入，负数=支出）
  type: 'income' | 'expense'; // 收支类型
  description: string; // 事由
  date: Date;
  relatedTaskId?: string; // 关联任务ID
}

// 标签效率等级
export type TagEfficiencyLevel = 
  | 'high'           // 高效标签 ≥100元/h
  | 'medium'         // 中效标签 20-100元/h
  | 'low'            // 低效可优化 0-20元/h
  | 'negative'       // 负效警示 <0元/h
  | 'life_essential' // 生活必需
  | 'passive';       // 被动收入（无时长有收入）

// 标签分组
export interface TagGroup {
  id: string;
  name: string;
  tagNames: string[];
  order: number;
}

interface TagState {
  tags: Record<string, TagData>; // key: 标签名称
  durationRecords: TagDurationRecord[];
  financeRecords: TagFinanceRecord[];
  groups: TagGroup[];
  
  // 标签操作
  addTag: (name: string, emoji?: string, color?: string, tagType?: TagType) => void;
  updateTag: (oldName: string, newName: string, emoji?: string, color?: string) => void;
  deleteTag: (name: string) => void;
  disableTag: (name: string) => void;
  enableTag: (name: string) => void;
  mergeTags: (tagNames: string[], newName: string) => void;
  setTagType: (tagName: string, tagType: TagType) => void;
  batchSetTagType: (tagNames: string[], tagType: TagType) => void;
  
  // 标签使用记录
  recordTagUsage: (tagName: string, taskId: string, taskTitle: string, duration: number, isInvalid?: boolean) => void;
  markDurationInvalid: (recordId: string) => void;
  
  // 财务记录
  addFinanceRecord: (tagName: string, amount: number, type: 'income' | 'expense', description: string, relatedTaskId?: string) => void;
  deleteFinanceRecord: (recordId: string) => void;
  getFinanceRecords: (tagName: string, startDate?: Date, endDate?: Date) => TagFinanceRecord[];
  
  // 标签查询
  getTagByName: (name: string) => TagData | undefined;
  getAllTags: () => TagData[];
  getActiveTagsSortedByUsage: () => TagData[];
  getHighFrequencyTags: (limit?: number) => TagData[];
  
  // 标签时长分析
  getTagDuration: (tagName: string, startDate?: Date, endDate?: Date) => number;
  getTagDurationByDate: (tagName: string, date: Date) => number;
  getTagDurationRecords: (tagName: string, startDate?: Date, endDate?: Date) => TagDurationRecord[];
  getValidDuration: (tagName: string, startDate?: Date, endDate?: Date) => number;
  
  // 财务分析
  getTagIncome: (tagName: string, startDate?: Date, endDate?: Date) => number;
  getTagExpense: (tagName: string, startDate?: Date, endDate?: Date) => number;
  getTagNetIncome: (tagName: string, startDate?: Date, endDate?: Date) => number;
  
  // 效率分析
  getTagHourlyRate: (tagName: string, startDate?: Date, endDate?: Date) => number;
  getTagEfficiencyLevel: (tagName: string) => TagEfficiencyLevel;
  getTagEfficiencyEmoji: (level: TagEfficiencyLevel) => string;
  
  // 标签分组
  createGroup: (name: string, tagNames: string[]) => void;
  updateGroup: (groupId: string, updates: Partial<TagGroup>) => void;
  deleteGroup: (groupId: string) => void;
  
  // 智能推荐
  getRecommendedTags: (taskTitle: string, limit?: number) => string[];
  
  // 批量操作
  batchUpdateTags: (operations: Array<{ type: 'rename' | 'delete' | 'merge'; data: any }>) => void;
  
  // 排序
  sortTagsByIncome: (desc?: boolean) => TagData[];
  sortTagsByExpense: (desc?: boolean) => TagData[];
  sortTagsByNetIncome: (desc?: boolean) => TagData[];
  sortTagsByHourlyRate: (desc?: boolean) => TagData[];
  sortTagsByNegativeTime: (desc?: boolean) => TagData[];
}

// 根据标签名称生成 Emoji
const generateEmojiForTag = (tagName: string): string => {
  const emojiMap: Record<string, string> = {
    // 工作类
    '工作': '💼',
    '会议': '📊',
    '编程': '💻',
    '设计': '🎨',
    '文档': '📄',
    '开发': '⚙️',
    
    // 学习类
    '学习': '📚',
    '阅读': '📖',
    '课程': '🎓',
    '成长': '🌱',
    
    // 生活类
    '家务': '🧹',
    '清洁': '✨',
    '购物': '🛒',
    '做饭': '🍳',
    '日常': '📝',
    
    // 健康类
    '运动': '🏃',
    '健身': '💪',
    '瑜伽': '🧘',
    '跑步': '👟',
    
    // 社交类
    '社交': '👥',
    '朋友': '🤝',
    '聚会': '🎉',
    
    // 娱乐类
    '娱乐': '🎮',
    '游戏': '🎯',
    '电影': '🎬',
    '音乐': '🎵',
    
    // 创作类
    '创作': '✍️',
    '写作': '📝',
    '拍摄': '📷',
    '视频': '🎥',
    
    // 其他
    '重要': '⭐',
    '紧急': '🔥',
    '休息': '😴',
  };
  
  // 模糊匹配
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (tagName.includes(key)) {
      return emoji;
    }
  }
  
  return '🏷️'; // 默认标签图标
};

// 根据标签名称生成颜色
const generateColorForTag = (tagName: string): string => {
  const colorMap: Record<string, string> = {
    // 工作类 - 蓝色系
    '工作': '#A0BBEB',
    '会议': '#A0BBEB',
    '编程': '#A0BBEB',
    '开发': '#A0BBEB',
    
    // 学习类 - 紫色系
    '学习': '#AA9FBE',
    '阅读': '#AA9FBE',
    '成长': '#AA9FBE',
    
    // 家务类 - 绿色系
    '家务': '#6A7334',
    '清洁': '#6A7334',
    '日常': '#6A7334',
    
    // 运动类 - 黄绿色
    '运动': '#A6B13C',
    '健身': '#A6B13C',
    
    // 社交类 - 玫瑰色
    '社交': '#B34568',
    '朋友': '#B34568',
    
    // 娱乐类 - 粉色
    '娱乐': '#FB9FC9',
    '休闲': '#FB9FC9',
    
    // 饮食类 - 黄色
    '做饭': '#FFE288',
    '饮食': '#FFE288',
  };
  
  // 模糊匹配
  for (const [key, color] of Object.entries(colorMap)) {
    if (tagName.includes(key)) {
      return color;
    }
  }
  
  return '#6A7334'; // 默认颜色
};

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: {},
      durationRecords: [],
      financeRecords: [],
      groups: [],
      
      addTag: (name, emoji, color, tagType) => {
        const tags = get().tags;
        if (tags[name]) {
          // 标签已存在，增加使用次数
          set({
            tags: {
              ...tags,
              [name]: {
                ...tags[name],
                usageCount: tags[name].usageCount + 1,
                lastUsedAt: new Date(),
              },
            },
          });
        } else {
          // 新标签
          set({
            tags: {
              ...tags,
              [name]: {
                name,
                emoji: emoji || generateEmojiForTag(name),
                color: color || generateColorForTag(name),
                usageCount: 1,
                totalDuration: 0,
                lastUsedAt: new Date(),
                createdAt: new Date(),
                isDisabled: false,
                tagType: tagType || 'business',
                totalIncome: 0,
                totalExpense: 0,
                netIncome: 0,
                hourlyRate: 0,
                invalidDuration: 0,
              },
            },
          });
        }
      },
      
      updateTag: (oldName, newName, emoji, color) => {
        const tags = get().tags;
        const oldTag = tags[oldName];
        
        if (!oldTag) return;
        
        // 删除旧标签
        const { [oldName]: removed, ...restTags } = tags;
        
        // 添加新标签（保留统计数据）
        set({
          tags: {
            ...restTags,
            [newName]: {
              ...oldTag,
              name: newName,
              emoji: emoji || oldTag.emoji,
              color: color || oldTag.color,
            },
          },
        });
        
        // 更新时长记录中的标签名称
        set({
          durationRecords: get().durationRecords.map(record =>
            record.tagName === oldName
              ? { ...record, tagName: newName }
              : record
          ),
        });
      },
      
      deleteTag: (name) => {
        const tags = get().tags;
        const { [name]: removed, ...restTags } = tags;
        
        set({
          tags: restTags,
          // 删除相关的时长记录
          durationRecords: get().durationRecords.filter(r => r.tagName !== name),
        });
      },
      
      disableTag: (name) => {
        const tags = get().tags;
        if (tags[name]) {
          set({
            tags: {
              ...tags,
              [name]: {
                ...tags[name],
                isDisabled: true,
              },
            },
          });
        }
      },
      
      enableTag: (name) => {
        const tags = get().tags;
        if (tags[name]) {
          set({
            tags: {
              ...tags,
              [name]: {
                ...tags[name],
                isDisabled: false,
              },
            },
          });
        }
      },
      
      mergeTags: (tagNames, newName) => {
        const tags = get().tags;
        
        // 计算合并后的统计数据
        let totalUsageCount = 0;
        let totalDuration = 0;
        let earliestCreatedAt = new Date();
        let latestUsedAt = new Date(0);
        
        tagNames.forEach(name => {
          const tag = tags[name];
          if (tag) {
            totalUsageCount += tag.usageCount;
            totalDuration += tag.totalDuration;
            if (tag.createdAt < earliestCreatedAt) {
              earliestCreatedAt = tag.createdAt;
            }
            if (tag.lastUsedAt > latestUsedAt) {
              latestUsedAt = tag.lastUsedAt;
            }
          }
        });
        
        // 删除旧标签
        const newTags = { ...tags };
        tagNames.forEach(name => {
          delete newTags[name];
        });
        
        // 添加新标签
        newTags[newName] = {
          name: newName,
          emoji: generateEmojiForTag(newName),
          color: generateColorForTag(newName),
          usageCount: totalUsageCount,
          totalDuration: totalDuration,
          lastUsedAt: latestUsedAt,
          createdAt: earliestCreatedAt,
          isDisabled: false,
        };
        
        set({ tags: newTags });
        
        // 更新时长记录
        set({
          durationRecords: get().durationRecords.map(record =>
            tagNames.includes(record.tagName)
              ? { ...record, tagName: newName }
              : record
          ),
        });
      },
      
      setTagType: (tagName, tagType) => {
        const tags = get().tags;
        if (tags[tagName]) {
          set({
            tags: {
              ...tags,
              [tagName]: {
                ...tags[tagName],
                tagType,
              },
            },
          });
        }
      },
      
      batchSetTagType: (tagNames, tagType) => {
        const tags = get().tags;
        const newTags = { ...tags };
        
        tagNames.forEach(name => {
          if (newTags[name]) {
            newTags[name] = {
              ...newTags[name],
              tagType,
            };
          }
        });
        
        set({ tags: newTags });
      },
      
      recordTagUsage: (tagName, taskId, taskTitle, duration, isInvalid = false) => {
        const tags = get().tags;
        
        // 更新标签统计
        if (tags[tagName]) {
          const tag = tags[tagName];
          const validDuration = isInvalid ? 0 : duration;
          const invalidDuration = isInvalid ? duration : 0;
          
          // 重新计算时薪
          const newTotalDuration = tag.totalDuration + validDuration;
          const newInvalidDuration = tag.invalidDuration + invalidDuration;
          const effectiveDuration = newTotalDuration - newInvalidDuration;
          const hourlyRate = effectiveDuration > 0 ? (tag.netIncome / (effectiveDuration / 60)) : 0;
          
          set({
            tags: {
              ...tags,
              [tagName]: {
                ...tag,
                totalDuration: tag.totalDuration + duration,
                invalidDuration: newInvalidDuration,
                hourlyRate,
                lastUsedAt: new Date(),
              },
            },
          });
        }
        
        // 添加时长记录
        set({
          durationRecords: [
            ...get().durationRecords,
            {
              tagName,
              taskId,
              taskTitle,
              duration,
              date: new Date(),
              isInvalid,
            },
          ],
        });
      },
      
      markDurationInvalid: (recordId) => {
        const records = get().durationRecords;
        const recordIndex = records.findIndex((r, i) => i.toString() === recordId);
        
        if (recordIndex >= 0) {
          const record = records[recordIndex];
          const newRecords = [...records];
          newRecords[recordIndex] = { ...record, isInvalid: true };
          
          set({ durationRecords: newRecords });
          
          // 更新标签统计
          const tags = get().tags;
          const tag = tags[record.tagName];
          if (tag) {
            const newInvalidDuration = tag.invalidDuration + record.duration;
            const effectiveDuration = tag.totalDuration - newInvalidDuration;
            const hourlyRate = effectiveDuration > 0 ? (tag.netIncome / (effectiveDuration / 60)) : 0;
            
            set({
              tags: {
                ...tags,
                [record.tagName]: {
                  ...tag,
                  invalidDuration: newInvalidDuration,
                  hourlyRate,
                },
              },
            });
          }
        }
      },
      
      // 财务记录
      addFinanceRecord: (tagName, amount, type, description, relatedTaskId) => {
        const record: TagFinanceRecord = {
          id: crypto.randomUUID(),
          tagName,
          amount,
          type,
          description,
          date: new Date(),
          relatedTaskId,
        };
        
        set({
          financeRecords: [...get().financeRecords, record],
        });
        
        // 更新标签财务统计
        const tags = get().tags;
        const tag = tags[tagName];
        if (tag) {
          const newIncome = type === 'income' ? tag.totalIncome + amount : tag.totalIncome;
          const newExpense = type === 'expense' ? tag.totalExpense + amount : tag.totalExpense;
          const newNetIncome = newIncome - newExpense;
          const effectiveDuration = tag.totalDuration - tag.invalidDuration;
          const hourlyRate = effectiveDuration > 0 ? (newNetIncome / (effectiveDuration / 60)) : 0;
          
          set({
            tags: {
              ...tags,
              [tagName]: {
                ...tag,
                totalIncome: newIncome,
                totalExpense: newExpense,
                netIncome: newNetIncome,
                hourlyRate,
              },
            },
          });
        }
      },
      
      deleteFinanceRecord: (recordId) => {
        const records = get().financeRecords;
        const record = records.find(r => r.id === recordId);
        
        if (record) {
          set({
            financeRecords: records.filter(r => r.id !== recordId),
          });
          
          // 更新标签财务统计
          const tags = get().tags;
          const tag = tags[record.tagName];
          if (tag) {
            const newIncome = record.type === 'income' ? tag.totalIncome - record.amount : tag.totalIncome;
            const newExpense = record.type === 'expense' ? tag.totalExpense - record.amount : tag.totalExpense;
            const newNetIncome = newIncome - newExpense;
            const effectiveDuration = tag.totalDuration - tag.invalidDuration;
            const hourlyRate = effectiveDuration > 0 ? (newNetIncome / (effectiveDuration / 60)) : 0;
            
            set({
              tags: {
                ...tags,
                [record.tagName]: {
                  ...tag,
                  totalIncome: newIncome,
                  totalExpense: newExpense,
                  netIncome: newNetIncome,
                  hourlyRate,
                },
              },
            });
          }
        }
      },
      
      getFinanceRecords: (tagName, startDate, endDate) => {
        let records = get().financeRecords.filter(r => r.tagName === tagName);
        
        if (startDate) {
          records = records.filter(r => r.date >= startDate);
        }
        
        if (endDate) {
          records = records.filter(r => r.date <= endDate);
        }
        
        return records;
      },
      
      getTagByName: (name) => {
        return get().tags[name];
      },
      
      getAllTags: () => {
        return Object.values(get().tags);
      },
      
      getActiveTagsSortedByUsage: () => {
        return Object.values(get().tags)
          .filter(tag => !tag.isDisabled)
          .sort((a, b) => b.usageCount - a.usageCount);
      },
      
      getHighFrequencyTags: (limit = 5) => {
        return get().getActiveTagsSortedByUsage().slice(0, limit);
      },
      
      getTagDuration: (tagName, startDate, endDate) => {
        const records = get().getTagDurationRecords(tagName, startDate, endDate);
        return records.reduce((sum, record) => sum + record.duration, 0);
      },
      
      getTagDurationByDate: (tagName, date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return get().getTagDuration(tagName, startOfDay, endOfDay);
      },
      
      getTagDurationRecords: (tagName, startDate, endDate) => {
        let records = get().durationRecords.filter(r => r.tagName === tagName);
        
        if (startDate) {
          records = records.filter(r => r.date >= startDate);
        }
        
        if (endDate) {
          records = records.filter(r => r.date <= endDate);
        }
        
        return records;
      },
      
      getValidDuration: (tagName, startDate, endDate) => {
        const records = get().getTagDurationRecords(tagName, startDate, endDate);
        return records
          .filter(r => !r.isInvalid)
          .reduce((sum, record) => sum + record.duration, 0);
      },
      
      // 财务分析
      getTagIncome: (tagName, startDate, endDate) => {
        const records = get().getFinanceRecords(tagName, startDate, endDate);
        return records
          .filter(r => r.type === 'income')
          .reduce((sum, r) => sum + r.amount, 0);
      },
      
      getTagExpense: (tagName, startDate, endDate) => {
        const records = get().getFinanceRecords(tagName, startDate, endDate);
        return records
          .filter(r => r.type === 'expense')
          .reduce((sum, r) => sum + r.amount, 0);
      },
      
      getTagNetIncome: (tagName, startDate, endDate) => {
        const income = get().getTagIncome(tagName, startDate, endDate);
        const expense = get().getTagExpense(tagName, startDate, endDate);
        return income - expense;
      },
      
      // 效率分析
      getTagHourlyRate: (tagName, startDate, endDate) => {
        const tag = get().tags[tagName];
        if (!tag) return 0;
        
        const netIncome = get().getTagNetIncome(tagName, startDate, endDate);
        const validDuration = get().getValidDuration(tagName, startDate, endDate);
        
        if (validDuration === 0) {
          // 被动收入
          return netIncome > 0 ? Infinity : 0;
        }
        
        return netIncome / (validDuration / 60); // 元/小时
      },
      
      getTagEfficiencyLevel: (tagName): TagEfficiencyLevel => {
        const tag = get().tags[tagName];
        if (!tag) return 'low';
        
        // 生活必需类
        if (tag.tagType === 'life_essential') {
          return 'life_essential';
        }
        
        const hourlyRate = tag.hourlyRate;
        const validDuration = tag.totalDuration - tag.invalidDuration;
        
        // 被动收入（无时长有收入）
        if (validDuration === 0 && tag.totalIncome > 0) {
          return 'passive';
        }
        
        // 负效警示
        if (hourlyRate < 0) {
          return 'negative';
        }
        
        // 无效行为（无收支但累计时长>2小时/天）
        const avgDailyDuration = validDuration / 7; // 假设按周计算
        if (tag.netIncome === 0 && avgDailyDuration > 120) {
          return 'negative';
        }
        
        // 高效标签
        if (hourlyRate >= 100) {
          return 'high';
        }
        
        // 中效标签
        if (hourlyRate >= 20) {
          return 'medium';
        }
        
        // 低效可优化
        return 'low';
      },
      
      getTagEfficiencyEmoji: (level: TagEfficiencyLevel): string => {
        const emojiMap: Record<TagEfficiencyLevel, string> = {
          high: '💰',
          medium: '📈',
          low: '⚠️',
          negative: '❌',
          life_essential: '🏠',
          passive: '🪙',
        };
        return emojiMap[level];
      },
      
      // 排序
      sortTagsByIncome: (desc = true) => {
        const tags = get().getAllTags();
        return tags.sort((a, b) => 
          desc ? b.totalIncome - a.totalIncome : a.totalIncome - b.totalIncome
        );
      },
      
      sortTagsByExpense: (desc = true) => {
        const tags = get().getAllTags();
        return tags.sort((a, b) => 
          desc ? b.totalExpense - a.totalExpense : a.totalExpense - b.totalExpense
        );
      },
      
      sortTagsByNetIncome: (desc = true) => {
        const tags = get().getAllTags();
        return tags.sort((a, b) => 
          desc ? b.netIncome - a.netIncome : a.netIncome - b.netIncome
        );
      },
      
      sortTagsByHourlyRate: (desc = true) => {
        const tags = get().getAllTags();
        return tags.sort((a, b) => {
          const rateA = a.hourlyRate === Infinity ? 999999 : a.hourlyRate;
          const rateB = b.hourlyRate === Infinity ? 999999 : b.hourlyRate;
          return desc ? rateB - rateA : rateA - rateB;
        });
      },
      
      sortTagsByNegativeTime: (desc = true) => {
        const tags = get().getAllTags();
        return tags.sort((a, b) => {
          const negativeA = a.hourlyRate < 0 ? a.totalDuration - a.invalidDuration : 0;
          const negativeB = b.hourlyRate < 0 ? b.totalDuration - b.invalidDuration : 0;
          return desc ? negativeB - negativeA : negativeA - negativeB;
        });
      },
      
      createGroup: (name, tagNames) => {
        const groups = get().groups;
        const newGroup: TagGroup = {
          id: crypto.randomUUID(),
          name,
          tagNames,
          order: groups.length,
        };
        
        set({
          groups: [...groups, newGroup],
        });
      },
      
      updateGroup: (groupId, updates) => {
        set({
          groups: get().groups.map(g =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        });
      },
      
      deleteGroup: (groupId) => {
        set({
          groups: get().groups.filter(g => g.id !== groupId),
        });
      },
      
      getRecommendedTags: (taskTitle, limit = 3) => {
        const allTags = get().getActiveTagsSortedByUsage();
        const recommended: string[] = [];
        
        // 基于关键词匹配推荐
        for (const tag of allTags) {
          if (recommended.length >= limit) break;
          
          // 简单的关键词匹配
          if (taskTitle.toLowerCase().includes(tag.name.toLowerCase())) {
            recommended.push(tag.name);
          }
        }
        
        // 如果推荐不足，补充高频标签
        if (recommended.length < limit) {
          const highFreqTags = get().getHighFrequencyTags(limit * 2);
          for (const tag of highFreqTags) {
            if (recommended.length >= limit) break;
            if (!recommended.includes(tag.name)) {
              recommended.push(tag.name);
            }
          }
        }
        
        return recommended;
      },
      
      batchUpdateTags: (operations) => {
        operations.forEach(op => {
          switch (op.type) {
            case 'rename':
              get().updateTag(op.data.oldName, op.data.newName);
              break;
            case 'delete':
              get().deleteTag(op.data.name);
              break;
            case 'merge':
              get().mergeTags(op.data.tagNames, op.data.newName);
              break;
          }
        });
      },
    }),
    {
      name: 'manifestos-tags-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            
            // 恢复日期对象
            if (parsed?.state?.tags) {
              Object.keys(parsed.state.tags).forEach(key => {
                const tag = parsed.state.tags[key];
                tag.createdAt = new Date(tag.createdAt);
                tag.lastUsedAt = new Date(tag.lastUsedAt);
              });
            }
            
            if (parsed?.state?.durationRecords) {
              parsed.state.durationRecords = parsed.state.durationRecords.map((record: any) => ({
                ...record,
                date: new Date(record.date),
              }));
            }
            
            if (parsed?.state?.financeRecords) {
              parsed.state.financeRecords = parsed.state.financeRecords.map((record: any) => ({
                ...record,
                date: new Date(record.date),
              }));
            }
            
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取标签存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ 保存标签存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除标签存储失败:', error);
          }
        },
      },
    }
  )
);

