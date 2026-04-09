import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HQLoopBridgeState {
  goalId?: string;
  taskId?: string;
  goalName?: string;
  taskTitle?: string;
  painLabel?: string;
  promise?: string;
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
  setActiveLoop: (payload: HQLoopBridgeState | null) => void;
  clearActiveLoop: () => void;
}

export const useHQBridgeStore = create<HQBridgeStore>()(
  persist(
    (set) => ({
      activeLoop: null,
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
      clearActiveLoop: () => set({ activeLoop: null }),
    }),
    {
      name: 'manifestos-hq-bridge-storage',
      version: 1,
      partialize: (state) => ({ activeLoop: state.activeLoop }),
    }
  )
);

