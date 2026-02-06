import { useState } from 'react';
import { X, Search, TrendingUp, Calendar, BarChart3, Settings, Merge, Trash2, Edit2 } from 'lucide-react';
import { useTagStore } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagList from './TagList';
import TagAnalysis from './TagAnalysis';
import TagBatchOperations from './TagBatchOperations';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export default function TagManager({ isOpen, onClose, isDark = false }: TagManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'batch'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { getAllTags, getActiveTagsSortedByUsage } = useTagStore();
  const { tasks } = useTaskStore();
  
  const allTags = getActiveTagsSortedByUsage();
  const filteredTags = searchQuery
    ? allTags.filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTags;
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  if (!isOpen) return null;
  
  // 计算统计数据
  const totalTags = allTags.length;
  const totalUsage = allTags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const totalDuration = allTags.reduce((sum, tag) => sum + tag.totalDuration, 0);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏷️</div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: textColor }}>
                标签管理
              </h2>
              <p className="text-sm" style={{ color: secondaryColor }}>
                {totalTags} 个标签 · {totalUsage} 次使用 · {Math.round(totalDuration / 60)} 小时
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-black transition-colors"
          >
            <X size={24} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 标签页切换 */}
        <div 
          className="flex items-center gap-2 px-6 py-3 border-b"
          style={{ borderColor }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'overview' ? cardBg : 'transparent',
              color: activeTab === 'overview' ? textColor : secondaryColor,
            }}
          >
            <TrendingUp size={16} className="inline mr-2" />
            标签总览
          </button>
          
          <button
            onClick={() => setActiveTab('analysis')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'analysis' ? cardBg : 'transparent',
              color: activeTab === 'analysis' ? textColor : secondaryColor,
            }}
          >
            <BarChart3 size={16} className="inline mr-2" />
            时长分析
          </button>
          
          <button
            onClick={() => setActiveTab('batch')}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'batch' ? cardBg : 'transparent',
              color: activeTab === 'batch' ? textColor : secondaryColor,
            }}
          >
            <Settings size={16} className="inline mr-2" />
            批量操作
          </button>
        </div>
        
        {/* 搜索栏 */}
        {activeTab === 'overview' && (
          <div className="px-6 py-3 border-b" style={{ borderColor }}>
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: cardBg }}
            >
              <Search size={18} style={{ color: secondaryColor }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标签..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: textColor }}
              />
            </div>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <TagList
              tags={filteredTags}
              selectedTags={selectedTags}
              onSelectTag={(tagName) => {
                setSelectedTags(prev =>
                  prev.includes(tagName)
                    ? prev.filter(t => t !== tagName)
                    : [...prev, tagName]
                );
              }}
              isDark={isDark}
            />
          )}
          
          {activeTab === 'analysis' && (
            <TagAnalysis
              tags={allTags}
              isDark={isDark}
            />
          )}
          
          {activeTab === 'batch' && (
            <TagBatchOperations
              tags={allTags}
              selectedTags={selectedTags}
              onSelectTag={(tagName) => {
                setSelectedTags(prev =>
                  prev.includes(tagName)
                    ? prev.filter(t => t !== tagName)
                    : [...prev, tagName]
                );
              }}
              onClearSelection={() => setSelectedTags([])}
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </div>
  );
}

