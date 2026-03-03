import { useState } from 'react';
import { Calendar, Heart, Sparkles, TrendingUp, Award, Plus, Edit, Trash2 } from 'lucide-react';
import { useMemoryStore } from '@/stores/memoryStore';

interface JournalModuleProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function JournalModule({ isDark = false, bgColor = '#ffffff' }: JournalModuleProps) {
  const { journals, addJournal, deleteJournal, getStats } = useMemoryStore();
  const [activeTab, setActiveTab] = useState<'success' | 'gratitude'>('success');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 计算统计数据
  const stats = getStats();
  const successCount = journals.filter(e => e.type === 'success').length;
  const gratitudeCount = journals.filter(e => e.type === 'gratitude').length;
  const streak = 7; // 连续天数 - 可以后续实现

  // 添加日记
  const handleAddEntry = () => {
    if (!newEntry.trim()) return;

    addJournal({
      type: activeTab,
      content: newEntry,
      tags: [],
      rewards: {
        gold: activeTab === 'success' ? 50 : 30,
        growth: activeTab === 'success' ? 10 : 5,
      }
    });

    setNewEntry('');
    setShowAddEntry(false);

    // 显示奖励提示
    const rewards = activeTab === 'success' ? { gold: 50, growth: 10 } : { gold: 30, growth: 5 };
    alert(`✨ 记录成功！\n获得 ${rewards.gold} 金币 + ${rewards.growth} 成长值`);
  };

  // 删除日记
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteJournal(id);
    }
  };

  const filteredEntries = journals.filter(e => e.type === activeTab);

  return (
    <div className="h-full overflow-auto p-4 space-y-4" style={{ backgroundColor: bgColor }}>
      {/* 头部统计 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xs" style={{ color: accentColor }}>连续天数</div>
          <div className="text-xl font-bold" style={{ color: textColor }}>{streak}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs" style={{ color: accentColor }}>累计金币</div>
          <div className="text-xl font-bold" style={{ color: textColor }}>{stats.totalRewards.gold}</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-xs" style={{ color: accentColor }}>累计成长</div>
          <div className="text-xl font-bold" style={{ color: textColor }}>{stats.totalRewards.growth}</div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('success')}
          className="flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          style={{
            backgroundColor: activeTab === 'success' ? buttonBg : 'transparent',
            color: textColor,
            border: `2px solid ${activeTab === 'success' ? 'transparent' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}`,
          }}
        >
          <Award className="w-5 h-5" />
          <span>成功日记 ({successCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('gratitude')}
          className="flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          style={{
            backgroundColor: activeTab === 'gratitude' ? buttonBg : 'transparent',
            color: textColor,
            border: `2px solid ${activeTab === 'gratitude' ? 'transparent' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}`,
          }}
        >
          <Heart className="w-5 h-5" />
          <span>感恩日记 ({gratitudeCount})</span>
        </button>
      </div>

      {/* 添加按钮 */}
      {!showAddEntry && (
        <button
          onClick={() => setShowAddEntry(true)}
          className="w-full py-4 rounded-lg font-semibold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          <Plus className="w-5 h-5" />
          <span>记录今天的{activeTab === 'success' ? '成功' : '感恩'}</span>
        </button>
      )}

      {/* 添加表单 */}
      {showAddEntry && (
        <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: cardBg }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: textColor }}>
              {activeTab === 'success' ? '✨ 今天的成功' : '💖 今天的感恩'}
            </h3>
            <button
              onClick={() => setShowAddEntry(false)}
              className="text-sm px-3 py-1 rounded"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              取消
            </button>
          </div>

          {/* 1. 我感受到了什么 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              1. 我感受到了什么？
            </label>
            <textarea
              placeholder="请具体描述情绪名称，如「失望」、「焦虑」、「兴奋」，而非简单的「好」或「坏」"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                placeholderColor: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
              }}
            />
          </div>

          {/* 2. 为什么有这样的感受 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              2. 为什么有这样的感受？
            </label>
            <textarea
              placeholder="描述引发这种感受的具体事件或原因..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
              }}
            />
          </div>

          {/* 3. 身体感受 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              3. 身体感受：情绪在我身体上有什么表现？
            </label>
            <textarea
              placeholder="如心跳加快、肩膀紧绷、胃部不适..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
              }}
            />
          </div>

          {/* 4. 自动想法 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              4. 自动想法：当时我脑海里闪过了什么念头？
            </label>
            <textarea
              placeholder="记录当时的想法和念头..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
              }}
            />
          </div>

          {/* 5. 实际行为 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              5. 实际行为：我实际上做了什么或想做什么？
            </label>
            <textarea
              placeholder="描述你的实际行为或冲动..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
              }}
            />
          </div>

          {/* 6. 认知重评/反思 */}
          <div className="space-y-2">
            <label className="text-sm font-medium block" style={{ color: textColor }}>
              6. 认知重评/反思：现在回过头我对这件事有没有不同的理解？我能更有效地应对吗？
            </label>
            <textarea
              placeholder="反思和重新评估这件事..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'white',
                color: textColor,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
              }}
            />
          </div>

          <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
            <div className="text-xs mb-2" style={{ color: accentColor }}>记录后将获得：</div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span>💰</span>
                <span style={{ color: textColor }}>+{activeTab === 'success' ? 50 : 30} 金币</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⭐</span>
                <span style={{ color: textColor }}>+{activeTab === 'success' ? 10 : 5} 成长值</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddEntry}
            disabled={!newEntry.trim()}
            className="w-full py-3 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: newEntry.trim() ? buttonBg : 'rgba(0,0,0,0.05)',
              color: newEntry.trim() ? textColor : accentColor,
              opacity: newEntry.trim() ? 1 : 0.5,
              cursor: newEntry.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            💾 保存记录
          </button>
        </div>
      )}

      {/* 日记列表 */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">
              {activeTab === 'success' ? '🏆' : '💖'}
            </div>
            <div className="text-lg font-semibold mb-2" style={{ color: textColor }}>
              还没有{activeTab === 'success' ? '成功' : '感恩'}记录
            </div>
            <div className="text-sm" style={{ color: accentColor }}>
              点击上方按钮开始记录吧！
            </div>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg p-4 space-y-2"
              style={{ backgroundColor: cardBg }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-xs" style={{ color: accentColor }}>
                    {entry.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                  </span>
                  {entry.mood && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: buttonBg, color: textColor }}>
                      {entry.mood}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <div className="text-sm leading-relaxed" style={{ color: textColor }}>
                {entry.content}
              </div>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: buttonBg, color: textColor }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-3 text-xs pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <div className="flex items-center space-x-1">
                  <span>💰</span>
                  <span style={{ color: accentColor }}>+{entry.rewards.gold}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span style={{ color: accentColor }}>+{entry.rewards.growth}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm font-semibold mb-2" style={{ color: textColor }}>
          💡 小贴士
        </div>
        <ul className="space-y-1 text-xs" style={{ color: accentColor }}>
          <li>• 每天记录成功和感恩，培养积极心态</li>
          <li>• 连续记录可获得额外奖励</li>
          <li>• 可以在AI助手中快速记录</li>
          <li>• 记录会自动同步到全景记忆栏</li>
        </ul>
      </div>
    </div>
  );
}

