import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GoldTransaction {
  id: string;
  type: 'earn' | 'spend' | 'penalty';
  amount: number;
  reason: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: Date;
}

interface GoldState {
  balance: number; // 当前金币余额
  todayEarned: number; // 今日收入
  todaySpent: number; // 今日支出
  transactions: GoldTransaction[]; // 交易记录
  lastResetDate: string; // 上次重置日期（用于每日重置）
  
  // Actions
  addGold: (amount: number, reason: string, taskId?: string, taskTitle?: string) => void;
  spendGold: (amount: number, reason: string) => void;
  penaltyGold: (amount: number, reason: string, taskId?: string, taskTitle?: string) => void;
  getTodayTransactions: () => GoldTransaction[];
  resetDailyStats: () => void;
}

export const useGoldStore = create<GoldState>()(
  persist(
    (set, get) => ({
      balance: 0,
      todayEarned: 0,
      todaySpent: 0,
      transactions: [],
      lastResetDate: new Date().toDateString(),
      
      addGold: (amount, reason, taskId, taskTitle) => {
        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'earn',
          amount,
          reason,
          taskId,
          taskTitle,
          timestamp: new Date(),
        };
        
        set((state) => {
          // 检查是否需要重置每日统计
          const today = new Date().toDateString();
          if (state.lastResetDate !== today) {
            return {
              balance: state.balance + amount,
              todayEarned: amount,
              todaySpent: 0,
              transactions: [transaction, ...state.transactions],
              lastResetDate: today,
            };
          }
          
          return {
            balance: state.balance + amount,
            todayEarned: state.todayEarned + amount,
            transactions: [transaction, ...state.transactions],
          };
        });
        
        console.log(`💰 获得金币: +${amount} (${reason})`);
      },
      
      spendGold: (amount, reason) => {
        const state = get();
        if (state.balance < amount) {
          console.warn('⚠️ 金币余额不足');
          return;
        }
        
        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'spend',
          amount,
          reason,
          timestamp: new Date(),
        };
        
        set((state) => {
          // 检查是否需要重置每日统计
          const today = new Date().toDateString();
          if (state.lastResetDate !== today) {
            return {
              balance: state.balance - amount,
              todayEarned: 0,
              todaySpent: amount,
              transactions: [transaction, ...state.transactions],
              lastResetDate: today,
            };
          }
          
          return {
            balance: state.balance - amount,
            todaySpent: state.todaySpent + amount,
            transactions: [transaction, ...state.transactions],
          };
        });
        
        console.log(`💸 消费金币: -${amount} (${reason})`);
      },
      
      penaltyGold: (amount, reason, taskId, taskTitle) => {
        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'penalty',
          amount,
          reason,
          taskId,
          taskTitle,
          timestamp: new Date(),
        };
        
        set((state) => {
          // 检查是否需要重置每日统计
          const today = new Date().toDateString();
          if (state.lastResetDate !== today) {
            return {
              balance: Math.max(0, state.balance - amount), // 不能为负
              todayEarned: 0,
              todaySpent: amount,
              transactions: [transaction, ...state.transactions],
              lastResetDate: today,
            };
          }
          
          return {
            balance: Math.max(0, state.balance - amount), // 不能为负
            todaySpent: state.todaySpent + amount,
            transactions: [transaction, ...state.transactions],
          };
        });
        
        console.log(`⚠️ 扣除金币: -${amount} (${reason})`);
      },
      
      getTodayTransactions: () => {
        const today = new Date().toDateString();
        return get().transactions.filter(
          (t) => new Date(t.timestamp).toDateString() === today
        );
      },
      
      resetDailyStats: () => {
        set({
          todayEarned: 0,
          todaySpent: 0,
          lastResetDate: new Date().toDateString(),
        });
      },
    }),
    {
      name: 'gold-storage',
    }
  )
);

