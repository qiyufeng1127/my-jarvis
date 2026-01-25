import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, GripVertical, Settings, Hourglass, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoalStore } from '@/stores/goalStore';
import { matchTaskToGoals, generateGoalSuggestionMessage } from '@/services/aiGoalMatcher';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';
import { useAIStore } from '@/stores/aiStore';
import { aiService } from '@/services/aiService';
import { useTaskStore } from '@/stores/taskStore';
import type { TaskType, TaskPriority } from '@/types';
import AIConfigModal from './AIConfigModal';
import { 
  useLocalStorage, 
  useColorTheme, 
  useDraggable, 
  useResizable, 
  useTaskEditor,
  useThinkingProcess 
} from '@/hooks';
import {
  detectTaskLocation,
  detectTaskDuration,
  optimizeTasksByLocation,
  parseStartTime,
  getPriorityEmoji,
  LOCATION_NAMES,
  LOCATION_ICONS,
} from '@/utils/taskUtils';

interface DecomposedTask {
  id: string;
  title: string;
  duration: number;
  startTime?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  location?: string; // 任务位置（厕所、工作区、厨房、客厅、卧室、拍摄间）
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
}

export default function FloatingAIChat() {
  const { addMemory } = useMemoryStore();
  const { isConfigured } = useAIStore();
  const { createTask, updateTask, tasks, getTodayTasks } = useTaskStore();
  
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的AI助手，我能帮你：\n\n• 📅 智能分解任务和安排时间\n• 💰 自动分配金币和成长值\n• 🏷️ 自动打标签分类（AI智能理解）\n• 🕒 直接创建和修改时间轴任务\n• 🎯 智能关联长期目标\n• 📝 记录心情和碎碎念\n• 🔍 查询任务进度和统计\n• 🏠 智能动线优化（根据家里格局排序）\n\n直接输入文字开始对话吧！',
      timestamp: new Date(),
    }
  ]);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

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
  const {
    editingTasks,
    editingMessageId,
    setEditingTasks,
    handleTaskReorder,
    handleTaskDurationChange,
    handleTaskTitleChange,
    handleDeleteTask,
    startEditing,
    cancelEditing,
    recalculateTaskTimes,
  } = useTaskEditor();
  const { thinkingSteps, addStep: addThinkingStep, clearSteps: clearThinkingSteps } = useThinkingProcess();

  // 自动滚动到底部
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  // 保存状态到localStorage（包括 isOpen）
  useEffect(() => {
    setPersistedState({
      isOpen,
      position,
      size,
      bgColor,
    });
  }, [isOpen, position, size, bgColor, setPersistedState]);

  // 切换思考过程展开/折叠
  const toggleThinkingExpanded = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isThinkingExpanded: !msg.isThinkingExpanded }
        : msg
    ));
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
  const handlePushToTimeline = async () => {
    if (editingTasks.length === 0 || !editingMessageId) return;

    setIsProcessing(true);
    try {
      const goals = useGoalStore.getState().goals;
      const goalMatches: Record<string, number> = {};
      
      // 批量创建任务
      const createdTasks = [];
      for (const taskData of editingTasks) {
        const task = await createTask({
          title: taskData.title,
          description: '',
          taskType: taskData.category as TaskType,
          priority: taskData.priority === 'high' ? 1 : taskData.priority === 'medium' ? 2 : 3,
          durationMinutes: taskData.duration,
          scheduledStart: taskData.startTime ? (() => {
            const [hours, minutes] = taskData.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return date;
          })() : undefined,
          scheduledEnd: taskData.startTime ? (() => {
            const [hours, minutes] = taskData.startTime.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            date.setMinutes(date.getMinutes() + taskData.duration);
            return date;
          })() : undefined,
          longTermGoals: goalMatches,
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
      
      // 清空编辑状态
      cancelEditing();
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



  // 发送消息
  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isProcessing) return;

    // 检查是否是查询任务的请求
    if (/查看|查询|今天|任务列表|进度|完成情况/.test(message)) {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsProcessing(true);

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
          return;
        }
      }
    }

    // 分析标签（AI或关键词）
    const analysis = await analyzeMessageTags(message);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      tags: {
        emotions: analysis.emotions,
        categories: analysis.categories,
        type: analysis.type,
      },
      rewards: analysis.rewards,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    clearThinkingSteps(); // 清空之前的思考步骤

    // 智能分析任务并匹配目标
    try {
      const goals = useGoalStore.getState().goals;
      
      // 添加思考步骤
      addThinkingStep('📝 正在分析你的输入...');
      
      // 检测是否是任务创建/分解请求
      const isTaskCreation = /创建|添加|新建|安排|计划|做|完成|学习|工作|运动|分解|拆解|洗漱|洗碗|猫粮|洗衣服|收拾|吃饭|垃圾/.test(message);
      const needsDecompose = /分解|拆解|详细安排|具体步骤/.test(message) || message.length > 20 || /然后|接着|再|之后|，|、/.test(message);
      
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
            if (tag) responseContent += `${tag.emoji} ${tag.label}  `;
          });
          responseContent += '\n\n';
        }

        // 显示分类标签
        if (analysis.categories.length > 0) {
          responseContent += '📂 **分类标签**：';
          analysis.categories.forEach(categoryId => {
            const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
            if (tag) responseContent += `${tag.emoji} ${tag.label}  `;
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

            addThinkingStep('⏳ AI正在分析任务结构...');
            
            // 传入当前时间，让AI正确计算任务开始时间
            const currentTime = new Date();
            const decomposeResult = await aiService.decomposeTask(enhancedPrompt, currentTime);
            
            if (decomposeResult.success && decomposeResult.tasks && decomposeResult.tasks.length > 0) {
              addThinkingStep(`✅ 成功分解出 ${decomposeResult.tasks.length} 个任务`);
              
              // 为每个任务添加ID和位置信息
              let tasksWithMetadata: DecomposedTask[] = decomposeResult.tasks.map((task, index) => ({
                id: crypto.randomUUID(),
                title: task.title,
                duration: task.duration || detectTaskDuration(task.title),
                category: task.category,
                priority: task.priority,
                location: task.location || detectTaskLocation(task.title), // 优先使用AI返回的位置，否则自动识别
                startTime: task.startTime, // 保留AI计算的开始时间
              }));

              // AI已经按照位置排序和计算时间了，不需要再次处理
              addThinkingStep('✅ AI已优化任务顺序和时间');

              addThinkingStep('🎯 正在匹配长期目标...');
              // 匹配目标
              const goalMatches: Record<string, number> = {};
              if (goals.length > 0) {
                const matches = matchTaskToGoals(
                  { title: message, description: '' },
                  goals
                );
                matches.forEach(match => {
                  goalMatches[match.goalId] = match.confidence;
                });
                if (matches.length > 0) {
                  addThinkingStep(`🎯 找到 ${matches.length} 个相关目标`);
                }
              }

              addThinkingStep('✨ 任务分解完成！');

              if (!analysis.type) {
                responseContent += '🤖 **AI智能任务分解 + 动线优化**\n\n';
              } else {
                responseContent += '---\n\n🤖 **同时帮你分解了任务**\n\n';
              }

              responseContent += `我帮你把任务分解成了 ${tasksWithMetadata.length} 个具体步骤，并按照家里格局优化了动线：\n\n`;
              
              tasksWithMetadata.forEach((task, index) => {
                const priorityEmoji = getPriorityEmoji(task.priority);
                const locationEmoji = LOCATION_ICONS[task.location || ''] || '📍';
                
                responseContent += `${index + 1}. ${priorityEmoji} **${task.title}**\n`;
                responseContent += `   ${locationEmoji} ${task.location ? LOCATION_NAMES[task.location] : '未指定位置'} | ⏱️ ${task.duration} 分钟 | 🕐 ${task.startTime}\n\n`;
              });

              // 显示目标关联
              if (Object.keys(goalMatches).length > 0) {
                responseContent += '🎯 **关联的长期目标**：\n';
                Object.entries(goalMatches).forEach(([goalId, confidence]) => {
                  const goal = goals.find(g => g.id === goalId);
                  if (goal) {
                    responseContent += `• ${goal.name} (${Math.round(confidence * 100)}%)\n`;
                  }
                });
                responseContent += '\n';
              }

              responseContent += '💡 你可以在下方编辑器中调整任务顺序和时长，然后点击"推送到时间轴"！';

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
              // 自动开始编辑
              startEditing(aiMessage.id, tasksWithMetadata);
              setIsProcessing(false);
              clearThinkingSteps();
              return;
            }
          } catch (error) {
            console.error('AI任务分解失败:', error);
            addThinkingStep('❌ AI分解失败，使用简单创建');
            // 继续使用简单创建
          }
        }

        // 简单任务创建（不分解）- 也支持手动编辑
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
        const singleTask: DecomposedTask = {
          id: crypto.randomUUID(),
          title: message,
          duration: detectTaskDuration(message),
          category: 'work',
          priority: 'medium',
          location: detectTaskLocation(message),
          startTime: new Date().toTimeString().slice(0, 5),
        };

        responseContent += '💡 你可以在下方编辑器中调整任务，然后点击"推送到时间轴"！';

        const goalMatches: Record<string, number> = {};
        matches.forEach(match => {
          goalMatches[match.goalId] = match.confidence;
        });

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
        };
        
        setMessages(prev => [...prev, aiMessage]);
        startEditing(aiMessage.id, [singleTask]);
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
      console.error('AI处理失败:', error);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，处理请求时出现了问题。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 浮动按钮 - 只在未展开时显示，手机端位置上移避免遮挡导航栏 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed w-14 h-14 rounded-full bg-purple-600 text-white shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center md:bottom-8 md:right-32 bottom-24 right-4"
          title="AI助手"
        >
          <span className="text-2xl">🤖</span>
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
                              return tag ? (
                                <span
                                  key={emotionId}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                                >
                                  {tag.emoji} {tag.label}
                                </span>
                              ) : null;
                            })}
                            {message.tags.categories.map(categoryId => {
                              const tag = CATEGORY_TAGS.find(t => t.id === categoryId);
                              return tag ? (
                                <span
                                  key={categoryId}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                                >
                                  {tag.emoji} {tag.label}
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
                                  ⏱️ {task.duration}分钟
                                  {task.startTime && ` | 🕐 ${task.startTime}`}
                                  {task.location && ` | 📍 ${task.location}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 显示待确认的操作按钮 */}
                      {message.pendingAction && message.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.borderColor }}>
                          <button
                            onClick={() => handleConfirmAction(message.id)}
                            disabled={isProcessing}
                            className="w-full py-2 px-3 rounded-lg text-sm font-medium hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#4ade80', color: '#ffffff' }}
                          >
                            ✅ 确认创建到时间轴
                          </button>
                        </div>
                      )}
                      
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 任务编辑器 */}
                {editingMessageId && editingTasks.length > 0 && (
                  <div className="rounded-lg shadow-lg p-4 border-2" style={{ backgroundColor: theme.bgColor, borderColor: '#8b5cf6' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-900">✏️ 任务编辑器</div>
                      <button
                        onClick={cancelEditing}
                        className="text-xs"
                        style={{ color: theme.accentColor }}
                      >
                        取消
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-3">
                      {editingTasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="rounded-lg p-3 border"
                          style={{ 
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-sm font-medium" style={{ color: theme.accentColor }}>#{index + 1}</span>
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => handleTaskTitleChange(task.id, e.target.value)}
                                className="flex-1 text-sm px-2 py-1 rounded border focus:outline-none"
                                style={{
                                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                  color: theme.textColor,
                                  borderColor: theme.borderColor,
                                }}
                              />
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="ml-2 text-xs"
                              style={{ color: '#ef4444' }}
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-xs" style={{ color: theme.accentColor }}>
                            <span>⏱️</span>
                            <input
                              type="number"
                              value={task.duration}
                              onChange={(e) => handleTaskDurationChange(task.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 rounded border focus:outline-none"
                              style={{
                                backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                color: theme.textColor,
                                borderColor: theme.borderColor,
                              }}
                              min="1"
                            />
                            <span>分钟</span>
                            
                            {task.startTime && (
                              <>
                                <span className="ml-2">🕐</span>
                                <span>{task.startTime}</span>
                              </>
                            )}
                            
                            {task.location && (
                              <>
                                <span className="ml-2">📍</span>
                                <span>{task.location}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => index > 0 && handleTaskReorder(index, index - 1)}
                              disabled={index === 0}
                              className="text-xs px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: theme.buttonBg, color: theme.textColor }}
                            >
                              ⬆️ 上移
                            </button>
                            <button
                              onClick={() => index < editingTasks.length - 1 && handleTaskReorder(index, index + 1)}
                              disabled={index === editingTasks.length - 1}
                              className="text-xs px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: theme.buttonBg, color: theme.textColor }}
                            >
                              ⬇️ 下移
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handlePushToTimeline}
                      disabled={isProcessing || editingTasks.length === 0}
                      className="w-full py-2 px-3 rounded-lg text-sm font-medium hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#8b5cf6', color: '#ffffff' }}
                    >
                      🚀 推送到时间轴 ({editingTasks.length} 个任务)
                    </button>
                  </div>
                )}
                
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
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none text-sm border"
                    style={{
                      backgroundColor: theme.cardBg,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
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
    </>
  );
}

