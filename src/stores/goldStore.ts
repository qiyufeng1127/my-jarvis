import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured, getCurrentUserId, getAuthUserId } from '@/lib/supabase';

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
  isSyncing: boolean; // 是否正在同步
  lastSyncTime: number; // 上次同步时间戳
  
  // Actions
  addGold: (amount: number, reason: string, taskId?: string, taskTitle?: string) => Promise<void>;
  spendGold: (amount: number, reason: string) => Promise<void>;
  penaltyGold: (amount: number, reason: string, taskId?: string, taskTitle?: string) => Promise<void>;
  getTodayTransactions: () => GoldTransaction[];
  resetDailyStats: () => void;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

export const useGoldStore = create<GoldState>()(
  persist(
    (set, get) => ({
      balance: 0,
      todayEarned: 0,
      todaySpent: 0,
      transactions: [],
      lastResetDate: new Date().toDateString(),
      isSyncing: false,
      lastSyncTime: 0,
      
      addGold: async (amount, reason, taskId, taskTitle) => {
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
        
        // 同步到云端
        await get().syncToCloud();
      },
      
      spendGold: async (amount, reason) => {
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
        
        // 同步到云端
        await get().syncToCloud();
      },
      
      penaltyGold: async (amount, reason, taskId, taskTitle) => {
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
        
        // 同步到云端
        await get().syncToCloud();
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
      
      // 同步到云端
      syncToCloud: async () => {
        if (!isSupabaseConfigured()) {
          console.log('⚠️ Supabase 未配置，跳过云端同步');
          return;
        }
        
        const state = get();
        
        // 防止频繁同步（5秒内只同步一次）
        const now = Date.now();
        if (state.isSyncing || (now - state.lastSyncTime < 5000)) {
          return;
        }
        
        set({ isSyncing: true });
        
        try {
          const userId = await getAuthUserId();
          if (!userId) {
            console.log('⚠️ 未登录，跳过云端同步');
            set({ isSyncing: false });
            return;
          }
          
          // 保存金币数据到云端
          const { error } = await supabase
            .from('gold_data')
            .upsert({
              user_id: userId,
              balance: state.balance,
              today_earned: state.todayEarned,
              today_spent: state.todaySpent,
              transactions: state.transactions,
              last_reset_date: state.lastResetDate,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id'
            });
          
          if (error) {
            console.error('❌ 同步金币数据到云端失败:', error);
          } else {
            console.log('✅ 金币数据已同步到云端');
            set({ lastSyncTime: now });
          }
        } catch (error) {
          console.error('❌ 同步金币数据异常:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
      
      // 从云端加载
      loadFromCloud: async () => {
        if (!isSupabaseConfigured()) {
          console.log('⚠️ Supabase 未配置，使用本地数据');
          return;
        }
        
        try {
          const userId = await getAuthUserId();
          if (!userId) {
            console.log('⚠️ 未登录，使用本地数据');
            return;
          }
          
          const { data, error } = await supabase
            .from('gold_data')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              console.log('ℹ️ 云端暂无金币数据');
            } else {
              console.error('❌ 加载金币数据失败:', error);
            }
            return;
          }
          
          if (data) {
            console.log('✅ 从云端加载金币数据');
            set({
              balance: data.balance || 0,
              todayEarned: data.today_earned || 0,
              todaySpent: data.today_spent || 0,
              transactions: data.transactions || [],
              lastResetDate: data.last_reset_date || new Date().toDateString(),
            });
          }
        } catch (error) {
          console.error('❌ 加载金币数据异常:', error);
        }
      },
    }),
    {
      name: 'gold-storage',
    }
  )
);

