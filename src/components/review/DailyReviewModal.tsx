import { useEffect, useState } from 'react';
import { X, RefreshCw, TrendingUp, Heart, Sparkles, Clock, Smile, AlertTriangle, DollarSign } from 'lucide-react';
import { useDailyReviewStore } from '@/stores/dailyReviewStore';
import { useThemeStore } from '@/stores/themeStore';
import type { DailyReview } from '@/services/dailyReviewService';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyReviewModal({ isOpen, onClose }: DailyReviewModalProps) {
  const { currentReview, isLoading, isGenerating, loadTodayReview, generateTodayReview } = useDailyReviewStore();
  const { effectiveTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'analysis' | 'improvements' | 'message'>('profile');
  
  const isDark = effectiveTheme === 'dark';
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.6)' : '#666666';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  useEffect(() => {
    if (isOpen) {
      loadTodayReview();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    await generateTodayReview();
  };

  if (!isOpen) return null;

  // 渲染今日画像
  const renderTodayProfile = (review: DailyReview) => (
    <div className="space-y-6">
      {/* 时间投入分析 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Clock className="w-5 h-5 mr-2" style={{ color: '#3b82f6' }} />
          ⏰ 时间投入分析
        </h3>
        
        <div className="space-y-4">
          {/* 总时间 */}
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
            <div className="text-3xl font-bold" style={{ color: '#3b82f6' }}>
              {Math.round(review.todayProfile.timeInvestment.totalTime / 60)}h {review.todayProfile.timeInvestment.totalTime % 60}m
            </div>
            <div className="text-sm mt-1" style={{ color: accentColor }}>今日总投入</div>
          </div>
          
          {/* 类别分布 */}
          <div className="space-y-2">
            {review.todayProfile.timeInvestment.categories.map((cat, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: textColor }}>{cat.name}</span>
                  <span style={{ color: accentColor }}>
                    {Math.round(cat.time / 60)}h {cat.time % 60}m ({cat.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* 高效时段 */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
              <div className="text-xs mb-1" style={{ color: accentColor }}>最高效时段</div>
              <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                {review.todayProfile.timeInvestment.mostProductiveHour}:00
              </div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
              <div className="text-xs mb-1" style={{ color: accentColor }}>最低效时段</div>
              <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                {review.todayProfile.timeInvestment.leastProductiveHour}:00
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 情绪波动曲线 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Smile className="w-5 h-5 mr-2" style={{ color: '#f59e0b' }} />
          😊 情绪波动曲线
        </h3>
        
        {review.todayProfile.emotionCurve.length > 0 ? (
          <div className="space-y-3">
            {review.todayProfile.emotionCurve.map((point, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <div className="text-sm font-mono" style={{ color: accentColor }}>{point.time}</div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: textColor }}>{point.emotion}</div>
                  {point.trigger && (
                    <div className="text-xs mt-1" style={{ color: accentColor }}>触发：{point.trigger}</div>
                  )}
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-6 rounded"
                      style={{
                        backgroundColor: i < point.intensity 
                          ? '#f59e0b' 
                          : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: accentColor }}>
            <p>今天还没有记录情绪</p>
            <p className="text-sm mt-2">建议每天记录3次情绪状态</p>
          </div>
        )}
      </div>

      {/* 坏习惯监控 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <AlertTriangle className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} />
          ⚠️ 坏习惯监控
        </h3>
        
        {review.todayProfile.badHabitMonitor.length > 0 ? (
          <div className="space-y-3">
            {review.todayProfile.badHabitMonitor.map((habit, index) => (
              <div key={index} className="p-4 rounded-lg border" style={{ 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                borderColor: '#ef4444'
              }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold" style={{ color: '#ef4444' }}>{habit.habitName}</span>
                  <span className="text-sm px-2 py-1 rounded" style={{ 
                    backgroundColor: '#ef4444',
                    color: 'white'
                  }}>
                    {habit.occurrences}次
                  </span>
                </div>
                <div className="text-sm space-y-1" style={{ color: accentColor }}>
                  <p><strong>触发场景：</strong>{habit.triggerScenarios.join('、') || '未知'}</p>
                  <p><strong>影响：</strong>{habit.impact}</p>
                  <p className="text-xs" style={{ color: '#ef4444' }}>💡 {habit.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: accentColor }}>
            <div className="text-4xl mb-2">🎉</div>
            <p>今天没有坏习惯发生</p>
            <p className="text-sm mt-2">继续保持！</p>
          </div>
        )}
      </div>

      {/* 副业进度追踪 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <DollarSign className="w-5 h-5 mr-2" style={{ color: '#10b981' }} />
          💰 副业进度追踪
        </h3>
        
        {review.todayProfile.sideHustleProgress.length > 0 ? (
          <div className="space-y-3">
            {review.todayProfile.sideHustleProgress.map((sh, index) => (
              <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }}>
                <div className="font-semibold mb-2" style={{ color: textColor }}>{sh.name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span style={{ color: accentColor }}>今日收入：</span>
                    <span className="font-bold ml-1" style={{ color: '#10b981' }}>¥{sh.todayIncome}</span>
                  </div>
                  <div>
                    <span style={{ color: accentColor }}>投入时间：</span>
                    <span className="font-bold ml-1" style={{ color: textColor }}>{sh.todayTime}分钟</span>
                  </div>
                </div>
                <div className="text-sm" style={{ color: accentColor }}>
                  <p><strong>进度：</strong>{sh.progress}</p>
                  <p className="text-xs mt-1" style={{ color: '#10b981' }}>💡 下一步：{sh.nextStep}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: accentColor }}>
            <p>今天还没有副业进展</p>
            <p className="text-sm mt-2">建议每天至少投入1小时</p>
          </div>
        )}
      </div>

      {/* 统计数据 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          📊 今日数据统计
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
            <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
              {review.stats.completedTasks}/{review.stats.totalTasks}
            </div>
            <div className="text-xs mt-1" style={{ color: accentColor }}>任务完成</div>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }}>
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
              {(review.stats.completionRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs mt-1" style={{ color: accentColor }}>完成率</div>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染深度剖析
  const renderDeepAnalysis = (review: DailyReview) => (
    <div className="space-y-6">
      {/* 行为模式 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <TrendingUp className="w-5 h-5 mr-2" style={{ color: '#3b82f6' }} />
          📈 行为模式识别
        </h3>
        
        {review.deepAnalysis.behaviorPatterns.length > 0 ? (
          <div className="space-y-2 text-sm" style={{ color: accentColor }}>
            {review.deepAnalysis.behaviorPatterns.map((pattern, index) => (
              <p key={index}>• {pattern}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: accentColor }}>今天的数据还不足以识别行为模式</p>
        )}
      </div>

      {/* 效率分析 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Sparkles className="w-5 h-5 mr-2" style={{ color: '#f59e0b' }} />
          ⚡ 效率分析
        </h3>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }}>
          <p className="text-sm" style={{ color: accentColor }}>{review.deepAnalysis.efficiencyAnalysis}</p>
        </div>
      </div>

      {/* 情绪分析 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Smile className="w-5 h-5 mr-2" style={{ color: '#ec4899' }} />
          😊 情绪分析
        </h3>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)' }}>
          <p className="text-sm" style={{ color: accentColor }}>{review.deepAnalysis.emotionAnalysis}</p>
        </div>
      </div>

      {/* 专注度分析 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: textColor }}>
          <Clock className="w-5 h-5 mr-2" style={{ color: '#8b5cf6' }} />
          🎯 专注度分析
        </h3>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }}>
          <p className="text-sm" style={{ color: accentColor }}>{review.deepAnalysis.focusAnalysis}</p>
        </div>
      </div>

      {/* AI洞察 */}
      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#3b82f6' }}>
          🔍 AI 深度洞察
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>通过对今天的数据分析，我发现了一些值得关注的地方：</p>
          
          {review.stats.completionRate > 0.7 ? (
            <p>✅ 你今天的执行力很强，完成率达到了{(review.stats.completionRate * 100).toFixed(0)}%，这是一个很好的状态。</p>
          ) : review.stats.completionRate < 0.3 ? (
            <p>⚠️ 今天的完成率只有{(review.stats.completionRate * 100).toFixed(0)}%，可能遇到了一些困难，建议调整任务量或优先级。</p>
          ) : (
            <p>📊 今天的完成率是{(review.stats.completionRate * 100).toFixed(0)}%，还有提升空间。</p>
          )}
          
          {review.todayProfile.timeInvestment.totalTime > 480 && (
            <p>⏰ 今天工作了{Math.round(review.todayProfile.timeInvestment.totalTime / 60)}小时，时间较长，记得注意休息。</p>
          )}
          
          {review.todayProfile.badHabitMonitor.length > 0 && (
            <p>⚠️ 今天出现了{review.todayProfile.badHabitMonitor.length}个坏习惯，建议重点关注触发场景。</p>
          )}
          
          <p className="font-semibold">继续保持这种自我觉察和反思的习惯，你会越来越好！💪</p>
        </div>
      </div>
    </div>
  );

  // 渲染改进方案
  const renderImprovements = (review: DailyReview) => (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          🎯 5个具体改进建议
        </h3>
        
        <p className="text-sm mb-6" style={{ color: accentColor }}>
          基于今天的数据分析，我为你准备了以下改进建议，按优先级排序：
        </p>
        
        <div className="space-y-4">
          {review.improvements.map((improvement, index) => (
            <div 
              key={improvement.id} 
              className="p-5 rounded-xl border-2"
              style={{ 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)',
                borderColor: improvement.priority >= 4 ? '#3b82f6' : borderColor
              }}
            >
              {/* 标题和优先级 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg font-bold" style={{ color: textColor }}>
                      {index + 1}. {improvement.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded" style={{ 
                      backgroundColor: getCategoryColor(improvement.category),
                      color: 'white'
                    }}>
                      {improvement.category}
                    </span>
                    <span className="text-xs" style={{ color: accentColor }}>
                      优先级：{'⭐'.repeat(improvement.priority)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 问题描述 */}
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#ef4444' }}>❌ 问题</p>
                <p className="text-sm" style={{ color: accentColor }}>{improvement.problem}</p>
              </div>
              
              {/* 解决方案 */}
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>✅ 解决方案</p>
                <p className="text-sm" style={{ color: accentColor }}>{improvement.solution}</p>
              </div>
              
              {/* 行动步骤 */}
              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: textColor }}>📋 具体行动步骤：</p>
                <div className="space-y-1">
                  {improvement.actionSteps.map((step, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm" style={{ color: accentColor }}>
                      <span className="text-xs mt-0.5">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 预期效果 */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#3b82f6' }}>🎯 预期效果</p>
                <p className="text-sm" style={{ color: accentColor }}>{improvement.expectedResult}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 实施建议 */}
      <div className="rounded-xl p-6 border-2" style={{ 
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#f59e0b'
      }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#f59e0b' }}>
          💡 实施建议
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: textColor }}>
          <p>• <strong>不要一次改变太多</strong>：选择1-2个最重要的建议开始实施</p>
          <p>• <strong>设定明确的时间</strong>：为每个行动步骤设定具体的执行时间</p>
          <p>• <strong>追踪进度</strong>：每天记录实施情况，及时调整</p>
          <p>• <strong>庆祝小胜利</strong>：每完成一个步骤，给自己一个奖励</p>
          <p>• <strong>保持耐心</strong>：改变需要时间，不要因为一两次失败就放弃</p>
        </div>
      </div>
    </div>
  );

  // 渲染温暖寄语
  const renderWarmMessage = (review: DailyReview) => (
    <div className="space-y-6">
      <div className="rounded-xl p-8 border-2" style={{ 
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderColor: '#ec4899'
      }}>
        <div className="text-center mb-6">
          <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: '#ec4899' }} />
          <h3 className="text-2xl font-bold" style={{ color: '#ec4899' }}>
            💕 今天想对你说
          </h3>
        </div>
        
        <div className="space-y-4 text-base leading-relaxed" style={{ color: textColor }}>
          {review.warmMessage.split('\n').map((line, index) => (
            line.trim() && <p key={index}>{line}</p>
          ))}
        </div>
      </div>

      {/* 今日亮点 */}
      {review.stats.completedTasks > 0 && (
        <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            ✨ 今日亮点
          </h3>
          
          <div className="space-y-3">
            {review.stats.completedTasks > 5 && (
              <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
                <span className="text-2xl">🎉</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: '#22c55e' }}>高效执行</p>
                  <p className="text-sm" style={{ color: accentColor }}>今天完成了{review.stats.completedTasks}个任务，执行力很强！</p>
                </div>
              </div>
            )}
            
            {review.stats.completionRate > 0.7 && (
              <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                <span className="text-2xl">💪</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: '#3b82f6' }}>完成率优秀</p>
                  <p className="text-sm" style={{ color: accentColor }}>完成率达到{(review.stats.completionRate * 100).toFixed(0)}%，超过了大多数人！</p>
                </div>
              </div>
            )}
            
            {review.todayProfile.emotionCurve.length > 3 && (
              <div className="flex items-start space-x-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)' }}>
                <span className="text-2xl">🧠</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: '#ec4899' }}>自我觉察</p>
                  <p className="text-sm" style={{ color: accentColor }}>今天记录了{review.todayProfile.emotionCurve.length}次情绪，很关注自己的内心状态！</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 明日期待 */}
      <div className="rounded-xl p-6" style={{ backgroundColor: cardBg }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          🌅 明日期待
        </h3>
        
        <div className="space-y-3 text-sm" style={{ color: accentColor }}>
          <p>明天是新的一天，充满了无限可能。</p>
          <p>建议你：</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>早上花5分钟规划今天的3个核心任务</li>
            <li>在高效时段（{review.todayProfile.timeInvestment.mostProductiveHour}:00左右）处理最重要的事</li>
            <li>记得给自己留出休息和放松的时间</li>
            <li>睡前复盘今天的收获和成长</li>
          </ul>
          <p className="font-semibold pt-3" style={{ color: textColor }}>
            我会一直陪着你，见证你的每一次进步！💕
          </p>
        </div>
      </div>
    </div>
  );

  // 获取类别颜色
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      '时间管理': '#3b82f6',
      '习惯养成': '#10b981',
      '目标推进': '#f59e0b',
      '情绪管理': '#ec4899',
      '效率提升': '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 keyboard-aware-modal-shell"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden keyboard-aware-modal-card"
        style={{ 
          backgroundColor: bgColor,
          maxHeight: 'var(--app-modal-max-height)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: borderColor }}>
          <div>
            <h2 className="text-2xl font-bold flex items-center" style={{ color: textColor }}>
              <Sparkles className="w-6 h-6 mr-2" style={{ color: '#f59e0b' }} />
              今日复盘
            </h2>
            <div className="flex items-center mt-2 space-x-4 text-sm" style={{ color: accentColor }}>
              <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {currentReview && (
                <>
                  <span>•</span>
                  <span>完成率 {(currentReview.stats.completionRate * 100).toFixed(0)}%</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!currentReview && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg transition-colors font-medium"
                style={{ 
                  backgroundColor: '#3b82f6',
                  color: 'white'
                }}
              >
                {isGenerating ? '生成中...' : '生成复盘'}
              </button>
            )}
            
            {currentReview && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: cardBg }}
                title="重新生成"
              >
                <RefreshCw 
                  className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`}
                  style={{ color: textColor }}
                />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: cardBg }}
            >
              <X className="w-5 h-5" style={{ color: textColor }} />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        {currentReview && (
          <div className="flex border-b" style={{ borderColor: borderColor }}>
            {[
              { id: 'profile', label: '今日画像', icon: '📊' },
              { id: 'analysis', label: '深度剖析', icon: '🔍' },
              { id: 'improvements', label: '改进方案', icon: '🎯' },
              { id: 'message', label: '温暖寄语', icon: '💕' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  color: activeTab === tab.id ? '#3b82f6' : accentColor,
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 keyboard-aware-scroll">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: accentColor }} />
                <p style={{ color: accentColor }}>正在加载...</p>
              </div>
            </div>
          ) : !currentReview ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: accentColor }} />
                <p className="text-lg mb-2" style={{ color: textColor }}>还没有生成今日复盘</p>
                <p className="text-sm mb-4" style={{ color: accentColor }}>点击"生成复盘"按钮开始分析</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && renderTodayProfile(currentReview)}
              {activeTab === 'analysis' && renderDeepAnalysis(currentReview)}
              {activeTab === 'improvements' && renderImprovements(currentReview)}
              {activeTab === 'message' && renderWarmMessage(currentReview)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

