import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NavigationDifficultyDetourResult,
  NavigationExecutionStep,
  NavigationHandsFreeState,
  NavigationPlannerResult,
  NavigationSession,
  NavigationStateSnapshot,
} from '@/types/navigation';
import { useTaskStore } from '@/stores/taskStore';
import { useGoalStore } from '@/stores/goalStore';
import { matchTaskToGoals, convertMatchesToTaskGoals } from '@/services/aiGoalMatcher';

const softenTimelineTitle = (title: string) =>
  title
    .replace(/卧室唤醒与准备/g, '起床穿好衣服下楼啦')
    .replace(/下楼与生活准备/g, '下楼把生活这摊事顺一顺')
    .replace(/工作区启动与设置/g, '收拾一下工作区准备开工啦')
    .replace(/(.+)与(.+)准备/g, '$1把$2也顺手弄好')
    .replace(/(.+)与(.+)设置/g, '$1顺手把$2调一调')
    .replace(/(.+)与(.+)处理/g, '$1顺手把$2也做掉')
    .replace(/启动/g, '开始')
    .replace(/设置/g, '弄好')
    .replace(/准备/g, '准备好')
    .trim();

const softenTimelineDescription = (description?: string) => {
  if (!description) return '';

  return description
    .replace(/完成/g, '慢慢做完')
    .replace(/处理/g, '顺手做掉')
    .replace(/并明确第一个工作目标/g, '然后轻轻开始第一件事')
    .replace(/并收集需要带下楼的物品/g, '顺手把要带下楼的东西拿好')
    .replace(/创造舒适氛围/g, '把感觉调整得舒服一点')
    .trim();
};

const buildTimelineTaskDescription = (sessionTitle: string, groupTitle: string) => `${sessionTitle} · ${groupTitle}`;

const buildTimelineTaskGoals = (title: string, sessionTitle: string) => {
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

const createDefaultHandsFree = (): NavigationHandsFreeState => ({
  enabled: false,
  introSeen: false,
  waitingForCommand: false,
  preferredVoiceMode: 'system',
});

interface NavigationStoreState {
  currentSession: NavigationSession | null;
  isGenerating: boolean;
  isSyncingToTimeline: boolean;
  isResolvingDifficulty: boolean;
  error: string | null;
  setGenerating: (value: boolean) => void;
  setError: (message: string | null) => void;
  createDraftSession: (rawInput: string) => void;
  setPlannedSession: (rawInput: string, result: NavigationPlannerResult) => void;
  applyStreamingPlan: (rawInput: string, partial: Partial<NavigationPlannerResult>, isFinal?: boolean) => void;
  revealPreviewProgress: () => void;
  updatePreviewGroup: (groupId: string, updates: Partial<NavigationSession['timelineGroups'][number]>) => void;
  updatePreviewStep: (stepId: string, updates: Partial<NavigationExecutionStep>) => void;
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
  skipCurrentStep: () => void;
  decayExecutionScore: () => void;
  resolveDifficulty: (result: NavigationDifficultyDetourResult) => void;
  syncSessionToTimeline: () => Promise<void>;
  clearSession: () => void;
}

export const useNavigationStore = create<NavigationStoreState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      isGenerating: false,
      isSyncingToTimeline: false,
      isResolvingDifficulty: false,
      error: null,
      setGenerating: (value) => set({ isGenerating: value }),
      setError: (message) => set({ error: message }),
      createDraftSession: (rawInput) => {
        const now = new Date().toISOString();
        set({
          currentSession: {
            id: crypto.randomUUID(),
            title: '导航模式',
            rawInput,
            status: 'preview',
            executionSteps: [],
            timelineGroups: [],
            currentStepIndex: 0,
            executionScore: 24,
            energyLevel: 50,
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
      setPlannedSession: (rawInput, result) => {
        const now = new Date().toISOString();
        set({
          currentSession: {
            id: crypto.randomUUID(),
            title: result.sessionTitle,
            rawInput,
            status: 'preview',
            executionSteps: result.executionSteps.map((step, index) => ({
              ...step,
              status: 'pending',
              sortOrder: index,
            })),
            timelineGroups: result.timelineGroups.map((group) => ({
              ...group,
            })),
            currentStepIndex: 0,
            executionScore: 28,
            energyLevel: 56,
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

        set({
          currentSession: {
            ...session,
            title: nextTitle,
            summary: nextSummary,
            executionSteps: nextExecutionSteps,
            timelineGroups: nextTimelineGroups,
            generationStage: hasAnyContent ? 'building' : 'waiting_ai',
            generationProgress: {
              revealedStepCount: Math.min(session.generationProgress?.revealedStepCount || 0, nextExecutionSteps.length),
              totalStepCount: nextExecutionSteps.length,
              revealedGroupCount: Math.min(session.generationProgress?.revealedGroupCount || 0, nextTimelineGroups.length),
              totalGroupCount: nextTimelineGroups.length,
              done: isFinal,
            },
            lastProgressAt: new Date().toISOString(),
          },
          isGenerating: !isFinal,
          error: null,
        });
      },
      revealPreviewProgress: () => {
        const session = get().currentSession;
        if (!session || session.status !== 'preview' || !session.generationProgress || session.generationProgress.done) return;
        if (session.generationStage === 'waiting_ai') return;

        const nextRevealedGroupCount = Math.min(
          session.generationProgress.totalGroupCount,
          session.generationProgress.revealedGroupCount + (session.generationProgress.revealedGroupCount < session.generationProgress.totalGroupCount ? 1 : 0)
        );
        const nextRevealedStepCount = Math.min(
          session.generationProgress.totalStepCount,
          session.generationProgress.revealedStepCount + (session.generationProgress.revealedStepCount < session.generationProgress.totalStepCount ? 1 : 0)
        );
        const done = nextRevealedGroupCount >= session.generationProgress.totalGroupCount && nextRevealedStepCount >= session.generationProgress.totalStepCount;

        set({
          currentSession: {
            ...session,
            generationStage: done ? 'idle' : 'building',
            generationProgress: {
              ...session.generationProgress,
              revealedGroupCount: nextRevealedGroupCount,
              revealedStepCount: nextRevealedStepCount,
              done,
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

        const isLastStep = session.currentStepIndex >= session.executionSteps.length - 1;
        const perStepGain = session.executionSteps.length > 0 ? 100 / session.executionSteps.length : 0;

        set({
          currentSession: {
            ...session,
            status: isLastStep ? 'completed' : 'active',
            currentStepIndex: isLastStep ? session.currentStepIndex : session.currentStepIndex + 1,
            executionSteps: updatedSteps,
            executionScore: clamp(session.executionScore + perStepGain, 0, 100),
            energyLevel: clamp(session.energyLevel + perStepGain * 0.55, 0, 100),
            recentExecutionGain: Math.max(1, Math.round(perStepGain)),
            lastProgressAt: now,
            completedAt: isLastStep ? now : session.completedAt,
            handsFree: {
              ...session.handsFree,
              waitingForCommand: false,
            },
          },
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

        const referenceTime = session.lastProgressAt || session.startedAt || session.createdAt;
        const minutesIdle = Math.max(0, (Date.now() - new Date(referenceTime).getTime()) / 60000);
        const scoreDecay = Math.min(18, Math.floor(minutesIdle / 5) * 2);
        const energyDecay = Math.min(14, Math.floor(minutesIdle / 6) * 2);

        set({
          currentSession: {
            ...session,
            executionScore: clamp(session.executionScore - scoreDecay, 0, 100),
            energyLevel: clamp(session.energyLevel - energyDecay, 0, 100),
            recentExecutionGain: 0,
          },
        });
      },
      resolveDifficulty: (result) => {
        const session = get().currentSession;
        if (!session || session.status !== 'active') return;

        const now = new Date().toISOString();
        const currentStepIndex = session.currentStepIndex;
        const currentStep = session.executionSteps[currentStepIndex];
        const detourGroupId = `detour-${crypto.randomUUID()}`;

        const detourSteps = result.detourSteps.map((step, index) => ({
          id: `${detourGroupId}-s${index + 1}`,
          groupId: detourGroupId,
          title: step.title,
          guidance: step.guidance,
          focusMinutes: step.focusMinutes,
          estimatedMinutes: step.estimatedMinutes,
          location: step.location,
          status: index === 0 ? 'in_progress' as const : 'pending' as const,
          startedAt: index === 0 ? now : undefined,
          sortOrder: currentStepIndex + index,
          source: 'difficulty_detour' as const,
        }));

        const executionSteps = [
          ...session.executionSteps.slice(0, currentStepIndex),
          ...detourSteps,
          ...(currentStep ? [{
            ...currentStep,
            status: 'pending' as const,
            startedAt: undefined,
            completedAt: undefined,
            skipped: false,
            sortOrder: currentStepIndex + detourSteps.length,
          }] : []),
          ...session.executionSteps.slice(currentStepIndex + 1).map((step, index) => ({
            ...step,
            sortOrder: currentStepIndex + detourSteps.length + 1 + index,
          })),
        ];

        set({
          currentSession: {
            ...session,
            executionSteps,
            timelineGroups: [
              ...session.timelineGroups,
              {
                id: detourGroupId,
                title: softenTimelineTitle(result.detourGroup.title),
                description: softenTimelineDescription(result.detourGroup.description),
                stepIds: detourSteps.map((step) => step.id),
                source: 'difficulty_detour',
              },
            ],
            currentStepIndex,
            executionScore: clamp(session.executionScore - 3, 0, 100),
            energyLevel: clamp(session.energyLevel - 1, 0, 100),
          },
          isResolvingDifficulty: false,
        });
      },
      syncSessionToTimeline: async () => {
        const session = get().currentSession;
        if (!session || session.finishedAndSyncedToTimeline || session.status !== 'completed') return;

        set({ isSyncingToTimeline: true, error: null });

        try {
          const createTask = useTaskStore.getState().createTask;

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

            await createTask({
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
              longTermGoals: buildTimelineTaskGoals(timelineTitle, session.title),
              goldEarned: 0,
              penaltyGold: 0,
            });
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
          set({
            isSyncingToTimeline: false,
            error: error instanceof Error ? error.message : '写入时间轴失败',
          });
        }
      },
      clearSession: () => set({ currentSession: null, error: null, isGenerating: false, isSyncingToTimeline: false }),
    }),
    {
      name: 'manifestos-navigation-session',
      version: 2,
      partialize: (state) => ({ currentSession: state.currentSession }),
    }
  )
);
