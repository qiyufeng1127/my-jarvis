import { useState } from 'react';
import { Edit2, Trash2, MoreVertical, Clock, TrendingUp } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagEditModal from './TagEditModal';
import TagAnalysisModal from './TagAnalysisModal';

interface TagListProps {
  tags: TagData[];
  selectedTags: string[];
  onSelectTag: (tagName: string) => void;
  isDark?: boolean;
}

export default function TagList({ tags, selectedTags, onSelectTag, isDark = false }: TagListProps) {
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [analyzingTag, setAnalyzingTag] = useState<TagData | null>(null);
  const [contextMenuTag, setContextMenuTag] = useState<string | null>(null);
  
  const { deleteTag, updateTag } = useTagStore();
  const { tasks } = useTaskStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  const handleDelete = (tagName: string) => {
    // 计算关联任务数量
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
  
  const handleRename = (oldName: string, newName: string) => {
    // 计算关联任务数量
    const relatedTasksCount = tasks.filter(task => 
      task.tags?.includes(oldName)
    ).length;
    
    const confirmed = window.confirm(
      `修改后将同步至 ${relatedTasksCount} 个任务，是否继续？`
    );
    
    if (confirmed) {
      updateTag(oldName, newName);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          const relatedTasksCount = tasks.filter(task => 
            task.tags?.includes(tag.name)
          ).length;
          
          return (
            <div
              key={tag.name}
              className="relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md"
              style={{
                backgroundColor: isSelected ? `${tag.color}20` : cardBg,
                borderColor: isSelected ? tag.color : borderColor,
                borderWidth: isSelected ? '2px' : '1px',
              }}
              onClick={() => onSelectTag(tag.name)}
            >
              {/* 标签信息 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tag.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: textColor }}>
                      {tag.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                      使用 <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{tag.usageCount}</span> 次
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
                    className="p-1 rounded hover:bg-black hover:bg-opacity-10"
                  >
                    <MoreVertical size={16} style={{ color: secondaryColor }} />
                  </button>
                  
                  {contextMenuTag === tag.name && (
                    <div
                      className="absolute right-0 top-8 w-40 rounded-lg shadow-xl border z-10"
                      style={{ backgroundColor: cardBg, borderColor }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingTag(tag);
                          setContextMenuTag(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2"
                        style={{ color: textColor }}
                      >
                        <Edit2 size={14} />
                        重命名
                      </button>
                      
                      <button
                        onClick={() => handleDelete(tag.name)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-black hover:bg-opacity-5 flex items-center gap-2"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-xs" style={{ color: secondaryColor }}>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{Math.round(tag.totalDuration / 60)}h {tag.totalDuration % 60}m</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  <span>{relatedTasksCount} 个任务</span>
                </div>
              </div>
              
              {/* 点击查看分析 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalyzingTag(tag);
                }}
                className="mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: tag.color, color: '#ffffff' }}
              >
                📊 查看时长分析
              </button>
            </div>
          );
        })}
      </div>
      
      {/* 编辑弹窗 */}
      {editingTag && (
        <TagEditModal
          tag={editingTag}
          onClose={() => setEditingTag(null)}
          onSave={(newName) => handleRename(editingTag.name, newName)}
          isDark={isDark}
        />
      )}
      
      {/* 分析弹窗 */}
      {analyzingTag && (
        <TagAnalysisModal
          tag={analyzingTag}
          onClose={() => setAnalyzingTag(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}

