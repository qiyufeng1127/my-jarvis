import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDriveStore } from '@/stores/driveStore';
import { useTaskStore } from '@/stores/taskStore';

interface DayData {
  date: string; // YYYY-MM-DD
  completed: number; // 完成的任务数
  isToday: boolean;
  isStreak: boolean; // 是否达成连胜（>=3个任务）
}

export default function WinStreakCalendar() {
  const { winStreak } = useDriveStore();
  const { tasks } = useTaskStore();

  // 生成最近90天的数据
  const calendarData = useMemo(() => {
    const data: DayData[] = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 统计当天完成的任务数
      const completedCount = tasks.filter(task => {
        if (task.status !== 'completed' || !task.actualEnd) return false;
        const taskDate = new Date(task.actualEnd).toISOString().split('T')[0];
        return taskDate === dateStr;
      }).length;
      
      data.push({
        date: dateStr,
        completed: completedCount,
        isToday: i === 0,
        isStreak: completedCount >= 3,
      });
    }
    
    return data;
  }, [tasks]);

  // 按周分组
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    let week: DayData[] = [];
    
    calendarData.forEach((day, index) => {
      week.push(day);
      if (week.length === 7 || index === calendarData.length - 1) {
        result.push(week);
        week = [];
      }
    });
    
    return result;
  }, [calendarData]);

  // 获取方块颜色
  const getColor = (day: DayData) => {
    if (day.completed === 0) return '#E5E7EB'; // 灰色
    if (day.completed >= 10) return '#10B981'; // 深绿
    if (day.completed >= 6) return '#34D399'; // 中绿
    if (day.completed >= 3) return '#6EE7B7'; // 浅绿
    return '#A7F3D0'; // 极浅绿
  };

  // 获取提示文本
  const getTooltip = (day: DayData) => {
    const date = new Date(day.date);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    
    if (day.completed === 0) {
      return `${dateStr}\n未完成任务`;
    }
    
    return `${dateStr}\n完成 ${day.completed} 个任务${day.isStreak ? ' ✅' : ''}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🔥 连胜日历
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            每天完成3个任务即可保持连胜
          </p>
        </div>
        
        {/* 连胜统计 */}
        <div className="text-right">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            {winStreak.currentStreak}天
          </div>
          <div className="text-xs text-gray-500">
            最长 {winStreak.longestStreak} 天
          </div>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* 星期标签 */}
          <div className="flex gap-1 mb-2">
            <div className="w-8"></div>
            {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
              <div key={index} className="w-3 text-xs text-gray-400 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* 日历方块 */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {/* 月份标签 */}
              <div className="w-8 text-xs text-gray-400 flex items-center">
                {weekIndex % 4 === 0 && new Date(week[0].date).toLocaleDateString('zh-CN', { month: 'short' })}
              </div>
              
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  className="relative group"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div
                    className="w-3 h-3 rounded-sm cursor-pointer transition-all"
                    style={{ 
                      backgroundColor: getColor(day),
                      border: day.isToday ? '2px solid #3B82F6' : 'none',
                    }}
                    title={getTooltip(day)}
                  />
                  
                  {/* 悬停提示 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {getTooltip(day)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>少</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#E5E7EB' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#A7F3D0' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6EE7B7' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#34D399' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10B981' }}></div>
          </div>
          <span>多</span>
        </div>

        {/* 今日进度 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">今日进度：</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  winStreak.todayCompleted >= i
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {winStreak.todayCompleted}/3
          </span>
        </div>
      </div>

      {/* 连胜提示 */}
      {winStreak.currentStreak > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
          <p className="text-sm text-orange-800 text-center font-semibold">
            🔥 你已经连续 <span className="text-xl font-black">{winStreak.currentStreak}</span> 天保持自律！
            {winStreak.currentStreak >= 7 && ' 太棒了！'}
            {winStreak.currentStreak >= 30 && ' 你是自律大师！'}
            {winStreak.currentStreak >= 100 && ' 你是传奇！'}
          </p>
        </div>
      )}

      {/* 连胜奖励提示 */}
      {winStreak.currentStreak > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className={`p-3 rounded-lg text-center ${winStreak.currentStreak >= 7 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs font-semibold text-gray-700">7天</div>
            <div className="text-xs text-gray-500">+200💰</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${winStreak.currentStreak >= 30 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">🥇</div>
            <div className="text-xs font-semibold text-gray-700">30天</div>
            <div className="text-xs text-gray-500">+1000💰</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${winStreak.currentStreak >= 100 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
            <div className="text-2xl mb-1">👑</div>
            <div className="text-xs font-semibold text-gray-700">100天</div>
            <div className="text-xs text-gray-500">+5000💰</div>
          </div>
        </div>
      )}
    </div>
  );
}

