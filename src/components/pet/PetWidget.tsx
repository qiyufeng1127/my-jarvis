import React, { useEffect } from 'react';
import { usePetStore } from '@/stores/petStore';

export const PetWidget: React.FC = () => {
  const { currentPet, feedPet, playWithPet, healPet, updatePetStatus } = usePetStore();

  useEffect(() => {
    // 定期更新宠物状态
    const interval = setInterval(() => {
      updatePetStatus();
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [updatePetStatus]);

  if (!currentPet) {
    return (
      <div className="pet-widget no-pet">
        <div className="no-pet-content">
          <span className="emoji">🐾</span>
          <p>还没有宠物</p>
          <button className="btn-adopt">领养宠物</button>
        </div>
        
        <style jsx>{`
          .pet-widget.no-pet {
            padding: 2rem;
            text-align: center;
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 16px;
          }

          .no-pet-content .emoji {
            font-size: 3rem;
            display: block;
            margin-bottom: 1rem;
          }

          .no-pet-content p {
            color: #666;
            margin-bottom: 1rem;
          }

          .btn-adopt {
            padding: 0.75rem 1.5rem;
            background: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .btn-adopt:hover {
            transform: scale(1.05);
          }
        `}</style>
      </div>
    );
  }

  const { name, emoji, level, exp, expToNextLevel, hunger, happiness, health, status, goldBonus } = currentPet;

  // 状态颜色
  const getStatusColor = () => {
    switch (status) {
      case 'happy': return '#4CAF50';
      case 'normal': return '#2196F3';
      case 'hungry': return '#FF9800';
      case 'sad': return '#9C27B0';
      case 'sick': return '#F44336';
      case 'dead': return '#757575';
      default: return '#2196F3';
    }
  };

  // 状态文本
  const getStatusText = () => {
    switch (status) {
      case 'happy': return '😊 开心';
      case 'normal': return '😐 普通';
      case 'hungry': return '😋 饥饿';
      case 'sad': return '😢 难过';
      case 'sick': return '🤒 生病';
      case 'dead': return '💀 死亡';
      default: return '😐 普通';
    }
  };

  return (
    <div className="pet-widget" style={{ borderColor: getStatusColor() }}>
      <div className="pet-header">
        <div className="pet-avatar">{emoji}</div>
        <div className="pet-info">
          <div className="pet-name">{name}</div>
          <div className="pet-level">Lv.{level}</div>
          <div className="pet-status" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </div>
        </div>
      </div>

      <div className="pet-stats">
        <div className="stat-bar">
          <div className="stat-label">
            <span>❤️ 健康</span>
            <span>{health}%</span>
          </div>
          <div className="stat-progress">
            <div 
              className="stat-fill health"
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        <div className="stat-bar">
          <div className="stat-label">
            <span>🍖 饥饿</span>
            <span>{hunger}%</span>
          </div>
          <div className="stat-progress">
            <div 
              className="stat-fill hunger"
              style={{ width: `${hunger}%` }}
            />
          </div>
        </div>

        <div className="stat-bar">
          <div className="stat-label">
            <span>😊 快乐</span>
            <span>{happiness}%</span>
          </div>
          <div className="stat-progress">
            <div 
              className="stat-fill happiness"
              style={{ width: `${happiness}%` }}
            />
          </div>
        </div>

        <div className="stat-bar">
          <div className="stat-label">
            <span>⭐ 经验</span>
            <span>{exp}/{expToNextLevel}</span>
          </div>
          <div className="stat-progress">
            <div 
              className="stat-fill exp"
              style={{ width: `${(exp / expToNextLevel) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pet-bonus">
        💰 金币加成: +{((goldBonus - 1) * 100).toFixed(0)}%
      </div>

      <div className="pet-actions">
        <button 
          onClick={() => feedPet('food_1')}
          className="action-btn feed"
          disabled={status === 'dead'}
        >
          🍖 喂食
        </button>
        <button 
          onClick={() => playWithPet()}
          className="action-btn play"
          disabled={status === 'dead'}
        >
          🎾 玩耍
        </button>
        {status === 'sick' && (
          <button 
            onClick={healPet}
            className="action-btn heal"
          >
            💊 治疗
          </button>
        )}
      </div>

      <style jsx>{`
        .pet-widget {
          padding: 1.5rem;
          background: white;
          border: 3px solid;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .pet-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .pet-avatar {
          font-size: 4rem;
          line-height: 1;
        }

        .pet-info {
          flex: 1;
        }

        .pet-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: #333;
        }

        .pet-level {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .pet-status {
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .pet-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .stat-bar {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #666;
        }

        .stat-progress {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .stat-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .stat-fill.health {
          background: linear-gradient(90deg, #f44336, #e91e63);
        }

        .stat-fill.hunger {
          background: linear-gradient(90deg, #ff9800, #ff5722);
        }

        .stat-fill.happiness {
          background: linear-gradient(90deg, #ffc107, #ffeb3b);
        }

        .stat-fill.exp {
          background: linear-gradient(90deg, #2196f3, #03a9f4);
        }

        .pet-bonus {
          text-align: center;
          padding: 0.75rem;
          background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .pet-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.feed {
          background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
          color: white;
        }

        .action-btn.play {
          background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
          color: white;
        }

        .action-btn.heal {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }

        .action-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

