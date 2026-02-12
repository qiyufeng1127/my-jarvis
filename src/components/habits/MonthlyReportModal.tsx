import { useState } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import { X, Download, TrendingDown, TrendingUp, Award } from 'lucide-react';
import { HABIT_CAN_COLORS } from '@/styles/habitCanColors';

interface MonthlyReportModalProps {
  year: number;
  month: number;
  isDark: boolean;
  cardBg: string;
  textColor: string;
  accentColor: string;
  onClose: () => void;
}

export default function MonthlyReportModal({
  year,
  month,
  isDark,
  cardBg,
  textColor,
  accentColor,
  onClose,
}: MonthlyReportModalProps) {
  const { generateMonthlyReport, getMonthlyReport } = useHabitCanStore();
  const [report, setReport] = useState(() => {
    const existing = getMonthlyReport(year, month);
    return existing || generateMonthlyReport(year, month);
  });

  const handleRegenerate = () => {
    const newReport = generateMonthlyReport(year, month);
    setReport(newReport);
  };

  const handleExport = () => {
    alert('导出功能开发中...');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        backgroundColor: HABIT_CAN_COLORS.shadows.overlay,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
      }}
      onClick={onClose}
    >
      {/* iOS 风格底部弹出 Sheet */}
      <div
        className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-3xl"
        style={{
          backgroundColor: HABIT_CAN_COLORS.glassmorphism.light,
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full"
            style={{
              width: '36px',
              height: '5px',
              backgroundColor: HABIT_CAN_COLORS.eauTrouble,
              opacity: 0.3,
            }}
          />
        </div>

        {/* 内容区 */}
        <div className="px-6 pb-6">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-transform active:scale-95"
            style={{
              backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <X size={20} style={{ color: HABIT_CAN_COLORS.espresso }} />
          </button>

          {/* 标题 */}
          <div className="text-center mb-6 pt-2">
            <h2
              className="font-bold mb-2"
              style={{
                fontSize: '24px',
                color: HABIT_CAN_COLORS.espresso,
                fontWeight: 700,
              }}
            >
              📊 {year}年{month}月习惯月报
            </h2>
            <div
              style={{
                fontSize: '12px',
                color: HABIT_CAN_COLORS.eauTrouble,
                fontWeight: 300,
              }}
            >
              {new Date(report.generatedAt).toLocaleString('zh-CN')}
            </div>
          </div>

          {/* 核心数据卡片 - 毛玻璃效果 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                value: report.totalCount,
                label: '坏习惯总次数',
                bg: HABIT_CAN_COLORS.mielDore,
              },
              {
                value: report.cleanStreaks.reduce((sum, s) => sum + s.days, 0),
                label: '无坏习惯天数',
                bg: HABIT_CAN_COLORS.eauTrouble,
              },
              {
                value: report.achievements.length,
                label: '解锁成就',
                bg: HABIT_CAN_COLORS.bleuPorcelaine,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl"
                style={{
                  backgroundColor: `${item.bg}40`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className="font-bold mb-1"
                  style={{
                    fontSize: '32px',
                    color: HABIT_CAN_COLORS.espresso,
                    fontWeight: 700,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: HABIT_CAN_COLORS.espresso,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* TOP3 坏习惯 */}
          <div className="mb-6">
            <h3
              className="font-semibold mb-3 flex items-center space-x-2"
              style={{
                fontSize: '18px',
                color: HABIT_CAN_COLORS.espresso,
                fontWeight: 600,
              }}
            >
              <span>🏆</span>
              <span>本月 TOP3 坏习惯</span>
            </h3>
            <div className="space-y-3">
              {report.topHabits.map((habit, index) => (
                <div
                  key={habit.habitId}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                    boxShadow: HABIT_CAN_COLORS.shadows.card,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="font-bold"
                      style={{
                        fontSize: '20px',
                        color: HABIT_CAN_COLORS.terreCuite,
                        width: '24px',
                      }}
                    >
                      {index + 1}
                    </div>
                    <span style={{ fontSize: '28px' }}>{habit.emoji}</span>
                    <div>
                      <div
                        className="font-semibold"
                        style={{
                          fontSize: '16px',
                          color: HABIT_CAN_COLORS.espresso,
                        }}
                      >
                        {habit.habitName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: HABIT_CAN_COLORS.eauTrouble,
                        }}
                      >
                        占比 {habit.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div
                    className="font-bold"
                    style={{
                      fontSize: '24px',
                      color: HABIT_CAN_COLORS.espresso,
                    }}
                  >
                    {habit.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 改善亮点 */}
          {report.improvements.length > 0 && (
            <div className="mb-6">
              <h3
                className="font-semibold mb-3 flex items-center space-x-2"
                style={{
                  fontSize: '18px',
                  color: HABIT_CAN_COLORS.espresso,
                  fontWeight: 600,
                }}
              >
                <span>✨</span>
                <span>改善亮点</span>
              </h3>
              <div className="space-y-3">
                {report.improvements.map((imp) => (
                  <div
                    key={imp.habitId}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                      boxShadow: HABIT_CAN_COLORS.shadows.card,
                    }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span style={{ fontSize: '24px' }}>{imp.emoji}</span>
                      <div className="flex-1">
                        <div
                          className="font-semibold"
                          style={{
                            fontSize: '15px',
                            color: HABIT_CAN_COLORS.espresso,
                          }}
                        >
                          {imp.habitName}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: HABIT_CAN_COLORS.eauTrouble,
                          }}
                        >
                          {imp.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {imp.changePercentage < 0 ? (
                        <>
                          <TrendingDown size={18} style={{ color: HABIT_CAN_COLORS.bleuPorcelaine }} />
                          <span
                            className="font-bold"
                            style={{
                              fontSize: '16px',
                              color: HABIT_CAN_COLORS.bleuPorcelaine,
                            }}
                          >
                            {Math.abs(imp.changePercentage).toFixed(0)}%
                          </span>
                        </>
                      ) : imp.changePercentage > 0 ? (
                        <>
                          <TrendingUp size={18} style={{ color: HABIT_CAN_COLORS.terreCuite }} />
                          <span
                            className="font-bold"
                            style={{
                              fontSize: '16px',
                              color: HABIT_CAN_COLORS.terreCuite,
                            }}
                          >
                            +{imp.changePercentage.toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <span
                          className="font-bold"
                          style={{
                            fontSize: '14px',
                            color: HABIT_CAN_COLORS.eauTrouble,
                          }}
                        >
                          持平
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 连续无坏习惯 */}
          {report.cleanStreaks.length > 0 && (
            <div className="mb-6">
              <h3
                className="font-semibold mb-3 flex items-center space-x-2"
                style={{
                  fontSize: '18px',
                  color: HABIT_CAN_COLORS.espresso,
                  fontWeight: 600,
                }}
              >
                <span>🌟</span>
                <span>连续无坏习惯记录</span>
              </h3>
              <div className="space-y-2">
                {report.cleanStreaks.map((streak, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        color: HABIT_CAN_COLORS.espresso,
                      }}
                    >
                      {streak.startDate} ~ {streak.endDate}
                    </div>
                    <div
                      className="font-bold"
                      style={{
                        fontSize: '14px',
                        color: HABIT_CAN_COLORS.terreCuite,
                      }}
                    >
                      连续 {streak.days} 天
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 解锁成就 */}
          {report.achievements.length > 0 && (
            <div className="mb-6">
              <h3
                className="font-semibold mb-3 flex items-center space-x-2"
                style={{
                  fontSize: '18px',
                  color: HABIT_CAN_COLORS.espresso,
                  fontWeight: 600,
                }}
              >
                <Award size={20} style={{ color: HABIT_CAN_COLORS.terreCuite }} />
                <span>本月解锁成就</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {report.achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-xl text-center"
                    style={{
                      backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                      boxShadow: HABIT_CAN_COLORS.shadows.card,
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                      {achievement.emoji}
                    </div>
                    <div
                      className="font-semibold mb-1"
                      style={{
                        fontSize: '14px',
                        color: HABIT_CAN_COLORS.espresso,
                      }}
                    >
                      {achievement.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: HABIT_CAN_COLORS.eauTrouble,
                      }}
                    >
                      {achievement.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下月建议 */}
          <div className="mb-6">
            <h3
              className="font-semibold mb-3 flex items-center space-x-2"
              style={{
                fontSize: '18px',
                color: HABIT_CAN_COLORS.espresso,
                fontWeight: 600,
              }}
            >
              <span>💡</span>
              <span>下月改善建议</span>
            </h3>
            <div className="space-y-2">
              {report.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                  }}
                >
                  <div
                    className="font-semibold"
                    style={{
                      fontSize: '14px',
                      color: HABIT_CAN_COLORS.terreCuite,
                    }}
                  >
                    {index + 1}.
                  </div>
                  <div
                    className="flex-1"
                    style={{
                      fontSize: '14px',
                      color: HABIT_CAN_COLORS.espresso,
                      lineHeight: '1.5',
                    }}
                  >
                    {suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              onClick={handleRegenerate}
              className="flex-1 py-3 rounded-xl font-medium transition-transform active:scale-98"
              style={{
                backgroundColor: HABIT_CAN_COLORS.nuageDeLait,
                color: HABIT_CAN_COLORS.espresso,
                fontSize: '16px',
                minHeight: '48px',
              }}
            >
              重新生成
            </button>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-transform active:scale-98"
              style={{
                backgroundColor: HABIT_CAN_COLORS.terreCuite,
                color: HABIT_CAN_COLORS.nuageDeLait,
                fontSize: '16px',
                minHeight: '48px',
              }}
            >
              <Download size={18} />
              <span>导出月报</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
