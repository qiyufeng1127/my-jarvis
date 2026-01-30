import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, Settings, X } from 'lucide-react';
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
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.deepseek.com/v1/chat/completions');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  
  const { createTask } = useTaskStore();

  // 从 localStorage 加载 API 配置
  useEffect(() => {
    const savedApiKey = localStorage.getItem('ai_api_key');
    const savedEndpoint = localStorage.getItem('ai_api_endpoint');
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedEndpoint) setApiEndpoint(savedEndpoint);
  }, []);

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

  const saveApiSettings = () => {
    localStorage.setItem('ai_api_key', apiKey);
    localStorage.setItem('ai_api_endpoint', apiEndpoint);
    setShowSettings(false);
  };

  return (
    <div 
      className={`flex flex-col ${className}`}
      style={{ 
        backgroundColor: bgColor,
        height: '100%',
        width: '100%',
      }}
    >
      {/* 头部 - 固定，减少内边距 */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" style={{ color: textColor }} />
          <span className="font-semibold text-sm" style={{ color: textColor }}>AI智能助手</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-lg transition-all hover:scale-110"
          style={{ backgroundColor: buttonBg }}
        >
          <Settings className="w-4 h-4" style={{ color: textColor }} />
        </button>
      </div>

      {/* API 设置弹窗 */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">API 设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 DeepSeek API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 接口地址
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.deepseek.com/v1/chat/completions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 默认使用 DeepSeek API。你可以在 
                  <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                    DeepSeek 官网
                  </a>
                  获取 API Key。
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveApiSettings}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对话区域 - 可滚动，自动填充剩余空间，减少内边距 */}
      <div 
        ref={conversationRef} 
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        style={{
          minHeight: 0,
          flex: '1 1 0',
        }}
      >
        {/* 空状态提示 - 只显示示例按钮，减少间距 */}
        {messages.length === 0 && (
          <div className="space-y-1">
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
                className="w-full rounded-lg p-1.5 text-[10px] transition-all hover:scale-[1.02] text-left"
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
              className="max-w-[80%] rounded-lg p-1.5"
              style={{
                backgroundColor: message.role === 'user' ? buttonBg : cardBg,
                color: textColor,
              }}
            >
              <div className="whitespace-pre-wrap text-[10px]">{message.content}</div>
              
              {/* 操作按钮 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-1 space-y-1">
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
              
              <div className="text-[9px] mt-1" style={{ color: accentColor }}>
                {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 处理中状态 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-lg p-1.5" style={{ backgroundColor: cardBg }}>
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

      {/* 快速指令 - 固定，减少内边距 */}
      <div className="flex-shrink-0 px-2 py-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
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

      {/* 输入区域 - 固定在底部，减少内边距 */}
      <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
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
            className="p-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ 
              backgroundColor: '#10B981', // 绿色背景
              color: '#ffffff' // 白色图标
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
