import React, { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';

interface TaskCompletionCelebrationProps {
  taskTitle: string;
  goldAmount: number;
  onComplete?: () => void;
}

/**
 * 任务完成庆祝特效组件
 * 包含：撒花特效、金币特效、音效、视觉提示
 */
export default function TaskCompletionCelebration({
  taskTitle,
  goldAmount,
  onComplete,
}: TaskCompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);
  const [coins, setCoins] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 1. 播放金币音效
    notificationService.playSound('coin');

    // 2. 生成撒花特效（30个彩纸，更少更精致）
    const confettiArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 0.5,
    }));
    setConfetti(confettiArray);

    // 3. 生成金币特效（8个金币）
    const coinsArray = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 35 + Math.random() * 30,
      delay: i * 0.08,
    }));
    setCoins(coinsArray);

    // 4. 1.8秒后开始淡出
    const fadeTimer = setTimeout(() => {
      setVisible(false);
    }, 1800);

    // 5. 2秒后完全关闭
    const closeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [goldAmount, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* 撒花特效 */}
      {confetti.map((item) => (
        <div
          key={`confetti-${item.id}`}
          className="absolute top-0 w-2 h-2 animate-fall"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][item.id % 6],
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* 金币特效 */}
      {coins.map((coin) => (
        <div
          key={`coin-${coin.id}`}
          className="absolute top-1/3 text-3xl animate-coin-rise"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
          }}
        >
          💰
        </div>
      ))}

      {/* 简洁的金币提示 - 单行显示 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-scale-in">
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white px-8 py-6 rounded-3xl shadow-2xl border-4 border-yellow-300">
          <div className="flex items-center gap-4">
            <div className="text-5xl animate-bounce">🎉</div>
            <div className="text-center">
              <div className="text-3xl font-black animate-pulse">
                +{goldAmount} 💰
              </div>
            </div>
            <div className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</div>
          </div>
        </div>
      </div>

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes coin-rise {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-80px) scale(1.3);
            opacity: 1;
          }
          100% {
            transform: translateY(-150px) scale(0);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        .animate-fall {
          animation: fall linear forwards;
        }

        .animate-coin-rise {
          animation: coin-rise 1.2s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

