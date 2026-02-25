import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 连击数据
export interface ComboStreak {
  count: number; // 当前连击数
  multiplier: number; // 当前倍率
  lastCompletedTime: Date | null; // 最后完成任务时间
  isActive: boolean; // 连击是否激活
}

// 连胜数据
export interface WinStreak {
  currentStreak: number; // 当前连胜天数
  longestStreak: number; // 最长连胜记录
  lastCompletedDate: string; // 最后完成任务的日期（YYYY-MM-DD）
  todayCompleted: number; // 今天完成的任务数
  streakProtectionCards: number; // 连胜保护卡数量
}

// 每日生存成本
export interface DailyCost {
  amount: number; // 每日成本金额
  lastDeductionDate: string; // 最后扣除日期（YYYY-MM-DD）
  isBankrupt: boolean; // 是否破产
}

// 拖延税记录
export interface DelayTax {
  taskId: string;
  taskTitle: string;
  taxAmount: number;
  delayHours: number;
  timestamp: Date;
}

interface DriveState {
  // 金币系统
  dailyCost: DailyCost;
  delayTaxes: DelayTax[];
  
  // 连击系统
  comboStreak: ComboStreak;
  
  // 连胜系统
  winStreak: WinStreak;
  
  // Actions - 每日生存成本
  checkAndDeductDailyCost: () => Promise<number>; // 返回扣除的金额
  setBankruptStatus: (isBankrupt: boolean) => void;
  
  // Actions - 连击系统
  incrementCombo: () => number; // 返回当前倍率
  resetCombo: () => void;
  checkComboTimeout: () => void;
  
  // Actions - 连胜系统
  updateWinStreak: () => void;
  breakWinStreak: () => void;
  useStreakProtectionCard: () => boolean;
  addStreakProtectionCard: () => void;
  
  // Actions - 拖延税
  calculateDelayTax: (taskId: string, taskTitle: string, scheduledEnd: Date) => number;
  recordDelayTax: (taskId: string, taskTitle: string, taxAmount: number, delayHours: number) => void;
  getDelayTaxHistory: (days?: number) => DelayTax[];
}

export const useDriveStore = create<DriveState>()(
  persist(
    (set, get) => ({
      // 初始状态
      dailyCost: {
        amount: 50,
        lastDeductionDate: '',
        isBankrupt: false,
      },
      delayTaxes: [],
      comboStreak: {
        count: 0,
        multiplier: 1.0,
        lastCompletedTime: null,
        isActive: false,
      },
      winStreak: {
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        todayCompleted: 0,
        streakProtectionCards: 0,
      },
      
      // 每日生存成本检查和扣除
      checkAndDeductDailyCost: async () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        // 如果今天已经扣除过，不再扣除
        if (state.dailyCost.lastDeductionDate === today) {
          console.log('✅ 今日生存成本已扣除');
          return 0;
        }
        
        // 扣除生存成本
        const { useGoldStore } = await import('@/stores/goldStore');
        const goldStore = useGoldStore.getState();
        
        const costAmount = state.dailyCost.amount;
        
        // 检查余额是否足够
        if (goldStore.balance < costAmount) {
          // 余额不足，进入破产模式
          set({
            dailyCost: {
              ...state.dailyCost,
              lastDeductionDate: today,
              isBankrupt: true,
            },
          });
          
          console.log('💸 余额不足，进入破产模式！需要完成紧急任务赚取金币');
          return costAmount;
        }
        
        // 扣除金币
        goldStore.penaltyGold(costAmount, '每日生存成本');
        
        set({
          dailyCost: {
            ...state.dailyCost,
            lastDeductionDate: today,
            isBankrupt: false,
          },
        });
        
        console.log(`💸 扣除每日生存成本: ${costAmount} 金币`);
        return costAmount;
      },
      
      // 设置破产状态
      setBankruptStatus: (isBankrupt) => {
        set((state) => ({
          dailyCost: {
            ...state.dailyCost,
            isBankrupt,
          },
        }));
      },
      
      // 增加连击
      incrementCombo: () => {
        const state = get();
        const now = new Date();
        
        // 检查连击是否超时（30分钟）
        if (state.comboStreak.lastCompletedTime) {
          const timeDiff = now.getTime() - state.comboStreak.lastCompletedTime.getTime();
          const minutesDiff = timeDiff / (1000 * 60);
          
          if (minutesDiff > 30) {
            // 连击超时，重置
            console.log('⏰ 连击超时，重置连击数');
            set({
              comboStreak: {
                count: 1,
                multiplier: 1.0,
                lastCompletedTime: now,
                isActive: true,
              },
            });
            return 1.0;
          }
        }
        
        // 增加连击数
        const newCount = state.comboStreak.count + 1;
        let newMultiplier = 1.0;
        
        // 计算倍率
        if (newCount >= 10) {
          newMultiplier = 3.0;
        } else if (newCount >= 5) {
          newMultiplier = 2.0;
        } else if (newCount >= 3) {
          newMultiplier = 1.5;
        } else if (newCount >= 2) {
          newMultiplier = 1.2;
        }
        
        set({
          comboStreak: {
            count: newCount,
            multiplier: newMultiplier,
            lastCompletedTime: now,
            isActive: true,
          },
        });
        
        console.log(`🔥 连击 x${newCount}！倍率: ${newMultiplier}x`);
        return newMultiplier;
      },
      
      // 重置连击
      resetCombo: () => {
        set({
          comboStreak: {
            count: 0,
            multiplier: 1.0,
            lastCompletedTime: null,
            isActive: false,
          },
        });
        console.log('❌ 连击已重置');
      },
      
      // 检查连击超时
      checkComboTimeout: () => {
        const state = get();
        if (!state.comboStreak.lastCompletedTime) return;
        
        const now = new Date();
        const timeDiff = now.getTime() - state.comboStreak.lastCompletedTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff > 30 && state.comboStreak.isActive) {
          get().resetCombo();
        }
      },
      
      // 更新连胜
      updateWinStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        // 增加今日完成任务数
        const newTodayCompleted = state.winStreak.todayCompleted + 1;
        
        // 检查是否达到连胜条件（每天至少3个任务）
        if (newTodayCompleted >= 3 && state.winStreak.lastCompletedDate !== today) {
          // 检查是否是连续的一天
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let newStreak = 1;
          if (state.winStreak.lastCompletedDate === yesterdayStr) {
            // 连续的一天
            newStreak = state.winStreak.currentStreak + 1;
          }
          
          const newLongestStreak = Math.max(newStreak, state.winStreak.longestStreak);
          
          set({
            winStreak: {
              ...state.winStreak,
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
              lastCompletedDate: today,
              todayCompleted: newTodayCompleted,
            },
          });
          
          console.log(`🔥 连胜 ${newStreak} 天！`);
          
          // 连胜奖励
          let shouldShowReward = false;
          let rewardAmount = 0;
          
          if (newStreak === 7) {
            rewardAmount = 200;
            shouldShowReward = true;
          } else if (newStreak === 30) {
            rewardAmount = 1000;
            shouldShowReward = true;
          } else if (newStreak === 100) {
            rewardAmount = 5000;
            shouldShowReward = true;
          }
          
          if (shouldShowReward) {
            const { useGoldStore } = require('@/stores/goldStore');
            useGoldStore.getState().addGold(rewardAmount, `${newStreak}天连胜奖励`);
            console.log(`🎉 获得${newStreak}天连胜奖励：${rewardAmount}金币`);
            
            // 触发奖励弹窗（通过事件）
            window.dispatchEvent(new CustomEvent('winStreakReward', {
              detail: { streakDays: newStreak, reward: rewardAmount }
            }));
          }
        } else {
          // 只更新今日完成数
          set({
            winStreak: {
              ...state.winStreak,
              todayCompleted: newTodayCompleted,
            },
          });
        }
      },
      
      // 中断连胜
      breakWinStreak: () => {
        const state = get();
        
        // 检查是否有保护卡
        if (state.winStreak.streakProtectionCards > 0) {
          console.log('🛡️ 使用连胜保护卡，连胜未中断');
          return;
        }
        
        set({
          winStreak: {
            ...state.winStreak,
            currentStreak: 0,
            todayCompleted: 0,
          },
        });
        
        console.log('💔 连胜已中断');
      },
      
      // 使用连胜保护卡
      useStreakProtectionCard: () => {
        const state = get();
        
        if (state.winStreak.streakProtectionCards <= 0) {
          console.log('❌ 没有连胜保护卡');
          return false;
        }
        
        set({
          winStreak: {
            ...state.winStreak,
            streakProtectionCards: state.winStreak.streakProtectionCards - 1,
          },
        });
        
        console.log('🛡️ 使用连胜保护卡成功');
        return true;
      },
      
      // 添加连胜保护卡
      addStreakProtectionCard: () => {
        set((state) => ({
          winStreak: {
            ...state.winStreak,
            streakProtectionCards: state.winStreak.streakProtectionCards + 1,
          },
        }));
        
        console.log('🛡️ 获得连胜保护卡');
      },
      
      // 计算拖延税
      calculateDelayTax: (taskId, taskTitle, scheduledEnd) => {
        const now = new Date();
        const delayMs = now.getTime() - scheduledEnd.getTime();
        
        // 如果没有超时，返回0
        if (delayMs <= 0) {
          return 0;
        }
        
        const delayHours = delayMs / (1000 * 60 * 60);
        
        let taxAmount = 0;
        if (delayHours >= 24) {
          taxAmount = 100;
        } else if (delayHours >= 6) {
          taxAmount = 60;
        } else if (delayHours >= 3) {
          taxAmount = 30;
        } else if (delayHours >= 1) {
          taxAmount = 10;
        }
        
        if (taxAmount > 0) {
          console.log(`⚠️ 任务"${taskTitle}"超时 ${delayHours.toFixed(1)} 小时，拖延税: ${taxAmount} 金币`);
        }
        
        return taxAmount;
      },
      
      // 记录拖延税
      recordDelayTax: (taskId, taskTitle, taxAmount, delayHours) => {
        const tax: DelayTax = {
          taskId,
          taskTitle,
          taxAmount,
          delayHours,
          timestamp: new Date(),
        };
        
        set((state) => ({
          delayTaxes: [tax, ...state.delayTaxes].slice(0, 100), // 只保留最近100条
        }));
        
        // 扣除金币
        const { useGoldStore } = require('@/stores/goldStore');
        useGoldStore.getState().penaltyGold(taxAmount, `拖延税: ${taskTitle}`);
        
        console.log(`💸 扣除拖延税: ${taxAmount} 金币`);
      },
      
      // 获取拖延税历史
      getDelayTaxHistory: (days = 7) => {
        const state = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return state.delayTaxes.filter(
          (tax) => new Date(tax.timestamp) >= cutoffDate
        );
      },
    }),
    {
      name: 'manifestos-drive-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            
            // 恢复日期对象
            if (parsed?.state) {
              if (parsed.state.comboStreak?.lastCompletedTime) {
                parsed.state.comboStreak.lastCompletedTime = new Date(parsed.state.comboStreak.lastCompletedTime);
              }
              if (parsed.state.delayTaxes) {
                parsed.state.delayTaxes = parsed.state.delayTaxes.map((tax: any) => ({
                  ...tax,
                  timestamp: new Date(tax.timestamp),
                }));
              }
            }
            
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取驱动力存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('❌ 保存驱动力存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除驱动力存储失败:', error);
          }
        },
      },
    }
  )
);

