// ============================================
// AI 统一调用服务
// ============================================
// 所有 AI 调用都通过这个服务，统一管理提示词和调用逻辑

import { AI_PROMPTS } from './aiPrompts';
import { useAIStore } from '@/stores/aiStore';
import type { NavigationInsertedFlowResult, NavigationPlannerResult, NavigationPreferences, NavigationSession } from '@/types/navigation';

const normalizeInlineText = (value: string) => value.replace(/\s+/g, ' ').trim();

const pickInsertedFlowLeadTitle = (plan?: NavigationPlannerResult | null) => {
  if (!plan) return '';

  return normalizeInlineText(
    plan.timelineGroups[0]?.title
      || plan.sessionTitle
      || plan.executionSteps[0]?.title
      || ''
  );
};

const buildInsertedFlowAssistantMessage = (
  context: {
    currentStepTitle: string;
    userDifficulty: string;
  },
  plan: NavigationPlannerResult,
) => {
  const leadTitle = pickInsertedFlowLeadTitle(plan) || '你现在更想先做的这段事';
  const currentStepTitle = normalizeInlineText(context.currentStepTitle || '刚才那一步');
  const userDifficulty = normalizeInlineText(context.userDifficulty || '');
  const feelsStuck = /(卡住|不会|不想|不太想|没法|做不到|难受|好累|好烦|不知道|不知|先缓|拖延)/.test(userDifficulty);

  if (feelsStuck) {
    return `好，我们先不硬顶「${currentStepTitle}」。先把「${leadTitle}」这一段顺一顺，我已经帮你拆成更容易开始的小步了。做完这一段后，我们再慢慢接回「${currentStepTitle}」。`;
  }

  return `好，那我们就先顺着你现在更想做的这段来：先做「${leadTitle}」。我已经把它理成几小步了，你先照着往前走，做完我们再回到「${currentStepTitle}」。`;
};

const TIMELINE_BAD_TITLE_PATTERNS = [
  /超简单的开始动作/,
  /完成一个.*开始动作/,
  /先开始[:：]?/,
  /先做一下[:：]?/,
  /轻轻开始/,
  /顺手整理/,
  /顺手收拾/,
  /按现在最顺手的方式/,
];

const cleanTimelineTitleText = (title: string) => title
  .replace(/^\d+[、.．]\s*/, '')
  .replace(/^先(开始|做一下)[:：]?/, '')
  .replace(/完成一个超简单的开始动作/g, '')
  .replace(/完成一个开始动作/g, '')
  .replace(/轻轻开始/g, '')
  .replace(/顺手整理好?/g, '')
  .replace(/顺手收拾好?/g, '')
  .replace(/按现在最顺手的方式/g, '')
  .replace(/[，,、]{2,}/g, '、')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeTimelineGroups = (
  groups: any[],
  executionSteps: any[],
): NavigationPlannerResult['timelineGroups'] => {
  const validStepIds = new Set(executionSteps.map((step: any) => step.id));

  return groups
    .map((group: any) => {
      const stepIds = Array.isArray(group?.stepIds) && group.stepIds.length
        ? group.stepIds.filter((stepId: string) => validStepIds.has(stepId))
        : executionSteps.filter((step: any) => step.groupId === group?.id).map((step: any) => step.id);
      const cleanedTitle = cleanTimelineTitleText(String(group?.title || ''));
      const resolvedTitle = cleanedTitle || '整理一下这件事';

      return {
        ...group,
        title: resolvedTitle,
        description: typeof group?.description === 'string' ? group.description.trim() : '',
        stepIds,
      };
    })
    .filter((group: any) => group.stepIds.length > 0 || group.title);
};


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

const tryParsePartialJsonObject = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = (fencedMatch?.[1] || trimmed).trim();
  const startIndex = source.indexOf('{');
  if (startIndex < 0) return null;

  const text = source.slice(startIndex);
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastSafeIndex = -1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
        lastSafeIndex = i;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      stack.push('}');
      lastSafeIndex = i;
      continue;
    }

    if (char === '[') {
      stack.push(']');
      lastSafeIndex = i;
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack[stack.length - 1] === char) {
        stack.pop();
      }
      lastSafeIndex = i;
      continue;
    }

    if (!/\s/.test(char)) {
      lastSafeIndex = i;
    }
  }

  if (lastSafeIndex < 0) return null;

  const candidate = `${text.slice(0, lastSafeIndex + 1).replace(/,\s*$/, '')}${stack.reverse().join('')}`;
  return tryParseLooseJson(candidate);
};

const normalizePlannerResult = (parsed: any, rawInput?: string): NavigationPlannerResult | null => {
  if (!parsed || typeof parsed !== 'object') return null;

  const executionSteps = Array.isArray(parsed.executionSteps) ? parsed.executionSteps : [];
  const timelineGroups = Array.isArray(parsed.timelineGroups) ? parsed.timelineGroups : [];

  if (executionSteps.length === 0 && timelineGroups.length === 0) return null;

  return {
    sessionTitle: typeof parsed.sessionTitle === 'string' && parsed.sessionTitle.trim() ? parsed.sessionTitle.trim() : '导航模式',
    summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    executionSteps,
    timelineGroups: normalizeTimelineGroups(timelineGroups, executionSteps),
  };
};

const tryParseLooseJson = (candidate: string) => {
  const normalized = candidate.trim();
  if (!normalized) return null;

  const variants = [
    normalized,
    normalized.replace(/,\s*([}\]])/g, '$1'),
    normalized
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
      .replace(/:\s*([A-Za-z_][A-Za-z0-9_-]*)(\s*[,}])/g, ': "$1"$2')
      .replace(/,\s*([}\]])/g, '$1'),
  ];

  for (const variant of variants) {
    try {
      return JSON.parse(variant);
    } catch {
      // ignore
    }
  }

  return null;
};

const extractJsonObjectsFromText = (content: string) => {
  const results: any[] = [];
  const text = content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n');

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = text.slice(start, i + 1).trim();
        const parsed = tryParseLooseJson(candidate);
        if (parsed) {
          results.push(parsed);
        }
        start = -1;
      }
    }
  }

  if (results.length === 0) {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    let buffer = '';
    for (const line of lines) {
      buffer += (buffer ? '\n' : '') + line;
      const parsed = tryParseLooseJson(buffer);
      if (parsed) {
        results.push(parsed);
        buffer = '';
      }
    }
  }

  return results;
};

const parseEventStreamPlannerResult = (content: string, requireDone: boolean, rawInput?: string) => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const events = extractJsonObjectsFromText(trimmed);
  const groups: NavigationPlannerResult['timelineGroups'] = [];
  const steps: NavigationPlannerResult['executionSteps'] = [];
  let sessionTitle = '导航模式';
  let summary = '';
  let hasDone = false;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    if (event.type === 'title' && event.sessionTitle) sessionTitle = event.sessionTitle;
    if (event.type === 'summary' && event.summary) summary = event.summary;
    if (event.type === 'group' && event.group) groups.push(event.group);
    if (event.type === 'step' && event.step) steps.push(event.step);
    if (event.type === 'done') hasDone = true;
  }

  if (requireDone && !hasDone) return null;
  if (groups.length === 0 && steps.length === 0) return null;

  return {
    sessionTitle,
    summary,
    executionSteps: steps,
    timelineGroups: normalizeTimelineGroups(groups, steps),
  } satisfies NavigationPlannerResult;
};

const estimateNavigationActionCount = (rawInput?: string) => {
  const normalized = (rawInput || '')
    .replace(/[\n\r]+/g, '，')
    .replace(/[；;。！？!?.]+/g, '，');

  const segments = normalized
    .split(/(?:，|、|然后|接着|之后|再|顺便|并且|而且|并|以及)/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);

  return Math.max(segments.length, 1);
};

const normalizeCompareText = (value?: string) => (value || '').replace(/[\s，,、；;。！？!?.]/g, '').trim();

const getPlannerCoveredTitles = (result?: NavigationPlannerResult | null) => {
  if (!result) return [];

  return [
    ...result.timelineGroups.map((group) => group.title),
    ...result.executionSteps.map((step) => step.title),
  ]
    .map((title) => title.trim())
    .filter(Boolean);
};

const extractMissingNavigationTitles = (allTitles: string[], result?: NavigationPlannerResult | null) => {
  const coveredTitles = getPlannerCoveredTitles(result);
  const coveredNormalized = coveredTitles.map((title) => normalizeCompareText(title)).filter(Boolean);

  return allTitles.filter((title) => {
    const normalizedTitle = normalizeCompareText(title);
    if (!normalizedTitle) return false;
    return !coveredNormalized.some((covered) => covered.includes(normalizedTitle) || normalizedTitle.includes(covered));
  });
};

const mergePlannerResults = (base: NavigationPlannerResult, tail: NavigationPlannerResult): NavigationPlannerResult => {
  const existingGroupIds = new Set(base.timelineGroups.map((group) => group.id));
  const existingStepIds = new Set(base.executionSteps.map((step) => step.id));
  const groupIdMap = new Map<string, string>();

  const mergedGroups = [...base.timelineGroups];
  tail.timelineGroups.forEach((group, index) => {
    let nextGroupId = group.id || `g-tail-${index + 1}`;
    while (existingGroupIds.has(nextGroupId)) {
      nextGroupId = `${nextGroupId}-tail`;
    }
    existingGroupIds.add(nextGroupId);
    groupIdMap.set(group.id, nextGroupId);
    mergedGroups.push({
      ...group,
      id: nextGroupId,
      stepIds: [],
    });
  });

  const mergedSteps = [...base.executionSteps];
  tail.executionSteps.forEach((step, index) => {
    let nextStepId = step.id || `s-tail-${index + 1}`;
    while (existingStepIds.has(nextStepId)) {
      nextStepId = `${nextStepId}-tail`;
    }
    existingStepIds.add(nextStepId);
    mergedSteps.push({
      ...step,
      id: nextStepId,
      groupId: groupIdMap.get(step.groupId) || step.groupId,
    });
  });

  return {
    sessionTitle: base.sessionTitle || tail.sessionTitle || '导航模式',
    summary: base.summary || tail.summary || '',
    executionSteps: mergedSteps,
    timelineGroups: normalizeTimelineGroups(mergedGroups, mergedSteps),
  };
};

const hasSufficientPlannerCoverage = (result: NavigationPlannerResult, rawInput?: string) => {
  const estimatedActionCount = estimateNavigationActionCount(rawInput);
  const stepCount = result.executionSteps.length;
  const groupCount = result.timelineGroups.length;

  if (estimatedActionCount <= 4) {
    return stepCount >= estimatedActionCount && groupCount >= Math.min(estimatedActionCount, 2);
  }

  const requiredGroupCount = Math.max(3, Math.ceil(estimatedActionCount * 0.6));
  const requiredStepCount = Math.max(estimatedActionCount, Math.ceil(estimatedActionCount * 1.2));

  return stepCount >= requiredStepCount && groupCount >= requiredGroupCount;
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

const tryParsePlannerResult = (content: string, rawInput?: string): NavigationPlannerResult | null => {
  const parsedObject = tryParseJsonObject(content);
  const normalizedObject = normalizePlannerResult(parsedObject, rawInput);
  if (normalizedObject) return normalizedObject;

  return parseEventStreamPlannerResult(content, true, rawInput);
};

const derivePartialPlannerResult = (content: string, rawInput?: string): Partial<NavigationPlannerResult> | null => {
  const partial = parseEventStreamPlannerResult(content, false, rawInput);
  if (partial) {
    return {
      sessionTitle: partial.sessionTitle,
      summary: partial.summary,
      executionSteps: partial.executionSteps.length ? partial.executionSteps : undefined,
      timelineGroups: partial.timelineGroups.length ? partial.timelineGroups : undefined,
    };
  }

  const parsedObject = tryParseJsonObject(content);
  const normalizedObject = normalizePlannerResult(parsedObject, rawInput);
  if (normalizedObject) {
    return normalizedObject;
  }

  if (!content.includes('\n')) {
    return null;
  }

  const partialObject = tryParsePartialJsonObject(content);
  const normalizedPartialObject = normalizePlannerResult(partialObject, rawInput);
  if (normalizedPartialObject) {
    return normalizedPartialObject;
  }

  return null;
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
      let latestMeaningfulPartial: NavigationPlannerResult | null = null;
      console.log('[导航服务] 进入流式分支', { messagesCount: messages.length });

      const streamResult = await aiStore.chatStream(
        messages,
        (chunk) => {
          fullContent += chunk;
          const partial = derivePartialPlannerResult(fullContent, rawInput);
          if (!partial) {
            if (fullContent.length % 400 < chunk.length) {
              console.log('[导航服务] 尚未解析出完整事件', {
                contentLength: fullContent.length,
                tail: fullContent.slice(-220),
              });
            }
            return;
          }

          const signature = JSON.stringify({
            title: partial.sessionTitle || '',
            summary: partial.summary || '',
            groups: partial.timelineGroups?.map((group) => group.id) || [],
            steps: partial.executionSteps?.map((step) => step.id) || [],
          });
          if (signature !== lastPartialSignature) {
            lastPartialSignature = signature;
            const normalizedPartial: NavigationPlannerResult = {
              sessionTitle: partial.sessionTitle || '导航模式',
              summary: partial.summary || '',
              executionSteps: partial.executionSteps || [],
              timelineGroups: partial.timelineGroups || [],
            };
            if (hasMeaningfulPlannerContent(normalizedPartial)) {
              latestMeaningfulPartial = normalizedPartial;
            }
            console.log('[导航服务] 解析到流式进度', {
              title: normalizedPartial.sessionTitle,
              groups: normalizedPartial.timelineGroups.length,
              steps: normalizedPartial.executionSteps.length,
            });
            onPartial(partial);
          }
        },
        {
          maxTokens: AI_PROMPTS.NAVIGATION_MODE_PLANNER.maxTokens,
          temperature: AI_PROMPTS.NAVIGATION_MODE_PLANNER.temperature,
        }
      );

      const finalParsed = streamResult.content ? tryParsePlannerResult(streamResult.content, rawInput) : null;
      const finalParsedIsComplete = !!(finalParsed && hasMeaningfulPlannerContent(finalParsed) && hasSufficientPlannerCoverage(finalParsed, rawInput));
      const partialIsComplete = !!(latestMeaningfulPartial && hasSufficientPlannerCoverage(latestMeaningfulPartial, rawInput));
      const resolvedResult = finalParsedIsComplete
        ? finalParsed
        : partialIsComplete
          ? latestMeaningfulPartial
          : null;
      console.log('[导航服务] 流式请求完成', {
        success: streamResult.success,
        error: streamResult.error,
        contentLength: streamResult.content?.length || 0,
        finalParsed,
        latestMeaningfulPartial,
        resolvedResult,
        finalParsedIsComplete,
        partialIsComplete,
      });
      if (streamResult.success && resolvedResult) {
        return {
          success: true,
          data: resolvedResult,
        };
      }

      return {
        success: false,
        error: streamResult.error || (finalParsed || latestMeaningfulPartial ? '这次 AI 在收尾时格式有点乱，但前面已经拆出一版结果了' : '导航智能拆解失败：AI 返回内容不符合预期格式'),
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
      error: aiResult.success ? '这次 AI 生成出来的拆解质量不够好，你可以返回改一下描述再试一次' : (aiResult.error || '导航智能拆解失败，请稍后重试'),
    };
  }

  static async regenerateTimelineTitles(
    rawInput: string,
    currentGroups: NavigationPlannerResult['timelineGroups']
  ): Promise<{
    success: boolean;
    data?: NavigationPlannerResult['timelineGroups'];
    error?: string;
  }> {
    const aiResult = await this.callAI('NAVIGATION_TIMELINE_GROUPER', {
      rawInput,
    });

    const titles = Array.isArray(aiResult.data?.titles)
      ? aiResult.data.titles.map((title: unknown) => cleanTimelineTitleText(String(title || ''))).filter(Boolean)
      : [];

    if (!aiResult.success || titles.length === 0) {
      return {
        success: false,
        error: aiResult.error || '这次 AI 没有返回可用的时间轴标题',
      };
    }

    const nextGroups = currentGroups.map((group, index) => ({
      ...group,
      title: titles[index] || group.title,
    }));

    const hasAnyChange = nextGroups.some((group, index) => group.title !== currentGroups[index]?.title);

    return {
      success: hasAnyChange,
      data: nextGroups,
      error: hasAnyChange ? undefined : '这次生成的时间轴标题和现在差不多',
    };
  }

  static async regenerateExecutionSteps(
    rawInput: string,
    preferences: NavigationPreferences,
    currentGroups: NavigationPlannerResult['timelineGroups']
  ): Promise<{
    success: boolean;
    data?: NavigationPlannerResult['executionSteps'];
    error?: string;
  }> {
    const planned = await this.planNavigationSession(rawInput, preferences);
    if (!planned.success || !planned.data) {
      return {
        success: false,
        error: planned.error || '小步骤重新生成失败',
      };
    }

    const currentGroupIds = currentGroups.map((group) => group.id);
    const nextSteps = planned.data.executionSteps.map((step, index) => ({
      ...step,
      groupId: currentGroupIds[index] || currentGroupIds[currentGroupIds.length - 1] || step.groupId,
    }));

    return {
      success: true,
      data: nextSteps,
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
    data?: NavigationInsertedFlowResult;
    error?: string;
  }> {
    const planned = await this.planNavigationSession(context.userDifficulty, preferences);
    if (!planned.success || !planned.data) {
      return {
        success: false,
        error: planned.error || '这次没整理出可插入的新流程，请换个说法再试一次',
      };
    }

    return {
      success: true,
      data: {
        assistantMessage: buildInsertedFlowAssistantMessage(context, planned.data),
        plan: planned.data,
      },
    };
  }

  static async analyzeNavigationCompletion(
    session: NavigationSession
  ): Promise<{
    success: boolean;
    data?: {
      analysisTitle: string;
      summary: string;
      insights: string[];
      nextActions: string[];
    };
    error?: string;
  }> {
    const preStateText = JSON.stringify(session.preState || {}, null, 2);
    const postStateText = JSON.stringify(session.postState || {}, null, 2);
    const stepsText = JSON.stringify(session.executionSteps.map((step) => ({
      title: step.title,
      guidance: step.guidance,
      status: step.status,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      estimatedMinutes: step.estimatedMinutes,
      focusMinutes: step.focusMinutes,
      source: step.source,
    })), null, 2);

    const completedCount = session.executionSteps.filter((step) => step.status === 'completed').length;
    const skippedCount = session.executionSteps.filter((step) => step.status === 'skipped').length;
    const actualDurationMinutes = session.startedAt && session.completedAt
      ? Math.max(1, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))
      : '';

    return await this.callAI('NAVIGATION_COMPLETION_ANALYZER', {
      rawInput: session.rawInput,
      sessionTitle: session.title,
      summary: session.summary || '',
      startedAt: session.startedAt || '',
      completedAt: session.completedAt || '',
      actualDurationMinutes,
      stepCount: session.executionSteps.length,
      completedCount,
      skippedCount,
      preState: preStateText,
      postState: postStateText,
      steps: stepsText,
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

