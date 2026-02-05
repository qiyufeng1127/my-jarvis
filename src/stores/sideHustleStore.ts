import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SideHustle, IncomeRecord, ExpenseRecord, TimeRecord, DebtRecord } from '@/types';

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
  loadSideHustles: () => void;
  createSideHustle: (sideHustle: Partial<SideHustle>) => SideHustle;
  updateSideHustle: (id: string, updates: Partial<SideHustle>) => void;
  deleteSideHustle: (id: string) => void;
  selectSideHustle: (sideHustle: SideHustle | null) => void;
  
  // Actions - 收入管理
  addIncome: (income: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  deleteIncome: (id: string) => void;
  
  // Actions - 支出管理
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  
  // Actions - 时间记录（自动统计）
  addTimeRecord: (timeRecord: Omit<TimeRecord, 'id' | 'createdAt'>) => void;
  
  // Actions - 负债管理
  addDebt: (debt: Omit<DebtRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, updates: Partial<DebtRecord>) => void;
  deleteDebt: (id: string) => void;
  
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

      // 副业管理
      loadSideHustles: () => {
        console.log('📦 使用本地存储的副业数据');
      },

      createSideHustle: (sideHustleData) => {
        const userId = 'local-user';
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
        
        set((state) => ({
          sideHustles: [newSideHustle, ...state.sideHustles],
        }));
        
        console.log('✅ 创建副业成功:', newSideHustle.name);
        return newSideHustle;
      },

      updateSideHustle: (id, updates) => {
        set((state) => ({
          sideHustles: state.sideHustles.map((sh) =>
            sh.id === id ? { ...sh, ...updates, updatedAt: new Date() } : sh
          ),
        }));
      },

      deleteSideHustle: (id) => {
        set((state) => ({
          sideHustles: state.sideHustles.filter((sh) => sh.id !== id),
        }));
      },

      selectSideHustle: (sideHustle) => {
        set({ selectedSideHustle: sideHustle });
      },

      // 收入管理
      addIncome: (incomeData) => {
        const newIncome: IncomeRecord = {
          id: crypto.randomUUID(),
          ...incomeData,
          createdAt: new Date(),
        };
        
        set((state) => ({
          incomeRecords: [newIncome, ...state.incomeRecords],
        }));
        
        // 更新副业的总收入和利润
        const sideHustle = get().getSideHustleById(incomeData.sideHustleId);
        if (sideHustle) {
          const newTotalIncome = sideHustle.totalIncome + incomeData.amount;
          const newProfit = newTotalIncome - sideHustle.totalExpense;
          const newHourlyRate = sideHustle.totalHours > 0 ? newTotalIncome / sideHustle.totalHours : 0;
          const newROI = sideHustle.totalExpense > 0 ? ((newTotalIncome - sideHustle.totalExpense) / sideHustle.totalExpense) * 100 : 0;
          
          get().updateSideHustle(sideHustle.id, {
            totalIncome: newTotalIncome,
            profit: newProfit,
            hourlyRate: newHourlyRate,
            roi: newROI,
          });
        }
      },

      deleteIncome: (id) => {
        const income = get().incomeRecords.find((i) => i.id === id);
        
        set((state) => ({
          incomeRecords: state.incomeRecords.filter((i) => i.id !== id),
        }));
        
        // 更新副业的总收入和利润
        if (income) {
          const sideHustle = get().getSideHustleById(income.sideHustleId);
          if (sideHustle) {
            const newTotalIncome = sideHustle.totalIncome - income.amount;
            const newProfit = newTotalIncome - sideHustle.totalExpense;
            const newHourlyRate = sideHustle.totalHours > 0 ? newTotalIncome / sideHustle.totalHours : 0;
            const newROI = sideHustle.totalExpense > 0 ? ((newTotalIncome - sideHustle.totalExpense) / sideHustle.totalExpense) * 100 : 0;
            
            get().updateSideHustle(sideHustle.id, {
              totalIncome: newTotalIncome,
              profit: newProfit,
              hourlyRate: newHourlyRate,
              roi: newROI,
            });
          }
        }
      },

      // 支出管理
      addExpense: (expenseData) => {
        const newExpense: ExpenseRecord = {
          id: crypto.randomUUID(),
          ...expenseData,
          createdAt: new Date(),
        };
        
        set((state) => ({
          expenseRecords: [newExpense, ...state.expenseRecords],
        }));
        
        // 更新副业的总支出和利润
        const sideHustle = get().getSideHustleById(expenseData.sideHustleId);
        if (sideHustle) {
          const newTotalExpense = sideHustle.totalExpense + expenseData.amount;
          const newProfit = sideHustle.totalIncome - newTotalExpense;
          const newROI = newTotalExpense > 0 ? ((sideHustle.totalIncome - newTotalExpense) / newTotalExpense) * 100 : 0;
          
          get().updateSideHustle(sideHustle.id, {
            totalExpense: newTotalExpense,
            profit: newProfit,
            roi: newROI,
          });
        }
      },

      deleteExpense: (id) => {
        const expense = get().expenseRecords.find((e) => e.id === id);
        
        set((state) => ({
          expenseRecords: state.expenseRecords.filter((e) => e.id !== id),
        }));
        
        // 更新副业的总支出和利润
        if (expense) {
          const sideHustle = get().getSideHustleById(expense.sideHustleId);
          if (sideHustle) {
            const newTotalExpense = sideHustle.totalExpense - expense.amount;
            const newProfit = sideHustle.totalIncome - newTotalExpense;
            const newROI = newTotalExpense > 0 ? ((sideHustle.totalIncome - newTotalExpense) / newTotalExpense) * 100 : 0;
            
            get().updateSideHustle(sideHustle.id, {
              totalExpense: newTotalExpense,
              profit: newProfit,
              roi: newROI,
            });
          }
        }
      },

      // 时间记录
      addTimeRecord: (timeRecordData) => {
        const newTimeRecord: TimeRecord = {
          id: crypto.randomUUID(),
          ...timeRecordData,
          createdAt: new Date(),
        };
        
        set((state) => ({
          timeRecords: [newTimeRecord, ...state.timeRecords],
        }));
        
        // 更新副业的总时长和时薪
        const sideHustle = get().getSideHustleById(timeRecordData.sideHustleId);
        if (sideHustle) {
          const newTotalHours = sideHustle.totalHours + (timeRecordData.duration / 60);
          const newHourlyRate = newTotalHours > 0 ? sideHustle.totalIncome / newTotalHours : 0;
          
          get().updateSideHustle(sideHustle.id, {
            totalHours: newTotalHours,
            hourlyRate: newHourlyRate,
          });
        }
      },

      // 负债管理
      addDebt: (debtData) => {
        const userId = 'local-user';
        const newDebt: DebtRecord = {
          id: crypto.randomUUID(),
          userId,
          ...debtData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          debtRecords: [newDebt, ...state.debtRecords],
        }));
      },

      updateDebt: (id, updates) => {
        set((state) => ({
          debtRecords: state.debtRecords.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        }));
      },

      deleteDebt: (id) => {
        set((state) => ({
          debtRecords: state.debtRecords.filter((d) => d.id !== id),
        }));
      },

      // 计算方法
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

      // 效率分析
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
