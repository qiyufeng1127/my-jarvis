import { useState } from 'react';
import { useSideHustleStore } from '@/stores/sideHustleStore';
import { Lightbulb, Plus, Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface IdeaPoolProps {
  isDark?: boolean;
}

export default function IdeaPool({ isDark = false }: IdeaPoolProps) {
  const { getIdeas, createSideHustle, updateSideHustle } = useSideHustleStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIdeaName, setNewIdeaName] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const ideas = getIdeas();

  const handleAddIdea = async () => {
    if (!newIdeaName.trim()) return;

    await createSideHustle({
      name: newIdeaName,
      icon: '💡',
      color: '#f59e0b',
      status: 'idea',
    });

    setNewIdeaName('');
    setShowAddForm(false);
  };

  const handleAnalyze = async (ideaId: string) => {
    setAnalyzingId(ideaId);
    
    // 模拟 AI 分析
    setTimeout(async () => {
      const idea = ideas.find(i => i.id === ideaId);
      if (idea) {
        await updateSideHustle(ideaId, {
          aiAnalysis: {
            feasibility: Math.floor(Math.random() * 30) + 70, // 70-100
            expectedIncome: Math.floor(Math.random() * 50000) + 10000, // 10000-60000
            recommendation: '该副业具有较好的市场前景，建议尽快启动。',
            risks: ['市场竞争激烈', '需要持续投入时间', '初期收入可能较低'],
          },
        });
      }
      setAnalyzingId(null);
    }, 2000);
  };

  const handleStartIdea = async (ideaId: string) => {
    await updateSideHustle(ideaId, {
      status: 'active',
      startDate: new Date(),
    });
  };

  return (
    <div
      className="p-6 rounded-xl"
      style={{ backgroundColor: cardBg }}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb size={24} style={{ color: '#f59e0b' }} />
          <h2 className="text-xl font-bold" style={{ color: textColor }}>
            副业想法池
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: textColor,
          }}
        >
          <Plus size={18} />
          <span>添加想法</span>
        </button>
      </div>

      {/* 添加想法表单 */}
      {showAddForm && (
        <div
          className="p-4 rounded-lg mb-4"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
        >
          <input
            type="text"
            value={newIdeaName}
            onChange={(e) => setNewIdeaName(e.target.value)}
            placeholder="输入副业想法..."
            className="w-full px-4 py-2 rounded-lg mb-3"
            style={{
              backgroundColor: cardBg,
              color: textColor,
              border: 'none',
              outline: 'none',
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddIdea}
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: '#10b981',
                color: '#ffffff',
              }}
            >
              添加
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewIdeaName('');
              }}
              className="flex-1 py-2 rounded-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: textColor,
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 想法列表 */}
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <div className="text-center py-12" style={{ color: secondaryColor }}>
            <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
            <p>还没有副业想法</p>
            <p className="text-sm mt-2">点击"添加想法"开始记录你的创意</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="p-4 rounded-lg transition-all hover:scale-[1.02]"
              style={{ 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `2px solid ${idea.color}20`,
              }}
            >
              {/* 想法名称 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idea.icon}</span>
                  <span className="font-bold text-lg" style={{ color: textColor }}>
                    {idea.name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAnalyze(idea.id)}
                    disabled={analyzingId === idea.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      color: '#8b5cf6',
                    }}
                  >
                    <Sparkles size={16} />
                    <span className="text-sm">
                      {analyzingId === idea.id ? '分析中...' : 'AI 分析'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleStartIdea(idea.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                    }}
                  >
                    <CheckCircle size={16} />
                    <span className="text-sm">启动</span>
                  </button>
                </div>
              </div>

              {/* AI 分析结果 */}
              {idea.aiAnalysis && (
                <div className="space-y-3 mt-4 pt-4 border-t" style={{ borderColor: `${idea.color}20` }}>
                  {/* 可行性评分 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm" style={{ color: secondaryColor }}>可行性评分</span>
                      <span className="text-sm font-bold" style={{ color: textColor }}>
                        {idea.aiAnalysis.feasibility}/100
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: cardBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${idea.aiAnalysis.feasibility}%`,
                          backgroundColor: idea.aiAnalysis.feasibility > 70 ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>

                  {/* 预期收入 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} style={{ color: '#10b981' }} />
                      <span className="text-sm" style={{ color: secondaryColor }}>预期收入</span>
                    </div>
                    <span className="font-bold" style={{ color: textColor }}>
                      ¥{idea.aiAnalysis.expectedIncome.toLocaleString()}
                    </span>
                  </div>

                  {/* AI 建议 */}
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} style={{ color: '#8b5cf6' }} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium mb-1" style={{ color: '#8b5cf6' }}>
                          AI 建议
                        </div>
                        <div className="text-sm" style={{ color: textColor }}>
                          {idea.aiAnalysis.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 风险提示 */}
                  {idea.aiAnalysis.risks && idea.aiAnalysis.risks.length > 0 && (
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} style={{ color: '#f59e0b' }} className="mt-0.5" />
                        <div>
                          <div className="text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>
                            风险提示
                          </div>
                          <ul className="text-sm space-y-1" style={{ color: textColor }}>
                            {idea.aiAnalysis.risks.map((risk, index) => (
                              <li key={index}>• {risk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

