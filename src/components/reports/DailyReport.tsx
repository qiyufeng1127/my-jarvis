import { useState } from 'react';
import { Calendar, TrendingUp, Award, AlertCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface DailyReportData {
  date: Date;
  tasks: {
    completed: number;
    total: number;
    completionRate: number;
  };
  gold: {
    earned: number;
    spent: number;
    balance: number;
  };
  growth: {
    dimension: string;
    change: number;
    icon: string;
  }[];
  badHabits: {
    name: string;
    count: number;
  }[];
  highlights: string[];
  improvements: string[];
  suggestions: string[];
}

interface DailyReportProps {
  report: DailyReportData;
  onShare: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  hasNextDay: boolean;
}

export default function DailyReport({
  report,
  onShare,
  onPrevDay,
  onNextDay,
  hasNextDay,
}: DailyReportProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  // 动画完成后停止
  setTimeout(() => setIsAnimating(false), 2000);

  // 获取评级
  const getRating = () => {
    const score = report.tasks.completionRate;
    if (score >= 90) return { emoji: '🌟', text: '完美', color: '#FFD700' };
    if (score >= 75) return { emoji: '⭐', text: '优秀', color: '#10B981' };
    if (score >= 60) return { emoji: '👍', text: '良好', color: '#3B82F6' };
    if (score >= 40) return { emoji: '💪', text: '加油', color: '#F59E0B' };
    return { emoji: '🔥', text: '需努力', color: '#EF4444' };
  };

  const rating = getRating();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevDay}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">今日报告</h1>
            <p className="text-neutral-600 mt-1">
              {report.date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <button
            onClick={onNextDay}
            disabled={!hasNextDay}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onShare}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>分享</span>
        </button>
      </div>

      {/* 评级卡片 */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 text-white"
        style={{
          background: `linear-gradient(135deg, ${rating.color} 0%, ${rating.color}dd 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-sm mb-2">今日评级</div>
            <div className="flex items-center space-x-3">
              <span className="text-6xl">{rating.emoji}</span>
              <div>
                <div className="text-4xl font-bold">{rating.text}</div>
                <div className="text-white/90 text-lg">完成率 {report.tasks.completionRate}%</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm mb-2">任务完成</div>
            <div className="text-5xl font-bold">
              {report.tasks.completed}/{report.tasks.total}
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 金币收支 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <div className="text-neutral-600 text-sm">金币收支</div>
              <div className="text-2xl font-bold text-neutral-900">
                {report.gold.balance >= 0 ? '+' : ''}{report.gold.balance}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">收入</span>
              <span className="text-green-600 font-semibold">+{report.gold.earned}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">支出</span>
              <span className="text-red-600 font-semibold">-{report.gold.spent}</span>
            </div>
          </div>
        </div>

        {/* 成长值变化 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <div className="text-neutral-600 text-sm">成长值</div>
              <div className="text-2xl font-bold text-green-600">
                +{report.growth.reduce((sum, g) => sum + g.change, 0)}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {report.growth.slice(0, 2).map((g, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-neutral-600">
                  {g.icon} {g.dimension}
                </span>
                <span className="text-green-600 font-semibold">+{g.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 坏习惯 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <div className="text-neutral-600 text-sm">坏习惯</div>
              <div className="text-2xl font-bold text-red-600">
                {report.badHabits.reduce((sum, h) => sum + h.count, 0)}
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {report.badHabits.slice(0, 2).map((h, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-neutral-600">{h.name}</span>
                <span className="text-red-600 font-semibold">{h.count}次</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 亮点 */}
      {report.highlights.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-bold text-neutral-900">今日亮点</h3>
          </div>
          <div className="space-y-3">
            {report.highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                style={{
                  animation: isAnimating ? `slideInRight 0.5s ease-out ${index * 0.1}s both` : 'none',
                }}
              >
                <span className="text-2xl">✨</span>
                <p className="flex-1 text-neutral-800">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 待改进 */}
      {report.improvements.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-neutral-900">待改进</h3>
          </div>
          <div className="space-y-3">
            {report.improvements.map((improvement, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
                style={{
                  animation: isAnimating ? `slideInRight 0.5s ease-out ${index * 0.1}s both` : 'none',
                }}
              >
                <span className="text-2xl">💡</span>
                <p className="flex-1 text-neutral-800">{improvement}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 明日建议 */}
      {report.suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-neutral-900">明日建议</h3>
          </div>
          <div className="space-y-3">
            {report.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-white rounded-lg"
                style={{
                  animation: isAnimating ? `slideInRight 0.5s ease-out ${index * 0.1}s both` : 'none',
                }}
              >
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="flex-1 text-neutral-800">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

