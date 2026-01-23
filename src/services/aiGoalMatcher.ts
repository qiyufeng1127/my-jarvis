import type { LongTermGoal, Task } from '@/types';

/**
 * AI智能目标匹配服务
 * 分析任务内容，自动关联到相关的长期目标
 */

export interface GoalMatchResult {
  goalId: string;
  goalName: string;
  confidence: number; // 0-1，匹配置信度
  contributionPercentage: number; // 该任务对目标的贡献百分比
  reason: string; // 匹配原因
}

/**
 * 从任务描述中提取关键词
 */
export function extractKeywords(text: string): string[] {
  // 移除标点符号和特殊字符
  const cleanText = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ');
  
  // 分词（简单的空格分割，实际可以使用更复杂的中文分词）
  const words = cleanText.split(/\s+/).filter(w => w.length > 1);
  
  // 移除常见停用词
  const stopWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没', '看', '好', '自己', '这', '那', '里', '就是', '可以', '这个', '那个'];
  
  return words.filter(w => !stopWords.includes(w));
}

/**
 * 分析任务类型和领域
 */
export function analyzeTaskDomain(taskTitle: string, taskDescription?: string): string[] {
  const text = `${taskTitle} ${taskDescription || ''}`.toLowerCase();
  const domains: string[] = [];
  
  // 学习相关
  if (/学习|课程|教程|阅读|书籍|知识|技能|培训|考试|复习/.test(text)) {
    domains.push('学习');
  }
  
  // 工作相关
  if (/工作|项目|会议|报告|文档|开发|编程|代码|设计|任务/.test(text)) {
    domains.push('工作');
  }
  
  // 健康相关
  if (/健康|运动|锻炼|跑步|健身|瑜伽|游泳|饮食|睡眠|体重|减肥/.test(text)) {
    domains.push('健康');
  }
  
  // 财务相关
  if (/赚钱|收入|投资|理财|存款|预算|开支|副业|创业/.test(text)) {
    domains.push('财务');
  }
  
  // 个人成长
  if (/成长|提升|改善|习惯|目标|计划|自律|效率|时间管理/.test(text)) {
    domains.push('个人成长');
  }
  
  // 社交相关
  if (/社交|朋友|聚会|活动|人际|关系|沟通|交流/.test(text)) {
    domains.push('社交');
  }
  
  // 创意相关
  if (/创作|写作|绘画|音乐|设计|艺术|创意|作品/.test(text)) {
    domains.push('创意');
  }
  
  return domains;
}

/**
 * 计算任务与目标的匹配度
 */
export function calculateGoalMatch(
  task: { title: string; description?: string },
  goal: LongTermGoal
): GoalMatchResult | null {
  const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
  const goalText = `${goal.name} ${goal.description}`.toLowerCase();
  
  let confidence = 0;
  let reason = '';
  
  // 1. 提取关键词
  const taskKeywords = extractKeywords(taskText);
  const goalKeywords = extractKeywords(goalText);
  
  // 2. 关键词匹配
  const matchingKeywords = taskKeywords.filter(tk =>
    goalKeywords.some(gk => 
      tk === gk || 
      tk.includes(gk) || 
      gk.includes(tk) ||
      (tk.length > 2 && gk.length > 2 && (tk.substring(0, 2) === gk.substring(0, 2)))
    )
  );
  
  if (matchingKeywords.length > 0) {
    confidence += Math.min(matchingKeywords.length * 0.15, 0.5);
    reason += `关键词匹配: ${matchingKeywords.slice(0, 3).join('、')}; `;
  }
  
  // 3. 直接名称匹配
  if (taskText.includes(goal.name.toLowerCase())) {
    confidence += 0.4;
    reason += `任务直接提到目标"${goal.name}"; `;
  }
  
  // 4. 领域匹配
  const taskDomains = analyzeTaskDomain(task.title, task.description);
  const goalDomains = analyzeTaskDomain(goal.name, goal.description);
  
  const matchingDomains = taskDomains.filter(td => goalDomains.includes(td));
  if (matchingDomains.length > 0) {
    confidence += matchingDomains.length * 0.1;
    reason += `领域匹配: ${matchingDomains.join('、')}; `;
  }
  
  // 5. 语义相似度（简单版本）
  const semanticScore = calculateSemanticSimilarity(taskKeywords, goalKeywords);
  confidence += semanticScore * 0.2;
  
  // 6. 目标类型特殊处理
  if (goal.goalType === 'habit') {
    // 习惯型目标更容易匹配日常任务
    if (taskText.includes('每天') || taskText.includes('坚持') || taskText.includes('养成')) {
      confidence += 0.15;
      reason += '习惯养成类任务; ';
    }
  }
  
  // 归一化置信度
  confidence = Math.min(confidence, 1);
  
  // 只返回置信度大于阈值的匹配
  if (confidence < 0.2) {
    return null;
  }
  
  // 计算贡献百分比（基于置信度和任务复杂度）
  const contributionPercentage = Math.round(confidence * 100);
  
  return {
    goalId: goal.id,
    goalName: goal.name,
    confidence,
    contributionPercentage: Math.min(contributionPercentage, 100),
    reason: reason.trim(),
  };
}

/**
 * 计算语义相似度（简化版）
 */
function calculateSemanticSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  let matchCount = 0;
  const totalWords = Math.max(keywords1.length, keywords2.length);
  
  keywords1.forEach(k1 => {
    keywords2.forEach(k2 => {
      // 完全匹配
      if (k1 === k2) {
        matchCount += 1;
      }
      // 部分匹配
      else if (k1.length > 2 && k2.length > 2) {
        if (k1.includes(k2) || k2.includes(k1)) {
          matchCount += 0.5;
        }
      }
    });
  });
  
  return matchCount / totalWords;
}

/**
 * 为任务匹配所有相关目标
 */
export function matchTaskToGoals(
  task: { title: string; description?: string },
  goals: LongTermGoal[]
): GoalMatchResult[] {
  const matches: GoalMatchResult[] = [];
  
  // 只匹配活跃且未完成的目标
  const activeGoals = goals.filter(g => g.isActive && !g.isCompleted);
  
  for (const goal of activeGoals) {
    const match = calculateGoalMatch(task, goal);
    if (match) {
      matches.push(match);
    }
  }
  
  // 按置信度排序
  matches.sort((a, b) => b.confidence - a.confidence);
  
  // 只返回前5个最相关的目标
  return matches.slice(0, 5);
}

/**
 * 生成目标关联建议的友好提示
 */
export function generateGoalSuggestionMessage(matches: GoalMatchResult[]): string {
  if (matches.length === 0) {
    return '未找到相关的长期目标。你可以先创建一些长期目标，让任务更有方向感！';
  }
  
  if (matches.length === 1) {
    const match = matches[0];
    return `🎯 这个任务可以关联到目标"${match.goalName}"（匹配度 ${Math.round(match.confidence * 100)}%）\n原因：${match.reason}`;
  }
  
  let message = `🎯 找到 ${matches.length} 个相关目标：\n\n`;
  matches.forEach((match, index) => {
    message += `${index + 1}. ${match.goalName} (${Math.round(match.confidence * 100)}%)\n`;
  });
  
  return message;
}

/**
 * 将匹配结果转换为任务的longTermGoals字段格式
 */
export function convertMatchesToTaskGoals(matches: GoalMatchResult[]): Record<string, number> {
  const result: Record<string, number> = {};
  
  // 归一化贡献百分比，确保总和不超过100%
  const totalContribution = matches.reduce((sum, m) => sum + m.contributionPercentage, 0);
  
  if (totalContribution > 100) {
    // 按比例缩放
    matches.forEach(match => {
      result[match.goalId] = Math.round((match.contributionPercentage / totalContribution) * 100);
    });
  } else {
    matches.forEach(match => {
      result[match.goalId] = match.contributionPercentage;
    });
  }
  
  return result;
}

