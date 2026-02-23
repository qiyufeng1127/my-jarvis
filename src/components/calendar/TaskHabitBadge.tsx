import React, { useState, useEffect } from 'react';
import { useHabitCanStore } from '@/stores/habitCanStore';
import type { HabitOccurrence } from '@/types/habitTypes';

interface TaskHabitBadgeProps {
  taskId: string;
  taskTitle: string;
}

export default function TaskHabitBadge({ taskId, taskTitle }: TaskHabitBadgeProps) {
  const { habits, occurrences, getOccurrencesByDate } = useHabitCanStore();
  const [showDetail, setShowDetail] = useState(false);
  const [taskHabits, setTaskHabits] = useState<Array<{
    habitId: string;
    habitName: string;
    habitEmoji: string;
    count: number;
    records: Array<{ time: string; reason: string; date: string }>;
  }>>([]);

  // 获取当前任务相关的所有坏习惯记录
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOccurrences = getOccurrencesByDate(today);
    
    // 按习惯分组统计
    const habitMap = new Map<string, {
      habitId: string;
      habitName: string;
      habitEmoji: string;
      count: number;
      records: Array<{ time: string; reason: string; date: string }>;
    }>();
    
    todayOccurrences.forEach((occurrence) => {
      // 只统计与当前任务相关的记录
      const relatedRecords = occurrence.details.filter(
        (detail) => detail.relatedTaskId === taskId
      );
      
      if (relatedRecords.length > 0) {
        const habit = habits.find((h) => h.id === occurrence.habitId);
        if (!habit) return;
        
        if (!habitMap.has(occurrence.habitId)) {
          habitMap.set(occurrence.habitId, {
            habitId: occurrence.habitId,
            habitName: habit.name,
            habitEmoji: habit.emoji,
            count: 0,
            records: [],
          });
        }
        
        const habitData = habitMap.get(occurrence.habitId)!;
        habitData.count += relatedRecords.length;
        habitData.records.push(
          ...relatedRecords.map((r) => ({
            time: r.time,
            reason: r.reason,
            date: occurrence.date,
          }))
        );
      }
    });
    
    setTaskHabits(Array.from(habitMap.values()));
  }, [taskId, habits, occurrences, getOccurrencesByDate]);

  // 如果没有坏习惯记录，不显示
  if (taskHabits.length === 0) {
    return null;
  }

  // 计算总次数
  const totalCount = taskHabits.reduce((sum, h) => sum + h.count, 0);

  return (
    <>
      {/* 徽章按钮 */}
      <button
        onClick={() => setShowDetail(true)}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 shadow-sm hover:scale-105 transition-transform"
      >
        <span className="text-base">{taskHabits[0].habitEmoji}</span>
        <span className="text-xs font-bold text-yellow-800">
          {taskHabits.length === 1 
            ? `${taskHabits[0].habitName} ${taskHabits[0].count} 次`
            : `${totalCount} 次坏习惯`
          }
        </span>
      </button>

      {/* 详情弹窗 */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  任务坏习惯记录
                </h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {taskTitle}
              </p>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {taskHabits.map((habit) => (
                <div key={habit.habitId} className="mb-6 last:mb-0">
                  {/* 习惯标题 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{habit.habitEmoji}</span>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        {habit.habitName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        发生 {habit.count} 次
                      </p>
                    </div>
                  </div>

                  {/* 记录列表 */}
                  <div className="space-y-2 pl-10">
                    {habit.records.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                      >
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-xs shrink-0">
                          {record.time}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 flex-1">
                          {record.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetail(false)}
                className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

