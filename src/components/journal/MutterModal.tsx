import { useState } from 'react';
import { X, Sparkles, Send, Loader2 } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useGoldStore } from '@/stores/goldStore';

interface MutterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  isDark?: boolean;
}

export default function MutterModal({
  isOpen,
  onClose,
  selectedDate,
  isDark = false,
}: MutterModalProps) {
  const [mutterText, setMutterText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    mood: string;
    moodEmoji: string;
    category: string;
    summary: string;
    tags: string[];
  } | null>(null);

  const { chat } = useAIStore();
  const { addMemory } = useMemoryStore();
  const { earnGold } = useGoldStore();

  // 复古糖果色
  const candyColors = {
    pink: '#FF6B9D',
    mint: '#98D8C8',
    peach: '#FFB347',
    lavender: '#B19CD9',
    lemon: '#FFE66D',
    coral: '#FF6F61',
    sky: '#87CEEB',
  };

  if (!isOpen) return null;

  const analyzeMutter = async () => {
    if (!mutterText.trim()) return;

    setIsAnalyzing(true);

    try {
      const prompt = `请分析以下碎碎念/心情记录，并以JSON格式返回分析结果：

碎碎念内容：
${mutterText}

请返回以下格式的JSON（只返回JSON，不要其他文字）：
{
  "mood": "情绪名称（如：开心、焦虑、平静、兴奋等）",
  "moodEmoji": "对应的emoji（如：😊、😰、😌、🤩等）",
  "category": "分类（如：工作、生活、学习、情感、健康等）",
  "summary": "一句话总结（20字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}`;

      const response = await chat([
        {
          role: 'system',
          content: '你是一个善解人意的情绪分析助手，擅长理解用户的心情和想法。请用温暖、共情的方式分析用户的碎碎念。',
        },
        { role: 'user', content: prompt },
      ]);

      if (response.success && response.content) {
        try {
          // 尝试提取JSON
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            setAnalysis(result);
          } else {
            // 如果没有JSON，使用默认值
            setAnalysis({
              mood: '记录',
              moodEmoji: '📝',
              category: '生活',
              summary: mutterText.slice(0, 20),
              tags: ['碎碎念'],
            });
          }
        } catch (e) {
          console.error('解析AI响应失败:', e);
          setAnalysis({
            mood: '记录',
            moodEmoji: '📝',
            category: '生活',
            summary: mutterText.slice(0, 20),
            tags: ['碎碎念'],
          });
        }
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请检查AI配置');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMutter = () => {
    if (!analysis) return;

    // 保存到记忆库
    addMemory({
      type: 'mutter',
      content: mutterText,
      mood: analysis.mood,
      tags: analysis.tags,
      date: selectedDate,
    });

    // 奖励金币
    earnGold(30, '记录碎碎念');

    // 显示成功提示
    alert(`✨ 碎碎念已保存！\n获得 30 金币 🪙\n\n心情：${analysis.moodEmoji} ${analysis.mood}\n分类：${analysis.category}`);

    // 关闭弹窗
    onClose();
    setMutterText('');
    setAnalysis(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md max-h-[85vh] rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: '#FFF5F7' }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all z-10 hover:scale-110"
          style={{ backgroundColor: candyColors.pink, color: 'white' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* 可滚动内容区域 */}
        <div className="overflow-y-auto flex-1 p-6" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {/* 标题 */}
          <div className="mb-6 text-center">
            <div className="text-4xl mb-2">💭</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: candyColors.pink }}>
              碎碎念
            </h2>
            <p className="text-sm font-medium" style={{ color: candyColors.coral }}>
              说说你的想法、心情或任何碎碎念~
            </p>
          </div>

          {/* 输入框 */}
          <div className="mb-6">
            <textarea
              value={mutterText}
              onChange={(e) => setMutterText(e.target.value)}
              placeholder="今天发生了什么？你在想什么？心情如何？随便说说吧..."
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border-3 text-sm resize-none focus:outline-none focus:ring-3 transition-all shadow-sm"
              style={{
                backgroundColor: 'white',
                borderColor: candyColors.lavender + '60',
                color: '#333',
              }}
              disabled={isAnalyzing || !!analysis}
            />
          </div>

          {/* AI分析按钮 */}
          {!analysis && (
            <button
              onClick={analyzeMutter}
              disabled={!mutterText.trim() || isAnalyzing}
              className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: candyColors.lavender }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI 正在分析中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>让 AI 帮我分析</span>
                </>
              )}
            </button>
          )}

          {/* AI分析结果 */}
          {analysis && (
            <div className="space-y-4">
              {/* 心情卡片 */}
              <div
                className="p-4 rounded-2xl shadow-md"
                style={{ backgroundColor: candyColors.mint + '40' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{analysis.moodEmoji}</span>
                  <div>
                    <div className="text-xs font-medium" style={{ color: candyColors.mint }}>
                      检测到的心情
                    </div>
                    <div className="text-lg font-bold" style={{ color: candyColors.mint }}>
                      {analysis.mood}
                    </div>
                  </div>
                </div>
              </div>

              {/* 分类和总结 */}
              <div
                className="p-4 rounded-2xl shadow-md"
                style={{ backgroundColor: candyColors.peach + '40' }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: candyColors.peach }}>
                  📂 分类
                </div>
                <div className="text-sm font-bold mb-3" style={{ color: candyColors.peach }}>
                  {analysis.category}
                </div>

                <div className="text-xs font-medium mb-2" style={{ color: candyColors.peach }}>
                  ✨ 一句话总结
                </div>
                <div className="text-sm" style={{ color: '#666' }}>
                  {analysis.summary}
                </div>
              </div>

              {/* 标签 */}
              <div
                className="p-4 rounded-2xl shadow-md"
                style={{ backgroundColor: candyColors.sky + '40' }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: candyColors.sky }}>
                  🏷️ 智能标签
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: candyColors.sky,
                        color: 'white',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 奖励提示 */}
              <div
                className="p-4 rounded-2xl shadow-md text-center"
                style={{ backgroundColor: candyColors.lemon + '40' }}
              >
                <div className="text-2xl mb-1">🎁</div>
                <div className="text-sm font-bold" style={{ color: '#8B6914' }}>
                  保存后将获得 30 金币奖励！
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 固定底部按钮 */}
        <div className="flex-shrink-0 p-6 pt-4 border-t-4" style={{ borderColor: candyColors.pink + '40' }}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105 shadow-md"
              style={{
                backgroundColor: candyColors.lavender + '40',
                color: candyColors.lavender,
              }}
            >
              <span className="text-lg">👋</span> 取消
            </button>
            <button
              onClick={saveMutter}
              disabled={!analysis}
              className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: candyColors.pink }}
            >
              <span className="text-lg">💾</span> 保存碎碎念
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




























