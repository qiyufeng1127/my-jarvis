import { useState, useRef, useMemo } from 'react';
import { X, Plus, Search, Trash2, Check, ChevronRight, ShieldAlert } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { useGoldStore } from '@/stores/goldStore';
import { useTaskStore } from '@/stores/taskStore';
import { useTagStore } from '@/stores/tagStore';
import { useKeyboardAvoidance } from '@/hooks';
import { smartCalculateGoldReward } from '@/utils/goldCalculator';
import type { Task, LongTermGoal, TaskType } from '@/types';
import type { SubTask } from '@/services/taskVerificationService';

interface CompactTaskEditModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * 紧凑型任务编辑弹窗
 * 优化间距，信息密度更高，一屏显示所有内容
 */
export default function CompactTaskEditModal({ task, onClose, onSave, onDelete }: CompactTaskEditModalProps) {
  console.log('🎨 CompactTaskEditModal 已渲染 - 智能分配按钮应该可见');
  console.log('📝 任务数据:', task);
  
  const { goals, createGoal, findMatchingGoals } = useGoalStore();
  const { deductGold, balance } = useGoldStore();
  const { tasks } = useTaskStore();
  const { getAllTags, getTagDurationRecords } = useTagStore();
  
  const [title, setTitle] = useState(task.title || '');
  const [isTitleAutoFilled, setIsTitleAutoFilled] = useState(false);
  const [description, setDescription] = useState(task.description || '');
  const [startTime, setStartTime] = useState(() => {
    if (task.scheduledStart) {
      const date = new Date(task.scheduledStart);
      return date.toTimeString().slice(0, 5);
    }
    return '';
  });
  const [duration, setDuration] = useState(task.durationMinutes || 30);
  const [gold, setGold] = useState(task.goldReward || 0);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [selectedGoalId, setSelectedGoalId] = useState(() => {
    // 从 longTermGoals 中获取第一个目标ID
    const goalIds = Object.keys(task.longTermGoals || {});
    return goalIds.length > 0 ? goalIds[0] : '';
  });
  const [location, setLocation] = useState(task.location || '');
  const [newTag, setNewTag] = useState('');
  const [isAIAssigning, setIsAIAssigning] = useState(false);
  
  // 子任务状态
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  
  // 关联目标选择弹窗状态
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [showNewGoalInput, setShowNewGoalInput] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalMetricName, setNewGoalMetricName] = useState('');
  const [newGoalMetricTarget, setNewGoalMetricTarget] = useState('');
  const [newGoalMetricUnit, setNewGoalMetricUnit] = useState('次');
  const [showAddMetricToSelectedGoal, setShowAddMetricToSelectedGoal] = useState(false);
  const [selectedGoalMetricName, setSelectedGoalMetricName] = useState('');
  const [selectedGoalMetricTarget, setSelectedGoalMetricTarget] = useState('');
  const [selectedGoalMetricUnit, setSelectedGoalMetricUnit] = useState('次');
  const [pendingGoalResultSelection, setPendingGoalResultSelection] = useState<{
    goalId: string;
    resultId: string;
    resultTitle: string;
    resultTypeLabel: string;
  } | null>(null);
  const [showGoalResultSelector, setShowGoalResultSelector] = useState(false);
  const hasMandatoryReflection = !!task.mandatoryReflection?.required && !task.mandatoryReflection?.resolved;
  
  // 用于自动滚动的引用
  const modalContentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const goldRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const { handleFocusCapture, scrollIntoSafeView } = useKeyboardAvoidance(modalContentRef);
  const scrollFieldIntoView = (element: HTMLElement | null) => {
    scrollIntoSafeView(element);
  };

  const smartAssignment = useMemo(() => {
    const normalizedTitle = title.trim().toLowerCase();
    const normalizedDescription = description.trim().toLowerCase();
    const availableTags = getAllTags().filter(tag => !tag.isDisabled);
    const availableTagNames = new Set(availableTags.map(tag => tag.name));
    const otherTasks = tasks.filter(item => item.id !== task.id);

    const titleTokens = Array.from(new Set(
      title
        .trim()
        .split(/[\s\-_/，。！？、：:（）()【】\[\]]+/)
        .map(token => token.trim().toLowerCase())
        .filter(token => token.length >= 2)
    ));

    const keywordTagMap: Array<{ keyword: string; tags: string[] }> = [
      { keyword: '家务', tags: ['家务', '清洁', '整理'] },
      { keyword: '打扫', tags: ['清洁', '家务', '整理'] },
      { keyword: '整理', tags: ['整理', '家务', '清洁'] },
      { keyword: '收拾', tags: ['整理', '家务', '清洁'] },
      { keyword: '做饭', tags: ['做饭', '日常', '生活'] },
      { keyword: '吃饭', tags: ['吃饭', '日常', '生活'] },
      { keyword: '厕所', tags: ['日常', '生活', '清洁'] },
      { keyword: '上厕所', tags: ['日常', '生活', '清洁'] },
      { keyword: '洗澡', tags: ['清洁', '日常', '生活'] },
      { keyword: '洗漱', tags: ['清洁', '日常', '生活'] },
      { keyword: '画画', tags: ['创作', '绘画', '艺术'] },
      { keyword: '绘画', tags: ['创作', '绘画', '艺术'] },
      { keyword: '插画', tags: ['创作', '绘画', '艺术'] },
      { keyword: '写作', tags: ['创作', '写作', '工作'] },
      { keyword: '学习', tags: ['学习', '成长', '阅读'] },
      { keyword: '阅读', tags: ['阅读', '学习', '成长'] },
      { keyword: '运动', tags: ['运动', '健康', '健身'] },
      { keyword: '跑步', tags: ['运动', '跑步', '健康'] },
      { keyword: '工作', tags: ['工作', '专注', '输出'] },
      { keyword: '会议', tags: ['会议', '工作', '沟通'] },
      { keyword: '拍摄', tags: ['拍摄', '创作', '工作'] },
      { keyword: '摄影', tags: ['拍摄', '创作', '艺术'] },
    ];

    const inferTaskType = (text: string): TaskType => {
      if (/(运动|跑步|健身|瑜伽|散步)/.test(text)) return 'health';
      if (/(画画|绘画|创作|拍摄|摄影|写作|设计)/.test(text)) return 'creative';
      if (/(家务|打扫|整理|做饭|吃饭|厕所|洗澡|洗漱|购物)/.test(text)) return 'life';
      if (/(学习|阅读|课程|复习)/.test(text)) return 'study';
      if (/(休息|睡觉|午睡)/.test(text)) return 'rest';
      return task.taskType || 'work';
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

    const detectTaskCategory = (taskTitle: string, taskDescription = '', taskTags: string[] = []) => {
      const text = `${taskTitle} ${taskDescription} ${taskTags.join(' ')}`.toLowerCase();
      const matchedRule = taskCategoryRules.find(rule =>
        rule.keywords.some(keyword => text.includes(keyword.toLowerCase())) ||
        taskTags.some(tag => rule.tags.includes(tag))
      );

      return matchedRule?.key || inferTaskType(text);
    };

    const currentTaskCategory = detectTaskCategory(title, description, tags);

    const getTextSimilarityScore = (baseText: string, candidateTask: Task) => {
      const candidateText = `${candidateTask.title || ''} ${candidateTask.description || ''}`.toLowerCase();
      if (!candidateText.trim()) return 0;

      let score = 0;
      if (baseText && candidateText.includes(baseText)) score += 8;
      if (candidateText && baseText.includes(candidateText)) score += 6;

      titleTokens.forEach(token => {
        if (candidateText.includes(token)) {
          score += token.length >= 4 ? 4 : 2;
        }
      });

      if (candidateTask.tags?.some(tag => normalizedTitle.includes(tag.toLowerCase()) || tag.toLowerCase().includes(normalizedTitle))) {
        score += 5;
      }

      if (detectTaskCategory(candidateTask.title || '', candidateTask.description || '', candidateTask.tags || []) === currentTaskCategory) {
        score += 10;
      }

      return score;
    };

    const matchedHistoryTasks = otherTasks
      .map(historyTask => ({
        task: historyTask,
        score: getTextSimilarityScore(normalizedTitle, historyTask),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(item => item.task);

    const categoryMatchedTasks = otherTasks
      .filter(historyTask => detectTaskCategory(historyTask.title || '', historyTask.description || '', historyTask.tags || []) === currentTaskCategory)
      .slice(0, 24);

    const durationSamples = matchedHistoryTasks
      .map(item => item.durationMinutes)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    const categoryDurationSamples = categoryMatchedTasks
      .map(item => item.durationMinutes)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    const durationFromTags = availableTags
      .filter(tag => normalizedTitle.includes(tag.name.toLowerCase()))
      .flatMap(tag => getTagDurationRecords(tag.name).map(record => record.duration))
      .filter(value => value > 0);

    const allDurationSamples = [...durationSamples, ...categoryDurationSamples, ...durationFromTags].filter(value => value > 0);
    const averageDuration = allDurationSamples.length > 0
      ? Math.round(allDurationSamples.reduce((sum, value) => sum + value, 0) / allDurationSamples.length)
      : task.durationMinutes || 30;
    const suggestedDuration = Math.min(240, Math.max(5, Math.round(averageDuration / 5) * 5));

    const tagScoreMap = new Map<string, number>();
    const pushTagScore = (tagName: string, score: number) => {
      if (!availableTagNames.has(tagName)) return;
      tagScoreMap.set(tagName, (tagScoreMap.get(tagName) || 0) + score);
    };

    matchedHistoryTasks.forEach((historyTask, historyIndex) => {
      historyTask.tags?.forEach(tagName => pushTagScore(tagName, Math.max(1, 8 - historyIndex)));
    });

    categoryMatchedTasks.forEach((historyTask) => {
      historyTask.tags?.forEach(tagName => pushTagScore(tagName, 4));
    });

    availableTags.forEach(tag => {
      const tagLower = tag.name.toLowerCase();
      if (normalizedTitle.includes(tagLower) || tagLower.includes(normalizedTitle)) {
        pushTagScore(tag.name, 12);
      }
      titleTokens.forEach(token => {
        if (tagLower.includes(token) || token.includes(tagLower)) {
          pushTagScore(tag.name, token.length >= 4 ? 8 : 5);
        }
      });
    });

    keywordTagMap.forEach(({ keyword, tags }) => {
      if (normalizedTitle.includes(keyword)) {
        tags.forEach(tagName => pushTagScore(tagName, 9));
      }
    });

    const categoryRule = taskCategoryRules.find(rule => rule.key === currentTaskCategory);
    categoryRule?.tags.forEach(tagName => pushTagScore(tagName, 7));

    const suggestedTags = Array.from(tagScoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tagName]) => tagName)
      .slice(0, 3);

    const historicalGoldSamples = matchedHistoryTasks
      .filter(item => typeof item.goldReward === 'number' && item.goldReward >= 0)
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
      .filter(item => typeof item.goldReward === 'number' && item.goldReward >= 0)
      .slice(0, 24)
      .map(item => ({
        gold: item.goldReward as number,
        durationMinutes: item.durationMinutes || suggestedDuration,
        weight: 0.7,
      }));

    const tagMatchedTasks = otherTasks
      .filter(item => item.tags?.some(tagName => suggestedTags.includes(tagName)))
      .filter(item => typeof item.goldReward === 'number' && item.goldReward >= 0)
      .slice(0, 18)
      .map(item => ({
        gold: item.goldReward as number,
        durationMinutes: item.durationMinutes || suggestedDuration,
        weight: 0.55,
      }));

    const inferredTaskType = inferTaskType(`${normalizedTitle} ${normalizedDescription}`);
    const fallbackGold = smartCalculateGoldReward(suggestedDuration, inferredTaskType, suggestedTags, title);

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

    const suggestedGold = Math.max(
      0,
      Math.round((blendedGoldPerMinute * suggestedDuration) / 5) * 5
    );

    const goalKeywords = Array.from(new Set([
      ...titleTokens,
      ...suggestedTags,
      ...normalizedTitle.split(/[\s\-_/，。！？、：:（）()【】\[\]]+/).filter(Boolean),
    ])).slice(0, 12);

    const matchingGoals = findMatchingGoals(title, goalKeywords);

    const getGoalScore = (goal: LongTermGoal) => {
      const goalText = `${goal.name} ${goal.description} ${(goal.projectBindings || []).map(item => item.name).join(' ')}`.toLowerCase();
      let score = 0;

      titleTokens.forEach(token => {
        if (goalText.includes(token)) {
          score += token.length >= 4 ? 5 : 2;
        }
      });

      if (normalizedTitle && goalText.includes(normalizedTitle)) score += 12;
      if (normalizedDescription && goalText.includes(normalizedDescription)) score += 4;

      return score;
    };

    const bestGoal = matchingGoals
      .map(goal => ({ goal, score: getGoalScore(goal) }))
      .filter(item => item.score >= 4)
      .sort((a, b) => b.score - a.score)[0]?.goal;

    return {
      suggestedDuration,
      suggestedGold,
      suggestedTags,
      suggestedGoalId: bestGoal?.id || '',
      matchedHistoryCount: matchedHistoryTasks.length,
      categoryLabel: currentTaskCategory,
      categoryHistoryCount: categoryMatchedTasks.length,
    };
  }, [title, description, getAllTags, getTagDurationRecords, tasks, task.id, task.durationMinutes, task.taskType, task.tags, findMatchingGoals]);

  
  // 过滤后的目标列表
  const filteredGoals = goals.filter(goal => 
    goal.name.toLowerCase().includes(goalSearchQuery.toLowerCase())
  );

  const selectedGoal = useMemo(
    () => goals.find(goal => goal.id === selectedGoalId),
    [goals, selectedGoalId]
  );

  const selectedGoalResults = useMemo(() => {
    if (!selectedGoal) return [];

    const dimensionResults = (selectedGoal.dimensions || [])
      .filter(item => item.name?.trim())
      .map(item => ({
        id: `dimension-${item.id}`,
        title: item.name.trim(),
        subtitle: item.targetValue
          ? `目标 ${item.targetValue}${item.unit ? ` ${item.unit}` : ''}`
          : item.unit ? `单位：${item.unit}` : '客观维度',
        type: 'dimension' as const,
      }));

    const milestoneResults = (selectedGoal.milestones || [])
      .filter(item => item.name?.trim())
      .map(item => ({
        id: `milestone-${item.id}`,
        title: item.name.trim(),
        subtitle: item.targetValue ? `里程碑 ${item.targetValue}` : '里程碑',
        type: 'milestone' as const,
      }));

    const projectBindingResults = (selectedGoal.projectBindings || [])
      .filter(item => item.name?.trim())
      .map(item => ({
        id: `project-${item.id}`,
        title: item.name.trim(),
        subtitle: '关联项目',
        type: 'project' as const,
      }));

    return [...dimensionResults, ...milestoneResults, ...projectBindingResults];
  }, [selectedGoal]);
  
  // 处理选择目标
  const handleSelectGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowGoalSelector(false);
    setGoalSearchQuery('');
    setShowAddMetricToSelectedGoal(false);
    setSelectedGoalMetricName('');
    setSelectedGoalMetricTarget('');
    setSelectedGoalMetricUnit('次');
    setShowGoalResultSelector(false);
  };

  const handleSelectGoalResult = (resultTitle: string, resultTypeLabel: string) => {
    setTitle(resultTitle);
    setIsTitleAutoFilled(true);

    const descriptionLines = [
      selectedGoal ? `关联目标：${selectedGoal.name}` : '',
      `${resultTypeLabel}：${resultTitle}`,
    ].filter(Boolean);

    setDescription(descriptionLines.join('\n'));
    setPendingGoalResultSelection(null);
    setShowGoalResultSelector(false);
  };
  
  // 处理新增目标
  const handleCreateNewGoal = () => {
    if (!newGoalName.trim()) {
      alert('请输入目标名称');
      return;
    }

    const metricName = newGoalMetricName.trim();
    const metricTarget = Number(newGoalMetricTarget || 0);
    const metricUnit = newGoalMetricUnit.trim() || '次';

    const dimensions = metricName && metricTarget > 0
      ? [{
          id: `metric-${Date.now()}`,
          name: metricName,
          unit: metricUnit,
          targetValue: metricTarget,
          currentValue: 0,
          weight: 100,
        }]
      : [];
    
    const newGoal = createGoal({
      name: newGoalName.trim(),
      description: '',
      goalType: 'numeric',
      isActive: true,
      dimensions,
      targetValue: dimensions.reduce((sum, item) => sum + item.targetValue, 0),
      currentValue: 0,
      unit: dimensions[0]?.unit || '',
    });
    
    setSelectedGoalId(newGoal.id);
    if (dimensions[0]) {
      setPendingGoalResultSelection({
        goalId: newGoal.id,
        resultId: `dimension-${dimensions[0].id}`,
        resultTitle: dimensions[0].name,
        resultTypeLabel: '关键结果',
      });
    } else {
      setPendingGoalResultSelection(null);
    }
    setNewGoalName('');
    setNewGoalMetricName('');
    setNewGoalMetricTarget('');
    setNewGoalMetricUnit('次');
    setShowAddMetricToSelectedGoal(false);
    setSelectedGoalMetricName('');
    setSelectedGoalMetricTarget('');
    setSelectedGoalMetricUnit('次');
    setShowNewGoalInput(false);
    setShowGoalSelector(false);
    setGoalSearchQuery('');
    setShowGoalResultSelector(!!dimensions[0]);
  };

  const handleAddMetricToCurrentGoal = () => {
    if (!selectedGoal) {
      alert('请先选择一个目标');
      return;
    }

    const metricName = selectedGoalMetricName.trim();
    const metricTarget = Number(selectedGoalMetricTarget || 0);
    const metricUnit = selectedGoalMetricUnit.trim() || '次';

    if (!metricName) {
      alert('请输入关键结果名称');
      return;
    }

    if (!metricTarget || metricTarget <= 0) {
      alert('请输入大于 0 的目标次数');
      return;
    }

    const createdMetric = {
      id: `metric-${Date.now()}`,
      name: metricName,
      unit: metricUnit,
      targetValue: metricTarget,
      currentValue: 0,
      weight: 100,
    };

    const nextDimensions = [
      ...(selectedGoal.dimensions || []),
      createdMetric,
    ];

    useGoalStore.getState().updateGoal(selectedGoal.id, {
      dimensions: nextDimensions,
      targetValue: nextDimensions.reduce((sum, item) => sum + (item.targetValue || 0), 0),
      currentValue: nextDimensions.reduce((sum, item) => sum + (item.currentValue || 0), 0),
      unit: selectedGoal.unit || metricUnit,
    });

    setSelectedGoalMetricName('');
    setSelectedGoalMetricTarget('');
    setSelectedGoalMetricUnit('次');
    setShowAddMetricToSelectedGoal(false);
    setPendingGoalResultSelection({
      goalId: selectedGoal.id,
      resultId: `dimension-${createdMetric.id}`,
      resultTitle: createdMetric.name,
      resultTypeLabel: '关键结果',
    });
    setShowGoalResultSelector(true);
  };

  const handleSave = () => {
    const updates: Partial<Task> = {
      title,
      description,
      durationMinutes: duration,
      goldReward: gold,
      tags,
      location: location || undefined,
      subtasks, // 保存子任务
    };

    // 更新关联目标
    if (selectedGoalId) {
      updates.longTermGoals = { [selectedGoalId]: 100 }; // 100% 贡献度
    } else {
      updates.longTermGoals = {};
    }

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const date = task.scheduledStart ? new Date(task.scheduledStart) : new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      updates.scheduledStart = date;
      
      // 计算结束时间
      const endDate = new Date(date);
      endDate.setMinutes(endDate.getMinutes() + duration);
      updates.scheduledEnd = endDate;
    }

    onSave(updates);
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 添加子任务
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };
    
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  // 删除子任务
  const removeSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  };

  // 切换子任务完成状态
  const toggleSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  // AI生成子任务
  const handleGenerateSubtasks = async () => {
    if (!title.trim()) {
      alert('请先输入任务标题');
      return;
    }

    setIsGeneratingSubtasks(true);

    try {
      const { generateSubTasks } = await import('@/services/taskVerificationService');
      const { useAIStore } = await import('@/stores/aiStore');
      const aiStore = useAIStore.getState();
      
      if (!aiStore.isConfigured()) {
        alert('请先在设置中配置AI API');
        setIsGeneratingSubtasks(false);
        return;
      }

      const subTaskTitles = await generateSubTasks(
        title,
        description || '',
        aiStore.config.apiKey,
        aiStore.config.apiEndpoint
      );

      const newSubtasks: SubTask[] = subTaskTitles.map(title => ({
        id: `subtask-${Date.now()}-${Math.random()}`,
        title,
        completed: false,
        createdAt: new Date(),
      }));

      setSubtasks([...subtasks, ...newSubtasks]);
      alert(`✅ 成功生成 ${newSubtasks.length} 个子任务！`);
    } catch (error) {
      console.error('生成子任务失败:', error);
      alert(`生成子任务失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  // 删除任务处理
  const handleDelete = () => {
    if (hasMandatoryReflection) {
      alert('该任务已触发强制追责表单，提交完成之前禁止删除任务。');
      return;
    }

    const isBackfillRecord = (task.identityTags || []).includes('system:backfill-record') || task.title === '补录记录';
    const taskGold = isBackfillRecord ? 0 : (task.goldReward || 0);
    
    if (taskGold <= 0) {
      // 如果任务没有金币奖励，直接删除
      if (confirm(`确定要删除任务"${task.title}"吗？`)) {
        if (onDelete) {
          onDelete(task.id);
        }
        onClose();
      }
      return;
    }
    
    // 校验金币余额
    if (balance < taskGold) {
      alert(`余额不足，无法删除此任务。\n需要: ${taskGold} 金币\n当前余额: ${balance} 金币`);
      return;
    }
    
    // 如果任务有金币奖励，需要扣除相应金币
    if (confirm(`删除任务"${task.title}"将扣除 ${taskGold} 金币，确定要删除吗？\n当前余额: ${balance} 金币`)) {
      try {
        // 扣除金币
        const success = deductGold(taskGold, `删除任务: ${task.title}`, task.id, task.title);
        
        if (!success) {
          alert('余额不足，无法删除此任务');
          return;
        }
        
        // 删除任务
        if (onDelete) {
          onDelete(task.id);
        }
        
        // 显示成功提示
        alert(`任务已删除，扣除 ${taskGold} 金币`);
        onClose();
      } catch (error) {
        console.error('删除任务失败:', error);
        alert(`删除失败，请重试。错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  };

  // 智能分配 - 基于历史记录动态填写时长、金币、标签和关联目标
  const handleAIAssign = async () => {
    if (!title.trim()) {
      alert('请先输入任务标题');
      return;
    }

    setIsAIAssigning(true);

    try {
      setDuration(smartAssignment.suggestedDuration);
      setGold(smartAssignment.suggestedGold);
      setTags(smartAssignment.suggestedTags);

      if (smartAssignment.suggestedGoalId) {
        setSelectedGoalId(smartAssignment.suggestedGoalId);
      } else {
        setSelectedGoalId('');
      }

      const summary = [
        `已根据你的历史记录完成智能分配。`,
        `识别类别：${smartAssignment.categoryLabel || '通用任务'}`,
        `建议时长：${smartAssignment.suggestedDuration} 分钟`,
        `建议金币：${smartAssignment.suggestedGold}`,
        `建议标签：${smartAssignment.suggestedTags.join('、') || '未找到合适标签'}`,
        smartAssignment.suggestedGoalId
          ? `关联目标：${goals.find(goal => goal.id === smartAssignment.suggestedGoalId)?.name || '已自动关联'}`
          : '关联目标：未匹配到明确目标，已保持不关联',
        `标题相似历史数：${smartAssignment.matchedHistoryCount}`,
        `类别历史数：${smartAssignment.categoryHistoryCount}`,
      ];

      alert(summary.join('\n'));
    } catch (error) {
      console.error('智能分配失败:', error);
      alert(`智能分配失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsAIAssigning(false);
    }
  };
  

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 z-50 keyboard-aware-modal-shell"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border-2 border-purple-200 dark:border-purple-800 keyboard-aware-modal-card"
        onFocusCapture={handleFocusCapture}
      >
        {hasMandatoryReflection && (
          <div className="mx-4 mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-900">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div>
                <div className="text-sm font-bold">当前任务处于强制追责状态</div>
                <div className="mt-1 text-xs leading-5">
                  你必须先填写并提交拖延 / 低效率表单，当前任务才允许完成。提交前不能删除任务，也不允许直接退出这个流程。
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 表单内容 - 紧凑布局，添加更大的底部内边距避免被按钮遮挡 */}
        <div
          ref={modalContentRef}
          className="flex-1 overflow-y-auto p-4 pt-5 pb-24 space-y-3 overscroll-contain keyboard-aware-scroll"
        >
          {/* 任务标题 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📝 任务标题
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsTitleAutoFilled(false);
              }}
              onFocus={() => scrollIntoSafeView(titleRef.current)}
              placeholder="输入任务名称..."
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
            {isTitleAutoFilled && (
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                已自动填充标题，确认无误后可直接保存。
              </div>
            )}
          </div>

          {/* 任务描述 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📄 任务描述
            </label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => scrollFieldIntoView(descriptionRef.current)}
              placeholder="详细描述任务内容..."
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none transition-all"
            />
          </div>

          {/* 时间和时长 - 并排显示 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ⏰ 开始时间
              </label>
              <input
                ref={startTimeRef}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onFocus={() => scrollFieldIntoView(startTimeRef.current)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ⏱️ 时长（分钟）
              </label>
              <input
                ref={durationRef}
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                onFocus={() => scrollFieldIntoView(durationRef.current)}
                min="1"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* 金币奖励 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                💰 金币奖励
              </label>
              <button
                onClick={handleAIAssign}
                disabled={isAIAssigning || !title.trim()}
                className="px-2 py-1 rounded-md text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ backgroundColor: '#6f8f64', color: '#f8f7f1' }}
                title="根据历史记录智能分配时长、金币、标签和目标"
              >
                {isAIAssigning ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>分配中...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>智能分配</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={goldRef}
              type="number"
              value={gold}
              onChange={(e) => setGold(parseInt(e.target.value) || 0)}
              onFocus={() => scrollFieldIntoView(goldRef.current)}
              min="0"
              className="w-full px-3 py-2 text-sm border-2 border-[#e5dccf] dark:border-yellow-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8b79e] focus:border-transparent bg-[#faf7ef] dark:from-yellow-900/20 dark:to-amber-900/20 text-gray-900 dark:text-white font-semibold transition-all"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🏷️ 标签
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-sm"
                  style={{ backgroundColor: '#eef2ff', color: '#4f6fb2' }}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签..."
                className="flex-1 px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-sm"
                style={{ backgroundColor: '#6f8f64', color: '#f8f7f1' }}
              >
                ➕ 添加
              </button>
            </div>
          </div>

          {/* 关联目标 */}
          <div ref={goalRef}>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              🎯 关联目标
            </label>
            <div className="space-y-2">
              <div
                onClick={() => {
                  scrollIntoSafeView(goalRef.current);
                  setShowGoalSelector(true);
                }}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all cursor-pointer hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {selectedGoalId ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {selectedGoal?.name || '选择目标...'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ) : (
                  <span className="text-gray-400">点击选择或新增目标...</span>
                )}
              </div>

              {selectedGoalId && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-purple-700 dark:text-purple-200">
                      已选目标：{selectedGoal?.name || '当前目标'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMetricToSelectedGoal(prev => !prev)}
                      className="px-2 py-1 rounded-md text-xs font-semibold transition-all"
                      style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}
                    >
                      {showAddMetricToSelectedGoal ? '收起新增KR' : '给当前目标新增KR'}
                    </button>
                  </div>

                  {showAddMetricToSelectedGoal && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={selectedGoalMetricName}
                        onChange={(e) => setSelectedGoalMetricName(e.target.value)}
                        placeholder="关键结果名称..."
                        className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <div className="grid grid-cols-[1fr_84px] gap-2">
                        <input
                          type="number"
                          min="1"
                          value={selectedGoalMetricTarget}
                          onChange={(e) => setSelectedGoalMetricTarget(e.target.value)}
                          placeholder="次数"
                          className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={selectedGoalMetricUnit}
                          onChange={(e) => setSelectedGoalMetricUnit(e.target.value)}
                          placeholder="单位"
                          className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMetricToCurrentGoal}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{ backgroundColor: '#7c3aed', color: '#f8f7f1' }}
                      >
                        确认给当前目标新增关键结果
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedGoalId && selectedGoalResults.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowGoalResultSelector(true)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                >
                  <span>选择关键结果</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 位置 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              📍 位置
            </label>
            <input
              ref={locationRef}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => scrollFieldIntoView(locationRef.current)}
              placeholder="例如：厨房、卧室、办公室..."
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
          </div>

          {/* 子任务 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                ✅ 子任务 ({subtasks.length})
              </label>
              <button
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubtasks || !title.trim()}
                className="px-2 py-1 rounded-md text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ backgroundColor: '#7aa7d9', color: '#f8fafc' }}
                title="AI生成子任务"
              >
                {isGeneratingSubtasks ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>AI生成</span>
                  </>
                )}
              </button>
            </div>
            
            {/* 子任务列表 */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <button
                      onClick={() => toggleSubtask(subtask.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        subtask.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }`}
                    >
                      {subtask.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed
                          ? 'line-through text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => removeSubtask(subtask.id)}
                      className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="删除子任务"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* 添加子任务输入框 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="添加子任务..."
                className="flex-1 px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
              />
              <button
                onClick={addSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#a8c6e8', color: '#f8fafc' }}
              >
                ➕ 添加
              </button>
            </div>
          </div>
        </div>

        {/* 关联目标选择弹窗 */}
        {showGoalSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] keyboard-aware-modal-shell">
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[76vh] flex flex-col overflow-hidden border-2 border-purple-300 dark:border-purple-700 keyboard-aware-modal-card"
              onFocusCapture={handleFocusCapture}
            >
              {/* 弹窗头部 */}
              <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#6f8f64' }}>
                <h4 className="text-base font-bold text-white">🎯 选择关联目标</h4>
                <button
                  onClick={() => {
                    setShowGoalSelector(false);
                    setGoalSearchQuery('');
                    setShowNewGoalInput(false);
                    setNewGoalName('');
                    setNewGoalMetricName('');
                    setNewGoalMetricTarget('');
                    setNewGoalMetricUnit('次');
                    setShowAddMetricToSelectedGoal(false);
                    setSelectedGoalMetricName('');
                    setSelectedGoalMetricTarget('');
                    setSelectedGoalMetricUnit('次');
                  }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* 搜索框 */}
              <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={goalSearchQuery}
                    onChange={(e) => setGoalSearchQuery(e.target.value)}
                    placeholder="搜索目标..."
                    className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    autoFocus
                    onFocus={() => scrollIntoSafeView(goalRef.current)}
                  />
                </div>
              </div>

              {/* 目标列表 */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* 无关联目标选项 */}
                <div
                  onClick={() => handleSelectGoal('')}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                    selectedGoalId === ''
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    无关联目标
                  </div>
                </div>

                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <div
                      key={goal.id}
                      onClick={() => handleSelectGoal(goal.id)}
                      className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                        selectedGoalId === goal.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-purple-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {goal.name}
                      </div>
                      {goal.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {goal.description}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    {goalSearchQuery ? '未找到匹配的目标' : '暂无已创建目标'}
                  </div>
                )}
              </div>

              {/* 新增目标区域 */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
                {showNewGoalInput ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNewGoal()}
                      placeholder="输入新目标名称..."
                      className="w-full px-3 py-2 text-sm border-2 border-purple-300 dark:border-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                      onFocus={() => scrollIntoSafeView(goalRef.current)}
                    />
                    <input
                      type="text"
                      value={newGoalMetricName}
                      onChange={(e) => setNewGoalMetricName(e.target.value)}
                      placeholder="顺手新增关键结果（可选）..."
                      className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <div className="grid grid-cols-[1fr_84px] gap-2">
                      <input
                        type="number"
                        min="1"
                        value={newGoalMetricTarget}
                        onChange={(e) => setNewGoalMetricTarget(e.target.value)}
                        placeholder="次数"
                        className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={newGoalMetricUnit}
                        onChange={(e) => setNewGoalMetricUnit(e.target.value)}
                        placeholder="单位"
                        className="w-full px-3 py-2 text-sm border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-5">
                      这里可以直接同时新建目标和关键结果；如果只填目标名，不填下面内容，也可以只创建目标。
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateNewGoal}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{ backgroundColor: '#6f8f64', color: '#f8f7f1' }}
                      >
                        确认新增
                      </button>
                      <button
                        onClick={() => {
                          setShowNewGoalInput(false);
                          setNewGoalName('');
                          setNewGoalMetricName('');
                          setNewGoalMetricTarget('');
                          setNewGoalMetricUnit('次');
                        }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewGoalInput(true)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#7f9b73', color: '#f8f7f1' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>新增目标</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 目标关键结果选择弹窗 */}
        {showGoalResultSelector && selectedGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[61] keyboard-aware-modal-shell">
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden border-2 border-purple-300 dark:border-purple-700 keyboard-aware-modal-card"
              onFocusCapture={handleFocusCapture}
            >
              <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">选择关键结果</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">已关联目标：{selectedGoal.name}</p>
                </div>
                <button
                  onClick={() => {
                    setPendingGoalResultSelection(null);
                    setShowGoalResultSelector(false);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedGoalResults.length > 0 ? (
                  selectedGoalResults.map((result) => {
                    const isPendingSelection = pendingGoalResultSelection?.goalId === selectedGoal?.id && pendingGoalResultSelection?.resultId === result.id;

                    return (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => handleSelectGoalResult(
                          result.title,
                          result.type === 'dimension' ? '关键结果' : result.type === 'milestone' ? '里程碑' : '项目'
                        )}
                        className={`w-full text-left p-3 rounded-xl border-2 bg-gray-50 dark:bg-gray-800 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all ${
                          isPendingSelection
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-[0_0_0_1px_rgba(168,85,247,0.12)]'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{result.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.subtitle}</div>
                            {isPendingSelection && (
                              <div className="mt-2 text-[11px] font-medium text-purple-600 dark:text-purple-300">
                                刚刚新建，点一下即可立即使用
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                            {result.type === 'dimension' ? '维度' : result.type === 'milestone' ? '里程碑' : '项目'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-gray-400">
                    这个目标里还没有可复用的关键结果
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 - 固定在弹窗底部 */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 px-3 py-3 flex gap-2 bg-white dark:bg-gray-800 shadow-2xl">
          <button
            onClick={handleDelete}
            disabled={hasMandatoryReflection}
            className="px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#EF4444', color: 'white' }}
            title={hasMandatoryReflection ? '强制追责表单未提交前禁止删除' : `删除任务将扣除 ${task.goldReward || 0} 金币`}
          >
            删除此任务
          </button>
          <button
            onClick={onClose}
            disabled={hasMandatoryReflection}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 shadow-lg"
            style={{ backgroundColor: '#6f8f64', color: '#f8f7f1' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

