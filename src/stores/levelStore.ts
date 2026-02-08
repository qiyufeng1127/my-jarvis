import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LevelConfig {
  level: number;
  name: string;
  minExp: number;
  maxExp: number;
}

export interface BadgeConfig {
  id: number;
  name: string;
  emoji: string;
  unlocked: boolean;
}

interface LevelStore {
  // 当前等级和经验
  currentLevel: number;
  currentExp: number;
  
  // 等级配置（5个等级，循环使用）
  levels: LevelConfig[];
  
  // 徽章配置（可以无限收集）
  badges: BadgeConfig[];
  
  // 当前正在收集的徽章索引
  currentBadgeIndex: number;
  
  // 更新等级配置
  updateLevelName: (level: number, name: string) => void;
  
  // 更新徽章名称
  updateBadgeName: (badgeId: number, name: string) => void;
  
  // 添加经验
  addExp: (exp: number) => void;
  
  // 获取当前等级配置
  getCurrentLevelConfig: () => LevelConfig;
  
  // 获取下一级配置
  getNextLevelConfig: () => LevelConfig | null;
  
  // 获取当前徽章
  getCurrentBadge: () => BadgeConfig | null;
  
  // 获取已收集的徽章
  getCollectedBadges: () => BadgeConfig[];
  
  // 重置等级系统
  resetLevels: () => void;
}

const DEFAULT_LEVELS: LevelConfig[] = [
  { level: 1, name: '萌芽新手', minExp: 0, maxExp: 200 },
  { level: 2, name: '探索者', minExp: 200, maxExp: 500 },
  { level: 3, name: '成长者', minExp: 500, maxExp: 1000 },
  { level: 4, name: '实践家', minExp: 1000, maxExp: 2000 },
  { level: 5, name: '大师', minExp: 2000, maxExp: 5000 },
];

const DEFAULT_BADGES: BadgeConfig[] = [
  { id: 1, name: '王嘉尔老婆', emoji: '💖', unlocked: false },
  { id: 2, name: '自律女王', emoji: '👑', unlocked: false },
  { id: 3, name: '时间管理大师', emoji: '⏰', unlocked: false },
  { id: 4, name: '效率之星', emoji: '⭐', unlocked: false },
  { id: 5, name: '成长冠军', emoji: '🏆', unlocked: false },
  { id: 6, name: '坚持达人', emoji: '💪', unlocked: false },
  { id: 7, name: '梦想实践家', emoji: '🌟', unlocked: false },
  { id: 8, name: '完美主义者', emoji: '💎', unlocked: false },
  { id: 9, name: '传奇人物', emoji: '🔥', unlocked: false },
  { id: 10, name: '终极大师', emoji: '💫', unlocked: false },
];

export const useLevelStore = create<LevelStore>()(
  persist(
    (set, get) => ({
      currentLevel: 1,
      currentExp: 0,
      levels: DEFAULT_LEVELS,
      badges: DEFAULT_BADGES,
      currentBadgeIndex: 0,

      updateLevelName: (level, name) => {
        set((state) => ({
          levels: state.levels.map((l) =>
            l.level === level ? { ...l, name } : l
          ),
        }));
      },

      updateBadgeName: (badgeId, name) => {
        set((state) => ({
          badges: state.badges.map((b) =>
            b.id === badgeId ? { ...b, name } : b
          ),
        }));
      },

      addExp: (exp) => {
        set((state) => {
          let newExp = state.currentExp + exp;
          let newLevel = state.currentLevel;
          let newBadgeIndex = state.currentBadgeIndex;
          const newBadges = [...state.badges];

          // 检查是否升级
          for (let i = state.levels.length - 1; i >= 0; i--) {
            const levelConfig = state.levels[i];
            if (newExp >= levelConfig.minExp && newExp < levelConfig.maxExp) {
              newLevel = levelConfig.level;
              break;
            }
          }

          // 如果达到5级的最大经验（5000），解锁徽章并重置
          if (newExp >= 5000) {
            // 解锁当前徽章
            if (newBadgeIndex < newBadges.length) {
              newBadges[newBadgeIndex] = { ...newBadges[newBadgeIndex], unlocked: true };
              newBadgeIndex++;
            }
            
            // 重置等级和经验，开始收集下一个徽章
            newLevel = 1;
            newExp = 0;
            
            console.log(`🎉 恭喜！获得徽章：${newBadges[newBadgeIndex - 1]?.name}`);
          }

          return {
            currentExp: newExp,
            currentLevel: newLevel,
            currentBadgeIndex: newBadgeIndex,
            badges: newBadges,
          };
        });
      },

      getCurrentLevelConfig: () => {
        const state = get();
        return state.levels.find((l) => l.level === state.currentLevel) || state.levels[0];
      },

      getNextLevelConfig: () => {
        const state = get();
        return state.levels.find((l) => l.level === state.currentLevel + 1) || null;
      },

      getCurrentBadge: () => {
        const state = get();
        return state.badges[state.currentBadgeIndex] || null;
      },

      getCollectedBadges: () => {
        const state = get();
        return state.badges.filter((b) => b.unlocked);
      },

      resetLevels: () => {
        set({
          currentLevel: 1,
          currentExp: 0,
          levels: DEFAULT_LEVELS,
          badges: DEFAULT_BADGES,
          currentBadgeIndex: 0,
        });
      },
    }),
    {
      name: 'level-storage',
    }
  )
);

