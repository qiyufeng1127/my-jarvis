import { useState } from 'react';
import { Merge, Trash2, CheckSquare, Square } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';

interface TagBatchOperationsProps {
  tags: TagData[];
  selectedTags: string[];
  onSelectTag: (tagName: string) => void;
  onClearSelection: () => void;
  isDark?: boolean;
}

export default function TagBatchOperations({
  tags,
  selectedTags,
  onSelectTag,
  onClearSelection,
  isDark = false,
}: TagBatchOperationsProps) {
  const [mergeTargetName, setMergeTargetName] = useState('');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  
  const { mergeTags, deleteTag } = useTagStore();
  const { tasks, updateTask } = useTaskStore();
  
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  const handleSelectAll = () => {
    if (selectedTags.length === tags.length) {
      onClearSelection();
    } else {
      tags.forEach(tag => {
        if (!selectedTags.includes(tag.name)) {
          onSelectTag(tag.name);
        }
      });
    }
  };
  
  const handleBatchDelete = () => {
    if (selectedTags.length === 0) {
      alert('请先选择要删除的标签');
      return;
    }
    
    // 计算关联任务数量
    let totalRelatedTasks = 0;
    selectedTags.forEach(tagName => {
      const count = tasks.filter(task => task.tags?.includes(tagName)).length;
      totalRelatedTasks += count;
    });
    
    const confirmed = window.confirm(
      `确定要删除 ${selectedTags.length} 个标签吗？\n\n这将影响 ${totalRelatedTasks} 个任务，标签将从这些任务中移除。`
    );
    
    if (confirmed) {
      // 删除标签
      selectedTags.forEach(tagName => {
        deleteTag(tagName);
        
        // 从任务中移除标签
        tasks.forEach(task => {
          if (task.tags?.includes(tagName)) {
            updateTask(task.id, {
              tags: task.tags.filter(t => t !== tagName),
            });
          }
        });
      });
      
      onClearSelection();
      alert(`✅ 已删除 ${selectedTags.length} 个标签`);
    }
  };
  
  const handleMerge = () => {
    if (selectedTags.length < 2) {
      alert('请至少选择 2 个标签进行合并');
      return;
    }
    
    setShowMergeDialog(true);
  };
  
  const handleConfirmMerge = () => {
    if (!mergeTargetName.trim()) {
      alert('请输入合并后的标签名称');
      return;
    }
    
    // 计算关联任务数量
    let totalRelatedTasks = 0;
    selectedTags.forEach(tagName => {
      const count = tasks.filter(task => task.tags?.includes(tagName)).length;
      totalRelatedTasks += count;
    });
    
    const confirmed = window.confirm(
      `确定要将 ${selectedTags.length} 个标签合并为 "${mergeTargetName}" 吗？\n\n这将影响 ${totalRelatedTasks} 个任务。`
    );
    
    if (confirmed) {
      // 合并标签
      mergeTags(selectedTags, mergeTargetName);
      
      // 更新任务中的标签
      tasks.forEach(task => {
        if (task.tags?.some(t => selectedTags.includes(t))) {
          const newTags = task.tags.filter(t => !selectedTags.includes(t));
          if (!newTags.includes(mergeTargetName)) {
            newTags.push(mergeTargetName);
          }
          updateTask(task.id, { tags: newTags });
        }
      });
      
      onClearSelection();
      setShowMergeDialog(false);
      setMergeTargetName('');
      alert(`✅ 已合并为 "${mergeTargetName}"`);
    }
  };
  
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">🏷️</div>
        <p className="text-lg font-medium" style={{ color: textColor }}>
          还没有标签
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* 操作栏 */}
      <div 
        className="flex items-center justify-between p-4 rounded-xl mb-6"
        style={{ backgroundColor: cardBg }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
            style={{ backgroundColor: borderColor, color: textColor }}
          >
            {selectedTags.length === tags.length ? (
              <CheckSquare size={18} />
            ) : (
              <Square size={18} />
            )}
            {selectedTags.length === tags.length ? '取消全选' : '全选'}
          </button>
          
          {selectedTags.length > 0 && (
            <span className="text-sm" style={{ color: secondaryColor }}>
              已选择 {selectedTags.length} 个标签
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleMerge}
            disabled={selectedTags.length < 2}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#10B981', color: '#ffffff' }}
          >
            <Merge size={18} />
            合并标签
          </button>
          
          <button
            onClick={handleBatchDelete}
            disabled={selectedTags.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
          >
            <Trash2 size={18} />
            批量删除
          </button>
        </div>
      </div>
      
      {/* 标签列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          const relatedTasksCount = tasks.filter(task => 
            task.tags?.includes(tag.name)
          ).length;
          
          return (
            <div
              key={tag.name}
              className="p-4 rounded-xl border cursor-pointer transition-all"
              style={{
                backgroundColor: isSelected ? `${tag.color}20` : cardBg,
                borderColor: isSelected ? tag.color : borderColor,
                borderWidth: isSelected ? '2px' : '1px',
              }}
              onClick={() => onSelectTag(tag.name)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: isSelected ? tag.color : borderColor }}
                >
                  {isSelected && (
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                </div>
                
                <span className="text-xl">{tag.emoji}</span>
                <span className="font-semibold" style={{ color: textColor }}>
                  {tag.name}
                </span>
              </div>
              
              <div className="text-xs" style={{ color: secondaryColor }}>
                使用 {tag.usageCount} 次 · {relatedTasksCount} 个任务
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 合并对话框 */}
      {showMergeDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMergeDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
              合并标签
            </h3>
            
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: secondaryColor }}>
                将以下标签合并为：
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map(tagName => {
                  const tag = tags.find(t => t.name === tagName);
                  return tag ? (
                    <div
                      key={tagName}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: `${tag.color}40`, color: textColor }}
                    >
                      {tag.emoji} {tag.name}
                    </div>
                  ) : null;
                })}
              </div>
              
              <input
                type="text"
                value={mergeTargetName}
                onChange={(e) => setMergeTargetName(e.target.value)}
                placeholder="输入合并后的标签名称"
                className="w-full px-3 py-2 rounded-lg border outline-none"
                style={{ 
                  backgroundColor: cardBg, 
                  borderColor,
                  color: textColor,
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowMergeDialog(false)}
                className="flex-1 py-2 rounded-lg font-medium"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmMerge}
                className="flex-1 py-2 rounded-lg font-medium"
                style={{ backgroundColor: '#10B981', color: '#ffffff' }}
              >
                确认合并
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

