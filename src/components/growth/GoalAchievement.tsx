import { useEffect, useState } from 'react';
import { Trophy, Star, Gift, Sparkles } from 'lucide-react';

interface GoalAchievementProps {
  goal: {
    id: string;
    name: string;
    type: 'numeric' | 'milestone' | 'habit';
    targetValue: number;
    unit?: string;
  };
  rewards: {
    gold: number;
    badge?: {
      name: string;
      icon: string;
      color: string;
    };
  };
  onComplete: () => void;
}

export default function GoalAchievement({
  goal,
  rewards,
  onComplete,
}: GoalAchievementProps) {
  const [stage, setStage] = useState<'fadeIn' | 'trophy' | 'rewards' | 'complete'>('fadeIn');
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // 播放成就音效
    playAchievementSound();

    // 动画序列
    const timers = [
      setTimeout(() => setStage('trophy'), 500),
      setTimeout(() => {
        setShowFireworks(true);
        setShowConfetti(true);
      }, 1000),
      setTimeout(() => setStage('rewards'), 2500),
      setTimeout(() => setStage('complete'), 4000),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const playAchievementSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 播放胜利音效序列
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.15 + 0.3);

      oscillator.start(audioContext.currentTime + index * 0.15);
      oscillator.stop(audioContext.currentTime + index * 0.15 + 0.3);
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000 ${
        stage === 'fadeIn' ? 'bg-black/0' : 'bg-black/80'
      }`}
    >
      {/* 烟花效果 */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={`firework-${i}`}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB', '#32CD32'][i % 6],
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 五彩纸屑 */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute w-3 h-3 animate-bounce"
              style={{
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB'][i % 5],
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* 主内容 */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        {/* 奖杯动画 */}
        <div
          className={`transition-all duration-1000 ${
            stage === 'fadeIn' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* 发光奖杯 */}
          <div className="relative mb-8">
            <div
              className="w-48 h-48 mx-auto rounded-full flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                boxShadow: '0 0 100px rgba(255, 215, 0, 0.8)',
                animation: stage === 'trophy' ? 'pulse 2s infinite' : 'none',
              }}
            >
              <Trophy className="w-32 h-32 text-white" />
              
              {/* 光环效果 */}
              <div className="absolute inset-0 rounded-full animate-ping border-4 border-yellow-400 opacity-50" />
              <div className="absolute inset-0 rounded-full animate-pulse border-4 border-yellow-300 opacity-30" />
            </div>

            {/* 星星装饰 */}
            {[...Array(8)].map((_, i) => (
              <Star
                key={i}
                className="absolute w-8 h-8 text-yellow-400 animate-pulse"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-120px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
                fill="currentColor"
              />
            ))}
          </div>

          {/* 成就文字 */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
              <h1 className="text-6xl font-bold text-white">目标达成！</h1>
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-3xl font-bold text-yellow-400 mb-2">
              {goal.name}
            </p>
            <p className="text-xl text-white/80">
              {goal.targetValue} {goal.unit || ''} 已完成
            </p>
          </div>
        </div>

        {/* 奖励展示 */}
        {stage !== 'fadeIn' && (
          <div
            className={`transition-all duration-1000 ${
              stage === 'rewards' || stage === 'complete'
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
              {/* 金币奖励 */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Gift className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-white">达成奖励</h3>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-6">
                  <div className="text-yellow-400 text-sm mb-2">金币奖励</div>
                  <div className="text-5xl font-bold text-yellow-400 mb-2">
                    +{rewards.gold} 💰
                  </div>
                  <div className="text-yellow-300 text-sm">
                    已自动添加到你的账户
                  </div>
                </div>
              </div>

              {/* 成就徽章 */}
              {rewards.badge && (
                <div>
                  <h4 className="text-white text-lg font-semibold mb-3">🏆 解锁成就徽章</h4>
                  <div
                    className="bg-white/10 rounded-xl p-6 flex items-center space-x-4"
                    style={{
                      animation: 'glow 2s infinite',
                    }}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: rewards.badge.color }}
                    >
                      {rewards.badge.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-bold text-xl mb-1">
                        {rewards.badge.name}
                      </div>
                      <div className="text-white/70 text-sm">
                        专属成就徽章已解锁
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 确认按钮 */}
        {stage === 'complete' && (
          <button
            onClick={onComplete}
            className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-2xl"
            style={{
              animation: 'fadeIn 0.5s ease-out',
            }}
          >
            太棒了！继续加油 🎉
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
          }
        }
      `}</style>
    </div>
  );
}

