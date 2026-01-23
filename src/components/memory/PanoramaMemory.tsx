import { useState } from 'react';
import { Calendar, Tag, Search, Filter, Heart, MessageCircle, CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import { useMemoryStore, EMOTION_TAGS, CATEGORY_TAGS } from '@/stores/memoryStore';

// 记录类型
const RECORD_TYPES = [
  { id: 'mood', label: '心情', icon: Heart, color: '#EC4899' },
  { id: 'thought', label: '碎碎念', icon: MessageCircle, color: '#8B5CF6' },
  { id: 'todo', label: '待办', icon: CheckSquare, color: '#3B82F6' },
  { id: 'success', label: '成功', icon: Sparkles, color: '#F59E0B' },
  { id: 'gratitude', label: '感恩', icon: Heart, color: '#10B981' },
];

interface PanoramaMemoryProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function PanoramaMemory({ isDark = false, bgColor = '#ffffff' }: PanoramaMemoryProps) {
  const { memories, getStats } = useMemoryStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 过滤记录
  const filteredRecords = memories.filter(record => {
    // 类型过滤
    if (filterType !== 'all' && record.type !== filterType) return false;
    
    // 情绪过滤
    if (filterEmotion !== 'all' && !record.emotionTags.includes(filterEmotion)) return false;
    
    // 分类过滤
    if (filterCategory !== 'all' && !record.categoryTags.includes(filterCategory)) return false;
    
    // 搜索过滤
    if (searchQuery && !record.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  // 统计数据
  const stats = {
    total: memories.length,
    mood: memories.filter(r => r.type === 'mood').length,
    thought: memories.filter(r => r.type === 'thought').length,
    todo: memories.filter(r => r.type === 'todo').length,
    success: memories.filter(r => r.type === 'success').length,
    gratitude: memories.filter(r => r.type === 'gratitude').length,
  };

  // 获取标签信息
  const getEmotionTag = (id: string) => EMOTION_TAGS.find(t => t.id === id);
  const getCategoryTag = (id: string) => CATEGORY_TAGS.find(t => t.id === id);
  const getRecordType = (id: string) => RECORD_TYPES.find(t => t.id === id);

  return (
    <div className="h-full overflow-auto p-4 space-y-4" style={{ backgroundColor: bgColor }}>
      {/* 头部统计 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center space-x-2" style={{ color: textColor }}>
            <Sparkles className="w-5 h-5" />
            <span>全景记忆</span>
          </h3>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{stats.total}</div>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {RECORD_TYPES.map((type) => {
            const Icon = type.icon;
            const count = stats[type.id as keyof typeof stats];
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(filterType === type.id ? 'all' : type.id)}
                className="flex flex-col items-center p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: filterType === type.id ? buttonBg : 'transparent',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                }}
              >
                <Icon className="w-4 h-4 mb-1" style={{ color: type.color }} />
                <div className="text-xs" style={{ color: textColor }}>{count}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: accentColor }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记录..."
              className="w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-lg transition-all flex items-center space-x-2"
            style={{ backgroundColor: showFilters ? buttonBg : cardBg, color: textColor }}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选</span>
          </button>
        </div>

        {/* 过滤器 */}
        {showFilters && (
          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: cardBg }}>
            {/* 情绪过滤 */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: textColor }}>情绪标签</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterEmotion('all')}
                  className="px-2 py-1 rounded-full text-xs transition-all"
                  style={{
                    backgroundColor: filterEmotion === 'all' ? buttonBg : 'transparent',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  全部
                </button>
                {EMOTION_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterEmotion(filterEmotion === tag.id ? 'all' : tag.id)}
                    className="px-2 py-1 rounded-full text-xs transition-all"
                    style={{
                      backgroundColor: filterEmotion === tag.id ? tag.color + '20' : 'transparent',
                      color: filterEmotion === tag.id ? tag.color : textColor,
                      border: `1px solid ${filterEmotion === tag.id ? tag.color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}`,
                    }}
                  >
                    {tag.emoji} {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 分类过滤 */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: textColor }}>事项分类</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCategory('all')}
                  className="px-2 py-1 rounded-full text-xs transition-all"
                  style={{
                    backgroundColor: filterCategory === 'all' ? buttonBg : 'transparent',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  全部
                </button>
                {CATEGORY_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterCategory(filterCategory === tag.id ? 'all' : tag.id)}
                    className="px-2 py-1 rounded-full text-xs transition-all"
                    style={{
                      backgroundColor: filterCategory === tag.id ? tag.color + '20' : 'transparent',
                      color: filterCategory === tag.id ? tag.color : textColor,
                      border: `1px solid ${filterCategory === tag.id ? tag.color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}`,
                    }}
                  >
                    {tag.emoji} {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 记录列表 */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <div className="text-lg font-semibold mb-2" style={{ color: textColor }}>
              {searchQuery || filterType !== 'all' || filterEmotion !== 'all' || filterCategory !== 'all'
                ? '没有找到匹配的记录'
                : '还没有记录'}
            </div>
            <div className="text-sm" style={{ color: accentColor }}>
              {searchQuery || filterType !== 'all' || filterEmotion !== 'all' || filterCategory !== 'all'
                ? '试试调整筛选条件'
                : '在AI助手中输入心情、碎碎念或待办事项'}
            </div>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const recordType = getRecordType(record.type);
            const Icon = recordType?.icon || MessageCircle;
            
            return (
              <div
                key={record.id}
                className="rounded-lg p-4 space-y-2"
                style={{ backgroundColor: cardBg }}
              >
                {/* 头部 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" style={{ color: recordType?.color }} />
                    <span className="text-xs font-semibold" style={{ color: recordType?.color }}>
                      {recordType?.label}
                    </span>
                    {record.aiGenerated && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        AI生成
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs" style={{ color: accentColor }}>
                    <Calendar className="w-3 h-3" />
                    <span>{record.date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* 内容 */}
                <div className="text-sm leading-relaxed" style={{ color: textColor }}>
                  {record.content}
                </div>

                {/* 标签 */}
                {(record.emotionTags.length > 0 || record.categoryTags.length > 0) && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {record.emotionTags.map((tagId) => {
                      const tag = getEmotionTag(tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.emoji} {tag.label}
                        </span>
                      ) : null;
                    })}
                    {record.categoryTags.map((tagId) => {
                      const tag = getCategoryTag(tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.emoji} {tag.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 底部提示 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm font-semibold mb-2" style={{ color: textColor }}>
          💡 使用提示
        </div>
        <ul className="space-y-1 text-xs" style={{ color: accentColor }}>
          <li>• 在AI助手中输入心情、想法或待办事项</li>
          <li>• AI会自动识别并打上情绪和分类标签</li>
          <li>• 使用搜索和筛选快速找到历史记录</li>
          <li>• 所有记录都会自动保存和同步</li>
        </ul>
      </div>
    </div>
  );
}

