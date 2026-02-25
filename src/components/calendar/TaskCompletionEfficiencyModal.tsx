import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TaskCompletionEfficiencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (efficiency: number) => void;
  taskTitle: string;
  plannedImageCount: number;
  actualImageCount: number;
  isDark: boolean;
  accentColor: string;
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
}: TaskCompletionEfficiencyModalProps) {
  const [efficiency, setEfficiency] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // 计算效率等级和颜色
  const getEfficiencyLevel = (eff: number): { label: string; color: string; icon: JSX.Element } => {
    if (eff >= 90) return { label: '优秀', color: '#10b981', icon: <TrendingUp className="w-5 h-5" /> };
    if (eff >= 70) return { label: '良好', color: '#3b82f6', icon: <TrendingUp className="w-5 h-5" /> };
    if (eff >= 50) return { label: '一般', color: '#f59e0b', icon: <Minus className="w-5 h-5" /> };
    return { label: '较差', color: '#ef4444', icon: <TrendingDown className="w-5 h-5" /> };
  };

  const efficiencyLevel = getEfficiencyLevel(efficiency);

  // 处理滑块拖动
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEfficiency(Number(e.target.value));
  };

  const handleConfirm = () => {
    onConfirm(efficiency);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } p-6 animate-in fade-in zoom-in duration-200`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">任务完成效率</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {taskTitle}
          </p>
        </div>

        {/* 图片统计 */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>计划拍照次数</span>
            <span className="font-semibold">{plannedImageCount} 次</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>实际拍照次数</span>
            <span className="font-semibold">{actualImageCount} 次</span>
          </div>
        </div>

        {/* 效率滑块 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">完成效率</span>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1 px-3 py-1 rounded-full"
                style={{ backgroundColor: `${efficiencyLevel.color}20`, color: efficiencyLevel.color }}
              >
                {efficiencyLevel.icon}
                <span className="font-bold">{efficiency}%</span>
              </div>
              <span
                className="text-sm font-medium px-2 py-1 rounded"
                style={{ backgroundColor: `${efficiencyLevel.color}20`, color: efficiencyLevel.color }}
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
              className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all"
              style={{
                background: `linear-gradient(to right, ${efficiencyLevel.color} 0%, ${efficiencyLevel.color} ${efficiency}%, ${isDark ? '#374151' : '#e5e7eb'} ${efficiency}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`,
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${efficiencyLevel.color};
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                transition: transform 0.2s;
              }
              input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
              }
              input[type="range"]::-webkit-slider-thumb:active {
                transform: scale(1.3);
              }
              input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${efficiencyLevel.color};
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 提示信息 */}
        {efficiency < 50 && (
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              ⚠️ 效率低于50%将被记录为不良习惯，请注意改进！
            </p>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:scale-105"
            style={{ backgroundColor: accentColor }}
          >
            确认完成
          </button>
        </div>
      </div>
    </div>
  );
}

