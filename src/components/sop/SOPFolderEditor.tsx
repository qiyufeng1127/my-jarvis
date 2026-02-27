import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSOPStore } from '@/stores/sopStore';

interface SOPFolderEditorProps {
  folderId: string | null;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['📁', '💼', '🎯', '📊', '🔧', '💡', '🎨', '📝', '🏃', '🎓', '💰', '🏠'];
const COLOR_OPTIONS = [
  '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE',
  '#5856D6', '#00C7BE', '#FF2D55', '#A2845E', '#8E8E93'
];

export default function SOPFolderEditor({ folderId, onClose }: SOPFolderEditorProps) {
  const { getFolderById, createFolder, updateFolder } = useSOPStore();
  
  const folder = folderId ? getFolderById(folderId) : null;
  
  const [name, setName] = useState(folder?.name || '');
  const [emoji, setEmoji] = useState(folder?.emoji || '📁');
  const [color, setColor] = useState(folder?.color || '#007AFF');
  
  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入文件夹名称');
      return;
    }
    
    if (folderId) {
      updateFolder(folderId, { name, emoji, color });
    } else {
      createFolder(name, emoji, color);
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {folderId ? '编辑文件夹' : '新建文件夹'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 表单 */}
        <div className="space-y-4">
          {/* 文件夹名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              文件夹名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：工作流程、学习计划"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          {/* Emoji 选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              图标
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    emoji === e
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          
          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              颜色
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-full h-10 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          {/* 预览 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">预览</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <span className="font-semibold" style={{ color }}>
                {name || '文件夹名称'}
              </span>
            </div>
          </div>
        </div>
        
        {/* 按钮 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {folderId ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

