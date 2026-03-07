import { aiAssistantService } from './aiAssistantService';
import { useAIPersonalityStore } from '@/stores/aiPersonalityStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useTagStore } from '@/stores/tagStore';

/**
 * AI 助手集成服务
 * 连接 FloatingAIChat 和完整的 AI 系统提示词
 */
class AIIntegrationService {
  /**
   * 处理用户输入（主入口）
   */
  async handleUserInput(userInput: string): Promise<{
    success: boolean;
    response: string;
    actions?: Array<{
      type: string;
      description: string;
      data?: any;
    }>;
    error?: string;
  }> {
    try {
      // 1. 获取对话历史
      const personalityStore = useAIPersonalityStore.getState();
      const conversationHistory = personalityStore.chatHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // 2. 获取用户行为数据
      const userBehavior = personalityStore.userBehavior;
      
      // 3. 调用 AI 助手服务
      const result = await aiAssistantService.processUserInput(userInput, {
        conversationHistory,
        userBehavior,
      });
      
      if (!result.success) {
        return {
          success: false,
          response: '抱歉，我遇到了一些问题，请稍后再试。',
          error: result.error,
        };
      }
      
      // 4. 执行操作（先执行操作，再回复）
      const actions: Array<{ type: string; description: string; data?: any }> = [];
      
      if (result.intent && result.action && result.parameters) {
        console.log('🎯 [AI集成] 识别意图:', result.intent);
        console.log('🎯 [AI集成] 执行操作:', result.action);
        console.log('🎯 [AI集成] 参数:', result.parameters);
        
        const executeResult = await aiAssistantService.executeAction(
          result.intent,
          result.action,
          result.parameters
        );
        
        if (executeResult.success) {
          actions.push({
            type: result.intent,
            description: executeResult.message || '操作成功',
            data: executeResult.data,
          });
          
          console.log('✅ [AI集成] 操作执行成功:', executeResult.message);
        } else {
          console.error('❌ [AI集成] 操作执行失败:', executeResult.error);
        }
      }
      
      // 5. 构建完整的回复（包含操作确认）
      let fullResponse = result.response || '好的，我明白了。';
      
      if (actions.length > 0) {
        // 在回复前添加操作确认
        const actionConfirmations = actions.map(a => `✅ ${a.description}`).join('\n');
        fullResponse = `${actionConfirmations}\n\n${fullResponse}`;
      }
      
      // 6. 保存对话记录
      personalityStore.addMessage({
        role: 'user',
        content: userInput,
      });
      
      personalityStore.addMessage({
        role: 'assistant',
        content: fullResponse,
        actions: actions.length > 0 ? actions : undefined,
      });
      
      // 7. 返回结果
      return {
        success: true,
        response: fullResponse,
        actions: actions.length > 0 ? actions : undefined,
      };
    } catch (error) {
      console.error('❌ [AI集成] 处理失败:', error);
      return {
        success: false,
        response: '抱歉，处理您的请求时出错了。',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }
  
  /**
   * 更新用户行为数据
   */
  updateUserBehavior(behavior: {
    lastMealTime?: number;
    lastSleepTime?: number;
    lastWakeTime?: number;
    consecutiveCompletedDays?: number;
    todayTaskCompletionRate?: number;
  }) {
    const personalityStore = useAIPersonalityStore.getState();
    personalityStore.updateUserBehavior(behavior);
  }
  
  /**
   * 切换性格预设
   */
  applyPersonalityPreset(preset: 'gentle' | 'strict' | 'humorous' | 'analytical' | 'bestie' | 'chill') {
    const personalityStore = useAIPersonalityStore.getState();
    personalityStore.applyPreset(preset);
  }
  
  /**
   * 自定义性格参数
   */
  updatePersonality(personality: {
    name?: string;
    avatar?: string;
    callUserAs?: string;
    type?: 'gentle' | 'strict' | 'humorous' | 'analytical' | 'bestie' | 'chill';
    strictness?: number;
    humor?: number;
    formality?: number;
    emoji?: number;
    verbosity?: number;
    customPrompt?: string;
  }) {
    const personalityStore = useAIPersonalityStore.getState();
    personalityStore.updatePersonality(personality);
  }
  
  /**
   * 获取当前性格设置
   */
  getPersonality() {
    const personalityStore = useAIPersonalityStore.getState();
    return personalityStore.personality;
  }
  
  /**
   * 获取对话历史
   */
  getChatHistory() {
    const personalityStore = useAIPersonalityStore.getState();
    return personalityStore.chatHistory;
  }
  
  /**
   * 清空对话历史
   */
  clearChatHistory() {
    const personalityStore = useAIPersonalityStore.getState();
    personalityStore.clearHistory();
  }
  
  /**
   * 监控用户行为并自动更新
   */
  startBehaviorMonitoring() {
    // 监控任务完成率
    const updateTaskCompletionRate = () => {
      const taskStore = useTaskStore.getState();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTasks = taskStore.tasks.filter(task => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
      
      const completedTasks = todayTasks.filter(task => task.status === 'completed');
      const completionRate = todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0;
      
      this.updateUserBehavior({
        todayTaskCompletionRate: completionRate,
      });
    };
    
    // 每分钟更新一次
    setInterval(updateTaskCompletionRate, 60000);
    updateTaskCompletionRate(); // 立即执行一次
  }
}

export const aiIntegrationService = new AIIntegrationService();

