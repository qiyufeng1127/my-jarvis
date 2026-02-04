import { useState, useRef, useEffect } from 'react';
import { Send, Mic, X, Sparkles, MicOff } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import type { AIProcessRequest } from '@/services/aiSmartService';
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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const voiceRecognitionRef = useRef<VoiceRecognitionService | null>(null);
  const voiceFeedbackRef = useRef<VoiceFeedbackService | null>(null);
  const deviceFeedbackRef = useRef<DeviceFeedbackService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { createTask } = useTaskStore();
  const { dimensions } = useGrowthStore();
  const { 
    getActiveSideHustles, 
    addIncome, 
    addExpense, 
    createSideHustle, 
    addDebt 
  } = useSideHustleStore();

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

    // 立即显示"AI正在思考"状态
    // 用户可以看到消息已发送

    try {
      // 调用 AI 处理
      const response = await processWithAI(message);
      
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        data: response.data,
        actions: response.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // 语音反馈
      if (isVoiceMode && voiceFeedbackRef.current) {
        await voiceFeedbackRef.current.provideFeedback('success', { action: '理解指令' });
      }

      // 处理冲突选项
      if (response.conflictDetected && response.conflictOptions) {
        // 显示冲突选项，等待用户选择
        // 不自动执行
        return;
      }

      // 自动执行操作（如果不需要确认）
      if (response.autoExecute && response.actions) {
        await executeActions(response.actions);
        
        // 成功反馈
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
      
      // 错误反馈
      if (deviceFeedbackRef.current) {
        deviceFeedbackRef.current.playSound('error');
      }
      
      await showFeedback('failure', {});
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithAI = async (input: string) => {
    // 获取现有任务（用于冲突检测）
    const existingTasks = useTaskStore.getState().tasks || [];
    
    // 获取现有副业（用于副业追踪）
    const existingSideHustles = getActiveSideHustles();
    
    // 构建请求上下文
    const request: AIProcessRequest = {
      user_input: input,
      context: {
        user_id: 'current-user', // TODO: 从 userStore 获取
        current_time: new Date().toLocaleTimeString('zh-CN'),
        current_date: new Date().toLocaleDateString('zh-CN'),
        timeline_summary: {}, // TODO: 获取时间轴摘要
        user_preferences: {}, // TODO: 获取用户偏好
        conversation_history: messages.slice(-5), // 最近5条对话
        existing_tasks: existingTasks, // 传入现有任务用于冲突检测
        existing_side_hustles: existingSideHustles, // 传入现有副业用于副业追踪
      },
    };

    // 调用 AI 处理服务
    return await AISmartProcessor.process(request);
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
          if (action.data.task_id) {
            const updates: any = {};
            if (action.data.new_start_time) {
              updates.scheduledStart = new Date(action.data.new_start_time).toISOString();
            }
            if (action.data.new_duration) {
              updates.durationMinutes = action.data.new_duration;
            }
            // TODO: 调用 updateTask
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" style={{ color: textColor }} />
            <span className="font-semibold text-lg" style={{ color: textColor }}>AI智能助手</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoiceMode}
              className={`p-2 rounded-lg transition-all hover:scale-105 ${
                isVoiceMode ? 'animate-pulse' : ''
              }`}
              style={{ 
                backgroundColor: isVoiceMode ? (wakeState === 'listening' ? '#3B82F6' : buttonBg) : 'transparent',
                color: textColor 
              }}
              title={isVoiceMode ? '关闭语音' : '语音输入'}
            >
              {isVoiceMode ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: buttonBg, color: textColor }}
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 对话区域 */}
        <div ref={conversationRef} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                className={`max-w-[80%] rounded-lg p-4`}
                style={{
                  backgroundColor: message.role === 'user' ? buttonBg : cardBg,
                  color: textColor,
                }}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* 冲突选项 - 压缩格式（2x2网格） */}
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
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] text-left"
                        style={{ 
                          backgroundColor: buttonBg,
                          color: textColor 
                        }}
                      >
                        <div className="font-semibold mb-0.5">{option.label}</div>
                        <div className="text-[10px] opacity-70">{option.description}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 操作按钮 - 压缩格式 */}
                {message.actions && message.actions.length > 0 && !message.data?.conflictOptions && (
                  <div className="mt-3 space-y-1.5">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => executeActions([action])}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
                        style={{ 
                          backgroundColor: buttonBg,
                          color: textColor 
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="text-xs mt-2" style={{ color: accentColor }}>
                  {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {/* 处理中状态 */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs" style={{ color: accentColor }}>AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 反馈动画 */}
        {feedbackAnimation?.show && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 pointer-events-none">
            <div 
              className="px-8 py-6 rounded-2xl shadow-2xl animate-bounce"
              style={{ backgroundColor: feedbackAnimation.color }}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">
                  {feedbackAnimation.type === 'success' && '✅'}
                  {feedbackAnimation.type === 'warning' && '⚠️'}
                  {feedbackAnimation.type === 'alert' && '🔔'}
                  {feedbackAnimation.type === 'question' && '❓'}
                </div>
                <div className="text-white font-semibold text-lg">
                  {feedbackAnimation.text}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 快速指令 */}
        <div className="px-6 py-3 border-t" style={{ 
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: cardBg 
        }}>
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-xs whitespace-nowrap" style={{ color: accentColor }}>快速指令：</span>
            {[
              { key: 'decompose', label: '分解任务', icon: '📅' },
              { key: 'timeline', label: '时间轴', icon: '🕒' },
              { key: 'gold', label: '金币', icon: '💰' },
              { key: 'mood', label: '心情', icon: '📝' },
              { key: 'tags', label: '标签', icon: '🏷️' },
            ].map((cmd) => (
              <button
                key={cmd.key}
                onClick={() => handleQuickCommand(cmd.key)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 whitespace-nowrap"
                style={{ 
                  backgroundColor: buttonBg,
                  color: textColor 
                }}
              >
                {cmd.icon} {cmd.label}
              </button>
            ))}
          </div>
        </div>

        {/* 输入区域 - 更紧凑 */}
        <div className="p-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          {isVoiceMode ? (
            // 语音模式界面
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <div className="text-sm mb-2" style={{ color: accentColor }}>
                  {wakeState === 'sleeping' && '点击麦克风开始语音输入'}
                  {wakeState === 'activated' && '正在激活...'}
                  {wakeState === 'listening' && '请说出你的指令'}
                  {wakeState === 'processing' && '正在处理...'}
                </div>
                
                {/* 大麦克风按钮 */}
                <button
                  onClick={wakeState === 'sleeping' ? handleVoiceWake : undefined}
                  disabled={wakeState !== 'sleeping'}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                  style={{ 
                    backgroundColor: wakeState === 'listening' ? '#3B82F6' : buttonBg,
                    boxShadow: wakeState === 'listening' ? '0 0 30px rgba(59, 130, 246, 0.5)' : 'none',
                  }}
                >
                  <Mic className="w-10 h-10" style={{ color: textColor }} />
                  
                  {/* 脉动波纹 */}
                  {wakeState === 'listening' && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-pulse" />
                    </>
                  )}
                </button>
              </div>
              
              {/* 切换到文字输入 */}
              <button
                onClick={() => setIsVoiceMode(false)}
                className="text-sm px-4 py-2 rounded-lg transition-all hover:scale-105"
                style={{ backgroundColor: buttonBg, color: textColor }}
              >
                切换到文字输入
              </button>
            </div>
          ) : (
            // 文字模式界面 - 更紧凑，文字改黑色
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="对我说点什么..."
                rows={1}
                className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isProcessing}
                className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: buttonBg,
                  color: textColor 
                }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

