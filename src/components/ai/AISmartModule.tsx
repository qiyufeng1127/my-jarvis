import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Settings, X } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import UnifiedTaskEditor from '@/components/shared/UnifiedTaskEditor';
import { useChatLogic, useTaskEditing } from './hooks';
import type { AIMessage } from './hooks';

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
  const {
    messages,
    isProcessing,
    inputValue,
    setInputValue,
    conversationRef,
    handleSend,
    executeActions,
    isConfigured,
  } = useChatLogic();
  
  const {
    showTaskEditor,
    editingTasks,
    startEditing,
    cancelEditing,
  } = useTaskEditing();
  
  const [showSettings, setShowSettings] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { config, setApiKey, setApiEndpoint } = useAIStore();

  // 监听消息变化，自动打开任务编辑器
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.actions) {
      // 查找 create_task 类型的操作
      const createTaskAction = lastMessage.actions.find(action => action.type === 'create_task');
      
      if (createTaskAction && createTaskAction.data.tasks) {
        console.log('🎯 检测到任务分解结果，自动打开编辑器');
        console.log('📝 任务数量:', createTaskAction.data.tasks.length);
        
        // 自动打开任务编辑器
        startEditing(createTaskAction.data.tasks);
      }
    }
  }, [messages, startEditing]);

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 测试API连接
  const testConnection = async () => {
    if (!config.apiKey) {
      return false;
    }

    setIsTesting(true);
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 测试失败:', response.status, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('API连接测试失败:', error);
      return false;
    } finally {
      setIsTesting(false);
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
    setShowSettings(false);
    alert('✅ API 配置已保存！\n\n如果使用时遇到问题，请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 接口地址是否正确');
  };

  // 处理任务编辑器中的按钮点击
  const handleActionClick = async (action: any) => {
    console.log('🎯 handleActionClick 被调用:', action);
    
    if (action.type === 'create_task' && action.data.tasks) {
      console.log('📝 打开任务编辑器，任务数量:', action.data.tasks.length);
      startEditing(action.data.tasks);
    } else {
      console.log('⚡ 执行其他操作:', action.type);
      await executeActions([action]);
    }
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
      {/* 头部 */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4" style={{ color: textColor }} />
          <span className="font-semibold text-sm" style={{ color: textColor }}>AI智能助手</span>
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: isConfigured ? '#10B981' : '#EF4444',
              boxShadow: isConfigured ? '0 0 4px #10B981' : '0 0 4px #EF4444',
            }}
            title={isConfigured ? 'API已配置' : 'API未配置'}
          />
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
                  value={config.apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 接口地址
                </label>
                <input
                  type="text"
                  value={config.apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称
                </label>
                <select
                  value={config.model}
                  onChange={(e) => useAIStore.getState().setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="deepseek-reasoner">deepseek-reasoner (推理模型，推荐)</option>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-coder">deepseek-coder</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo (OpenAI)</option>
                  <option value="gpt-4">gpt-4 (OpenAI)</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 支持 OpenAI、DeepSeek 等兼容 API。配置后将在所有 AI 功能中生效（收集箱、智能分析等）。
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
                  onClick={async () => {
                    setIsTesting(true);
                    try {
                      const response = await fetch(config.apiEndpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${config.apiKey}`,
                        },
                        body: JSON.stringify({
                          model: config.model,
                          messages: [{ role: 'user', content: 'hi' }],
                          max_tokens: 50,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('API 测试失败:', response.status, errorData);
                        
                        let errorMsg = '❌ 连接失败！\n\n';
                        errorMsg += `状态码: ${response.status}\n`;
                        if (errorData.error) {
                          errorMsg += `错误: ${errorData.error.message || JSON.stringify(errorData.error)}\n`;
                        }
                        errorMsg += '\n可能的原因：\n';
                        errorMsg += '1. API Key 不正确\n';
                        errorMsg += '2. API 配额已用完\n';
                        errorMsg += '3. 网络连接问题';
                        
                        alert(errorMsg);
                      } else {
                        alert('✅ 连接成功！API配置正确。');
                      }
                    } catch (error: any) {
                      console.error('API连接测试失败:', error);
                      alert(`❌ 连接失败！\n\n错误详情: ${error.message}\n\n可能是网络问题或 CORS 限制。`);
                    } finally {
                      setIsTesting(false);
                    }
                  }}
                  disabled={!config.apiKey || isTesting}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? '测试中...' : '🔌 测试连接'}
                </button>
                <button
                  onClick={saveApiSettings}
                  disabled={!config.apiKey}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对话区域 */}
      <div 
        ref={conversationRef} 
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        style={{
          minHeight: 0,
          flex: '1 1 0',
        }}
      >
        {/* 空状态提示 */}
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
                className="w-full rounded-lg p-2 text-sm transition-all hover:scale-[1.02] text-left"
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
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              
              {/* 操作按钮 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-1 space-y-1">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: buttonBg, color: textColor }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="text-xs mt-1" style={{ color: accentColor }}>
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

      {/* 快速指令 */}
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

      {/* 输入区域 */}
      <div className="flex-shrink-0 p-1.5 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-stretch space-x-1.5">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="对我说点什么..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-opacity-50 text-sm"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
            style={{ 
              backgroundColor: '#10B981',
              color: '#ffffff',
              minWidth: '60px',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 统一任务编辑器 */}
      {showTaskEditor && (
        <UnifiedTaskEditor
          tasks={editingTasks}
          onClose={cancelEditing}
          onConfirm={async (tasks) => {
            await executeActions([{
              type: 'create_task',
              data: { tasks: tasks },
              label: '确认',
            }]);
            cancelEditing();
          }}
          isDark={isDark}
        />
      )}
    </div>
  );
}
