import React, { useState } from 'react';
import { useLeaderboardStore, LeaderboardType } from '@/stores/leaderboardStore';

export const LeaderboardPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('gold');
  
  const { 
    getLeaderboard, 
    getMyRank,
    getUnlockedAchievements,
    getLockedAchievements,
  } = useLeaderboardStore();

  const leaderboard = getLeaderboard(activeTab);
  const myRank = getMyRank(activeTab);
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = getLockedAchievements();

  const tabs: { type: LeaderboardType; label: string; emoji: string }[] = [
    { type: 'gold', label: '金币榜', emoji: '💰' },
    { type: 'streak', label: '连胜榜', emoji: '🔥' },
    { type: 'focus', label: '专注榜', emoji: '🎯' },
    { type: 'task', label: '任务榜', emoji: '✅' },
    { type: 'pet', label: '宠物榜', emoji: '🐾' },
  ];

  return (
    <div className="leaderboard-panel">
      {/* 标签页 */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            className={`tab ${activeTab === tab.type ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.type)}
          >
            <span className="emoji">{tab.emoji}</span>
            <span className="label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 排行榜内容 */}
      <div className="leaderboard-content">
        {leaderboard ? (
          <>
            <div className="leaderboard-header">
              <h3>{leaderboard.emoji} {leaderboard.title}</h3>
              <p className="description">{leaderboard.description}</p>
              <div className="last-update">
                更新于: {new Date(leaderboard.lastUpdate).toLocaleString('zh-CN')}
              </div>
            </div>

            {/* 我的排名 */}
            {myRank && (
              <div className="my-rank">
                <div className="rank-badge">#{myRank.rank}</div>
                <div className="rank-info">
                  <div className="username">{myRank.username}</div>
                  <div className="score">{myRank.score.toLocaleString()}</div>
                </div>
                {myRank.change !== 0 && (
                  <div className={`change ${myRank.change > 0 ? 'up' : 'down'}`}>
                    {myRank.change > 0 ? '↑' : '↓'} {Math.abs(myRank.change)}
                  </div>
                )}
              </div>
            )}

            {/* 排行榜列表 */}
            <div className="rankings-list">
              {leaderboard.rankings.slice(0, 10).map((rank) => (
                <div 
                  key={rank.userId} 
                  className={`rank-item ${rank.isCurrentUser ? 'current-user' : ''} ${rank.rank <= 3 ? 'top-three' : ''}`}
                >
                  <div className="rank-number">
                    {rank.rank <= 3 ? (
                      <span className="medal">
                        {rank.rank === 1 && '🥇'}
                        {rank.rank === 2 && '🥈'}
                        {rank.rank === 3 && '🥉'}
                      </span>
                    ) : (
                      <span className="number">#{rank.rank}</span>
                    )}
                  </div>
                  
                  <div className="user-info">
                    {rank.avatar && (
                      <img src={rank.avatar} alt={rank.username} className="avatar" />
                    )}
                    <div className="username">{rank.username}</div>
                    {rank.badge && <span className="badge">{rank.badge}</span>}
                  </div>
                  
                  <div className="score">{rank.score.toLocaleString()}</div>
                  
                  {rank.change !== 0 && (
                    <div className={`change ${rank.change > 0 ? 'up' : 'down'}`}>
                      {rank.change > 0 ? '↑' : '↓'} {Math.abs(rank.change)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">
            <span className="emoji">📊</span>
            <p>暂无排行榜数据</p>
            <p className="hint">完成任务后即可参与排名</p>
          </div>
        )}
      </div>

      {/* 成就展示 */}
      <div className="achievements-section">
        <h3>🏆 成就</h3>
        
        {unlockedAchievements.length > 0 && (
          <div className="achievements-grid">
            <h4>已解锁 ({unlockedAchievements.length})</h4>
            <div className="achievements-list">
              {unlockedAchievements.slice(0, 6).map((achievement) => (
                <div key={achievement.id} className={`achievement-item unlocked ${achievement.rarity}`}>
                  <span className="emoji">{achievement.emoji}</span>
                  <div className="achievement-info">
                    <div className="name">{achievement.name}</div>
                    <div className="description">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div className="achievements-grid">
            <h4>未解锁 ({lockedAchievements.length})</h4>
            <div className="achievements-list">
              {lockedAchievements.slice(0, 6).map((achievement) => (
                <div key={achievement.id} className="achievement-item locked">
                  <span className="emoji grayscale">❓</span>
                  <div className="achievement-info">
                    <div className="name">???</div>
                    <div className="description">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .leaderboard-panel {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .tabs {
          display: flex;
          background: #f5f5f5;
          border-bottom: 2px solid #e0e0e0;
          overflow-x: auto;
        }

        .tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 80px;
        }

        .tab:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .tab.active {
          background: white;
          border-bottom: 3px solid #4CAF50;
        }

        .tab .emoji {
          font-size: 1.5rem;
        }

        .tab .label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 600;
        }

        .tab.active .label {
          color: #4CAF50;
        }

        .leaderboard-content {
          padding: 1.5rem;
        }

        .leaderboard-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .leaderboard-header h3 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .last-update {
          font-size: 0.75rem;
          color: #999;
        }

        .my-rank {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .rank-badge {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .rank-info {
          flex: 1;
        }

        .rank-info .username {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .rank-info .score {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .change {
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .change.up {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .change.down {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }

        .rankings-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .rank-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .rank-item:hover {
          background: #f0f0f0;
          transform: translateX(4px);
        }

        .rank-item.current-user {
          background: #e3f2fd;
          border: 2px solid #2196F3;
        }

        .rank-item.top-three {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }

        .rank-number {
          min-width: 40px;
          text-align: center;
        }

        .medal {
          font-size: 1.5rem;
        }

        .number {
          font-weight: 700;
          color: #666;
        }

        .user-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .username {
          font-weight: 600;
          color: #333;
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #4CAF50;
          color: white;
          border-radius: 4px;
        }

        .score {
          font-weight: 700;
          color: #4CAF50;
          font-size: 1.1rem;
        }

        .no-data {
          text-align: center;
          padding: 3rem 1rem;
          color: #999;
        }

        .no-data .emoji {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .no-data .hint {
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .achievements-section {
          padding: 1.5rem;
          background: #f9f9f9;
          border-top: 2px solid #e0e0e0;
        }

        .achievements-section h3 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .achievements-grid {
          margin-bottom: 1.5rem;
        }

        .achievements-grid h4 {
          font-size: 1rem;
          color: #666;
          margin-bottom: 0.75rem;
        }

        .achievements-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
        }

        .achievement-item.unlocked {
          border-color: #4CAF50;
        }

        .achievement-item.legendary {
          background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
          color: white;
        }

        .achievement-item.epic {
          background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
        }

        .achievement-item.rare {
          background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
        }

        .achievement-item.locked {
          opacity: 0.5;
        }

        .achievement-item .emoji {
          font-size: 2rem;
        }

        .achievement-item .emoji.grayscale {
          filter: grayscale(100%);
        }

        .achievement-info {
          flex: 1;
        }

        .achievement-info .name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .achievement-info .description {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};

