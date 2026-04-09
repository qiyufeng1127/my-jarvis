import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HQArchiveRecord {
  id: string;
  goalId?: string;
  goalName?: string;
  taskId?: string;
  taskTitle?: string;
  painLabel?: string;
  promise?: string;
  remedialActionTitle?: string;
  remedialActionTags?: string[];
  remedialActionGoalId?: string;
  remedialActionCreatedTaskId?: string;
  trigger: 'start_delay' | 'low_efficiency';
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
  remedialActionTitle?: string;
  remedialActionTags?: string[];
  remedialActionGoalId?: string;
  remedialActionCreatedTaskId?: string;
  accountabilityForm?: {
    trigger: 'start_delay' | 'low_efficiency';
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
  archiveRecords: HQArchiveRecord[];
  setActiveLoop: (payload: HQLoopBridgeState | null) => void;
  addArchiveRecord: (record: Omit<HQArchiveRecord, 'id'>) => string;
  clearActiveLoop: () => void;
}

export const useHQBridgeStore = create<HQBridgeStore>()(
  persist(
    (set) => ({
      activeLoop: null,
      archiveRecords: [],
      setActiveLoop: (payload) => {
        set({
          activeLoop: payload
            ? {
                ...payload,
                lastUpdatedAt: payload.lastUpdatedAt || new Date().toISOString(),
              }
            : null,
        });
      },
      addArchiveRecord: (record) => {
        const id = crypto.randomUUID();
        set((state) => ({
          archiveRecords: [
            {
              ...record,
              id,
            },
            ...state.archiveRecords,
          ],
        }));
        return id;
      },
      clearActiveLoop: () => set({ activeLoop: null }),
    }),
    {
      name: 'manifestos-hq-bridge-storage',
      version: 2,
      partialize: (state) => ({ activeLoop: state.activeLoop, archiveRecords: state.archiveRecords }),
    }
  )
);

