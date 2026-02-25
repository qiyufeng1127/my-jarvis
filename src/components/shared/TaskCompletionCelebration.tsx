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
  const [showGoldText, setShowGoldText] = useState(false);

  useEffect(() => {
    // 1. 播放金币音效
    notificationService.playSound('coin');

    // 2. 生成撒花特效（50个彩纸）
    const confettiArray = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
    }));
    setConfetti(confettiArray);

    // 3. 生成金币特效（10个金币）
    const coinsArray = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: 30 + Math.random() * 40,
      delay: i * 0.1,
    }));
    setCoins(coinsArray);

    // 4. 显示金币文字提示
    setTimeout(() => {
      setShowGoldText(true);
    }, 300);

    // 5. 3秒后自动关闭
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [goldAmount, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      {/* 撒花特效 */}
      {confetti.map((item) => (
        <div
          key={`confetti-${item.id}`}
          className="absolute top-0 w-3 h-3 animate-fall"
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
          className="absolute top-1/3 text-4xl animate-coin-rise"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
          }}
        >
          💰
        </div>
      ))}

      {/* 金币文字提示 */}
      {showGoldText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-scale-in pointer-events-auto">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-yellow-300">
            <div className="text-center">
              <div className="text-2xl font-black mb-2">🎉 任务完成！</div>
              <div className="text-xl font-bold">{taskTitle}</div>
              <div className="text-3xl font-black mt-3 animate-bounce">
                +{goldAmount} 💰
              </div>
            </div>
          </div>
        </div>
      )}

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
            transform: translateY(-100px) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(0);
            opacity: 0;
          }
        }

        @keyframes scale-in {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
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
          animation: coin-rise 1.5s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

