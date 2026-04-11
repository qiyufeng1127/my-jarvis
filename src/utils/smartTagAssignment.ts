import type { LongTermGoal, Task, TaskType } from '@/types';
import { smartCalculateGoldReward } from '@/utils/goldCalculator';

type TagDurationRecordGetter = (tagName: string) => Array<{ duration: number }>;
type LearnedTagScoreGetter = (taskTitle: string) => Array<{ tagName: string; score: number }>;
type RecommendedTagsGetter = (taskTitle: string, limit?: number) => string[];
type MatchingGoalsGetter = (taskTitle: string, keywords: string[]) => LongTermGoal[];

interface SmartTagAssignmentParams {
  title: string;
  description?: string;
  tasks: Task[];
  goals: LongTermGoal[];
  currentTaskId?: string;
  currentTaskType?: TaskType;
  currentTaskTags?: string[];
  currentDurationMinutes?: number;
  availableTags: Array<{ name: string; usageCount?: number; isDisabled?: boolean }>;
  getTagDurationRecords: TagDurationRecordGetter;
  getLearnedTagScores: LearnedTagScoreGetter;
  getRecommendedTags: RecommendedTagsGetter;
  findMatchingGoals: MatchingGoalsGetter;
}

export interface SmartTagAssignmentResult {
  suggestedDuration: number;
  suggestedGold: number;
  suggestedTags: string[];
  suggestedGoalId: string;
  matchedHistoryCount: number;
  categoryLabel: string;
  categoryHistoryCount: number;
}

const splitTokens = (text: string) => Array.from(new Set(
  text
    .trim()
    .split(/[\s\-_/，。！？、：:（）()【】\[\]]+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 2)
));

const inferTaskType = (text: string, fallbackType: TaskType = 'work'): TaskType => {
  if (/(运动|跑步|健身|瑜伽|散步)/.test(text)) return 'health';
  if (/(画画|绘画|创作|拍摄|摄影|写作|设计)/.test(text)) return 'creative';
  if (/(家务|打扫|整理|做饭|吃饭|厕所|洗澡|洗漱|购物)/.test(text)) return 'life';
  if (/(学习|阅读|课程|复习)/.test(text)) return 'study';
  if (/(休息|睡觉|午睡)/.test(text)) return 'rest';
  return fallbackType;
};

const taskCategoryRules: Array<{ key: string; keywords: string[]; tags: string[] }> = [
  { key: 'meal', keywords: ['吃饭', '吃早饭', '吃午饭', '吃晚饭', '早餐', '午餐', '晚餐', '用餐', '煮面', '做饭', '做菜'], tags: ['吃饭', '做饭', '日常', '生活'] },
  { key: 'toilet', keywords: ['上厕所', '厕所', '卫生间', '洗手间', '便意'], tags: ['日常', '生活', '清洁'] },
  { key: 'shower', keywords: ['洗澡', '冲澡', '沐浴'], tags: ['清洁', '日常', '生活'] },
  { key: 'wash', keywords: ['洗漱', '刷牙', '洗脸', '护肤'], tags: ['清洁', '日常', '生活'] },
  { key: 'housework', keywords: ['家务', '打扫', '收拾', '整理', '清洁', '洗衣', '拖地'], tags: ['家务', '清洁', '整理'] },
  { key: 'drawing', keywords: ['画画', '绘画', '插画', '临摹', '速写'], tags: ['创作', '绘画', '艺术'] },
  { key: 'writing', keywords: ['写作', '写文章', '写稿', '文案', '写东西'], tags: ['创作', '写作', '工作'] },
  { key: 'study', keywords: ['学习', '复习', '刷题', '阅读', '看书', '课程'], tags: ['学习', '阅读', '成长'] },
  { key: 'exercise', keywords: ['运动', '健身', '跑步', '散步', '瑜伽'], tags: ['运动', '健康', '健身'] },
  { key: 'meeting', keywords: ['会议', '开会', '沟通', '讨论'], tags: ['会议', '工作', '沟通'] },
  { key: 'shooting', keywords: ['拍摄', '摄影', '拍照', '录视频'], tags: ['拍摄', '创作', '艺术'] },
];

const detectTaskCategory = (taskTitle: string, taskDescription = '', taskTags: string[] = [], fallbackType: TaskType = 'work') => {
  const text = `${taskTitle} ${taskDescription} ${taskTags.join(' ')}`.toLowerCase();
  const matchedRule = taskCategoryRules.find((rule) =>
    rule.keywords.some((keyword) => text.includes(keyword.toLowerCase())) ||
    taskTags.some((tag) => rule.tags.includes(tag))
  );

  return matchedRule?.key || inferTaskType(text, fallbackType);
};

export const generateSmartTagAssignment = ({
  title,
  description = '',
  tasks,
  goals,
  currentTaskId,
  currentTaskType = 'work',
  currentTaskTags = [],
  currentDurationMinutes = 30,
  availableTags,
  getTagDurationRecords,
  getLearnedTagScores,
  getRecommendedTags,
  findMatchingGoals,
}: SmartTagAssignmentParams): SmartTagAssignmentResult => {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedDescription = description.trim().toLowerCase();
  const titleTokens = splitTokens(title);
  const activeTags = availableTags.filter((tag) => !tag.isDisabled);
  const availableTagNames = new Set(activeTags.map((tag) => tag.name));
  const otherTasks = tasks.filter((item) => item.id !== currentTaskId);
  const currentTaskCategory = detectTaskCategory(title, description, currentTaskTags, currentTaskType);
  const normalizedTaskText = `${normalizedTitle} ${normalizedDescription}`.trim();

  const getTextSimilarityScore = (baseText: string, candidateTask: Task) => {
    const candidateText = `${candidateTask.title || ''} ${candidateTask.description || ''}`.toLowerCase();
    if (!candidateText.trim()) return 0;

    let score = 0;
    if (baseText && candidateText.includes(baseText)) score += 8;
    if (candidateText && baseText.includes(candidateText)) score += 6;

    titleTokens.forEach((token) => {
      if (candidateText.includes(token)) {
        score += token.length >= 4 ? 4 : 2;
      }
    });

    if (candidateTask.tags?.some((tag) => normalizedTitle.includes(tag.toLowerCase()) || tag.toLowerCase().includes(normalizedTitle))) {
      score += 5;
    }

    if (detectTaskCategory(candidateTask.title || '', candidateTask.description || '', candidateTask.tags || [], candidateTask.taskType || 'work') === currentTaskCategory) {
      score += 10;
    }

    return score;
  };

  const matchedHistoryTasks = otherTasks
    .map((historyTask) => ({
      task: historyTask,
      score: getTextSimilarityScore(normalizedTitle, historyTask),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.task);

  const categoryMatchedTasks = otherTasks
    .filter((historyTask) => detectTaskCategory(historyTask.title || '', historyTask.description || '', historyTask.tags || [], historyTask.taskType || 'work') === currentTaskCategory)
    .slice(0, 24);

  const durationSamples = matchedHistoryTasks
    .map((item) => item.durationMinutes)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  const categoryDurationSamples = categoryMatchedTasks
    .map((item) => item.durationMinutes)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  const durationFromTags = activeTags
    .filter((tag) => normalizedTitle.includes(tag.name.toLowerCase()))
    .flatMap((tag) => getTagDurationRecords(tag.name).map((record) => record.duration))
    .filter((value) => value > 0);

  const allDurationSamples = [...durationSamples, ...categoryDurationSamples, ...durationFromTags].filter((value) => value > 0);
  const averageDuration = allDurationSamples.length > 0
    ? Math.round(allDurationSamples.reduce((sum, value) => sum + value, 0) / allDurationSamples.length)
    : currentDurationMinutes || 30;
  const suggestedDuration = Math.min(240, Math.max(5, Math.round(averageDuration / 5) * 5));

  const learnedTagScoreMap = new Map(
    getLearnedTagScores(`${title} ${description}`)
      .map((item) => [item.tagName, item.score])
  );
  const storeRecommendedTags = getRecommendedTags(`${title} ${description}`.trim(), 5);

  const tagScoreMap = new Map<string, number>();
  const pushTagScore = (tagName: string, score: number) => {
    if (!availableTagNames.has(tagName) || score <= 0) return;
    tagScoreMap.set(tagName, (tagScoreMap.get(tagName) || 0) + score);
  };

  matchedHistoryTasks.forEach((historyTask, historyIndex) => {
    const historyText = `${historyTask.title || ''} ${historyTask.description || ''}`.toLowerCase();
    const baseScore = Math.max(3, 14 - historyIndex);

    historyTask.tags?.forEach((tagName) => {
      let score = baseScore;
      const tagLower = tagName.toLowerCase();

      if (normalizedTaskText && historyText && normalizedTaskText === historyText) score += 10;
      if (normalizedTitle && historyTask.title?.toLowerCase() === normalizedTitle) score += 12;
      if (normalizedTaskText && historyText.includes(normalizedTaskText)) score += 6;
      if (tagLower && normalizedTaskText.includes(tagLower)) score += 10;

      pushTagScore(tagName, score);
    });
  });

  const titleDescriptionTokens = splitTokens(`${title} ${description}`);

  activeTags.forEach((tag) => {
    const recommendedIndex = storeRecommendedTags.indexOf(tag.name);
    if (recommendedIndex >= 0) {
      pushTagScore(tag.name, 18 - recommendedIndex * 3);
    }

    const tagLower = tag.name.toLowerCase();
    let directScore = 0;

    if (normalizedTaskText && (normalizedTaskText.includes(tagLower) || tagLower.includes(normalizedTaskText))) {
      directScore += tagLower === normalizedTaskText ? 20 : 12;
    }

    titleDescriptionTokens.forEach((token) => {
      if (token === tagLower) {
        directScore += 14;
      } else if (token.length >= 3 && (token.includes(tagLower) || tagLower.includes(token))) {
        directScore += 4;
      }
    });

    if (directScore > 0) {
      pushTagScore(tag.name, directScore + Math.min(tag.usageCount || 0, 8));
    }

    const learnedScore = learnedTagScoreMap.get(tag.name) || 0;
    if (learnedScore > 0) {
      pushTagScore(tag.name, learnedScore);
    }
  });

  const suggestedTags = Array.from(tagScoreMap.entries())
    .filter(([, score]) => score >= 14)
    .sort((a, b) => b[1] - a[1])
    .map(([tagName]) => tagName)
    .slice(0, 3);

  const fallbackRecommendedTags = storeRecommendedTags
    .filter((tagName) => availableTagNames.has(tagName));

  const finalSuggestedTags = (suggestedTags.length > 0 ? suggestedTags : fallbackRecommendedTags)
    .slice(0, 3);

  const topTagScore = suggestedTags.length > 0
    ? (tagScoreMap.get(suggestedTags[0]) || 0)
    : 0;
  const isLowConfidenceTagging = topTagScore < 18 && finalSuggestedTags.length <= 1;
  const conservativeSuggestedTags = isLowConfidenceTagging ? [] : finalSuggestedTags;

  const historicalGoldSamples = matchedHistoryTasks
    .filter((item) => typeof item.goldReward === 'number' && item.goldReward >= 0)
    .map((item, index) => {
      const recencyTime = item.updatedAt || item.createdAt;
      const daysAgo = recencyTime
        ? Math.max(0, Math.floor((Date.now() - new Date(recencyTime).getTime()) / (1000 * 60 * 60 * 24)))
        : 30;
      const recencyWeight = Math.max(0.45, 1.35 - Math.min(daysAgo, 90) / 100);
      const rankWeight = Math.max(0.35, 1.2 - index * 0.08);
      const durationWeight = item.durationMinutes > 0
        ? Math.max(0.55, 1 - Math.abs(item.durationMinutes - suggestedDuration) / Math.max(suggestedDuration, 15))
        : 0.7;

      return {
        gold: item.goldReward as number,
        durationMinutes: item.durationMinutes || suggestedDuration,
        weight: Number((recencyWeight * rankWeight * durationWeight).toFixed(3)),
      };
    });

  const categoryGoldSamples = categoryMatchedTasks
    .filter((item) => typeof item.goldReward === 'number' && item.goldReward >= 0)
    .slice(0, 24)
    .map((item) => ({
      gold: item.goldReward as number,
      durationMinutes: item.durationMinutes || suggestedDuration,
      weight: 0.7,
    }));

  const tagMatchedTasks = otherTasks
    .filter((item) => item.tags?.some((tagName) => conservativeSuggestedTags.includes(tagName)))
    .filter((item) => typeof item.goldReward === 'number' && item.goldReward >= 0)
    .slice(0, 18)
    .map((item) => ({
      gold: item.goldReward as number,
      durationMinutes: item.durationMinutes || suggestedDuration,
      weight: 0.55,
    }));

  const inferredTaskType = inferTaskType(`${normalizedTitle} ${normalizedDescription}`, currentTaskType);
  const fallbackGold = smartCalculateGoldReward(suggestedDuration, inferredTaskType, conservativeSuggestedTags, title);

  const weightedGoldPerMinuteFromHistory = historicalGoldSamples.reduce(
    (sum, item) => sum + item.weight * (item.gold / Math.max(item.durationMinutes, 1)),
    0
  );
  const totalHistoryWeight = historicalGoldSamples.reduce((sum, item) => sum + item.weight, 0);
  const historicalGoldPerMinute = totalHistoryWeight > 0
    ? weightedGoldPerMinuteFromHistory / totalHistoryWeight
    : 0;

  const weightedGoldPerMinuteFromCategory = categoryGoldSamples.reduce(
    (sum, item) => sum + item.weight * (item.gold / Math.max(item.durationMinutes, 1)),
    0
  );
  const totalCategoryWeight = categoryGoldSamples.reduce((sum, item) => sum + item.weight, 0);
  const categoryGoldPerMinute = totalCategoryWeight > 0
    ? weightedGoldPerMinuteFromCategory / totalCategoryWeight
    : 0;

  const weightedGoldPerMinuteFromTags = tagMatchedTasks.reduce(
    (sum, item) => sum + item.weight * (item.gold / Math.max(item.durationMinutes, 1)),
    0
  );
  const totalTagWeight = tagMatchedTasks.reduce((sum, item) => sum + item.weight, 0);
  const tagGoldPerMinute = totalTagWeight > 0
    ? weightedGoldPerMinuteFromTags / totalTagWeight
    : 0;

  const fallbackGoldPerMinute = fallbackGold / Math.max(suggestedDuration, 1);
  const blendedGoldPerMinute = totalHistoryWeight > 0
    ? (historicalGoldPerMinute * 0.5) + (categoryGoldPerMinute * 0.28) + (tagGoldPerMinute * 0.14) + (fallbackGoldPerMinute * 0.08)
    : totalCategoryWeight > 0
      ? (categoryGoldPerMinute * 0.62) + (tagGoldPerMinute * 0.2) + (fallbackGoldPerMinute * 0.18)
      : totalTagWeight > 0
        ? (tagGoldPerMinute * 0.72) + (fallbackGoldPerMinute * 0.28)
        : fallbackGoldPerMinute;

  const suggestedGold = Math.max(0, Math.round((blendedGoldPerMinute * suggestedDuration) / 5) * 5);

  const goalKeywords = Array.from(new Set([
    ...titleTokens,
    ...conservativeSuggestedTags,
    ...normalizedTitle.split(/[\s\-_/，。！？、：:（）()【】\[\]]+/).filter(Boolean),
  ])).slice(0, 12);

  const matchingGoals = findMatchingGoals(title, goalKeywords);

  const getGoalScore = (goal: LongTermGoal) => {
    const goalText = `${goal.name} ${goal.description} ${(goal.projectBindings || []).map((item) => item.name).join(' ')}`.toLowerCase();
    let score = 0;

    titleTokens.forEach((token) => {
      if (goalText.includes(token)) {
        score += token.length >= 4 ? 5 : 2;
      }
    });

    if (normalizedTitle && goalText.includes(normalizedTitle)) score += 12;
    if (normalizedDescription && goalText.includes(normalizedDescription)) score += 4;

    return score;
  };

  const bestGoal = matchingGoals
    .map((goal) => ({ goal, score: getGoalScore(goal) }))
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)[0]?.goal;

  return {
    suggestedDuration,
    suggestedGold,
    suggestedTags: conservativeSuggestedTags,
    suggestedGoalId: bestGoal?.id || '',
    matchedHistoryCount: matchedHistoryTasks.length,
    categoryLabel: currentTaskCategory,
    categoryHistoryCount: categoryMatchedTasks.length,
  };
};


