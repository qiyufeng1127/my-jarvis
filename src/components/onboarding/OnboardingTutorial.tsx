import React, { useState, useEffect } from 'react';
import { usePetStore } from '@/stores/petStore';
import { useFocusStore } from '@/stores/focusStore';
import { useLeaderboardStore } from '@/stores/leaderboardStore';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
  action?: () => void;
  actionText?: string;
}

export const OnboardingTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const { ownedPets } = usePetStore();
  const { sessions } = useFocusStore();
  const { achievements } = useLeaderboardStore();

  useEffect(() => {
    // 检查是否是第一次使用
    const hasSeenTutorial = localStorage.getItem('manifestos-tutorial-completed');
    
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      title: '欢迎来到 Manifestos！',
      description: '我们为你准备了全新的动力系统，让任务管理变得更有趣、更有动力！',
      emoji: '🎉',
    },
    {
      id: 'pet',
      title: '虚拟宠物系统',
      description: '领养一只可爱的宠物陪伴你！完成任务获得经验，宠物升级后可以提供金币加成（最高50%）。记得定时喂食和玩耍哦！',
      emoji: '🐾',
      actionText: '去领养宠物',
      action: () => {
        // 打开宠物商店
        window.dispatchEvent(new CustomEvent('openPetShop'));
      },
    },
    {
      id: 'focus',
      title: '专注模式',
      description: '使用番茄钟、深度专注或心流模式来提升效率。完成专注会话可以获得金币和经验奖励！',
      emoji: '🎯',
    },
    {
      id: 'leaderboard',
      title: '排行榜与成就',
      description: '在5种排行榜中竞争，解锁17个成就！从普通到传说级，展示你的实力！',
      emoji: '🏆',
    },
    {
      id: 'drive',
      title: '驱动力系统',
      description: '每日生存成本50金币，连击系统最高3倍奖励，连胜系统激励你每天完成任务。金币不足会进入破产模式！',
      emoji: '💰',
    },
    {
      id: 'complete',
      title: '开始你的旅程！',
      description: '所有系统已准备就绪。完成任务、照顾宠物、保持专注，成为最强的时间管理大师！',
      emoji: '🚀',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('manifestos-tutorial-completed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* 进度指示器 */}
        <div className="progress-dots">
          {steps.map((s, index) => (
            <div
              key={s.id}
              className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* 内容 */}
        <div className="content">
          <div className="emoji">{step.emoji}</div>
          <h2>{step.title}</h2>
          <p>{step.description}</p>

          {/* 特殊操作按钮 */}
          {step.action && (
            <button
              className="action-button"
              onClick={() => {
                step.action?.();
                handleNext();
              }}
            >
              {step.actionText}
            </button>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="buttons">
          <button onClick={handleSkip} className="btn-skip">
            跳过教程
          </button>

          <div className="nav-buttons">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="btn-prev">
                上一步
              </button>
            )}
            <button onClick={handleNext} className="btn-next">
              {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
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

        .onboarding-modal {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .progress-dots {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e0e0e0;
          transition: all 0.3s ease;
        }

        .dot.active {
          width: 24px;
          border-radius: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .dot.completed {
          background: #4CAF50;
        }

        .content {
          text-align: center;
          margin-bottom: 2rem;
        }

        .emoji {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        h2 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        p {
          font-size: 1.1rem;
          color: #666;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .action-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .btn-skip {
          padding: 0.75rem 1.5rem;
          background: transparent;
          color: #999;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-skip:hover {
          color: #666;
          background: #f5f5f5;
        }

        .nav-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .btn-prev,
        .btn-next {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-prev {
          background: #f5f5f5;
          color: #666;
        }

        .btn-prev:hover {
          background: #e0e0e0;
        }

        .btn-next {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 768px) {
          .onboarding-modal {
            padding: 1.5rem;
          }

          .emoji {
            font-size: 4rem;
          }

          h2 {
            font-size: 1.5rem;
          }

          p {
            font-size: 1rem;
          }

          .buttons {
            flex-direction: column;
          }

          .nav-buttons {
            width: 100%;
          }

          .btn-prev,
          .btn-next {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

