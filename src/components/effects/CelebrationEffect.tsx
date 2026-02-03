import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationEffectProps {
  show: boolean;
  goldAmount: number;
  onComplete: () => void;
}

export default function CelebrationEffect({ show, goldAmount, onComplete }: CelebrationEffectProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const [coins, setCoins] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // 生成彩色纸屑
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#87CEEB', '#98D8C8'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(newConfetti);

      // 生成金币
      const newCoins = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setCoins(newCoins);

      // 2秒后清除效果
      const timer = setTimeout(() => {
        setConfetti([]);
        setCoins([]);
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* 彩色纸屑 */}
      <AnimatePresence>
        {confetti.map((item) => (
          <motion.div
            key={`confetti-${item.id}`}
            initial={{ y: -20, x: `${item.x}vw`, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              rotate: 360 * 3,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              delay: item.delay,
              ease: 'easeIn',
            }}
            className="absolute w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
        ))}
      </AnimatePresence>

      {/* 金币 */}
      <AnimatePresence>
        {coins.map((item) => (
          <motion.div
            key={`coin-${item.id}`}
            initial={{ y: -50, x: `${item.x}vw`, opacity: 1, scale: 0 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0],
              scale: [0, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: item.delay,
              ease: 'easeIn',
            }}
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              boxShadow: '0 4px 8px rgba(255, 215, 0, 0.5)',
            }}
          >
            💰
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 中央金币数量显示 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, times: [0, 0.3, 0.7, 1] }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <div className="text-6xl font-bold text-yellow-400" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.8)' }}>
          +{goldAmount} 💰
        </div>
      </motion.div>
    </div>
  );
}

