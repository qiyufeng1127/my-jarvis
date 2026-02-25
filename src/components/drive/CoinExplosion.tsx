import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinExplosionProps {
  amount: number;
  multiplier?: number;
  onComplete?: () => void;
  triggerPosition?: { x: number; y: number };
}

interface Coin {
  id: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
}

export default function CoinExplosion({ 
  amount, 
  multiplier = 1.0, 
  onComplete,
  triggerPosition 
}: CoinExplosionProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showAmount, setShowAmount] = useState(true);

  useEffect(() => {
    // 生成10-20个金币
    const coinCount = Math.min(20, Math.max(10, Math.floor(amount / 10)));
    const newCoins: Coin[] = [];

    for (let i = 0; i < coinCount; i++) {
      newCoins.push({
        id: i,
        x: (Math.random() - 0.5) * 200, // -100 到 100
        y: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 720 - 360, // -360 到 360
        delay: Math.random() * 0.2, // 0 到 0.2秒
      });
    }

    setCoins(newCoins);

    // 1.5秒后隐藏金额显示
    const amountTimer = setTimeout(() => {
      setShowAmount(false);
    }, 1500);

    // 2秒后完成动画
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => {
      clearTimeout(amountTimer);
      clearTimeout(completeTimer);
    };
  }, [amount, onComplete]);

  // 计算目标位置（右上角金币余额位置）
  const targetX = window.innerWidth - 100;
  const targetY = 50;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* 金币粒子 */}
      <AnimatePresence>
        {coins.map((coin) => (
          <motion.div
            key={coin.id}
            className="absolute text-4xl"
            initial={{
              x: triggerPosition?.x || window.innerWidth / 2,
              y: triggerPosition?.y || window.innerHeight / 2,
              scale: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              x: [
                triggerPosition?.x || window.innerWidth / 2,
                (triggerPosition?.x || window.innerWidth / 2) + coin.x,
                targetX,
              ],
              y: [
                triggerPosition?.y || window.innerHeight / 2,
                (triggerPosition?.y || window.innerHeight / 2) + coin.y,
                targetY,
              ],
              scale: [0, 1.2, 0.8],
              opacity: [0, 1, 0],
              rotate: [0, coin.rotation, coin.rotation * 2],
            }}
            transition={{
              duration: 1.5,
              delay: coin.delay,
              ease: [0.34, 1.56, 0.64, 1], // 弹性缓动
            }}
          >
            💰
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 金额显示 */}
      <AnimatePresence>
        {showAmount && (
          <motion.div
            className="absolute"
            style={{
              left: triggerPosition?.x || window.innerWidth / 2,
              top: triggerPosition?.y || window.innerHeight / 2,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-2xl">
              +{amount} 💰
              {multiplier > 1.0 && (
                <span className="ml-2 text-yellow-200">
                  x{multiplier.toFixed(1)}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 连击提示 */}
      {multiplier > 1.0 && (
        <AnimatePresence>
          <motion.div
            className="absolute left-1/2 top-1/3"
            style={{ transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: [50, 0, 0] }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500 drop-shadow-2xl">
              🔥 {multiplier >= 3 ? '10' : multiplier >= 2 ? '5' : multiplier >= 1.5 ? '3' : '2'}连击！
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

