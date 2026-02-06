import { useState } from 'react';
import { X } from 'lucide-react';

interface TagEditModalProps {
  tag: { name: string; emoji: string; color: string };
  onClose: () => void;
  onSave: (newName: string, emoji?: string, color?: string) => void;
  isDark?: boolean;
}

export default function TagEditModal({ tag, onClose, onSave, isDark = false }: TagEditModalProps) {
  const [newName, setNewName] = useState(tag.name);
  const [emoji, setEmoji] = useState(tag.emoji);
  const [color, setColor] = useState(tag.color);
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  const handleSave = () => {
    if (!newName.trim()) {
      alert('标签名称不能为空');
      return;
    }
    
    onSave(newName.trim(), emoji, color);
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: textColor }}>
            编辑标签
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black hover:bg-opacity-10"
          >
            <X size={20} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 表单 */}
        <div className="space-y-4">
          {/* 标签名称 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              标签名称
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border outline-none"
              style={{ 
                backgroundColor: cardBg, 
                borderColor,
                color: textColor,
              }}
              placeholder="输入标签名称"
            />
          </div>
          
          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              Emoji 图标
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border outline-none text-2xl"
              style={{ 
                backgroundColor: cardBg, 
                borderColor,
                color: textColor,
              }}
              placeholder="🏷️"
              maxLength={2}
            />
          </div>
          
          {/* 颜色 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              标签颜色
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border outline-none"
                style={{ 
                  backgroundColor: cardBg, 
                  borderColor,
                  color: textColor,
                }}
                placeholder="#6A7334"
              />
            </div>
          </div>
          
          {/* 预览 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              预览
            </label>
            <div
              className="px-4 py-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: `${color}20`, borderColor: color, borderWidth: '2px' }}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="font-semibold" style={{ color: textColor }}>
                {newName || '标签名称'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 按钮 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg font-medium transition-all"
            style={{ backgroundColor: cardBg, color: textColor }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg font-medium transition-all"
            style={{ backgroundColor: '#10B981', color: '#ffffff' }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

