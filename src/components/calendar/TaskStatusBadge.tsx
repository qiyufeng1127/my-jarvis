/**
 * 任务状态标记组件
 * 显示任务的超时、低效率等状态标记
 */

import { useState, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';

interface TaskStatusBadgeProps {
  taskId: string;
  taskTitle: string;
  goldReward?: number;
  isCompleted: boolean;
  startTimeoutCount?: number; // 启动超时次数
  completeTimeoutCount?: number; // 完成超时次数
  persistentDelayMarks?: number; // 持久化拖延标记（红叉）
  efficiencyLevel?: 'excellent' | 'good' | 'average' | 'poor'; // 效率等级
  completionEfficiency?: number; // 完成效率
  mandatoryReflection?: {
    required: boolean;
    resolved: boolean;
    trigger: 'start_delay' | 'low_efficiency';
  };
  position?: 'top-right' | 'inline'; // 显示位置
  size?: 'small' | 'medium'; // 尺寸
}

export default function TaskStatusBadge({
  taskId,
  taskTitle,
  goldReward = 0,
  isCompleted,
  startTimeoutCount = 0,
  completeTimeoutCount = 0,
  persistentDelayMarks = 0,
  efficiencyLevel,
  completionEfficiency,
  mandatoryReflection,
  position = 'top-right',
  size = 'medium',
}: TaskStatusBadgeProps) {
  const [showHistory, setShowHistory] = useState(false);
  const totalTimeouts = startTimeoutCount + completeTimeoutCount;
  const visibleIssueCount = totalTimeouts + persistentDelayMarks;
  const hasLowEfficiency = efficiencyLevel === 'poor' || efficiencyLevel === 'average' || (completionEfficiency !== undefined && completionEfficiency < 60);
  const hasMandatoryReflection = mandatoryReflection?.required && !mandatoryReflection?.resolved;
  const badgeTone = useMemo(() => {
    if (hasMandatoryReflection) {
      return {
        bg: 'rgba(185, 28, 28, 0.95)',
        icon: '⛔',
        text: '必填',
        title: '必须先填写追责表单',
      };
    }
    if (persistentDelayMarks > 0) {
      return {
        bg: 'rgba(220, 38, 38, 0.95)',
        icon: '❌',
        text: String(persistentDelayMarks),
        title: '查看拖延警告历史',
      };
    }
    if (totalTimeouts > 0) {
      return {
        bg: 'rgba(255, 193, 7, 0.9)',
        icon: '⚠️',
        text: String(totalTimeouts),
        title: '查看坏习惯历史',
      };
    }
    return {
      bg: 'rgba(156, 163, 175, 0.9)',
      icon: '🐢',
      text: '',
      title: '查看坏习惯历史',
    };
  });
  
  // 如果没有任何标记，不显示
  if (visibleIssueCount === 0 && !hasLowEfficiency && !hasMandatoryReflection) {
    return null;
  }

  const containerClass = position === 'top-right' 
    ? 'absolute top-2 right-2 z-10'
    : 'flex gap-1 items-center';

  return (
    <>
      {/* 坏习惯按钮 */}
      <div className={containerClass}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowHistory(true);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg shadow-sm hover:scale-105 transition-all"
          style={{
            backgroundColor: badgeTone.bg,
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
          title={badgeTone.title}
        >
          <span className={size === 'small' ? 'text-base' : 'text-lg'}>
            {badgeTone.icon}
          </span>
          
          <span className={`font-bold text-white ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {badgeTone.text}
          </span>
        </button>
      </div>

      {/* 历史记录弹窗 */}
      {showHistory && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setShowHistory(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🐢</span>
                <span>坏习惯历史</span>
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* 任务标题 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">任务</p>
              <p className="font-semibold text-gray-800">{taskTitle}</p>
            </div>
            
            <div className="space-y-3">
              {hasMandatoryReflection && (
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5 text-red-700" />
                    <span className="font-semibold text-red-800">强制追责表单未完成</span>
                  </div>
                  <div className="text-sm text-red-900 space-y-1">
                    <p>• 当前任务已被锁定，必须先提交表单。</p>
                    <p>• 未提交前：不能完成任务、不能删除任务、不能关闭追责表单。</p>
                    <p>• 触发原因：{mandatoryReflection?.trigger === 'start_delay' ? '启动拖延次数过多' : '任务低效率超时'}</p>
                  </div>
                </div>
              )}

              {persistentDelayMarks > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">❌</span>
                    <span className="font-semibold text-rose-800">拖延警告</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>• 累计警告：<span className="font-bold text-rose-700">{persistentDelayMarks} 次</span></p>
                    <p className="text-xs text-gray-500 mt-1">每次超过30分钟没有点继续，就会永久保留一个红叉警告</p>
                  </div>
                </div>
              )}

              {/* 启动拖延记录 */}
              {startTimeoutCount > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐢</span>
                    <span className="font-semibold text-yellow-800">启动拖延</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>• 拖延次数：<span className="font-bold text-yellow-700">{startTimeoutCount} 次</span></p>
                    <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * startTimeoutCount} 💰</span></p>
                    <p className="text-xs text-gray-500 mt-1">未在2分钟内完成启动验证</p>
                  </div>
                </div>
              )}
              
              {/* 完成超时记录 */}
              {completeTimeoutCount > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-semibold text-red-800">完成超时</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>• 超时次数：<span className="font-bold text-red-700">{completeTimeoutCount} 次</span></p>
                    <p>• 扣除金币：<span className="font-bold text-red-600">{Math.floor(goldReward * 0.2) * completeTimeoutCount} 💰</span></p>
                    <p className="text-xs text-gray-500 mt-1">未在规定时间内完成任务验证</p>
                  </div>
                </div>
              )}

              {/* 低效率记录 */}
              {hasLowEfficiency && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐢</span>
                    <span className="font-semibold text-gray-800">低效率</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>• 完成效率：<span className="font-bold text-gray-700">{completionEfficiency}%</span></p>
                    <p>• 效率等级：<span className="font-bold text-gray-700">
                      {efficiencyLevel === 'excellent' ? '优秀' : 
                       efficiencyLevel === 'good' ? '良好' : 
                       efficiencyLevel === 'average' ? '一般' : '较差'}
                    </span></p>
                    <p className="text-xs text-gray-500 mt-1">任务完成效率低于预期</p>
                  </div>
                </div>
              )}
              
              {/* 总计 */}
              {totalTimeouts > 0 && (
                <div className="p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">累计扣除金币</span>
                    <span className="text-xl font-black text-red-600">
                      {Math.floor(goldReward * 0.2) * totalTimeouts} 💰
                    </span>
                  </div>
                </div>
              )}
              
              {/* 提示 */}
              <div className="text-xs text-gray-500 text-center mt-4">
                💡 按时完成验证可避免扣金币哦！
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
