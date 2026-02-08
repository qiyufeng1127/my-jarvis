import { useState, useMemo, useEffect } from 'react';
import { X, Edit2, Trash2, Plus, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useTagStore } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 注册 Chart.js 组件
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TagStatisticsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimeRange = 'today' | 'week' | 'overall';

export default function TagStatisticsView({ isOpen, onClose }: TagStatisticsViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const { 
    getActiveTagsSortedByUsage, 
    getTagDuration, 
    getAllTags, 
    updateTag, 
    deleteTag, 
    addTag,
    getAllFolders,
    getTagsByFolder,
    initializeDefaultFolders,
    getTagColor,
  } = useTagStore();
  const { tasks, updateTask } = useTaskStore();
  
  // 初始化默认文件夹
  useEffect(() => {
    initializeDefaultFolders();
  }, [initializeDefaultFolders]);
  
  // 获取所有文件夹
  const folders = getAllFolders();

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
        startDate = new Date(0); // 从最早开始
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();

  // 获取标签数据
  const allTags = getActiveTagsSortedByUsage();
  const allTagsIncludingDisabled = getAllTags(); // 包括禁用的标签
  
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
      // 删除标签store中的标签
      deleteTag(tagName);
      
      // 从所有任务中移除该标签
      tasks.forEach(task => {
        if (task.tags && task.tags.includes(tagName)) {
          const newTags = task.tags.filter(tag => tag !== tagName);
          updateTask(task.id, { tags: newTags });
        }
      });
    }
  };
  
  // 处理添加新标签
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    
    addTag(newTagInput.trim());
    setNewTagInput('');
    setShowAddTag(false);
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
  
  // 计算每个标签在时间范围内的时长
  const tagDurations = useMemo(() => {
    return allTags.map(tag => ({
      ...tag,
      duration: getTagDuration(tag.name, startDate, endDate),
    })).filter(tag => tag.duration > 0);
  }, [allTags, startDate, endDate, getTagDuration]);

  // 取前8个标签用于显示
  const topTags = tagDurations.slice(0, 8);
  const totalDuration = topTags.reduce((sum, tag) => sum + tag.duration, 0);

  // 计算每日习惯分数（模拟）
  const habitScore = useMemo(() => {
    if (totalDuration === 0) return 0;
    // 基于时长和标签数量计算分数
    const baseScore = Math.min(100, (totalDuration / 480) * 100); // 8小时为满分
    return Math.round(baseScore);
  }, [totalDuration]);

  // 圆环图数据 - 参考图二的配色
  const doughnutData = {
    labels: topTags.map(tag => tag.name),
    datasets: [
      {
        data: topTags.map(tag => tag.duration),
        backgroundColor: [
          '#FFE5B4', // 浅黄色
          '#FFB6C1', // 粉色
          '#E6E6FA', // 淡紫色
          '#B4E7CE', // 薄荷绿
          '#FFD700', // 金黄色
          '#DDA0DD', // 梅红色
          '#98D8C8', // 青绿色
          '#F7DC6F', // 柠檬黄
        ],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
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
            const percentage = ((value / totalDuration) * 100).toFixed(1);
            return `${label}: ${hours}h ${minutes}m (${percentage}%)`;
          }
        }
      },
    },
  };

  // 柱状图数据 - Summary
  const barData = {
    labels: topTags.map(tag => tag.emoji || '📊'),
    datasets: [
      {
        data: topTags.map(tag => tag.duration / 60), // 转换为小时
        backgroundColor: [
          '#E6E6FA', // 淡紫色
          '#B4E7CE', // 薄荷绿
          '#FFD700', // 金黄色
          '#FFB6C1', // 粉色
          '#DDA0DD', // 梅红色
          '#98D8C8', // 青绿色
          '#F7DC6F', // 柠檬黄
          '#FFE5B4', // 浅黄色
        ],
        borderRadius: 8,
        barThickness: 24,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            const index = context[0].dataIndex;
            return topTags[index]?.name || '';
          },
          label: function(context: any) {
            const value = context.parsed.y;
            const hours = Math.floor(value);
            const minutes = Math.round((value - hours) * 60);
            return `${hours}h ${minutes}m`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F5F5F5',
          drawBorder: false,
        },
        ticks: {
          color: '#8E8E93',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value + 'h';
          }
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#1D1D1F',
          font: {
            size: 20,
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 rounded-full active:bg-gray-100 transition-colors"
        >
          <X size={24} className="text-gray-900" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Statistics</h1>
        <div className="w-10" /> {/* 占位 */}
      </div>

      {/* 时间范围选择 */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
        {[
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'Weekly' },
          { id: 'overall', label: 'Overall' },
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id as TimeRange)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              timeRange === range.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* 圆环图区域 */}
        <div className="px-6 py-8">
          <div className="relative w-full max-w-xs mx-auto">
            {/* 圆环图 */}
            <div className="relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              
              {/* 中心分数显示 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-gray-900">{habitScore}</div>
                <div className="text-xs text-gray-500 mt-1">Your daily habits score</div>
                <div className="text-xs text-gray-400 mt-1">compared 😊</div>
              </div>
            </div>

            {/* 图标环绕 - 模拟图二的设计 */}
            <div className="absolute inset-0 pointer-events-none">
              {topTags.map((tag, index) => {
                const angle = (index / topTags.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 140; // 调整半径
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <div
                    key={tag.name}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl border-2 border-gray-100">
                      {tag.emoji || '📊'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add habit 按钮 */}
          <div className="flex justify-center gap-3 mt-8">
            <button className="px-6 py-3 bg-black text-white rounded-full font-semibold text-sm shadow-lg active:scale-95 transition-transform">
              Add habit
            </button>
            <button className="p-3 bg-gray-100 rounded-full active:scale-95 transition-transform">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* 对比信息 */}
          <div className="mt-6 px-4 py-3 bg-pink-50 rounded-2xl">
            <p className="text-sm text-center text-pink-900">
              Your habits score dropped <span className="font-bold">12%</span> compared to yesterday.
            </p>
          </div>
        </div>

        {/* Summary 柱状图区域 */}
        <div className="px-6 pb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Summary:</h2>
          
          {/* 柱状图 */}
          <div className="bg-gray-50 rounded-3xl p-6" style={{ height: '280px' }}>
            <Bar data={barData} options={barOptions} />
          </div>

          {/* 标签图例 */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {topTags.map((tag, index) => {
              const hours = Math.floor(tag.duration / 60);
              const minutes = tag.duration % 60;
              const percentage = ((tag.duration / totalDuration) * 100).toFixed(1);
              
              return (
                <div
                  key={tag.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: doughnutData.datasets[0].backgroundColor[index],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{tag.emoji || '📊'}</span>
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {tag.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {hours}h {minutes}m · {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 标签管理区域 */}
        <div className="px-6 pb-8 border-t-8 border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">标签管理</h2>
            <button
              onClick={() => setShowAddTag(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-semibold active:scale-95 transition-transform"
            >
              <Plus size={16} />
              添加标签
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            管理所有标签（手动创建、AI生成、已修改）。AI会优先使用这里的标签。
          </p>

          {/* 添加新标签输入框 */}
          {showAddTag && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setShowAddTag(false);
                      setNewTagInput('');
                    }
                  }}
                  placeholder="输入标签名称（例如：照相馆工作）"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold active:scale-95 transition-transform"
                >
                  确定
                </button>
                <button
                  onClick={() => {
                    setShowAddTag(false);
                    setNewTagInput('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold active:scale-95 transition-transform"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 文件夹列表 */}
          <div className="space-y-3">
            {folders.map((folder) => {
              const isExpanded = expandedFolders.has(folder.id);
              const folderTags = getTagsByFolder(folder.id);
              
              return (
                <div key={folder.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* 文件夹头部 */}
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: `${folder.color}15` }}
                  >
                    {/* 展开/收起图标 */}
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-600 flex-shrink-0" />
                    )}
                    
                    {/* 文件夹图标和颜色指示器 */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    >
                      {folder.emoji}
                    </div>
                    
                    {/* 文件夹信息 */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{folder.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {folderTags.length} 个标签
                      </div>
                    </div>
                    
                    {/* 颜色标签 */}
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: folder.color,
                        color: '#fff',
                      }}
                    >
                      {folder.color}
                    </div>
                  </button>

                  {/* 文件夹内的标签列表 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white">
                      {folderTags.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {folderTags.map((tag) => (
                            <div
                              key={tag.name}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              {/* 标签信息 */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xl flex-shrink-0">{tag.emoji || '🏷️'}</span>
                                
                                {editingTag === tag.name ? (
                                  // 编辑模式
                                  <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameTag(tag.name);
                                      } else if (e.key === 'Escape') {
                                        setEditingTag(null);
                                        setNewTagName('');
                                      }
                                    }}
                                    onBlur={() => handleRenameTag(tag.name)}
                                    className="flex-1 px-3 py-1 rounded-lg border border-blue-500 focus:outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  // 显示模式
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-900 truncate">
                                        {tag.name}
                                      </span>
                                      {tag.isDisabled && (
                                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                          已禁用
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      使用 {tag.usageCount} 次 · {Math.round(tag.totalDuration / 60)}h
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 操作按钮 */}
                              {editingTag !== tag.name && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingTag(tag.name);
                                      setNewTagName(tag.name);
                                    }}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 active:bg-blue-100 transition-colors"
                                    title="重命名标签"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTag(tag.name)}
                                    className="p-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                                    title="删除标签"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          该文件夹暂无标签
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 未分类标签 */}
          {allTagsIncludingDisabled.filter(tag => !tag.folderId).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">未分类标签</h3>
              <div className="space-y-2">
                {allTagsIncludingDisabled
                  .filter(tag => !tag.folderId)
                  .map((tag) => (
                    <div
                      key={tag.name}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      {/* 标签信息 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{tag.emoji || '🏷️'}</span>
                        
                        {editingTag === tag.name ? (
                          // 编辑模式
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameTag(tag.name);
                              } else if (e.key === 'Escape') {
                                setEditingTag(null);
                                setNewTagName('');
                              }
                            }}
                            onBlur={() => handleRenameTag(tag.name)}
                            className="flex-1 px-3 py-1 rounded-lg border border-blue-500 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          // 显示模式
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {tag.name}
                              </span>
                              {tag.isDisabled && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                  已禁用
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              使用 {tag.usageCount} 次 · {Math.round(tag.totalDuration / 60)}h
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      {editingTag !== tag.name && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingTag(tag.name);
                              setNewTagName(tag.name);
                            }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 active:bg-blue-100 transition-colors"
                            title="重命名标签"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.name)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 active:bg-red-100 transition-colors"
                            title="删除标签"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <p className="text-sm text-purple-900">
              🎨 <strong>文件夹颜色：</strong>文件夹的颜色会自动应用到该文件夹下所有标签的任务卡片背景色。
            </p>
            <p className="text-sm text-purple-900 mt-2">
              💡 <strong>提示：</strong>重命名标签后，所有使用该标签的任务都会自动更新。AI在分配标签时会优先使用这里的标签。
            </p>
          </div>
        </div>
      </div>

      {/* 底部导航栏占位 */}
      <div className="h-20 bg-white border-t border-gray-200 flex items-center justify-around px-6">
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <div className="w-6 h-6 bg-gray-200 rounded-lg" />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <div className="w-6 h-6 bg-gray-200 rounded-lg" />
          <span className="text-xs">Calendar</span>
        </button>
        <button className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
          <span className="text-2xl text-white">+</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-900">
          <div className="w-6 h-6 bg-gray-900 rounded-lg" />
          <span className="text-xs font-semibold">Statistics</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <div className="w-6 h-6 bg-gray-200 rounded-lg" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}


