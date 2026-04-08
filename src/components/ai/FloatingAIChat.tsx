import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, GripVertical, Settings, Hourglass, ChevronDown, ChevronUp, CheckSquare, Square, Sparkles, Volume2, VolumeX, User, Trash2 } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { useTagStore } from '@/stores/tagStore';
import { matchTaskToGoals, generateGoalSuggestionMessage } from '@/services/aiGoalMatcher';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import VoiceControl from '@/components/voice/VoiceControl';
import { notificationService } from '@/services/notificationService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';
import { behaviorMonitorService } from '@/services/behaviorMonitorService';
import AIPersonalitySettings from './AIPersonalitySettings';
import { processMutter } from '@/services/mutterService';
import { aiCommandCenter } from '@/services/aiCommandCenter';
import eventBus from '@/utils/eventBus';

// 标签ID到中文的映射
const TAG_LABELS: Record<string, string> = {
  // 情绪标签
  'happy': '开心',
  'excited': '兴奋',
  'calm': '平静',
  'grateful': '感恩',
  'proud': '自豪',
  'anxious': '焦虑',
  'sad': '难过',
  'angry': '生气',
  'frustrated': '沮丧',
  'tired': '疲惫',
  
  // 分类标签
  'work': '工作',
  'study': '学习',
  'life': '生活',
  'housework': '家务',
  'health': '健康',
  'social': '社交',
  'hobby': '爱好',
  'startup': '创业',
  'finance': '理财',
  'family': '家庭',
};
import { useAIStore } from '@/stores/aiStore';
import { useNextActionStore } from '@/stores/nextActionStore';
import { aiService } from '@/services/aiService';
import { useTaskStore } from '@/stores/taskStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import type { Task, TaskType, TaskPriority } from '@/types';
import AIConfigModal from './AIConfigModal';
import GoalForm, { type GoalFormData } from '@/components/growth/GoalForm';
import { 
  useLocalStorage, 
  useColorTheme, 
  useDraggable, 
  useResizable, 
  useThinkingProcess 
} from '@/hooks';
import {
  getPriorityEmoji,
  LOCATION_ICONS,
} from '@/utils/taskUtils';

interface FloatingAIChatProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  currentModule?: string; // 新增：当前模块
}

interface DecomposedTask {
  sequence: number;
  title: string;
  description: string;
  estimated_duration: number;
  scheduled_start: string;
  scheduled_end: string;
  scheduled_start_iso: string;
  task_type: string;
  category: string;
  location: string;
  tags: string[];
  goal: string | null;
  gold: number;
  color: string;
  priority: 'low' | 'medium' | 'high';
}

interface GoalDraftDimension {
  id: string;
  name: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  weight: number;
}

interface GoalDraftData {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  estimatedTotalHours: number;
  estimatedDailyHours: number;
  targetIncome?: number;
  projectBindings: Array<{ id: string; name: string; color?: string }>;
  dimensions: GoalDraftDimension[];
  theme: { color: string; label?: string };
  showInFuture30Chart: boolean;
  relatedDimensions: string[];
  extractedTags: string[];
  missingFields: string[];
}

interface GoalConversationState {
  draft: GoalDraftData;
  askedFields: string[];
  lastAskedField?: string;
  followupHint?: 'need_more_key_results';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  goalMatches?: Array<{ goalId: string; goalName: string; confidence: number }>;
  tags?: {
    emotions: string[];
    categories: string[];
    type?: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude';
  };
  rewards?: {
    gold: number;
    growth: number;
  };
  decomposedTasks?: DecomposedTask[];
  pendingAction?: {
    type: 'create_tasks' | 'update_task' | 'query_tasks';
    data: any;
  };
  showTaskEditor?: boolean;
  thinkingProcess?: string[];
  isThinkingExpanded?: boolean;
  isSelected?: boolean;
}


const beautifyAssistantReply = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^###\s*/gm, '✨ ')
    .replace(/^##\s*/gm, '💫 ')
    .replace(/^#\s*/gm, '🌟 ')
    .replace(/^---+$/gm, '────────')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const GOAL_THEME = { color: '#0A84FF', label: '海蓝' };

const CHINESE_NUMBER_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const parseChineseNumber = (value: string) => {
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (value === '十') return 10;
  if (value.startsWith('十')) return 10 + (CHINESE_NUMBER_MAP[value[1]] || 0);

  const tenIndex = value.indexOf('十');
  if (tenIndex > 0) {
    const tens = CHINESE_NUMBER_MAP[value.slice(0, tenIndex)] || 0;
    const ones = CHINESE_NUMBER_MAP[value.slice(tenIndex + 1)] || 0;
    return tens * 10 + ones;
  }

  return CHINESE_NUMBER_MAP[value] || 0;
};

const normalizeGoalText = (input: string) =>
  input
    .replace(/[，。！!？?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractRelativeDeadline = (message: string) => {
  const base = new Date();
  const patterns = [
    { regex: /([一二两三四五六七八九十\d]+)\s*天(?:之后|以后|内)?/, unit: 'day' as const },
    { regex: /([一二两三四五六七八九十\d]+)\s*周(?:之后|以后|内)?/, unit: 'week' as const },
    { regex: /([一二两三四五六七八九十\d]+)\s*个?月(?:之后|以后|内)?/, unit: 'month' as const },
  ];

  for (const { regex, unit } of patterns) {
    const match = message.match(regex);
    if (!match) continue;
    const value = parseChineseNumber(match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;

    const endDate = new Date(base);
    if (unit === 'day') endDate.setDate(endDate.getDate() + value);
    if (unit === 'week') endDate.setDate(endDate.getDate() + value * 7);
    if (unit === 'month') endDate.setMonth(endDate.getMonth() + value);

    return { value, unit, endDate };
  }

  return null;
};

const inferGoalNameFromMessage = (message: string) => {
  const cleaned = normalizeGoalText(message)
    .replace(/^(我想|我希望|我要|帮我|想要|希望|计划在|打算在)/, '')
    .replace(/(十|\d+)天(?:之后|以后|内).*/, '')
    .replace(/(一|二|两|三|四|五|六|七|八|九|十|\d+)周(?:之后|以后|内).*/, '')
    .replace(/(一|二|两|三|四|五|六|七|八|九|十|\d+)个?月(?:之后|以后|内).*/, '')
    .replace(/^(把|将)/, '')
    .trim();

  return cleaned || normalizeGoalText(message).slice(0, 24) || '新的目标';
};

const parseDailyHoursFromMessage = (message: string): number | null => {
  const normalized = message.replace(/半小时/g, '0.5小时');
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:个)?小时/);
  if (hourMatch) return Number(hourMatch[1]);

  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (minuteMatch) {
    return Number((parseFloat(minuteMatch[1]) / 60).toFixed(1));
  }

  if (/半天/.test(message)) return 4;
  if (/一整天|全天/.test(message)) return 8;

  return null;
};

function splitGoalItems(message: string) {
  return message
    .split(/[，,；;、\n]/)
    .map((item) => item.replace(/^(还有|以及|然后|再|想要|做到|实现|分别是|比如|例如)/, '').trim())
    .filter((item) => item.length > 0);
}

function inferGoalUnit(text: string) {
  if (/套|卖出|成交/.test(text)) return '套';
  if (/条|篇|内容|笔记|视频|作品|发布/.test(text)) return '条';
  if (/个|人|客户|线索|私域|加微|意向/.test(text)) return '个';
  if (/元|收入|销售额|营收|回款/.test(text)) return '元';
  return '项';
}

function inferGoalDimensionName(text: string) {
  if (/卖出|成交|出单|转化/.test(text)) return '成交转化';
  if (/内容|笔记|视频|作品|发布/.test(text)) return '内容发布';
  if (/客户|线索|私域|加微|意向/.test(text)) return '私域线索';
  if (/收入|销售额|营收|回款/.test(text)) return '目标收入';

  const cleaned = text
    .replace(/\d+(?:\.\d+)?\s*(套|单|个|篇|条|位|人|次|万|元)/g, '')
    .replace(/^(卖出|发布|新增|积累|做到|实现)/, '')
    .trim();

  return cleaned || '关键结果';
}

const parseSingleGoalDimension = (text: string, index: number): GoalDraftDimension | null => {
  const normalizedText = text.trim();
  const amountMatch = normalizedText.match(/([一二两三四五六七八九十\d]+(?:\.\d+)?)\s*(套|单|个|篇|条|位|人|次|万|元)/);
  const inferredUnit = amountMatch?.[2] || inferGoalUnit(normalizedText);
  let targetValue = amountMatch
    ? (/^[一二两三四五六七八九十]+$/.test(amountMatch[1]) ? parseChineseNumber(amountMatch[1]) : parseFloat(amountMatch[1]))
    : 1;
  let unit = inferredUnit;

  if (unit === '万') {
    targetValue = targetValue * 10000;
    unit = '元';
  }

  const name = inferGoalDimensionName(normalizedText);
  if (!name) return null;

  return {
    id: `metric-${Date.now()}-${index}`,
    name,
    unit,
    targetValue,
    currentValue: 0,
    weight: 0,
  };
};

const parseGoalDimensions = (message: string, existingTagNames: string[]): GoalDraftDimension[] => {
  const items = splitGoalItems(message);
  const matchedTags = existingTagNames.filter((tag) => message.includes(tag)).slice(0, 3);

  const dimensionCandidates = items
    .map((item, index) => parseSingleGoalDimension(item, index))
    .filter(Boolean) as GoalDraftDimension[];

  const inferredFromTags = matchedTags
    .filter((tag) => !dimensionCandidates.some((dimension) => dimension.name.includes(tag) || tag.includes(dimension.name)))
    .map((tag, index) => ({
      id: `metric-tag-${Date.now()}-${index}`,
      name: tag,
      unit: '项',
      targetValue: 1,
      currentValue: 0,
      weight: 0,
    }));

  const uniqueMap = new Map<string, GoalDraftDimension>();
  [...dimensionCandidates, ...inferredFromTags].forEach((item) => {
    if (!uniqueMap.has(item.name)) {
      uniqueMap.set(item.name, item);
    }
  });

  const result = Array.from(uniqueMap.values()).slice(0, 3);
  if (result.length === 0) return [];

  const baseWeight = Math.floor(100 / result.length);
  return result.map((item, index) => ({
    ...item,
    weight: index === result.length - 1
      ? 100 - baseWeight * (result.length - 1)
      : baseWeight,
  }));
};

const looksLikeGoalResultAnswer = (message: string) => {
  if (/[，,；;、\n]/.test(message)) return true;
  if (/([一二两三四五六七八九十\d]+(?:\.\d+)?)\s*(套|单|个|篇|条|位|人|次|万|元)/.test(message)) return true;
  return /卖出|成交|发布|新增|客户|线索|收入|回款|转化|内容/.test(message);
};

const buildGoalDraftFromMessage = (message: string, existingTagNames: string[]): GoalDraftData => {
  const timeInfo = extractRelativeDeadline(message);
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = timeInfo?.endDate;
  if (endDate) endDate.setHours(0, 0, 0, 0);

  const estimatedDailyHours = parseDailyHoursFromMessage(message) || 0;
  const dimensions = looksLikeGoalResultAnswer(message)
    ? parseGoalDimensions(message, existingTagNames)
    : [];
  const durationDays = endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;
  const estimatedTotalHours = estimatedDailyHours && durationDays
    ? Number((estimatedDailyHours * durationDays).toFixed(1))
    : 0;

  const extractedTags = existingTagNames.filter((tag) => message.includes(tag)).slice(0, 3);
  const incomeMatch = message.match(/(\d+(?:\.\d+)?)\s*(万|元)/);
  const targetIncome = incomeMatch
    ? (incomeMatch[2] === '万' ? parseFloat(incomeMatch[1]) * 10000 : parseFloat(incomeMatch[1]))
    : undefined;

  const missingFields = [];
  if (!estimatedDailyHours) missingFields.push('dailyHours');
  if (dimensions.length === 0) missingFields.push('keyResults');

  return {
    name: inferGoalNameFromMessage(message),
    description: normalizeGoalText(message),
    startDate,
    endDate,
    estimatedTotalHours,
    estimatedDailyHours,
    targetIncome,
    projectBindings: extractedTags.map((tag, index) => ({ id: `tag-binding-${Date.now()}-${index}`, name: tag })),
    dimensions,
    theme: GOAL_THEME,
    showInFuture30Chart: true,
    relatedDimensions: [],
    extractedTags,
    missingFields,
  };
};

const mergeGoalDraftWithAnswer = (
  draft: GoalDraftData,
  field: string,
  answer: string,
  existingTagNames: string[]
): GoalDraftData => {
  const nextDraft = { ...draft };

  if (field === 'dailyHours') {
    const dailyHours = parseDailyHoursFromMessage(answer);
    if (dailyHours) {
      nextDraft.estimatedDailyHours = dailyHours;
      if (nextDraft.startDate && nextDraft.endDate) {
        const durationDays = Math.max(1, Math.ceil((nextDraft.endDate.getTime() - nextDraft.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        nextDraft.estimatedTotalHours = Number((dailyHours * durationDays).toFixed(1));
      }
    }
  }

  if (field === 'keyResults') {
    const dimensions = parseGoalDimensions(answer, existingTagNames);
    if (dimensions.length > 0) {
      nextDraft.dimensions = dimensions;
      const tags = existingTagNames.filter((tag) => answer.includes(tag)).slice(0, 3);
      if (tags.length > 0) {
        nextDraft.extractedTags = tags;
        nextDraft.projectBindings = tags.map((tag, index) => ({ id: `tag-binding-${Date.now()}-${index}`, name: tag }));
      }
    }
  }

  nextDraft.missingFields = nextDraft.missingFields.filter((item) => item !== field);
  return nextDraft;
};

const getNextGoalQuestion = (draft: GoalDraftData) => {
  const nextField = draft.missingFields[0];
  if (!nextField) return null;

  if (nextField === 'dailyHours') {
    return {
      field: nextField,
      text: '我先帮你把这个目标种下啦 🌱 那你每天大概愿意投入多久呢？比如 1 小时、2 小时，或者 40 分钟都可以～',
    };
  }

  if (nextField === 'keyResults') {
    return {
      field: nextField,
      text: '那我们再把关键结果说清一点呀 🤍 你希望它具体落成哪 2 到 3 个结果？比如 卖出多少套、发多少篇内容、加多少个意向客户。',
    };
  }

  return null;
};

const getMissingGoalResultTypes = (dimensions: GoalDraftDimension[]) => {
  const dimensionNames = dimensions.map((item) => item.name);
  const missing: string[] = [];

  if (!dimensionNames.some((name) => name.includes('成交'))) {
    missing.push('成交结果');
  }
  if (!dimensionNames.some((name) => name.includes('内容'))) {
    missing.push('内容发布');
  }
  if (!dimensionNames.some((name) => name.includes('线索') || name.includes('客户'))) {
    missing.push('意向客户');
  }

  return missing;
};

const getGoalKeyResultFollowup = (draft: GoalDraftData) => {
  const missing = getMissingGoalResultTypes(draft.dimensions);
  if (missing.length === 0) return null;

  return `我先收到一部分关键结果啦 ✨\n\n现在还想再补一下：${missing.join('、')}。\n你可以直接像这样回答我：卖出1套，发6条内容，新增10个意向客户。`;
};

const buildGoalCreatedReply = (draft: GoalDraftData, goalName: string) => {
  const dimensionText = draft.dimensions
    .map((item) => `${item.name} ${item.targetValue}${item.unit}`)
    .join('、');

  const tagText = draft.extractedTags.length > 0 ? `\n🏷️ 我顺手给它挂上了：${draft.extractedTags.join('、')}` : '';
  const dateText = draft.endDate ? `\n📅 截止时间：${draft.endDate.toLocaleDateString('zh-CN')}` : '';
  const timeText = draft.estimatedTotalHours > 0
    ? `\n⏳ 预计总时长：${draft.estimatedTotalHours} 小时（约 ${draft.estimatedDailyHours} 小时/天）`
    : '';
  const progressText = dimensionText ? `\n📈 客观进度：${dimensionText}` : '';

  return beautifyAssistantReply(`好呀，我已经把目标草稿整理好了 ✨\n\n🎯 目标：${goalName}${dateText}${timeText}${progressText}${tagText}\n\n我现在会直接帮你打开目标编辑器，你可以再顺手改一下，点保存后它就会正式进目标组件，后面的任务联动也能接上啦 🤍`);
};

const draftToGoalFormData = (draft: GoalDraftData): GoalFormData => ({
  name: draft.name,
  description: draft.description,
  type: 'numeric',
  startDate: draft.startDate ? new Date(draft.startDate.getTime() - draft.startDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : '',
  endDate: draft.endDate ? new Date(draft.endDate.getTime() - draft.endDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : '',
  estimatedTotalHours: draft.estimatedTotalHours,
  targetIncome: draft.targetIncome || 0,
  dimensions: draft.dimensions.length > 0 ? draft.dimensions : [
    {
      id: `metric-${Date.now()}`,
      name: draft.name || '关键结果',
      unit: '项',
      targetValue: 1,
      currentValue: 0,
      weight: 100,
    },
  ],
  projectBindings: draft.projectBindings,
  theme: draft.theme,
  showInFuture30Chart: draft.showInFuture30Chart,
  relatedDimensions: draft.relatedDimensions,
});



export default function FloatingAIChat({ isFullScreen = false, onClose, currentModule = 'timeline' }: FloatingAIChatProps = {}) {
  const { addMemory, addJournal } = useMemoryStore();
  const { isConfigured } = useAIStore();
  const { createTask, updateTask, deleteTask, tasks, getTodayTasks } = useTaskStore();
  const { createSideHustle, addIncome, addExpense } = useSideHustleStore();
  const { createGoal, updateGoal, goals } = useGoalStore();
  const { getAllTags } = useTagStore();
  const { personality, addMessage: addChatMessage } = useAIPersonalityStore();
  const nextActionSnapshot = useNextActionStore((state) => state.snapshot);
  
  // 上下文模式状态
  const [contextMode, setContextMode] = useState<'normal' | 'income' | 'goal' | 'mutter' | 'task_breakdown'>('normal');
  
  // 性格设置弹窗
  const [showPersonalitySettings, setShowPersonalitySettings] = useState(false);
  
  // 使用自定义 Hooks
  const [persistedState, setPersistedState] = useLocalStorage('ai_chat_state', {
    isOpen: false,
    position: { x: window.innerWidth - 420, y: 100 },
    size: { width: 400, height: 600 },
    bgColor: '#ffffff',
  });
  
  const [isOpen, setIsOpen] = useState(persistedState.isOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [bgColor, setBgColor] = useState(persistedState.bgColor);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isVoiceControlOpen, setIsVoiceControlOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [goalConversation, setGoalConversation] = useState<GoalConversationState | null>(null);
  
  const getWelcomeMessage = (): Message => {
    const moduleLabelMap: Record<string, string> = {
      timeline: '时间轴',
      goals: '目标',
      memory: '总部',
      journal: '日记',
      home: '首页',
      tags: '标签',
    };

    const moduleLabel = moduleLabelMap[currentModule] || currentModule;
    const nextHint = nextActionSnapshot?.suggestedAction
      ? `\n\n📍 当前场景：你现在在${moduleLabel}${nextActionSnapshot.focusLabel ? `，焦点是「${nextActionSnapshot.focusLabel}」` : ''}。\n👉 我建议你下一步先：${nextActionSnapshot.suggestedAction}`
      : `\n\n📍 当前场景：你现在在${moduleLabel}。你可以直接告诉我你想推进哪一步，我会尽量顺着当前页面帮你。`;

    return {
      id: 'welcome',
      role: 'assistant',
      content: beautifyAssistantReply(`你好！我是${personality.name}，你的AI助手${personality.toxicity > 60 ? '兼毒舌教练' : ''}。\n\n我能帮你：\n\n• 📅 智能分解任务和安排时间\n• 💰 自动分配金币和成长值\n• 🏷️ 自动打标签分类（AI智能理解）\n• 🕒 直接创建和修改时间轴任务\n• 🎯 智能关联长期目标\n• 📝 记录心情、想法、感恩、成功\n• 💡 收集创业想法到副业追踪器\n• 🔍 查询任务进度和统计\n• 🏠 智能动线优化（根据家里格局排序）\n• ✨ 万能收集：支持批量智能分析并分配\n• 🗑️ 时间轴操作：删除任务、移动任务\n\n**重要更新：**\n• 💬 我现在会真正和你对话，不只是执行命令\n• 👀 我会监督你的行为习惯（吃饭、睡觉、任务完成）\n• ${personality.toxicity > 60 ? '😏 该夸你的时候夸，该骂的时候绝不手软' : '🤗 该鼓励时鼓励，该提醒时提醒'}\n• 🎨 点击右上角头像可以设置我的性格${nextHint}\n\n直接输入文字开始对话吧！`),
      timestamp: new Date(),
    };
  };
  
  // 使用 localStorage 持久化聊天记录
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ai_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 恢复 Date 对象
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('恢复聊天记录失败:', error);
    }
    return [getWelcomeMessage()];
  });
  
  // 保存聊天记录到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('保存聊天记录失败:', error);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (messages.length === 1 && messages[0]?.id === 'welcome') {
      setMessages([getWelcomeMessage()]);
    }
  }, [currentModule, nextActionSnapshot?.updatedAt]);
  
  // 清除聊天记录
  const clearChatHistory = () => {
    if (window.confirm('确定要清除所有聊天记录吗？此操作不可恢复。')) {
      setMessages([getWelcomeMessage()]);
      localStorage.removeItem('ai_chat_messages');
    }
  };
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 使用自定义 Hooks 管理状态
  const theme = useColorTheme(bgColor);
  const { position, isDragging, handleDragStart } = useDraggable({
    initialPosition: persistedState.position,
    bounds: {
      minX: 0,
      maxX: window.innerWidth - 400,
      minY: 0,
      maxY: window.innerHeight - 600,
    },
  });
  const { size, isResizing, handleResizeStart } = useResizable({
    initialSize: persistedState.size,
    minSize: { width: 320, height: 400 },
  });
  const { thinkingSteps, addStep: addThinkingStep, clearSteps: clearThinkingSteps } = useThinkingProcess();
  
  // 任务编辑器状态
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<DecomposedTask[]>([]);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalEditorDraft, setGoalEditorDraft] = useState<GoalFormData | null>(null);
  const [goalEditorGoalId, setGoalEditorGoalId] = useState<string | null>(null);

  const openGoalIntakeMode = () => {
    setContextMode('goal');
    setGoalConversation(null);

    const modeMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: beautifyAssistantReply('🎯 目标收集模式已开启\n\n你接下来发给我的内容，我都会当成要写进目标组件的信息。\n\n你可以先直接用口语说目标，比如：\n• 十天之后把下一套文创卖出去\n• 这个月把插画接单流程跑顺\n• 两周内做完 12 条内容并拿到 5 个意向客户\n\n我会按目标组件真正需要的字段继续追问你，比如：\n✅ 截止时间\n✅ 每天愿意投入多久\n✅ 关键结果 / 客观进度\n✅ 预计总时长\n\n等我们问答补齐后，我会直接帮你打开目标编辑器，你再改一下就能保存。'),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, modeMessage]);
  };

  const openTaskBreakdownMode = () => {
    setContextMode('task_breakdown');

    const modeMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: beautifyAssistantReply('🧩 任务分解模式已开启\n\n你接下来发给我的内容，我都会当成要拆开的任务文案。\n\n比如你可以直接说：\n• 把明天直播前准备的事情拆一下\n• 我要做一个新页面，帮我拆成执行步骤\n• 把这周副业推进计划分解一下\n\n我拆完之后会直接帮你打开任务编辑器，你只要顺手改一改就能保存。'),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, modeMessage]);
  };

  const buildTasksFromGoalForm = (formData: GoalFormData): DecomposedTask[] => {
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    startDate.setHours(9, 0, 0, 0);

    const metrics = formData.dimensions.length > 0 ? formData.dimensions : [{
      id: `metric-${Date.now()}`,
      name: formData.name || '关键结果',
      unit: '项',
      targetValue: 1,
      currentValue: 0,
      weight: 100,
    }];

    const totalHours = Math.max(formData.estimatedTotalHours || 0, metrics.length);
    const totalMinutes = Math.max(60, Math.round(totalHours * 60));
    const baseMinutes = Math.max(30, Math.round(totalMinutes / Math.max(metrics.length, 1)));

    return metrics.map((metric, index) => {
      const start = new Date(startDate.getTime() + index * baseMinutes * 60000);
      const end = new Date(start.getTime() + baseMinutes * 60000);
      const taskTitle = `${metric.name}${metric.targetValue ? `：做到 ${metric.targetValue}${metric.unit || '项'}` : ''}`;

      return {
        sequence: index + 1,
        title: taskTitle,
        description: `${formData.name} · ${taskTitle}`,
        estimated_duration: baseMinutes,
        scheduled_start: start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_end: end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_start_iso: start.toISOString(),
        task_type: 'work',
        category: '目标推进',
        location: '工作区',
        tags: ['目标推进', formData.name].filter(Boolean),
        goal: formData.name,
        gold: Math.max(30, Math.round(baseMinutes * 1.2)),
        color: formData.theme?.color || '#0A84FF',
        priority: 'medium',
      };
    });
  };

  const handleGoalEditorSave = (formData: GoalFormData) => {
    const payload = {
      name: formData.name,
      description: formData.description,
      goalType: formData.type,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      deadline: formData.endDate ? new Date(formData.endDate) : undefined,
      estimatedTotalHours: formData.estimatedTotalHours,
      estimatedDailyHours: formData.startDate && formData.endDate && formData.estimatedTotalHours
        ? Number((formData.estimatedTotalHours / (Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)).toFixed(1))
        : 0,
      targetIncome: formData.targetIncome,
      dimensions: formData.dimensions,
      projectBindings: formData.projectBindings,
      theme: formData.theme,
      showInFuture30Chart: formData.showInFuture30Chart,
      relatedDimensions: formData.relatedDimensions,
      targetValue: formData.dimensions.reduce((sum, item) => sum + item.targetValue, 0),
      currentValue: formData.dimensions.reduce((sum, item) => sum + item.currentValue, 0),
      unit: formData.dimensions[0]?.unit || '',
    };

    const savedGoal = goalEditorGoalId
      ? (updateGoal(goalEditorGoalId, payload), goals.find((item) => item.id === goalEditorGoalId) || { id: goalEditorGoalId, name: formData.name })
      : createGoal(payload);

    const generatedTasks = buildTasksFromGoalForm(formData);

    eventBus.emit('dashboard:navigate-module', {
      module: 'goals',
      goalId: savedGoal.id,
      action: 'view',
    });

    setShowGoalEditor(false);
    setGoalEditorDraft(null);
    setGoalEditorGoalId(null);
    setGoalConversation(null);
    setContextMode('normal');
    setEditingTasks(generatedTasks);
    setShowTaskEditor(true);

    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: beautifyAssistantReply(`好啦，目标已经正式保存进目标组件了 ✨\n\n🎯 ${formData.name}\n📅 ${formData.startDate || '未设置开始时间'} → ${formData.endDate || '未设置结束时间'}\n⏳ 预计总时长：${formData.estimatedTotalHours || 0} 小时\n\n我也顺手把和这个目标直接相关的任务草稿给你铺好了，任务编辑器已经打开，你现在就可以继续改完再保存。`),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  // 监控编辑器状态变化
  useEffect(() => {
    console.log('🔍 [编辑器状态] showTaskEditor:', showTaskEditor);
    console.log('🔍 [编辑器状态] editingTasks.length:', editingTasks.length);
    console.log('🔍 [编辑器状态] 是否应该显示编辑器:', showTaskEditor && editingTasks.length > 0);
  }, [showTaskEditor, editingTasks]);

  // 监听 AI 打开任务编辑器事件
  useEffect(() => {
    const handleOpenTaskEditor = (data?: { tasks?: DecomposedTask[] }) => {
      const taskDrafts = data?.tasks || [];
      if (taskDrafts.length === 0) return;

      console.log('📥 [AI编辑器事件] 收到任务草稿:', taskDrafts);
      setEditingTasks(taskDrafts);
      setShowTaskEditor(true);
    };

    eventBus.on('ai:open-task-editor', handleOpenTaskEditor);

    return () => {
      eventBus.off('ai:open-task-editor', handleOpenTaskEditor);
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      // 重置高度以获取正确的 scrollHeight
      textareaRef.current.style.height = 'auto';
      // 设置新高度，最小2行，最大10行
      const lineHeight = 20; // 大约每行的高度
      const minHeight = lineHeight * 2;
      const maxHeight = lineHeight * 10;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [inputValue]);

  // 保存状态到localStorage（包括 isOpen）
  useEffect(() => {
    setPersistedState({
      isOpen,
      position,
      size,
      bgColor,
    });
  }, [isOpen, position, size, bgColor]); // 移除 setPersistedState 依赖，避免无限循环

  // 切换思考过程展开/折叠
  const toggleThinkingExpanded = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isThinkingExpanded: !msg.isThinkingExpanded }
        : msg
    ));
  };

  // 切换消息选中状态
  const toggleMessageSelection = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isSelected: !msg.isSelected }
        : msg
    ));
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const userMessages = messages.filter(m => m.role === 'user');
    const allSelected = userMessages.every(m => m.isSelected);
    
    setMessages(prev => prev.map(msg => 
      msg.role === 'user' 
        ? { ...msg, isSelected: !allSelected }
        : msg
    ));
  };

  // 智能分析并分配选中的消息
  const handleSmartDistribute = async () => {
    const selectedMessages = messages.filter(m => m.isSelected && m.role === 'user');
    
    if (selectedMessages.length === 0) {
      alert('请先选择要分析的消息');
      return;
    }

    setIsProcessing(true);
    clearThinkingSteps();

    try {
      addThinkingStep(`📝 开始分析 ${selectedMessages.length} 条消息...`);

      const results = [];
      
      for (const msg of selectedMessages) {
        addThinkingStep(`🔍 分析: "${msg.content.slice(0, 30)}..."`);
        
        // 使用 AI 分类服务
        const classification = await aiService.classifyContent(msg.content);
        
        addThinkingStep(`✅ 识别为: ${classification.contentType} (置信度 ${Math.round(classification.confidence * 100)}%)`);
        
        results.push({
          message: msg,
          classification,
        });
      }

      // 按目标组件分组
      const grouped: Record<string, any[]> = {
        timeline: [],
        memory: [],
        journal: [],
        sidehustle: [],
      };

      results.forEach(({ message, classification }) => {
        grouped[classification.targetComponent].push({
          content: message.content,
          classification,
        });
      });

      addThinkingStep('📊 分类统计完成');

      // 执行分配
      let distributedCount = 0;

      // 1. 分配到时间轴
      if (grouped.timeline.length > 0) {
        addThinkingStep(`📅 正在创建 ${grouped.timeline.length} 个任务到时间轴...`);
        for (const item of grouped.timeline) {
          await createTask({
            title: item.content,
            description: '',
            taskType: 'work' as TaskType,
            priority: 2,
            durationMinutes: 30, // 默认30分钟
            scheduledStart: new Date(),
          });
          distributedCount++;
        }
      }

      // 2. 分配到记忆库
      if (grouped.memory.length > 0) {
        addThinkingStep(`🧠 正在保存 ${grouped.memory.length} 条记录到记忆库...`);
        for (const item of grouped.memory) {
          addMemory({
            type: item.classification.contentType === 'mood' ? 'mood' : 'thought',
            content: item.content,
            emotionTags: item.classification.emotionTags,
            categoryTags: item.classification.categoryTags,
            rewards: { gold: 20, growth: 5 },
          });
          distributedCount++;
        }
      }

      // 3. 分配到日记
      if (grouped.journal.length > 0) {
        addThinkingStep(`📖 正在保存 ${grouped.journal.length} 条记录到日记...`);
        for (const item of grouped.journal) {
          addJournal({
            type: item.classification.contentType === 'success' ? 'success' : 'gratitude',
            content: item.content,
            tags: item.classification.categoryTags,
            rewards: item.classification.contentType === 'success' 
              ? { gold: 50, growth: 10 }
              : { gold: 30, growth: 5 },
          });
          distributedCount++;
        }
      }

      // 4. 分配到副业追踪器
      if (grouped.sidehustle.length > 0) {
        addThinkingStep(`💡 正在创建 ${grouped.sidehustle.length} 个创业想法...`);
        for (const item of grouped.sidehustle) {
          await createSideHustle({
            name: item.content.slice(0, 50),
            icon: '💡',
            color: '#f59e0b',
            status: 'idea',
            aiAnalysis: item.content,
          });
          distributedCount++;
        }
      }

      addThinkingStep('✨ 分配完成！');

      // 显示结果
      const resultMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `✅ **智能分析并分配完成！**\n\n共处理 ${selectedMessages.length} 条消息：\n\n` +
          (grouped.timeline.length > 0 ? `📅 **时间轴**: ${grouped.timeline.length} 个任务\n` : '') +
          (grouped.memory.length > 0 ? `🧠 **记忆库**: ${grouped.memory.length} 条记录\n` : '') +
          (grouped.journal.length > 0 ? `📖 **日记**: ${grouped.journal.length} 条记录\n` : '') +
          (grouped.sidehustle.length > 0 ? `💡 **副业追踪器**: ${grouped.sidehustle.length} 个想法\n` : '') +
          `\n💡 你可以在对应模块查看详细内容！`,
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };

      setMessages(prev => [...prev, resultMessage]);

      // 取消选中状态
      setMessages(prev => prev.map(msg => ({ ...msg, isSelected: false })));
      setIsSelectionMode(false);

    } catch (error) {
      console.error('智能分配失败:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '❌ 抱歉，智能分析失败了。请检查 AI 配置或稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      clearThinkingSteps();
    }
  };

  // 智能标签分析 - 使用AI或关键词作为后备
  const analyzeMessageTags = async (message: string) => {
    // 如果配置了AI，使用AI分析
    if (isConfigured()) {
      try {
        const aiAnalysis = await aiService.analyzeMessage(message);
        
        // 计算奖励
        let rewards = { gold: 0, growth: 0 };
        if (aiAnalysis.type === 'mood') {
          rewards = { gold: 20, growth: 5 };
        } else if (aiAnalysis.type === 'thought') {
          rewards = { gold: 15, growth: 3 };
        } else if (aiAnalysis.type === 'todo') {
          rewards = { gold: 10, growth: 2 };
        } else if (aiAnalysis.type === 'success') {
          rewards = { gold: 50, growth: 10 };
        } else if (aiAnalysis.type === 'gratitude') {
          rewards = { gold: 30, growth: 5 };
        }
        
        return {
          emotions: aiAnalysis.emotionTags,
          categories: aiAnalysis.categoryTags,
          type: aiAnalysis.type,
          rewards,
          isAI: true,
          confidence: aiAnalysis.confidence,
        };
      } catch (error) {
        console.error('AI分析失败，使用关键词匹配:', error);
        // 如果AI失败，降级到关键词匹配
      }
    }
    
    // 关键词匹配作为后备方案
    const emotions: string[] = [];
    const categories: string[] = [];
    let type: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude' | undefined;
    let rewards = { gold: 0, growth: 0 };

    // 检测记录类型
    if (/心情|感觉|情绪/.test(message)) {
      type = 'mood';
      rewards = { gold: 20, growth: 5 };
    } else if (/碎碎念|想法|突然想到|记录一下/.test(message)) {
      type = 'thought';
      rewards = { gold: 15, growth: 3 };
    } else if (/待办|要做|明天|计划|安排/.test(message)) {
      type = 'todo';
      rewards = { gold: 10, growth: 2 };
    } else if (/成功|完成了|做到了|达成/.test(message)) {
      type = 'success';
      rewards = { gold: 50, growth: 10 };
    } else if (/感恩|感谢|幸运|庆幸/.test(message)) {
      type = 'gratitude';
      rewards = { gold: 30, growth: 5 };
    }

    // 情绪标签检测
    EMOTION_TAGS.forEach(tag => {
      const keywords = {
        happy: ['开心', '高兴', '快乐', '愉快', '喜悦', '😊', '😄', '😁'],
        excited: ['兴奋', '激动', '期待', '振奋', '🤩', '😆'],
        calm: ['平静', '平和', '安静', '淡定', '放松', '😌', '😇'],
        grateful: ['感恩', '感谢', '感激', '庆幸', '🙏'],
        proud: ['自豪', '骄傲', '得意', '满意', '😎'],
        anxious: ['焦虑', '担心', '紧张', '不安', '忧虑', '😰', '😟'],
        sad: ['难过', '伤心', '悲伤', '失落', '沮丧', '😢', '😭'],
        angry: ['生气', '愤怒', '恼火', '气愤', '😠', '😡'],
        frustrated: ['沮丧', '挫败', '失望', '郁闷', '😞', '😔'],
        tired: ['疲惫', '累', '困', '疲劳', '😴', '😪'],
      };

      const tagKeywords = keywords[tag.id as keyof typeof keywords] || [];
      if (tagKeywords.some(keyword => message.includes(keyword))) {
        emotions.push(tag.id);
      }
    });

    // 分类标签检测
    CATEGORY_TAGS.forEach(tag => {
      const keywords = {
        work: ['工作', '上班', '项目', '会议', '同事', '老板', '💼'],
        study: ['学习', '读书', '课程', '考试', '作业', '📚', '📖'],
        life: ['生活', '日常', '今天', '早上', '晚上', '🏠'],
        housework: ['家务', '打扫', '洗衣', '做饭', '收拾', '🧹'],
        health: ['健康', '运动', '锻炼', '健身', '跑步', '💪', '🏃'],
        social: ['朋友', '聚会', '社交', '见面', '聊天', '👥'],
        hobby: ['爱好', '兴趣', '画画', '音乐', '游戏', '🎨', '🎮'],
        startup: ['创业', '项目', '产品', '用户', '商业', '🚀'],
        finance: ['钱', '理财', '投资', '收入', '支出', '💰'],
        family: ['家人', '父母', '孩子', '家庭', '👨‍👩‍👧'],
      };

      const tagKeywords = keywords[tag.id as keyof typeof keywords] || [];
      if (tagKeywords.some(keyword => message.includes(keyword))) {
        categories.push(tag.id);
      }
    });

    return { emotions, categories, type, rewards, isAI: false, confidence: 0 };
  };



  // 从 AI 回复文本中提取任务草稿，作为手动打开编辑器的兜底方案
  const parseDecomposedTasksFromContent = (content: string): DecomposedTask[] => {
    if (!content) return [];

    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const taskLines = lines.filter(line => /^\d+[.、]/.test(line));
    if (taskLines.length === 0) return [];

    const now = new Date();

    return taskLines.map((line, index) => {
      const cleanedLine = line
        .replace(/^\d+[.、]\s*/, '')
        .replace(/\*\*/g, '')
        .trim();

      const durationMatch = cleanedLine.match(/(\d+)\s*分钟|([一二两三四五六七八九十\d]+)\s*小时/);
      let estimatedDuration = 30;

      if (durationMatch) {
        if (durationMatch[1]) {
          estimatedDuration = parseInt(durationMatch[1], 10);
        } else if (durationMatch[2]) {
          const hourText = durationMatch[2];
          const hourMap: Record<string, number> = {
            一: 1,
            二: 2,
            两: 2,
            三: 3,
            四: 4,
            五: 5,
            六: 6,
            七: 7,
            八: 8,
            九: 9,
            十: 10,
          };
          const hours = /^\d+$/.test(hourText) ? parseInt(hourText, 10) : (hourMap[hourText] || 1);
          estimatedDuration = hours * 60;
        }
      }

      const title = cleanedLine
        .replace(/（.*?）/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/^"|"$/g, '')
        .replace(/^“|”$/g, '')
        .replace(/^-\s*/, '')
        .trim();

      const scheduledStart = new Date(now.getTime() + index * estimatedDuration * 60000);
      const scheduledEnd = new Date(scheduledStart.getTime() + estimatedDuration * 60000);

      return {
        sequence: index + 1,
        title: title || `任务${index + 1}`,
        description: cleanedLine,
        estimated_duration: estimatedDuration,
        scheduled_start: scheduledStart.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_end: scheduledEnd.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_start_iso: scheduledStart.toISOString(),
        task_type: 'life',
        category: 'AI安排',
        location: '全屋',
        tags: ['AI安排'],
        goal: null,
        gold: 0,
        color: '#6A7334',
        priority: index === 0 ? 'high' : 'medium',
      };
    });
  };

  // 推送任务到时间轴
  const handlePushToTimeline = async (tasks: DecomposedTask[]) => {
    if (tasks.length === 0) return;

    setIsProcessing(true);
    try {
      const goals = useGoalStore.getState().goals;
      
      // 导入标签store
      const { useTagStore } = await import('@/stores/tagStore');
      const tagStore = useTagStore.getState();
      
      // 批量创建任务
      const createdTasks = [];
      for (const taskData of tasks) {
        const goalMatches: Record<string, number> = {};
        
        // 如果有目标，匹配置信度
        if (taskData.goal) {
          const goal = goals.find(g => g.title === taskData.goal);
          if (goal) {
            goalMatches[goal.id] = 0.8; // 手动关联的目标给80%置信度
          }
        }
        
        // 获取任务的标签（AI返回的中文标签）
        const taskTags = taskData.tags || [];
        console.log('🏷️ [任务标签] 任务:', taskData.title, '标签:', taskTags);
        
        // 确保标签存在于标签系统中（如果不存在则创建）
        taskTags.forEach(tagName => {
          const existingTag = tagStore.getTagByName(tagName);
          if (!existingTag) {
            console.log('🏷️ [创建标签]', tagName);
            tagStore.addTag(tagName);
          }
        });
        
        // 获取任务颜色：使用第一个标签的文件夹颜色
        let taskColor = '#6A7334'; // 默认颜色
        if (taskTags.length > 0) {
          const firstTagColor = tagStore.getTagColor(taskTags[0]);
          if (firstTagColor) {
            taskColor = firstTagColor;
            console.log('🎨 [任务颜色] 任务:', taskData.title, '使用标签:', taskTags[0], '颜色:', taskColor);
          }
        }
        
        // 🔧 修复：构建验证关键词（使用标签或任务标题）
        const verificationKeywords = taskTags.length > 0 ? taskTags.join('、') : taskData.title;
        
        const task = await createTask({
          title: taskData.title,
          description: taskData.description || '',
          taskType: taskData.task_type as TaskType,
          priority: taskData.priority === 'high' ? 1 : taskData.priority === 'medium' ? 2 : 3,
          durationMinutes: taskData.estimated_duration,
          scheduledStart: new Date(taskData.scheduled_start_iso),
          scheduledEnd: (() => {
            const start = new Date(taskData.scheduled_start_iso);
            start.setMinutes(start.getMinutes() + taskData.estimated_duration);
            return start;
          })(),
          longTermGoals: goalMatches,
          tags: taskTags, // 使用AI返回的中文标签
          color: taskColor, // 使用标签文件夹的颜色
          // 🔧 修复：添加完整的验证配置对象
          verificationStart: {
            type: 'photo',
            requirement: verificationKeywords, // 使用标签或任务标题作为验证关键词
            timeout: 120, // 2分钟超时
          },
          verificationComplete: {
            type: 'photo',
            requirement: verificationKeywords, // 使用标签或任务标题作为验证关键词
            timeout: 120, // 2分钟超时
          },
          // 同时保留这些字段以兼容其他代码
          verificationEnabled: true,
          startKeywords: taskTags.length > 0 ? taskTags : [taskData.title],
          completeKeywords: taskTags.length > 0 ? taskTags : [taskData.title],
        });
        createdTasks.push(task);
      }

      // 🎯 使用带性格的AI回复
      const actionDescription = `已成功推送 ${createdTasks.length} 个任务到时间轴`;
      const response = await aiService.chatWithPersonality(
        `用户刚才让我创建了${createdTasks.length}个任务，现在已经全部添加到时间轴了。`,
        { 
          actionDescription,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content,
          }))
        }
      );

      let aiReply = `✅ ${actionDescription}！\n\n📅 你可以在时间轴模块查看和管理这些任务。`;
      
      if (response.success && response.content) {
        aiReply = `✅ ${actionDescription}\n\n${response.content}`;
      }

      const successMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
      
      // 保存到聊天记录
      addChatMessage({
        role: 'assistant',
        content: aiReply,
        actions: [{
          type: 'create_task',
          description: actionDescription,
          data: createdTasks,
        }],
      });
      
      // 关闭编辑器
      setShowTaskEditor(false);
      setEditingTasks([]);
    } catch (error) {
      console.error('推送任务失败:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '❌ 抱歉，推送任务失败了。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };



  // 处理时间轴操作指令
  const handleTimelineOperation = async (message: string) => {
    try {
      // 检测删除操作
      if (/删除|清空/.test(message)) {
        let tasksToDelete: Task[] = [];
        let operationDesc = '';

        // 删除今天的任务
        if (/今天|今日/.test(message)) {
          tasksToDelete = getTodayTasks();
          operationDesc = '今天';
          
          // 进一步筛选：下午2点之后
          if (/下午|午后|2点之后|14点之后/.test(message)) {
            const today = new Date();
            today.setHours(14, 0, 0, 0);
            tasksToDelete = tasksToDelete.filter(t => 
              t.scheduledStart && new Date(t.scheduledStart) >= today
            );
            operationDesc = '今天下午2点之后';
          }
        }
        // 删除昨天的任务
        else if (/昨天|昨日/.test(message)) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          tasksToDelete = tasks.filter(t => {
            if (!t.scheduledStart) return false;
            const taskDate = new Date(t.scheduledStart);
            return (
              taskDate.getFullYear() === yesterday.getFullYear() &&
              taskDate.getMonth() === yesterday.getMonth() &&
              taskDate.getDate() === yesterday.getDate()
            );
          });
          operationDesc = '昨天';
        }
        // 删除明天的任务
        else if (/明天|明日/.test(message)) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tasksToDelete = tasks.filter(t => {
            if (!t.scheduledStart) return false;
            const taskDate = new Date(t.scheduledStart);
            return (
              taskDate.getFullYear() === tomorrow.getFullYear() &&
              taskDate.getMonth() === tomorrow.getMonth() &&
              taskDate.getDate() === tomorrow.getDate()
            );
          });
          operationDesc = '明天';
        }
        // 删除本周的任务
        else if (/本周|这周/.test(message)) {
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          
          tasksToDelete = tasks.filter(t => {
            if (!t.scheduledStart) return false;
            const taskDate = new Date(t.scheduledStart);
            return taskDate >= startOfWeek && taskDate < endOfWeek;
          });
          operationDesc = '本周';
        }

        if (tasksToDelete.length === 0) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ ${operationDesc}没有找到任何任务。`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }

        // 确认删除
        const confirmMessage = `⚠️ **确认删除操作**\n\n即将删除${operationDesc}的 **${tasksToDelete.length}** 个任务：\n\n`;
        let taskList = '';
        tasksToDelete.slice(0, 5).forEach((task, index) => {
          taskList += `${index + 1}. ${task.title} (${task.durationMinutes}分钟)\n`;
        });
        if (tasksToDelete.length > 5) {
          taskList += `... 还有 ${tasksToDelete.length - 5} 个任务\n`;
        }

        const confirmed = confirm(confirmMessage + taskList + '\n确定要删除吗？');
        
        if (confirmed) {
          // 执行删除
          for (const task of tasksToDelete) {
            await deleteTask(task.id);
          }

          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `✅ 已成功删除${operationDesc}的 ${tasksToDelete.length} 个任务！`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ 已取消删除操作。`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }
        return;
      }

      // 检测移动操作
      if (/挪到|移到|改到|调到/.test(message)) {
        // 提取日期信息
        const dateMatch = message.match(/(\d+)号/);
        if (!dateMatch) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ 请指定要移动到哪一天，例如："把16号的任务挪到15号"`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }

        const fromDateMatch = message.match(/(\d+)号.*?挪到|移到|改到|调到/);
        const toDateMatch = message.match(/挪到|移到|改到|调到.*?(\d+)号/);

        if (!fromDateMatch || !toDateMatch) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ 请明确指定从哪天移动到哪天，例如："把16号的任务挪到15号"`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }

        const fromDay = parseInt(fromDateMatch[1]);
        const toDay = parseInt(toDateMatch[1]);

        // 查找源日期的任务
        const now = new Date();
        const fromDate = new Date(now.getFullYear(), now.getMonth(), fromDay);
        const tasksToMove = tasks.filter(t => {
          if (!t.scheduledStart) return false;
          const taskDate = new Date(t.scheduledStart);
          return (
            taskDate.getFullYear() === fromDate.getFullYear() &&
            taskDate.getMonth() === fromDate.getMonth() &&
            taskDate.getDate() === fromDate.getDate()
          );
        });

        if (tasksToMove.length === 0) {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ ${fromDay}号没有找到任何任务。`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }

        // 确认移动
        const confirmMessage = `⚠️ **确认移动操作**\n\n即将把${fromDay}号的 **${tasksToMove.length}** 个任务移动到${toDay}号：\n\n`;
        let taskList = '';
        tasksToMove.forEach((task, index) => {
          taskList += `${index + 1}. ${task.title} (${task.durationMinutes}分钟)\n`;
        });

        const confirmed = confirm(confirmMessage + taskList + '\n确定要移动吗？');
        
        if (confirmed) {
          // 执行移动
          const toDate = new Date(now.getFullYear(), now.getMonth(), toDay);
          for (const task of tasksToMove) {
            const oldStart = new Date(task.scheduledStart!);
            const newStart = new Date(toDate);
            newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
            
            const newEnd = new Date(newStart);
            newEnd.setMinutes(newEnd.getMinutes() + task.durationMinutes);

            await updateTask(task.id, {
              scheduledStart: newStart,
              scheduledEnd: newEnd,
            });
          }

          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `✅ 已成功把${fromDay}号的 ${tasksToMove.length} 个任务移动到${toDay}号！`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `❌ 已取消移动操作。`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }
        return;
      }

      // 如果没有匹配到任何操作
      return false;
    } catch (error) {
      console.error('时间轴操作失败:', error);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `❌ 操作失败：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      return true;
    }
  };

  // 处理收入相关的输入
  const handleIncomeInput = async (message: string) => {
    try {
      addThinkingStep('💰 识别为收入记录...');
      
      // 使用 AI 或正则提取金额和描述
      const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:元|块|rmb|¥)?/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      
      addThinkingStep(`💵 提取金额: ${amount} 元`);
      
      // 创建收入记录
      const now = new Date();
      addIncome({
        sideHustleId: 'default', // 可以后续优化为智能匹配副业
        amount,
        description: message,
        date: now,
        source: '其他',
      });
      
      addThinkingStep('✅ 收入记录已保存');
      
      // 在时间轴上创建一个醒目的记录卡片（不是任务）
      await createTask({
        title: `💰💸✨ 收入 +${amount}元`,
        description: `🎉 ${message}\n\n💵 金额: ¥${amount}\n📅 时间: ${now.toLocaleString('zh-CN')}\n🎊 恭喜收入增加！`,
        taskType: 'life' as TaskType,
        priority: 1, // 高优先级，更醒目
        durationMinutes: 1, // 1分钟，只是记录
        scheduledStart: now,
        scheduledEnd: new Date(now.getTime() + 60000),
        tags: ['💰收入记录', '💸副业', '🎉成功'],
        color: '#FFB6C1', // 复古糖果粉色
        status: 'completed', // 标记为已完成，不需要执行
        isRecord: true, // 标记为记录类型
      });
      
      addThinkingStep('📅 已在时间轴标记');
      
      const responseContent = `✅ **收入记录成功！**\n\n💰💸 金额: ${amount} 元\n📝 描述: ${message}\n🕐 时间: ${now.toLocaleString('zh-CN')}\n\n✨🎉 已同步到副业追踪器和时间轴！`;
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 退出目标模式
      setContextMode('normal');
      
    } catch (error) {
      console.error('处理目标设置失败:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('❌ 抱歉呀，设置目标失败了，稍后我们再试一次～'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理碎碎念相关的输入
  const handleMutterInput = async (message: string) => {
    try {
      addThinkingStep('💭 识别为碎碎念...');
      
      // 使用 AI 分析碎碎念
      const prompt = `请分析以下碎碎念/心情记录，并以JSON格式返回分析结果：

碎碎念内容：
${message}

请返回以下格式的JSON（只返回JSON，不要其他文字）：
{
  "mood": "情绪名称（如：开心、焦虑、平静、兴奋等）",
  "moodEmoji": "对应的emoji（如：😊、😰、😌、🤩等）",
  "category": "分类（如：工作、生活、学习、情感、健康等）",
  "summary": "一句话总结（20字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}`;


      addThinkingStep('🤖 AI 正在分析情绪和内容...');
      
      const { chat } = useAIStore.getState();
      const response = await chat([
        {
          role: 'system',
          content: '你是一个善解人意的情绪分析助手，擅长理解用户的心情和想法。请用温暖、共情的方式分析用户的碎碎念。',
        },
        { role: 'user', content: prompt },
      ]);

      let analysis = {
        mood: '记录',
        moodEmoji: '📝',
        category: '生活',
        summary: message.slice(0, 20),
        tags: ['碎碎念'],
      };

      if (response.success && response.content) {
        try {
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
            addThinkingStep(`${analysis.moodEmoji} 检测到情绪: ${analysis.mood}`);
            addThinkingStep(`📂 分类: ${analysis.category}`);
          }
        } catch (e) {
          console.error('解析AI响应失败:', e);
        }
      }
      
      // 保存到记忆库
      addMemory({
        type: 'mutter',
        content: message,
        mood: analysis.mood,
        tags: analysis.tags,
        date: new Date(),
      });
      
      addThinkingStep('💾 已保存到记忆库');
      
      // 在时间轴上创建醒目的碎碎念记录卡片
      const now = new Date();
      await createTask({
        title: `💭${analysis.moodEmoji} ${analysis.summary}`,
        description: `${message}\n\n${analysis.moodEmoji} 心情: ${analysis.mood}\n📂 分类: ${analysis.category}\n🏷️ 标签: ${analysis.tags.join('、')}`,
        taskType: 'life' as TaskType,
        priority: 2,
        durationMinutes: 1,
        scheduledStart: now,
        scheduledEnd: new Date(now.getTime() + 60000),
        tags: ['💭碎碎念', ...analysis.tags],
        color: '#DDA0DD', // 复古糖果薰衣草紫
        status: 'completed',
        isRecord: true,
      });
      
      addThinkingStep('📅 已在时间轴标记');
      
      const responseContent = beautifyAssistantReply(`好啦，我已经帮你记下这段碎碎念了 🌷

💭 内容：${message}

${analysis.moodEmoji} 心情：${analysis.mood}
📂 分类：${analysis.category}
✨ 我的小总结：${analysis.summary}
🏷️ 标签：${analysis.tags.join('、')}

💰 顺手给你加了 30 金币

我也已经把它轻轻放进记忆库和时间轴里啦 🤍`);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 退出碎碎念模式
      setContextMode('normal');
      
    } catch (error) {
      console.error('处理碎碎念失败:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('唔，刚刚这条碎碎念我没有记成功 😢\n\n你别急，等一下再发我一次，我继续陪你记。'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理任务分解输入
  const handleTaskBreakdownInput = async (message: string) => {
    try {
      addThinkingStep('🧩 进入任务分解模式...');

      const goals = useGoalStore.getState().goals;
      const hasAI = isConfigured();

      if (hasAI) {
        try {
          addThinkingStep('🤖 正在智能拆分任务步骤...');

          const currentTime = new Date();
          const decomposeResult = await aiService.decomposeTask(message, currentTime);

          if (decomposeResult.success && decomposeResult.tasks && decomposeResult.tasks.length > 0) {
            const tasksWithMetadata: DecomposedTask[] = decomposeResult.tasks.map((task, index) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const [hours, minutes] = (task.startTime || '00:00').split(':').map(Number);
              const startTime = new Date(today);
              startTime.setHours(hours || 0, minutes || 0, 0, 0);

              const endTime = new Date(startTime.getTime() + task.duration * 60000);

              const goldReward = task.goldReward || (() => {
                const { smartCalculateGoldReward } = require('@/utils/goldCalculator');
                return smartCalculateGoldReward(task.duration, task.category, task.tags, task.title);
              })();

              return {
                sequence: index + 1,
                title: task.title,
                description: task.title,
                estimated_duration: task.duration,
                scheduled_start: task.startTime || startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                scheduled_end: endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                scheduled_start_iso: startTime.toISOString(),
                task_type: task.category || 'life',
                category: task.category || '生活事务',
                location: task.location || '未指定',
                tags: task.tags || ['任务分解'],
                goal: null,
                gold: goldReward,
                color: '#6A7334',
                priority: task.priority || 'medium',
              };
            });

            if (goals.length > 0) {
              const matches = matchTaskToGoals(
                { title: message, description: '' },
                goals
              );
              if (matches.length > 0 && matches[0]) {
                tasksWithMetadata.forEach(task => {
                  task.goal = matches[0].goalName;
                });
              }
            }

            const responseContent = beautifyAssistantReply(`好，我已经先帮你拆开啦 ✨\n\n我把它整理成 ${tasksWithMetadata.length} 个更好执行的小任务，任务编辑器也已经帮你打开了，你直接改一改就能保存。`);

            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
              decomposedTasks: tasksWithMetadata,
              showTaskEditor: true,
              thinkingProcess: [...thinkingSteps],
              isThinkingExpanded: false,
            };

            setMessages(prev => [...prev, aiMessage]);
            setEditingTasks(tasksWithMetadata);
            setShowTaskEditor(true);
            setContextMode('normal');
            return;
          }
        } catch (error) {
          console.error('任务分解模式 AI 处理失败:', error);
          addThinkingStep('⚠️ 智能分解没接稳，先用简单模式帮你打开编辑器');
        }
      }

      const fallbackTasks = parseDecomposedTasksFromContent(
        `1. ${message}`
      );

      const tasks = fallbackTasks.length > 0 ? fallbackTasks : [{
        sequence: 1,
        title: message,
        description: message,
        estimated_duration: 30,
        scheduled_start: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_end: new Date(Date.now() + 30 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        scheduled_start_iso: new Date().toISOString(),
        task_type: 'life',
        category: '任务分解',
        location: '全屋',
        tags: ['任务分解'],
        goal: null,
        gold: 0,
        color: '#6A7334',
        priority: 'medium' as const,
      }];

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('我先帮你接住了，这次先按一个草稿给你铺开，任务编辑器已经打开，你可以直接继续细改。'),
        timestamp: new Date(),
        decomposedTasks: tasks,
        showTaskEditor: true,
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };

      setMessages(prev => [...prev, aiMessage]);
      setEditingTasks(tasks);
      setShowTaskEditor(true);
      setContextMode('normal');
    } catch (error) {
      console.error('处理任务分解失败:', error);
      setContextMode('normal');
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('刚刚这次任务分解我没接稳，你再发我一次，我继续帮你拆。'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // 处理目标相关的输入
  const handleGoalInput = async (message: string) => {
    try {
      addThinkingStep('🎯 识别为目标设置...');

      const existingTagNames = getAllTags().map((tag) => tag.name);

      if (goalConversation) {
        const askedField = goalConversation.lastAskedField;
        const updatedDraft = askedField
          ? mergeGoalDraftWithAnswer(goalConversation.draft, askedField, message, existingTagNames)
          : goalConversation.draft;

        const shouldOpenEditorImmediately = askedField === 'keyResults' && updatedDraft.dimensions.length > 0;

        if (!shouldOpenEditorImmediately) {
          const nextQuestion = getNextGoalQuestion(updatedDraft);
          if (nextQuestion) {
            setGoalConversation({
              draft: updatedDraft,
              askedFields: [...goalConversation.askedFields, nextQuestion.field],
              lastAskedField: nextQuestion.field,
              followupHint: undefined,
            });

            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: beautifyAssistantReply(nextQuestion.text),
              timestamp: new Date(),
              thinkingProcess: [...thinkingSteps],
              isThinkingExpanded: false,
            };

            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        }

        setGoalEditorDraft(draftToGoalFormData(updatedDraft));
        setGoalEditorGoalId(null);
        setShowGoalEditor(true);
        setGoalConversation(null);

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: buildGoalCreatedReply(updatedDraft, updatedDraft.name),
          timestamp: new Date(),
          thinkingProcess: [...thinkingSteps],
          isThinkingExpanded: false,
        };

        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      const draft = buildGoalDraftFromMessage(message, existingTagNames);
      const nextQuestion = getNextGoalQuestion(draft);

      if (nextQuestion) {
        setGoalConversation({
          draft,
          askedFields: [nextQuestion.field],
          lastAskedField: nextQuestion.field,
          followupHint: undefined,
        });
        setContextMode('goal');

        const previewTags = draft.extractedTags.length > 0 ? `\n🏷️ 我先识别到这些标签：${draft.extractedTags.join('、')}` : '';
        const previewDate = draft.endDate ? `\n📅 我先理解成截止到：${draft.endDate.toLocaleDateString('zh-CN')}` : '';

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: beautifyAssistantReply(`收到啦，我知道你想推进这个目标：${draft.name}${previewDate}${previewTags}\n\n${nextQuestion.text}`),
          timestamp: new Date(),
          thinkingProcess: [...thinkingSteps],
          isThinkingExpanded: false,
        };

        setMessages(prev => [...prev, aiMessage]);
        return;
      }

      setGoalEditorDraft(draftToGoalFormData(draft));
      setGoalEditorGoalId(null);
      setShowGoalEditor(true);
      setGoalConversation(null);
      setContextMode('goal');

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: buildGoalCreatedReply(draft, draft.name),
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('处理目标设置失败:', error);
      setGoalConversation(null);
      setContextMode('normal');
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('这次目标没有帮你存成功呀 🥺\n\n没关系，我们等一下再试一次，我还在。'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // 发送消息
  const handleSend = async (forcedMessage?: string) => {
    const message = (forcedMessage ?? inputValue).trim();
    if (!message || isProcessing) return;

    const moduleLabelMap: Record<string, string> = {
      timeline: '时间轴',
      goals: '目标',
      memory: '总部',
      journal: '日记',
      home: '首页',
      tags: '标签',
    };
    const moduleLabel = moduleLabelMap[currentModule] || currentModule;
    const scenePrompt = nextActionSnapshot
      ? `当前页面模块：${moduleLabel}\n当前联动焦点：${nextActionSnapshot.focusLabel || '无'}\n当前关联目标：${nextActionSnapshot.goalName || '无'}\n当前关联任务：${nextActionSnapshot.taskTitle || '无'}\n建议下一步：${nextActionSnapshot.suggestedAction || '无'}\n请优先基于当前模块和联动焦点给建议，不要泛泛而谈。`
      : `当前页面模块：${moduleLabel}\n请优先结合当前模块给建议，不要泛泛而谈。`;

    // 清除之前的超时定时器
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    // ✅ 立即显示用户消息并清空输入框（修复延迟问题）
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue(''); // 立即清空输入框
    setIsProcessing(true);

    // 优先处理上下文模式，避免被通用意图识别打断
    if (contextMode === 'income') {
      clearThinkingSteps();
      await handleIncomeInput(message);
      setIsProcessing(false);
      clearThinkingSteps();
      return;
    }

    if (contextMode === 'goal' || goalConversation) {
      clearThinkingSteps();
      await handleGoalInput(message);
      setIsProcessing(false);
      clearThinkingSteps();
      return;
    }

    if (contextMode === 'task_breakdown') {
      clearThinkingSteps();
      await handleTaskBreakdownInput(message);
      setIsProcessing(false);
      clearThinkingSteps();
      return;
    }

    if (contextMode === 'mutter') {
      clearThinkingSteps();
      await handleMutterInput(message);
      setIsProcessing(false);
      clearThinkingSteps();
      return;
    }
    
    // 🧠 ==================== 智能AI指挥中枢 ==================== 🧠
    // 使用真正的AI语义理解，而不是关键词匹配
    try {
      console.log('🧠 [智能AI] 启动AI指挥中枢');
      
      // 准备上下文
      const context = {
        conversationHistory: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
        currentTime: new Date(),
        userBehavior: useAIPersonalityStore.getState().userBehavior,
        recentTasks: tasks.slice(-10),
        recentMemories: useMemoryStore.getState().memories.slice(-10),
        scenePrompt,
      };
      
      // 让AI理解用户意图
      addThinkingStep('🧠 正在理解你的意图...');
      const shouldForceGoalFlow = /(目标|十天|\d+天之后|\d+天以后|卖出去|关键结果|客观进度|预计耗费|预计总时长)/.test(message);
      if (shouldForceGoalFlow) {
        throw new Error('force-goal-flow');
      }
      const intent = await aiCommandCenter.processUserInput(message, context);
      
      addThinkingStep(`✅ 理解：${intent.understanding}`);
      addThinkingStep(`🎯 意图：${intent.intent} (置信度 ${Math.round(intent.confidence * 100)}%)`);
      
      // 如果需要确认
      if (intent.needsConfirmation && intent.actions.length > 0) {
        const confirmed = confirm(`${intent.understanding}\n\n确定要执行吗？`);
        if (!confirmed) {
          const cancelMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: '没关系，我先停在这里啦 🤍',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, cancelMessage]);
          setIsProcessing(false);
          clearThinkingSteps();
          return;
        }
      }
      
      // 执行AI决定的操作
      if (intent.actions.length > 0) {
        addThinkingStep(`⚙️ 正在执行 ${intent.actions.length} 个操作...`);
        
        const execution = await aiCommandCenter.executeActions(intent.actions);
        
        if (execution.success) {
          addThinkingStep('🤍 都处理好了');
        } else {
          addThinkingStep(`🌧️ 有一小部分没成功：${execution.errors.join(', ')}`);
        }
      }
      
      // 显示AI的回复
      const fallbackDecomposedTasks = intent.intent === 'create_task'
        ? parseDecomposedTasksFromContent(intent.reply)
        : [];

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply(intent.reply),
        timestamp: new Date(),
        thinkingProcess: [...thinkingSteps],
        isThinkingExpanded: false,
        decomposedTasks: fallbackDecomposedTasks,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 保存到聊天记录
      addChatMessage({
        role: 'user',
        content: message,
      });
      addChatMessage({
        role: 'assistant',
        content: beautifyAssistantReply(intent.reply),
        actions: intent.actions.map(a => ({
          type: a.type,
          description: a.description,
          data: a.params,
        })),
      });
      
      // 清除超时定时器
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
      
      setIsProcessing(false);
      clearThinkingSteps();
      return; // 🎯 使用智能AI处理后直接返回
      
    } catch (error) {
      if (error instanceof Error && error.message === 'force-goal-flow') {
        addThinkingStep('🎯 识别为目标对话，转入目标联动模式');
      } else {
        console.error('🧠 [智能AI] 处理失败，降级到传统模式:', error);
        addThinkingStep('⚠️ AI智能处理失败，使用传统模式');
      }
      // 继续执行下面的传统处理逻辑
    }
    // 🧠 ==================== 智能AI指挥中枢结束 ==================== 🧠
    
    // 检查上下文模式
    // 添加超时保护（30秒）
    sendTimeoutRef.current = setTimeout(() => {
      console.error('⚠️ [发送超时] 处理时间超过30秒');
      setIsProcessing(false);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply('❌ 抱歉，处理时间过长，请试试这些办法：\n\n• 缩短一点输入内容\n• 分几次发任务给我\n• 看看网络是不是卡住了\n\n如果还是不行，再刷新页面试试呀～'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }, 30000);

    try {
      // 🎯 使用意图识别服务（优先级最高）
      const { IntentRecognitionService } = await import('@/services/intentRecognitionService');
      const intentResult = IntentRecognitionService.recognizeIntent(message);
      
      console.log('🎯 [意图识别]', intentResult);
      
      // 根据意图类型路由到不同的处理函数
      if (intentResult.intent === 'set_goal' && intentResult.confidence > 0.55) {
        clearThinkingSteps();
        setContextMode('goal');
        await handleGoalInput(message);
        if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
        setIsProcessing(false);
        return;
      } else if (intentResult.intent === 'delete_tasks' && intentResult.confidence > 0.8) {
        // 删除任务操作
      const handled = await handleTimelineOperation(message);
        if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
      setIsProcessing(false);
      if (handled !== false) return;
      } else if (intentResult.intent === 'move_tasks' && intentResult.confidence > 0.8) {
        // 移动任务操作
        const handled = await handleTimelineOperation(message);
        if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
        setIsProcessing(false);
        if (handled !== false) return;
      } else if (intentResult.intent === 'query_tasks' && intentResult.confidence > 0.7) {
        // 查询任务操作 - 直接跳转到查询逻辑
      try {
        const todayTasks = getTodayTasks();
        const completedTasks = todayTasks.filter(t => t.status === 'completed');
        
        let responseContent = `📊 今日任务概览\n\n`;
        responseContent += `✅ 已完成：${completedTasks.length}/${todayTasks.length}\n`;
        responseContent += `⏱️ 总时长：${todayTasks.reduce((sum, t) => sum + t.durationMinutes, 0)} 分钟\n\n`;

        if (todayTasks.length === 0) {
          responseContent += '💡 今天还没有安排任务哦～\n\n';
          responseContent += '你可以直接告诉我你想做什么，我来帮你安排呀';
        } else {
          responseContent += '📝 任务列表：\n';
          todayTasks.forEach((task, index) => {
            const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '⏳' : '⏸️';
            responseContent += `${index + 1}. ${statusEmoji} ${task.title} (${task.durationMinutes}分钟)\n`;
          });
        }

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: beautifyAssistantReply(responseContent),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('查询任务失败:', error);
      } finally {
          if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
        setIsProcessing(false);
      }
      return;
    }
      
      // 如果意图是创建任务或记录，继续原有流程
      // 注意：不再使用旧的正则匹配，完全依赖意图识别

    // 检查是否配置了API Key
    const hasAI = isConfigured();
    if (!hasAI) {
      const shouldShowPrompt = /分解|拆解|安排时间|智能/.test(message);
      if (shouldShowPrompt) {
        const confirmConfig = confirm('AI功能需要配置API Key才能使用。\n\n配置后可以：\n• 智能理解上下文（不依赖关键词）\n• 更准确的标签识别\n• 自然语言对话\n• 智能任务分解\n• 智能动线优化\n\n是否现在配置？');
        if (confirmConfig) {
          setShowConfigModal(true);
            if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
            setIsProcessing(false);
          return;
        }
      }
    }

    // 分析标签（AI或关键词）- 在后台异步处理
    clearThinkingSteps(); // 清空之前的思考步骤
    
    let analysis = await analyzeMessageTags(message);
    
    // 更新用户消息，添加标签和奖励
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id 
        ? {
            ...msg,
            tags: {
              emotions: analysis.emotions,
              categories: analysis.categories,
              type: analysis.type,
            },
            rewards: analysis.rewards,
          }
        : msg
    ));

    // 智能分析任务并匹配目标
      const goals = useGoalStore.getState().goals;
      
      // 添加思考步骤
      addThinkingStep('📝 正在分析你的输入...');
      
      // 使用意图识别结果判断是否是任务创建
      const isTaskCreation = intentResult.intent === 'create_task' && intentResult.confidence > 0.6;
      const needsDecompose = intentResult.action === 'decompose_task' || intentResult.params.needsDecompose;
      
      console.log('🔍 [任务检测] 输入:', message);
      console.log('🔍 [任务检测] 意图:', intentResult.intent);
      console.log('🔍 [任务检测] 置信度:', intentResult.confidence);
      console.log('🔍 [任务检测] isTaskCreation:', isTaskCreation);
      console.log('🔍 [任务检测] needsDecompose:', needsDecompose);
      console.log('🔍 [任务检测] analysis.type:', analysis.type);
      
      if (isTaskCreation) {
        addThinkingStep('🎯 检测到任务创建请求');
        if (needsDecompose) {
          addThinkingStep('🔍 需要分解成多个任务');
        }
      }
      
      let responseContent = '';
      let aiTags = { emotions: [] as string[], categories: [] as string[], type: undefined as any };
      let aiRewards = { gold: 0, growth: 0 };

      // 如果检测到记录类型，先显示标签分析并保存到store
      if (analysis.type && !isTaskCreation) {
        // 保存到全景记忆
        addMemory({
          type: analysis.type,
          content: message,
          emotionTags: analysis.emotions,
          categoryTags: analysis.categories,
          rewards: analysis.rewards,
        });

        const typeNames = {
          mood: '心情记录',
          thought: '碎碎念',
          todo: '待办事项',
          success: '成功日记',
          gratitude: '感恩日记',
        };

        responseContent += `✨ 已识别为：${typeNames[analysis.type]}`;
        
        // 显示识别方式
        if (analysis.isAI) {
          responseContent += ` (AI智能识别，置信度 ${Math.round(analysis.confidence * 100)}%)\n\n`;
        } else {
          responseContent += ` (关键词匹配)\n\n`;
          responseContent += `💡 提示：配置API Key后可使用AI智能识别，更准确！\n\n`;
        }

        // 显示情绪标签
        if (analysis.emotions.length > 0) {
          responseContent += '🏷️ 情绪标签：';
          analysis.emotions.forEach(emotionId => {
            const tag = EMOTION_TAGS.find(t => t.id === emotionId);
            const label = TAG_LABELS[emotionId] || tag?.label || emotionId;
            if (tag) responseContent += `${tag.emoji} ${label}  `;
          });
          responseContent += '\n\n';
        }

        // 显示分类标签
        if (analysis.categories.length > 0) {
          responseContent += '📂 分类标签：';
          analysis.categories.forEach(categoryId => {
            const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
            const label = TAG_LABELS[categoryId] || tag?.label || categoryId;
            if (tag) responseContent += `${tag.emoji} ${label}  `;
          });
          responseContent += '\n\n';
        }

        // 显示奖励
        if (analysis.rewards.gold > 0 || analysis.rewards.growth > 0) {
          responseContent += `🎁 获得奖励：`;
          if (analysis.rewards.gold > 0) responseContent += `💰 ${analysis.rewards.gold} 金币  `;
          if (analysis.rewards.growth > 0) responseContent += `⭐ ${analysis.rewards.growth} 成长值`;
          responseContent += '\n\n';
        }

        responseContent += '📝 我已经轻轻帮你收进全景记忆栏啦\n\n';

        // 如果是成功或感恩日记，同步到日记模块
        if (analysis.type === 'success' || analysis.type === 'gratitude') {
          addJournal({
            type: analysis.type,
            content: message,
            tags: analysis.categories,
            rewards: analysis.rewards,
          });
          responseContent += `💫 我也顺手把它放进${analysis.type === 'success' ? '成功' : '感恩'}日记里啦\n\n`;
        }
      }
      
      // 处理任务创建和分解
      if (isTaskCreation) {
        // 如果需要分解且配置了AI，使用AI分解
        if (needsDecompose && hasAI) {
          try {
            addThinkingStep('🤖 调用AI进行任务分解...');
            
            // 增强提示词，包含动线优化和时长参考
            const enhancedPrompt = `${message}

请帮我把这段话分解成多个独立的任务，并注意：

1. **仔细识别每个独立的动作**，例如：
   - "洗漱" 是一个任务
   - "洗衣服" 是另一个任务
   - "吃饭" 是另一个任务
   - "收拾垃圾" 是另一个任务
   - 不要把多个动作合并成一个任务！

2. **识别每个任务的位置**（厕所、工作区、厨房、客厅、卧室、拍摄间）

3. **按照家里格局优化动线**：
   - 进门左手边是厕所，右手边是工作区
   - 往前走左手边是厨房，右手边是客厅
   - 从厨房楼梯上去左手边是卧室，右手边是拍摄间

4. **根据任务类型智能分配时长**：
   - 工作相关：60分钟起步
   - 打扫收拾：10分钟
   - 在家吃饭：30分钟
   - 外出吃饭：120分钟
   - 外出喝酒：240分钟
   - 上楼睡觉：5分钟
   - 吃药：2分钟
   - 洗漱：5-10分钟
   - 洗碗、倒猫粮、洗衣服等简单家务：5-15分钟

请返回JSON格式的任务数组，每个任务包含：
- title: 任务标题（简洁明确）
- duration: 时长（分钟）
- category: 类型（work/life/health等）
- priority: 优先级（high/medium/low）
- location: 位置（bathroom/workspace/kitchen/livingroom/bedroom/studio）

**重要**：一定要把每个独立的动作分解成单独的任务！`;

            addThinkingStep('⏳ AI正在智能分析任务...');
            
            console.log('🤖 [AI智能分析] 输入内容:', message);
            console.log('🤖 [AI智能分析] 当前时间:', new Date().toLocaleTimeString('zh-CN'));
            
            // 完全依赖AI智能分析，不使用机械化的代码
            const currentTime = new Date();
            const decomposeResult = await aiService.decomposeTask(message, currentTime);
            
            console.log('🤖 [AI返回] 任务数量:', decomposeResult.tasks?.length);
            
            if (decomposeResult.success && decomposeResult.tasks && decomposeResult.tasks.length > 0) {
              addThinkingStep(`✅ AI成功分解出 ${decomposeResult.tasks.length} 个任务`);
              
              // 完全使用AI返回的数据，正确解析时间
              const tasksWithMetadata: DecomposedTask[] = decomposeResult.tasks.map((task, index) => {
                // 创建今天的日期对象
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // 解析AI返回的时间字符串（格式：HH:MM）
                const [hours, minutes] = (task.startTime || '00:00').split(':').map(Number);
                
                // 创建完整的开始时间
                const startTime = new Date(today);
                startTime.setHours(hours, minutes, 0, 0);
                
                // 计算结束时间
                const endTime = new Date(startTime.getTime() + task.duration * 60000);
                
                console.log(`🤖 [任务${index + 1}] ${task.title}`);
                console.log(`   AI返回时间: ${task.startTime}`);
                console.log(`   解析后的完整时间: ${startTime.toLocaleString('zh-CN')}`);
                console.log(`   时长: ${task.duration}分钟`);
                console.log(`   结束时间: ${endTime.toLocaleString('zh-CN')}`);
                console.log(`   标签: ${task.tags?.join(', ') || '无'}`);
                console.log(`   位置: ${task.location || '未指定'}`);
                
                // 使用智能金币计算器
                const goldReward = task.goldReward || (() => {
                  // 如果AI没有返回金币，使用智能计算
                  const { smartCalculateGoldReward } = require('@/utils/goldCalculator');
                  return smartCalculateGoldReward(
                    task.duration,
                    task.category,
                    task.tags,
                    task.title
                  );
                })();
                
                console.log(`💰 [金币] ${task.title}: ${task.duration}分钟 = ${goldReward}金币`);
                
                return {
                  sequence: index + 1,
                  title: task.title,
                  description: task.title,
                  estimated_duration: task.duration,
                  scheduled_start: task.startTime || startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                  scheduled_end: endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                  scheduled_start_iso: startTime.toISOString(),
                  task_type: task.category || 'life',
                  category: task.category || '生活事务',
                  location: task.location || '未指定',
                  tags: task.tags || ['日常', '生活'],
                  goal: null,
                  gold: goldReward,
                  color: '#6A7334',
                  priority: task.priority || 'medium',
                };
              });
              
              addThinkingStep('🎯 正在匹配长期目标...');
              // 匹配目标
              if (goals.length > 0) {
                const matches = matchTaskToGoals(
                  { title: message, description: '' },
                  goals
                );
                if (matches.length > 0) {
                  addThinkingStep(`🎯 找到 ${matches.length} 个相关目标`);
                  // 自动关联第一个匹配的目标
                  if (matches[0]) {
                    tasksWithMetadata.forEach(task => {
                      task.goal = matches[0].goalName;
                    });
                  }
                }
              }

              addThinkingStep('✨ 任务分解完成！');

              if (!analysis.type) {
                responseContent += '我帮你顺了一下，拆成这几步会更轻松一点呀 ✨\n\n';
              } else {
                responseContent += '我也顺手帮你把这件事拆开啦，这样做起来会轻一点 ✨\n\n';
              }

              responseContent += `我先温柔地帮你排成 ${tasksWithMetadata.length} 个小任务：\n\n`;
              
              tasksWithMetadata.forEach((task, index) => {
                const parsedTitle = task.title || task.description || '';
                const splitIndex = Math.max(parsedTitle.indexOf('：'), parsedTitle.indexOf(':'));
                const cleanTitle = splitIndex > 0 ? parsedTitle.slice(0, splitIndex).trim() : parsedTitle.trim();
                const note = splitIndex > 0 ? parsedTitle.slice(splitIndex + 1).trim() : '';

                const priorityEmoji = getPriorityEmoji(task.priority);
                const locationEmoji = LOCATION_ICONS[task.location || ''] || '📍';
                
                responseContent += `${index + 1}. ${priorityEmoji} ${cleanTitle}\n`;
                responseContent += `   ${locationEmoji} ${task.location} · ⏱️ ${task.estimated_duration} 分钟 · 🕐 ${task.scheduled_start}\n`;
                if (task.tags.length > 0) {
                  responseContent += `   🏷️ ${task.tags.join('、')}\n`;
                }
                if (note) {
                  responseContent += `   💬 ${note}\n`;
                }
                responseContent += `\n`;
              });

              responseContent += '你点下面的任务编辑器，还可以继续慢慢微调时间、标签和目标呀，我会陪着你 🫶';

              const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: beautifyAssistantReply(responseContent),
                timestamp: new Date(),
                decomposedTasks: tasksWithMetadata,
                showTaskEditor: true,
                tags: aiTags,
                rewards: aiRewards,
                thinkingProcess: [...thinkingSteps],
                isThinkingExpanded: false,
              };
              
              setMessages(prev => [...prev, aiMessage]);
              
              console.log('🔍 [编辑器] 准备打开编辑器');
              console.log('🔍 [编辑器] 任务数量:', tasksWithMetadata.length);
              console.log('🔍 [编辑器] 任务列表:', tasksWithMetadata);
              
              // 打开新版编辑器
              setEditingTasks(tasksWithMetadata);
              setShowTaskEditor(true);
              
              console.log('🔍 [编辑器] showTaskEditor 已设置为 true');
              console.log('🔍 [编辑器] editingTasks 已设置');
              
              setIsProcessing(false);
              clearThinkingSteps();
              return;
            } else {
              console.log('❌ [AI分解] AI返回失败或没有任务');
              console.log('❌ [AI分解] decomposeResult:', decomposeResult);
              addThinkingStep(`❌ AI分解失败: ${decomposeResult.error || '未返回任务'}`);
            }
          } catch (error) {
            console.error('❌ [AI调试] AI任务分解失败:', error);
            addThinkingStep(`❌ AI分解失败，使用简单模式创建任务`);
            
            // AI失败后，降级到简单模式，仍然显示编辑器
            console.log('🔄 [降级] AI分解失败，使用简单模式');
          }
        }

        // 简单任务创建（不分解）- 也支持手动编辑
        // 或者 AI 分解失败后的降级方案
        console.log('🔄 [简单模式] 创建简单任务或AI分解失败降级');
        
        const matches = matchTaskToGoals(
          { title: message, description: '' },
          goals
        );
        
        if (!analysis.type) {
          responseContent += '这件事我先替你放进任务里啦，不急，我们一步一步来 ✅\n\n';
        } else {
          responseContent += '我也顺手把它记成一个待办啦，我们慢慢处理就好 ✅\n\n';
        }
        
        if (matches.length > 0) {
          responseContent += '顺便我发现，它和这些长期目标也有点连起来的感觉：\n\n';
          
          matches.forEach((match, index) => {
            const percentage = Math.round(match.confidence * 100);
            responseContent += `${index + 1}. 🎯 ${match.goalName}（${percentage}%）\n`;
            responseContent += `   ${match.reason}\n\n`;
          });
          
          responseContent += '等你做完以后，我也会更方便陪你把目标进度一点点串起来 🌱\n\n';
        }

        // 创建单个任务也支持编辑
        // 使用智能金币计算器
        const currentTime = new Date();
        const duration = 30; // 默认30分钟
        const endTime = new Date(currentTime.getTime() + duration * 60000);
        
        // 智能计算金币
        const { smartCalculateGoldReward } = require('@/utils/goldCalculator');
        const goldReward = smartCalculateGoldReward(duration, 'work', ['日常', '生活'], message);
        
        console.log(`💰 [金币] ${message}: ${duration}分钟 = ${goldReward}金币`);
        
        const singleTask: DecomposedTask = {
          sequence: 1,
          title: message,
          description: message,
          estimated_duration: duration,
          scheduled_start: currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          scheduled_end: endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          scheduled_start_iso: currentTime.toISOString(),
          task_type: 'work',
          category: '工作',
          location: '未指定',
          tags: ['日常', '生活'],
          goal: null,
          gold: goldReward,
          color: '#6A7334',
          priority: 'medium',
        };

        responseContent += '你点下面的任务编辑器，还能继续改时间、标签和目标，我已经先帮你铺好啦，剩下的我们慢慢来 ✨';

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: beautifyAssistantReply(responseContent),
          timestamp: new Date(),
          goalMatches: matches.map(m => ({
            goalId: m.goalId,
            goalName: m.goalName,
            confidence: m.confidence,
          })),
          decomposedTasks: [singleTask],
          showTaskEditor: true,
          tags: aiTags,
          rewards: aiRewards,
          thinkingProcess: [...thinkingSteps],
          isThinkingExpanded: false,
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        console.log('🔍 [简单模式] 准备打开编辑器');
        console.log('🔍 [简单模式] 任务:', singleTask);
        
        // 打开新版编辑器
        setEditingTasks([singleTask]);
        setShowTaskEditor(true);
        
        console.log('🔍 [简单模式] showTaskEditor 已设置为 true');
        console.log('🔍 [简单模式] editingTasks 已设置');
      } else if (analysis.type) {
        // 🎯 特殊处理碎碎念和心情记录（新增）
        if (analysis.type === 'mood' || analysis.type === 'thought') {
          try {
            addThinkingStep('💭 识别为碎碎念/心情记录...');
            
            // 使用碎碎念处理服务
            const mutterResult = await processMutter(message);
            
            addThinkingStep(`${mutterResult.moodEmoji} 心情: ${mutterResult.mood}`);
            addThinkingStep(`📂 分类: ${mutterResult.category}`);
            
            // 保存到记忆库
            addMemory({
              type: analysis.type,
              content: message,
              emotionTags: analysis.emotions,
              categoryTags: analysis.categories,
              rewards: analysis.rewards,
            });
            
            addThinkingStep('💾 已保存到记忆库');
            
            // 在时间轴创建醒目的碎碎念卡片
            const now = new Date();
            await createTask({
              title: mutterResult.cardTitle,
              description: mutterResult.cardDescription,
              taskType: 'life' as TaskType,
              priority: 2,
              durationMinutes: 1,
              scheduledStart: now,
              scheduledEnd: new Date(now.getTime() + 60000),
              tags: mutterResult.tags,
              color: mutterResult.cardColor,
              status: 'completed',
              isRecord: true,
            });
            
            addThinkingStep('📅 已在时间轴标记');
            
            // 显示AI的个性化回复
            const mutterResponseContent = `我已经把你的这点小心情收好了 🤍\n\n${mutterResult.moodEmoji} 心情：${mutterResult.mood}\n📂 分类：${mutterResult.category}\n🏷️ 标签：${mutterResult.tags.join('、')}\n\n────────\n\n${mutterResult.aiReply}`;
            
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: beautifyAssistantReply(mutterResponseContent),
              timestamp: new Date(),
              thinkingProcess: [...thinkingSteps],
              isThinkingExpanded: false,
            };
            
            setMessages(prev => [...prev, aiMessage]);
            
            // 保存到聊天记录
            addChatMessage({
              role: 'assistant',
              content: beautifyAssistantReply(mutterResponseContent),
              actions: [{
                type: 'add_memory',
                description: '记录碎碎念',
                data: { mood: mutterResult.mood, category: mutterResult.category },
              }],
            });
            
            // 清除超时定时器
            if (sendTimeoutRef.current) {
              clearTimeout(sendTimeoutRef.current);
              sendTimeoutRef.current = null;
            }
            
            setIsProcessing(false);
            clearThinkingSteps();
            return;
          } catch (error) {
            console.error('💭 [碎碎念处理] 处理失败:', error);
            // 如果处理失败，继续执行原有逻辑
          }
        }
        
        // 只是记录，不是任务（原有逻辑）
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: beautifyAssistantReply(responseContent),
          timestamp: new Date(),
          tags: aiTags,
          rewards: aiRewards,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // 普通对话
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: beautifyAssistantReply('收到啦，我在这儿陪你一起看着 💭\n\n你可以直接跟我说：\n• 心情、想法或者待办\n• “查看今天的任务”\n• 一串任务让我帮你拆分和排顺序\n\n比如：\n“5分钟后去洗漱，然后洗碗，倒猫粮，洗衣服，工作30分钟，收拾卧室、客厅和拍摄间”'),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('❌ [AI处理失败]', error);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: beautifyAssistantReply(`刚刚那一下我没有接稳你这条消息 😢\n\n${error instanceof Error ? error.message : '未知错误'}\n\n你可以试试：\n• 把内容说短一点\n• 分几次发给我\n• 刷新页面再试一次\n\n没关系，我还在，我们慢慢来。`),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      // 清除超时定时器
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
      setIsProcessing(false);
      clearThinkingSteps();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 全屏模式处理
  if (isFullScreen) {
    const selectedCount = messages.filter(m => m.isSelected).length;
    const fullScreenComposerHeight = isSelectionMode && selectedCount > 0 ? 92 : 188;
    const fullScreenBottomInset = fullScreenComposerHeight + 188;
    
    return (
      <div className="h-full flex flex-col bg-white relative">
        {/* 头部 */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPersonalitySettings(true)}
              className="text-2xl hover:scale-110 transition-transform"
              title="点击设置AI性格"
            >
              {personality.avatar}
            </button>
            <div>
              <div className="font-semibold text-gray-900">{personality.name}</div>
              <div className="text-xs text-gray-500">
                {isSelectionMode ? `已选择 ${selectedCount} 条` : '智能任务分析'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSelectionMode ? (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium"
                  title="全选/取消全选"
                >
                  {messages.filter(m => m.role === 'user').every(m => m.isSelected) ? '取消全选' : '全选'}
                </button>
                <button
                  onClick={() => {
                    setMessages(prev => prev.map(msg => ({ ...msg, isSelected: false })));
                    setIsSelectionMode(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 text-gray-700 text-sm font-medium"
                  title="取消选择模式"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="p-2 rounded-lg bg-neutral-100 active:bg-neutral-200"
                title="选择模式"
              >
                <CheckSquare className="w-5 h-5 text-gray-700" />
              </button>
            )}
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 rounded-lg bg-neutral-100 active:bg-neutral-200"
              title="AI配置"
            >
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={clearChatHistory}
              className="p-2 rounded-lg bg-neutral-100 hover:bg-red-100 active:bg-red-200"
              title="清除聊天记录"
            >
              <Trash2 className="w-5 h-5 text-gray-700 hover:text-red-600" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-neutral-100 active:bg-neutral-200"
                title="关闭"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* 对话区域 */}
        <div
          ref={conversationRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50"
          style={{ paddingBottom: `calc(${fullScreenBottomInset}px + env(safe-area-inset-bottom))` }}
        >
          {messages.map((message) => {
            const resolvedDecomposedTasks =
              message.decomposedTasks && message.decomposedTasks.length > 0
                ? message.decomposedTasks
                : message.role === 'assistant'
                ? parseDecomposedTasksFromContent(message.content)
                : [];

            return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* 选择框 - 只在用户消息且选择模式下显示 */}
              {message.role === 'user' && isSelectionMode && (
                <button
                  onClick={() => toggleMessageSelection(message.id)}
                  className="mr-2 mt-1 flex-shrink-0"
                >
                  {message.isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              )}
              
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                } ${message.isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* 显示AI思考过程 */}
                {message.role === 'assistant' && message.thinkingProcess && message.thinkingProcess.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => toggleThinkingExpanded(message.id)}
                      className="flex items-center space-x-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {message.isThinkingExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span>💭 AI思考过程 ({message.thinkingProcess.length} 步)</span>
                    </button>
                    
                    {message.isThinkingExpanded && (
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-blue-200">
                        {message.thinkingProcess.map((step, index) => (
                          <div key={index} className="text-xs flex items-start space-x-2 text-gray-600">
                            <span className="opacity-50">{index + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 显示用户消息的标签 */}
                {message.role === 'user' && message.tags && (message.tags.emotions.length > 0 || message.tags.categories.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-blue-500">
                    <div className="flex flex-wrap gap-1">
                      {message.tags.emotions.map(emotionId => {
                        const tag = EMOTION_TAGS.find(t => t.id === emotionId);
                        const label = TAG_LABELS[emotionId] || tag?.label || emotionId;
                        return tag ? (
                          <span key={emotionId} className="text-xs px-2 py-0.5 rounded-full bg-blue-500">
                            {tag.emoji} {label}
                          </span>
                        ) : null;
                      })}
                      {message.tags.categories.map(categoryId => {
                        const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
                        const label = TAG_LABELS[categoryId] || tag?.label || categoryId;
                        return tag ? (
                          <span key={categoryId} className="text-xs px-2 py-0.5 rounded-full bg-blue-500">
                            {tag.emoji} {label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* 显示奖励 */}
                {message.rewards && (message.rewards.gold > 0 || message.rewards.growth > 0) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-xs">
                      {message.rewards.gold > 0 && <span className="text-yellow-500">💰 +{message.rewards.gold}</span>}
                      {message.rewards.growth > 0 && <span className="text-green-500">⭐ +{message.rewards.growth}</span>}
                    </div>
                  </div>
                )}
                
                {/* 显示目标匹配结果 */}
                {message.goalMatches && message.goalMatches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-semibold mb-2 text-blue-600">🎯 关联的目标：</div>
                    <div className="space-y-2">
                      {message.goalMatches.map((match, index) => (
                        <div key={match.goalId} className="flex items-center justify-between p-2 rounded bg-gray-50">
                          <span className="text-xs font-medium text-gray-900">
                            {index + 1}. {match.goalName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                            {Math.round(match.confidence * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 显示分解的任务列表 */}
                {resolvedDecomposedTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-semibold mb-2 text-blue-600">📋 分解的任务：</div>
                    <div className="space-y-2">
                      {resolvedDecomposedTasks.map((task, index) => (
                        <div key={index} className="p-2 rounded text-xs bg-gray-50">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="mt-1 text-gray-600">
                            ⏱️ {task.estimated_duration}分钟
                            {task.scheduled_start && ` | 🕐 ${task.scheduled_start}`}
                            {task.location && ` | 📍 ${task.location}`}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 打开编辑器按钮 */}
                    <button
                      onClick={() => {
                        setEditingTasks(resolvedDecomposedTasks);
                        setShowTaskEditor(true);
                      }}
                      className="w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition-colors"
                    >
                      ✏️ 打开任务编辑器
                    </button>
                  </div>
                )}
                
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            );
          })}
          
          {/* 处理中状态 */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="shadow-md rounded-lg p-3 max-w-[85%] bg-white">
                <div className="flex items-center space-x-2 mb-2">
                  <Hourglass className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">AI正在思考...</span>
                </div>
                
                {thinkingSteps.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {thinkingSteps.map((step, index) => (
                      <div key={index} className="text-xs flex items-start space-x-2 text-gray-600 animate-fade-in">
                        <span className="opacity-50">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div
          className="fixed left-0 right-0 z-[1001] border-t border-neutral-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
          style={{ bottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* 快速指令或智能分配按钮 */}
          {isSelectionMode && selectedCount > 0 ? (
            <div className="px-3 py-3">
              <button
                onClick={handleSmartDistribute}
                disabled={isProcessing}
                className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                <span>智能分析并分配 ({selectedCount} 条)</span>
              </button>
            </div>
          ) : (
            <>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs whitespace-nowrap text-gray-500">快速：</span>
                  {[
                    { label: '帮我安排', icon: '🎯', action: 'smart_schedule', title: '学习你的习惯，智能推荐当前适合做的任务' },
                    { label: '关于收入', icon: '💰', action: 'income_mode', title: '记录副业收入，自动同步到副业追踪和时间轴' },
                    { label: '关于目标', icon: '🎯', action: 'goal_mode', title: '设置长期或短期目标，AI智能解析' },
                    { label: '任务分解', icon: '🧩', action: 'task_breakdown_mode', title: '把你接下来输入的内容当成要拆解的任务，并在完成后自动打开任务编辑器' },
                    { label: '下一步', icon: '🧭', action: 'next_step', title: '基于当前模块和联动焦点，告诉你现在最应该推进什么' },
                    { label: '心情碎碎念', icon: '💭', action: 'mutter_quick', title: '快速记录心情碎碎念' },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => {
                        if (cmd.action === 'smart_schedule') {
                          handleSend(`结合当前页面场景帮我安排下一步。\n${scenePrompt}`);
                        } else if (cmd.action === 'income_mode') {
                          setContextMode('income');
                          const modeMessage: Message = {
                            id: `ai-${Date.now()}`,
                            role: 'assistant',
                            content: '💰 **收入记录模式已开启**\n\n现在你可以直接输入收入相关的信息，例如：\n\n• "今天画插画赚了2000块钱"\n• "接了个设计单，收入5000元"\n• "副业收入3000"\n\n我会自动：\n✅ 提取金额和描述\n✅ 保存到副业追踪器\n✅ 在时间轴标记收入时间点\n\n💡 输入完成后会自动退出此模式',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, modeMessage]);
                        } else if (cmd.action === 'goal_mode') {
                          openGoalIntakeMode();
                        } else if (cmd.action === 'task_breakdown_mode') {
                          setContextMode('task_breakdown');
                          const modeMessage: Message = {
                            id: `ai-${Date.now()}`,
                            role: 'assistant',
                            content: '🧩 **任务分解模式已开启**\n\n你接下来发给我的内容，我都会当成要拆开的任务文案。\n\n比如你可以直接说：\n\n• "把明天直播前准备的事情拆一下"\n• "我要做一个新页面，帮我拆成执行步骤"\n• "把这周副业推进计划分解一下"\n\n我拆完之后会直接帮你打开任务编辑器，你只要顺手改一改就能保存。',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, modeMessage]);
                        } else if (cmd.action === 'next_step') {
                          handleSend(`请基于当前联动焦点，直接告诉我现在最该推进的下一步，并说明为什么。\n${scenePrompt}`);
                        } else if (cmd.action === 'mutter_quick') {
                          const now = new Date();
                          const mutterContent = `心情记录 ${now.toLocaleString('zh-CN')}`;

                          addMemory({
                            type: 'mutter',
                            content: mutterContent,
                            mood: '记录',
                            tags: ['碎碎念', '心情'],
                            date: now,
                          });

                          createTask({
                            title: `💭💕 心情碎碎念`,
                            description: `📝 ${mutterContent}\n\n💕 心情备注：点击编辑添加你的心情\n⏰ 记录时间：${now.toLocaleString('zh-CN')}`,
                            taskType: 'life' as TaskType,
                            priority: 2,
                            durationMinutes: 1,
                            scheduledStart: now,
                            scheduledEnd: new Date(now.getTime() + 60000),
                            tags: ['💭碎碎念', '💕心情'],
                            color: '#FFB6C1',
                            status: 'completed',
                            isRecord: true,
                          });

                          notificationService.success('💭 心情碎碎念已记录到时间轴！');
                        }
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap hover:scale-105 ${
                        contextMode === 'income' && cmd.action === 'income_mode' ? 'bg-green-500 text-white' :
                        contextMode === 'goal' && cmd.action === 'goal_mode' ? 'bg-blue-500 text-white' :
                        contextMode === 'task_breakdown' && cmd.action === 'task_breakdown_mode' ? 'bg-violet-500 text-white' :
                        'bg-neutral-100 text-gray-700 active:bg-neutral-200'
                      }`}
                      title={cmd.title}
                    >
                      {cmd.icon} {cmd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 输入区域 */}
              <div className="px-3 pb-[calc(8px+env(safe-area-inset-bottom))]">
                <div className="flex items-end space-x-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      contextMode === 'goal'
                        ? '继续告诉我目标信息，比如每天投入多久、关键结果是什么...'
                        : contextMode === 'task_breakdown'
                          ? '把你想拆开的任务直接发给我...'
                          : contextMode === 'income'
                            ? '直接输入收入内容，比如今天接单赚了 500...'
                            : contextMode === 'mutter'
                              ? '把此刻想说的碎碎念发给我...'
                              : '对我说点什么...'
                    }
                    className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none text-sm border border-gray-300 focus:border-blue-500 overflow-y-auto bg-white"
                    style={{
                      minHeight: '40px',
                      maxHeight: '120px',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isProcessing}
                    className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title={isProcessing ? 'AI正在思考...' : '发送消息'}
                  >
                    {isProcessing ? <Hourglass className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI配置弹窗 */}
        <AIConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
        
        {/* AI性格设置弹窗 */}
        <AIPersonalitySettings isOpen={showPersonalitySettings} onClose={() => setShowPersonalitySettings(false)} />
        
        {/* 新版任务编辑器 - 全屏模式也需要 */}
        {showTaskEditor && editingTasks.length > 0 && (
          <UnifiedTaskEditor
            tasks={editingTasks}
            onClose={() => {
              setShowTaskEditor(false);
              setEditingTasks([]);
            }}
            onConfirm={handlePushToTimeline}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* 语音控制按钮 - 只在时间轴显示，在AI按钮上方 */}
      {currentModule === 'timeline' && (
        <button
          onClick={() => {
            setIsVoiceControlOpen(!isVoiceControlOpen);
            if (!isVoiceControlOpen) {
              setIsVoiceListening(true);
            } else {
              setIsVoiceListening(false);
            }
          }}
          className="fixed w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
          style={{ 
            backgroundColor: isVoiceListening ? '#10B981' : '#8B5CF6',
            color: '#ffffff',
            zIndex: 99999,
            bottom: '168px', // 在AI按钮上方
            right: '16px',
          }}
          title={isVoiceListening ? "免手模式开启中" : "点击开启免手模式"}
        >
          {isVoiceListening ? (
            <Volume2 className="w-8 h-8" />
          ) : (
            <VolumeX className="w-8 h-8" />
          )}
        </button>
      )}

      {/* AI助手浮动按钮 - 只在时间轴显示，黄色底色+白色图标 */}
      {!isOpen && currentModule === 'timeline' && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
          style={{ 
            backgroundColor: '#E8C259',
            color: '#ffffff',
            zIndex: 99999,
            bottom: '88px', // 在语音按钮下方
            right: '16px',
          }}
          title="AI助手"
        >
          <span className="text-3xl">🤖</span>
        </button>
      )}

      {/* 聊天窗口 - 改为绝对定位，跟随页面滚动 */}
      {isOpen && (
        <div
          ref={chatRef}
          className="absolute rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: isMinimized ? '320px' : `${size.width}px`,
            height: isMinimized ? '60px' : `${size.height}px`,
            zIndex: 1000,
            cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'default',
            backgroundColor: bgColor,
          }}
          onClick={() => setShowColorPicker(false)}
        >
          {/* 原有的浮动窗口内容 */}
          {/* 头部 - 可拖拽 */}
          <div
            className="px-4 py-3 flex items-center justify-between cursor-move"
            style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 opacity-50" />
              <button
                onClick={() => setShowPersonalitySettings(true)}
                className="text-2xl hover:scale-110 transition-transform"
                title="点击设置AI性格"
              >
                {personality.avatar}
              </button>
              <div>
                <div className="font-semibold" style={{ color: theme.textColor }}>{personality.name}</div>
                <div className="text-xs" style={{ color: theme.accentColor }}>智能任务分析</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 颜色选择器 */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="p-1 rounded transition-colors"
                  style={{ backgroundColor: theme.buttonBg }}
                  title="修改颜色"
                >
                  <span className="text-sm">🎨</span>
                </button>

                {showColorPicker && (
                  <div 
                    className="absolute right-0 top-8 rounded-lg shadow-xl p-4 z-50 border"
                    style={{ 
                      backgroundColor: theme.bgColor,
                      borderColor: theme.borderColor,
                      minWidth: '200px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-xs mb-2" style={{ color: theme.accentColor }}>选择背景颜色</div>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfigModal(true);
                }}
                className="p-1 rounded transition-colors"
                style={{ backgroundColor: theme.buttonBg }}
                title="AI配置"
              >
                <Settings className="w-4 h-4" style={{ color: theme.textColor }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearChatHistory();
                }}
                className="p-1 rounded transition-colors hover:bg-red-100"
                style={{ backgroundColor: theme.buttonBg }}
                title="清除聊天记录"
              >
                <Trash2 className="w-4 h-4" style={{ color: theme.textColor }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1 rounded transition-colors"
                style={{ backgroundColor: theme.buttonBg }}
                title={isMinimized ? "展开" : "最小化"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" style={{ color: theme.textColor }} /> : <Minimize2 className="w-4 h-4" style={{ color: theme.textColor }} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1 rounded transition-colors"
                style={{ backgroundColor: theme.buttonBg }}
                title="关闭"
              >
                <X className="w-4 h-4" style={{ color: theme.textColor }} />
              </button>
            </div>
          </div>

          {/* 聊天内容 - 只在非最小化时显示 */}
          {!isMinimized && (
            <>
              {/* 对话区域 */}
              <div ref={conversationRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: theme.cardBg }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[85%] rounded-lg p-3"
                      style={{
                        backgroundColor: message.role === 'user' 
                          ? (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                          : (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'),
                        color: theme.textColor,
                        boxShadow: message.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      
                      {/* 显示AI思考过程 */}
                      {message.role === 'assistant' && message.thinkingProcess && message.thinkingProcess.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                          <button
                            onClick={() => toggleThinkingExpanded(message.id)}
                            className="flex items-center space-x-2 text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ color: theme.accentColor }}
                          >
                            {message.isThinkingExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span>💭 AI思考过程 ({message.thinkingProcess.length} 步)</span>
                          </button>
                          
                          {message.isThinkingExpanded && (
                            <div className="mt-2 space-y-1 pl-2 border-l-2" style={{ borderColor: theme.borderColor }}>
                              {message.thinkingProcess.map((step, index) => (
                                <div 
                                  key={index} 
                                  className="text-xs flex items-start space-x-2"
                                  style={{ color: theme.accentColor }}
                                >
                                  <span className="opacity-50">{index + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 显示用户消息的标签 */}
                      {message.role === 'user' && message.tags && (message.tags.emotions.length > 0 || message.tags.categories.length > 0) && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.borderColor }}>
                          <div className="flex flex-wrap gap-1">
                            {message.tags.emotions.map(emotionId => {
                              const tag = EMOTION_TAGS.find(t => t.id === emotionId);
                              const label = TAG_LABELS[emotionId] || tag?.label || emotionId;
                              return tag ? (
                                <span
                                  key={emotionId}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                                >
                                  {tag.emoji} {label}
                                </span>
                              ) : null;
                            })}
                            {message.tags.categories.map(categoryId => {
                              const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
                              const label = TAG_LABELS[categoryId] || tag?.label || categoryId;
                              return tag ? (
                                <span
                                  key={categoryId}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                                >
                                  {tag.emoji} {label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* 显示奖励 */}
                      {message.rewards && (message.rewards.gold > 0 || message.rewards.growth > 0) && (
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.borderColor }}>
                          <div className="flex items-center space-x-2 text-xs">
                            {message.rewards.gold > 0 && (
                              <span style={{ color: '#fbbf24' }}>
                                💰 +{message.rewards.gold}
                              </span>
                            )}
                            {message.rewards.growth > 0 && (
                              <span style={{ color: '#4ade80' }}>
                                ⭐ +{message.rewards.growth}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 显示目标匹配结果 */}
                      {message.goalMatches && message.goalMatches.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: theme.accentColor }}>
                            🎯 关联的目标：
                          </div>
                          <div className="space-y-2">
                            {message.goalMatches.map((match, index) => (
                              <div
                                key={match.goalId}
                                className="flex items-center justify-between p-2 rounded"
                                style={{ backgroundColor: theme.cardBg }}
                              >
                                <span className="text-xs font-medium" style={{ color: theme.textColor }}>
                                  {index + 1}. {match.goalName}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#4ade80', color: '#ffffff' }}>
                                  {Math.round(match.confidence * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 显示分解的任务列表 */}
                      {message.decomposedTasks && message.decomposedTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                          <div className="text-xs font-semibold mb-2" style={{ color: theme.accentColor }}>
                            📋 分解的任务：
                          </div>
                          <div className="space-y-2">
                            {message.decomposedTasks.map((task, index) => (
                              <div
                                key={index}
                                className="p-2 rounded text-xs"
                                style={{ backgroundColor: theme.cardBg }}
                              >
                                <div className="font-medium" style={{ color: theme.textColor }}>{task.title}</div>
                                <div className="mt-1" style={{ color: theme.accentColor }}>
                                  ⏱️ {task.estimated_duration}分钟
                                  {task.scheduled_start && ` | 🕐 ${task.scheduled_start}`}
                                  {task.location && ` | 📍 ${task.location}`}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* 打开编辑器按钮 */}
                          <button
                            onClick={() => {
                              setEditingTasks(message.decomposedTasks || []);
                              setShowTaskEditor(true);
                            }}
                            className="w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium hover:scale-105 transition-all"
                            style={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}
                          >
                            ✏️ 打开编辑器
                          </button>
                        </div>
                      )}
                      
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 处理中状态 */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="shadow-md rounded-lg p-3 max-w-[85%]" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Hourglass className="w-4 h-4 animate-spin" style={{ color: theme.accentColor }} />
                        <span className="text-xs font-semibold" style={{ color: theme.accentColor }}>AI正在思考...</span>
                      </div>
                      
                      {/* 思考步骤 */}
                      {thinkingSteps.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {thinkingSteps.map((step, index) => (
                            <div 
                              key={index} 
                              className="text-xs flex items-start space-x-2 animate-fade-in"
                              style={{ 
                                color: theme.accentColor,
                                animationDelay: `${index * 100}ms`
                              }}
                            >
                              <span className="opacity-50">•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 当前模式提示 */}
              {contextMode !== 'normal' && !isProcessing && (
                <div className="px-3 pt-2">
                  <div
                    className="rounded-2xl px-3 py-2 text-xs font-medium"
                    style={{
                      backgroundColor: contextMode === 'goal'
                        ? 'rgba(59,130,246,0.12)'
                        : contextMode === 'task_breakdown'
                          ? 'rgba(139,92,246,0.12)'
                          : contextMode === 'income'
                            ? 'rgba(16,185,129,0.12)'
                            : 'rgba(236,72,153,0.12)',
                      color: contextMode === 'goal'
                        ? '#2563eb'
                        : contextMode === 'task_breakdown'
                          ? '#7c3aed'
                          : contextMode === 'income'
                            ? '#059669'
                            : '#db2777',
                    }}
                  >
                    {contextMode === 'goal' && '当前：目标收集模式｜你现在说的内容会被当成目标组件字段来追问和整理'}
                    {contextMode === 'task_breakdown' && '当前：任务分解模式｜你现在说的内容会被直接拆成任务并打开任务编辑器'}
                    {contextMode === 'income' && '当前：收入记录模式｜你现在说的内容会被记录为收入'}
                    {contextMode === 'mutter' && '当前：碎碎念模式｜你现在说的内容会被记录进记忆和时间轴'}
                  </div>
                </div>
              )}

              {/* 快速指令 */}
              <div className="px-3 py-2 border-t" style={{ backgroundColor: theme.bgColor, borderColor: theme.borderColor }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs whitespace-nowrap" style={{ color: theme.accentColor }}>快速：</span>
                  {[
                    { label: '帮我安排', icon: '🎯', action: 'smart_schedule', title: '学习你的习惯，智能推荐当前适合做的任务' },
                    { label: '关于收入', icon: '💰', action: 'income_mode', title: '记录副业收入，自动同步到副业追踪和时间轴' },
                    { label: '关于目标', icon: '🎯', action: 'goal_mode', title: '设置长期或短期目标，AI智能解析' },
                    { label: '任务分解', icon: '🧩', action: 'task_breakdown_mode', title: '把你接下来输入的内容当成要拆解的任务，并在完成后自动打开任务编辑器' },
                    { label: '心情碎碎念', icon: '💭', action: 'mutter_quick', title: '快速记录心情碎碎念' },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => {
                        if (cmd.action === 'smart_schedule') {
                          setInputValue('根据我的习惯和当前时间，帮我智能安排接下来要做的任务');
                          handleSend();
                        } else if (cmd.action === 'income_mode') {
                          setContextMode('income');
                          const modeMessage: Message = {
                            id: `ai-${Date.now()}`,
                            role: 'assistant',
                            content: '💰 **收入记录模式已开启**\n\n现在你可以直接输入收入相关的信息，例如：\n\n• "今天画插画赚了2000块钱"\n• "接了个设计单，收入5000元"\n• "副业收入3000"\n\n我会自动：\n✅ 提取金额和描述\n✅ 保存到副业追踪器\n✅ 在时间轴标记收入时间点\n\n💡 输入完成后会自动退出此模式',
                            timestamp: new Date(),
                          };
                          setMessages(prev => [...prev, modeMessage]);
                        } else if (cmd.action === 'goal_mode') {
                          openGoalIntakeMode();
                        } else if (cmd.action === 'task_breakdown_mode') {
                          openTaskBreakdownMode();
                        } else if (cmd.action === 'mutter_quick') {
                          // 快速添加心情碎碎念记录
                          const now = new Date();
                          const mutterContent = `心情记录 ${now.toLocaleString('zh-CN')}`;
                          
                          // 保存到记忆库
                          addMemory({
                            type: 'mutter',
                            content: mutterContent,
                            mood: '记录',
                            tags: ['碎碎念', '心情'],
                            date: now,
                          });
                          
                          // 在时间轴创建粉红色卡片
                          createTask({
                            title: `💭💕 心情碎碎念`,
                            description: `📝 ${mutterContent}\n\n💕 心情备注：点击编辑添加你的心情\n⏰ 记录时间：${now.toLocaleString('zh-CN')}`,
                            taskType: 'life' as TaskType,
                            priority: 2,
                            durationMinutes: 1,
                            scheduledStart: now,
                            scheduledEnd: new Date(now.getTime() + 60000),
                            tags: ['💭碎碎念', '💕心情'],
                            color: '#FFB6C1', // 粉红色
                            status: 'completed',
                            isRecord: true,
                          });
                          
                          // 显示提示消息
                          notificationService.success('💭 心情碎碎念已记录到时间轴！');
                        }
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap hover:scale-105`}
                      style={{ 
                        backgroundColor: contextMode === 'income' && cmd.action === 'income_mode' ? '#10b981' :
                                       contextMode === 'goal' && cmd.action === 'goal_mode' ? '#3b82f6' :
                                       contextMode === 'task_breakdown' && cmd.action === 'task_breakdown_mode' ? '#8b5cf6' :
                                       theme.buttonBg, 
                        color: contextMode === 'income' && cmd.action === 'income_mode' ? '#ffffff' :
                               contextMode === 'goal' && cmd.action === 'goal_mode' ? '#ffffff' :
                               contextMode === 'task_breakdown' && cmd.action === 'task_breakdown_mode' ? '#ffffff' :
                               theme.textColor 
                      }}
                      title={cmd.title}
                    >
                      {cmd.icon} {cmd.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 输入区域 */}
              <div className="p-3 border-t" style={{ backgroundColor: theme.bgColor, borderColor: theme.borderColor }}>
                <div className="flex items-end space-x-2">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="对我说点什么..."
                    className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none text-sm border overflow-y-auto"
                    style={{
                      backgroundColor: theme.cardBg,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                      minHeight: '40px',
                      maxHeight: '200px',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isProcessing}
                    className="p-2 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}
                    title={isProcessing ? "AI正在思考..." : "发送消息"}
                  >
                    {isProcessing ? (
                      <Hourglass className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 缩放手柄 - 右下角 */}
              {!isMinimized && (
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                  onMouseDown={handleResizeStart}
                  style={{
                    background: `linear-gradient(135deg, transparent 50%, ${theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 50%)`,
                  }}
                  title="拖拽缩放"
                />
              )}
            </>
          )}
        </div>
      )}

      {/* AI配置弹窗 */}
      <AIConfigModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
      />
      
      {/* AI性格设置弹窗 */}
      <AIPersonalitySettings 
        isOpen={showPersonalitySettings} 
        onClose={() => setShowPersonalitySettings(false)} 
      />
      
      {/* 新版任务编辑器 - 非全屏模式 */}
      {showTaskEditor && editingTasks.length > 0 && (
        <UnifiedTaskEditor
          tasks={editingTasks}
          onClose={() => {
            console.log('🔍 [编辑器] 关闭编辑器');
            setShowTaskEditor(false);
            setEditingTasks([]);
          }}
          onConfirm={handlePushToTimeline}
        />
      )}

      {/* 目标编辑器 */}
      {showGoalEditor && goalEditorDraft && (
        <GoalForm
          initialData={goalEditorDraft}
          dimensions={[
            { id: 'growth', name: '成长', icon: '🌱', color: '#34C759' },
            { id: 'career', name: '事业', icon: '💼', color: '#0A84FF' },
            { id: 'health', name: '健康', icon: '💪', color: '#FF9F0A' },
            { id: 'creation', name: '创作', icon: '🎨', color: '#BF5AF2' },
          ]}
          onSave={handleGoalEditorSave}
          onCancel={() => {
            setShowGoalEditor(false);
            setGoalEditorDraft(null);
            setGoalEditorGoalId(null);
            setGoalConversation(null);
            setContextMode('normal');
          }}
          bgColor={bgColor}
        />
      )}

      {/* 语音控制组件 */}
      <VoiceControl 
        isOpen={isVoiceControlOpen} 
        onClose={() => setIsVoiceControlOpen(false)} 
      />
    </>
  );
}

