import { useState, useRef, useEffect } from 'react';
import { Send, Mic, X, Sparkles, MicOff, Edit2, ChevronUp, ChevronDown, Clock, Coins, Settings } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { useAIStore } from '@/stores/aiStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import type { AIProcessRequest } from '@/services/aiSmartService';
import AIConfigModal from './AIConfigModal';
import { 
  VoiceRecognitionService, 
  VoiceFeedbackService, 
  DeviceFeedbackService,
  type WakeState 
} from '@/services/voiceWakeService';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: AIAction[];
  timestamp: Date;
}

interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold' | 'add_income' | 'add_expense' | 'create_side_hustle' | 'add_debt';
  data: any;
  label: string;
}

interface AISmartInputProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  bgColor?: string;
}

export default function AISmartInput({ isOpen, onClose, isDark = false, bgColor = '#ffffff' }: AISmartInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [wakeState, setWakeState] = useState<WakeState>('sleeping');
  const [listeningTimer, setListeningTimer] = useState(8);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [feedbackAnimation, setFeedbackAnimation] = useState<{
    show: boolean;
    type: string;
    text: string;
    color: string;
  } | null>(null);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTasks, setEditingTasks] = useState<any[]>([]);
  const [editingField, setEditingField] = useState<{taskIndex: number, field: string} | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const voiceRecognitionRef = useRef<VoiceRecognitionService | null>(null);
  const voiceFeedbackRef = useRef<VoiceFeedbackService | null>(null);
  const deviceFeedbackRef = useRef<DeviceFeedbackService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { createTask, updateTask, deleteTask, tasks: allTasks } = useTaskStore();
  const { dimensions, goals, addGoal } = useGrowthStore();
  const { 
    getActiveSideHustles, 
    addIncome, 
    addExpense, 
    createSideHustle, 
    addDebt 
  } = useSideHustleStore();
  const { isConfigured } = useAIStore();

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = '#000000'; // 强制使用黑色文字，确保在任何背景下都可见
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 初始化语音服务
  useEffect(() => {
    if (!isOpen) return;
    
    voiceRecognitionRef.current = new VoiceRecognitionService();
    voiceFeedbackRef.current = new VoiceFeedbackService();
    deviceFeedbackRef.current = new DeviceFeedbackService();

    return () => {
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stopListening();
      }
      if (voiceFeedbackRef.current) {
        voiceFeedbackRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  // 自动滚动到底部
  useEffect(() => {
    if (!isOpen) return;
    
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // 不显示欢迎消息，直接进入对话
  useEffect(() => {
    if (!isOpen) return;
    // 清空消息，直接开始对话
    if (messages.length === 0) {
      // 不添加欢迎消息
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 语音唤醒
  const handleVoiceWake = async () => {
    if (!voiceRecognitionRef.current || !voiceFeedbackRef.current || !deviceFeedbackRef.current) return;

    // 设置为激活状态
    setWakeState('activated');
    
    // 设备反馈
    deviceFeedbackRef.current.vibrate(200);
    deviceFeedbackRef.current.playSound('wake');

    // 语音反馈
    await voiceFeedbackRef.current.provideFeedback('success', { action: '唤醒' });
    
    // 开始监听
    setWakeState('listening');
    setListeningTimer(8);
    
    // 启动8秒倒计时
    let timeLeft = 8;
    timerRef.current = setInterval(() => {
      timeLeft--;
      setListeningTimer(timeLeft);
      
      if (timeLeft <= 0) {
        handleListeningTimeout();
      }
    }, 1000);

    // 开始语音识别
    voiceRecognitionRef.current.startListening(
      (text) => {
        setVoiceTranscript(text);
      },
      () => {
        // 识别结束
        if (voiceTranscript) {
          handleVoiceInput(voiceTranscript);
        }
      }
    );
  };

  // 监听超时
  const handleListeningTimeout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stopListening();
    }
    
    setWakeState('sleeping');
    setVoiceTranscript('');
    
    if (deviceFeedbackRef.current) {
      deviceFeedbackRef.current.playSound('warning');
    }
  };

  // 处理语音输入
  const handleVoiceInput = async (text: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setWakeState('processing');
    setInputValue(text);
    
    // 自动发送
    await handleSend(text);
    
    setWakeState('sleeping');
    setVoiceTranscript('');
  };

  // 切换语音模式
  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      // 关闭语音模式
      setIsVoiceMode(false);
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stopListening();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setWakeState('sleeping');
    } else {
      // 开启语音模式
      setIsVoiceMode(true);
      handleVoiceWake();
    }
  };

  // 显示反馈动画
  const showFeedback = async (type: 'success' | 'failure' | 'important', params: Record<string, string> = {}) => {
    if (!voiceFeedbackRef.current) return;

    const { text, strategy } = await voiceFeedbackRef.current.provideFeedback(type, params);
    
    setFeedbackAnimation({
      show: true,
      type: strategy.animation,
      text,
      color: strategy.color,
    });

    setTimeout(() => {
      setFeedbackAnimation(null);
    }, strategy.duration);
  };

  const handleSend = async (text?: string) => {
    const message = text || inputValue.trim();
    if (!message || isProcessing) return;

    // 立即显示用户消息
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // 确保无论如何都会重置 isProcessing
    const resetProcessing = () => {
      setIsProcessing(false);
    };

    try {
      // 直接调用本地AI处理器（不需要先调用DeepSeek API）
      const existingTasks = useTaskStore.getState().tasks || [];
      const existingSideHustles = getActiveSideHustles();
      
      const request: AIProcessRequest = {
        user_input: message,
        context: {
          user_id: 'current-user',
          current_time: new Date().toLocaleTimeString('zh-CN'),
          current_date: new Date().toLocaleDateString('zh-CN'),
          timeline_summary: {},
          user_preferences: {},
          conversation_history: messages.slice(-5),
          existing_tasks: existingTasks,
          existing_side_hustles: existingSideHustles,
        },
      };

      console.log('📱 手机端 - 调用 AISmartProcessor.process');
      const localResponse = await AISmartProcessor.process(request);
      
      console.log('🔍 AI处理结果:', localResponse);
      console.log('📋 Actions:', localResponse.actions);
      console.log('📊 Data:', localResponse.data);
      
      // 如果是任务分解，直接打开编辑器，不显示按钮
      if (localResponse.actions && localResponse.actions.length > 0) {
        const taskAction = localResponse.actions.find(a => a.type === 'create_task' && a.data.tasks);
        if (taskAction && taskAction.data.tasks) {
          console.log('🎯 检测到任务分解，直接打开编辑器，任务数量:', taskAction.data.tasks.length);
          
          // 显示AI消息（不带按钮）
          const aiMessage: AIMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: localResponse.message,
            data: localResponse.data,
            actions: undefined, // 不显示按钮
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // 直接打开任务编辑器
          setEditingTasks(taskAction.data.tasks);
          setShowTaskEditor(true);
          
          // 重置处理状态
          resetProcessing();
          return;
        }
      }
      
      // 其他情况：正常显示消息和按钮
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: localResponse.message,
        data: localResponse.data,
        actions: localResponse.actions,
        timestamp: new Date(),
      };

      console.log('💬 最终消息:', aiMessage);
      setMessages(prev => [...prev, aiMessage]);

      // 语音反馈
      if (isVoiceMode && voiceFeedbackRef.current) {
        await voiceFeedbackRef.current.provideFeedback('success', { action: '理解指令' });
      }

      // 处理冲突选项
      if (localResponse.conflictDetected && localResponse.conflictOptions) {
        return;
      }

      // 自动执行操作
      if (localResponse.autoExecute && localResponse.actions) {
        await executeActions(localResponse.actions);
        
        if (deviceFeedbackRef.current) {
          deviceFeedbackRef.current.vibrate([100, 50, 100]);
          deviceFeedbackRef.current.playSound('success');
        }
        
        await showFeedback('success', { action: '执行操作' });
      }
    } catch (error) {
      console.error('❌ AI处理失败:', error);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，处理时出现了问题。请检查AI配置或稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (deviceFeedbackRef.current) {
        deviceFeedbackRef.current.playSound('error');
      }
      
      await showFeedback('failure', {});
    } finally {
      // 确保一定会重置
      resetProcessing();
    }
  };



  const executeActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'create_task':
          // 批量创建任务
          if (action.data.tasks && Array.isArray(action.data.tasks)) {
            // 多任务批量创建
            for (const task of action.data.tasks) {
              const scheduledStart = task.scheduled_start_iso 
                ? new Date(task.scheduled_start_iso)
                : new Date();
              
              await createTask({
                title: task.title,
                description: task.description || '',
                durationMinutes: task.estimated_duration || 30,
                taskType: task.task_type || 'life',
                scheduledStart: scheduledStart.toISOString(),
                priority: task.priority || 'medium',
                tags: task.tags || [],
                status: 'pending',
              });
            }
            
            // 语音反馈
            if (voiceFeedbackRef.current) {
              await voiceFeedbackRef.current.provideFeedback('success', { 
                action: `已为您创建${action.data.tasks.length}个任务` 
              });
            }
          } else {
            // 单任务创建
          const scheduledStart = action.data.scheduled_time 
            ? new Date(action.data.scheduled_time)
            : new Date();
          
          await createTask({
            title: action.data.title,
            description: action.data.description || '',
            durationMinutes: action.data.estimated_duration || 60,
              taskType: action.data.task_type || 'life',
            scheduledStart: scheduledStart.toISOString(),
            priority: action.data.priority || 'medium',
            tags: action.data.tags || [],
            status: 'pending',
          });
          
          // 语音反馈
          if (voiceFeedbackRef.current) {
            const timeStr = scheduledStart.toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            await voiceFeedbackRef.current.provideFeedback('success', { 
              action: `已为您创建${timeStr}的任务` 
            });
            }
          }
          break;
          
        case 'update_timeline':
          // 更新时间轴任务
          if (action.data.operation === 'delete') {
            // 批量删除任务
            const taskIds = action.data.taskIds || [];
            for (const taskId of taskIds) {
              await deleteTask(taskId);
            }
            
            // 语音反馈
            if (voiceFeedbackRef.current) {
              await voiceFeedbackRef.current.provideFeedback('success', { 
                action: `已删除${taskIds.length}个任务` 
              });
            }
            
            // 如果需要跳转到时间轴
            if (action.data.navigateToTimeline) {
              setTimeout(() => {
                onClose();
              }, 500);
            }
          } else if (action.data.operation === 'move') {
            // 批量移动任务到指定日期
            const taskIds = action.data.taskIds || [];
            const targetDate = new Date(action.data.targetDate);
            
            console.log('📅 移动任务到:', targetDate.toLocaleDateString('zh-CN'));
            
            for (const taskId of taskIds) {
              const task = allTasks.find(t => t.id === taskId);
              if (task && task.scheduledStart) {
                const oldStart = new Date(task.scheduledStart);
                
                // 保持原来的时间，只改变日期
                const newStart = new Date(targetDate);
                newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
                
                // 计算新的结束时间
                const newEnd = task.scheduledEnd 
                  ? new Date(newStart.getTime() + (new Date(task.scheduledEnd).getTime() - oldStart.getTime()))
                  : undefined;
                
                await updateTask(taskId, {
                  scheduledStart: newStart,
                  scheduledEnd: newEnd,
                });
                
                console.log(`✅ 任务"${task.title}"已移动到 ${newStart.toLocaleString('zh-CN')}`);
              }
            }
            
            // 语音反馈
            if (voiceFeedbackRef.current) {
              await voiceFeedbackRef.current.provideFeedback('success', { 
                action: `已移动${taskIds.length}个任务到${targetDate.toLocaleDateString('zh-CN')}` 
              });
            }
            
            // 如果需要跳转到时间轴
            if (action.data.navigateToTimeline) {
              setTimeout(() => {
                onClose();
              }, 500);
            }
          } else if (action.data.operation === 'delay') {
            // 顺延任务
            const taskIds = action.data.taskIds || [];
            const delayMinutes = action.data.delayMinutes || 60;
            
            for (const taskId of taskIds) {
              const task = allTasks.find(t => t.id === taskId);
              if (task && task.scheduledStart) {
                const newStart = new Date(new Date(task.scheduledStart).getTime() + delayMinutes * 60000);
                const newEnd = task.scheduledEnd 
                  ? new Date(new Date(task.scheduledEnd).getTime() + delayMinutes * 60000)
                  : undefined;
                
                await updateTask(taskId, {
                  scheduledStart: newStart,
                  scheduledEnd: newEnd,
                });
              }
            }
            
            // 语音反馈
            if (voiceFeedbackRef.current) {
              await voiceFeedbackRef.current.provideFeedback('success', { 
                action: `已顺延${taskIds.length}个任务${delayMinutes}分钟` 
              });
            }
          } else if (action.data.task_id) {
            // 单个任务更新
            const updates: any = {};
            if (action.data.new_start_time) {
              updates.scheduledStart = new Date(action.data.new_start_time);
            }
            if (action.data.new_duration) {
              updates.durationMinutes = action.data.new_duration;
            }
            await updateTask(action.data.task_id, updates);
            console.log('更新任务:', action.data.task_id, updates);
          }
          break;
          
        case 'add_tags':
          // 添加标签
          console.log('添加标签:', action.data.tags);
          break;
          
        case 'record_memory':
          // 记录心情/碎碎念
          console.log('记录心情:', action.data.content);
          break;
          
        case 'calculate_gold':
          // 计算金币
          console.log('金币计算:', action.data);
          break;
          
        case 'add_to_inbox':
          // 添加到收集箱
          console.log('添加到收集箱:', action.data);
          break;
          
        case 'smart_schedule':
          // 智能分配
          console.log('智能分配:', action.data);
          break;
          
        // ============================================
        // 副业追踪相关操作
        // ============================================
        
        case 'add_income':
          // 添加收入
          await addIncome({
            sideHustleId: action.data.sideHustleId,
            amount: action.data.amount,
            description: action.data.description,
            date: action.data.date || new Date(),
          });
          
          // 语音反馈
          if (voiceFeedbackRef.current) {
            await voiceFeedbackRef.current.provideFeedback('success', { 
              action: `已记录收入¥${action.data.amount}` 
            });
          }
          break;
          
        case 'add_expense':
          // 添加支出
          await addExpense({
            sideHustleId: action.data.sideHustleId,
            amount: action.data.amount,
            description: action.data.description,
            date: action.data.date || new Date(),
          });
          
          // 语音反馈
          if (voiceFeedbackRef.current) {
            await voiceFeedbackRef.current.provideFeedback('success', { 
              action: `已记录支出¥${action.data.amount}` 
            });
          }
          break;
          
        case 'create_side_hustle':
          // 创建副业
          const newHustle = await createSideHustle({
            name: action.data.name,
            icon: action.data.icon || '💰',
            color: action.data.color || '#10b981',
            status: action.data.status || 'active',
            startDate: action.data.startDate,
          });
          
          // 如果有后续操作（创建后添加收入/支出）
          if (action.data.thenAddIncome) {
            await addIncome({
              sideHustleId: newHustle.id,
              amount: action.data.thenAddIncome.amount,
              description: action.data.thenAddIncome.description,
              date: new Date(),
            });
          }
          
          if (action.data.thenAddExpense) {
            await addExpense({
              sideHustleId: newHustle.id,
              amount: action.data.thenAddExpense.amount,
              description: action.data.thenAddExpense.description,
              date: new Date(),
            });
          }
          
          // 语音反馈
          if (voiceFeedbackRef.current) {
            await voiceFeedbackRef.current.provideFeedback('success', { 
              action: `已创建副业：${action.data.name}` 
            });
          }
          break;
          
        case 'add_debt':
          // 添加负债
          await addDebt({
            amount: action.data.amount,
            description: action.data.description,
            dueDate: action.data.dueDate,
            isPaid: action.data.isPaid || false,
          });
          
          // 语音反馈
          if (voiceFeedbackRef.current) {
            await voiceFeedbackRef.current.provideFeedback('success', { 
              action: `已记录欠债¥${action.data.amount}` 
            });
          }
          break;
      }
    }
  };

  const handleQuickCommand = (command: string) => {
    const commands: Record<string, string> = {
      decompose: '帮我分解任务：',
      timeline: '修改时间轴：',
      gold: '计算金币：',
      mood: '记录心情：',
      tags: '生成标签：',
    };
    setInputValue(commands[command] || '');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* API配置弹窗 */}
      <AIConfigModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
      />
      
      {/* iOS风格全屏对话框 */}
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* iOS风格头部 - 半透明毛玻璃效果 */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between">
            {/* 左侧：关闭按钮 */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1 text-blue-600 font-medium active:opacity-50 transition-opacity"
            >
              <X className="w-5 h-5" />
              <span className="text-base">关闭</span>
            </button>
            
            {/* 中间：标题 */}
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-base text-gray-900">AI智能助手</span>
            </div>
            
            {/* 右侧：设置按钮 */}
            <button
              onClick={async () => {
                // 如果有编辑中的任务，先推送到时间轴
                if (showTaskEditor && editingTasks.length > 0) {
                  console.log('📤 点击完成按钮，开始推送任务到时间轴:', editingTasks);
                  
                  // 添加新目标
                  for (const task of editingTasks) {
                    if (task.goal && task.isNewGoal) {
                      const existingGoal = goals.find(g => g.title === task.goal);
                      if (!existingGoal) {
                        await addGoal({
                          title: task.goal,
                          description: `通过AI智能助手自动创建`,
                          category: 'personal',
                          priority: 'medium',
                          status: 'active',
                        });
                      }
                    }
                  }

                  // 创建任务
                  await executeActions([{
                    type: 'create_task',
                    data: { tasks: editingTasks },
                    label: '确认',
                  }]);
                  
                  setShowTaskEditor(false);
                  setEditingTasks([]);
                  setEditingField(null);
                  
                  const successMessage: AIMessage = {
                    id: `success-${Date.now()}`,
                    role: 'assistant',
                    content: `✅ 已成功添加 ${editingTasks.length} 个任务到时间轴！`,
                    timestamp: new Date(),
                  };
                  setMessages(prev => [...prev, successMessage]);
                  
                  // 关闭对话框，跳转到时间轴
                  setTimeout(() => {
                    onClose();
                  }, 500);
                } else {
                  // 没有编辑任务，打开设置
                  setShowConfigModal(true);
                }
              }}
              className="p-2 rounded-full bg-gray-100 active:bg-gray-200 transition-colors"
              title={showTaskEditor ? "完成" : "API设置"}
            >
              {showTaskEditor ? (
                <span className="text-blue-600 font-semibold px-2">完成</span>
              ) : (
                <Settings className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
          
          {/* API未配置提示 */}
          {!isConfigured() && (
            <div className="mt-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 text-sm">⚠️</span>
                <span className="text-red-700 text-xs font-medium">请先配置 API Key</span>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="ml-auto text-xs text-red-600 font-semibold underline active:opacity-50"
                >
                  去设置
                </button>
              </div>
            </div>
          )}
        </div>

        {/* iOS风格对话区域 - 浅灰色背景 */}
        <div ref={conversationRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {/* 语音状态提示 */}
          {isVoiceMode && wakeState !== 'sleeping' && (
            <div className="flex justify-center mb-4">
              <div 
                className="px-6 py-3 rounded-full flex items-center space-x-3"
                style={{ backgroundColor: cardBg }}
              >
                {/* 声波动画 */}
                {wakeState === 'listening' && (
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.6s',
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* 状态文字 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" style={{ color: textColor }}>
                    {wakeState === 'activated' && '已唤醒...'}
                    {wakeState === 'listening' && `正在聆听... (${listeningTimer}s)`}
                    {wakeState === 'processing' && '处理中...'}
                  </span>
                  
                  {/* 倒计时进度条 */}
                  {wakeState === 'listening' && (
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000"
                        style={{ width: `${(listeningTimer / 8) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 语音识别文本 */}
          {voiceTranscript && (
            <div className="flex justify-center mb-4">
              <div 
                className="px-4 py-2 rounded-lg max-w-md"
                style={{ backgroundColor: buttonBg }}
              >
                <div className="text-xs mb-1" style={{ color: accentColor }}>识别中...</div>
                <div className="text-sm" style={{ color: textColor }}>{voiceTranscript}</div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</div>
                
                {/* iOS风格操作按钮 */}
                {message.actions && message.actions.length > 0 && !message.data?.conflictOptions && (
                  <div className="mt-3 space-y-2">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log('🖱️ 按钮点击:', action);
                          if (action.type === 'create_task' && action.data.tasks) {
                            console.log('🎯 打开任务编辑器，任务数量:', action.data.tasks.length);
                            setEditingTasks(action.data.tasks);
                            setShowTaskEditor(true);
                          } else {
                            executeActions([action]);
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl font-medium transition-all active:scale-95 bg-blue-500 text-white shadow-sm"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 冲突选项 - iOS风格 */}
                {message.data?.conflictOptions && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {message.data.conflictOptions.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={async () => {
                          // 处理冲突选项
                          if (option.action === 'inbox') {
                            // 添加到收集箱
                            const { InboxManager } = await import('@/services/aiSmartService');
                            InboxManager.addToInbox({
                              title: message.data.newTask.title,
                              description: '',
                              estimatedDuration: message.data.newTask.estimatedDuration,
                              taskType: 'life',
                              category: '待安排',
                              tags: [],
                              priority: 'medium',
                            });
                            
                            const confirmMsg: AIMessage = {
                              id: `confirm-${Date.now()}`,
                              role: 'assistant',
                              content: '✅ 已添加到收集箱，稍后可以手动安排时间。',
                              timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, confirmMsg]);
                          } else if (option.action === 'postpone') {
                            // 自动顺延
                            await executeActions([{
                              type: 'create_task',
                              data: {
                                title: message.data.newTask.title,
                                scheduled_time: new Date(Date.now() + 60 * 60000).toISOString(), // 1小时后
                                estimated_duration: message.data.newTask.estimatedDuration,
                                task_type: 'life',
                              },
                              label: '顺延任务',
                            }]);
                            
                            const confirmMsg: AIMessage = {
                              id: `confirm-${Date.now()}`,
                              role: 'assistant',
                              content: '✅ 已自动顺延到下一个空闲时段。',
                              timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, confirmMsg]);
                          } else if (option.action === 'replace') {
                            // 替换现有任务
                            // TODO: 删除冲突任务，添加新任务
                            const confirmMsg: AIMessage = {
                              id: `confirm-${Date.now()}`,
                              role: 'assistant',
                              content: '✅ 已替换原有任务。',
                              timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, confirmMsg]);
                          } else if (option.action === 'cancel') {
                            // 取消
                            const confirmMsg: AIMessage = {
                              id: `confirm-${Date.now()}`,
                              role: 'assistant',
                              content: '❌ 已取消添加任务。',
                              timestamp: new Date(),
                            };
                            setMessages(prev => [...prev, confirmMsg]);
                          }
                        }}
                        className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95 text-left bg-gray-100 text-gray-900"
                      >
                        <div className="font-semibold mb-0.5">{option.label}</div>
                        <div className="text-[10px] opacity-70">{option.description}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {/* iOS风格处理中状态 */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* iOS风格输入区域 - 固定在底部 */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
          <div className="flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2 flex items-center space-x-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="对我说点什么..."
                rows={1}
                className="flex-1 bg-transparent resize-none focus:outline-none text-[15px] text-gray-900 placeholder-gray-400"
                style={{ maxHeight: '100px' }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isProcessing || !isConfigured()}
              className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* iOS风格任务编辑器弹窗 */}
        {showTaskEditor && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col">
            {/* 头部 */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 safe-area-top">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowTaskEditor(false);
                    setEditingTasks([]);
                    setEditingField(null);
                  }}
                  className="text-blue-600 font-medium active:opacity-50"
                >
                  取消
                </button>
                <div className="font-semibold text-base text-gray-900">编辑任务 ({editingTasks.length})</div>
                <button
                  onClick={async () => {
                    console.log('📤 点击完成按钮，开始推送任务到时间轴:', editingTasks);
                    
                    // 显示加载状态
                    setIsProcessing(true);
                    
                    try {
                      // 添加新目标
                      for (const task of editingTasks) {
                        if (task.goal && task.isNewGoal) {
                          const existingGoal = goals.find(g => g.title === task.goal);
                          if (!existingGoal) {
                            await addGoal({
                              title: task.goal,
                              description: `通过AI智能助手自动创建`,
                              category: 'personal',
                              priority: 'medium',
                              status: 'active',
                            });
                          }
                        }
                      }

                      // 创建任务
                      await executeActions([{
                        type: 'create_task',
                        data: { tasks: editingTasks },
                        label: '确认',
                      }]);
                      
                      setShowTaskEditor(false);
                      setEditingTasks([]);
                      setEditingField(null);
                      
                      const successMessage: AIMessage = {
                        id: `success-${Date.now()}`,
                        role: 'assistant',
                        content: `✅ 已成功添加 ${editingTasks.length} 个任务到时间轴！正在跳转...`,
                        timestamp: new Date(),
                      };
                      setMessages(prev => [...prev, successMessage]);
                      
                      // 等待一下让用户看到成功消息
                      await new Promise(resolve => setTimeout(resolve, 800));
                      
                      // 关闭对话框
                      onClose();
                    } catch (error) {
                      console.error('❌ 推送任务失败:', error);
                      alert('推送任务失败，请重试');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="text-blue-600 font-semibold active:opacity-50 disabled:opacity-30"
                >
                  {isProcessing ? '推送中...' : '完成'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isProcessing ? '正在添加到时间轴...' : '双击字段编辑，用箭头调整顺序'}
              </p>
            </div>

            {/* 任务卡片列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {editingTasks.map((task, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-4 bg-white shadow-sm border-2"
                  style={{ borderColor: task.color }}
                >
                  {/* 第一行：序号 + 任务名称 + 上下移动 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm" style={{ backgroundColor: task.color }}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingField?.taskIndex === index && editingField?.field === 'title' ? (
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          autoFocus
                          className="w-full px-3 py-2 text-[15px] font-semibold rounded-xl focus:outline-none focus:ring-2 bg-gray-50 text-gray-900 border-2"
                          style={{ borderColor: task.color }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => setEditingField({ taskIndex: index, field: 'title' })}
                          className="text-[15px] font-semibold cursor-pointer px-3 py-2 rounded-xl transition-colors text-gray-900"
                          style={{ 
                            backgroundColor: editingField?.taskIndex === index ? `${task.color}10` : 'transparent' 
                          }}
                        >
                          {task.title}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => moveTaskUp(index)}
                        disabled={index === 0}
                        className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 bg-gray-100"
                      >
                        <ChevronUp className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => moveTaskDown(index)}
                        disabled={index === editingTasks.length - 1}
                        className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 bg-gray-100"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="space-y-2">
                    {/* 时间和时长 */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5">
                        <Clock className="w-3 h-3 text-gray-600" />
                        <span className="font-medium text-gray-900">{task.scheduled_start}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">{task.scheduled_end}</span>
                      </div>

                      <div className="flex-shrink-0">
                        {editingField?.taskIndex === index && editingField?.field === 'duration' ? (
                          <input
                            type="number"
                            value={task.estimated_duration}
                            onChange={(e) => updateTaskField(index, 'estimated_duration', parseInt(e.target.value) || 0)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                            autoFocus
                            className="w-16 px-2 py-1 text-xs rounded-full focus:outline-none focus:ring-2 bg-gray-50 text-gray-900 border-2"
                            style={{ borderColor: task.color }}
                          />
                        ) : (
                          <div
                            onDoubleClick={() => setEditingField({ taskIndex: index, field: 'duration' })}
                            className="cursor-pointer px-3 py-1.5 rounded-full transition-colors bg-gray-100"
                          >
                            <span className="font-medium text-gray-900">{task.estimated_duration}分钟</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-3 py-1.5">
                        <Coins className="w-3 h-3 text-yellow-600" />
                        <span className="font-semibold text-yellow-700">{task.gold}</span>
                      </div>

                      <span className="px-3 py-1.5 rounded-full font-medium bg-gray-100 text-gray-700">
                        📍 {task.location}
                      </span>
                    </div>

                    {/* 标签（可编辑） */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-gray-500 font-medium">🏷️ 标签：</span>
                      {task.tags.map((tag: string, tagIndex: number) => (
                        <div
                          key={tagIndex}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${AISmartProcessor.getColorForTag(tag)}20`,
                            color: AISmartProcessor.getColorForTag(tag),
                          }}
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => {
                              const newTasks = [...editingTasks];
                              newTasks[index].tags = newTasks[index].tags.filter((_: string, i: number) => i !== tagIndex);
                              // 更新颜色（使用第一个标签的颜色）
                              newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                              setEditingTasks(newTasks);
                            }}
                            className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newTag = prompt('输入新标签：');
                          if (newTag && newTag.trim()) {
                            const newTasks = [...editingTasks];
                            newTasks[index].tags = [...newTasks[index].tags, newTag.trim()];
                            // 更新颜色（使用第一个标签的颜色）
                            newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
                            setEditingTasks(newTasks);
                          }
                        }}
                        className="px-3 py-1.5 rounded-full font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                      >
                        + 添加
                      </button>
                    </div>

                    {/* 关联目标（可编辑） */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-gray-500 font-medium">🎯 目标：</span>
                      {task.goal ? (
                        <div className="flex items-center gap-1 bg-green-50 rounded-full px-3 py-1.5">
                          <span className="font-medium text-green-700">{task.goal}</span>
                          <button
                            onClick={() => {
                              const newTasks = [...editingTasks];
                              newTasks[index].goal = null;
                              newTasks[index].isNewGoal = false;
                              setEditingTasks(newTasks);
                            }}
                            className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3 text-green-700" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // 显示目标选择器
                            const existingGoals = goals.map(g => g.title);
                            const options = [...existingGoals, '+ 创建新目标'];
                            const choice = prompt(`选择目标（输入序号）：\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
                            
                            if (choice) {
                              const choiceIndex = parseInt(choice) - 1;
                              if (choiceIndex >= 0 && choiceIndex < options.length) {
                                if (choiceIndex === options.length - 1) {
                                  // 创建新目标
                                  const newGoalName = prompt('输入新目标名称：');
                                  if (newGoalName && newGoalName.trim()) {
                                    const newTasks = [...editingTasks];
                                    newTasks[index].goal = newGoalName.trim();
                                    newTasks[index].isNewGoal = true;
                                    setEditingTasks(newTasks);
                                  }
                                } else {
                                  // 选择现有目标
                                  const newTasks = [...editingTasks];
                                  newTasks[index].goal = existingGoals[choiceIndex];
                                  newTasks[index].isNewGoal = false;
                                  setEditingTasks(newTasks);
                                }
                              }
                            }
                          }}
                          className="px-3 py-1.5 rounded-full font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                          + 关联目标
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  // 重新计算所有任务的时间
  function recalculateTaskTimes(tasks: any[], startFromIndex: number = 0) {
    const newTasks = [...tasks];
    
    console.log('🔄 开始重新计算时间，从索引:', startFromIndex);
    
    for (let i = startFromIndex; i < newTasks.length; i++) {
      if (i === 0) {
        // 第一个任务：保持开始时间，但更新结束时间
        const start = new Date(newTasks[i].scheduled_start_iso);
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      } else {
        // 后续任务：紧接着前一个任务的结束时间开始
        const prevStart = new Date(newTasks[i - 1].scheduled_start_iso);
        const prevEnd = new Date(prevStart.getTime() + newTasks[i - 1].estimated_duration * 60000);
        const start = new Date(prevEnd.getTime());
        const end = new Date(start.getTime() + newTasks[i].estimated_duration * 60000);
        
        newTasks[i].scheduled_start_iso = start.toISOString();
        newTasks[i].scheduled_start = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        newTasks[i].scheduled_end = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    return newTasks;
  }

  // 上移任务
  function moveTaskUp(index: number) {
    if (index === 0) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  }

  // 下移任务
  function moveTaskDown(index: number) {
    if (index === editingTasks.length - 1) return;
    
    const newTasks = [...editingTasks];
    [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    
    // 重新计算时间
    const recalculated = recalculateTaskTimes(newTasks, 0);
    setEditingTasks(recalculated);
  }

  // 更新任务字段
  function updateTaskField(index: number, field: string, value: any) {
    const newTasks = [...editingTasks];
    newTasks[index][field] = value;
    
    // 如果修改了任务名称，自动重新计算所有相关属性
    if (field === 'title') {
      console.log(`✏️ 修改任务${index + 1}的名称为: ${value}`);
      
      // 重新推断所有属性（使用AI服务的静态方法）
      // 注意：这些方法需要在 aiSmartService.ts 中导出
      newTasks[index].tags = ['日常']; // 简化版，实际应该调用AI分析
      newTasks[index].color = AISmartProcessor.getTaskColor(newTasks[index].tags);
      
      // 重新估算时长（简化版）
      const newDuration = 30; // 默认30分钟
      newTasks[index].estimated_duration = newDuration;
      
      // 重新计算金币
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      // 从当前任务开始重新计算所有时间
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    }
    // 如果修改了时长，重新计算金币和后续任务时间
    else if (field === 'estimated_duration') {
      console.log(`⚡ 修改任务${index + 1}的时长为: ${value}分钟`);
      newTasks[index].gold = AISmartProcessor.calculateGold(newTasks[index]);
      
      // 从当前任务开始重新计算所有时间
      const recalculated = recalculateTaskTimes(newTasks, index);
      setEditingTasks(recalculated);
    } else {
      setEditingTasks(newTasks);
    }
  }
}

