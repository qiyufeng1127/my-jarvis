import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccountabilityTrigger = 'start_delay' | 'low_efficiency' | 'no_result';

export interface HQAccountabilityRecord {
  id: string;
  goalId?: string;
  goalName?: string;
  taskId?: string;
  taskTitle?: string;
  painLabel?: string;
  promise?: string;
  trigger: AccountabilityTrigger;
  triggeredAt: string;
  submittedAt?: string;
  answers: Array<{
    question: string;
    answer: string;
  }>;
}

export interface HQLoopBridgeState {
  goalId?: string;
  taskId?: string;
  goalName?: string;
  taskTitle?: string;
  painLabel?: string;
  promise?: string;
  accountabilityForm?: {
    trigger: AccountabilityTrigger;
    triggeredAt: string;
    submittedAt?: string;
    answers: Array<{
      question: string;
      answer: string;
    }>;
  };
  timelineTaskCompletedAt?: string;
  goalContributionRecordedAt?: string;
  reviewCompletedAt?: string;
  closureNote?: string;
  lastUpdatedAt?: string;
}

interface HQBridgeStore {
  activeLoop: HQLoopBridgeState | null;
  accountabilityRecords: HQAccountabilityRecord[];
  setActiveLoop: (payload: HQLoopBridgeState | null) => void;
  addAccountabilityRecord: (record: Omit<HQAccountabilityRecord, 'id'>) => void;
  clearActiveLoop: () => void;
}

export const useHQBridgeStore = create<HQBridgeStore>()(
  persist(
    (set) => ({
      activeLoop: null,
      accountabilityRecords: [],
      setActiveLoop: (payload) => {
        set((state) => ({
          activeLoop: payload
            ? {
                ...payload,
                lastUpdatedAt: payload.lastUpdatedAt || new Date().toISOString(),
              }
            : null,
          accountabilityRecords:
            payload?.accountabilityForm
              ? [
                  {
                    id: crypto.randomUUID(),
                    goalId: payload.goalId,
                    goalName: payload.goalName,
                    taskId: payload.taskId,
                    taskTitle: payload.taskTitle,
                    painLabel: payload.painLabel,
                    promise: payload.promise,
                    trigger: payload.accountabilityForm.trigger,
                    triggeredAt: payload.accountabilityForm.triggeredAt,
                    submittedAt: payload.accountabilityForm.submittedAt,
                    answers: payload.accountabilityForm.answers,
                  },
                  ...state.accountabilityRecords,
                ]
              : state.accountabilityRecords,
        }));
      },
      addAccountabilityRecord: (record) => {
        set((state) => ({
          accountabilityRecords: [
            {
              id: crypto.randomUUID(),
              ...record,
            },
            ...state.accountabilityRecords,
          ],
        }));
      },
      clearActiveLoop: () => set({ activeLoop: null }),
    }),
    {
      name: 'manifestos-hq-bridge-storage',
      version: 2,
      partialize: (state) => ({
        activeLoop: state.activeLoop,
        accountabilityRecords: state.accountabilityRecords,
      }),
    }
  )
);
