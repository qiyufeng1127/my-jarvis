import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GoalContributionMetricResult {
  dimensionId: string;
  dimensionName: string;
  unit: string;
  value: number;
}

export interface GoalContributionRecord {
  id: string;
  goalId: string;
  taskId?: string;
  historyRecordId?: string;
  taskTitle: string;
  startTime?: Date;
  endTime?: Date;
  durationMinutes: number;
  qualityScore?: number;
  note?: string;
  source: 'manual' | 'timeline' | 'history';
  dimensionResults: GoalContributionMetricResult[];
  createdAt: Date;
  updatedAt: Date;
}

interface GoalContributionState {
  records: GoalContributionRecord[];
  addRecord: (record: Omit<GoalContributionRecord, 'id' | 'createdAt' | 'updatedAt'>) => GoalContributionRecord;
  updateRecord: (id: string, updates: Partial<GoalContributionRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordsByGoalId: (goalId: string) => GoalContributionRecord[];
  getRecordsByTaskId: (taskId: string) => GoalContributionRecord[];
  clearAll: () => void;
}

export const useGoalContributionStore = create<GoalContributionState>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (record) => {
        const newRecord: GoalContributionRecord = {
          ...record,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          records: [...state.records, newRecord],
        }));

        return newRecord;
      },
      updateRecord: (id, updates) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? {
                  ...record,
                  ...updates,
                  updatedAt: new Date(),
                }
              : record
          ),
        }));
      },
      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        }));
      },
      getRecordsByGoalId: (goalId) => {
        return get().records
          .filter((record) => record.goalId === goalId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      getRecordsByTaskId: (taskId) => {
        return get().records.filter((record) => record.taskId === taskId);
      },
      clearAll: () => set({ records: [] }),
    }),
    {
      name: 'manifestos-goal-contribution-storage',
      version: 1,
      partialize: (state) => ({ records: state.records }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            if (parsed?.state?.records) {
              parsed.state.records = parsed.state.records.map((record: any) => ({
                ...record,
                startTime: record.startTime ? new Date(record.startTime) : undefined,
                endTime: record.endTime ? new Date(record.endTime) : undefined,
                createdAt: new Date(record.createdAt),
                updatedAt: new Date(record.updatedAt),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取目标关键结果失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

