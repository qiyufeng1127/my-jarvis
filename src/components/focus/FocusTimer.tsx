import React, { useEffect, useState } from 'react';
import { useFocusStore } from '@/stores/focusStore';
import { useDriveStore } from '@/stores/driveStore';

export const FocusTimer: React.FC = () => {
  const {
    isActive,
    currentMode,
    currentSession,
    pomodoroPhase,
    elapsedTime,
    targetTime,
    settings,
    startFocus,
    pauseFocus,
    resumeFocus,
    stopFocus,
    tick,
    nextPomodoroPhase,
    skipBreak,
  } = useFocusStore();

  const [showSettings, setShowSettings] = useState(false);

  // 计时器
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, tick]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 进度百分比
  const progress = targetTime > 0 ? (elapsedTime / targetTime) * 100 : 0;

  // 番茄钟阶段文本
  const getPhaseText = () => {
    if (currentMode !== 'pomodoro') return currentMode === 'deep' ? '深度专注' : '心流模式';
    
    switch (pomodoroPhase) {
      case 'work': return '🍅 工作中';
      case 'shortBreak': return '☕ 短休息';
      case 'longBreak': return '🌴 长休息';
    }
  };

  if (!currentSession && !isActive) {
    return (
      <div className="focus-timer-start">
        <h3>🎯 开始专注</h3>
        <div className="focus-modes">
          <button
            onClick={() => startFocus('pomodoro')}
            className="focus-mode-btn pomodoro"
          >
            <span className="emoji">🍅</span>
            <span className="name">番茄钟</span>
            <span className="desc">{settings.pomodoroDuration}分钟工作 + {settings.shortBreakDuration}分钟休息</span>
          </button>
          
          <button
            onClick={() => startFocus('deep')}
            className="focus-mode-btn deep"
          >
            <span className="emoji">🧘</span>
            <span className="name">深度专注</span>
            <span className="desc">90分钟深度工作</span>
          </button>
          
          <button
            onClick={() => startFocus('flow')}
            className="focus-mode-btn flow"
          >
            <span className="emoji">🌊</span>
            <span className="name">心流模式</span>
            <span className="desc">120分钟沉浸式工作</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`focus-timer active ${pomodoroPhase}`}>
      <div className="focus-header">
        <span className="phase-text">{getPhaseText()}</span>
        {currentSession?.taskName && (
          <span className="task-name">{currentSession.taskName}</span>
        )}
      </div>

      <div className="timer-display">
        <div className="time-text">{formatTime(elapsedTime)}</div>
        <div className="time-target">/ {formatTime(targetTime)}</div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="timer-controls">
        {isActive ? (
          <button onClick={pauseFocus} className="btn-pause">
            ⏸️ 暂停
          </button>
        ) : (
          <button onClick={resumeFocus} className="btn-resume">
            ▶️ 继续
          </button>
        )}
        
        <button 
          onClick={() => stopFocus(false)} 
          className="btn-stop"
        >
          ⏹️ 停止
        </button>

        {currentMode === 'pomodoro' && pomodoroPhase !== 'work' && (
          <button onClick={skipBreak} className="btn-skip">
            ⏭️ 跳过休息
          </button>
        )}
      </div>

      <style jsx>{`
        .focus-timer-start {
          padding: 2rem;
          text-align: center;
        }

        .focus-timer-start h3 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: #333;
        }

        .focus-modes {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .focus-mode-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
        }

        .focus-mode-btn:hover {
          border-color: #4CAF50;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
        }

        .focus-mode-btn .emoji {
          font-size: 2.5rem;
        }

        .focus-mode-btn .name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .focus-mode-btn .desc {
          font-size: 0.85rem;
          color: #666;
        }

        .focus-timer.active {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }

        .focus-timer.shortBreak,
        .focus-timer.longBreak {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .focus-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .phase-text {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .task-name {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .timer-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .time-text {
          font-size: 4rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .time-target {
          font-size: 1.5rem;
          opacity: 0.7;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .progress-fill {
          height: 100%;
          background: white;
          transition: width 0.3s ease;
        }

        .timer-controls {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .timer-controls button {
          padding: 0.75rem 1.5rem;
          border: 2px solid white;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .timer-controls button:hover {
          background: white;
          color: #667eea;
        }

        .btn-stop {
          background: rgba(244, 67, 54, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .btn-stop:hover {
          background: #f44336;
          color: white;
          border-color: #f44336;
        }
      `}</style>
    </div>
  );
};

