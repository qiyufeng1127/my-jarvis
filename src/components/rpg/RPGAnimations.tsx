import { useEffect, useState } from 'react';
import { Star, Sparkles, TrendingUp } from 'lucide-react';

const VINTAGE_COLORS = {
  tangerine: '#EAA239',
  leaves: '#8F9E25',
  wisteria: '#C3A5C1',
};

interface AnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * 任务完成动画
 */
export function TaskCompleteAnimation({ show, onComplete }: AnimationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="animate-bounce-in">
        <div className="text-8xl animate-scale-up">✅</div>
      </div>
      
      {/* 粒子效果 */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-particle"
          style={{
            backgroundColor: VINTAGE_COLORS.leaves,
            left: '50%',
            top: '50%',
            animationDelay: `${i * 0.1}s`,
            '--angle': `${(360 / 8) * i}deg`,
          } as any}
        />
      ))}
    </div>
  );
}

/**
 * 升级动画
 */
export function LevelUpAnimation({ show, onComplete }: AnimationProps & { level?: number }) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow-200/30 to-transparent animate-pulse-slow" />
      
      {/* 主要内容 */}
      <div className="relative">
        <div className="text-center animate-scale-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: VINTAGE_COLORS.tangerine }}
          >
            恭喜升级！
          </div>
          <div className="text-2xl font-semibold" style={{ color: VINTAGE_COLORS.leaves }}>
            Level Up!
          </div>
        </div>

        {/* 星星效果 */}
        {[...Array(12)].map((_, i) => (
          <Star
            key={i}
            className="absolute animate-star-burst"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${i * 0.1}s`,
              '--angle': `${(360 / 12) * i}deg`,
              color: VINTAGE_COLORS.tangerine,
            } as any}
            size={20}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 经验值增加动画
 */
export function ExpGainAnimation({ 
  show, 
  amount, 
  position 
}: { 
  show: boolean; 
  amount: number; 
  position?: { x: number; y: number };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[9998] pointer-events-none animate-float-up"
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div 
        className="text-2xl font-bold flex items-center gap-1"
        style={{ color: VINTAGE_COLORS.leaves }}
      >
        <TrendingUp size={20} />
        <span>+{amount} EXP</span>
      </div>
    </div>
  );
}

/**
 * 金币增加动画
 */
export function GoldGainAnimation({ 
  show, 
  amount, 
  position 
}: { 
  show: boolean; 
  amount: number; 
  position?: { x: number; y: number };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[9998] pointer-events-none animate-float-up"
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: 'translate(-50%, -50%)',
        animationDelay: '0.1s',
      }}
    >
      <div 
        className="text-2xl font-bold flex items-center gap-1"
        style={{ color: VINTAGE_COLORS.tangerine }}
      >
        <span>💰</span>
        <span>+{amount}</span>
      </div>
    </div>
  );
}

/**
 * 成就解锁动画
 */
export function AchievementUnlockAnimation({ 
  show, 
  achievement,
  onComplete 
}: AnimationProps & { 
  achievement?: { icon: string; title: string };
}) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || !achievement) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* 背景 */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" />
      
      {/* 成就卡片 */}
      <div 
        className="relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 shadow-2xl animate-scale-bounce"
        style={{ maxWidth: '400px' }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-in">{achievement.icon}</div>
          <div className="text-sm font-semibold mb-2" style={{ color: VINTAGE_COLORS.wisteria }}>
            🏆 成就解锁
          </div>
          <div className="text-2xl font-bold" style={{ color: VINTAGE_COLORS.tangerine }}>
            {achievement.title}
          </div>
        </div>

        {/* 闪光效果 */}
        {[...Array(6)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute animate-sparkle"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 70}%`,
              animationDelay: `${i * 0.2}s`,
              color: VINTAGE_COLORS.tangerine,
            } as any}
            size={24}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 连击动画
 */
export function ComboAnimation({ 
  show, 
  combo 
}: { 
  show: boolean; 
  combo: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible || combo < 2) return null;

  return (
    <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-[9998] pointer-events-none">
      <div className="text-center animate-scale-bounce">
        <div className="text-6xl font-bold mb-2" style={{ color: VINTAGE_COLORS.tangerine }}>
          {combo}x
        </div>
        <div className="text-2xl font-semibold" style={{ color: VINTAGE_COLORS.leaves }}>
          COMBO!
        </div>
      </div>
    </div>
  );
}

// 添加CSS动画到全局样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes bounce-in {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes scale-up {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes scale-bounce {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.1); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes float-up {
      0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) translateY(-100px); opacity: 0; }
    }

    @keyframes particle {
      0% { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { 
        transform: translate(
          calc(cos(var(--angle)) * 100px),
          calc(sin(var(--angle)) * 100px)
        ) scale(0); 
        opacity: 0; 
      }
    }

    @keyframes star-burst {
      0% { 
        transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0); 
        opacity: 1; 
      }
      100% { 
        transform: translate(-50%, -50%) 
          translate(
            calc(cos(var(--angle)) * 150px),
            calc(sin(var(--angle)) * 150px)
          ) 
          rotate(360deg) scale(1); 
        opacity: 0; 
      }
    }

    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
    .animate-scale-up { animation: scale-up 1s ease-in-out infinite; }
    .animate-scale-bounce { animation: scale-bounce 0.6s ease-out; }
    .animate-float-up { animation: float-up 1.5s ease-out forwards; }
    .animate-particle { animation: particle 1s ease-out forwards; }
    .animate-star-burst { animation: star-burst 1.5s ease-out forwards; }
    .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

