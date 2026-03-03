import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TaskCompletionEfficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (efficiency: number, notes: string) => void;
  taskTitle: string;
  plannedImageCount: number;
  actualImageCount: number;
  isDark: boolean;
  accentColor: string;
  goldReward?: number; // 🔧 新增：金币奖励数量
}

export default function TaskCompletionEfficiencyModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  plannedImageCount,
  actualImageCount,
  isDark,
  accentColor,
  goldReward = 0, // 🔧 新增：金币奖励数量
}: TaskCompletionEfficiencyModalProps) {
  const [efficiency, setEfficiency] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [notes, setNotes] = useState(''); // 备注

  if (!isOpen) return null;

  // 复古糖果色配色方案
  const candyColors = {
    pink: '#FF6B9D',      // 糖果粉
    mint: '#98D8C8',      // 薄荷绿
    peach: '#FFB347',     // 蜜桃橙
    lavender: '#B19CD9',  // 薰衣草紫
    lemon: '#FFE66D',     // 柠檬黄
    coral: '#FF6F61',     // 珊瑚红
    sky: '#87CEEB',       // 天空蓝
  };

  // 计算效率等级和颜色（使用复古糖果色）
  const getEfficiencyLevel = (eff: number): { label: string; emoji: string; color: string } => {
    if (eff >= 90) return { label: '超棒', emoji: '🌟', color: candyColors.lemon };
    if (eff >= 70) return { label: '不错', emoji: '🎈', color: candyColors.mint };
    if (eff >= 50) return { label: '还行', emoji: '🍬', color: candyColors.peach };
    return { label: '加油', emoji: '🌈', color: candyColors.lavender };
  };

  const efficiencyLevel = getEfficiencyLevel(efficiency);

  // 处理滑块拖动
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEfficiency(Number(e.target.value));
  };

  const handleConfirm = () => {
    onConfirm(efficiency, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: '#FFF5F7' }}
      >
        {/* 关闭按钮 - 固定在顶部 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all z-10 hover:scale-110"
          style={{ backgroundColor: candyColors.pink, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 可滚动内容区域 */}
        <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(85vh - 100px)' }}>

        {/* 金币奖励展示 */}
        {goldReward > 0 && (
          <div className="mb-6 p-6 rounded-3xl shadow-lg" style={{ backgroundColor: candyColors.lemon }}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl animate-bounce">💰</span>
              <div className="text-center">
                <div className="text-4xl font-black text-white animate-pulse drop-shadow-lg">
                  +{goldReward} 金币
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: '#8B6914' }}>
                  🎉 太棒啦！
                </div>
              </div>
              <span className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
            </div>
          </div>
        )}

        {/* 标题 */}
        <div className="mb-6 text-center">
          <div className="text-3xl mb-2">✨</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: candyColors.pink }}>任务完成啦！</h2>
          <p className="text-sm font-medium" style={{ color: candyColors.coral }}>
            {taskTitle}
          </p>
        </div>

        {/* 图片统计 */}
        <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: candyColors.mint + '30' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: candyColors.mint }}>
              📸 计划拍照
            </span>
            <span className="font-bold text-lg" style={{ color: candyColors.mint }}>{plannedImageCount} 次</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: candyColors.mint }}>
              ✅ 实际拍照
            </span>
            <span className="font-bold text-lg" style={{ color: candyColors.mint }}>{actualImageCount} 次</span>
          </div>
        </div>

        {/* 效率滑块 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg" style={{ color: candyColors.lavender }}>🎯 完成效率</span>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 px-4 py-2 rounded-full shadow-md"
                style={{ backgroundColor: efficiencyLevel.color, color: 'white' }}
              >
                <span className="text-xl">{efficiencyLevel.emoji}</span>
                <span className="font-black text-lg">{efficiency}%</span>
              </div>
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: efficiencyLevel.color + '40', color: efficiencyLevel.color }}
              >
                {efficiencyLevel.label}
              </span>
            </div>
          </div>

          {/* 滑块 */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={efficiency}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="w-full h-4 rounded-full appearance-none cursor-pointer transition-all"
              style={{
                background: `linear-gradient(to right, ${efficiencyLevel.color} 0%, ${efficiencyLevel.color} ${efficiency}%, #FFE4E9 ${efficiency}%, #FFE4E9 100%)`,
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${efficiencyLevel.color};
                cursor: pointer;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                transition: transform 0.2s;
                border: 3px solid white;
              }
              input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
              }
              input[type="range"]::-webkit-slider-thumb:active {
                transform: scale(1.3);
              }
              input[type="range"]::-moz-range-thumb {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${efficiencyLevel.color};
                cursor: pointer;
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                transition: transform 0.2s;
              }
              input[type="range"]::-moz-range-thumb:hover {
                transform: scale(1.2);
              }
              input[type="range"]::-moz-range-thumb:active {
                transform: scale(1.3);
              }
            `}</style>
          </div>

          {/* 刻度标记 */}
          <div className="flex justify-between mt-2 text-xs font-medium" style={{ color: candyColors.coral }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 提示信息 */}
        {efficiency < 50 && (
          <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: candyColors.coral + '20', borderColor: candyColors.coral }}>
            <p className="text-sm font-medium flex items-center gap-2" style={{ color: candyColors.coral }}>
              <span className="text-xl">⚠️</span>
              效率低于50%会被记录为不良习惯哦，下次加油！
            </p>
          </div>
        )}

        {/* 情绪反思记录 */}
        <div className="mb-6 space-y-4">
          {/* 1. 我感受到了什么 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.pink }}>
              <span className="text-lg">💭</span>
              1. 我感受到了什么？
            </label>
            <textarea
              placeholder='请具体描述情绪名称，如"失望"、"焦虑"、"兴奋"，而非简单的"好"或"坏"'
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.pink + '60',
                color: '#333'
              }}
            />
          </div>

          {/* 2. 为什么有这样的感受 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.peach }}>
              <span className="text-lg">🤔</span>
              2. 为什么有这样的感受？
            </label>
            <textarea
              placeholder="描述引发这种感受的具体事件或原因..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.peach + '60',
                color: '#333'
              }}
            />
          </div>

          {/* 3. 身体感受 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.mint }}>
              <span className="text-lg">🫀</span>
              3. 身体感受：情绪在我身体上有什么表现？
            </label>
            <textarea
              placeholder="如心跳加快、肩膀紧绷、胃部不适..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.mint + '60',
                color: '#333'
              }}
            />
          </div>

          {/* 4. 自动想法 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.lavender }}>
              <span className="text-lg">💡</span>
              4. 自动想法：当时我脑海里闪过了什么念头？
            </label>
            <textarea
              placeholder="记录当时的想法和念头..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.lavender + '60',
                color: '#333'
              }}
            />
          </div>

          {/* 5. 实际行为 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.sky }}>
              <span className="text-lg">🏃</span>
              5. 实际行为：我实际上做了什么或想做什么？
            </label>
            <textarea
              placeholder="描述你的实际行为或冲动..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.sky + '60',
                color: '#333'
              }}
            />
          </div>

          {/* 6. 认知重评/反思 */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2" style={{ color: candyColors.coral }}>
              <span className="text-lg">🌟</span>
              6. 认知重评/反思：现在回过头我对这件事有没有不同的理解？我能更有效地应对吗？
            </label>
            <textarea
              placeholder="反思和重新评估这件事..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{ 
                backgroundColor: 'white',
                borderColor: candyColors.coral + '60',
                color: '#333'
              }}
            />
          </div>
        </div>
        </div>

        {/* 固定底部按钮 */}
        <div className="flex-shrink-0 p-6 pt-4 border-t-4" style={{ borderColor: candyColors.pink + '40' }}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-md"
              style={{ 
                backgroundColor: candyColors.lavender + '40',
                color: candyColors.lavender
              }}
            >
              <span className="text-lg">👋</span> 取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: candyColors.pink }}
            >
              <span className="text-lg">✨</span> 确认完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

