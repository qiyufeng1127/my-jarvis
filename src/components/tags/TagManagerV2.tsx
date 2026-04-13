import { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, ChevronDown, ChevronRight, Edit2, Trash2, Plus, FolderPlus, Wand2 } from 'lucide-react';
import { useTagStore } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagRankingList from './TagRankingList';
import { resolveTagInput } from '@/utils/tagInputResolver';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 注册 Chart.js 组件
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

interface TagManagerV2Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type SortType = 'usage' | 'income' | 'expense' | 'netIncome' | 'hourlyRate' | 'negativeTime';
type TimeRange = 'today' | 'week' | 'overall';

// 未分类标签项组件
function UncategorizedTagItem({ 
  tag, 
  bgColor, 
  cardBg, 
  borderColor, 
  textColor, 
  secondaryColor,
  isDark,
  isEditing,
  editValue,
  onEdit,
  onDelete,
  onUpdateEmoji,
  onEditChange,
  onEditConfirm,
  onEditCancel,
}: { 
  tag: any;
  bgColor: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  secondaryColor: string;
  isDark: boolean;
  isEditing: boolean;
  editValue: string;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateEmoji: (emoji: string) => void;
  onEditChange: (value: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [candidateEmojis, setCandidateEmojis] = useState<string[]>([]);
  
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
      style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
    >
      {/* 标签信息 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Emoji - 可点击更换 */}
        <div className="relative">
          <button
            onClick={async () => {
              if (!showEmojiPicker) {
                const { EmojiMatcher } = await import('@/services/emojiMatcher');
                const emojis = EmojiMatcher.getCandidateEmojis(tag.name);
                setCandidateEmojis(emojis);
              }
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="text-2xl flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
            title="点击更换 emoji"
          >
            {tag.emoji || '🏷️'}
          </button>
          
          {/* Emoji 选择器 */}
          {showEmojiPicker && (
            <div 
              className="absolute left-0 top-10 z-50 p-2 rounded-lg shadow-xl border grid grid-cols-4 gap-1"
              style={{ backgroundColor: bgColor, borderColor: borderColor }}
              onClick={(e) => e.stopPropagation()}
            >
              {candidateEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onUpdateEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl p-2 rounded hover:bg-gray-100 active:scale-95 transition-all"
                  style={{ backgroundColor: tag.emoji === emoji ? cardBg : 'transparent' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {isEditing ? (
          // 编辑模式
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEditConfirm();
              } else if (e.key === 'Escape') {
                onEditCancel();
              }
            }}
            onBlur={onEditConfirm}
            className="flex-1 px-3 py-1 rounded-lg border border-blue-500 focus:outline-none"
            style={{ backgroundColor: bgColor, color: textColor }}
            autoFocus
          />
        ) : (
          // 显示模式
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate" style={{ color: textColor }}>
                {tag.name}
              </span>
              {tag.isDisabled && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cardBg, color: secondaryColor }}>
                  已禁用
                </span>
              )}
              {tag.emojiLocked && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cardBg, color: secondaryColor }}>
                  emoji已锁定
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5" style={{ color: secondaryColor }}>
              使用 {tag.usageCount} 次 · {Math.round(tag.totalDuration / 60)}h
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!isEditing && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg active:opacity-80 transition-opacity"
            style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE', color: '#2563EB' }}
            title="重命名标签"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg active:opacity-80 transition-opacity"
            style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', color: '#DC2626' }}
            title="删除标签"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function TagManagerV2({ isOpen, onClose, isDark = false }: TagManagerV2Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderEmoji, setNewFolderEmoji] = useState('📁');
  const [newFolderColor, setNewFolderColor] = useState('#52A5CE');
  const [isSmartCategorizing, setIsSmartCategorizing] = useState(false);
  const [editingFolderColor, setEditingFolderColor] = useState<string | null>(null);
  const [tempFolderColor, setTempFolderColor] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { 
    getAllTags, 
    getActiveTagsSortedByUsage,
    getTagDuration,
    getAllFolders,
    getTagsByFolder,
    initializeDefaultFolders,
    updateTag,
    deleteTag,
    addTag,
    createFolder,
    addTagToFolder,
    updateFolder,
  } = useTagStore();
  const { tasks, updateTask } = useTaskStore();
  
  // 初始化默认文件夹
  useEffect(() => {
    initializeDefaultFolders();
  }, [initializeDefaultFolders]);
  
  const allTags = getActiveTagsSortedByUsage();
  const allTagsIncludingDisabled = getAllTags();
  const folders = getAllFolders();
  
  // 处理标签重命名
  const handleRenameTag = (oldName: string) => {
    if (!newTagName.trim() || newTagName === oldName) {
      setEditingTag(null);
      setNewTagName('');
      return;
    }
    
    // 更新标签store
    updateTag(oldName, newTagName.trim());
    
    // 更新所有使用该标签的任务
    tasks.forEach(task => {
      if (task.tags && task.tags.includes(oldName)) {
        const newTags = task.tags.map(tag => tag === oldName ? newTagName.trim() : tag);
        updateTask(task.id, { tags: newTags });
      }
    });
    
    setEditingTag(null);
    setNewTagName('');
  };
  
  // 处理删除标签
  const handleDeleteTag = (tagName: string) => {
    if (confirm(`确定要删除标签"${tagName}"吗？这将从所有任务中移除该标签。`)) {
      deleteTag(tagName);
      
      tasks.forEach(task => {
        if (task.tags && task.tags.includes(tagName)) {
          const newTags = task.tags.filter(tag => tag !== tagName);
          updateTask(task.id, { tags: newTags });
        }
      });
    }
  };
  
  // 处理添加新标签 - 走统一相似匹配与创建逻辑
  const handleAddTag = async () => {
    const resolved = await resolveTagInput(
      newTagInput,
      allTagsIncludingDisabled.map(tag => tag.name)
    );

    if (!resolved.tagName) {
      return;
    }

    if (!allTagsIncludingDisabled.find(t => t.name === resolved.tagName)) {
      addTag(resolved.tagName);
    }

    setNewTagInput('');
    setShowAddTag(false);
  };
  
  // 开始编辑文件夹颜色
  const handleStartEditFolderColor = (folderId: string, currentColor: string) => {
    setEditingFolderColor(folderId);
    setTempFolderColor(currentColor);
  };
  
  // 确认修改文件夹颜色
  const handleConfirmFolderColor = (folderId: string) => {
    if (tempFolderColor) {
      updateFolder(folderId, { color: tempFolderColor });
    }
    setEditingFolderColor(null);
    setTempFolderColor('');
  };
  
  // 取消修改文件夹颜色
  const handleCancelFolderColor = () => {
    setEditingFolderColor(null);
    setTempFolderColor('');
  };
  
  // 切换文件夹展开/收起
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };
  
  // 创建新文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      alert('请输入文件夹名称');
      return;
    }
    
    createFolder(newFolderName.trim(), newFolderEmoji, newFolderColor);
    setNewFolderName('');
    setNewFolderEmoji('📁');
    setNewFolderColor('#52A5CE');
    setShowCreateFolder(false);
  };
  
  // AI智能分类未分类标签
  const handleSmartCategorize = async () => {
    const uncategorizedTags = allTagsIncludingDisabled.filter(tag => !tag.folderId);
    
    if (uncategorizedTags.length === 0) {
      alert('没有未分类的标签');
      return;
    }
    
    setIsSmartCategorizing(true);
    
    try {
      // 准备文件夹信息
      const folderList = folders.map(f => `- ${f.name} (${f.emoji}): ${f.tagNames.slice(0, 3).join('、')}等`).join('\n');
      
      // 准备未分类标签列表
      const tagList = uncategorizedTags.map(t => t.name).join('、');
      
      // 调用AI进行分类
      const prompt = `你是一个智能标签分类助手。请帮我将以下标签分类到合适的文件夹中。

现有文件夹：
${folderList}

待分类标签：
${tagList}

请分析每个标签的含义，将它们归类到最合适的文件夹中。如果某个标签不适合任何现有文件夹，可以标记为"未分类"。

请以JSON格式返回结果，格式如下：
{
  "标签名称": "文件夹名称",
  ...
}

只返回JSON，不要有其他说明文字。`;

      const { aiService } = await import('@/services/aiService');
      const response = await aiService.chat([
        {
          role: 'user',
          content: prompt,
        },
      ]);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'AI调用失败');
      }
      
      // 解析AI返回的JSON
      let categorization: Record<string, string>;
      try {
        // 提取JSON（可能被markdown代码块包裹）
        let jsonStr = response.content.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        categorization = JSON.parse(jsonStr);
      } catch (e) {
        console.error('解析AI返回的JSON失败:', e);
        throw new Error('AI返回格式错误，请重试');
      }
      
      // 根据AI的分类结果，将标签添加到对应文件夹
      let successCount = 0;
      for (const [tagName, folderName] of Object.entries(categorization)) {
        if (folderName === '未分类') continue;
        
        // 查找对应的文件夹
        const targetFolder = folders.find(f => f.name === folderName);
        if (targetFolder) {
          addTagToFolder(tagName, targetFolder.id);
          successCount++;
        }
      }
      
      alert(`AI智能分类完成！成功分类 ${successCount} 个标签。`);
    } catch (error) {
      console.error('AI智能分类失败:', error);
      alert(`AI智能分类失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSmartCategorizing(false);
    }
  };
  
  // 同步任务数据到标签
  const handleSyncTasksToTags = async () => {
    if (!confirm('确定要从时间轴任务重新计算所有标签统计数据吗？\n\n这将清空现有统计数据，从已完成的任务重新计算。')) {
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const { tagSyncService } = await import('@/services/tagSyncService');
      tagSyncService.recalculateAllTagStats();
      alert('✅ 同步完成！标签统计数据已更新。');
    } catch (error) {
      console.error('同步失败:', error);
      alert(`❌ 同步失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1D1D1F';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  // 计算日期范围
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'overall':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // 计算每个标签在时间范围内的时长
  const tagDurations = useMemo(() => {
    return allTags.map(tag => ({
      ...tag,
      duration: getTagDuration(tag.name, startDate, endDate),
    })).filter(tag => tag.duration > 0);
  }, [allTags, startDate, endDate, getTagDuration]);

  // 模拟数据 - 用于预览设计（使用新配色）
  const mockTags = [
    { 
      name: '赚钱', 
      emoji: '💰', 
      duration: 180, 
      color: '#E8C259',
      usageCount: 15,
      totalDuration: 180,
      totalIncome: 500,
      totalExpense: 50,
      netIncome: 450,
      hourlyRate: 150,
      invalidDuration: 10,
      tagType: 'business' as const,
    },
    { 
      name: '生活', 
      emoji: '🏠', 
      duration: 240, 
      color: '#DD617C',
      usageCount: 20,
      totalDuration: 240,
      totalIncome: 0,
      totalExpense: 200,
      netIncome: -200,
      hourlyRate: -50,
      invalidDuration: 0,
      tagType: 'life_essential' as const,
    },
    { 
      name: '家务', 
      emoji: '🧹', 
      duration: 90, 
      color: '#6D9978',
      usageCount: 8,
      totalDuration: 90,
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      hourlyRate: 0,
      invalidDuration: 0,
      tagType: 'life_essential' as const,
    },
    { 
      name: '健康', 
      emoji: '💪', 
      duration: 120, 
      color: '#D1CBBA',
      usageCount: 12,
      totalDuration: 120,
      totalIncome: 0,
      totalExpense: 100,
      netIncome: -100,
      hourlyRate: -50,
      invalidDuration: 5,
      tagType: 'business' as const,
    },
    { 
      name: '学习', 
      emoji: '📚', 
      duration: 150, 
      color: '#AC0327',
      usageCount: 18,
      totalDuration: 150,
      totalIncome: 0,
      totalExpense: 80,
      netIncome: -80,
      hourlyRate: -32,
      invalidDuration: 20,
      tagType: 'business' as const,
    },
    { 
      name: '娱乐', 
      emoji: '🎮', 
      duration: 60, 
      color: '#E8C259',
      usageCount: 5,
      totalDuration: 60,
      totalIncome: 0,
      totalExpense: 50,
      netIncome: -50,
      hourlyRate: -50,
      invalidDuration: 30,
      tagType: 'business' as const,
    },
    { 
      name: '社交', 
      emoji: '👥', 
      duration: 75, 
      color: '#DD617C',
      usageCount: 6,
      totalDuration: 75,
      totalIncome: 200,
      totalExpense: 150,
      netIncome: 50,
      hourlyRate: 40,
      invalidDuration: 0,
      tagType: 'business' as const,
    },
    { 
      name: '运动', 
      emoji: '🏃', 
      duration: 45, 
      color: '#6D9978',
      usageCount: 4,
      totalDuration: 45,
      totalIncome: 0,
      totalExpense: 30,
      netIncome: -30,
      hourlyRate: -40,
      invalidDuration: 0,
      tagType: 'business' as const,
    },
  ];
  
  // 如果没有真实数据，使用模拟数据
  const displayTags = allTags.length > 0 ? allTags : mockTags;
  const topTags = tagDurations.length > 0 ? tagDurations.slice(0, 8) : mockTags;
  const totalDuration = topTags.reduce((sum, tag) => sum + tag.duration, 0);

  // 计算每日习惯分数
  const habitScore = useMemo(() => {
    if (totalDuration === 0) return 0;
    const baseScore = Math.min(100, (totalDuration / 480) * 100);
    return Math.round(baseScore);
  }, [totalDuration]);

  // 圆环图数据
  const doughnutData = {
    labels: topTags.map(tag => tag.name),
    datasets: [
      {
        data: topTags.map(tag => tag.duration),
        backgroundColor: topTags.map(tag => tag.color || '#E6D5B8'),
        borderWidth: 0,
        spacing: 6, // 增加圆环段之间的间隙
        borderRadius: 12, // 添加圆角
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '50%', // 更粗的圆环
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1D1D1F',
        bodyColor: '#1D1D1F',
        borderColor: '#E5E5E5',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const hours = Math.floor(value / 60);
            const minutes = value % 60;
            const percentage = totalDuration > 0 ? ((value / totalDuration) * 100).toFixed(1) : '0';
            return `${label}: ${hours}h ${minutes}m (${percentage}%)`;
          }
        }
      },
    },
  };
  
  if (!isOpen) return null;
  
  // 计算统计数据
  const totalTags = allTags.length;
  const totalUsage = allTags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const totalTagDuration = allTags.reduce((sum, tag) => sum + tag.totalDuration, 0);
  
  // 新配色方案 - 基于用户提供的色卡
  const tabColors = {
    overview: '#6D9978', // 绿色
    finance: '#E8C259', // 黄色
    efficiency: '#DD617C', // 粉色
  };
  
  const sortColors = {
    usage: '#6D9978', // 绿色
    income: '#E8C259', // 黄色
    expense: '#DD617C', // 粉色
    netIncome: '#AC0327', // 深红色
    hourlyRate: '#D1CBBA', // 米色
    negativeTime: '#AC0327', // 深红色
  };
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[2147483647] flex flex-col">
        <div
          className="w-full h-full flex flex-col"
          style={{ backgroundColor: bgColor }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-start justify-between gap-3 px-6 py-6 pt-14 border-b shrink-0"
            style={{ borderColor }}
          >
            <div>
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>
                标签管理
              </h2>
              <p className="text-sm mt-1" style={{ color: secondaryColor }}>
                {totalTags} 个标签 · {totalUsage} 次使用 · {Math.round(totalTagDuration / 60)} 小时
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (allTagsIncludingDisabled.length === 0) {
                    alert('当前没有标签可以分配 emoji');
                    return;
                  }

                  try {
                    const { EmojiMatcher } = await import('@/services/emojiMatcher');
                    let updatedCount = 0;
                    let skippedLockedCount = 0;

                    allTagsIncludingDisabled.forEach(tag => {
                      if (tag.emojiLocked) {
                        skippedLockedCount++;
                        return;
                      }

                      const matchedEmoji = EmojiMatcher.matchEmoji(tag.name);
                      if (matchedEmoji && matchedEmoji !== tag.emoji) {
                        updateTag(tag.name, tag.name, matchedEmoji, undefined, { lockEmoji: false });
                        updatedCount++;
                      }
                    });

                    alert(`智能修改emoji完成！成功更新 ${updatedCount} 个标签，跳过 ${skippedLockedCount} 个手动锁定标签。`);
                  } catch (error) {
                    console.error('智能修改emoji失败:', error);
                    alert('智能修改emoji失败，请重试');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all shadow-md"
                style={{ backgroundColor: '#6D9978', color: '#ffffff' }}
                title="AI智能修改emoji"
              >
                <Sparkles size={20} />
                <span>智能修改emoji</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-3 rounded-full active:bg-gray-200 transition-colors touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X size={28} style={{ color: textColor }} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 px-6 py-6 space-y-6">
            <div className="flex items-center justify-center gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Weekly' },
                { id: 'overall', label: 'Overall' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id as TimeRange)}
                  className="px-6 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: timeRange === range.id ? '#DD617C' : '#F5F5F7',
                    color: timeRange === range.id ? '#ffffff' : '#8E8E93',
                  }}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {topTags.length > 0 && (
              <div className="max-w-xs mx-auto">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="text-center mt-4" style={{ color: textColor }}>
                  今日习惯分数：{habitScore}
                </div>
              </div>
            )}

            <TagRankingList
              tags={displayTags}
              isDark={isDark}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleSyncTasksToTags}
                disabled={isSyncing}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-md"
                style={{ backgroundColor: '#52A5CE', opacity: isSyncing ? 0.5 : 1 }}
                title="同步时间轴数据"
              >
                <span className="text-2xl">{isSyncing ? '⏳' : '🔄'}</span>
              </button>

              <button
                onClick={handleSmartCategorize}
                disabled={isSmartCategorizing}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-md"
                style={{ backgroundColor: '#DD617C' }}
                title="AI智能分类"
              >
                <span className="text-2xl">🪄</span>
              </button>

              <button
                onClick={() => setShowCreateFolder(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-md"
                style={{ backgroundColor: '#E8C259' }}
                title="新建文件夹"
              >
                <span className="text-2xl">📁</span>
              </button>

              <button
                onClick={() => setShowAddTag(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-md"
                style={{ backgroundColor: '#6D9978' }}
                title="添加标签"
              >
                <span className="text-2xl">➕</span>
              </button>
            </div>

            {showAddTag && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void handleAddTag();
                      } else if (e.key === 'Escape') {
                        setShowAddTag(false);
                        setNewTagInput('');
                      }
                    }}
                    placeholder="输入标签名称（例如：照相馆工作）"
                    className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:border-blue-500"
                    style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
                    autoFocus
                  />
                  <button
                    onClick={() => void handleAddTag()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold active:scale-95 transition-transform"
                  >
                    确定
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTagInput('');
                    }}
                    className="px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                    style={{ backgroundColor: cardBg, color: textColor }}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {showCreateFolder && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(221, 97, 124, 0.1)' : '#FFF1F2' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: textColor }}>创建新文件夹</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="文件夹名称"
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                    style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFolderEmoji}
                      onChange={(e) => setNewFolderEmoji(e.target.value)}
                      className="w-20 px-4 py-2 rounded-lg border text-center text-2xl focus:outline-none"
                      style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={newFolderColor}
                      onChange={(e) => setNewFolderColor(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: bgColor, color: textColor, borderColor: borderColor }}
                      placeholder="#52A5CE"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                      style={{ backgroundColor: '#DD617C', color: '#fff' }}
                    >
                      创建文件夹
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                        setNewFolderEmoji('📁');
                        setNewFolderColor('#52A5CE');
                      }}
                      className="px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                      style={{ backgroundColor: cardBg, color: textColor }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {folders.map((folder) => {
                const folderTags = getTagsByFolder(folder.id);
                const isExpanded = expandedFolders.has(folder.id);

                return (
                  <div key={folder.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="w-full flex items-center gap-3 p-4 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: `${folder.color}15` }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} style={{ color: secondaryColor }} className="flex-shrink-0" />
                      ) : (
                        <ChevronRight size={20} style={{ color: secondaryColor }} className="flex-shrink-0" />
                      )}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: folder.color }}>
                        {folder.emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold" style={{ color: textColor }}>{folder.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: secondaryColor }}>{folderTags.length} 个标签</div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: bgColor }}>
                        {folderTags.length > 0 ? folderTags.map((tag) => (
                          <div key={tag.name} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ backgroundColor: cardBg }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl">{tag.emoji || '🏷️'}</span>
                              <span className="text-sm font-medium truncate" style={{ color: textColor }}>{tag.name}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteTag(tag.name)}
                              className="p-2 rounded-lg active:opacity-80 transition-opacity"
                              style={{ backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', color: '#DC2626' }}
                              title="删除标签"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )) : (
                          <div className="p-6 text-center text-sm" style={{ color: secondaryColor }}>
                            该文件夹暂无标签
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allTagsIncludingDisabled.filter(tag => !tag.folderId).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold" style={{ color: textColor }}>未分类标签</h3>
                  <button
                    onClick={handleSmartCategorize}
                    disabled={isSmartCategorizing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium active:scale-95 transition-all"
                    style={{ backgroundColor: '#DD617C', color: '#fff', opacity: isSmartCategorizing ? 0.5 : 1 }}
                    title="AI智能分配到文件夹"
                  >
                    <Wand2 size={16} />
                    <span>{isSmartCategorizing ? '分配中...' : '智能分配到文件夹'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {allTagsIncludingDisabled
                    .filter(tag => !tag.folderId)
                    .map((tag) => (
                      <UncategorizedTagItem
                        key={tag.name}
                        tag={tag}
                        bgColor={bgColor}
                        cardBg={cardBg}
                        borderColor={borderColor}
                        textColor={textColor}
                        secondaryColor={secondaryColor}
                        isDark={isDark}
                        isEditing={editingTag === tag.name}
                        editValue={newTagName}
                        onEdit={() => {
                          setEditingTag(tag.name);
                          setNewTagName(tag.name);
                        }}
                        onDelete={() => handleDeleteTag(tag.name)}
                        onUpdateEmoji={(emoji) => updateTag(tag.name, tag.name, emoji, undefined, { lockEmoji: true })}
                        onEditChange={(value) => setNewTagName(value)}
                        onEditConfirm={() => handleRenameTag(tag.name)}
                        onEditCancel={() => {
                          setEditingTag(null);
                          setNewTagName('');
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: isDark ? 'rgba(124, 58, 237, 0.08)' : '#F5F3FF' }}>
              <p className="text-sm" style={{ color: isDark ? '#E9D5FF' : '#7C3AED' }}>
                🎨 <strong>文件夹颜色：</strong>文件夹的颜色会自动应用到该文件夹下所有标签的任务卡片背景色。
              </p>
              <p className="text-sm mt-2" style={{ color: isDark ? '#E9D5FF' : '#7C3AED' }}>
                💡 <strong>提示：</strong>重命名标签后，所有使用该标签的任务都会自动更新。AI在分配标签时会优先使用这里的标签。
              </p>
              <p className="text-sm mt-2" style={{ color: isDark ? '#E9D5FF' : '#7C3AED' }}>
                🔄 <strong>数据同步：</strong>点击“同步时间轴数据”按钮，可以从已完成的任务重新计算所有标签的使用次数、时长、收入、支出和时薪。
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
