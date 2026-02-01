import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SideHustle, IncomeRecord, ExpenseRecord, TimeRecord, DebtRecord } from '@/types';
import { supabase, TABLES, isSupabaseConfigured, getCurrentUserId } from '@/lib/supabase';

interface SideHustleState {
  // 数据
  sideHustles: SideHustle[];
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
  timeRecords: TimeRecord[];
  debtRecords: DebtRecord[];
  
  // UI 状态
  selectedSideHustle: SideHustle | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions - 副业管理
  loadSideHustles: () => Promise<void>;
  createSideHustle: (sideHustle: Partial<SideHustle>) => Promise<SideHustle>;
  updateSideHustle: (id: string, updates: Partial<SideHustle>) => Promise<void>;
  deleteSideHustle: (id: string) => Promise<void>;
  selectSideHustle: (sideHustle: SideHustle | null) => void;
  
  // Actions - 收入管理
  addIncome: (income: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  
  // Actions - 支出管理
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Actions - 时间记录（自动统计）
  addTimeRecord: (timeRecord: Omit<TimeRecord, 'id' | 'createdAt'>) => Promise<void>;
  
  // Actions - 负债管理
  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDebt: (id: string, updates: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // 计算方法
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getTotalProfit: () => number;
  getTotalDebt: () => number;
  getActiveSideHustles: () => SideHustle[];
  getIdeas: () => SideHustle[];
  getSideHustleById: (id: string) => SideHustle | undefined;
  
  // 效率分析
  getRankedByHourlyRate: () => SideHustle[];
  getRankedByROI: () => SideHustle[];
  getRankedByProfit: () => SideHustle[];
}

export const useSideHustleStore = create<SideHustleState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sideHustles: [],
      incomeRecords: [],
      expenseRecords: [],
      timeRecords: [],
      debtRecords: [],
      selectedSideHustle: null,
      isLoading: false,
      error: null,

      // ============================================
      // 副业管理
      // ============================================
      
      loadSideHustles: async () => {
        set({ isLoading: true, error: null });
        
        try {
          if (isSupabaseConfigured()) {
            const userId = getCurrentUserId();
            console.log('📥 从 Supabase 加载副业数据，用户ID:', userId);
            
            // 加载副业
            const { data: hustlesData, error: hustlesError } = await supabase
              .from('side_hustles')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });
            
            if (hustlesError) throw hustlesError;
            
            // 加载收入记录
            const { data: incomeData, error: incomeError } = await supabase
              .from('income_records')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });
            
            if (incomeError) throw incomeError;
            
            // 加载支出记录
            const { data: expenseData, error: expenseError } = await supabase
              .from('expense_records')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });
            
            if (expenseError) throw expenseError;
            
            // 加载时间记录
            const { data: timeData, error: timeError } = await supabase
              .from('time_records')
              .select('*')
              .eq('user_id', userId)
              .order('date', { ascending: false });
            
            if (timeError) throw timeError;
            
            // 加载负债记录
            const { data: debtData, error: debtError } = await supabase
              .from('debt_records')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });
            
            if (debtError) throw debtError;
            
            // 转换数据
            const sideHustles: SideHustle[] = (hustlesData || []).map((row: any) => ({
              id: row.id,
              userId: row.user_id,
              name: row.name,
              icon: row.icon,
              color: row.color,
              startDate: row.start_date ? new Date(row.start_date) : undefined,
              totalHours: row.total_hours || 0,
              totalIncome: row.total_income || 0,
              totalExpense: row.total_expense || 0,
              profit: row.profit || 0,
              hourlyRate: row.hourly_rate || 0,
              roi: row.roi || 0,
              goalId: row.goal_id,
              aiAnalysis: row.ai_analysis,
              status: row.status,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
            }));
            
            const incomeRecords: IncomeRecord[] = (incomeData || []).map((row: any) => ({
              id: row.id,
              sideHustleId: row.side_hustle_id,
              amount: row.amount,
              description: row.description,
              date: new Date(row.date),
              createdAt: new Date(row.created_at),
            }));
            
            const expenseRecords: ExpenseRecord[] = (expenseData || []).map((row: any) => ({
              id: row.id,
              sideHustleId: row.side_hustle_id,
              amount: row.amount,
              description: row.description,
              date: new Date(row.date),
              createdAt: new Date(row.created_at),
            }));
            
            const timeRecords: TimeRecord[] = (timeData || []).map((row: any) => ({
              id: row.id,
              sideHustleId: row.side_hustle_id,
              duration: row.duration,
              date: new Date(row.date),
              taskId: row.task_id,
              taskTitle: row.task_title,
              createdAt: new Date(row.created_at),
            }));
            
            const debtRecords: DebtRecord[] = (debtData || []).map((row: any) => ({
              id: row.id,
              userId: row.user_id,
              amount: row.amount,
              description: row.description,
              dueDate: row.due_date ? new Date(row.due_date) : undefined,
              isPaid: row.is_paid,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
            }));
            
            console.log('✅ 从 Supabase 加载了', sideHustles.length, '个副业');
            set({ 
              sideHustles, 
              incomeRecords, 
              expenseRecords, 
              timeRecords, 
              debtRecords, 
              isLoading: false 
            });
          } else {
            console.log('⚠️ Supabase 未配置，使用本地存储');
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('❌ 加载副业数据失败:', error);
          set({ error: '从云端加载失败，使用本地数据', isLoading: false });
        }
      },

      createSideHustle: async (sideHustleData) => {
        set({ isLoading: true, error: null });
        
        try {
          const userId = getCurrentUserId();
          const newSideHustle: SideHustle = {
            id: crypto.randomUUID(),
            userId,
            name: sideHustleData.name || '新副业',
            icon: sideHustleData.icon || '💼',
            color: sideHustleData.color || '#3b82f6',
            startDate: sideHustleData.startDate,
            totalHours: 0,
            totalIncome: 0,
            totalExpense: 0,
            profit: 0,
            hourlyRate: 0,
            roi: 0,
            goalId: sideHustleData.goalId,
            aiAnalysis: sideHustleData.aiAnalysis,
            status: sideHustleData.status || 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('side_hustles')
              .insert({
                id: newSideHustle.id,
                user_id: newSideHustle.userId,
                name: newSideHustle.name,
                icon: newSideHustle.icon,
                color: newSideHustle.color,
                start_date: newSideHustle.startDate?.toISOString(),
                total_hours: newSideHustle.totalHours,
                total_income: newSideHustle.totalIncome,
                total_expense: newSideHustle.totalExpense,
                profit: newSideHustle.profit,
                hourly_rate: newSideHustle.hourlyRate,
                roi: newSideHustle.roi,
                goal_id: newSideHustle.goalId,
                ai_analysis: newSideHustle.aiAnalysis,
                status: newSideHustle.status,
                created_at: newSideHustle.createdAt.toISOString(),
                updated_at: newSideHustle.updatedAt.toISOString(),
              });
            
            if (error) throw error;
          }
          
          set((state) => ({
            sideHustles: [newSideHustle, ...state.sideHustles],
            isLoading: false,
          }));
          
          console.log('✅ 创建副业成功:', newSideHustle.name);
          return newSideHustle;
        } catch (error) {
          console.error('❌ 创建副业失败:', error);
          set({ error: '创建副业失败', isLoading: false });
          throw error;
        }
      },

      updateSideHustle: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedData = {
            ...updates,
            updatedAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('side_hustles')
              .update({
                name: updates.name,
                icon: updates.icon,
                color: updates.color,
                start_date: updates.startDate?.toISOString(),
                total_hours: updates.totalHours,
                total_income: updates.totalIncome,
                total_expense: updates.totalExpense,
                profit: updates.profit,
                hourly_rate: updates.hourlyRate,
                roi: updates.roi,
                goal_id: updates.goalId,
                ai_analysis: updates.aiAnalysis,
                status: updates.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            sideHustles: state.sideHustles.map((sh) =>
              sh.id === id ? { ...sh, ...updatedData } : sh
            ),
            isLoading: false,
          }));
          
          console.log('✅ 更新副业成功:', id);
        } catch (error) {
          console.error('❌ 更新副业失败:', error);
          set({ error: '更新副业失败', isLoading: false });
          throw error;
        }
      },

      deleteSideHustle: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('side_hustles')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            sideHustles: state.sideHustles.filter((sh) => sh.id !== id),
            isLoading: false,
          }));
          
          console.log('✅ 删除副业成功:', id);
        } catch (error) {
          console.error('❌ 删除副业失败:', error);
          set({ error: '删除副业失败', isLoading: false });
          throw error;
        }
      },

      selectSideHustle: (sideHustle) => {
        set({ selectedSideHustle: sideHustle });
      },

      // ============================================
      // 收入管理
      // ============================================
      
      addIncome: async (incomeData) => {
        set({ isLoading: true, error: null });
        
        try {
          const userId = getCurrentUserId();
          const newIncome: IncomeRecord = {
            id: crypto.randomUUID(),
            ...incomeData,
            createdAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('income_records')
              .insert({
                id: newIncome.id,
                user_id: userId,
                side_hustle_id: newIncome.sideHustleId,
                amount: newIncome.amount,
                description: newIncome.description,
                date: newIncome.date.toISOString(),
                created_at: newIncome.createdAt.toISOString(),
              });
            
            if (error) throw error;
          }
          
          set((state) => ({
            incomeRecords: [newIncome, ...state.incomeRecords],
            isLoading: false,
          }));
          
          // 更新副业的总收入和利润
          const sideHustle = get().getSideHustleById(incomeData.sideHustleId);
          if (sideHustle) {
            const newTotalIncome = sideHustle.totalIncome + incomeData.amount;
            const newProfit = newTotalIncome - sideHustle.totalExpense;
            const newHourlyRate = sideHustle.totalHours > 0 ? newTotalIncome / sideHustle.totalHours : 0;
            const newROI = sideHustle.totalExpense > 0 ? ((newTotalIncome - sideHustle.totalExpense) / sideHustle.totalExpense) * 100 : 0;
            
            await get().updateSideHustle(sideHustle.id, {
              totalIncome: newTotalIncome,
              profit: newProfit,
              hourlyRate: newHourlyRate,
              roi: newROI,
            });
          }
          
          console.log('✅ 添加收入成功:', newIncome.amount);
        } catch (error) {
          console.error('❌ 添加收入失败:', error);
          set({ error: '添加收入失败', isLoading: false });
          throw error;
        }
      },

      deleteIncome: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const income = get().incomeRecords.find((i) => i.id === id);
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('income_records')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            incomeRecords: state.incomeRecords.filter((i) => i.id !== id),
            isLoading: false,
          }));
          
          // 更新副业的总收入和利润
          if (income) {
            const sideHustle = get().getSideHustleById(income.sideHustleId);
            if (sideHustle) {
              const newTotalIncome = sideHustle.totalIncome - income.amount;
              const newProfit = newTotalIncome - sideHustle.totalExpense;
              const newHourlyRate = sideHustle.totalHours > 0 ? newTotalIncome / sideHustle.totalHours : 0;
              const newROI = sideHustle.totalExpense > 0 ? ((newTotalIncome - sideHustle.totalExpense) / sideHustle.totalExpense) * 100 : 0;
              
              await get().updateSideHustle(sideHustle.id, {
                totalIncome: newTotalIncome,
                profit: newProfit,
                hourlyRate: newHourlyRate,
                roi: newROI,
              });
            }
          }
          
          console.log('✅ 删除收入成功:', id);
        } catch (error) {
          console.error('❌ 删除收入失败:', error);
          set({ error: '删除收入失败', isLoading: false });
          throw error;
        }
      },

      // ============================================
      // 支出管理
      // ============================================
      
      addExpense: async (expenseData) => {
        set({ isLoading: true, error: null });
        
        try {
          const userId = getCurrentUserId();
          const newExpense: ExpenseRecord = {
            id: crypto.randomUUID(),
            ...expenseData,
            createdAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('expense_records')
              .insert({
                id: newExpense.id,
                user_id: userId,
                side_hustle_id: newExpense.sideHustleId,
                amount: newExpense.amount,
                description: newExpense.description,
                date: newExpense.date.toISOString(),
                created_at: newExpense.createdAt.toISOString(),
              });
            
            if (error) throw error;
          }
          
          set((state) => ({
            expenseRecords: [newExpense, ...state.expenseRecords],
            isLoading: false,
          }));
          
          // 更新副业的总支出和利润
          const sideHustle = get().getSideHustleById(expenseData.sideHustleId);
          if (sideHustle) {
            const newTotalExpense = sideHustle.totalExpense + expenseData.amount;
            const newProfit = sideHustle.totalIncome - newTotalExpense;
            const newROI = newTotalExpense > 0 ? ((sideHustle.totalIncome - newTotalExpense) / newTotalExpense) * 100 : 0;
            
            await get().updateSideHustle(sideHustle.id, {
              totalExpense: newTotalExpense,
              profit: newProfit,
              roi: newROI,
            });
          }
          
          console.log('✅ 添加支出成功:', newExpense.amount);
        } catch (error) {
          console.error('❌ 添加支出失败:', error);
          set({ error: '添加支出失败', isLoading: false });
          throw error;
        }
      },

      deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const expense = get().expenseRecords.find((e) => e.id === id);
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('expense_records')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            expenseRecords: state.expenseRecords.filter((e) => e.id !== id),
            isLoading: false,
          }));
          
          // 更新副业的总支出和利润
          if (expense) {
            const sideHustle = get().getSideHustleById(expense.sideHustleId);
            if (sideHustle) {
              const newTotalExpense = sideHustle.totalExpense - expense.amount;
              const newProfit = sideHustle.totalIncome - newTotalExpense;
              const newROI = newTotalExpense > 0 ? ((sideHustle.totalIncome - newTotalExpense) / newTotalExpense) * 100 : 0;
              
              await get().updateSideHustle(sideHustle.id, {
                totalExpense: newTotalExpense,
                profit: newProfit,
                roi: newROI,
              });
            }
          }
          
          console.log('✅ 删除支出成功:', id);
        } catch (error) {
          console.error('❌ 删除支出失败:', error);
          set({ error: '删除支出失败', isLoading: false });
          throw error;
        }
      },

      // ============================================
      // 时间记录（自动统计）
      // ============================================
      
      addTimeRecord: async (timeRecordData) => {
        try {
          const userId = getCurrentUserId();
          const newTimeRecord: TimeRecord = {
            id: crypto.randomUUID(),
            ...timeRecordData,
            createdAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('time_records')
              .insert({
                id: newTimeRecord.id,
                user_id: userId,
                side_hustle_id: newTimeRecord.sideHustleId,
                duration: newTimeRecord.duration,
                date: newTimeRecord.date.toISOString(),
                task_id: newTimeRecord.taskId,
                task_title: newTimeRecord.taskTitle,
                created_at: newTimeRecord.createdAt.toISOString(),
              });
            
            if (error) throw error;
          }
          
          set((state) => ({
            timeRecords: [newTimeRecord, ...state.timeRecords],
          }));
          
          // 更新副业的总时长和时薪
          const sideHustle = get().getSideHustleById(timeRecordData.sideHustleId);
          if (sideHustle) {
            const newTotalHours = sideHustle.totalHours + (timeRecordData.duration / 60);
            const newHourlyRate = newTotalHours > 0 ? sideHustle.totalIncome / newTotalHours : 0;
            
            await get().updateSideHustle(sideHustle.id, {
              totalHours: newTotalHours,
              hourlyRate: newHourlyRate,
            });
          }
          
          console.log('✅ 添加时间记录成功:', newTimeRecord.duration, '分钟');
        } catch (error) {
          console.error('❌ 添加时间记录失败:', error);
          throw error;
        }
      },

      // ============================================
      // 负债管理
      // ============================================
      
      addDebt: async (debtData) => {
        set({ isLoading: true, error: null });
        
        try {
          const userId = getCurrentUserId();
          const newDebt: DebtRecord = {
            id: crypto.randomUUID(),
            userId,
            ...debtData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('debt_records')
              .insert({
                id: newDebt.id,
                user_id: newDebt.userId,
                amount: newDebt.amount,
                description: newDebt.description,
                due_date: newDebt.dueDate?.toISOString(),
                is_paid: newDebt.isPaid,
                created_at: newDebt.createdAt.toISOString(),
                updated_at: newDebt.updatedAt.toISOString(),
              });
            
            if (error) throw error;
          }
          
          set((state) => ({
            debtRecords: [newDebt, ...state.debtRecords],
            isLoading: false,
          }));
          
          console.log('✅ 添加负债成功:', newDebt.amount);
        } catch (error) {
          console.error('❌ 添加负债失败:', error);
          set({ error: '添加负债失败', isLoading: false });
          throw error;
        }
      },

      updateDebt: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('debt_records')
              .update({
                amount: updates.amount,
                description: updates.description,
                due_date: updates.dueDate?.toISOString(),
                is_paid: updates.isPaid,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            debtRecords: state.debtRecords.map((d) =>
              d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
            ),
            isLoading: false,
          }));
          
          console.log('✅ 更新负债成功:', id);
        } catch (error) {
          console.error('❌ 更新负债失败:', error);
          set({ error: '更新负债失败', isLoading: false });
          throw error;
        }
      },

      deleteDebt: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          if (isSupabaseConfigured()) {
            const { error } = await supabase
              .from('debt_records')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
          }
          
          set((state) => ({
            debtRecords: state.debtRecords.filter((d) => d.id !== id),
            isLoading: false,
          }));
          
          console.log('✅ 删除负债成功:', id);
        } catch (error) {
          console.error('❌ 删除负债失败:', error);
          set({ error: '删除负债失败', isLoading: false });
          throw error;
        }
      },

      // ============================================
      // 计算方法
      // ============================================
      
      getTotalIncome: () => {
        return get().sideHustles.reduce((sum, sh) => sum + sh.totalIncome, 0);
      },

      getTotalExpense: () => {
        return get().sideHustles.reduce((sum, sh) => sum + sh.totalExpense, 0);
      },

      getTotalProfit: () => {
        return get().getTotalIncome() - get().getTotalExpense();
      },

      getTotalDebt: () => {
        return get().debtRecords
          .filter((d) => !d.isPaid)
          .reduce((sum, d) => sum + d.amount, 0);
      },

      getActiveSideHustles: () => {
        return get().sideHustles.filter((sh) => sh.status === 'active');
      },

      getIdeas: () => {
        return get().sideHustles.filter((sh) => sh.status === 'idea');
      },

      getSideHustleById: (id) => {
        return get().sideHustles.find((sh) => sh.id === id);
      },

      // ============================================
      // 效率分析
      // ============================================
      
      getRankedByHourlyRate: () => {
        return [...get().getActiveSideHustles()].sort((a, b) => b.hourlyRate - a.hourlyRate);
      },

      getRankedByROI: () => {
        return [...get().getActiveSideHustles()].sort((a, b) => b.roi - a.roi);
      },

      getRankedByProfit: () => {
        return [...get().getActiveSideHustles()].sort((a, b) => b.profit - a.profit);
      },
    }),
    {
      name: 'side-hustle-storage',
      partialize: (state) => ({
        sideHustles: state.sideHustles,
        incomeRecords: state.incomeRecords,
        expenseRecords: state.expenseRecords,
        timeRecords: state.timeRecords,
        debtRecords: state.debtRecords,
      }),
    }
  )
);

