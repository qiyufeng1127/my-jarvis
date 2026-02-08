import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Home, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import { useTagStore, type TagData } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagEditModal from './TagEditModal';
import TagAnalysisModalV2 from './TagAnalysisModalV2';

interface TagRankingListProps {
  tags: TagData[];
  isDark?: boolean;
}

type RankingType = 'duration' | 'usage' | 'tasks' | 'income' | 'expense' | 'netIncome' | 'hourlyRate' | 'efficiency';

export default function TagRankingList({ tags, isDark = false }: TagRankingListProps) {
  const [rankingType, setRankingType] = useState<RankingType>('duration');
  const [displayCount, setDisplayCount] = useState<number>(10); // 默认显示10个
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [analyzingTag, setAnalyzingTag] = useState<TagData | null>(null);
  const [contextMenuTag, setContextMenuTag] = useState<string | null>(null);
  
  const { deleteTag, updateTag, setTagType, getTagEfficiencyLevel, getTagEfficiencyEmoji } = useTagStore();
  const { tasks } = useTaskStore();
  
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  // 排序标签
  const sortedTags = [...tags].sort((a, b) => {
    switch (rankingType) {
      case 'duration':
        return b.totalDuration - a.totalDuration;
      case 'usage':
        return b.usageCount - a.usageCount;
      case 'tasks':
        const aTaskCount = tasks.filter(task => task.tags?.includes(a.name)).length;
        const bTaskCount = tasks.filter(task => task.tags?.includes(b.name)).length;
        return bTaskCount - aTaskCount;
      case 'income':
        return b.totalIncome - a.totalIncome;
      case 'expense':
        return b.totalExpense - a.totalExpense;
      case 'netIncome':
        return b.netIncome - a.netIncome;
      case 'hourlyRate':
        return b.hourlyRate - a.hourlyRate;
      case 'efficiency':
        // 按效率等级排序：high > medium > low > negative > life_essential > passive
        const efficiencyOrder: Record<string, number> = {
          'high': 6,
          'passive': 5,
          'medium': 4,
          'low': 3,
          'negative': 2,
          'life_essential': 1,
        };
        const aLevel = getTagEfficiencyLevel(a.name);
        const bLevel = getTagEfficiencyLevel(b.name);
        return (efficiencyOrder[bLevel] || 0) - (efficiencyOrder[aLevel] || 0);
      default:
        return 0;
    }
  });
  
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
  
  const handleRename = (oldName: string, newName: string) => {
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
  
  // 获取排名指标的显示值
  const getRankingValue = (tag: TagData) => {
    switch (rankingType) {
      case 'duration':
        const hours = Math.floor(tag.totalDuration / 60);
        const minutes = tag.totalDuration % 60;
        return `${hours}h ${minutes}m`;
      case 'usage':
        return `${tag.usageCount} 次`;
      case 'tasks':
        const taskCount = tasks.filter(task => task.tags?.includes(tag.name)).length;
        return `${taskCount} 个`;
      case 'income':
        return `+${tag.totalIncome.toFixed(0)}元`;
      case 'expense':
        return `-${tag.totalExpense.toFixed(0)}元`;
      case 'netIncome':
        return `${tag.netIncome >= 0 ? '+' : ''}${tag.netIncome.toFixed(0)}元`;
      case 'hourlyRate':
        if (tag.tagType === 'life_essential') return '生活必需';
        if (tag.hourlyRate === Infinity) return '被动收入';
        return `${tag.hourlyRate.toFixed(0)}元/h`;
      case 'efficiency':
        const level = getTagEfficiencyLevel(tag.name);
        const levelText: Record<string, string> = {
          'high': '高效',
          'medium': '中效',
          'low': '低效',
          'negative': '负效',
          'life_essential': '生活必需',
          'passive': '被动收入',
        };
        return levelText[level] || '未知';
      default:
        return '';
    }
  };
  
  // 获取排名指标的颜色 - 使用新配色
  const getRankingColor = (tag: TagData) => {
    switch (rankingType) {
      case 'income':
        return '#6D9978';
      case 'expense':
        return '#AC0327';
      case 'netIncome':
        return tag.netIncome >= 0 ? '#6D9978' : '#AC0327';
      case 'hourlyRate':
        if (tag.hourlyRate < 0) return '#AC0327';
        if (tag.hourlyRate > 50) return '#6D9978';
        return '#E8C259';
      case 'efficiency':
        const level = getTagEfficiencyLevel(tag.name);
        const levelColors: Record<string, string> = {
          'high': '#6D9978',
          'passive': '#E8C259',
          'medium': '#DD617C',
          'low': '#D1CBBA',
          'negative': '#AC0327',
          'life_essential': '#8E8E93',
        };
        return levelColors[level] || tag.color || '#DD617C';
      default:
        return tag.color || '#DD617C';
    }
  };
  
  // 排序按钮配置 - 使用新配色
  const rankingButtons = [
    { id: 'duration', label: '累计时长', emoji: '⏱️', color: '#6D9978' },
    { id: 'usage', label: '使用次数', emoji: '🔢', color: '#E8C259' },
    { id: 'tasks', label: '关联任务', emoji: '📋', color: '#DD617C' },
    { id: 'income', label: '收入', emoji: '💰', color: '#E8C259' },
    { id: 'expense', label: '支出', emoji: '💸', color: '#AC0327' },
    { id: 'netIncome', label: '净收支', emoji: '📊', color: '#6D9978' },
    { id: 'hourlyRate', label: '时薪', emoji: '⏰', color: '#DD617C' },
    { id: 'efficiency', label: '效率等级', emoji: '⚡', color: '#D1CBBA' },
  ];
  
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
    <div className="p-4">
      {/* 排序选择按钮 - 紧凑设计 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {rankingButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRankingType(btn.id as RankingType)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: rankingType === btn.id ? btn.color : cardBg,
                  color: rankingType === btn.id ? '#ffffff' : textColor,
                }}
              >
                <span className="text-sm">{btn.emoji}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
          
          {/* 显示数量选择器 */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs whitespace-nowrap" style={{ color: secondaryColor }}>显示</span>
            <select
              value={displayCount}
              onChange={(e) => setDisplayCount(Number(e.target.value))}
              className="px-2 py-1 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                borderColor: borderColor,
              }}
            >
              <option value={5}>前5个</option>
              <option value={10}>前10个</option>
              <option value={20}>前20个</option>
              <option value={50}>前50个</option>
              <option value={tags.length}>全部</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 排行榜列表 - 紧凑单行设计 */}
      <div className="space-y-1">
        {sortedTags.slice(0, displayCount).map((tag, index) => {
          return (
            <div
              key={tag.name}
              className="relative rounded-lg transition-all hover:bg-opacity-80 cursor-pointer"
              style={{
                backgroundColor: cardBg,
                padding: '8px 12px',
              }}
              onClick={() => setAnalyzingTag(tag)}
            >
              <div className="flex items-center gap-3">
                {/* 排名 */}
                <div 
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: index < 3 ? getRankingColor(tag) : 'transparent',
                    color: index < 3 ? '#ffffff' : secondaryColor,
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Emoji */}
                <span className="text-xl flex-shrink-0">{tag.emoji}</span>
                
                {/* 标签名称 */}
                <span className="font-medium text-sm truncate flex-1" style={{ color: textColor }}>
                  {tag.name}
                </span>
                
                {/* 排名指标值 */}
                <span 
                  className="text-sm font-semibold flex-shrink-0"
                  style={{ color: getRankingColor(tag) }}
                >
                  {getRankingValue(tag)}
                </span>
                
                {/* 操作菜单 */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuTag(contextMenuTag === tag.name ? null : tag.name);
                    }}
                    className="p-1 rounded-full hover:bg-black hover:bg-opacity-5 transition-colors"
                  >
                    <MoreVertical size={14} style={{ color: secondaryColor }} />
                  </button>
                  
                  {contextMenuTag === tag.name && (
                    <div
                      className="absolute right-0 top-8 w-40 rounded-xl shadow-2xl border z-10 overflow-hidden"
                      style={{ 
                        backgroundColor: '#ffffff', 
                        borderColor,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setAnalyzingTag(tag);
                          setContextMenuTag(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        style={{ color: textColor }}
                      >
                        📊 查看详情
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingTag(tag);
                          setContextMenuTag(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        style={{ color: textColor }}
                      >
                        ✏️ 重命名
                      </button>
                      
                      <div className="h-px bg-gray-200" />
                      
                      <button
                        onClick={() => handleDelete(tag.name)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        style={{ color: '#AC0327' }}
                      >
                        🗑️删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 显示统计信息 */}
      {sortedTags.length > displayCount && (
        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: secondaryColor }}>
            显示 {displayCount} / {sortedTags.length} 个标签，还有 {sortedTags.length - displayCount} 个未显示
          </p>
          <button
            onClick={() => setDisplayCount(sortedTags.length)}
            className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: cardBg,
              color: textColor,
            }}
          >
            显示全部
          </button>
        </div>
      )}
      
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
        <TagAnalysisModalV2
          tag={analyzingTag}
          onClose={() => setAnalyzingTag(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}

