import React, { useState } from 'react';
import { PetWidget } from '@/components/pet/PetWidget';
import { PetShop } from '@/components/pet/PetShop';
import { FocusTimer } from '@/components/focus/FocusTimer';
import { FocusStatsPanel } from '@/components/focus/FocusStatsPanel';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

export const GameSystemPanel: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'pet' | 'focus' | 'leaderboard' | null>(null);
  const [showPetShop, setShowPetShop] = useState(false);

  // 监听打开宠物商店事件
  React.useEffect(() => {
    const handleOpenPetShop = () => {
      setShowPetShop(true);
    };

    window.addEventListener('openPetShop', handleOpenPetShop);
    return () => window.removeEventListener('openPetShop', handleOpenPetShop);
  }, []);

  return (
    <>
      {/* 浮动按钮 */}
      <div className="game-system-fab">
        <button
          className="fab-main"
          onClick={() => setActivePanel(activePanel ? null : 'pet')}
        >
          🎮
        </button>

        {activePanel && (
          <div className="fab-menu">
            <button
              className={`fab-item ${activePanel === 'pet' ? 'active' : ''}`}
              onClick={() => setActivePanel('pet')}
              title="宠物系统"
            >
              🐾
            </button>
            <button
              className={`fab-item ${activePanel === 'focus' ? 'active' : ''}`}
              onClick={() => setActivePanel('focus')}
              title="专注模式"
            >
              🎯
            </button>
            <button
              className={`fab-item ${activePanel === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActivePanel('leaderboard')}
              title="排行榜"
            >
              🏆
            </button>
          </div>
        )}
      </div>

      {/* 侧边面板 */}
      {activePanel && (
        <div className="game-system-panel">
          <div className="panel-header">
            <h3>
              {activePanel === 'pet' && '🐾 宠物系统'}
              {activePanel === 'focus' && '🎯 专注模式'}
              {activePanel === 'leaderboard' && '🏆 排行榜'}
            </h3>
            <button className="btn-close" onClick={() => setActivePanel(null)}>
              ✕
            </button>
          </div>

          <div className="panel-content">
            {activePanel === 'pet' && (
              <>
                <PetWidget />
                <button
                  className="btn-shop"
                  onClick={() => setShowPetShop(true)}
                >
                  🏪 打开宠物商店
                </button>
              </>
            )}

            {activePanel === 'focus' && (
              <>
                <FocusTimer />
                <div style={{ marginTop: '1rem' }}>
                  <FocusStatsPanel />
                </div>
              </>
            )}

            {activePanel === 'leaderboard' && <LeaderboardPanel />}
          </div>
        </div>
      )}

      {/* 宠物商店模态框 */}
      {showPetShop && (
        <div className="modal-overlay" onClick={() => setShowPetShop(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPetShop(false)}>
              ✕
            </button>
            <PetShop />
          </div>
        </div>
      )}

      <style jsx>{`
        .game-system-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
        }

        .fab-main {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-size: 2rem;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fab-main:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
        }

        .fab-menu {
          position: absolute;
          bottom: 80px;
          right: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fab-item {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e0e0e0;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fab-item:hover {
          transform: scale(1.1);
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .fab-item.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          transform: scale(1.15);
        }

        .game-system-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: white;
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 999;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #e0e0e0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .panel-header h3 {
          font-size: 1.3rem;
          margin: 0;
        }

        .btn-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .btn-shop {
          width: 100%;
          padding: 1rem;
          margin-top: 1rem;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-shop:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(252, 182, 159, 0.4);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleIn 0.3s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: rotate(90deg);
        }

        @media (max-width: 768px) {
          .game-system-panel {
            width: 100%;
          }

          .fab-main {
            width: 56px;
            height: 56px;
            font-size: 1.75rem;
          }

          .fab-item {
            width: 48px;
            height: 48px;
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

