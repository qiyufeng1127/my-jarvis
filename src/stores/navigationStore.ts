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

  const referenceTime = session.lastProgressAt || session.startedAt || session.createdAt;
  const currentStep = session.executionSteps[session.currentStepIndex];
  const idleMarks = session.status === 'active' || isSleepProtectedStep(currentStep?.title)
    ? 0
    : Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(referenceTime).getTime()) / NAVIGATION_IDLE_MARK_INTERVAL_MS));

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

  const executionSteps = [
    ...session.executionSteps.slice(0, currentStepIndex),
    ...insertedSteps,
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
        ...insertedGroups,
        ...session.timelineGroups.slice(currentGroupIndex),
      ]
    : [...session.timelineGroups, ...insertedGroups];

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
  setPlannedSession: (rawInput: string, result: NavigationPlannerResult) => void;
  applyStreamingPlan: (rawInput: string, partial: Partial<NavigationPlannerResult>, isFinal?: boolean) => void;
  revealPreviewProgress: () => void;
  updatePreviewGroup: (groupId: string, updates: Partial<NavigationSession['timelineGroups'][number]>) => void;
  replacePreviewGroups: (groups: NavigationSession['timelineGroups']) => void;
  updatePreviewStep: (stepId: string, updates: Partial<NavigationExecutionStep>) => void;
  replacePreviewSteps: (steps: NavigationExecutionStep[]) => void;
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
      setPlannedSession: (rawInput, result) => {
        const now = new Date().toISOString();
        const previousSession = get().currentSession;
        const sceneCarryover = createSceneCarryoverSeed(previousSession?.completedAt);
        set({
          currentSession: {
            id: crypto.randomUUID(),
            title: result.sessionTitle,
            rawInput,
            status: 'preview',
            previewMode: 'initial',
            executionSteps: result.executionSteps.map((step, index) => ({
              ...step,
              status: 'pending',
              sortOrder: index,
            })),
            timelineGroups: result.timelineGroups.map((group) => ({
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
        if (!session || session.status !== 'preview' || session.rawInput !== rawInput) return;

        const nextExecutionSteps = (partial.executionSteps || session.executionSteps).map((step, index) => ({
          ...step,
          status: session.executionSteps[index]?.status || 'pending' as const,
          sortOrder: index,
        }));
        const nextTimelineGroups = (partial.timelineGroups || session.timelineGroups).map((group) => ({
          ...group,
        }));
        const nextSummary = partial.summary ?? session.summary;
        const nextTitle = partial.sessionTitle || session.title || '导航模式';
        const hasAnyContent = nextExecutionSteps.length > 0 || nextTimelineGroups.length > 0;
        const previousProgress = session.generationProgress;
        const nextTotalStepCount = nextExecutionSteps.length;
        const nextTotalGroupCount = nextTimelineGroups.length;
        const nextRevealedStepCount = isFinal
          ? nextTotalStepCount
          : Math.min(previousProgress?.revealedStepCount || 0, nextTotalStepCount);
        const nextRevealedGroupCount = isFinal
          ? nextTotalGroupCount
          : Math.min(previousProgress?.revealedGroupCount || 0, nextTotalGroupCount);

        set({
          currentSession: {
            ...session,
            title: nextTitle,
            summary: nextSummary,
            executionSteps: nextExecutionSteps,
            timelineGroups: nextTimelineGroups,
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

        const nextRevealedGroupCount = Math.min(
          session.generationProgress.totalGroupCount,
          session.generationProgress.revealedGroupCount < session.generationProgress.totalGroupCount
            ? session.generationProgress.revealedGroupCount + 1
            : session.generationProgress.revealedGroupCount
        );
        const nextRevealedStepCount = Math.min(
          session.generationProgress.totalStepCount,
          session.generationProgress.revealedStepCount < session.generationProgress.totalStepCount
            ? session.generationProgress.revealedStepCount + 1
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
        set({ currentSession: { ...session, status: 'active' } });
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
        const currentStep = session.executionSteps[session.currentStepIndex];
        if (!currentStep) return;

        const isLastStep = session.currentStepIndex >= session.executionSteps.length - 1;
        const perStepGain = session.executionSteps.length > 0 ? 100 / session.executionSteps.length : 0;

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

        const bottleEntry = buildBottleEntryFromSession({
          ...session,
          executionSteps: updatedSteps,
          status: 'completed',
          completedAt: now,
        }, now);

        set({
          currentSession: {
            ...session,
            status: 'completed',
            awaitingFinalCompletion: false,
            executionSteps: updatedSteps,
            executionScore: clamp(Math.max(session.executionScore, 92), 0, 100),
            energyLevel: clamp(session.energyLevel + 6, 0, 100),
            recentExecutionGain: Math.max(1, session.recentExecutionGain || 0),
            lastProgressAt: now,
            completedAt: now,
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
            await createTask({
              title: `🧭 导航完成：${session.title}`,
              description: `${session.summary || `本次导航共完成 ${session.timelineGroups.length} 个任务块。`}${postSummary}`,
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
      clearSession: () => set({
        currentSession: null,
        suspendedSession: null,
        error: null,
        isGenerating: false,
        isSyncingToTimeline: false,
        isResolvingDifficulty: false,
      }),
    }),
    {
      name: 'manifestos-navigation-session',
      version: 4,
      partialize: (state) => ({
        currentSession: state.currentSession,
        suspendedSession: state.suspendedSession,
        bottleEntries: state.bottleEntries,
      }),
    }
  )
);
