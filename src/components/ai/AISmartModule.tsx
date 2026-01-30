import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { AISmartProcessor } from '@/services/aiSmartService';
import type { AIProcessRequest } from '@/services/aiSmartService';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: AIAction[];
  timestamp: Date;
}

interface AIAction {
  type: 'create_task' | 'update_timeline' | 'add_tags' | 'record_memory' | 'calculate_gold';
  data: any;
  label: string;
}

interface AISmartModuleProps {
  isDark?: boolean;
  bgColor?: string;
  className?: string;
  height?: string;
}

export default function AISmartModule({ 
  isDark = false, 
  bgColor = '#ffffff',
  className = '',
  height = '100%'
}: AISmartModuleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  
  const { createTask } = useTaskStore();

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 自动滚动到底部
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = text || inputValue.trim();
    if (!message || isProcessing) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const existingTasks = useTaskStore.getState().tasks || [];
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
        },
      };

      const response = await AISmartProcessor.process(request);
      
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        data: response.data,
        actions: response.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.autoExecute && response.actions) {
        await executeActions(response.actions);
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，处理时出现了问题。请重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      if (action.type === 'create_task') {
        if (action.data.tasks && Array.isArray(action.data.tasks)) {
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
        } else {
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
        }
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
    <div 
      className={`flex flex-col h-full ${className}`}
      style={{ 
        backgroundColor: bgColor,
        minHeight: '300px',
        height: height === '100%' ? '100%' : undefined,
        maxHeight: '100%',
      }}
    >
      {/* 头部 - 固定 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" style={{ color: textColor }} />
          <span className="font-semibold text-sm" style={{ color: textColor }}>AI智能助手</span>
        </div>
      </div>

      {/* 对话区域 - 可滚动拉伸 */}
      <div 
        ref={conversationRef} 
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2"
        style={{
          overflowY: 'auto',
          maxHeight: 'calc(100% - 120px)'
        }}
      >
        {/* 空状态提示 - 只显示示例按钮 */}
        {messages.length === 0 && (
          <div className="space-y-1.5">
            {[
              '5分钟后洗漱然后吃早餐',
              '明天上午9点学习2小时',
              '今天心情很好',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(example);
                  textareaRef.current?.focus();
                }}
                className="w-full rounded-lg p-2 text-[10px] transition-all hover:scale-[1.02] text-left"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                💬 {example}
              </button>
            ))}
          </div>
        )}

        {/* 对话消息 */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] rounded-lg p-2"
              style={{
                backgroundColor: message.role === 'user' ? buttonBg : cardBg,
                color: textColor,
              }}
            >
              <div className="whitespace-pre-wrap text-[10px]">{message.content}</div>
              
              {/* 操作按钮 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => executeActions([action])}
                      className="w-full px-2 py-1 rounded-lg text-[10px] font-medium transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: buttonBg, color: textColor }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="text-[9px] mt-1.5" style={{ color: accentColor }}>
                {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 处理中状态 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-lg p-2" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px]" style={{ color: accentColor }}>AI正在思考...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 快速指令 - 固定 */}
      <div className="flex-shrink-0 px-2 py-1.5 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="text-[9px] whitespace-nowrap" style={{ color: accentColor }}>快速：</span>
          {[
            { key: 'decompose', label: '分解', icon: '📅' },
            { key: 'timeline', label: '时间轴', icon: '🕒' },
            { key: 'gold', label: '金币', icon: '💰' },
            { key: 'mood', label: '心情', icon: '📝' },
            { key: 'tags', label: '标签', icon: '🏷️' },
          ].map((cmd) => (
            <button
              key={cmd.key}
              onClick={() => handleQuickCommand(cmd.key)}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all hover:scale-105 whitespace-nowrap"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              {cmd.icon} {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="flex-shrink-0 p-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-end space-x-1.5">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="对我说点什么..."
            rows={2}
            className="flex-1 px-2 py-1.5 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-opacity-50 text-[10px]"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isProcessing}
            className="p-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
