import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NavigationInsertedFlowResult,
  NavigationExecutionStep,
  NavigationHandsFreeState,
  NavigationPlannerResult,
  NavigationSession,
  NavigationStateSnapshot,
  NavigationBottleEntry,
} from '@/types/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { useGoalContributionStore } from '@/stores/goalContributionStore';
import { matchTaskToGoals, convertMatchesToTaskGoals } from '@/services/aiGoalMatcher';

const softenTimelineTitle = (title: string) => title.trim();

const softenTimelineDescription = (description?: string) => {
  if (!description) return '';
  return description.trim();
};

const buildTimelineTaskDescription = (sessionTitle: string, groupTitle: string) => `${sessionTitle} · ${groupTitle}`;

const buildTimelineTaskGoals = (title: string, sessionTitle: string, linkedGoalId?: string) => {
  if (linkedGoalId) {
    return { [linkedGoalId]: 100 };
  }

  const activeGoals = useGoalStore.getState().getActiveGoals();
  if (activeGoals.length === 0) return {};

  const matches = matchTaskToGoals({
    title,
    description: sessionTitle,
  }, activeGoals);

  if (matches.length === 0) return {};
  return convertMatchesToTaskGoals(matches.slice(0, 1));
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const NAVIGATION_IDLE_MARK_INTERVAL_MS = 30 * 60 * 1000;
const NAVIGATION_EMOJI_CARRY_WINDOW_MS = 90 * 60 * 1000;
const PREVIEW_EARLY_REVEAL_GROUP_COUNT = 1;
const PREVIEW_EARLY_REVEAL_STEP_COUNT = 2;
const NAVIGATION_SNOW_DROP_PER_CONTINUE = 0.05;

const settleSessionAccumulation = (session: NavigationSession, nowIso = new Date().toISOString()) => {
  const referenceTime = session.lastProgressAt || session.startedAt || session.createdAt;
  const referenceMs = new Date(referenceTime).getTime();
  const nowMs = new Date(nowIso).getTime();

  if (Number.isNaN(referenceMs) || Number.isNaN(nowMs) || nowMs <= referenceMs) {
    return {
      snowProgress: session.accumulatedSnowProgress ?? 0,
      inefficiencyMarks: session.accumulatedInefficiencyMarks ?? 0,
    };
  }

  const elapsedMs = nowMs - referenceMs;
  const snowGrowth = elapsedMs / (2 * 60 * 60 * 1000);
  const nextSnowProgress = Math.min(1, (session.accumulatedSnowProgress ?? 0) + snowGrowth);
  const addedInefficiencyMarks = isSleepProtectedStep(session.executionSteps[session.currentStepIndex]?.title)
    ? 0
    : Math.floor(elapsedMs / NAVIGATION_IDLE_MARK_INTERVAL_MS);

  return {
    snowProgress: nextSnowProgress,
    inefficiencyMarks: (session.accumulatedInefficiencyMarks ?? 0) + addedInefficiencyMarks,
  };
};

const applyContinueRelief = (snowProgress: number) => Math.max(0, snowProgress - NAVIGATION_SNOW_DROP_PER_CONTINUE);

const createSceneCarryoverSeed = (lastFinishedAt?: string | null) => {
  if (!lastFinishedAt) {
    return {
      executionScore: 24,
      energyLevel: 50,
      carriedFromRecentSession: false,
    };
  }

  const finishedAt = new Date(lastFinishedAt).getTime();
  if (Number.isNaN(finishedAt)) {
    return {
      executionScore: 24,
      energyLevel: 50,
      carriedFromRecentSession: false,
    };
  }

  const elapsed = Date.now() - finishedAt;
  if (elapsed >= NAVIGATION_EMOJI_CARRY_WINDOW_MS) {
    return {
      executionScore: 24,
      energyLevel: 50,
      carriedFromRecentSession: false,
    };
  }

  const freshness = 1 - (elapsed / NAVIGATION_EMOJI_CARRY_WINDOW_MS);
  const executionScore = clamp(24 + freshness * 68, 24, 92);
  const energyLevel = clamp(50 + freshness * 34, 50, 88);

  return {
    executionScore,
    energyLevel,
    carriedFromRecentSession: true,
  };
};

const sortByStartedAt = (steps: NavigationExecutionStep[]) =>
  [...steps].sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

const sortByCompletedAt = (steps: NavigationExecutionStep[]) =>
  [...steps].sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

const toNavigationDateKey = (dateLike?: string) => {
  const source = dateLike ? new Date(dateLike) : new Date();
  if (Number.isNaN(source.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
  }
  return `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, '0')}-${String(source.getDate()).padStart(2, '0')}`;
};

const getBottleMeaningEmoji = (stepTitle: string) => {
  const title = stepTitle.toLowerCase().replace(/\s+/g, '');
  if (/(灯|照明)/.test(title)) return '💡';
  if (/(洗手间|厕所|卫生间)/.test(title)) return '🚽';
  if (/(洗|刷牙|洗漱|护肤|清洁)/.test(title)) return '🫧';
  if (/(垃圾)/.test(title)) return '🗑️';
  if (/(吃|饭|早餐|午饭|晚饭|做饭)/.test(title)) return '🍽️';
  if (/(喝水|水|接水)/.test(title)) return '💧';
  if (/(出门|回家|开门|关门)/.test(title)) return '🚪';
  if (/(走|下楼|上楼|去)/.test(title)) return '🚶';
  if (/(学习|看书|读)/.test(title)) return '📚';
  if (/(写|文档|记录|总结)/.test(title)) return '✍️';
  if (/(电脑|代码|开发|表格)/.test(title)) return '💻';
  if (/(整理|收拾|打扫)/.test(title)) return '🧹';
  if (/(洗衣|晾衣|叠衣)/.test(title)) return '🧺';
  if (/(睡|休息)/.test(title)) return '🌙';
  return '🧩';
};

const isSleepProtectedStep = (stepTitle?: string) => {
  const title = (stepTitle || '').toLowerCase().replace(/\s+/g, '');
  return /(睡|睡觉|入睡|午睡|补觉|躺下|休息|闭眼|就寝|上床)/.test(title);
};

const buildBottleEntryFromSession = (session: NavigationSession, completedAt: string): NavigationBottleEntry => {
  const emojis = session.executionSteps
    .filter((step) => step.status === 'completed')
    .map((step) => ({ step, emoji: getBottleMeaningEmoji(step.title) }))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.step.id === item.step.id) === index)
    .map((item) => item.emoji);

  const currentStep = session.executionSteps[session.currentStepIndex];
  const idleMarks = session.accumulatedInefficiencyMarks !== undefined
    ? session.accumulatedInefficiencyMarks
    : (session.status === 'active' || isSleepProtectedStep(currentStep?.title)
      ? 0
      : Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(session.lastProgressAt || session.startedAt || session.createdAt).getTime()) / NAVIGATION_IDLE_MARK_INTERVAL_MS)));

  return {
    id: crypto.randomUUID(),
    sessionId: session.id,
    title: session.title,
    date: toNavigationDateKey(completedAt),
    emojis,
    inefficiencyMarks: idleMarks,
    createdAt: completedAt,
  };
};

const createDefaultHandsFree = (): NavigationHandsFreeState => ({
  enabled: false,
  introSeen: false,
  waitingForCommand: false,
  preferredVoiceMode: 'system',
});

const NAVIGATION_SEMANTIC_TOKEN_RULES: Array<{ token: string; pattern: RegExp }> = [
  { token: 'toilet', pattern: /(厕所|卫生间|洗手间|马桶|如厕|便|尿|冲水)/ },
  { token: 'wash', pattern: /(洗手|刷牙|洗脸|洗漱|护肤|清洁)/ },
  { token: 'laundry', pattern: /(洗衣|衣服|脏衣|晾衣|叠衣|洗衣机|衣篮|脏衣篮)/ },
  { token: 'desk', pattern: /(桌子|书桌|桌面|桌上)/ },
  { token: 'livingroom', pattern: /(客厅|沙发|茶几|电视柜)/ },
  { token: 'kitchen', pattern: /(厨房|做饭|锅|碗|灶|冰箱|餐桌)/ },
  { token: 'trash', pattern: /(垃圾|垃圾袋|扔垃圾)/ },
  { token: 'floor', pattern: /(地板|拖地|扫地|吸尘)/ },
  { token: 'bedroom', pattern: /(卧室|床|被子|枕头|床头)/ },
  { token: 'bathroom', pattern: /(浴室|洗澡|淋浴)/ },
  { token: 'outdoor', pattern: /(出门|下楼|上楼|门口|快递|取东西)/ },
  { token: 'meal', pattern: /(早餐|午饭|晚饭|吃饭|喝水)/ },
  { token: 'organize', pattern: /(收拾|整理|归位|摆好)/ },
];

const normalizeNavigationSemanticText = (text?: string) => (text || '').replace(/\s+/g, '').toLowerCase();

const extractNavigationSemanticTokens = (text?: string) => {
  const normalized = normalizeNavigationSemanticText(text);
  const tokens = new Set<string>();
  NAVIGATION_SEMANTIC_TOKEN_RULES.forEach(({ token, pattern }) => {
    if (pattern.test(normalized)) {
      tokens.add(token);
    }
  });
  return tokens;
};

const getNavigationSemanticScore = (groupTitle: string, groupDescription: string | undefined, stepTitle: string, stepGuidance: string) => {
  const groupText = `${groupTitle}${groupDescription || ''}`;
  const stepText = `${stepTitle}${stepGuidance}`;
  const groupTokens = extractNavigationSemanticTokens(groupText);
  const stepTokens = extractNavigationSemanticTokens(stepText);

  let score = 0;
  stepTokens.forEach((token) => {
    if (groupTokens.has(token)) {
      score += 3;
    }
  });

  const normalizedGroupTitle = normalizeNavigationSemanticText(groupTitle);
  const normalizedStepText = normalizeNavigationSemanticText(stepText);
  const significantChars = Array.from(new Set(normalizedGroupTitle.split('').filter((char) => /[\u4e00-\u9fa5a-z0-9]/.test(char) && !'的一二三四五六七八九十去把将再先后并且然后这个那个'.includes(char))));
  significantChars.forEach((char) => {
    if (normalizedStepText.includes(char)) {
      score += 0.45;
    }
  });

  return score;
};

const alignNavigationPlanGroups = <TGroup extends { id: string; title: string; description?: string; stepIds: string[] }, TStep extends { id: string; groupId: string; title: string; guidance: string }>(
  timelineGroups: TGroup[],
  executionSteps: TStep[],
) => {
  if (timelineGroups.length === 0 || executionSteps.length === 0) {
    return { timelineGroups, executionSteps };
  }

  const fallbackGroupId = timelineGroups[0].id;
  const groupOrder = new Map(timelineGroups.map((group, index) => [group.id, index]));
  const originalStepIdOwner = new Map<string, string>();
  timelineGroups.forEach((group) => {
    group.stepIds.forEach((stepId) => {
      if (!originalStepIdOwner.has(stepId)) {
        originalStepIdOwner.set(stepId, group.id);
      }
    });
  });

  const nextSteps = executionSteps.map((step, stepIndex) => {
    let bestGroupId = timelineGroups.find((group) => group.id === step.groupId)?.id || originalStepIdOwner.get(step.id) || fallbackGroupId;
    let bestScore = -Infinity;

    timelineGroups.forEach((group, groupIndex) => {
      let score = getNavigationSemanticScore(group.title, group.description, step.title, step.guidance);
      if (group.id === step.groupId) score += 1.6;
      if (originalStepIdOwner.get(step.id) === group.id) score += 2.1;
      score += Math.max(0, 1.2 - Math.abs(groupIndex - stepIndex) * 0.45);

      if (score > bestScore) {
        bestScore = score;
        bestGroupId = group.id;
      }
    });

    return {
      ...step,
      groupId: bestGroupId,
    };
  });

  const nextGroups = timelineGroups.map((group) => ({
    ...group,
    stepIds: nextSteps.filter((step) => step.groupId === group.id).map((step) => step.id),
  }));

  return {
    timelineGroups: nextGroups,
    executionSteps: nextSteps,
  };
};

const createNavigationGroupFromSeed = (
  session: NavigationSession,
  group?: Partial<NavigationTimelineGroup>,
): NavigationTimelineGroup => ({
  id: group?.id || crypto.randomUUID(),
  title: group?.title?.trim() || '新任务',
  description: group?.description || '',
  stepIds: group?.stepIds ? [...group.stepIds] : [],
  actualStart: group?.actualStart,
  actualEnd: group?.actualEnd,
  source: group?.source || (session.previewMode === 'inserted_flow' ? 'inserted_flow' : 'planned'),
  linkedGoalId: group?.linkedGoalId,
  krNote: group?.krNote,
  krDimensionValues: group?.krDimensionValues,
});

const createNavigationStepFromSeed = (
  session: NavigationSession,
  targetGroupId: string,
  index: number,
  step?: Partial<NavigationExecutionStep>,
): NavigationExecutionStep => ({
  id: step?.id || crypto.randomUUID(),
  groupId: step?.groupId || targetGroupId,
  title: step?.title?.trim() || '新步骤',
  guidance: step?.guidance || '',
  meaningEmoji: step?.meaningEmoji,
  focusMinutes: step?.focusMinutes,
  estimatedMinutes: step?.estimatedMinutes,
  location: step?.location,
  status: step?.status || 'pending',
  startedAt: step?.startedAt,
  completedAt: step?.completedAt,
  skipped: step?.skipped,
  sortOrder: step?.sortOrder ?? index,
  source: step?.source || (session.previewMode === 'inserted_flow' ? 'inserted_flow' : 'planned'),
});

const removeSessionGroupState = (session: NavigationSession, groupId: string) => {
  const nextGroups = session.timelineGroups.filter((group) => group.id !== groupId);
  const nextSteps = session.executionSteps.filter((step) => step.groupId !== groupId);

  return {
    timelineGroups: nextGroups.map((group) => ({
      ...group,
      stepIds: nextSteps.filter((step) => step.groupId === group.id).map((step) => step.id),
    })),
    executionSteps: nextSteps.map((step, index) => ({
      ...step,
      sortOrder: index,
    })),
  };
};

const removeSessionStepState = (session: NavigationSession, stepId: string) => {
  const nextSteps = session.executionSteps.filter((step) => step.id !== stepId);
  const nextGroups = session.timelineGroups.map((group) => ({
    ...group,
    stepIds: nextSteps.filter((step) => step.groupId === group.id).map((step) => step.id),
  }));

  return {
    timelineGroups: nextGroups,
    executionSteps: nextSteps.map((step, index) => ({
      ...step,
      sortOrder: index,
    })),
  };
};

const insertSessionGroupState = (
  session: NavigationSession,
  targetGroupId: string,
  position: 'before' | 'after',
  group?: Partial<NavigationTimelineGroup>,
) => {
  const targetIndex = session.timelineGroups.findIndex((item) => item.id === targetGroupId);
  if (targetIndex < 0) return null;

  const nextGroup = createNavigationGroupFromSeed(session, group);
  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  const nextGroups = [...session.timelineGroups];
  nextGroups.splice(insertIndex, 0, nextGroup);

  return {
    group: nextGroup,
    timelineGroups: nextGroups,
    executionSteps: session.executionSteps,
  };
};

const insertSessionStepState = (
  session: NavigationSession,
  targetStepId: string,
  position: 'before' | 'after',
  step?: Partial<NavigationExecutionStep>,
) => {
  const targetIndex = session.executionSteps.findIndex((item) => item.id === targetStepId);
  if (targetIndex < 0) return null;

  const targetStep = session.executionSteps[targetIndex];
  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  const nextStep = createNavigationStepFromSeed(session, targetStep.groupId, insertIndex, step);
  const nextSteps = [...session.executionSteps];
  nextSteps.splice(insertIndex, 0, nextStep);

  const normalizedSteps = nextSteps.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
  const nextGroups = session.timelineGroups.map((group) => ({
    ...group,
    stepIds: normalizedSteps.filter((item) => item.groupId === group.id).map((item) => item.id),
  }));

  return {
    step: nextStep,
    timelineGroups: nextGroups,
    executionSteps: normalizedSteps,
  };
};

const mergeInsertedFlowIntoSession = (
  session: NavigationSession,
  result: NavigationInsertedFlowResult,
) => {
  const now = new Date().toISOString();
  const currentStepIndex = session.currentStepIndex;
  const currentStep = session.executionSteps[currentStepIndex];
  const insertedPlan = result.plan;

  if (!currentStep || !insertedPlan || !Array.isArray(insertedPlan.executionSteps) || insertedPlan.executionSteps.length === 0) {
    return session;
  }

  const insertedFlowPrefix = `inserted-${crypto.randomUUID()}`;
  const groupIdMap = new Map<string, string>();

  const insertedGroups = (insertedPlan.timelineGroups || []).map((group, index) => {
    const nextGroupId = `${insertedFlowPrefix}-g${index + 1}`;
    groupIdMap.set(group.id, nextGroupId);
    return {
      id: nextGroupId,
      title: softenTimelineTitle(group.title),
      description: softenTimelineDescription(group.description),
      stepIds: [],
      source: 'inserted_flow' as const,
    };
  });

  const fallbackGroupId = insertedGroups[0]?.id || `${insertedFlowPrefix}-g1`;
  if (insertedGroups.length === 0) {
    insertedGroups.push({
      id: fallbackGroupId,
      title: softenTimelineTitle(insertedPlan.sessionTitle || '临时插入的事情'),
      description: '',
      stepIds: [],
      source: 'inserted_flow' as const,
    });
  }

  const insertedSteps = insertedPlan.executionSteps.map((step, index) => {
    const mappedGroupId = groupIdMap.get(step.groupId) || fallbackGroupId;
    const nextStepId = `${insertedFlowPrefix}-s${index + 1}`;
    const nextStep = {
      id: nextStepId,
      groupId: mappedGroupId,
      title: step.title,
      guidance: step.guidance,
      meaningEmoji: step.meaningEmoji,
      focusMinutes: step.focusMinutes,
      estimatedMinutes: step.estimatedMinutes,
      location: step.location,
      status: index === 0 ? 'in_progress' as const : 'pending' as const,
      startedAt: index === 0 ? now : undefined,
      sortOrder: currentStepIndex + index,
      source: 'inserted_flow' as const,
    };

    const targetGroup = insertedGroups.find((group) => group.id === mappedGroupId);
    if (targetGroup) {
      targetGroup.stepIds.push(nextStepId);
    }

    return nextStep;
  });

  const alignedInsertedPlan = alignNavigationPlanGroups(insertedGroups, insertedSteps);

  const executionSteps = [
    ...session.executionSteps.slice(0, currentStepIndex),
    ...alignedInsertedPlan.executionSteps,
    {
      ...currentStep,
      status: 'pending' as const,
      startedAt: undefined,
      completedAt: undefined,
      skipped: false,
      sortOrder: currentStepIndex + insertedSteps.length,
    },
    ...session.executionSteps.slice(currentStepIndex + 1).map((step, index) => ({
      ...step,
      sortOrder: currentStepIndex + insertedSteps.length + 1 + index,
    })),
  ];

  const currentGroupIndex = session.timelineGroups.findIndex((group) => group.id === currentStep.groupId);
  const timelineGroups = currentGroupIndex >= 0
    ? [
        ...session.timelineGroups.slice(0, currentGroupIndex),
        ...alignedInsertedPlan.timelineGroups,
        ...session.timelineGroups.slice(currentGroupIndex),
      ]
    : [...session.timelineGroups, ...alignedInsertedPlan.timelineGroups];

  return {
    ...session,
    executionSteps,
    timelineGroups,
    currentStepIndex,
    executionScore: clamp(session.executionScore - 3, 0, 100),
    energyLevel: clamp(session.energyLevel - 1, 0, 100),
    lastProgressAt: now,
  };
};

interface NavigationStoreState {
  currentSession: NavigationSession | null;
  archivedSessions: NavigationSession[];
  suspendedSession: NavigationSession | null;
  bottleEntries: NavigationBottleEntry[];
  isGenerating: boolean;
  isSyncingToTimeline: boolean;
  isResolvingDifficulty: boolean;
  error: string | null;
  setGenerating: (value: boolean) => void;
  setError: (message: string | null) => void;
  createDraftSession: (rawInput: string) => void;
  createInsertedFlowDraft: (params: {
    baseSession: NavigationSession;
    rawInput: string;
    assistantMessage: string;
    returnStepTitle: string;
  }) => void;
  restoreSession: (session: NavigationSession) => void;
  restoreSuspendedSession: () => void;
  restoreArchivedSession: (sessionId: string) => void;
  setPlannedSession: (rawInput: string, result: NavigationPlannerResult) => void;
  applyStreamingPlan: (rawInput: string, partial: Partial<NavigationPlannerResult>, isFinal?: boolean) => void;
  revealPreviewProgress: () => void;
  updatePreviewGroup: (groupId: string, updates: Partial<NavigationSession['timelineGroups'][number]>) => void;
  replacePreviewGroups: (groups: NavigationSession['timelineGroups']) => void;
  updatePreviewStep: (stepId: string, updates: Partial<NavigationExecutionStep>) => void;
  replacePreviewSteps: (steps: NavigationExecutionStep[]) => void;
  insertSessionGroup: (targetGroupId: string, position: 'before' | 'after', group?: Partial<NavigationSession['timelineGroups'][number]>) => string | null;
  insertSessionStep: (targetStepId: string, position: 'before' | 'after', step?: Partial<NavigationExecutionStep>) => string | null;
  removeSessionStep: (stepId: string) => void;
  removeSessionGroup: (groupId: string) => void;
  updateActiveGroup: (groupId: string, updates: Partial<NavigationSession['timelineGroups'][number]>) => void;
  saveGroupGoalLink: (groupId: string, payload: {
    goalId: string;
    note?: string;
    dimensionValues?: Record<string, number>;
  }) => void;
  updateActiveStep: (stepId: string, updates: Partial<NavigationExecutionStep>) => void;
  movePreviewStep: (stepId: string, direction: 'up' | 'down') => void;
  removePreviewStep: (stepId: string) => void;
  removePreviewGroup: (groupId: string) => void;
  savePreState: (state: NavigationStateSnapshot) => void;
  savePostState: (state: NavigationStateSnapshot) => void;
  setHandsFreeEnabled: (enabled: boolean) => void;
  setHandsFreePreferredVoiceMode: (mode: 'system' | 'edge') => void;
  markHandsFreeIntroSeen: () => void;
  setHandsFreeWaiting: (waiting: boolean) => void;
  setLastVoiceTranscript: (transcript: string) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  archiveSession: () => void;
  abandonSession: () => void;
  cancelSession: () => void;
  completeCurrentStep: () => void;
  finalizeSession: () => void;
  skipCurrentStep: () => void;
  decayExecutionScore: () => void;
  resolveDifficulty: (result: NavigationInsertedFlowResult) => void;
  syncSessionToTimeline: () => Promise<void>;
  clearSession: () => void;
}

export const useNavigationStore = create<NavigationStoreState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      archivedSessions: [],
      suspendedSession: null,
      bottleEntries: [],
      isGenerating: false,
      isSyncingToTimeline: false,
      isResolvingDifficulty: false,
      error: null,
      setGenerating: (value) => set({ isGenerating: value }),
      setError: (message) => set({ error: message }),
      createDraftSession: (rawInput) => {
        const now = new Date().toISOString();
        const previousSession = get().currentSession;
        const sceneCarryover = createSceneCarryoverSeed(previousSession?.completedAt);
        set({
          currentSession: {
            id: crypto.randomUUID(),
            title: '导航模式',
            rawInput,
            status: 'preview',
            previewMode: 'initial',
            executionSteps: [],
            timelineGroups: [],
            currentStepIndex: 0,
            executionScore: sceneCarryover.executionScore,
            energyLevel: sceneCarryover.energyLevel,
            recentExecutionGain: 0,
            lastProgressAt: now,
            accumulatedSnowProgress: 0,
            accumulatedInefficiencyMarks: 0,
            generationStage: 'waiting_ai',
            generationProgress: {
              revealedStepCount: 0,
              totalStepCount: 0,
              revealedGroupCount: 0,
              totalGroupCount: 0,
              done: false,
            },
            createdAt: now,
            handsFree: createDefaultHandsFree(),
          },
          error: null,
        });
      },
      createInsertedFlowDraft: ({ baseSession, rawInput, assistantMessage, returnStepTitle }) => {
        const now = new Date().toISOString();
        set({
          suspendedSession: baseSession,
          currentSession: {
            id: crypto.randomUUID(),
            title: '中途插入事项',
            rawInput,
            status: 'preview',
            previewMode: 'inserted_flow',
            previewContext: {
              assistantMessage,
              returnStepTitle,
            },
            executionSteps: [],
            timelineGroups: [],
            currentStepIndex: 0,
            executionScore: baseSession.executionScore,
            energyLevel: baseSession.energyLevel,
            recentExecutionGain: 0,
            lastProgressAt: now,
            accumulatedSnowProgress: baseSession.accumulatedSnowProgress ?? 0,
            accumulatedInefficiencyMarks: baseSession.accumulatedInefficiencyMarks ?? 0,
            generationStage: 'waiting_ai',
            generationProgress: {
              revealedStepCount: 0,
              totalStepCount: 0,
              revealedGroupCount: 0,
              totalGroupCount: 0,
              done: false,
            },
            createdAt: now,
            handsFree: createDefaultHandsFree(),
          },
          error: null,
          isGenerating: true,
        });
      },
      restoreSession: (session) => {
        set({
          currentSession: session,
          isGenerating: false,
          isResolvingDifficulty: false,
          error: null,
        });
      },
      restoreSuspendedSession: () => {
        const suspendedSession = get().suspendedSession;
        if (!suspendedSession) return;
        set({
          currentSession: suspendedSession,
          suspendedSession: null,
          isGenerating: false,
          isResolvingDifficulty: false,
          error: null,
        });
      },
      restoreArchivedSession: (sessionId) => {
        const archivedSessions = get().archivedSessions;
        const archivedSession = archivedSessions.find((session) => session.id === sessionId);
        if (!archivedSession) return;
        set({
          currentSession: archivedSession,
          archivedSessions: archivedSessions.filter((session) => session.id !== sessionId),
          isGenerating: false,
          isResolvingDifficulty: false,
          error: null,
        });
      },
      setPlannedSession: (rawInput, result) => {
        const now = new Date().toISOString();
        const previousSession = get().currentSession;
        const sceneCarryover = createSceneCarryoverSeed(previousSession?.completedAt);
        const alignedPlan = alignNavigationPlanGroups(result.timelineGroups, result.executionSteps);
        set({
          currentSession: {
            id: crypto.randomUUID(),
            title: result.sessionTitle,
            rawInput,
            status: 'preview',
            previewMode: 'initial',
            executionSteps: alignedPlan.executionSteps.map((step, index) => ({
              ...step,
              meaningEmoji: step.meaningEmoji,
              status: 'pending',
              sortOrder: index,
            })),
            timelineGroups: alignedPlan.timelineGroups.map((group) => ({
              ...group,
            })),
            currentStepIndex: 0,
            executionScore: sceneCarryover.executionScore,
            energyLevel: sceneCarryover.energyLevel,
            recentExecutionGain: 0,
            lastProgressAt: now,
            summary: result.summary,
            generationStage: 'waiting_ai',
            generationProgress: {
              revealedStepCount: 0,
              totalStepCount: result.executionSteps.length,
              revealedGroupCount: 0,
              totalGroupCount: result.timelineGroups.length,
              done: false,
            },
            createdAt: now,
            handsFree: createDefaultHandsFree(),
          },
          isGenerating: false,
          error: null,
        });
      },
      applyStreamingPlan: (rawInput, partial, isFinal = false) => {
        const session = get().currentSession;
        if (!session || session.rawInput !== rawInput || !['preview', 'active', 'paused'].includes(session.status)) return;

        const existingStepMap = new Map(session.executionSteps.map((step) => [step.id, step]));
        const rawExecutionSteps = (partial.executionSteps || session.executionSteps).map((step, index) => {
          const existingStep = existingStepMap.get(step.id);
          return {
            ...step,
            meaningEmoji: step.meaningEmoji || existingStep?.meaningEmoji,
            status: existingStep?.status || 'pending' as const,
            startedAt: existingStep?.startedAt,
            completedAt: existingStep?.completedAt,
            skipped: existingStep?.skipped,
            sortOrder: index,
          };
        });
        const rawTimelineGroups = (partial.timelineGroups || session.timelineGroups).map((group) => ({
          ...group,
        }));
        const alignedPlan = alignNavigationPlanGroups(rawTimelineGroups, rawExecutionSteps);
        const nextExecutionSteps = alignedPlan.executionSteps;
        const nextTimelineGroups = alignedPlan.timelineGroups;

        const normalizeCompareText = (value?: string) => (value || '').replace(/\s+/g, '').trim();
        const currentStepTitles = new Set(session.executionSteps.map((step) => normalizeCompareText(step.title)).filter(Boolean));
        const nextStepTitles = new Set(nextExecutionSteps.map((step) => normalizeCompareText(step.title)).filter(Boolean));
        const currentGroupTitles = new Set(session.timelineGroups.map((group) => normalizeCompareText(group.title)).filter(Boolean));
        const nextGroupTitles = new Set(nextTimelineGroups.map((group) => normalizeCompareText(group.title)).filter(Boolean));
        const missingVisibleStepTitleCount = Array.from(currentStepTitles).filter((title) => !nextStepTitles.has(title)).length;
        const missingVisibleGroupTitleCount = Array.from(currentGroupTitles).filter((title) => !nextGroupTitles.has(title)).length;
        const isRegressionResult =
          nextExecutionSteps.length < session.executionSteps.length
          || nextTimelineGroups.length < session.timelineGroups.length
          || missingVisibleStepTitleCount > 0
          || missingVisibleGroupTitleCount > 0;
        const shouldPreserveVisiblePlan = isFinal
          && ['preview', 'active', 'paused'].includes(session.status)
          && isRegressionResult;
        const safeExecutionSteps = shouldPreserveVisiblePlan ? session.executionSteps : nextExecutionSteps;
        const safeTimelineGroups = shouldPreserveVisiblePlan ? session.timelineGroups : nextTimelineGroups;
        const nextSummary = partial.summary ?? session.summary;
        const nextTitle = partial.sessionTitle || session.title || '导航模式';
        const hasAnyContent = safeExecutionSteps.length > 0 || safeTimelineGroups.length > 0;
        const previousProgress = session.generationProgress;
        const nextTotalStepCount = safeExecutionSteps.length;
        const nextTotalGroupCount = safeTimelineGroups.length;
        const nextRevealedGroupCount = isFinal
          ? nextTotalGroupCount
          : Math.min(
              nextTotalGroupCount,
              Math.max(previousProgress?.revealedGroupCount || 0, safeTimelineGroups.length > 0 ? PREVIEW_EARLY_REVEAL_GROUP_COUNT : 0)
            );
        const nextRevealedStepCount = isFinal
          ? nextTotalStepCount
          : Math.min(
              nextTotalStepCount,
              Math.max(previousProgress?.revealedStepCount || 0, safeExecutionSteps.length > 0 ? Math.min(PREVIEW_EARLY_REVEAL_STEP_COUNT, nextTotalStepCount) : 0)
            );

        const activeCurrentStep = session.executionSteps[session.currentStepIndex];
        const matchedActiveStepIndex = activeCurrentStep
          ? safeExecutionSteps.findIndex((step) => step.id === activeCurrentStep.id)
          : -1;
        const nextCurrentStepIndex = session.status === 'preview'
          ? session.currentStepIndex
          : matchedActiveStepIndex >= 0
            ? matchedActiveStepIndex
            : Math.min(session.currentStepIndex, Math.max(0, safeExecutionSteps.length - 1));

        set({
          currentSession: {
            ...session,
            title: nextTitle,
            summary: nextSummary,
            executionSteps: safeExecutionSteps,
            timelineGroups: safeTimelineGroups,
            currentStepIndex: nextCurrentStepIndex,
            generationStage: isFinal ? 'idle' : (hasAnyContent ? 'building' : 'waiting_ai'),
            generationProgress: {
              revealedStepCount: nextRevealedStepCount,
              totalStepCount: nextTotalStepCount,
              revealedGroupCount: nextRevealedGroupCount,
              totalGroupCount: nextTotalGroupCount,
              done: isFinal,
            },
            lastProgressAt: new Date().toISOString(),
          },
          isGenerating: !isFinal,
        });
      },
      revealPreviewProgress: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview' || !session.generationProgress || session.generationProgress.done) return;
        if (session.generationStage === 'waiting_ai') return;

        const hasReachedEarlyReveal = session.generationProgress.revealedGroupCount >= PREVIEW_EARLY_REVEAL_GROUP_COUNT
          && session.generationProgress.revealedStepCount >= PREVIEW_EARLY_REVEAL_STEP_COUNT;
        const groupBurst = hasReachedEarlyReveal ? 1 : PREVIEW_EARLY_REVEAL_GROUP_COUNT;
        const stepBurst = hasReachedEarlyReveal ? 2 : PREVIEW_EARLY_REVEAL_STEP_COUNT;

        const nextRevealedGroupCount = Math.min(
          session.generationProgress.totalGroupCount,
          session.generationProgress.revealedGroupCount < session.generationProgress.totalGroupCount
            ? session.generationProgress.revealedGroupCount + groupBurst
            : session.generationProgress.revealedGroupCount
        );
        const nextRevealedStepCount = Math.min(
          session.generationProgress.totalStepCount,
          session.generationProgress.revealedStepCount < session.generationProgress.totalStepCount
            ? session.generationProgress.revealedStepCount + stepBurst
            : session.generationProgress.revealedStepCount
        );

        if (
          nextRevealedGroupCount === session.generationProgress.revealedGroupCount
          && nextRevealedStepCount === session.generationProgress.revealedStepCount
        ) {
          return;
        }

        set({
          currentSession: {
            ...session,
            generationStage: 'building',
            generationProgress: {
              ...session.generationProgress,
              revealedGroupCount: nextRevealedGroupCount,
              revealedStepCount: nextRevealedStepCount,
            },
            lastProgressAt: new Date().toISOString(),
          },
        });
      },
      updatePreviewGroup: (groupId, updates) => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview') return;
        set({
          currentSession: {
            ...session,
            timelineGroups: session.timelineGroups.map((group) => group.id === groupId ? { ...group, ...updates } : group),
          },
        });
      },
      replacePreviewGroups: (groups) => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview') return;
        set({
          currentSession: {
            ...session,
            timelineGroups: groups,
          },
        });
      },
      updatePreviewStep: (stepId, updates) => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview') return;
        set({
          currentSession: {
            ...session,
            executionSteps: session.executionSteps.map((step) => step.id === stepId ? { ...step, ...updates } : step),
          },
        });
      },
      replacePreviewSteps: (steps) => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview') return;
        set({
          currentSession: {
            ...session,
            executionSteps: steps.map((step, index) => ({ ...step, sortOrder: index })),
          },
        });
      },
      insertSessionGroup: (targetGroupId, position, group) => {
        const session = get().currentSession;
        if (!session || !['preview', 'active', 'paused', 'completed'].includes(session.status)) return null;

        const inserted = insertSessionGroupState(session, targetGroupId, position, group);
        if (!inserted) return null;

        set({
          currentSession: {
            ...session,
            timelineGroups: inserted.timelineGroups,
            executionSteps: inserted.executionSteps,
          },
        });

        return inserted.group.id;
      },
      insertSessionStep: (targetStepId, position, step) => {
        const session = get().currentSession;
        if (!session || !['preview', 'active', 'paused', 'completed'].includes(session.status)) return null;

        const inserted = insertSessionStepState(session, targetStepId, position, step);
        if (!inserted) return null;

        set({
          currentSession: {
            ...session,
            timelineGroups: inserted.timelineGroups,
            executionSteps: inserted.executionSteps,
          },
        });

        return inserted.step.id;
      },
      removeSessionStep: (stepId) => {
        const session = get().currentSession;
        if (!session || !['preview', 'active', 'paused', 'completed'].includes(session.status)) return;

        const nextState = removeSessionStepState(session, stepId);
        set({
          currentSession: {
            ...session,
            timelineGroups: nextState.timelineGroups,
            executionSteps: nextState.executionSteps,
          },
        });
      },
      removeSessionGroup: (groupId) => {
        const session = get().currentSession;
        if (!session || !['preview', 'active', 'paused', 'completed'].includes(session.status)) return;

        const nextState = removeSessionGroupState(session, groupId);
        set({
          currentSession: {
            ...session,
            timelineGroups: nextState.timelineGroups,
            executionSteps: nextState.executionSteps,
          },
        });
      },
      updateActiveGroup: (groupId, updates) => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;
        set({
          currentSession: {
            ...session,
            timelineGroups: session.timelineGroups.map((group) => group.id === groupId ? { ...group, ...updates } : group),
          },
        });
      },
      saveGroupGoalLink: (groupId, payload) => {
        const session = get().currentSession;
        if (!session || !['active', 'completed', 'paused'].includes(session.status)) return;
        set({
          currentSession: {
            ...session,
            timelineGroups: session.timelineGroups.map((group) => group.id === groupId
              ? {
                  ...group,
                  linkedGoalId: payload.goalId,
                  krNote: payload.note,
                  krDimensionValues: payload.dimensionValues,
                }
              : group),
          },
        });
      },
      updateActiveStep: (stepId, updates) => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;
        set({
          currentSession: {
            ...session,
            executionSteps: session.executionSteps.map((step) => step.id === stepId ? { ...step, ...updates } : step),
          },
        });
      },
      savePreState: (state) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            preState: {
              ...state,
              recordedAt: new Date().toISOString(),
            },
          },
        });
      },
      savePostState: (state) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            postState: {
              ...state,
              recordedAt: new Date().toISOString(),
            },
          },
        });
      },
      setHandsFreeEnabled: (enabled) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            handsFree: {
              ...session.handsFree,
              enabled,
            },
          },
        });
      },
      setHandsFreePreferredVoiceMode: (mode) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            handsFree: {
              ...session.handsFree,
              preferredVoiceMode: mode,
            },
          },
        });
      },
      markHandsFreeIntroSeen: () => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            handsFree: {
              ...session.handsFree,
              introSeen: true,
            },
          },
        });
      },
      setHandsFreeWaiting: (waiting) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            handsFree: {
              ...session.handsFree,
              waitingForCommand: waiting,
            },
          },
        });
      },
      setLastVoiceTranscript: (transcript) => {
        const session = get().currentSession;
        if (!session) return;
        set({
          currentSession: {
            ...session,
            handsFree: {
              ...session.handsFree,
              lastTranscript: transcript,
              lastHeardAt: new Date().toISOString(),
            },
          },
        });
      },
      startSession: () => {
        const session = get().currentSession;
        if (!session || session.executionSteps.length === 0) return;

        if (session.status === 'preview' && session.previewMode === 'inserted_flow') {
          const suspendedSession = get().suspendedSession;
          if (!suspendedSession) return;
          const mergedSession = mergeInsertedFlowIntoSession(suspendedSession, {
            assistantMessage: session.previewContext?.assistantMessage || '',
            plan: {
              sessionTitle: session.title,
              summary: session.summary || '',
              executionSteps: session.executionSteps.map((step) => ({
                id: step.id,
                groupId: step.groupId,
                title: step.title,
                guidance: step.guidance,
                meaningEmoji: step.meaningEmoji,
                focusMinutes: step.focusMinutes,
                estimatedMinutes: step.estimatedMinutes,
                location: step.location,
              })),
              timelineGroups: session.timelineGroups.map((group) => ({
                id: group.id,
                title: group.title,
                description: group.description,
                stepIds: group.stepIds,
              })),
            },
          });

          set({
            currentSession: {
              ...mergedSession,
              status: 'active',
              previewMode: undefined,
              previewContext: undefined,
            },
            suspendedSession: null,
            isGenerating: false,
            error: null,
          });
          return;
        }

        const now = new Date().toISOString();
        const nextSteps = session.executionSteps.map((step, index) =>
          index === 0
            ? { ...step, status: 'in_progress' as const, startedAt: now }
            : step
        );
        set({
          currentSession: {
            ...session,
            status: 'active',
            awaitingFinalCompletion: false,
            startedAt: session.startedAt || now,
            currentStepIndex: 0,
            executionSteps: nextSteps,
            recentExecutionGain: 0,
            lastProgressAt: now,
          },
        });
      },
      pauseSession: () => {
        const session = get().currentSession;
        if (!session) return;
        set({ currentSession: { ...session, status: 'paused' } });
      },
      resumeSession: () => {
        const session = get().currentSession;
        if (!session) return;
        const now = new Date();
        const archivedAt = session.archivedAt ? new Date(session.archivedAt) : null;
        const pausedDurationMs = archivedAt && !Number.isNaN(archivedAt.getTime())
          ? Math.max(0, now.getTime() - archivedAt.getTime())
          : 0;
        const shiftTime = (value?: string) => {
          if (!value || pausedDurationMs <= 0) return value;
          const time = new Date(value).getTime();
          if (Number.isNaN(time)) return value;
          return new Date(time + pausedDurationMs).toISOString();
        };
        const nextSteps = session.executionSteps.map((step, index) => {
          if (index === session.currentStepIndex && step.status === 'in_progress') {
            return {
              ...step,
              startedAt: shiftTime(step.startedAt) || now.toISOString(),
            };
          }
          return step;
        });
        set({
          currentSession: {
            ...session,
            status: 'active',
            startedAt: shiftTime(session.startedAt),
            executionSteps: nextSteps,
            lastProgressAt: now.toISOString(),
            archivedAt: undefined,
          },
        });
      },
      archiveSession: () => {
        const session = get().currentSession;
        if (!session || !['active', 'paused'].includes(session.status)) return;
        set((state) => ({
          currentSession: null,
          archivedSessions: [
            {
              ...session,
              status: 'paused',
              archivedAt: new Date().toISOString(),
            },
            ...state.archivedSessions.filter((item) => item.id !== session.id),
          ],
        }));
      },
      abandonSession: () => {
        const session = get().currentSession;
        if (!session || !['active', 'paused'].includes(session.status)) return;
        const now = new Date().toISOString();
        const settled = settleSessionAccumulation(session, now);
        const currentStep = session.executionSteps[session.currentStepIndex];
        const updatedSteps = session.executionSteps.map((step, index) => {
          if (index !== session.currentStepIndex || !currentStep) return step;
          if (step.status === 'pending') {
            return {
              ...step,
              status: 'skipped' as const,
              skipped: true,
            };
          }
          return step;
        });

        const completedSession = {
          ...session,
          executionSteps: updatedSteps,
          status: 'completed' as const,
          completedAt: now,
          accumulatedSnowProgress: settled.snowProgress,
          accumulatedInefficiencyMarks: settled.inefficiencyMarks,
        };
        const bottleEntry = buildBottleEntryFromSession(completedSession, now);

        set({
          currentSession: {
            ...completedSession,
            abandoned: true,
            awaitingFinalCompletion: false,
            lastProgressAt: now,
            archivedAt: undefined,
            bottleEntries: [...(session.bottleEntries || []), bottleEntry],
            handsFree: {
              ...session.handsFree,
              waitingForCommand: false,
            },
          },
          bottleEntries: [...get().bottleEntries, bottleEntry],
        });
      },
      cancelSession: () => {
        const session = get().currentSession;
        if (!session) return;
        set({ currentSession: { ...session, status: 'cancelled' } });
      },
      completeCurrentStep: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;
        const now = new Date().toISOString();
        const settled = settleSessionAccumulation(session, now);
        const currentStep = session.executionSteps[session.currentStepIndex];
        if (!currentStep) return;

        const isLastStep = session.currentStepIndex >= session.executionSteps.length - 1;
        const perStepGain = session.executionSteps.length > 0 ? 100 / session.executionSteps.length : 0;
        const relievedSnowProgress = applyContinueRelief(settled.snowProgress);

        if (isLastStep) {
          const updatedSteps = session.executionSteps.map((step, index) => {
            if (index === session.currentStepIndex) {
              return {
                ...step,
                status: 'in_progress' as const,
                startedAt: step.startedAt || now,
                completedAt: undefined,
              };
            }
            return step;
          });

          set({
            currentSession: {
              ...session,
              status: 'active',
              awaitingFinalCompletion: true,
              currentStepIndex: session.currentStepIndex,
              executionSteps: updatedSteps,
              executionScore: clamp(session.executionScore + perStepGain * 0.35, 0, 100),
              energyLevel: clamp(session.energyLevel + perStepGain * 0.2, 0, 100),
              recentExecutionGain: Math.max(1, Math.round(perStepGain * 0.35)),
              lastProgressAt: now,
              accumulatedSnowProgress: relievedSnowProgress,
              accumulatedInefficiencyMarks: settled.inefficiencyMarks,
              completedAt: undefined,
              handsFree: {
                ...session.handsFree,
                waitingForCommand: false,
              },
            },
          });
          return;
        }

        const updatedSteps = session.executionSteps.map((step, index) => {
          if (index === session.currentStepIndex) {
            return {
              ...step,
              status: 'completed' as const,
              startedAt: step.startedAt || now,
              completedAt: now,
            };
          }
          if (index === session.currentStepIndex + 1) {
            return {
              ...step,
              status: 'in_progress' as const,
              startedAt: step.startedAt || now,
            };
          }
          return step;
        });

        set({
          currentSession: {
            ...session,
            status: 'active',
            awaitingFinalCompletion: false,
            currentStepIndex: session.currentStepIndex + 1,
            executionSteps: updatedSteps,
            executionScore: clamp(session.executionScore + perStepGain, 0, 100),
            energyLevel: clamp(session.energyLevel + perStepGain * 0.55, 0, 100),
            recentExecutionGain: Math.max(1, Math.round(perStepGain)),
            lastProgressAt: now,
            accumulatedSnowProgress: relievedSnowProgress,
            accumulatedInefficiencyMarks: settled.inefficiencyMarks,
            completedAt: session.completedAt,
            handsFree: {
              ...session.handsFree,
              waitingForCommand: false,
            },
          },
        });
      },
      finalizeSession: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;
        const now = new Date().toISOString();
        const settled = settleSessionAccumulation(session, now);
        const currentStep = session.executionSteps[session.currentStepIndex];
        if (!currentStep) return;

        const updatedSteps = session.executionSteps.map((step, index) => {
          if (index === session.currentStepIndex) {
            return {
              ...step,
              status: step.status === 'skipped' ? 'skipped' as const : 'completed' as const,
              startedAt: step.startedAt || now,
              completedAt: now,
            };
          }
          return step;
        });

        const completedSession = {
          ...session,
          executionSteps: updatedSteps,
          status: 'completed' as const,
          completedAt: now,
          accumulatedSnowProgress: settled.snowProgress,
          accumulatedInefficiencyMarks: settled.inefficiencyMarks,
        };
        const bottleEntry = buildBottleEntryFromSession(completedSession, now);

        set({
          currentSession: {
            ...completedSession,
            awaitingFinalCompletion: false,
            executionScore: clamp(Math.max(session.executionScore, 92), 0, 100),
            energyLevel: clamp(session.energyLevel + 6, 0, 100),
            recentExecutionGain: Math.max(1, session.recentExecutionGain || 0),
            lastProgressAt: now,
            bottleEntries: [...(session.bottleEntries || []), bottleEntry],
            handsFree: {
              ...session.handsFree,
              waitingForCommand: false,
            },
          },
          bottleEntries: [...get().bottleEntries, bottleEntry],
        });
      },
      skipCurrentStep: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;
        const now = new Date().toISOString();
        const settled = settleSessionAccumulation(session, now);
        const currentStep = session.executionSteps[session.currentStepIndex];
        if (!currentStep) return;

        const updatedSteps = session.executionSteps.map((step, index) => {
          if (index === session.currentStepIndex) {
            return {
              ...step,
              status: 'skipped' as const,
              skipped: true,
              startedAt: step.startedAt || now,
              completedAt: now,
            };
          }
          if (index === session.currentStepIndex + 1) {
            return {
              ...step,
              status: 'in_progress' as const,
              startedAt: step.startedAt || now,
            };
          }
          return step;
        });

        const isLastStep = session.currentStepIndex >= session.executionSteps.length - 1;

        set({
          currentSession: {
            ...session,
            status: isLastStep ? 'completed' : 'active',
            awaitingFinalCompletion: false,
            currentStepIndex: isLastStep ? session.currentStepIndex : session.currentStepIndex + 1,
            executionSteps: updatedSteps,
            executionScore: clamp(session.executionScore + 4, 0, 100),
            energyLevel: clamp(session.energyLevel + 2, 0, 100),
            recentExecutionGain: 0,
            lastProgressAt: now,
            accumulatedSnowProgress: settled.snowProgress,
            accumulatedInefficiencyMarks: settled.inefficiencyMarks,
            completedAt: isLastStep ? now : session.completedAt,
            handsFree: {
              ...session.handsFree,
              waitingForCommand: false,
            },
          },
        });
      },
      decayExecutionScore: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;

        if ((session.recentExecutionGain || 0) === 0) return;

        set({
          currentSession: {
            ...session,
            recentExecutionGain: 0,
          },
        });
      },
      resolveDifficulty: (result) => {
        const session = get().currentSession;
        if (!session) return;

        if (session.status === 'preview' && session.previewMode === 'inserted_flow') {
          const suspendedSession = get().suspendedSession;
          if (!suspendedSession) return;
          set({
            currentSession: mergeInsertedFlowIntoSession(suspendedSession, result),
            suspendedSession: null,
            isResolvingDifficulty: false,
            error: null,
          });
          return;
        }

        if (session.status !== 'active') return;

        set({
          currentSession: mergeInsertedFlowIntoSession(session, result),
          isResolvingDifficulty: false,
          error: null,
        });
      },
      syncSessionToTimeline: async () => {
        const session = get().currentSession;
        if (!session || session.finishedAndSyncedToTimeline || session.status !== 'completed') return;

        set({ isSyncingToTimeline: true });

        try {
          const createTask = useTaskStore.getState().createTask;
          const goalContributionStore = useGoalContributionStore.getState();
          const addGoalContributionRecord = goalContributionStore.addRecord;
          const updateGoalContributionRecord = goalContributionStore.updateRecord;
          const updateGoal = useGoalStore.getState().updateGoal;

          for (const group of session.timelineGroups) {
            const groupSteps = session.executionSteps.filter((step) => step.groupId === group.id && step.startedAt && step.completedAt);
            if (groupSteps.length === 0) continue;

            const sortedStart = sortByStartedAt(groupSteps);
            const sortedEnd = sortByCompletedAt(groupSteps);
            const actualStart = sortedStart[0]?.startedAt;
            const actualEnd = sortedEnd[0]?.completedAt;
            if (!actualStart || !actualEnd) continue;

            const durationMinutes = Math.max(1, Math.round((new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 60000));
            const timelineTitle = softenTimelineTitle(group.title);

            const createdTask = await createTask({
              title: timelineTitle,
              description: buildTimelineTaskDescription(session.title, timelineTitle),
              taskType: 'life',
              priority: 2,
              durationMinutes,
              scheduledStart: new Date(actualStart),
              scheduledEnd: new Date(actualEnd),
              actualStart: new Date(actualStart),
              actualEnd: new Date(actualEnd),
              status: 'completed',
              tags: ['导航模式'],
              identityTags: ['system:navigation-group'],
              enableProgressCheck: false,
              progressChecks: [],
              growthDimensions: {},
              longTermGoals: buildTimelineTaskGoals(timelineTitle, session.title, group.linkedGoalId),
              goldEarned: 0,
              penaltyGold: 0,
            });

            if (group.linkedGoalId && group.krDimensionValues && Object.keys(group.krDimensionValues).length > 0) {
              const linkedGoal = useGoalStore.getState().getGoalById(group.linkedGoalId);
              if (linkedGoal) {
                const dimensionResults = linkedGoal.dimensions
                  .map((dimension) => ({
                    dimensionId: dimension.id,
                    dimensionName: dimension.name,
                    unit: dimension.unit,
                    value: Number(group.krDimensionValues?.[dimension.id] || 0),
                  }))
                  .filter((item) => item.value > 0);

                if (dimensionResults.length > 0) {
                  const existingTimelineRecord = goalContributionStore.records.find((record) => record.taskId === createdTask.id && record.goalId === linkedGoal.id);

                  if (existingTimelineRecord) {
                    updateGoalContributionRecord(existingTimelineRecord.id, {
                      note: group.krNote,
                      startTime: new Date(actualStart),
                      endTime: new Date(actualEnd),
                      durationMinutes,
                      dimensionResults,
                    });
                  } else {
                    addGoalContributionRecord({
                      goalId: linkedGoal.id,
                      taskId: createdTask.id,
                      taskTitle: timelineTitle,
                      startTime: new Date(actualStart),
                      endTime: new Date(actualEnd),
                      durationMinutes,
                      note: group.krNote,
                      source: 'timeline',
                      dimensionResults,
                    });
                  }

                  const existingManualRecord = goalContributionStore.records.find((record) => record.taskId === `navigation-group:${session.id}:${group.id}` && record.goalId === linkedGoal.id);
                  const baseDimensions = linkedGoal.dimensions.map((dimension) => ({ ...dimension }));
                  const nextDimensions = baseDimensions.map((dimension) => {
                    const increment = group.krDimensionValues?.[dimension.id] || 0;
                    return {
                      ...dimension,
                      currentValue: Number((dimension.currentValue + increment).toFixed(2)),
                    };
                  });

                  updateGoal(linkedGoal.id, {
                    dimensions: nextDimensions,
                    currentValue: Number(nextDimensions.reduce((sum, item) => sum + item.currentValue, 0).toFixed(2)),
                  });

                  if (existingManualRecord) {
                    updateGoalContributionRecord(existingManualRecord.id, {
                      taskId: createdTask.id,
                      taskTitle: timelineTitle,
                      startTime: new Date(actualStart),
                      endTime: new Date(actualEnd),
                      durationMinutes,
                      source: 'timeline',
                    });
                  }
                }
              }
            }
          }

          if (session.startedAt && session.completedAt) {
            const totalMinutes = Math.max(1, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));
            const postSummary = session.postState
              ? `\n完成后状态：难度${session.postState.actualDifficulty || '-'}，脑力${session.postState.brainState ?? '-'}，情绪${session.postState.emotionState ?? '-'}，成就感${session.postState.achievementSense ?? '-'}。${session.postState.reflection ? `\n感想：${session.postState.reflection}` : ''}`
              : '';
            const endingSummary = session.abandoned ? '\n本次导航为中途放弃结束，已保留放弃前的实际轨迹。' : '';
            await createTask({
              title: `${session.abandoned ? '🧭 导航提前结束：' : '🧭 导航完成：'}${session.title}`,
              description: `${session.summary || `本次导航共完成 ${session.timelineGroups.length} 个任务块。`}${endingSummary}${postSummary}`,
              taskType: 'life',
              priority: 3,
              durationMinutes: totalMinutes,
              scheduledStart: new Date(session.startedAt),
              scheduledEnd: new Date(session.completedAt),
              actualStart: new Date(session.startedAt),
              actualEnd: new Date(session.completedAt),
              status: 'completed',
              tags: ['导航总结'],
              identityTags: ['system:navigation-summary'],
              enableProgressCheck: false,
              progressChecks: [],
              growthDimensions: {},
              longTermGoals: {},
              goldEarned: 0,
              penaltyGold: 0,
            });
          }

          set({
            currentSession: {
              ...session,
              finishedAndSyncedToTimeline: true,
            },
            isSyncingToTimeline: false,
          });
        } catch (error) {
          console.error('[导航] 写入时间轴失败', error);
          set({
            isSyncingToTimeline: false,
            error: error instanceof Error ? error.message : '写入时间轴失败',
          });
        }
      },
      clearSession: () => set((state) => ({
        currentSession: null,
        archivedSessions: state.archivedSessions,
        suspendedSession: null,
        error: null,
        isGenerating: false,
        isSyncingToTimeline: false,
        isResolvingDifficulty: false,
      })),
    }),
    {
      name: 'manifestos-navigation-session',
      version: 5,
      partialize: (state) => ({
        currentSession: state.currentSession,
        archivedSessions: state.archivedSessions,
        suspendedSession: state.suspendedSession,
        bottleEntries: state.bottleEntries,
      }),
      migrate: (persistedState) => {
        const state = (persistedState || {}) as Partial<NavigationStoreState> & {
          state?: Partial<NavigationStoreState>;
        };
        const source = state.state && typeof state.state === 'object' ? state.state : state;

        return {
          currentSession: source.currentSession ?? null,
          archivedSessions: Array.isArray(source.archivedSessions)
            ? source.archivedSessions
            : source.archivedSession
              ? [source.archivedSession]
              : [],
          suspendedSession: source.suspendedSession ?? null,
          bottleEntries: Array.isArray(source.bottleEntries) ? source.bottleEntries : [],
          isGenerating: false,
          isSyncingToTimeline: false,
          isResolvingDifficulty: false,
          error: null,
        } as Partial<NavigationStoreState>;
      },
    }
  )
);
