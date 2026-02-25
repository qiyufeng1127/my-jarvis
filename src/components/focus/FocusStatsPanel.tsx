import React from 'react';
import { useFocusStore } from '@/stores/focusStore';

export const FocusStatsPanel: React.FC = () => {
  const { stats, sessions, getTodayStats } = useFocusStore();
  const todayStats = getTodayStats();

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  // 完成率
  const completionRate = stats.totalSessions > 0 
    ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
    : '0';

  // 今日目标（2小时）
  const todayTarget = 2 * 60 * 60; // 2小时
  const todayProgress = (todayStats.focusTime / todayTarget) * 100;

  return (
    <div className="focus-stats-panel">
      <h3>📊 专注统计</h3>

      {/* 今日进度 */}
      <div className="today-progress">
        <div className="progress-header">
          <span>今日专注</span>
          <span className="time">{formatDuration(todayStats.focusTime)} / 2小时</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${Math.min(todayProgress, 100)}%` }}
          />
        </div>
        <div className="sessions-count">
          {todayStats.sessions} 个专注会话
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{formatDuration(stats.totalFocusTime)}</div>
          <div className="stat-label">总专注时长</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.completedSessions}</div>
          <div className="stat-label">完成会话</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">完成率</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">连续天数</div>
        </div>
      </div>

      {/* 最近会话 */}
      {sessions.length > 0 && (
        <div className="recent-sessions">
          <h4>最近会话</h4>
          <div className="sessions-list">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className={`session-item ${session.completed ? 'completed' : 'interrupted'}`}>
                <div className="session-icon">
                  {session.mode === 'pomodoro' && '🍅'}
                  {session.mode === 'deep' && '🧘'}
                  {session.mode === 'flow' && '🌊'}
                </div>
                <div className="session-info">
                  <div className="session-name">
                    {session.taskName || '未指定任务'}
                  </div>
                  <div className="session-time">
                    {formatDuration(session.duration)}
                    {' · '}
                    {new Date(session.startTime).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <div className="session-reward">
                  {session.completed ? '✅' : '❌'}
                  <span className="gold">+{session.goldEarned}💰</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .focus-stats-panel {
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        h3 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .today-progress {
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .progress-header .time {
          font-size: 1.1rem;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
        }

        .sessions-count {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 12px;
          text-align: center;
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #666;
        }

        .recent-sessions h4 {
          font-size: 1rem;
          color: #666;
          margin-bottom: 0.75rem;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .session-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid #4CAF50;
        }

        .session-item.interrupted {
          border-left-color: #ff9800;
          opacity: 0.7;
        }

        .session-icon {
          font-size: 1.5rem;
        }

        .session-info {
          flex: 1;
        }

        .session-name {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .session-time {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .session-reward {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .session-reward .gold {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4CAF50;
        }
      `}</style>
    </div>
  );
};

