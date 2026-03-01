import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 排行榜类型
export type LeaderboardType = 
  | 'gold' // 金币榜
  | 'streak' // 连胜榜
  | 'focus' // 专注榜
  | 'task' // 任务完成榜
  | 'pet'; // 宠物等级榜

// 用户排名数据
export interface UserRank {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  score: number; // 根据榜单类型不同，score含义不同
  change: number; // 排名变化（正数=上升，负数=下降）
  badge?: string; // 徽章
  isCurrentUser?: boolean;
}

// 排行榜数据
export interface Leaderboard {
  type: LeaderboardType;
  title: string;
  description: string;
  emoji: string;
  rankings: UserRank[];
  lastUpdate: Date;
  myRank?: UserRank;
}

// 成就徽章
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'gold' | 'streak' | 'focus' | 'task' | 'pet' | 'special';
  requirement: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LeaderboardState {
  leaderboards: Leaderboard[];
  achievements: Achievement[];
  currentUser: {
    userId: string;
    username: string;
    avatar?: string;
  } | null;
  
  // Actions
  updateLeaderboard: (type: LeaderboardType, rankings: UserRank[]) => void;
  setCurrentUser: (userId: string, username: string, avatar?: string) => void;
  checkAchievements: () => Promise<void>;
  unlockAchievement: (achievementId: string) => void;
  
  // Getters
  getLeaderboard: (type: LeaderboardType) => Leaderboard | undefined;
  getMyRank: (type: LeaderboardType) => UserRank | undefined;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
}

// 预设成就
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // 金币成就
  { id: 'gold_100', name: '小富翁', description: '累计获得100金币', emoji: '💰', category: 'gold', requirement: 100, unlocked: false, rarity: 'common' },
  { id: 'gold_1000', name: '富豪', description: '累计获得1000金币', emoji: '💎', category: 'gold', requirement: 1000, unlocked: false, rarity: 'rare' },
  { id: 'gold_10000', name: '金币大亨', description: '累计获得10000金币', emoji: '👑', category: 'gold', requirement: 10000, unlocked: false, rarity: 'epic' },
  
  // 连胜成就
  { id: 'streak_7', name: '一周战士', description: '连续7天完成目标', emoji: '🔥', category: 'streak', requirement: 7, unlocked: false, rarity: 'common' },
  { id: 'streak_30', name: '月度冠军', description: '连续30天完成目标', emoji: '🏆', category: 'streak', requirement: 30, unlocked: false, rarity: 'rare' },
  { id: 'streak_100', name: '百日传奇', description: '连续100天完成目标', emoji: '⭐', category: 'streak', requirement: 100, unlocked: false, rarity: 'legendary' },
  
  // 专注成就
  { id: 'focus_10h', name: '专注新手', description: '累计专注10小时', emoji: '🎯', category: 'focus', requirement: 600, unlocked: false, rarity: 'common' },
  { id: 'focus_100h', name: '专注大师', description: '累计专注100小时', emoji: '🧘', category: 'focus', requirement: 6000, unlocked: false, rarity: 'rare' },
  { id: 'focus_1000h', name: '专注传说', description: '累计专注1000小时', emoji: '🌟', category: 'focus', requirement: 60000, unlocked: false, rarity: 'legendary' },
  
  // 任务成就
  { id: 'task_10', name: '行动派', description: '完成10个任务', emoji: '✅', category: 'task', requirement: 10, unlocked: false, rarity: 'common' },
  { id: 'task_100', name: '效率达人', description: '完成100个任务', emoji: '🚀', category: 'task', requirement: 100, unlocked: false, rarity: 'rare' },
  { id: 'task_1000', name: '任务狂魔', description: '完成1000个任务', emoji: '💪', category: 'task', requirement: 1000, unlocked: false, rarity: 'epic' },
  
  // 宠物成就
  { id: 'pet_lv10', name: '宠物训练师', description: '宠物达到10级', emoji: '🐾', category: 'pet', requirement: 10, unlocked: false, rarity: 'common' },
  { id: 'pet_lv30', name: '宠物大师', description: '宠物达到30级', emoji: '🦄', category: 'pet', requirement: 30, unlocked: false, rarity: 'rare' },
  { id: 'pet_lv50', name: '宠物传说', description: '宠物达到50级', emoji: '🐉', category: 'pet', requirement: 50, unlocked: false, rarity: 'legendary' },
  
  // 特殊成就
  { id: 'first_task', name: '初次尝试', description: '完成第一个任务', emoji: '🎉', category: 'special', requirement: 1, unlocked: false, rarity: 'common' },
  { id: 'first_pet', name: '宠物主人', description: '领养第一只宠物', emoji: '🐱', category: 'special', requirement: 1, unlocked: false, rarity: 'common' },
  { id: 'first_focus', name: '专注开始', description: '完成第一次专注', emoji: '🎯', category: 'special', requirement: 1, unlocked: false, rarity: 'common' },
];

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      leaderboards: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      currentUser: null,
      
      // 更新排行榜
      updateLeaderboard: (type, rankings) => {
        const config = LEADERBOARD_CONFIGS[type];
        const currentUser = get().currentUser;
        
        // 查找当前用户排名
        const myRank = currentUser 
          ? rankings.find(r => r.userId === currentUser.userId)
          : undefined;
        
        const leaderboard: Leaderboard = {
          type,
          title: config.title,
          description: config.description,
          emoji: config.emoji,
          rankings,
          lastUpdate: new Date(),
          myRank,
        };
        
        set((state) => ({
          leaderboards: [
            ...state.leaderboards.filter(l => l.type !== type),
            leaderboard,
          ],
        }));
      },
      
      // 设置当前用户
      setCurrentUser: (userId, username, avatar) => {
        set({
          currentUser: { userId, username, avatar },
        });
      },
      
      // 检查成就
      checkAchievements: async () => {
        const { achievements } = get();
        
        // 获取各项统计数据 - 使用动态import代替require
        const { useGoldStore } = await import('@/stores/goldStore');
        const { useFocusStore } = await import('@/stores/focusStore');
        const { usePetStore } = await import('@/stores/petStore');
        const { useTaskStore } = await import('@/stores/taskStore');
        
        const goldStore = useGoldStore.getState();
        const focusStore = useFocusStore.getState();
        const petStore = usePetStore.getState();
        const taskStore = useTaskStore.getState();
        
        const stats = {
          totalGold: goldStore.totalEarned || 0,
          currentStreak: 0, // TODO: 从 driveStore 获取
          totalFocusMinutes: Math.floor((focusStore.stats?.totalFocusTime || 0) / 60),
          completedTasks: taskStore.tasks?.filter((t: any) => t.completed).length || 0,
          petLevel: petStore.currentPet?.level || 0,
          hasPet: petStore.ownedPets?.length > 0,
          hasCompletedTask: taskStore.tasks?.some((t: any) => t.completed) || false,
          hasCompletedFocus: focusStore.sessions?.some((s: any) => s.completed) || false,
        };
        
        // 检查每个成就
        achievements.forEach((achievement) => {
          if (achievement.unlocked) return;
          
          let shouldUnlock = false;
          
          switch (achievement.id) {
            // 金币成就
            case 'gold_100':
            case 'gold_1000':
            case 'gold_10000':
              shouldUnlock = stats.totalGold >= achievement.requirement;
              break;
            
            // 连胜成就
            case 'streak_7':
            case 'streak_30':
            case 'streak_100':
              shouldUnlock = stats.currentStreak >= achievement.requirement;
              break;
            
            // 专注成就
            case 'focus_10h':
            case 'focus_100h':
            case 'focus_1000h':
              shouldUnlock = stats.totalFocusMinutes >= achievement.requirement;
              break;
            
            // 任务成就
            case 'task_10':
            case 'task_100':
            case 'task_1000':
              shouldUnlock = stats.completedTasks >= achievement.requirement;
              break;
            
            // 宠物成就
            case 'pet_lv10':
            case 'pet_lv30':
            case 'pet_lv50':
              shouldUnlock = stats.petLevel >= achievement.requirement;
              break;
            
            // 特殊成就
            case 'first_task':
              shouldUnlock = stats.hasCompletedTask;
              break;
            case 'first_pet':
              shouldUnlock = stats.hasPet;
              break;
            case 'first_focus':
              shouldUnlock = stats.hasCompletedFocus;
              break;
          }
          
          if (shouldUnlock) {
            get().unlockAchievement(achievement.id);
          }
        });
      },
      
      // 解锁成就
      unlockAchievement: (achievementId) => {
        const achievement = get().achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return;
        
        set((state) => ({
          achievements: state.achievements.map(a =>
            a.id === achievementId
              ? { ...a, unlocked: true, unlockedAt: new Date() }
              : a
          ),
        }));
        
        console.log(`🏆 解锁成就: ${achievement.name}`);
        
        // 发送通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🏆 成就解锁: ${achievement.name}`, {
            body: achievement.description,
            icon: achievement.emoji,
          });
        }
      },
      
      // 获取排行榜
      getLeaderboard: (type) => {
        return get().leaderboards.find(l => l.type === type);
      },
      
      // 获取我的排名
      getMyRank: (type) => {
        const leaderboard = get().getLeaderboard(type);
        return leaderboard?.myRank;
      },
      
      // 获取已解锁成就
      getUnlockedAchievements: () => {
        return get().achievements.filter(a => a.unlocked);
      },
      
      // 获取未解锁成就
      getLockedAchievements: () => {
        return get().achievements.filter(a => !a.unlocked);
      },
    }),
    {
      name: 'manifestos-leaderboard-storage',
      version: 1,
    }
  )
);

// 排行榜配置
const LEADERBOARD_CONFIGS: Record<LeaderboardType, { title: string; description: string; emoji: string }> = {
  gold: { title: '金币榜', description: '累计获得金币最多', emoji: '💰' },
  streak: { title: '连胜榜', description: '连续完成天数最多', emoji: '🔥' },
  focus: { title: '专注榜', description: '累计专注时长最长', emoji: '🎯' },
  task: { title: '任务榜', description: '完成任务数量最多', emoji: '✅' },
  pet: { title: '宠物榜', description: '宠物等级最高', emoji: '🐾' },
};

