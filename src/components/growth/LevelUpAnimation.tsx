import { useEffect, useState } from 'react';
import { Crown, Sparkles, Gift } from 'lucide-react';

interface LevelUpAnimationProps {
  newLevel: {
    id: number;
    name: string;
    badge: string;
    color: string;
    privileges: string[];
    theme?: {
      name: string;
      preview: string;
    };
  };
  rewards: {
    gold: number;
  };
  onComplete: () => void;
  onApplyTheme?: () => void;
}

export default function LevelUpAnimation({
  newLevel,
  rewards,
  onComplete,
  onApplyTheme,
}: LevelUpAnimationProps) {
  const [stage, setStage] = useState<'fadeIn' | 'badge' | 'rewards' | 'complete'>('fadeIn');
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    // 播放升级音效（如果有）
    playLevelUpSound();

    // 动画序列
    const timers = [
      setTimeout(() => setStage('badge'), 500),
      setTimeout(() => setShowFireworks(true), 1000),
      setTimeout(() => setStage('rewards'), 2500),
      setTimeout(() => setStage('complete'), 4000),
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const playLevelUpSound = () => {
    // 使用 Web Audio API 播放简单的升级音效
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000 ${
        stage === 'fadeIn' ? 'bg-black/0' : 'bg-black/80'
      }`}
    >
      {/* 烟花粒子效果 */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB'][i % 5],
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 18}deg) translateY(-${100 + Math.random() * 200}px)`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 主内容 */}
      <div className="relative z-10 text-center">
        {/* 徽章动画 */}
        <div
          className={`transition-all duration-1000 ${
            stage === 'fadeIn' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <div
            className="w-48 h-48 mx-auto mb-8 rounded-full flex items-center justify-center text-9xl relative"
            style={{
              background: `linear-gradient(135deg, ${newLevel.color} 0%, ${newLevel.color}dd 100%)`,
              boxShadow: `0 0 100px ${newLevel.color}80`,
              animation: stage === 'badge' ? 'pulse 2s infinite' : 'none',
            }}
          >
            {newLevel.badge}
            
            {/* 光环效果 */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                border: `4px solid ${newLevel.color}`,
                opacity: 0.5,
              }}
            />
          </div>

          {/* 升级文字 */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              <h1 className="text-5xl font-bold text-white">恭喜升级！</h1>
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <p className="text-3xl font-bold" style={{ color: newLevel.color }}>
                {newLevel.name}
              </p>
            </div>
            <p className="text-white/80 text-lg">等级 {newLevel.id}</p>
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto mb-8">
              {/* 金币奖励 */}
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Gift className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-white">升级奖励</h3>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-4 mb-4">
                  <div className="text-yellow-400 text-sm mb-1">金币奖励</div>
                  <div className="text-4xl font-bold text-yellow-400">
                    +{rewards.gold} 💰
                  </div>
                </div>
              </div>

              {/* 新特权 */}
              <div className="mb-6">
                <h4 className="text-white text-lg font-semibold mb-3">🎉 解锁新特权</h4>
                <div className="space-y-2">
                  {newLevel.privileges.map((privilege, index) => (
                    <div
                      key={index}
                      className="bg-white/10 rounded-lg px-4 py-3 text-white text-left flex items-center space-x-3"
                      style={{
                        animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <span className="text-green-400 text-xl">✓</span>
                      <span>{privilege}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 专属主题 */}
              {newLevel.theme && (
                <div>
                  <h4 className="text-white text-lg font-semibold mb-3">🎨 专属主题</h4>
                  <div className="bg-white/10 rounded-xl p-4 flex items-center space-x-4">
                    <div
                      className="w-20 h-20 rounded-lg shadow-lg"
                      style={{ background: newLevel.theme.preview }}
                    />
                    <div className="flex-1 text-left">
                      <div className="text-white font-semibold mb-1">
                        {newLevel.theme.name}
                      </div>
                      <div className="text-white/70 text-sm mb-3">
                        专属主题已解锁
                      </div>
                      {onApplyTheme && (
                        <button
                          onClick={onApplyTheme}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          立即应用
                        </button>
                      )}
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
            className="px-12 py-4 bg-white text-neutral-900 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-2xl"
            style={{
              animation: 'fadeIn 0.5s ease-out',
            }}
          >
            太棒了！继续前进 🚀
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

