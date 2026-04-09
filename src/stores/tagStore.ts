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
  folderId?: string; // 所属文件夹ID
  
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
  completionNotes?: string; // 🔧 新增：完成备注
  completionEfficiency?: number; // 🔧 新增：完成效率 (0-100)
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

// 标签文件夹（分类）
export interface TagFolder {
  id: string;
  name: string;
  emoji: string;
  color: string; // 文件夹颜色，会应用到所有子标签的任务卡片背景色
  tagNames: string[]; // 该文件夹下的标签
  order: number;
  createdAt: Date;
}

export interface TagLearningProfile {
  keywordScores: Record<string, number>;
  relatedTagScores: Record<string, number>;
  confirmedCount: number;
  correctedAwayCount: number;
  lastLearnedAt?: Date;
}

const normalizeLearningTokens = (text: string): string[] => {
  return Array.from(new Set(
    text
      .toLowerCase()
      .split(/[\s\-_/，。！？、：:；;（）()【】\[\]、,.]+/)
      .map(token => token.trim())
      .filter(token => token.length >= 2)
  ));
};

const createEmptyTagLearningProfile = (): TagLearningProfile => ({
  keywordScores: {},
  relatedTagScores: {},
  confirmedCount: 0,
  correctedAwayCount: 0,
});

interface TagState {
  tags: Record<string, TagData>; // key: 标签名称
  durationRecords: TagDurationRecord[];
  financeRecords: TagFinanceRecord[];
  groups: TagGroup[];
  folders: TagFolder[]; // 标签文件夹
  tagLearningProfiles: Record<string, TagLearningProfile>;
  
  // 标签操作
  addTag: (name: string, emoji?: string, color?: string, tagType?: TagType, folderId?: string) => void;
  updateTag: (oldName: string, newName: string, emoji?: string, color?: string) => void;
  deleteTag: (name: string) => void;
  disableTag: (name: string) => void;
  enableTag: (name: string) => void;
  mergeTags: (tagNames: string[], newName: string) => void;
  setTagType: (tagName: string, tagType: TagType) => void;
  batchSetTagType: (tagNames: string[], tagType: TagType) => void;
  matchExistingTagNames: (candidateTags: string[]) => string[];
  resolveAutoTags: (taskTitle: string, candidateTags?: string[], limit?: number) => string[];
  
  // 文件夹操作
  createFolder: (name: string, emoji: string, color: string, tagNames?: string[]) => string;
  updateFolder: (folderId: string, updates: Partial<TagFolder>) => void;
  deleteFolder: (folderId: string) => void;
  addTagToFolder: (tagName: string, folderId: string) => void;
  removeTagFromFolder: (tagName: string, folderId: string) => void;
  getFolderById: (folderId: string) => TagFolder | undefined;
  getAllFolders: () => TagFolder[];
  getTagsByFolder: (folderId: string) => TagData[];
  getTagColor: (tagName: string) => string; // 获取标签的颜色（优先使用文件夹颜色）
  initializeDefaultFolders: () => void;
  
  // 标签使用记录
  recordTagUsage: (tagName: string, taskId: string, taskTitle: string, duration: number, isInvalid?: boolean, completionNotes?: string, completionEfficiency?: number) => void;
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
  getTagAverageEfficiency: (tagName: string, startDate?: Date, endDate?: Date) => number; // 🔧 新增：获取平均效率
  
  // 标签分组
  createGroup: (name: string, tagNames: string[]) => void;
  updateGroup: (groupId: string, updates: Partial<TagGroup>) => void;
  deleteGroup: (groupId: string) => void;
  
  // 智能推荐
  getRecommendedTags: (taskTitle: string, limit?: number) => string[];
  learnTagSelection: (taskTitle: string, selectedTags: string[], previousSuggestedTags?: string[]) => void;
  getLearnedTagScores: (taskTitle: string) => Array<{ tagName: string; score: number }>;
  
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
      folders: [],
      tagLearningProfiles: {},
      
      addTag: (name, emoji, color, tagType, folderId) => {
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
          const newTag: TagData = {
            name,
            emoji: emoji || generateEmojiForTag(name),
            color: color || generateColorForTag(name),
            usageCount: 1,
            totalDuration: 0,
            lastUsedAt: new Date(),
            createdAt: new Date(),
            isDisabled: false,
            tagType: tagType || 'business',
            folderId: folderId,
            totalIncome: 0,
            totalExpense: 0,
            netIncome: 0,
            hourlyRate: 0,
            invalidDuration: 0,
          };
          
          set({
            tags: {
              ...tags,
              [name]: newTag,
            },
          });
          
          // 如果指定了文件夹，将标签添加到文件夹
          if (folderId) {
            const folder = get().folders.find(f => f.id === folderId);
            if (folder && !folder.tagNames.includes(name)) {
              get().updateFolder(folderId, {
                tagNames: [...folder.tagNames, name],
              });
            }
          }
        }
      },
      
      updateTag: (oldName, newName, emoji, color) => {
        const tags = get().tags;
        const oldTag = tags[oldName];
        
        if (!oldTag) return;
        
        // 如果只是更新emoji或color，不需要删除重建
        if (oldName === newName) {
          set({
            tags: {
              ...tags,
              [oldName]: {
                ...oldTag,
                emoji: (emoji !== undefined && emoji !== null && emoji !== '') ? emoji : oldTag.emoji,
                color: (color !== undefined && color !== null && color !== '') ? color : oldTag.color,
              },
            },
          });
          return;
        }
        
        // 删除旧标签
        const { [oldName]: removed, ...restTags } = tags;
        
        // 添加新标签（保留统计数据）
        set({
          tags: {
            ...restTags,
            [newName]: {
              ...oldTag,
              name: newName,
              emoji: (emoji !== undefined && emoji !== null && emoji !== '') ? emoji : oldTag.emoji,
              color: (color !== undefined && color !== null && color !== '') ? color : oldTag.color,
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
        let totalIncome = 0;
        let totalExpense = 0;
        let invalidDuration = 0;
        let earliestCreatedAt = new Date();
        let latestUsedAt = new Date(0);
        let tagType: TagType = 'business';
        
        tagNames.forEach(name => {
          const tag = tags[name];
          if (tag) {
            totalUsageCount += tag.usageCount;
            totalDuration += tag.totalDuration;
            totalIncome += tag.totalIncome;
            totalExpense += tag.totalExpense;
            invalidDuration += tag.invalidDuration;
            
            if (tag.createdAt < earliestCreatedAt) {
              earliestCreatedAt = tag.createdAt;
            }
            if (tag.lastUsedAt > latestUsedAt) {
              latestUsedAt = tag.lastUsedAt;
            }
            
            // 如果有任何一个是生活必需，则合并后也是生活必需
            if (tag.tagType === 'life_essential') {
              tagType = 'life_essential';
            }
          }
        });
        
        // 计算合并后的财务数据
        const netIncome = totalIncome - totalExpense;
        const effectiveDuration = totalDuration - invalidDuration;
        const hourlyRate = effectiveDuration > 0 ? (netIncome / (effectiveDuration / 60)) : 0;
        
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
          totalIncome: totalIncome,
          totalExpense: totalExpense,
          netIncome: netIncome,
          hourlyRate: hourlyRate,
          invalidDuration: invalidDuration,
          lastUsedAt: latestUsedAt,
          createdAt: earliestCreatedAt,
          isDisabled: false,
          tagType: tagType,
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
        
        // 更新财务记录
        set({
          financeRecords: get().financeRecords.map(record =>
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

      matchExistingTagNames: (candidateTags) => {
        const normalizedCandidates = Array.from(new Set(
          candidateTags
            .map(tag => tag.trim())
            .filter(Boolean)
        ));
        if (normalizedCandidates.length === 0) return [];

        const activeTags = get().getActiveTagsSortedByUsage();
        const candidateMap = new Map(activeTags.map(tag => [tag.name.toLowerCase(), tag.name]));
        const resolved: string[] = [];

        normalizedCandidates.forEach((candidate) => {
          const normalizedCandidate = candidate.toLowerCase();
          const exactMatch = candidateMap.get(normalizedCandidate);
          if (exactMatch) {
            resolved.push(exactMatch);
            return;
          }

          const fuzzyMatch = activeTags.find((tag) => {
            const normalizedTag = tag.name.toLowerCase();
            return normalizedTag.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTag);
          });

          if (fuzzyMatch) {
            resolved.push(fuzzyMatch.name);
          }
        });

        return Array.from(new Set(resolved));
      },

      resolveAutoTags: (taskTitle, candidateTags = [], limit = 3) => {
        const matchedCandidateTags = get().matchExistingTagNames(candidateTags);
        const learnedTags = get().getRecommendedTags(taskTitle, limit + matchedCandidateTags.length);
        return Array.from(new Set([
          ...matchedCandidateTags,
          ...learnedTags,
        ])).slice(0, limit);
      },
      
      recordTagUsage: (tagName, taskId, taskTitle, duration, isInvalid = false, completionNotes, completionEfficiency) => {
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
              completionNotes, // 🔧 新增：完成备注
              completionEfficiency, // 🔧 新增：完成效率
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
      
      // 🔧 新增：获取标签的平均效率（基于任务完成效率，而非时薪）
      getTagAverageEfficiency: (tagName, startDate, endDate): number => {
        const records = get().getTagDurationRecords(tagName, startDate, endDate);
        
        // 过滤出有效率数据的记录
        const recordsWithEfficiency = records.filter(r => r.completionEfficiency !== undefined && r.completionEfficiency !== null);
        
        if (recordsWithEfficiency.length === 0) {
          return 0; // 没有效率数据，返回0
        }
        
        // 计算平均效率
        const totalEfficiency = recordsWithEfficiency.reduce((sum, r) => sum + (r.completionEfficiency || 0), 0);
        return Math.round(totalEfficiency / recordsWithEfficiency.length);
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
        const tokens = normalizeLearningTokens(taskTitle);
        const activeTags = get().getActiveTagsSortedByUsage();
        const profiles = get().tagLearningProfiles;
        const scored = activeTags.map((tag) => {
          const profile = profiles[tag.name];
          let score = 0;

          if (taskTitle.toLowerCase().includes(tag.name.toLowerCase())) {
            score += 18;
          }

          tokens.forEach((token) => {
            score += profile?.keywordScores?.[token] || 0;
            if (tag.name.toLowerCase().includes(token) || token.includes(tag.name.toLowerCase())) {
              score += token.length >= 3 ? 5 : 2;
            }
          });

          Object.values(profile?.relatedTagScores || {}).forEach((value) => {
            score += value * 0.12;
          });

          score += Math.min(tag.usageCount || 0, 10);
          score += Math.min(profile?.confirmedCount || 0, 12);
          score -= Math.min(profile?.correctedAwayCount || 0, 8);

          return {
            tagName: tag.name,
            score,
          };
        });

        return scored
          .filter((item) => item.score >= 12)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map((item) => item.tagName);
      },

      learnTagSelection: (taskTitle, selectedTags, previousSuggestedTags = []) => {
        const tags = get().tags;
        const tokens = normalizeLearningTokens(taskTitle);
        const profiles = { ...get().tagLearningProfiles };
        const selectedSet = new Set(selectedTags);
        const suggestedSet = new Set(previousSuggestedTags);

        selectedTags.forEach((tagName) => {
          if (!tags[tagName]) return;

          const currentProfile = profiles[tagName] || createEmptyTagLearningProfile();
          const nextKeywordScores = { ...currentProfile.keywordScores };
          const nextRelatedTagScores = { ...currentProfile.relatedTagScores };

          tokens.forEach((token) => {
            nextKeywordScores[token] = (nextKeywordScores[token] || 0) + 3;
          });

          selectedTags.forEach((relatedTagName) => {
            if (relatedTagName === tagName || !tags[relatedTagName]) return;
            nextRelatedTagScores[relatedTagName] = (nextRelatedTagScores[relatedTagName] || 0) + 2;
          });

          profiles[tagName] = {
            keywordScores: nextKeywordScores,
            relatedTagScores: nextRelatedTagScores,
            confirmedCount: currentProfile.confirmedCount + 1,
            correctedAwayCount: currentProfile.correctedAwayCount,
            lastLearnedAt: new Date(),
          };
        });

        previousSuggestedTags.forEach((tagName) => {
          if (!tags[tagName] || selectedSet.has(tagName)) return;

          const currentProfile = profiles[tagName] || createEmptyTagLearningProfile();
          const nextKeywordScores = { ...currentProfile.keywordScores };
          const nextRelatedTagScores = { ...currentProfile.relatedTagScores };

          tokens.forEach((token) => {
            nextKeywordScores[token] = Math.max(0, (nextKeywordScores[token] || 0) - 1);
          });

          selectedTags.forEach((relatedTagName) => {
            if (!nextRelatedTagScores[relatedTagName]) return;
            nextRelatedTagScores[relatedTagName] = Math.max(0, nextRelatedTagScores[relatedTagName] - 1);
          });

          profiles[tagName] = {
            keywordScores: nextKeywordScores,
            relatedTagScores: nextRelatedTagScores,
            confirmedCount: currentProfile.confirmedCount,
            correctedAwayCount: currentProfile.correctedAwayCount + 1,
            lastLearnedAt: new Date(),
          };
        });

        Object.keys(tags).forEach((tagName) => {
          if (!selectedSet.has(tagName) || suggestedSet.has(tagName)) return;

          const currentProfile = profiles[tagName] || createEmptyTagLearningProfile();
          const nextKeywordScores = { ...currentProfile.keywordScores };
          const nextRelatedTagScores = { ...currentProfile.relatedTagScores };

          tokens.forEach((token) => {
            nextKeywordScores[token] = (nextKeywordScores[token] || 0) + 5;
          });

          selectedTags.forEach((relatedTagName) => {
            if (relatedTagName === tagName || !tags[relatedTagName]) return;
            nextRelatedTagScores[relatedTagName] = (nextRelatedTagScores[relatedTagName] || 0) + 3;
          });

          profiles[tagName] = {
            keywordScores: nextKeywordScores,
            relatedTagScores: nextRelatedTagScores,
            confirmedCount: currentProfile.confirmedCount + 2,
            correctedAwayCount: Math.max(0, currentProfile.correctedAwayCount - 1),
            lastLearnedAt: new Date(),
          };
        });

        set({ tagLearningProfiles: profiles });
      },

      getLearnedTagScores: (taskTitle) => {
        const tokens = normalizeLearningTokens(taskTitle);
        const profiles = get().tagLearningProfiles;

        return get().getActiveTagsSortedByUsage()
          .map((tag) => {
            const profile = profiles[tag.name];
            const score = tokens.reduce((sum, token) => sum + (profile?.keywordScores?.[token] || 0), 0)
              + Object.values(profile?.relatedTagScores || {}).reduce((sum, value) => sum + value * 0.12, 0)
              + Math.min(profile?.confirmedCount || 0, 12)
              - Math.min(profile?.correctedAwayCount || 0, 8);

            return { tagName: tag.name, score };
          })
          .filter((item) => item.score >= 6)
          .sort((a, b) => b.score - a.score);
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
      
      // 文件夹操作
      createFolder: (name, emoji, color, tagNames = []) => {
        const folders = get().folders;
        const newFolder: TagFolder = {
          id: crypto.randomUUID(),
          name,
          emoji,
          color,
          tagNames,
          order: folders.length,
          createdAt: new Date(),
        };
        
        set({
          folders: [...folders, newFolder],
        });
        
        return newFolder.id;
      },
      
      updateFolder: (folderId, updates) => {
        set({
          folders: get().folders.map(f =>
            f.id === folderId ? { ...f, ...updates } : f
          ),
        });
      },
      
      deleteFolder: (folderId) => {
        // 删除文件夹时，将其中的标签的folderId设为undefined
        const folder = get().folders.find(f => f.id === folderId);
        if (folder) {
          const tags = get().tags;
          const updatedTags = { ...tags };
          folder.tagNames.forEach(tagName => {
            if (updatedTags[tagName]) {
              updatedTags[tagName] = {
                ...updatedTags[tagName],
                folderId: undefined,
              };
            }
          });
          set({ tags: updatedTags });
        }
        
        set({
          folders: get().folders.filter(f => f.id !== folderId),
        });
      },
      
      addTagToFolder: (tagName, folderId) => {
        const folder = get().folders.find(f => f.id === folderId);
        if (folder && !folder.tagNames.includes(tagName)) {
          get().updateFolder(folderId, {
            tagNames: [...folder.tagNames, tagName],
          });
          
          // 更新标签的folderId
          const tags = get().tags;
          if (tags[tagName]) {
            set({
              tags: {
                ...tags,
                [tagName]: {
                  ...tags[tagName],
                  folderId,
                },
              },
            });
          }
        }
      },
      
      removeTagFromFolder: (tagName, folderId) => {
        const folder = get().folders.find(f => f.id === folderId);
        if (folder) {
          get().updateFolder(folderId, {
            tagNames: folder.tagNames.filter(name => name !== tagName),
          });
          
          // 清除标签的folderId
          const tags = get().tags;
          if (tags[tagName]) {
            set({
              tags: {
                ...tags,
                [tagName]: {
                  ...tags[tagName],
                  folderId: undefined,
                },
              },
            });
          }
        }
      },
      
      getFolderById: (folderId) => {
        return get().folders.find(f => f.id === folderId);
      },
      
      getAllFolders: () => {
        return get().folders.sort((a, b) => a.order - b.order);
      },
      
      getTagsByFolder: (folderId) => {
        const folder = get().folders.find(f => f.id === folderId);
        if (!folder) return [];
        
        const tags = get().tags;
        return folder.tagNames
          .map(name => tags[name])
          .filter(tag => tag !== undefined);
      },
      
      getTagColor: (tagName) => {
        const tag = get().tags[tagName];
        if (!tag) return '#6A7334'; // 默认颜色
        
        // 如果标签属于某个文件夹，使用文件夹的颜色
        if (tag.folderId) {
          const folder = get().folders.find(f => f.id === tag.folderId);
          if (folder) {
            return folder.color;
          }
        }
        
        // 否则使用标签自己的颜色
        return tag.color;
      },
      
      initializeDefaultFolders: () => {
        const existingFolders = get().folders;
        if (existingFolders.length > 0) {
          console.log('✅ 默认文件夹已存在，跳过初始化');
          return;
        }
        
        console.log('🎨 初始化12个默认标签文件夹...');
        
        const defaultFolders = [
          {
            name: '享受生活',
            emoji: '🌸',
            color: '#FF7BAC', // BUBBLEGUM 粉色
            tags: ['旅行', '美食', '电影', '音乐', '阅读', '游戏'],
          },
          {
            name: '最美的自己',
            emoji: '💄',
            color: '#F4BEAE', // PEACH FROST 桃色
            tags: ['护肤', '化妆', '穿搭', '健身', '瑜伽', '美容'],
          },
          {
            name: '文创插画',
            emoji: '🎨',
            color: '#D3B6D3', // LILACS 淡紫色
            tags: ['绘画', '插画', '设计', '创作', '灵感', '作品'],
          },
          {
            name: '照相馆工作',
            emoji: '📷',
            color: '#52A5CE', // BLUEBERRY 蓝色
            tags: ['拍摄', '修图', '客户沟通', '预约管理', '设备维护', '照相馆工作'],
          },
          {
            name: '学习成长',
            emoji: '📚',
            color: '#6D1F42', // GRAPE JUICE 葡萄紫
            tags: ['学习', '阅读', '课程', '笔记', '思考', '成长'],
          },
          {
            name: '开发软件',
            emoji: '💻',
            color: '#B8CEE8', // ICED BLUE 冰蓝色
            tags: ['编程', '开发', '调试', '学习技术', '项目', '代码'],
          },
          {
            name: '家务',
            emoji: '🧹',
            color: '#AACC96', // TEA GREEN 茶绿色
            tags: ['打扫', '洗衣', '整理', '收纳', '清洁', '家务'],
          },
          {
            name: '日常生活',
            emoji: '📝',
            color: '#EFCE7B', // BUTTER YELLOW 黄油黄
            tags: ['购物', '做饭', '洗漱', '休息', '日常', '生活'],
          },
          {
            name: '副业思考准备',
            emoji: '💡',
            color: '#EF6F3C', // BLOOD ORANGE 血橙色
            tags: ['副业', '思考', '计划', '准备', '调研', '尝试'],
          },
          {
            name: '健康',
            emoji: '💪',
            color: '#25533F', // FOREST 森林绿
            tags: ['运动', '健身', '体检', '吃药', '健康', '锻炼'],
          },
          {
            name: '睡眠',
            emoji: '😴',
            color: '#876029', // DRY EARTH 干土色
            tags: ['睡觉', '午休', '休息', '睡眠', '放松'],
          },
          {
            name: 'AI相关',
            emoji: '🤖',
            color: '#AFAB23', // OLIVE GREEN 橄榄绿
            tags: ['AI学习', 'AI工具', 'ChatGPT', 'AI项目', 'AI研究', 'AI相关'],
          },
        ];
        
        const newFolders: TagFolder[] = [];
        const newTags: Record<string, TagData> = { ...get().tags };
        
        defaultFolders.forEach((folderData, index) => {
          const folderId = crypto.randomUUID();
          
          // 创建文件夹
          const folder: TagFolder = {
            id: folderId,
            name: folderData.name,
            emoji: folderData.emoji,
            color: folderData.color,
            tagNames: folderData.tags,
            order: index,
            createdAt: new Date(),
          };
          newFolders.push(folder);
          
          // 创建文件夹下的标签
          folderData.tags.forEach(tagName => {
            if (!newTags[tagName]) {
              newTags[tagName] = {
                name: tagName,
                emoji: generateEmojiForTag(tagName),
                color: folderData.color, // 使用文件夹颜色
                usageCount: 0,
                totalDuration: 0,
                lastUsedAt: new Date(),
                createdAt: new Date(),
                isDisabled: false,
                tagType: 'business',
                folderId: folderId,
                totalIncome: 0,
                totalExpense: 0,
                netIncome: 0,
                hourlyRate: 0,
                invalidDuration: 0,
              };
            }
          });
        });
        
        set({
          folders: newFolders,
          tags: newTags,
        });
        
        console.log('✅ 成功创建12个默认文件夹和', Object.keys(newTags).length, '个标签');
      },
    }),
    {
      name: 'manifestos-tags-storage',
      version: 2,
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
            
            if (parsed?.state?.tagLearningProfiles) {
              Object.keys(parsed.state.tagLearningProfiles).forEach(key => {
                const profile = parsed.state.tagLearningProfiles[key];
                if (profile?.lastLearnedAt) {
                  profile.lastLearnedAt = new Date(profile.lastLearnedAt);
                }
              });
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

