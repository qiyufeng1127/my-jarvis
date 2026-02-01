import { useState } from 'react';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { X, DollarSign } from 'lucide-react';

interface SideHustleFormProps {
  isDark?: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['💼', '💰', '📱', '🎨', '📸', '✍️', '🎬', '🎵', '🏋️', '🍳', '🚗', '🏠', '💻', '📚', '🎯', '🌟'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function SideHustleForm({ isDark = false, onClose }: SideHustleFormProps) {
  const { createSideHustle } = useSideHustleStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💼');
  const [color, setColor] = useState('#3b82f6');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('请输入副业名称');
      return;
    }

    try {
      await createSideHustle({
        name: name.trim(),
        icon,
        color,
        startDate: new Date(startDate),
        status: 'active',
      });
      onClose();
    } catch (error) {
      console.error('创建副业失败:', error);
      alert('创建失败，请重试');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <DollarSign size={24} style={{ color }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: textColor }}>
              新增副业
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: secondaryColor }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 副业名称 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              副业名称 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：ins穿搭账号"
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: 'none',
                outline: 'none',
              }}
              required
              autoFocus
            />
          </div>

          {/* 选择图标 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              选择图标
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className="text-2xl p-2 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: icon === emoji ? `${color}20` : cardBg,
                    border: icon === emoji ? `2px solid ${color}` : 'none',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 选择颜色 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              选择颜色
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-10 h-10 rounded-lg transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    border: color === c ? '3px solid white' : 'none',
                    boxShadow: color === c ? '0 0 0 2px black' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 开始日期 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* 预览 */}
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: `${color}10`, border: `2px solid ${color}20` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}20` }}
              >
                {icon}
              </div>
              <div>
                <div className="font-bold" style={{ color: textColor }}>
                  {name || '副业名称'}
                </div>
                <div className="text-sm" style={{ color: secondaryColor }}>
                  预览效果
                </div>
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: cardBg,
                color: textColor,
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: color,
                color: '#ffffff',
              }}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

