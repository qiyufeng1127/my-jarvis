import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Sparkles, X } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import AIPersonalitySettings from './AIPersonalitySettings';

/**
 * AI 助手聊天界面（使用完整系统提示词）
 */
export default function AIAssistantChat() {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isProcessing,
    error,
    personality,
    chatHistory,
    sendMessage,
    changePersonality,
    customizePersonality,
    clearHistory,
  } = useAIAssistant();
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const message = input.trim();
    setInput('');
    
    const result = await sendMessage(message);
    
    if (result?.actions && result.actions.length > 0) {
      // 显示操作结果
      console.log('执行的操作:', result.actions);
    }
  };
  
  // 快捷输入示例
  const quickInputs = [
    '5分钟后洗漱，然后洗衣服',
    '今天心情不错',
    '记账：午餐花了50元',
    '查看今天的任务',
  ];
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{personality.avatar}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {personality.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {personality.type === 'gentle' && '温柔鼓励型'}
              {personality.type === 'strict' && '严格督促型'}
              {personality.type === 'humorous' && '幽默吐槽型'}
              {personality.type === 'analytical' && '理性分析型'}
              {personality.type === 'bestie' && '闺蜜陪伴型'}
              {personality.type === 'chill' && '佛系随和型'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="性格设置"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* 性格设置面板 */}
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <AIPersonalitySettings />
        </div>
      )}
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              你好！我是 {personality.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              我可以帮你管理任务、记录心情、记账等等
            </p>
            
            {/* 快捷输入 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickInputs.map((text, index) => (
                <button
                  key={index}
                  onClick={() => setInput(text)}
                  className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              {/* 消息内容 */}
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* 执行的操作 */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-700/50 space-y-1">
                  {message.actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 dark:text-green-300">✓</span>
                      <span className="flex-1">{action.description}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 时间戳 */}
              <div className="text-xs opacity-50 mt-1">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 处理中指示器 */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入框 */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`跟 ${personality.name} 说点什么...`}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            按 Enter 发送，Shift + Enter 换行
          </p>
          
          {chatHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              清空对话
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

