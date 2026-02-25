// ============================================
// 标签学习服务 - AI学习用户的标签习惯
// ============================================

interface TagLearningRecord {
  taskKeywords: string[]; // 任务关键词
  userTags: string[]; // 用户修改后的标签
  timestamp: Date;
  frequency: number; // 使用频率
}

interface TagSuggestion {
  tag: string;
  confidence: number; // 置信度 0-1
  reason: string; // 推荐理由
}

const STORAGE_KEY = 'tag_learning_records';
const MAX_RECORDS = 1000; // 最多保存1000条学习记录

export class TagLearningService {
  // 获取所有学习记录
  static getLearningRecords(): TagLearningRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const records = JSON.parse(data);
      return records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));
    } catch (error) {
      console.error('读取标签学习记录失败:', error);
      return [];
    }
  }

  // 保存学习记录
  static saveLearningRecords(records: TagLearningRecord[]): void {
    try {
      // 限制记录数量
      const limitedRecords = records.slice(-MAX_RECORDS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedRecords));
    } catch (error) {
      console.error('保存标签学习记录失败:', error);
    }
  }

  // 提取任务关键词
  static extractKeywords(taskTitle: string): string[] {
    // 移除标点符号和停用词
    const stopWords = ['的', '了', '和', '与', '或', '及', '等', '个', '要', '去', '做'];
    
    // 分词（简单版：按空格和常见分隔符）
    const words = taskTitle
      .toLowerCase()
      .replace(/[，。！？、；：""''（）【】《》]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));
    
    return [...new Set(words)]; // 去重
  }

  // 记录用户的标签选择（学习）
  static learnFromUserChoice(taskTitle: string, userTags: string[]): void {
    const keywords = this.extractKeywords(taskTitle);
    if (keywords.length === 0 || userTags.length === 0) return;

    const records = this.getLearningRecords();
    
    // 查找是否已有相似记录
    const existingIndex = records.findIndex(record => {
      // 如果关键词有50%以上重合，认为是相似任务
      const commonKeywords = keywords.filter(k => record.taskKeywords.includes(k));
      return commonKeywords.length >= Math.min(keywords.length, record.taskKeywords.length) * 0.5;
    });

    if (existingIndex >= 0) {
      // 更新现有记录
      records[existingIndex].userTags = userTags;
      records[existingIndex].timestamp = new Date();
      records[existingIndex].frequency += 1;
    } else {
      // 添加新记录
      records.push({
        taskKeywords: keywords,
        userTags: userTags,
        timestamp: new Date(),
        frequency: 1,
      });
    }

    this.saveLearningRecords(records);
    console.log('✅ 标签学习记录已保存:', { taskTitle, keywords, userTags });
  }

  // 根据任务内容推荐标签（基于学习记录）
  static suggestTags(taskTitle: string): TagSuggestion[] {
    const keywords = this.extractKeywords(taskTitle);
    if (keywords.length === 0) return [];

    const records = this.getLearningRecords();
    const suggestions: Map<string, { confidence: number; frequency: number; reasons: string[] }> = new Map();

    // 遍历所有学习记录，找到相似任务
    records.forEach(record => {
      // 计算关键词匹配度
      const commonKeywords = keywords.filter(k => record.taskKeywords.includes(k));
      const matchRate = commonKeywords.length / Math.max(keywords.length, record.taskKeywords.length);

      if (matchRate > 0.3) { // 至少30%匹配度
        // 推荐该记录中的标签
        record.userTags.forEach(tag => {
          const existing = suggestions.get(tag);
          const confidence = matchRate * (1 + Math.log10(record.frequency)); // 频率越高，置信度越高
          
          if (existing) {
            existing.confidence = Math.max(existing.confidence, confidence);
            existing.frequency += record.frequency;
            existing.reasons.push(`与"${record.taskKeywords.join(' ')}"相似 (${Math.round(matchRate * 100)}%)`);
          } else {
            suggestions.set(tag, {
              confidence,
              frequency: record.frequency,
              reasons: [`与"${record.taskKeywords.join(' ')}"相似 (${Math.round(matchRate * 100)}%)`],
            });
          }
        });
      }
    });

    // 转换为数组并排序（按置信度和频率）
    const result: TagSuggestion[] = Array.from(suggestions.entries())
      .map(([tag, data]) => ({
        tag,
        confidence: Math.min(data.confidence, 1), // 限制在0-1之间
        reason: data.reasons[0], // 取第一个理由
      }))
      .sort((a, b) => b.confidence - a.confidence);

    console.log('💡 标签推荐结果:', { taskTitle, keywords, suggestions: result });
    return result;
  }

  // 获取用户最常用的标签（用于标签管理器）
  static getMostUsedTags(limit: number = 20): Array<{ tag: string; count: number }> {
    const records = this.getLearningRecords();
    const tagCounts: Map<string, number> = new Map();

    records.forEach(record => {
      record.userTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + record.frequency);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // 清空学习记录（重置）
  static clearLearningRecords(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ 标签学习记录已清空');
  }

  // 导出学习记录（用于备份）
  static exportLearningRecords(): string {
    const records = this.getLearningRecords();
    return JSON.stringify(records, null, 2);
  }

  // 导入学习记录（用于恢复）
  static importLearningRecords(jsonData: string): boolean {
    try {
      const records = JSON.parse(jsonData);
      this.saveLearningRecords(records);
      console.log('✅ 标签学习记录已导入');
      return true;
    } catch (error) {
      console.error('❌ 导入失败:', error);
      return false;
    }
  }

  // 获取标签统计信息
  static getTagStatistics(): {
    totalRecords: number;
    totalTags: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
    recentTags: string[];
  } {
    const records = this.getLearningRecords();
    const allTags = new Set<string>();
    const tagCounts: Map<string, number> = new Map();

    records.forEach(record => {
      record.userTags.forEach(tag => {
        allTags.add(tag);
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + record.frequency);
      });
    });

    // 最近使用的标签（最近10条记录）
    const recentRecords = records.slice(-10).reverse();
    const recentTags = [...new Set(recentRecords.flatMap(r => r.userTags))];

    return {
      totalRecords: records.length,
      totalTags: allTags.size,
      mostUsedTags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentTags: recentTags.slice(0, 10),
    };
  }
}









