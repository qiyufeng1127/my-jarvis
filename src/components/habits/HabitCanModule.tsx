import { useState, useEffect } from 'react';
import HabitCanCalendar from './HabitCanCalendar';
import CanDetailModal from './CanDetailModal';
import HabitRuleSettings from './HabitRuleSettings';
import CustomizeHabitModal from './CustomizeHabitModal';
import WeekView from './WeekView';
import TrendView from './TrendView';
import MonthlyReportModal from './MonthlyReportModal';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { habitMonitorService } from '@/services/habitMonitorService';
import { Calendar, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

interface HabitCanModuleProps {
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
}

type ViewMode = 'month' | 'week' | 'trend';

export default function HabitCanModule({
  isDark,
  cardBg,
  textColor,
  accentColor,
}: HabitCanModuleProps) {
  const { initializePresets } = useHabitCanStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // 初始化
  useEffect(() => {
    initializePresets();
    habitMonitorService.initialize();

    return () => {
      habitMonitorService.destroy();
    };
  }, [initializePresets]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* iOS 风格视图切换 - 一排显示，无图标 */}
      <div
        className="sticky top-0 z-10 rounded-2xl p-3"
        style={{
          backgroundColor: HABIT_CAN_COLORS.glassmorphism.light,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: HABIT_CAN_COLORS.shadows.card,
        }}
      >
        <div className="flex items-center justify-between space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className="flex-1 px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: viewMode === 'month' ? HABIT_CAN_COLORS.espresso : 'transparent',
              color: viewMode === 'month' ? HABIT_CAN_COLORS.nuageDeLait : HABIT_CAN_COLORS.eauTrouble,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            月视图
          </button>
          <button
            onClick={() => setViewMode('week')}
            className="flex-1 px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: viewMode === 'week' ? HABIT_CAN_COLORS.espresso : 'transparent',
              color: viewMode === 'week' ? HABIT_CAN_COLORS.nuageDeLait : HABIT_CAN_COLORS.eauTrouble,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            周视图
          </button>
          <button
            onClick={() => setViewMode('trend')}
            className="flex-1 px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: viewMode === 'trend' ? HABIT_CAN_COLORS.espresso : 'transparent',
              color: viewMode === 'trend' ? HABIT_CAN_COLORS.nuageDeLait : HABIT_CAN_COLORS.eauTrouble,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            30天趋势
          </button>
          <button
            onClick={() => setShowMonthlyReport(true)}
            className="flex-1 px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: HABIT_CAN_COLORS.terreCuite,
              color: HABIT_CAN_COLORS.nuageDeLait,
              fontSize: '14px',
              fontWeight: 500,
              minHeight: '44px',
            }}
          >
            查看月报
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {viewMode === 'month' && (
        <HabitCanCalendar
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
          onOpenSettings={() => setShowSettings(true)}
          onOpenCustomize={() => setShowCustomize(true)}
          onOpenCanDetail={(date) => setSelectedDate(date)}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
        />
      )}

      {viewMode === 'trend' && (
        <TrendView
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
        />
      )}

      {/* 罐头详情弹窗 */}
      {selectedDate && (
        <CanDetailModal
          date={selectedDate}
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* 规则设置弹窗 */}
      {showSettings && (
        <HabitRuleSettings
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 自定义坏习惯弹窗 */}
      {showCustomize && (
        <CustomizeHabitModal
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
          onClose={() => setShowCustomize(false)}
        />
      )}

      {/* 月报弹窗 */}
      {showMonthlyReport && (
        <MonthlyReportModal
          year={currentYear}
          month={currentMonth}
          isDark={isDark}
          cardBg={cardBg}
          textColor={textColor}
          accentColor={accentColor}
          onClose={() => setShowMonthlyReport(false)}
        />
      )}
    </div>
  );
}

