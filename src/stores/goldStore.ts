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
  transactionKey?: string;
}

interface GoldState {
  balance: number;
  todayEarned: number;
  todaySpent: number;
  transactions: GoldTransaction[];
  lastResetDate: string;
  
  // Actions
  addGold: (amount: number, reason: string, taskId?: string, taskTitle?: string, transactionKey?: string) => void;
  spendGold: (amount: number, reason: string, transactionKey?: string) => void;
  deductGold: (amount: number, reason: string, taskId?: string, taskTitle?: string, transactionKey?: string) => boolean;
  penaltyGold: (amount: number, reason: string, taskId?: string, taskTitle?: string, transactionKey?: string) => void;
  hasTransaction: (transactionKey: string) => boolean;
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

      hasTransaction: (transactionKey) => {
        if (!transactionKey) return false;
        return get().transactions.some((transaction) => transaction.transactionKey === transactionKey);
      },
      
      addGold: (amount, reason, taskId, taskTitle, transactionKey) => {
        if (transactionKey && get().hasTransaction(transactionKey)) {
          console.warn(`⚠️ 跳过重复金币增加: ${transactionKey}`);
          return;
        }

        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'earn',
          amount,
          reason,
          taskId,
          taskTitle,
          timestamp: new Date(),
          transactionKey,
        };
        
        set((state) => {
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
      
      spendGold: (amount, reason, transactionKey) => {
        const state = get();
        if (transactionKey && state.hasTransaction(transactionKey)) {
          console.warn(`⚠️ 跳过重复金币消费: ${transactionKey}`);
          return;
        }
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
          transactionKey,
        };
        
        set((state) => {
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
      
      deductGold: (amount, reason, taskId, taskTitle, transactionKey) => {
        const state = get();

        if (transactionKey && state.hasTransaction(transactionKey)) {
          console.warn(`⚠️ 跳过重复金币扣除: ${transactionKey}`);
          return true;
        }
        
        // 校验金币余额是否足够
        if (state.balance < amount) {
          console.warn(`⚠️ 金币余额不足: 需要 ${amount}，当前余额 ${state.balance}`);
          return false;
        }
        
        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'spend',
          amount,
          reason,
          taskId,
          taskTitle,
          timestamp: new Date(),
          transactionKey,
        };
        
        set((state) => {
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
        
        console.log(`💸 扣除金币: -${amount} (${reason})，当前余额: ${get().balance}`);
        return true;
      },
      
      penaltyGold: (amount, reason, taskId, taskTitle, transactionKey) => {
        const state = get();

        if (transactionKey && state.hasTransaction(transactionKey)) {
          console.warn(`⚠️ 跳过重复惩罚扣币: ${transactionKey}`);
          return;
        }

        const transaction: GoldTransaction = {
          id: crypto.randomUUID(),
          type: 'penalty',
          amount,
          reason,
          taskId,
          taskTitle,
          timestamp: new Date(),
          transactionKey,
        };
        
        set((state) => {
          const today = new Date().toDateString();
          if (state.lastResetDate !== today) {
            return {
              balance: state.balance - amount, // 允许负数
              todayEarned: 0,
              todaySpent: amount,
              transactions: [transaction, ...state.transactions],
              lastResetDate: today,
            };
          }
          
          return {
            balance: state.balance - amount, // 允许负数
            todaySpent: state.todaySpent + amount,
            transactions: [transaction, ...state.transactions],
          };
        });
        
        console.log(`⚠️ 扣除金币: -${amount} (${reason})，当前余额: ${get().balance}`);
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
      name: 'manifestos-gold-storage', // 使用唯一的存储 key
      version: 1, // 添加版本号
      partialize: (state) => ({ 
        balance: state.balance,
        todayEarned: state.todayEarned,
        todaySpent: state.todaySpent,
        transactions: state.transactions,
        lastResetDate: state.lastResetDate,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // 恢复日期对象
            if (parsed?.state?.transactions) {
              parsed.state.transactions = parsed.state.transactions.map((t: any) => ({
                ...t,
                timestamp: new Date(t.timestamp),
              }));
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ 读取金币存储失败:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('💾 金币数据已保存到本地存储，余额:', value?.state?.balance || 0);
          } catch (error) {
            console.error('❌ 保存金币存储失败:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('⚠️ 删除金币存储失败:', error);
          }
        },
      },
      // 合并策略：保留本地数据
      merge: (persistedState: any, currentState: any) => {
        console.log('🔄 合并金币数据...');
        return {
          ...currentState,
          balance: persistedState?.balance ?? currentState.balance,
          todayEarned: persistedState?.todayEarned ?? currentState.todayEarned,
          todaySpent: persistedState?.todaySpent ?? currentState.todaySpent,
          transactions: persistedState?.transactions || currentState.transactions,
          lastResetDate: persistedState?.lastResetDate || currentState.lastResetDate,
        };
      },
    }
  )
);

