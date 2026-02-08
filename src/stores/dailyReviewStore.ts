import { create } from 'zustand';
import { DailyReviewService, type DailyReview } from '@/services/dailyReviewService';

interface DailyReviewState {
  currentReview: DailyReview | null;
  isLoading: boolean;
  isGenerating: boolean;
  
  // Actions
  loadTodayReview: () => Promise<void>;
  generateTodayReview: () => Promise<void>;
  getReviewByDate: (date: Date) => DailyReview | null;
}

/**
 * 日复盘 Store
 */
export const useDailyReviewStore = create<DailyReviewState>((set, get) => ({
  currentReview: null,
  isLoading: false,
  isGenerating: false,

  // 加载今日复盘
  loadTodayReview: async () => {
    set({ isLoading: true });
    
    try {
      const today = new Date();
      const review = DailyReviewService.getDailyReview(today);
      
      if (review) {
        set({ currentReview: review });
        console.log('✅ 今日复盘已加载');
      } else {
        console.log('ℹ️ 今日还没有生成复盘');
        set({ currentReview: null });
      }
    } catch (error) {
      console.error('❌ 加载今日复盘失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 生成今日复盘
  generateTodayReview: async () => {
    set({ isGenerating: true });
    
    try {
      console.log('🔄 正在生成今日复盘...');
      const review = await DailyReviewService.generateTodayReview();
      set({ currentReview: review });
      console.log('✅ 今日复盘生成完成');
    } catch (error) {
      console.error('❌ 生成今日复盘失败:', error);
    } finally {
      set({ isGenerating: false });
    }
  },

  // 获取指定日期的复盘
  getReviewByDate: (date: Date) => {
    return DailyReviewService.getDailyReview(date);
  },
}));

