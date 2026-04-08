import { useState } from 'react';
import { X } from 'lucide-react';

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
  forceMandatoryReflection?: boolean;
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
  forceMandatoryReflection = false,
}: TaskCompletionEfficiencyModalProps) {
  const [efficiency, setEfficiency] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [notes, setNotes] = useState(''); // 备注

  if (!isOpen) return null;

  // 降低饱和度后的沉稳配色
  const palette = {
    rose: '#8E5F6B',
    sage: '#6F8577',
    amber: '#A07D56',
    plum: '#7B6A8F',
    gold: '#B79B5B',
    brick: '#9B625A',
    ink: '#2F2A26',
    subtext: '#6B625B',
    line: '#D8D0C8',
    panel: '#F4F0EA',
    white: '#FFFFFF',
  };

  // 计算效率等级和颜色
  const getEfficiencyLevel = (eff: number): { label: string; emoji: string; color: string } => {
    if (eff >= 90) return { label: '超棒', emoji: '🌟', color: palette.gold };
    if (eff >= 70) return { label: '不错', emoji: '🎈', color: palette.sage };
    if (eff >= 50) return { label: '还行', emoji: '🍬', color: palette.amber };
    return { label: '加油', emoji: '🌈', color: palette.plum };
  };

  const efficiencyLevel = getEfficiencyLevel(efficiency);

  // 处理滑块拖动
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEfficiency(Number(e.target.value));
  };

  const handleConfirm = () => {
    const completionNotes = notes.trim();

    console.log('📝 [完成反思] 保存内容:', completionNotes);
    
    onConfirm(efficiency, completionNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: palette.panel }}
      >
        {/* 关闭按钮 - 固定在顶部 */}
        <button
          onClick={onClose}
          disabled={forceMandatoryReflection}
          className="absolute top-4 right-4 p-2 rounded-full transition-all z-10 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: palette.rose, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 可滚动内容区域 */}
        <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(85vh - 100px)' }}>

        {/* 金币奖励展示 */}
        {goldReward > 0 && (
          <div className="mb-6 p-6 rounded-3xl shadow-lg" style={{ backgroundColor: palette.gold }}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl animate-bounce">💰</span>
              <div className="text-center">
                <div className="text-4xl font-black drop-shadow-lg" style={{ color: palette.ink }}>
                  +{goldReward} 金币
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: palette.subtext }}>
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
          <h2 className="text-2xl font-bold mb-2" style={{ color: palette.ink }}>任务完成啦！</h2>
          <p className="text-sm font-medium" style={{ color: palette.subtext }}>
            {taskTitle}
          </p>
        </div>

        {forceMandatoryReflection && (
          <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: palette.brick + '16', borderColor: palette.brick }}>
            <p className="text-sm font-bold" style={{ color: palette.brick }}>
              该任务已触发强制追责流程。你必须完成当前填写，任务才可以被正式完成，且当前不能取消、不能退出、不能删除。
            </p>
          </div>
        )}

        {/* 图片统计 */}
        <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: palette.sage + '14', borderColor: palette.sage }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: palette.ink }}>
              📸 计划拍照
            </span>
            <span className="font-bold text-lg" style={{ color: palette.ink }}>{plannedImageCount} 次</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: palette.ink }}>
              ✅ 实际拍照
            </span>
            <span className="font-bold text-lg" style={{ color: palette.ink }}>{actualImageCount} 次</span>
          </div>
        </div>

        {/* 效率滑块 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg" style={{ color: palette.ink }}>🎯 完成效率</span>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 px-4 py-2 rounded-full shadow-md"
                style={{ backgroundColor: efficiencyLevel.color, color: palette.white }}
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
                background: `linear-gradient(to right, ${efficiencyLevel.color} 0%, ${efficiencyLevel.color} ${efficiency}%, ${palette.line} ${efficiency}%, ${palette.line} 100%)`,
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
                border: 3px solid ${palette.white};
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
                border: 3px solid ${palette.white};
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
          <div className="flex justify-between mt-2 text-xs font-medium" style={{ color: palette.subtext }}>
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 提示信息 */}
        {efficiency < 50 && (
          <div className="mb-6 p-4 rounded-2xl border-2" style={{ backgroundColor: palette.brick + '16', borderColor: palette.brick }}>
            <p className="text-sm font-medium flex items-center gap-2" style={{ color: palette.brick }}>
              <span className="text-xl">⚠️</span>
              效率低于50%会被记录为不良习惯哦，下次加油！
            </p>
          </div>
        )}

        {/* 备注 */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" style={{ color: palette.ink }}>
            备注（可选）
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="如果有需要，可以简单记一句..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all shadow-sm"
            style={{
              backgroundColor: palette.white,
              borderColor: palette.line,
              color: palette.ink
            }}
          />
        </div>
        </div>

        {/* 固定底部按钮 */}
        <div className="flex-shrink-0 p-6 pt-4 border-t-4" style={{ borderColor: palette.rose + '33' }}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={forceMandatoryReflection}
              className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ 
                backgroundColor: palette.plum + '22',
                color: palette.plum
              }}
            >
              <span className="text-lg">👋</span> 取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: palette.rose }}
            >
              <span className="text-lg">✨</span> 确认完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

