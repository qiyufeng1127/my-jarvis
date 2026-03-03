import { motion } from 'framer-motion';
import { Check, X, TrendingUp } from 'lucide-react';
import { useHabitStore } from '@/stores/habitStore';
import type { HabitCandidate } from '@/types/habit';

interface HabitCandidateListProps {
  candidates: HabitCandidate[];
}

export default function HabitCandidateList({ candidates }: HabitCandidateListProps) {
  const acceptCandidate = useHabitStore((state) => state.acceptCandidate);
  const rejectCandidate = useHabitStore((state) => state.rejectCandidate);
  
  return (
    <div className="space-y-3">
      {candidates.map((candidate, index) => (
        <motion.div
          key={candidate.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-start gap-3">
            {/* Emoji */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center text-2xl flex-shrink-0">
              {candidate.emoji}
            </div>
            
            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {candidate.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                  {(candidate.confidence * 100).toFixed(0)}% 置信度
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>
                  检测到 {candidate.totalOccurrences} 次
                </span>
                {candidate.consecutiveDays > 0 && (
                  <span> • 连续 {candidate.consecutiveDays} 天</span>
                )}
                {candidate.consecutiveWeeks > 0 && (
                  <span> • 连续 {candidate.consecutiveWeeks} 周</span>
                )}
                {candidate.consecutiveMonths > 0 && (
                  <span> • 连续 {candidate.consecutiveMonths} 月</span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <TrendingUp className="w-3 h-3" />
                <span>
                  建议目标: {candidate.suggestedTarget}
                  {candidate.type === 'duration' && ' 分钟'}
                  {candidate.type === 'count' && ' 次'}
                  {' / '}
                  {candidate.frequency === 'daily' && '每日'}
                  {candidate.frequency === 'weekly' && '每周'}
                  {candidate.frequency === 'monthly' && '每月'}
                </span>
              </div>
              
              {/* 关键词 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {candidate.detectedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => acceptCandidate(candidate.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-md transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>接受</span>
                </button>
                
                <button
                  onClick={() => rejectCandidate(candidate.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>忽略</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
