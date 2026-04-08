import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NextActionSource = 'timeline' | 'goals' | 'ai' | 'hq' | 'system';

export interface NextActionSnapshot {
  currentModule?: string;
  taskId?: string;
  taskTitle?: string;
  goalId?: string;
  goalName?: string;
  focusLabel?: string;
  suggestedAction?: string;
  source?: NextActionSource;
  updatedAt?: string;
}

interface NextActionStore {
  snapshot: NextActionSnapshot | null;
  setSnapshot: (payload: NextActionSnapshot | null) => void;
  patchSnapshot: (payload: Partial<NextActionSnapshot>) => void;
  clearSnapshot: () => void;
}

export const useNextActionStore = create<NextActionStore>()(
  persist(
    (set, get) => ({
      snapshot: null,
      setSnapshot: (payload) => {
        set({
          snapshot: payload
            ? {
                ...payload,
                updatedAt: payload.updatedAt || new Date().toISOString(),
              }
            : null,
        });
      },
      patchSnapshot: (payload) => {
        const current = get().snapshot;
        set({
          snapshot: {
            ...(current || {}),
            ...payload,
            updatedAt: new Date().toISOString(),
          },
        });
      },
      clearSnapshot: () => set({ snapshot: null }),
    }),
    {
      name: 'manifestos-next-action-storage',
      version: 1,
      partialize: (state) => ({ snapshot: state.snapshot }),
    }
  )
);

