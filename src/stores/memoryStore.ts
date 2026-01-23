import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 情绪标签
export const EMOTION_TAGS = [
  { id: 'happy', label: '开心', emoji: '😊', color: '#10B981' },
  { id: 'excited', label: '兴奋', emoji: '🤩', color: '#F59E0B' },
  { id: 'calm', label: '平静', emoji: '😌', color: '#3B82F6' },
  { id: 'grateful', label: '感恩', emoji: '🙏', color: '#8B5CF6' },
  { id: 'proud', label: '自豪', emoji: '😎', color: '#EC4899' },
  { id: 'anxious', label: '焦虑', emoji: '😰', color: '#EF4444' },
  { id: 'sad', label: '难过', emoji: '😢', color: '#6B7280' },
  { id: 'angry', label: '生气', emoji: '😠', color: '#DC2626' },
  { id: 'frustrated', label: '沮丧', emoji: '😞', color: '#9CA3AF' },
  { id: 'tired', label: '疲惫', emoji: '😴', color: '#64748B' },
];

// 事项标签
export const CATEGORY_TAGS = [
  { id: 'work', label: '工作', emoji: '💼', color: '#3B82F6' },
  { id: 'study', label: '学习', emoji: '📚', color: '#8B5CF6' },
  { id: 'life', label: '生活', emoji: '🏠', color: '#10B981' },
  { id: 'housework', label: '家务', emoji: '🧹', color: '#6B7280' },
  { id: 'health', label: '健康', emoji: '💪', color: '#EF4444' },
  { id: 'social', label: '社交', emoji: '👥', color: '#EC4899' },
  { id: 'hobby', label: '爱好', emoji: '🎨', color: '#F59E0B' },
  { id: 'startup', label: '创业', emoji: '🚀', color: '#7C3AED' },
  { id: 'finance', label: '财务', emoji: '💰', color: '#059669' },
  { id: 'family', label: '家庭', emoji: '👨‍👩‍👧', color: '#F97316' },
];

export interface MemoryRecord {
  id: string;
  type: 'mood' | 'thought' | 'todo' | 'success' | 'gratitude';
  content: string;
  emotionTags: string[];
  categoryTags: string[];
  date: Date;
  aiGenerated?: boolean;
  rewards?: {
    gold: number;
    growth: number;
  };
}

export interface JournalEntry {
  id: string;
  type: 'success' | 'gratitude';
  content: string;
  date: Date;
  mood?: string;
  tags: string[];
  rewards: {
    gold: number;
    growth: number;
  };
}

interface MemoryState {
  // 全景记忆
  memories: MemoryRecord[];
  addMemory: (memory: Omit<MemoryRecord, 'id' | 'date'>) => void;
  deleteMemory: (id: string) => void;
  updateMemory: (id: string, updates: Partial<MemoryRecord>) => void;
  
  // 日记
  journals: JournalEntry[];
  addJournal: (journal: Omit<JournalEntry, 'id' | 'date'>) => void;
  deleteJournal: (id: string) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  
  // 统计
  getStats: () => {
    totalMemories: number;
    totalJournals: number;
    totalRewards: { gold: number; growth: number };
    emotionDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  };
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      journals: [],

      addMemory: (memory) => {
        const newMemory: MemoryRecord = {
          ...memory,
          id: `memory-${Date.now()}`,
          date: new Date(),
        };
        set((state) => ({
          memories: [newMemory, ...state.memories],
        }));

        // 如果是成功或感恩类型，同步到日记
        if (memory.type === 'success' || memory.type === 'gratitude') {
          const journal: JournalEntry = {
            id: `journal-${Date.now()}`,
            type: memory.type,
            content: memory.content,
            date: new Date(),
            tags: [...memory.emotionTags, ...memory.categoryTags],
            rewards: memory.rewards || { gold: 0, growth: 0 },
          };
          set((state) => ({
            journals: [journal, ...state.journals],
          }));
        }
      },

      deleteMemory: (id) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        }));
      },

      updateMemory: (id, updates) => {
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      addJournal: (journal) => {
        const newJournal: JournalEntry = {
          ...journal,
          id: `journal-${Date.now()}`,
          date: new Date(),
        };
        set((state) => ({
          journals: [newJournal, ...state.journals],
        }));

        // 同步到全景记忆
        const memory: MemoryRecord = {
          id: `memory-${Date.now()}`,
          type: journal.type,
          content: journal.content,
          emotionTags: journal.tags.filter(t => EMOTION_TAGS.some(et => et.id === t)),
          categoryTags: journal.tags.filter(t => CATEGORY_TAGS.some(ct => ct.id === t)),
          date: new Date(),
          rewards: journal.rewards,
        };
        set((state) => ({
          memories: [memory, ...state.memories],
        }));
      },

      deleteJournal: (id) => {
        set((state) => ({
          journals: state.journals.filter((j) => j.id !== id),
        }));
      },

      updateJournal: (id, updates) => {
        set((state) => ({
          journals: state.journals.map((j) =>
            j.id === id ? { ...j, ...updates } : j
          ),
        }));
      },

      getStats: () => {
        const state = get();
        const totalMemories = state.memories.length;
        const totalJournals = state.journals.length;
        
        const totalRewards = {
          gold: 0,
          growth: 0,
        };
        
        state.memories.forEach((m) => {
          if (m.rewards) {
            totalRewards.gold += m.rewards.gold;
            totalRewards.growth += m.rewards.growth;
          }
        });
        
        state.journals.forEach((j) => {
          totalRewards.gold += j.rewards.gold;
          totalRewards.growth += j.rewards.growth;
        });

        const emotionDistribution: Record<string, number> = {};
        state.memories.forEach((m) => {
          m.emotionTags.forEach((tag) => {
            emotionDistribution[tag] = (emotionDistribution[tag] || 0) + 1;
          });
        });

        const categoryDistribution: Record<string, number> = {};
        state.memories.forEach((m) => {
          m.categoryTags.forEach((tag) => {
            categoryDistribution[tag] = (categoryDistribution[tag] || 0) + 1;
          });
        });

        return {
          totalMemories,
          totalJournals,
          totalRewards,
          emotionDistribution,
          categoryDistribution,
        };
      },
    }),
    {
      name: 'memory-storage',
    }
  )
);

