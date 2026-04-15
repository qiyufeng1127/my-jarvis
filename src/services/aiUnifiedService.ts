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

const rebuildTimelineGroupsFromTitles = (
  titles: string[],
  executionSteps: NavigationPlannerResult['executionSteps'],
  sourceGroups?: NavigationPlannerResult['timelineGroups'],
) => {
  const cleanedTitles = titles
    .map((title) => cleanTimelineTitleText(String(title || '')))
    .filter(Boolean);

  if (!cleanedTitles.length || !executionSteps.length) {
    return {
      executionSteps,
      timelineGroups: sourceGroups || [],
    };
  }

  const groupCount = Math.min(cleanedTitles.length, executionSteps.length);
  const normalizedTitles = cleanedTitles.slice(0, groupCount);
  const sourceBuckets = (sourceGroups || [])
    .map((group) => group.stepIds.filter((stepId) => executionSteps.some((step) => step.id === stepId)).length)
    .filter((count) => count > 0);

  const bucketSizes = sourceBuckets.length === groupCount
    ? sourceBuckets
    : normalizedTitles.map((_, index) => {
        const remainingSteps = executionSteps.length - index;
        const remainingGroups = groupCount - index;
        return Math.max(1, Math.ceil(remainingSteps / remainingGroups));
      });

  const rebuiltGroups: NavigationPlannerResult['timelineGroups'] = [];
  const rebuiltSteps: NavigationPlannerResult['executionSteps'] = [];
  let stepCursor = 0;

  normalizedTitles.forEach((title, index) => {
    const groupId = `g${index + 1}`;
    const remainingSteps = executionSteps.length - stepCursor;
    const remainingGroups = groupCount - index;
    const desiredSize = bucketSizes[index] || 1;
    const groupSize = index === groupCount - 1
      ? remainingSteps
      : Math.max(1, Math.min(desiredSize, remainingSteps - (remainingGroups - 1)));
    const stepsInGroup = executionSteps.slice(stepCursor, stepCursor + groupSize).map((step) => ({
      ...step,
      groupId,
    }));

    rebuiltSteps.push(...stepsInGroup);
    rebuiltGroups.push({
      id: groupId,
      title,
      description: sourceGroups?.[index]?.description || '',
      stepIds: stepsInGroup.map((step) => step.id),
    });
    stepCursor += groupSize;
  });

  if (stepCursor < executionSteps.length && rebuiltGroups.length) {
    const lastGroup = rebuiltGroups[rebuiltGroups.length - 1];
    const remainingSteps = executionSteps.slice(stepCursor).map((step) => ({
      ...step,
      groupId: lastGroup.id,
    }));
    rebuiltSteps.push(...remainingSteps);
    lastGroup.stepIds.push(...remainingSteps.map((step) => step.id));
  }

  return {
    executionSteps: rebuiltSteps,
    timelineGroups: rebuiltGroups,
  };
};

const rebuildPlannerResultTimeline = async (
  rawInput: string,
  result: NavigationPlannerResult,
) => {
  if (!result.executionSteps.length) return result;

  const aiResult = await AIUnifiedService.callAI('NAVIGATION_TIMELINE_GROUPER', {
    rawInput,
  });

  const titles = Array.isArray(aiResult.data?.titles)
    ? aiResult.data.titles.map((title: unknown) => cleanTimelineTitleText(String(title || ''))).filter(Boolean)
    : [];

  const rebuilt = rebuildTimelineGroupsFromTitles(titles, result.executionSteps, result.timelineGroups);
  const rewrittenGroups = await rewriteTimelineTitlesWithUserTone(rawInput, rebuilt.timelineGroups);

  return {
    ...result,
    executionSteps: rebuilt.executionSteps,
    timelineGroups: rewrittenGroups,
  };
};

const hasWeakTimelineGroups = (result: NavigationPlannerResult) => {
  if (!result.timelineGroups.length) return true;

  const titles = result.timelineGroups
    .map((group) => cleanTimelineTitleText(String(group.title || '')))
    .filter(Boolean);

  if (!titles.length) return true;

  const uniqueTitles = new Set(titles.map((title) => title.replace(/\s+/g, '')));
  if (uniqueTitles.size < Math.max(1, Math.ceil(titles.length / 2))) {
    return true;
  }

  return titles.some((title) => TIMELINE_BAD_TITLE_PATTERNS.some((pattern) => pattern.test(title)));
};

const shouldRewriteTimelineTitles = (groups: NavigationPlannerResult['timelineGroups']) => {
  if (!groups.length) return false;

  return groups.some((group) => {
    const title = cleanTimelineTitleText(String(group.title || ''));
    if (!title) return false;

    return TIMELINE_BAD_TITLE_PATTERNS.some((pattern) => pattern.test(title))
      || /与|并|处理|启动|事项|流程/.test(title);
  });
};

const finalizeNavigationPlannerResult = async (
  rawInput: string,
  result: NavigationPlannerResult,
) => {
  let nextResult = sanitizeEatingNavigationPlan(rawInput, result);

  if (hasWeakTimelineGroups(nextResult)) {
    nextResult = await rebuildPlannerResultTimeline(rawInput, nextResult);
    return sanitizeEatingNavigationPlan(rawInput, nextResult);
  }

  if (shouldRewriteTimelineTitles(nextResult.timelineGroups)) {
    nextResult = {
      ...nextResult,
      timelineGroups: await rewriteTimelineTitlesWithUserTone(rawInput, nextResult.timelineGroups),
    };
  }

  return sanitizeEatingNavigationPlan(rawInput, nextResult);
};

const EATING_NAVIGATION_PATTERN = /(吃饭|吃早饭|吃午饭|吃晚饭|吃夜宵|吃早餐|吃零食|吃点东西|热饭|把饭打热|打热饭|加热.*饭|微波炉.*饭)/;
const COOKING_NAVIGATION_PATTERN = /(做饭|下厨|炒菜|煮饭|煮面|做吃的|备菜|切菜|准备餐食|烹饪)/;
const NON_EATING_WORK_PATTERN = /(网站|网页|页面|figma|设计|文创|预览图|psd|png|导出|上传|百度云|优化|收尾|排版|文件|源文件|海报|ui|产品图|banner|电商)/i;
const EATING_NAVIGATION_BLOCKED_PATTERN = /(冰箱|看有什么吃的|现成的食物|最不费劲的选项|三明治|沙拉|剩饭|准备食材|备菜|做饭|烹饪)/;
const EATING_NAVIGATION_ALLOWED_PATTERN = /(吃|视频|剧|拿到|端到|放到|坐下|加热|微波|热一下)/;
const EATING_LOCATION_HINT_PATTERN = /(卧室|厨房|客厅|沙发|工作区|餐桌|书桌|桌子|地方|待着的地方)/;
const EATING_EXPLICIT_LOCATION_PATTERN = /(卧室|厨房|客厅|沙发|工作区|餐桌|书桌|桌子|饭桌|餐厅)/;

const stripGuessedEatingLocationText = (text: string) => normalizeInlineText(
  text
    .replace(/拿到你打算待着的地方/g, '拿到手边')
    .replace(/拿到要待的区域/g, '拿到手边')
    .replace(/放到你打算待着的地方/g, '放到手边')
    .replace(/放到要待的区域/g, '放到手边')
    .replace(/比如客厅沙发/g, '')
    .replace(/比如工作区/g, '')
    .replace(/比如卧室/g, '')
    .replace(/在客厅沙发/g, '')
    .replace(/在客厅/g, '')
    .replace(/在沙发上/g, '')
    .replace(/在工作区/g, '')
    .replace(/在卧室/g, '')
    .replace(/在餐桌/g, '')
    .replace(/在书桌/g, '')
    .replace(/去客厅/g, '')
    .replace(/去沙发/g, '')
    .replace(/去工作区/g, '')
    .replace(/去卧室/g, '')
    .replace(/\s+/g, ' ')
    .replace(/（\s*）/g, '')
    .replace(/\(\s*\)/g, '')
    .trim()
);

const sanitizeEatingNavigationPlan = (
  rawInput: string,
  result: NavigationPlannerResult,
): NavigationPlannerResult => {
  const normalizedRawInput = normalizeInlineText(rawInput);
  const isEatingTask = EATING_NAVIGATION_PATTERN.test(normalizedRawInput);
  const hasCookingIntent = COOKING_NAVIGATION_PATTERN.test(normalizedRawInput);
  const hasNonEatingWork = NON_EATING_WORK_PATTERN.test(normalizedRawInput);

  if (!isEatingTask || hasCookingIntent || hasNonEatingWork) {
    return result;
  }

  const hasExplicitLocation = EATING_EXPLICIT_LOCATION_PATTERN.test(normalizedRawInput);

  const filteredSteps = result.executionSteps
    .filter((step) => {
      const title = normalizeInlineText(String(step.title || ''));
      const guidance = normalizeInlineText(String(step.guidance || ''));
      const text = `${title} ${guidance}`;

      if (!EATING_NAVIGATION_BLOCKED_PATTERN.test(text)) {
        return true;
      }

      return EATING_NAVIGATION_ALLOWED_PATTERN.test(title) && !/(做饭|烹饪|备菜|冰箱)/.test(text);
    })
    .map((step) => {
      if (hasExplicitLocation) {
        return step;
      }

      const nextTitle = stripGuessedEatingLocationText(String(step.title || ''));
      const nextGuidance = stripGuessedEatingLocationText(String(step.guidance || ''));
      const shouldClearLocation = step.location && EATING_LOCATION_HINT_PATTERN.test(String(step.location));

      return {
        ...step,
        title: nextTitle || step.title,
        guidance: nextGuidance || step.guidance,
        location: shouldClearLocation ? undefined : step.location,
      };
    });

  if (!filteredSteps.length) {
    return result;
  }

  const validStepIds = new Set(filteredSteps.map((step) => step.id));
  const filteredGroups = result.timelineGroups
    .map((group) => ({
      ...group,
      stepIds: group.stepIds.filter((stepId) => validStepIds.has(stepId)),
    }))
    .filter((group) => group.stepIds.length > 0)
    .map((group) => hasExplicitLocation
      ? group
      : {
          ...group,
          title: stripGuessedEatingLocationText(String(group.title || '')) || group.title,
          description: stripGuessedEatingLocationText(String(group.description || '')),
        });

  return {
    ...result,
    executionSteps: filteredSteps,
    timelineGroups: filteredGroups,
  };
};

const rewriteTimelineTitlesWithUserTone = async (
  rawInput: string,
  groups: NavigationPlannerResult['timelineGroups'],
) => {
  if (!groups.length) return groups;

  const aiStore = useAIStore.getState();
  if (!aiStore.isConfigured()) {
    return groups;
  }

  const aiResult = await AIUnifiedService.callAI('NAVIGATION_TIMELINE_TITLE_REWRITER', {
    rawInput,
    currentTitles: groups.map((group, index) => `${index + 1}. ${group.title}`).join('\n'),
  });

  const titles = Array.isArray(aiResult.data?.titles)
    ? aiResult.data.titles.map((title: unknown) => cleanTimelineTitleText(String(title || ''))).filter(Boolean)
    : [];

  if (!aiResult.success || titles.length === 0) {
    return groups;
  }

  return groups.map((group, index) => ({
    ...group,
    title: titles[index] || group.title,
  }));
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

const parseEventStreamPlannerResult = (content: string, requireDone: boolean, rawInput?: string) => {
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
    timelineGroups: normalizeTimelineGroups(groups, steps),
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
      let latestVisiblePartial: NavigationPlannerResult | null = null;
      let earliestRunnablePartial: Partial<NavigationPlannerResult> | null = null;
      let earliestRunnablePublished = false;
      let chunkCounter = 0;
      console.log('[导航服务] 进入流式分支', { messagesCount: messages.length });

      const streamResult = await aiStore.chatStream(
        messages,
        (chunk) => {
          chunkCounter += 1;
          fullContent += chunk;
          const partial = derivePartialPlannerResult(fullContent, rawInput);
          if (partial) {
            let publishedEarlyThisTick = false;
            const normalizedPartial: NavigationPlannerResult = {
              sessionTitle: partial.sessionTitle || '导航模式',
              summary: partial.summary || '',
              executionSteps: partial.executionSteps || [],
              timelineGroups: partial.timelineGroups || [],
            };
            const canRunEarly = normalizedPartial.timelineGroups.length >= 1 && normalizedPartial.executionSteps.length >= 2;

            if (canRunEarly && !earliestRunnablePublished) {
              earliestRunnablePartial = {
                sessionTitle: normalizedPartial.sessionTitle,
                summary: normalizedPartial.summary,
                timelineGroups: normalizedPartial.timelineGroups,
                executionSteps: normalizedPartial.executionSteps,
              };
              earliestRunnablePublished = true;
              publishedEarlyThisTick = true;
              console.log('[导航服务] 已拿到可启动首包', {
                chunkCounter,
                groupCount: normalizedPartial.timelineGroups.length,
                stepCount: normalizedPartial.executionSteps.length,
              });
              onPartial(earliestRunnablePartial);
            }

            const signature = JSON.stringify({
              title: partial.sessionTitle || '',
              summary: partial.summary || '',
              groups: partial.timelineGroups?.map((group) => group.id) || [],
              steps: partial.executionSteps?.map((step) => step.id) || [],
            });
            if (signature !== lastPartialSignature) {
              lastPartialSignature = signature;
              latestVisiblePartial = normalizedPartial;
              if (hasMeaningfulPlannerContent(normalizedPartial)) {
                latestMeaningfulPartial = normalizedPartial;
              }
              if (!publishedEarlyThisTick) {
                onPartial(partial);
              }
            }
          }
        },
        {
          maxTokens: Math.min(1400, Math.max(1000, AI_PROMPTS.NAVIGATION_MODE_PLANNER.maxTokens)),
          temperature: AI_PROMPTS.NAVIGATION_MODE_PLANNER.temperature,
        }
      );

      const finalParsed = streamResult.content ? tryParsePlannerResult(streamResult.content, rawInput) : null;
      const resolvedResultCandidates = [
        finalParsed,
        latestVisiblePartial,
        latestMeaningfulPartial,
      ].filter((item): item is NavigationPlannerResult => !!item);
      const resolvedResult = resolvedResultCandidates.sort((a, b) => {
        const stepDelta = b.executionSteps.length - a.executionSteps.length;
        if (stepDelta !== 0) return stepDelta;
        return b.timelineGroups.length - a.timelineGroups.length;
      })[0] || null;
      console.log('[导航服务] 流式请求完成', {
        success: streamResult.success,
        chunkCounter,
        finalParsedStepCount: finalParsed?.executionSteps.length || 0,
        finalParsedGroupCount: finalParsed?.timelineGroups.length || 0,
        latestMeaningfulStepCount: latestMeaningfulPartial?.executionSteps.length || 0,
        latestMeaningfulGroupCount: latestMeaningfulPartial?.timelineGroups.length || 0,
        latestVisibleStepCount: latestVisiblePartial?.executionSteps.length || 0,
        latestVisibleGroupCount: latestVisiblePartial?.timelineGroups.length || 0,
        resolvedStepCount: resolvedResult?.executionSteps.length || 0,
        resolvedGroupCount: resolvedResult?.timelineGroups.length || 0,
        resolvedSource: resolvedResult === finalParsed ? 'finalParsed' : resolvedResult === latestVisiblePartial ? 'latestVisiblePartial' : resolvedResult === latestMeaningfulPartial ? 'latestMeaningfulPartial' : 'none',
      });
      if (streamResult.success && resolvedResult) {
        const finalizedResult = await finalizeNavigationPlannerResult(rawInput, resolvedResult);
        return {
          success: true,
          data: finalizedResult,
        };
      }

      if (streamResult.success && earliestRunnablePartial) {
        const fallbackRunnableResult: NavigationPlannerResult = {
          sessionTitle: earliestRunnablePartial.sessionTitle || '导航模式',
          summary: earliestRunnablePartial.summary || '',
          executionSteps: earliestRunnablePartial.executionSteps || [],
          timelineGroups: earliestRunnablePartial.timelineGroups || [],
        };
        const finalizedFallbackResult = await finalizeNavigationPlannerResult(rawInput, fallbackRunnableResult);
        return {
          success: true,
          data: finalizedFallbackResult,
        };
      }

      return {
        success: false,
        error: streamResult.error || (finalParsed || latestMeaningfulPartial ? '这次 AI 在收尾时格式有点乱，但前面已经拆出一版结果了' : '导航智能拆解失败：AI 返回内容不符合预期格式'),
      };
    }

    const aiResult = await this.callAI('NAVIGATION_MODE_PLANNER', variables);

    if (aiResult.success && aiResult.data && hasMeaningfulPlannerContent(aiResult.data as NavigationPlannerResult)) {
      const plannerResult = aiResult.data as NavigationPlannerResult;
      const finalizedResult = await finalizeNavigationPlannerResult(rawInput, plannerResult);
      return {
        success: true,
        data: finalizedResult,
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

    const rebuilt = rebuildTimelineGroupsFromTitles(
      titles,
      currentGroups.flatMap((group) => group.stepIds.map((stepId) => ({
        id: stepId,
        groupId: group.id,
        title: '',
        guidance: '',
      } as any))),
      currentGroups,
    );
    const rewrittenGroups = await rewriteTimelineTitlesWithUserTone(rawInput, rebuilt.timelineGroups);

    const hasAnyChange = rewrittenGroups.length !== currentGroups.length
      || rewrittenGroups.some((group, index) => group.title !== currentGroups[index]?.title);

    return {
      success: hasAnyChange,
      data: rewrittenGroups,
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

