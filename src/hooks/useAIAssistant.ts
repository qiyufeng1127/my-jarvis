import { useState, useCallback, useEffect } from 'react';
import { aiIntegrationService } from '@/services/aiIntegrationService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';

/**
 * AI 助手 Hook
 * 提供完整的 AI 交互功能
 */
export function useAIAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const personality = useAIPersonalityStore(state => state.personality);
  const chatHistory = useAIPersonalityStore(state => state.chatHistory);
  const updatePersonality = useAIPersonalityStore(state => state.updatePersonality);
  const applyPreset = useAIPersonalityStore(state => state.applyPreset);
  const clearHistory = useAIPersonalityStore(state => state.clearHistory);
  
  /**
   * 发送消息给 AI
   */
  const sendMessage = useCallback(async (message: string, inputMode?: 'auto' | 'goal' | 'task' | 'timeline' | 'thought') => {
    if (!message.trim()) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await aiIntegrationService.handleUserInput(message, inputMode);
      
      if (!result.success) {
        setError(result.error || '处理失败');
        return null;
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * 切换性格预设
   */
  const changePersonality = useCallback((preset: 'gentle' | 'strict' | 'humorous' | 'analytical' | 'bestie' | 'chill') => {
    applyPreset(preset);
  }, [applyPreset]);
  
  /**
   * 自定义性格参数
   */
  const customizePersonality = useCallback((updates: Partial<typeof personality>) => {
    updatePersonality(updates);
  }, [updatePersonality]);
  
  /**
   * 启动行为监控
   */
  useEffect(() => {
    aiIntegrationService.startBehaviorMonitoring();
  }, []);
  
  return {
    // 状态
    isProcessing,
    error,
    personality,
    chatHistory,
    
    // 方法
    sendMessage,
    changePersonality,
    customizePersonality,
    clearHistory,
    
    // 工具方法
    updateUserBehavior: aiIntegrationService.updateUserBehavior.bind(aiIntegrationService),
  };
}

