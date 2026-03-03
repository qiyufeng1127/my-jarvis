import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DiaryCalendar from './DiaryCalendar';
import DiaryView from './DiaryView';
import IdealSelfView from './IdealSelfView';

interface DiarySystemProps {
  isDark?: boolean;
  bgColor?: string;
}

type DiaryType = 'content' | 'emotion' | 'success';
type ViewMode = 'calendar' | 'diary' | 'ideal-self';

// 日记系统配色 - 参考坏习惯组件
const DIARY_COLORS = {
  espresso: '#542916',
  eauTrouble: '#b79858',
  terreCuite: '#a13a1e',
  nuageDeLait: '#fefaf0',
  mielDore: '#f1c166',
  
  glassmorphism: {
    light: 'rgba(254, 250, 240, 0.8)',
  },
  
  shadows: {
    card: '0 2px 8px rgba(84, 41, 22, 0.15)',
  },
};

export default function DiarySystem({ isDark = false, bgColor = '#ffffff' }: DiarySystemProps) {
  const [diaryType, setDiaryType] = useState<DiaryType>('content');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const diaryTypes = [
    { 
      id: 'content', 
      label: '内容结构', 
      emoji: '📋',
      description: '梳理时间轴'
    },
    { 
      id: 'emotion', 
      label: '情绪链条', 
      emoji: '💗',
      description: '识别情绪模式'
    },
    { 
      id: 'success', 
      label: '成功日记', 
      emoji: '⭐',
      description: '积累自信'
    },
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('diary');
  };

  const handleBackToCalendar = () => {
    setViewMode('calendar');
  };

  const handleShowIdealSelf = () => {
    setViewMode('ideal-self');
  };

  return (
    <div 
      className="h-full overflow-auto p-6 space-y-6" 
      style={{ 
        backgroundColor: DIARY_COLORS.nuageDeLait,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
    >
      {/* 头部 - iOS风格视图切换 */}
      <div
        className="sticky top-0 z-10 rounded-2xl p-3"
        style={{
          backgroundColor: DIARY_COLORS.glassmorphism.light,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <div className="flex items-center justify-between space-x-2 mb-3">
          {diaryTypes.map((type) => {
            const isSelected = diaryType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => {
                  setDiaryType(type.id as DiaryType);
                  setViewMode('calendar');
                  setSelectedDate(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg transition-transform active:scale-95"
                style={{
                  backgroundColor: isSelected ? DIARY_COLORS.espresso : 'transparent',
                  color: isSelected ? DIARY_COLORS.nuageDeLait : DIARY_COLORS.eauTrouble,
                  fontSize: '14px',
                  fontWeight: 500,
                  minHeight: '44px',
                }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{type.emoji}</span>
                  <span>{type.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 返回按钮 */}
        {viewMode !== 'calendar' && (
          <button
            onClick={handleBackToCalendar}
            className="w-full px-4 py-2 rounded-lg transition-transform active:scale-95"
            style={{
              backgroundColor: DIARY_COLORS.nuageDeLait,
              color: DIARY_COLORS.eauTrouble,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ← 返回日历
          </button>
        )}
      </div>

      {/* 主内容区 */}
      {viewMode === 'calendar' && (
        <DiaryCalendar
          isDark={isDark}
          bgColor={bgColor}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
          diaryType={diaryType}
        />
      )}

      {viewMode === 'diary' && selectedDate && (
        <>
          <DiaryView
            isDark={isDark}
            bgColor={bgColor}
            selectedDate={selectedDate}
            diaryType={diaryType}
          />
          
          {/* 成功日记特有：理想的自己按钮 */}
          {diaryType === 'success' && (
            <button
              onClick={handleShowIdealSelf}
              className="w-full px-6 py-4 rounded-2xl flex items-center justify-center space-x-2 transition-transform active:scale-95 font-bold"
              style={{ 
                backgroundColor: DIARY_COLORS.terreCuite,
                color: DIARY_COLORS.nuageDeLait,
                fontSize: '16px',
                boxShadow: DIARY_COLORS.shadows.card,
              }}
            >
              <Sparkles className="w-5 h-5" />
              <span>✨ 理想的自己</span>
            </button>
          )}
        </>
      )}

      {viewMode === 'ideal-self' && selectedDate && (
        <IdealSelfView
          isDark={isDark}
          bgColor={bgColor}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
