import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// RPG角色信息
export interface RPGCharacter {
  level: number;
  exp: number;
  maxExp: number;
  energy: number; // 精力值 0-100
  mood: number; // 心情值 0-100
  personality: string[]; // 性格标签
  strengths: Array<{ label: string; description: string }>; // 优势
  improvements: Array<{ label: string; description: string; progress: number }>; // 待改进行为
  title: string; // 人生称号
  avatarLevel: number; // 头像等级
}

// 每日任务
export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'normal' | 'improvement' | 'surprise'; // 普通/改进/惊喜
  difficulty: 'easy' | 'medium' | 'hard';
  expReward: number;
  goldReward: number;
  completed: boolean;
  deadline?: Date;
  isImprovement?: boolean; // 是否是改进任务
}

// 成就勋章
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'growth' | 'wealth' | 'habit' | 'improvement' | 'hidden';
  unlocked: boolean;
  unlockedAt?: Date;
}

// 成长树节点
export interface GrowthTreeNode {
  id: string;
  type: 'leaf' | 'flower' | 'improvement-branch';
  level: number;
  color: string;
  unlockedAt: Date;
}

// 赛季通行证
export interface SeasonPass {
  season: number;
  startDate: Date;
  endDate: Date;
  currentExp: number;
  maxExp: number;
  level: number;
  rewards: Array<{
    level: number;
    title: string;
    icon: string;
    unlocked: boolean;
  }>;
}

interface RPGState {
  // 角色信息
  character: RPGCharacter;
  
  // 每日任务
  dailyTasks: DailyTask[];
  lastTaskGenerationDate: string | null;
  
  // 成就系统
  achievements: Achievement[];
  
  // 成长树
  growthTree: GrowthTreeNode[];
  
  // 赛季通行证
  seasonPass: SeasonPass | null;
  
  // 今日状态标签
  todayStatus: string[];
  
  // 目标系统
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    maxProgress: number;
    category: 'life' | 'month' | 'week' | 'day';
  }>;
  
  // 财富系统
  wealth: {
    level: number;
    balance: number;
    income: number;
    passiveIncome: number;
    todayEarned: number;
    todaySpent: number;
    budget: number;
  };
  
  // Actions
  updateCharacter: (updates: Partial<RPGCharacter>) => void;
  addDailyTask: (task: DailyTask) => void;
  completeTask: (taskId: string) => void;
  generateDailyTasks: () => void;
  unlockAchievement: (achievementId: string) => void;
  addGrowthTreeNode: (node: GrowthTreeNode) => void;
  updateSeasonPass: (updates: Partial<SeasonPass>) => void;
  addExp: (amount: number) => void;
  addGold: (amount: number) => void;
  updateEnergy: (amount: number) => void;
  updateMood: (amount: number) => void;
}

export const useRPGStore = create<RPGState>()(
  persist(
    (set, get) => ({
      // 初始角色数据
      character: {
        level: 1,
        exp: 0,
        maxExp: 200,
        energy: 100,
        mood: 80,
        personality: ['自律', '目标导向', '偏理性'],
        strengths: [
          { label: '执行力强', description: '本周按时完成8个任务，完成率100%' }
        ],
        improvements: [
          { label: '拖延', description: '今日3次推迟任务，累计浪费40分钟', progress: 0 }
        ],
        title: '萌芽新手',
        avatarLevel: 1,
      },
      
      dailyTasks: [],
      lastTaskGenerationDate: null,
      
      achievements: [
        {
          id: 'first-task',
          title: '初次尝试',
          description: '完成第一个任务',
          icon: '🎯',
          category: 'growth',
          unlocked: false,
        },
        {
          id: 'improvement-master',
          title: '改进大师',
          description: '完成10个改进任务',
          icon: '✨',
          category: 'improvement',
          unlocked: false,
        },
      ],
      
      growthTree: [],
      
      seasonPass: null,
      
      todayStatus: ['专注2小时', '完成3个任务', '心情愉悦'],
      
      goals: [
        {
          id: 'life-goal-1',
          title: '成为更好的自己',
          progress: 10,
          maxProgress: 100,
          category: 'life',
        },
      ],
      
      wealth: {
        level: 1,
        balance: 1000,
        income: 0,
        passiveIncome: 0,
        todayEarned: 0,
        todaySpent: 0,
        budget: 500,
      },
      
      // Actions
      updateCharacter: (updates) => set((state) => ({
        character: { ...state.character, ...updates }
      })),
      
      addDailyTask: (task) => set((state) => ({
        dailyTasks: [...state.dailyTasks, task]
      })),
      
      completeTask: (taskId) => set((state) => {
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task || task.completed) return state;
        
        // 更新任务状态
        const updatedTasks = state.dailyTasks.map(t =>
          t.id === taskId ? { ...t, completed: true } : t
        );
        
        // 增加经验和金币
        const newExp = state.character.exp + task.expReward;
        const newGold = state.wealth.balance + task.goldReward;
        
        // 检查是否升级
        let newLevel = state.character.level;
        let remainingExp = newExp;
        let newMaxExp = state.character.maxExp;
        
        if (remainingExp >= newMaxExp) {
          newLevel += 1;
          remainingExp -= newMaxExp;
          newMaxExp = Math.floor(newMaxExp * 1.5);
        }
        
        return {
          dailyTasks: updatedTasks,
          character: {
            ...state.character,
            level: newLevel,
            exp: remainingExp,
            maxExp: newMaxExp,
          },
          wealth: {
            ...state.wealth,
            balance: newGold,
            todayEarned: state.wealth.todayEarned + task.goldReward,
          },
        };
      }),
      
      generateDailyTasks: () => {
        const today = new Date().toDateString();
        const state = get();
        
        // 如果今天已经生成过任务，不重复生成
        if (state.lastTaskGenerationDate === today) return;
        
        // 生成5-7个任务
        const taskCount = Math.floor(Math.random() * 3) + 5;
        const newTasks: DailyTask[] = [];
        
        for (let i = 0; i < taskCount; i++) {
          const isImprovement = i < 2; // 前2个是改进任务
          const isSurprise = Math.random() < 0.2; // 20%概率是惊喜任务
          
          newTasks.push({
            id: `task-${Date.now()}-${i}`,
            title: isImprovement ? '改进任务：减少拖延' : `每日任务 ${i + 1}`,
            description: isImprovement ? '今日优先完成2个小任务，不推迟' : '完成一个重要任务',
            type: isSurprise ? 'surprise' : isImprovement ? 'improvement' : 'normal',
            difficulty: 'medium',
            expReward: isImprovement ? 80 : 50,
            goldReward: isImprovement ? 50 : 30,
            completed: false,
            isImprovement,
          });
        }
        
        set({
          dailyTasks: newTasks,
          lastTaskGenerationDate: today,
        });
      },
      
      unlockAchievement: (achievementId) => set((state) => ({
        achievements: state.achievements.map(a =>
          a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a
        )
      })),
      
      addGrowthTreeNode: (node) => set((state) => ({
        growthTree: [...state.growthTree, node]
      })),
      
      updateSeasonPass: (updates) => set((state) => ({
        seasonPass: state.seasonPass ? { ...state.seasonPass, ...updates } : null
      })),
      
      addExp: (amount) => set((state) => {
        const newExp = state.character.exp + amount;
        let newLevel = state.character.level;
        let remainingExp = newExp;
        let newMaxExp = state.character.maxExp;
        
        if (remainingExp >= newMaxExp) {
          newLevel += 1;
          remainingExp -= newMaxExp;
          newMaxExp = Math.floor(newMaxExp * 1.5);
        }
        
        return {
          character: {
            ...state.character,
            level: newLevel,
            exp: remainingExp,
            maxExp: newMaxExp,
          },
        };
      }),
      
      addGold: (amount) => set((state) => ({
        wealth: {
          ...state.wealth,
          balance: state.wealth.balance + amount,
          todayEarned: amount > 0 ? state.wealth.todayEarned + amount : state.wealth.todayEarned,
          todaySpent: amount < 0 ? state.wealth.todaySpent + Math.abs(amount) : state.wealth.todaySpent,
        },
      })),
      
      updateEnergy: (amount) => set((state) => ({
        character: {
          ...state.character,
          energy: Math.max(0, Math.min(100, state.character.energy + amount)),
        },
      })),
      
      updateMood: (amount) => set((state) => ({
        character: {
          ...state.character,
          mood: Math.max(0, Math.min(100, state.character.mood + amount)),
        },
      })),
    }),
    {
      name: 'rpg-storage',
    }
  )
);

