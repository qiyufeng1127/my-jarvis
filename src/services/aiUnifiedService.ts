// ============================================
// AI 统一调用服务
// ============================================
// 所有 AI 调用都通过这个服务，统一管理提示词和调用逻辑

import { AI_PROMPTS } from './aiPrompts';
import { useAIStore } from '@/stores/aiStore';
import type { NavigationDifficultyDetourResult, NavigationPlannerResult, NavigationPreferences } from '@/types/navigation';

const toPromptMessage = (
  promptKey: keyof typeof AI_PROMPTS,
  variables: Record<string, any>
) => {
  const prompt = AI_PROMPTS[promptKey];
  let userMessage = prompt.userTemplate;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `\${${key}}`;
    userMessage = userMessage.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
  }

  return {
    prompt,
    messages: [
      { role: 'system' as const, content: prompt.system },
      { role: 'user' as const, content: userMessage },
    ],
  };
};

const tryParseJsonObject = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());

  for (const candidate of candidates) {
    if (!candidate.startsWith('{') && !candidate.startsWith('[')) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // ignore
    }
  }

  return null;
};

const normalizePlannerResult = (parsed: any): NavigationPlannerResult | null => {
  if (!parsed || typeof parsed !== 'object') return null;

  const executionSteps = Array.isArray(parsed.executionSteps) ? parsed.executionSteps : [];
  const timelineGroups = Array.isArray(parsed.timelineGroups) ? parsed.timelineGroups : [];

  if (executionSteps.length === 0 && timelineGroups.length === 0) return null;

  return {
    sessionTitle: typeof parsed.sessionTitle === 'string' && parsed.sessionTitle.trim() ? parsed.sessionTitle.trim() : '导航模式',
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    executionSteps,
    timelineGroups: timelineGroups.map((group: any) => ({
      ...group,
      stepIds: Array.isArray(group?.stepIds) && group.stepIds.length
        ? group.stepIds
        : executionSteps.filter((step: any) => step.groupId === group?.id).map((step: any) => step.id),
    })),
  };
};

const parseEventStreamPlannerResult = (content: string, requireDone: boolean) => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^```(?:json)?$/i, '').replace(/^```$/i, '').trim())
    .filter(Boolean);

  const groups: NavigationPlannerResult['timelineGroups'] = [];
  const steps: NavigationPlannerResult['executionSteps'] = [];
  let sessionTitle = '导航模式';
  let summary = '';
  let hasDone = false;

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'title' && event.sessionTitle) sessionTitle = event.sessionTitle;
      if (event.type === 'summary' && event.summary) summary = event.summary;
      if (event.type === 'group' && event.group) groups.push(event.group);
      if (event.type === 'step' && event.step) steps.push(event.step);
      if (event.type === 'done') hasDone = true;
    } catch {
      // ignore non-complete line
    }
  }

  if (requireDone && !hasDone) return null;
  if (groups.length === 0 && steps.length === 0) return null;

  return {
    sessionTitle,
    summary,
    executionSteps: steps,
    timelineGroups: groups.map((group) => ({
      ...group,
      stepIds: steps.filter((step) => step.groupId === group.id).map((step) => step.id),
    })),
  } satisfies NavigationPlannerResult;
};

const hasMeaningfulPlannerContent = (result: NavigationPlannerResult) => {
  if (!result.executionSteps.length || !result.timelineGroups.length) return false;

  const normalizedStepTitles = result.executionSteps
    .map((step) => String(step.title || '').trim())
    .filter(Boolean);
  const uniqueStepTitles = new Set(normalizedStepTitles.map((title) => title.replace(/\s+/g, '')));
  if (uniqueStepTitles.size < Math.max(2, Math.ceil(normalizedStepTitles.length / 3))) {
    return false;
  }

  const repeatedBadPatterns = normalizedStepTitles.filter((title) => /^(先开始[:：]|先做一下[:：]|先只做第一下[:：])/.test(title)).length;
  if (repeatedBadPatterns >= Math.max(2, Math.ceil(normalizedStepTitles.length / 3))) {
    return false;
  }

  const genericGuidanceCount = result.executionSteps.filter((step) => {
    const guidance = String(step.guidance || '').trim();
    return !guidance || /按现在最顺手的方式|先动起来就可以|接着做/.test(guidance);
  }).length;
  if (genericGuidanceCount >= Math.max(3, Math.ceil(result.executionSteps.length / 2))) {
    return false;
  }

  return true;
};

const tryParsePlannerResult = (content: string): NavigationPlannerResult | null => {
  const parsedObject = tryParseJsonObject(content);
  const normalizedObject = normalizePlannerResult(parsedObject);
  if (normalizedObject) return normalizedObject;

  return parseEventStreamPlannerResult(content, true);
};

const derivePartialPlannerResult = (content: string): Partial<NavigationPlannerResult> | null => {
  const parsedObject = tryParseJsonObject(content);
  const normalizedObject = normalizePlannerResult(parsedObject);
  if (normalizedObject) {
    return normalizedObject;
  }

  const partial = parseEventStreamPlannerResult(content, false);
  if (!partial) {
    return null;
  }

  return {
    sessionTitle: partial.sessionTitle,
    summary: partial.summary,
    executionSteps: partial.executionSteps.length ? partial.executionSteps : undefined,
    timelineGroups: partial.timelineGroups.length ? partial.timelineGroups : undefined,
  };
};

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

    const { prompt, messages } = toPromptMessage(promptKey, variables);

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages,
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
  // 6. 导航模式规划
  // ============================================

  /**
   * 生成导航模式的微步骤与时间轴任务组
   */
  static async planNavigationSession(
    rawInput: string,
    preferences: NavigationPreferences,
    onPartial?: (partial: Partial<NavigationPlannerResult>) => void,
  ): Promise<{
    success: boolean;
    data?: NavigationPlannerResult;
    error?: string;
  }> {
    const aiStore = useAIStore.getState();
    console.log('[导航服务] 进入 planNavigationSession', {
      rawInput,
      hasOnPartial: !!onPartial,
      configured: aiStore.isConfigured(),
      model: aiStore.config.model,
      endpoint: aiStore.config.apiEndpoint,
    });
    if (!aiStore.isConfigured()) {
      return {
        success: false,
        error: '导航智能拆解不可用：AI 未配置，请先完成 API 配置',
      };
    }

    const variables = {
      rawInput,
      customPrompt: preferences.customPrompt,
      granularity: preferences.granularity,
      easyStartMode: preferences.easyStartMode,
      sideTaskIntensity: preferences.sideTaskIntensity,
      tone: preferences.tone,
      homeLayout: preferences.homeLayout,
      parsedRules: JSON.stringify(preferences.parsedRules, null, 2),
      currentTime: new Date().toLocaleString('zh-CN'),
    };

    if (onPartial) {
      const { messages } = toPromptMessage('NAVIGATION_MODE_PLANNER', variables);
      let fullContent = '';
      let lastPartialSignature = '';
      console.log('[导航服务] 进入流式分支', { messagesCount: messages.length });

      const streamResult = await aiStore.chatStream(
        messages,
        (chunk) => {
          console.log('[导航服务] 收到 chunk', chunk);
          fullContent += chunk;
          const partial = derivePartialPlannerResult(fullContent);
          if (partial) {
            const signature = JSON.stringify({
              title: partial.sessionTitle || '',
              summary: partial.summary || '',
              groups: partial.timelineGroups?.map((group) => group.id) || [],
              steps: partial.executionSteps?.map((step) => step.id) || [],
            });
            if (signature !== lastPartialSignature) {
              lastPartialSignature = signature;
              onPartial(partial);
            }
          }
        },
        {
          maxTokens: Math.min(1200, AI_PROMPTS.NAVIGATION_MODE_PLANNER.maxTokens),
          temperature: AI_PROMPTS.NAVIGATION_MODE_PLANNER.temperature,
        }
      );

      const finalParsed = streamResult.content ? tryParsePlannerResult(streamResult.content) : null;
      console.log('[导航服务] 流式请求完成', { streamResult, finalParsed });
      if (streamResult.success && finalParsed && hasMeaningfulPlannerContent(finalParsed)) {
        return {
          success: true,
          data: finalParsed,
        };
      }

      return {
        success: false,
        error: streamResult.error || (finalParsed ? '导航智能拆解质量过低：结果像在重复原话，请调整提示词后重试' : '导航智能拆解失败：AI 返回内容不符合预期格式'),
      };
    }

    const aiResult = await this.callAI('NAVIGATION_MODE_PLANNER', variables);

    if (aiResult.success && aiResult.data && hasMeaningfulPlannerContent(aiResult.data as NavigationPlannerResult)) {
      return {
        success: true,
        data: aiResult.data as NavigationPlannerResult,
      };
    }

    return {
      success: false,
      error: aiResult.success ? '导航智能拆解质量过低：结果像在重复原话，请调整提示词后重试' : (aiResult.error || '导航智能拆解失败，请稍后重试'),
    };
  }

  static async resolveNavigationDifficulty(
    context: {
      rawInput: string;
      sessionTitle: string;
      currentStepTitle: string;
      currentStepGuidance: string;
      recentSteps: Array<{ title: string; guidance: string }>;
      userDifficulty: string;
    },
    preferences: NavigationPreferences
  ): Promise<{
    success: boolean;
    data?: NavigationDifficultyDetourResult;
    error?: string;
  }> {
    return await this.callAI('NAVIGATION_DIFFICULTY_GUIDE', {
      rawInput: context.rawInput,
      sessionTitle: context.sessionTitle,
      currentStepTitle: context.currentStepTitle,
      currentStepGuidance: context.currentStepGuidance,
      recentSteps: JSON.stringify(context.recentSteps, null, 2),
      userDifficulty: context.userDifficulty,
      customPrompt: preferences.customPrompt,
      tone: preferences.tone,
      homeLayout: preferences.homeLayout,
      currentTime: new Date().toLocaleString('zh-CN'),
    });
  }

  // ============================================
  // 7. 智能对话
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

