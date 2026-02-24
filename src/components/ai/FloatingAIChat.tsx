import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, GripVertical, Settings, Hourglass, ChevronDown, ChevronUp, CheckSquare, Square, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { matchTaskToGoals, generateGoalSuggestionMessage } from '@/services/aiGoalMatcher';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import VoiceControl from '@/components/voice/VoiceControl';
import { notificationService } from '@/services/notificationService';

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
import { aiService } from '@/services/aiService';
import { useTaskStore } from '@/stores/taskStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import type { TaskType, TaskPriority } from '@/types';
import AIConfigModal from './AIConfigModal';
import UnifiedTaskEditor from '@/components/shared/UnifiedTaskEditor';
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
  // 任务分解相关
  decomposedTasks?: DecomposedTask[];
  // 等待用户确认的操作
  pendingAction?: {
    type: 'create_tasks' | 'update_task' | 'query_tasks';
    data: any;
  };
  // 是否显示任务编辑器
  showTaskEditor?: boolean;
  // AI思考过程
  thinkingProcess?: string[];
  // 思考过程是否展开
  isThinkingExpanded?: boolean;
  // 是否被选中（用于批量处理）
  isSelected?: boolean;
}

export default function FloatingAIChat({ isFullScreen = false, onClose, currentModule = 'timeline' }: FloatingAIChatProps = {}) {
  const { addMemory, addJournal } = useMemoryStore();
  const { isConfigured } = useAIStore();
  const { createTask, updateTask, deleteTask, tasks, getTodayTasks } = useTaskStore();
  const { createSideHustle } = useSideHustleStore();
  
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的AI助手，我能帮你：\n\n• 📅 智能分解任务和安排时间\n• 💰 自动分配金币和成长值\n• 🏷️ 自动打标签分类（AI智能理解）\n• 🕒 直接创建和修改时间轴任务\n• 🎯 智能关联长期目标\n• 📝 记录心情、想法、感恩、成功\n• 💡 收集创业想法到副业追踪器\n• 🔍 查询任务进度和统计\n• 🏠 智能动线优化（根据家里格局排序）\n• ✨ 万能收集：支持批量智能分析并分配\n• 🗑️ 时间轴操作：删除任务、移动任务\n\n**时间轴操作示例**：\n• "删除今天的任务"\n• "删除昨天的任务"\n• "删除今天下午2点之后的任务"\n• "把16号的任务挪到15号"\n\n直接输入文字开始对话吧！',
      timestamp: new Date(),
    }
  ]);
  
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

  // 监控编辑器状态变化
  useEffect(() => {
    console.log('🔍 [编辑器状态] showTaskEditor:', showTaskEditor);
    console.log('🔍 [编辑器状态] editingTasks.length:', editingTasks.length);
    console.log('🔍 [编辑器状态] 是否应该显示编辑器:', showTaskEditor && editingTasks.length > 0);
  }, [showTaskEditor, editingTasks]);

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
        });
        createdTasks.push(task);
      }

      // 显示成功消息
      const successMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `✅ 太棒了！已成功推送 ${createdTasks.length} 个任务到时间轴！\n\n📅 你可以在时间轴模块查看和管理这些任务。\n💡 完成任务后记得标记完成，可以获得金币和成长值哦！`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
      
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

  // 发送消息
  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isProcessing) return;

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

    // 添加超时保护（30秒）
    sendTimeoutRef.current = setTimeout(() => {
      console.error('⚠️ [发送超时] 处理时间超过30秒');
      setIsProcessing(false);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '❌ 抱歉，处理时间过长，请尝试：\n\n1. 减少输入内容的长度\n2. 分批次输入任务\n3. 检查网络连接\n\n如果问题持续，请刷新页面重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }, 30000);

    try {
      // 检查是否是时间轴操作指令（修复：仅匹配明确的操作意图，避免误判长文本）
      const isTimelineOp = /^(删除|清空).*(任务|今天|昨天|明天)/.test(message) ||
                           /(把|将)\s*\d+号.*?(挪到|移到|改到|调到)/.test(message);
      if (isTimelineOp) {
        const handled = await handleTimelineOperation(message);
        if (sendTimeoutRef.current) clearTimeout(sendTimeoutRef.current);
        setIsProcessing(false);
        if (handled !== false) return;
      }

      // 检查是否是查询任务的请求
      if (/查看|查询|今天|任务列表|进度|完成情况/.test(message)) {
        try {
          const todayTasks = getTodayTasks();
          const completedTasks = todayTasks.filter(t => t.status === 'completed');
          
          let responseContent = `📊 **今日任务概览**\n\n`;
          responseContent += `✅ 已完成：${completedTasks.length}/${todayTasks.length}\n`;
          responseContent += `⏱️ 总时长：${todayTasks.reduce((sum, t) => sum + t.durationMinutes, 0)} 分钟\n\n`;

          if (todayTasks.length === 0) {
            responseContent += '💡 今天还没有安排任务哦！\n\n';
            responseContent += '你可以告诉我你想做什么，我来帮你创建任务～';
          } else {
            responseContent += '**任务列表**：\n';
            todayTasks.forEach((task, index) => {
              const statusEmoji = task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '⏳' : '⏸️';
              responseContent += `${index + 1}. ${statusEmoji} ${task.title} (${task.durationMinutes}分钟)\n`;
            });
          }

          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: responseContent,
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
      
      // 检测是否是任务创建/分解请求
      const isTaskCreation = /创建|添加|新建|安排|计划|做|完成|学习|工作|运动|分解|拆解|洗漱|洗碗|猫粮|洗衣服|收拾|吃饭|垃圾|分钟后|小时后|之后/.test(message);
      const needsDecompose = /分解|拆解|详细安排|具体步骤/.test(message) || message.length > 10 || /然后|接着|再|之后|，|、/.test(message);
      
      console.log('🔍 [任务检测] 输入:', message);
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

        responseContent += `✨ 已识别为：**${typeNames[analysis.type]}**`;
        
        // 显示识别方式
        if (analysis.isAI) {
          responseContent += ` (AI智能识别，置信度 ${Math.round(analysis.confidence * 100)}%)\n\n`;
        } else {
          responseContent += ` (关键词匹配)\n\n`;
          responseContent += `💡 提示：配置API Key后可使用AI智能识别，更准确！\n\n`;
        }

        // 显示情绪标签
        if (analysis.emotions.length > 0) {
          responseContent += '🏷️ **情绪标签**：';
          analysis.emotions.forEach(emotionId => {
            const tag = EMOTION_TAGS.find(t => t.id === emotionId);
            const label = TAG_LABELS[emotionId] || tag?.label || emotionId;
            if (tag) responseContent += `${tag.emoji} ${label}  `;
          });
          responseContent += '\n\n';
        }

        // 显示分类标签
        if (analysis.categories.length > 0) {
          responseContent += '📂 **分类标签**：';
          analysis.categories.forEach(categoryId => {
            const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
            const label = TAG_LABELS[categoryId] || tag?.label || categoryId;
            if (tag) responseContent += `${tag.emoji} ${label}  `;
          });
          responseContent += '\n\n';
        }

        // 显示奖励
        if (analysis.rewards.gold > 0 || analysis.rewards.growth > 0) {
          responseContent += `🎁 **获得奖励**：`;
          if (analysis.rewards.gold > 0) responseContent += `💰 ${analysis.rewards.gold} 金币  `;
          if (analysis.rewards.growth > 0) responseContent += `⭐ ${analysis.rewards.growth} 成长值`;
          responseContent += '\n\n';
        }

        responseContent += '📝 已自动保存到全景记忆栏！\n\n';

        // 如果是成功或感恩日记，同步到日记模块
        if (analysis.type === 'success' || analysis.type === 'gratitude') {
          addJournal({
            type: analysis.type,
            content: message,
            tags: analysis.categories,
            rewards: analysis.rewards,
          });
          responseContent += `💫 同时已同步到${analysis.type === 'success' ? '成功' : '感恩'}日记模块！\n\n`;
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
                responseContent += '🤖 **AI智能任务分解**\n\n';
              } else {
                responseContent += '---\n\n🤖 **同时帮你分解了任务**\n\n';
              }

              responseContent += `AI帮你智能分解了 ${tasksWithMetadata.length} 个任务：\n\n`;
              
              tasksWithMetadata.forEach((task, index) => {
                const priorityEmoji = getPriorityEmoji(task.priority);
                const locationEmoji = LOCATION_ICONS[task.location || ''] || '📍';
                
                responseContent += `${index + 1}. ${priorityEmoji} **${task.title}**\n`;
                responseContent += `   ${locationEmoji} ${task.location} | ⏱️ ${task.estimated_duration} 分钟 | 🕐 ${task.scheduled_start}\n`;
                responseContent += `   🏷️ ${task.tags.join(', ')}\n\n`;
              });

              responseContent += '💡 点击下方按钮打开编辑器，可以调整任务、添加标签和关联目标！';

              const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: responseContent,
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
          responseContent += '✅ 好的！我来帮你创建任务...\n\n';
        } else {
          responseContent += '---\n\n✅ **同时创建为待办任务**\n\n';
        }
        
        if (matches.length > 0) {
          responseContent += '🎯 **智能目标关联**\n';
          responseContent += '我发现这个任务可以关联到以下长期目标：\n\n';
          
          matches.forEach((match, index) => {
            const percentage = Math.round(match.confidence * 100);
            const bars = '█'.repeat(Math.floor(percentage / 10));
            responseContent += `${index + 1}. **${match.goalName}** (${percentage}%)\n`;
            responseContent += `   ${bars} ${match.reason}\n\n`;
          });
          
          responseContent += '💡 完成这个任务将自动更新相关目标的进度！\n\n';
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

        responseContent += '💡 点击下方按钮打开编辑器，可以调整任务、添加标签和关联目标！';

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: responseContent,
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
        // 只是记录，不是任务
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: responseContent,
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
          content: '收到！我正在处理你的请求...\n\n💡 提示：你可以：\n• 直接输入心情、想法或待办事项\n• 说"查看今天的任务"查询进度\n• 描述一串任务让我帮你分解和优化动线\n• 例如："5分钟后去洗漱，然后洗碗，倒猫粮，洗衣服，工作30分钟，收拾卧室、客厅和拍摄间"',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('❌ [AI处理失败]', error);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `❌ 抱歉，处理请求时出现了问题：\n\n${error instanceof Error ? error.message : '未知错误'}\n\n💡 建议：\n• 检查输入内容是否过长\n• 尝试分批次输入\n• 刷新页面重试`,
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
    
    return (
      <div className="h-full flex flex-col bg-white">
        {/* 头部 */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 bg-white">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="font-semibold text-gray-900">AI助手</div>
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
        <div ref={conversationRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
          {messages.map((message) => (
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
                {message.decomposedTasks && message.decomposedTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-semibold mb-2 text-blue-600">📋 分解的任务：</div>
                    <div className="space-y-2">
                      {message.decomposedTasks.map((task, index) => (
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
                        setEditingTasks(message.decomposedTasks || []);
                        setShowTaskEditor(true);
                      }}
                      className="w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition-colors"
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

        {/* 快速指令或智能分配按钮 */}
        {isSelectionMode && selectedCount > 0 ? (
          <div className="px-3 py-3 border-t border-neutral-200 bg-white">
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
          <div className="px-3 py-2 border-t border-neutral-200 bg-white">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-xs whitespace-nowrap text-gray-500">快速：</span>
              {[
                { label: '帮我安排', icon: '🎯', action: 'smart_schedule' },
                { label: '推荐任务', icon: '💡', action: 'recommend_task' },
                { label: '优化时间', icon: '⚡', action: 'optimize_time' },
                { label: '查看进度', icon: '📊', action: 'check_progress' },
              ].map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => {
                    if (cmd.action === 'smart_schedule') {
                      setInputValue('根据我的习惯和当前时间，帮我智能安排接下来要做的任务');
                    } else if (cmd.action === 'recommend_task') {
                      setInputValue('根据我现在的状态和时间，推荐几个适合现在做的任务');
                    } else if (cmd.action === 'optimize_time') {
                      setInputValue('帮我优化今天的任务安排，让时间利用更高效');
                    } else if (cmd.action === 'check_progress') {
                      setInputValue('查看今天的任务');
                    }
                    handleSend();
                  }}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-gray-700 active:bg-neutral-200 whitespace-nowrap"
                >
                  {cmd.icon} {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-3 border-t border-neutral-200 bg-white pb-safe">
          {!isSelectionMode && (
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="对我说点什么..."
                className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none text-sm border border-gray-300 focus:border-blue-500 overflow-y-auto"
                style={{
                  minHeight: '40px',
                  maxHeight: '200px',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                title={isProcessing ? "AI正在思考..." : "发送消息"}
              >
                {isProcessing ? <Hourglass className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* AI配置弹窗 */}
        <AIConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
        
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
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold" style={{ color: theme.textColor }}>AI助手</div>
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
                      {message.decomposedTasks && message.decomposedTasks.length > 0 && !message.showTaskEditor && (
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

              {/* 快速指令 */}
              <div className="px-3 py-2 border-t" style={{ backgroundColor: theme.bgColor, borderColor: theme.borderColor }}>
                <div className="flex items-center space-x-2 overflow-x-auto">
                  <span className="text-xs whitespace-nowrap" style={{ color: theme.accentColor }}>快速：</span>
                  {[
                    { label: '帮我安排', icon: '🎯', action: 'smart_schedule' },
                    { label: '推荐任务', icon: '💡', action: 'recommend_task' },
                    { label: '优化时间', icon: '⚡', action: 'optimize_time' },
                    { label: '查看进度', icon: '📊', action: 'check_progress' },
                  ].map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => {
                        if (cmd.action === 'smart_schedule') {
                          setInputValue('根据我的习惯和当前时间，帮我智能安排接下来要做的任务');
                        } else if (cmd.action === 'recommend_task') {
                          setInputValue('根据我现在的状态和时间，推荐几个适合现在做的任务');
                        } else if (cmd.action === 'optimize_time') {
                          setInputValue('帮我优化今天的任务安排，让时间利用更高效');
                        } else if (cmd.action === 'check_progress') {
                          setInputValue('查看今天的任务');
                        }
                        handleSend();
                      }}
                      className="px-2 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap hover:scale-105"
                      style={{ backgroundColor: theme.buttonBg, color: theme.textColor }}
                      title={
                        cmd.action === 'smart_schedule' ? '学习你的习惯，智能推荐当前适合做的任务' :
                        cmd.action === 'recommend_task' ? '根据时间和状态推荐任务' :
                        cmd.action === 'optimize_time' ? '优化任务安排，提高效率' :
                        '查看今日任务进度'
                      }
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

      {/* 语音控制组件 */}
      <VoiceControl 
        isOpen={isVoiceControlOpen} 
        onClose={() => setIsVoiceControlOpen(false)} 
      />
    </>
  );
}

