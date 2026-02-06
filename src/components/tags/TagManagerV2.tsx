import { useState } from 'react';
import { X, TrendingUp, DollarSign, Zap, Filter } from 'lucide-react';
import { useTagStore } from '@/stores/tagStore';
import { useTaskStore } from '@/stores/taskStore';
import TagListV2 from './TagListV2';
import TagFinanceAnalysis from './TagFinanceAnalysis';
import TagEfficiencyAnalysis from './TagEfficiencyAnalysis';

interface TagManagerV2Props {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

type SortType = 'usage' | 'income' | 'expense' | 'netIncome' | 'hourlyRate' | 'negativeTime';

export default function TagManagerV2({ isOpen, onClose, isDark = false }: TagManagerV2Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'efficiency'>('overview');
  const [sortType, setSortType] = useState<SortType>('usage');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { 
    getAllTags, 
    getActiveTagsSortedByUsage,
    sortTagsByIncome,
    sortTagsByExpense,
    sortTagsByNetIncome,
    sortTagsByHourlyRate,
    sortTagsByNegativeTime,
  } = useTagStore();
  const { tasks } = useTaskStore();
  
  // 根据排序类型获取标签
  const getSortedTags = () => {
    switch (sortType) {
      case 'usage':
        return getActiveTagsSortedByUsage();
      case 'income':
        return sortTagsByIncome(true);
      case 'expense':
        return sortTagsByExpense(true);
      case 'netIncome':
        return sortTagsByNetIncome(true);
      case 'hourlyRate':
        return sortTagsByHourlyRate(true);
      case 'negativeTime':
        return sortTagsByNegativeTime(true);
      default:
        return getActiveTagsSortedByUsage();
    }
  };
  
  const allTags = getSortedTags();
  
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  if (!isOpen) return null;
  
  // 计算统计数据
  const totalTags = allTags.length;
  const totalUsage = allTags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const totalDuration = allTags.reduce((sum, tag) => sum + tag.totalDuration, 0);
  const totalIncome = allTags.reduce((sum, tag) => sum + tag.totalIncome, 0);
  const totalExpense = allTags.reduce((sum, tag) => sum + tag.totalExpense, 0);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - iOS 风格 */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏷️</div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: textColor }}>
                标签管理
              </h2>
              <p className="text-xs mt-0.5" style={{ color: secondaryColor }}>
                {totalTags} 个标签 · 🔢 {totalUsage} 次使用 · ⏱️ {Math.round(totalDuration / 60)}h
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black hover:bg-opacity-5 transition-colors"
          >
            <X size={24} style={{ color: textColor }} />
          </button>
        </div>
        
        {/* 标签页切换 - iOS 磨砂质感 */}
        <div 
          className="flex items-center gap-2 px-6 py-3 border-b"
          style={{ 
            borderColor,
            backgroundColor: cardBg,
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'overview' ? '#007AFF' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : textColor,
            }}
          >
            <TrendingUp size={16} />
            <span>⏱️ 时长分析</span>
          </button>
          
          <button
            onClick={() => setActiveTab('finance')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'finance' ? '#007AFF' : 'transparent',
              color: activeTab === 'finance' ? '#ffffff' : textColor,
            }}
          >
            <DollarSign size={16} />
            <span>💰 财务分析</span>
          </button>
          
          <button
            onClick={() => setActiveTab('efficiency')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all"
            style={{
              backgroundColor: activeTab === 'efficiency' ? '#007AFF' : 'transparent',
              color: activeTab === 'efficiency' ? '#ffffff' : textColor,
            }}
          >
            <Zap size={16} />
            <span>📊 效率分析</span>
          </button>
        </div>
        
        {/* 排序栏 - iOS 简洁设计 */}
        <div 
          className="flex items-center gap-2 px-6 py-3 border-b overflow-x-auto"
          style={{ borderColor }}
        >
          <Filter size={16} style={{ color: secondaryColor }} />
          <span className="text-xs font-medium mr-2" style={{ color: secondaryColor }}>
            排序：
          </span>
          
          {[
            { id: 'usage', label: '🔢 使用次数', emoji: '🔢' },
            { id: 'income', label: '🟢 收入', emoji: '🟢' },
            { id: 'expense', label: '🔴 支出', emoji: '🔴' },
            { id: 'netIncome', label: '📊 净收支', emoji: '📊' },
            { id: 'hourlyRate', label: '💰 时薪', emoji: '💰' },
            { id: 'negativeTime', label: '❌ 负效时长', emoji: '❌' },
          ].map((sort) => (
            <button
              key={sort.id}
              onClick={() => setSortType(sort.id as SortType)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: sortType === sort.id ? '#007AFF' : cardBg,
                color: sortType === sort.id ? '#ffffff' : textColor,
              }}
            >
              {sort.label}
            </button>
          ))}
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <TagListV2
              tags={allTags}
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
          
          {activeTab === 'finance' && (
            <TagFinanceAnalysis
              tags={allTags}
              isDark={isDark}
            />
          )}
          
          {activeTab === 'efficiency' && (
            <TagEfficiencyAnalysis
              tags={allTags}
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </div>
  );
}

