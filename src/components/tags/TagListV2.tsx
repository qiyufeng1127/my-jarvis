import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Home, Briefcase } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagEditModal from './TagEditModal';
import TagAnalysisModalV2 from './TagAnalysisModalV2';

interface TagListV2Props {
  tags: TagData[];
  selectedTags: string[];
  onSelectTag: (tagName: string) => void;
  isDark?: boolean;
}

export default function TagListV2({ tags, selectedTags, onSelectTag, isDark = false }: TagListV2Props) {
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [analyzingTag, setAnalyzingTag] = useState<TagData | null>(null);
  const [contextMenuTag, setContextMenuTag] = useState<string | null>(null);
  
  const { deleteTag, updateTag, setTagType, getTagEfficiencyLevel, getTagEfficiencyEmoji } = useTagStore();
  const { tasks } = useTaskStore();
  
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  const handleDelete = (tagName: string) => {
    const relatedTasksCount = tasks.filter(task => 
      task.tags?.includes(tagName)
    ).length;
    
    if (relatedTasksCount > 0) {
      const confirmed = window.confirm(
        `该标签关联了 ${relatedTasksCount} 个任务，删除后将从这些任务中移除。是否继续？`
      );
      if (!confirmed) return;
    }
    
    deleteTag(tagName);
    setContextMenuTag(null);
  };
  
  const handleRename = (oldName: string, newName: string, emoji?: string, color?: string) => {
    const relatedTasksCount = tasks.filter(task => 
      task.tags?.includes(oldName)
    ).length;
    
    const confirmed = window.confirm(
      `修改后将同步至 ${relatedTasksCount} 个任务，是否继续？`
    );
    
    if (confirmed) {
      updateTag(oldName, newName, emoji, color);
      setEditingTag(null);
    }
  };
  
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🏷️</div>
        <p className="text-lg font-medium" style={{ color: textColor }}>
          还没有标签
        </p>
        <p className="text-sm mt-2" style={{ color: secondaryColor }}>
          在任务中添加标签后，这里会自动显示
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          const relatedTasksCount = tasks.filter(task => 
            task.tags?.includes(tag.name)
          ).length;
          
          const efficiencyLevel = getTagEfficiencyLevel(tag.name);
          const efficiencyEmoji = getTagEfficiencyEmoji(efficiencyLevel);
          
          // 效率等级颜色
          const efficiencyColor = {
            high: '#34C759',
            medium: '#007AFF',
            low: '#FFCC00',
            negative: '#FF3B30',
            life_essential: '#8E8E93',
            passive: '#FFD60A',
          }[efficiencyLevel];
          
          // 时薪显示
          const hourlyRateDisplay = tag.tagType === 'life_essential' 
            ? '🏠 0元/h（必需）'
            : tag.hourlyRate === Infinity
            ? '∞（🪙 被动收入）'
            : tag.hourlyRate < 0
            ? `❌ ${tag.hourlyRate.toFixed(0)}元/h（警示）`
            : `${efficiencyEmoji} ${tag.hourlyRate.toFixed(0)}元/h`;
          
          return (
            <div
              key={tag.name}
              className="relative rounded-2xl border transition-all cursor-pointer"
              style={{
                backgroundColor: isSelected ? `${tag.color}10` : cardBg,
                borderColor: isSelected ? tag.color : borderColor,
                borderWidth: isSelected ? '2px' : '1px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onClick={() => onSelectTag(tag.name)}
            >
              {/* 标签信息 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{tag.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base" style={{ color: textColor }}>
                          {tag.name}
                        </h3>
                        {tag.tagType === 'life_essential' && (
                          <span className="text-xs">🏠</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                        🔢 使用 <span style={{ color: '#FF3B30', fontWeight: 'bold' }}>{tag.usageCount}</span> 次
                      </p>
                    </div>
                  </div>
                  
                  {/* 操作菜单 */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenuTag(contextMenuTag === tag.name ? null : tag.name);
                      }}
                      className="p-1.5 rounded-full hover:bg-black hover:bg-opacity-5 transition-colors"
                    >
                      <MoreVertical size={16} style={{ color: secondaryColor }} />
                    </button>
                    
                    {contextMenuTag === tag.name && (
                      <div
                        className="absolute right-0 top-8 w-48 rounded-xl shadow-2xl border z-10 overflow-hidden"
                        style={{ 
                          backgroundColor: cardBg, 
                          borderColor,
                          backdropFilter: 'blur(20px)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingTag(tag);
                            setContextMenuTag(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                          style={{ color: textColor }}
                        >
                          <Edit2 size={14} />
                          ✏️ 重命名
                        </button>
                        
                        <button
                          onClick={() => {
                            setTagType(tag.name, 'life_essential');
                            setContextMenuTag(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                          style={{ color: textColor }}
                        >
                          <Home size={14} />
                          🏠 标记生活必需
                        </button>
                        
                        <button
                          onClick={() => {
                            setTagType(tag.name, 'business');
                            setContextMenuTag(null);
                          }}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                          style={{ color: textColor }}
                        >
                          <Briefcase size={14} />
                          💼 标记业务类
                        </button>
                        
                        <div className="h-px" style={{ backgroundColor: borderColor }} />
                        
                        <button
                          onClick={() => handleDelete(tag.name)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2 transition-colors"
                          style={{ color: '#FF3B30' }}
                        >
                          <Trash2 size={14} />
                          🗑️ 删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 统计信息 - iOS 卡片样式 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: secondaryColor }}>⏱️ 累计时长</span>
                    <span className="font-semibold" style={{ color: textColor }}>
                      {Math.floor(tag.totalDuration / 60)}h {tag.totalDuration % 60}m
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: secondaryColor }}>📊 关联任务</span>
                    <span className="font-semibold" style={{ color: textColor }}>
                      {relatedTasksCount} 个
                    </span>
                  </div>
                  
                  {/* 财务信息 */}
                  {(tag.totalIncome > 0 || tag.totalExpense > 0) && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: secondaryColor }}>🟢 收入</span>
                        <span className="font-semibold" style={{ color: '#34C759' }}>
                          +{tag.totalIncome.toFixed(0)}元
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: secondaryColor }}>🔴 支出</span>
                        <span className="font-semibold" style={{ color: '#FF3B30' }}>
                          -{tag.totalExpense.toFixed(0)}元
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: secondaryColor }}>💰 净收支</span>
                        <span 
                          className="font-semibold" 
                          style={{ 
                            color: tag.netIncome >= 0 ? '#34C759' : '#FF3B30' 
                          }}
                        >
                          {tag.netIncome >= 0 ? '+' : ''}{tag.netIncome.toFixed(0)}元
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* 效率信息 */}
                  <div 
                    className="flex items-center justify-between text-xs p-2 rounded-lg mt-2"
                    style={{ backgroundColor: `${efficiencyColor}15` }}
                  >
                    <span style={{ color: secondaryColor }}>单位时间收益</span>
                    <span 
                      className="font-bold" 
                      style={{ color: efficiencyColor }}
                    >
                      {hourlyRateDisplay}
                    </span>
                  </div>
                </div>
                
                {/* 点击查看分析 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnalyzingTag(tag);
                  }}
                  className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ 
                    backgroundColor: '#007AFF',
                    color: '#ffffff',
                  }}
                >
                  📊 查看详细分析
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 编辑弹窗 */}
      {editingTag && (
        <TagEditModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSave={(newName, emoji, color) => handleRename(editingTag.name, newName, emoji, color)}
          isDark={isDark}
        />
      )}
      
      {/* 分析弹窗 */}
      {analyzingTag && (
        <TagAnalysisModalV2
          tag={analyzingTag}
          onClose={() => setAnalyzingTag(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}

