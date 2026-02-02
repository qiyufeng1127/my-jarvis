// ============================================
// AI 统一调用服务
// ============================================
// 所有 AI 调用都通过这个服务，统一管理提示词和调用逻辑

import { AI_PROMPTS } from './aiPrompts';
import { useAIStore } from '@/stores/aiStore';

/**
 * AI 调用响应
 */
interface AICallResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * AI 统一调用服务类
 */
export class AIUnifiedService {
  
  /**
   * 核心调用方法 - 所有 AI 调用都通过这里
   */
  private static async callAI(
    promptKey: keyof typeof AI_PROMPTS,
    variables: Record<string, any>
  ): Promise<AICallResponse> {
    // 获取 API 配置
    const { config, isConfigured } = useAIStore.getState();
    
    if (!isConfigured()) {
      return {
        success: false,
        error: 'API Key 未配置，请先在 AI 设置中配置',
      };
    }

    const prompt = AI_PROMPTS[promptKey];
    
    // 替换模板变量
    let userMessage = prompt.userTemplate;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `\${${key}}`;
      userMessage = userMessage.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
    }

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: userMessage }
          ],
          temperature: prompt.temperature,
          max_tokens: prompt.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'AI 调用失败',
        };
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // 尝试解析 JSON（如果提示词要求返回 JSON）
      let parsedData = aiResponse;
      try {
        // 提取 JSON（处理可能的 markdown 代码块）
        let jsonStr = aiResponse.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        
        // 尝试解析为 JSON
        if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
          parsedData = JSON.parse(jsonStr);
        }
      } catch (e) {
        // 如果不是 JSON，保持原始文本
        parsedData = aiResponse;
      }

      return {
        success: true,
        data: parsedData,
      };
    } catch (error) {
      console.error('AI 调用错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // ============================================
  // 1. 任务分析
  // ============================================
  
  /**
   * 分析单个任务的属性
   * @param taskTitle 任务标题
   * @param extractedDuration 用户指定的时长（可选）
   */
  static async analyzeTask(
    taskTitle: string,
    extractedDuration?: number
  ): Promise<{
    success: boolean;
    data?: {
      tags: string[];
      location: string;
      duration: number;
      taskType: string;
      category: string;
    };
    error?: string;
  }> {
    return await this.callAI('TASK_ANALYZER', {
      taskTitle,
      extractedDuration: extractedDuration || '',
    });
  }

  // ============================================
  // 2. 时间轴操作
  // ============================================
  
  /**
   * 解析时间轴操作指令
   * @param input 用户输入
   * @param existingTasks 现有任务列表
   */
  static async parseTimelineOperation(
    input: string,
    existingTasks: any[]
  ): Promise<{
    success: boolean;
    data?: {
      operation: 'delete' | 'move' | 'modify' | 'add' | 'delay';
      filters?: any;
      newTask?: any;
      delayMinutes?: number;
    };
    error?: string;
  }> {
    const tasksList = existingTasks
      .map((t, i) => `${i + 1}. ${t.title} (${t.scheduledStart ? new Date(t.scheduledStart).toLocaleString('zh-CN') : ''})`)
      .join('\n');

    return await this.callAI('TIMELINE_OPERATOR', {
      input,
      currentTime: new Date().toLocaleString('zh-CN'),
      tasksList,
    });
  }

  // ============================================
  // 3. 副业追踪
  // ============================================
  
  /**
   * 解析副业收入支出指令
   * @param input 用户输入
   * @param existingSideHustles 现有副业列表
   */
  static async parseMoneyCommand(
    input: string,
    existingSideHustles: any[]
  ): Promise<{
    success: boolean;
    data?: {
      type: 'income' | 'expense' | 'create_side_hustle' | 'debt' | 'idea';
      sideHustleName?: string;
      sideHustleId?: string;
      amount?: number;
      description?: string;
      confidence: number;
    };
    error?: string;
  }> {
    const hustlesList = existingSideHustles
      .map((h, i) => `${i + 1}. ${h.icon} ${h.name}`)
      .join('\n');

    return await this.callAI('MONEY_TRACKER', {
      input,
      hustlesList,
    });
  }

  // ============================================
  // 4. 内容分类
  // ============================================
  
  /**
   * 智能分类用户输入内容
   * @param message 用户输入
   */
  static async classifyContent(
    message: string
  ): Promise<{
    success: boolean;
    data?: {
      contentType: 'task' | 'mood' | 'thought' | 'gratitude' | 'success' | 'startup' | 'timeline_control';
      targetComponent: 'timeline' | 'memory' | 'journal' | 'sidehustle' | 'none';
      emotionTags: string[];
      categoryTags: string[];
      confidence: number;
      reason: string;
    };
    error?: string;
  }> {
    return await this.callAI('CONTENT_CLASSIFIER', {
      message,
    });
  }

  // ============================================
  // 5. 任务分解
  // ============================================
  
  /**
   * 将复杂任务分解为多个子任务
   * @param taskDescription 任务描述
   * @param currentTime 当前时间
   */
  static async decomposeTask(
    taskDescription: string,
    currentTime?: Date
  ): Promise<{
    success: boolean;
    data?: {
      tasks: Array<{
        title: string;
        duration: number;
        startTime: string;
        category: string;
        priority: 'low' | 'medium' | 'high';
        location: string;
      }>;
    };
    error?: string;
  }> {
    const now = currentTime || new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return await this.callAI('TASK_DECOMPOSER', {
      taskDescription,
      currentTime: timeStr,
    });
  }

  // ============================================
  // 6. 智能对话
  // ============================================
  
  /**
   * 与用户进行自然对话
   * @param userMessage 用户消息
   * @param conversationHistory 对话历史（可选）
   */
  static async chat(
    userMessage: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    // 如果有对话历史，需要特殊处理
    if (conversationHistory && conversationHistory.length > 0) {
      const { config, isConfigured } = useAIStore.getState();
      
      if (!isConfigured()) {
        return {
          success: false,
          error: 'API Key 未配置',
        };
      }

      const prompt = AI_PROMPTS.CHAT_ASSISTANT;

      try {
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'deepseek-chat',
            messages: [
              { role: 'system', content: prompt.system },
              ...conversationHistory,
              { role: 'user', content: userMessage }
            ],
            temperature: prompt.temperature,
            max_tokens: prompt.maxTokens,
          }),
        });

        if (!response.ok) {
          return { success: false, error: 'AI 调用失败' };
        }

        const data = await response.json();
        return {
          success: true,
          data: data.choices[0]?.message?.content || '',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        };
      }
    }

    // 没有对话历史，使用简单调用
    return await this.callAI('CHAT_ASSISTANT', {
      userMessage,
    });
  }

  // ============================================
  // 7. 成长故事生成
  // ============================================
  
  /**
   * 生成成长故事
   * @param period 时间周期
   * @param stats 统计数据
   */
  static async generateGrowthStory(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    stats: {
      tasksCompleted: number;
      totalTasks: number;
      focusTime: number;
      goldEarned: number;
      growthPoints: number;
      habits: Array<{ name: string; count: number }>;
    }
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    const periodNames = {
      daily: '今日',
      weekly: '本周',
      monthly: '本月',
      yearly: '今年',
    };

    const focusHours = Math.floor(stats.focusTime / 60);
    const focusMinutes = stats.focusTime % 60;

    return await this.callAI('GROWTH_STORY', {
      period: periodNames[period],
      tasksCompleted: stats.tasksCompleted,
      totalTasks: stats.totalTasks,
      focusTime: `${focusHours}小时${focusMinutes}分钟`,
      goldEarned: stats.goldEarned,
      growthPoints: stats.growthPoints,
      habits: stats.habits.map(h => `${h.name}(${h.count}次)`).join('、'),
    });
  }

  // ============================================
  // 8. 个性化建议
  // ============================================
  
  /**
   * 生成个性化建议
   * @param context 用户上下文
   */
  static async getSuggestions(
    context: {
      recentTasks: string[];
      recentMoods: string[];
      goals: string[];
    }
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    return await this.callAI('SUGGESTIONS', {
      recentTasks: context.recentTasks.join('、'),
      recentMoods: context.recentMoods.join('、'),
      goals: context.goals.join('、'),
    });
  }

  // ============================================
  // 9. 图片验证
  // ============================================
  
  /**
   * 验证任务完成图片
   * @param imageBase64 图片 Base64
   * @param requirement 验证要求
   * @param taskTitle 任务标题
   */
  static async verifyTaskImage(
    imageBase64: string,
    requirement: string,
    taskTitle: string
  ): Promise<{
    success: boolean;
    data?: {
      isValid: boolean;
      confidence: number;
      reason: string;
    };
    error?: string;
  }> {
    // 注意：这个功能需要支持视觉的模型（如 GPT-4 Vision）
    // 当前实现仅作为占位符
    return await this.callAI('IMAGE_VERIFIER', {
      taskTitle,
      requirement,
    });
  }

  // ============================================
  // 10. 文件验证
  // ============================================
  
  /**
   * 验证任务完成文件
   * @param fileName 文件名
   * @param fileSize 文件大小（字节）
   * @param fileType 文件类型
   * @param requirement 验证要求
   * @param taskTitle 任务标题
   */
  static async verifyTaskFile(
    fileName: string,
    fileSize: number,
    fileType: string,
    requirement: string,
    taskTitle: string
  ): Promise<{
    success: boolean;
    data?: {
      isValid: boolean;
      confidence: number;
      reason: string;
    };
    error?: string;
  }> {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    return await this.callAI('FILE_VERIFIER', {
      fileName,
      fileSize: fileSizeMB,
      fileType,
      requirement,
      taskTitle,
    });
  }
}

/**
 * 导出便捷方法
 */
export const aiUnified = {
  // 任务相关
  analyzeTask: AIUnifiedService.analyzeTask.bind(AIUnifiedService),
  decomposeTask: AIUnifiedService.decomposeTask.bind(AIUnifiedService),
  
  // 时间轴相关
  parseTimelineOperation: AIUnifiedService.parseTimelineOperation.bind(AIUnifiedService),
  
  // 副业追踪相关
  parseMoneyCommand: AIUnifiedService.parseMoneyCommand.bind(AIUnifiedService),
  
  // 内容分类
  classifyContent: AIUnifiedService.classifyContent.bind(AIUnifiedService),
  
  // 对话相关
  chat: AIUnifiedService.chat.bind(AIUnifiedService),
  
  // 成长相关
  generateGrowthStory: AIUnifiedService.generateGrowthStory.bind(AIUnifiedService),
  getSuggestions: AIUnifiedService.getSuggestions.bind(AIUnifiedService),
  
  // 验证相关
  verifyTaskImage: AIUnifiedService.verifyTaskImage.bind(AIUnifiedService),
  verifyTaskFile: AIUnifiedService.verifyTaskFile.bind(AIUnifiedService),
};

