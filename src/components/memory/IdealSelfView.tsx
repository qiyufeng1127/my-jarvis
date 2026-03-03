import { useState } from 'react';
import { Sparkles, Heart, TrendingUp, User, Eye, Crown, Globe, Loader2 } from 'lucide-react';
import { useMemoryStore } from '@/stores/memoryStore';
import { useAIStore } from '@/stores/aiStore';

interface IdealSelfViewProps {
  isDark?: boolean;
  bgColor?: string;
  selectedDate: Date;
}

type PerspectiveType = '1year' | '5year' | 'observer' | 'god' | 'idol';

// 日记系统配色 - 参考坏习惯组件
const DIARY_COLORS = {
  espresso: '#542916',
  eauTrouble: '#b79858',
  terreCuite: '#a13a1e',
  nuageDeLait: '#fefaf0',
  mielDore: '#f1c166',
  bleuPorcelaine: '#88b8ce',
  
  glassmorphism: {
    light: 'rgba(254, 250, 240, 0.8)',
    accent: 'rgba(241, 193, 102, 0.6)',
  },
  
  shadows: {
    card: '0 2px 8px rgba(84, 41, 22, 0.15)',
  },
};

const PERSPECTIVES = [
  { id: '1year', label: '1年后理想的自己', emoji: '🙋', icon: User, color: DIARY_COLORS.bleuPorcelaine, prompt: '1年后' },
  { id: '5year', label: '5年后理想的自己', emoji: '👑', icon: Crown, color: DIARY_COLORS.mielDore, prompt: '5年后' },
  { id: 'observer', label: '旁观者中立视角', emoji: '👁️', icon: Eye, color: DIARY_COLORS.eauTrouble, prompt: '作为一个中立的旁观者' },
  { id: 'god', label: '上帝全局视角', emoji: '🌍', icon: Globe, color: DIARY_COLORS.espresso, prompt: '从上帝视角、全局角度' },
  { id: 'idol', label: '偶像眼中的自己', emoji: '💖', icon: Heart, color: DIARY_COLORS.terreCuite, prompt: '作为你最崇拜的偶像' },
];

export default function IdealSelfView({ 
  isDark = false, 
  bgColor = '#ffffff',
  selectedDate
}: IdealSelfViewProps) {
  const { memories } = useMemoryStore();
  const { chat } = useAIStore();
  
  const [selectedPerspective, setSelectedPerspective] = useState<PerspectiveType>('5year');
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 日记系统配色 - 参考坏习惯组件
  const cardBg = DIARY_COLORS.glassmorphism.light;
  const textColor = DIARY_COLORS.espresso;
  const accentColor = DIARY_COLORS.eauTrouble;

  // 获取最近的记录（用于分析）
  const recentMemories = memories
    .filter(m => new Date(m.date) <= selectedDate)
    .slice(0, 30)
    .map(m => `${new Date(m.date).toLocaleDateString('zh-CN')} - ${m.content}`)
    .join('\n');

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis('');
    
    try {
      const perspective = PERSPECTIVES.find(p => p.id === selectedPerspective);
      if (!perspective) return;

      const prompt = `请你${perspective.prompt}，帮我分析最近遇到的问题，并给我一些建议。

我最近的记录：
${recentMemories || '暂无记录'}

请以${perspective.label}的身份：
1. 分析我当前面临的主要问题和挑战
2. 指出我的优势和已经取得的进步
3. 给出具体、温暖、有方向感的建议
4. 帮助我看到更大的可能性
5. 给我继续前进的力量和信心

请用温暖、有力量、有远见的语言，让我感受到支持和方向。`;

      const response = await chat([
        { 
          role: 'system', 
          content: `你是用户${perspective.prompt}的理想自己，已经实现了目标，拥有智慧和远见。你的任务是用温暖、有力量的语言，帮助现在的用户看清方向，给予支持和建议。` 
        },
        { role: 'user', content: prompt }
      ]);

      if (response.success && response.content) {
        setAnalysis(response.content);
      } else {
        setAnalysis('生成失败，请检查AI配置或稍后重试。');
      }
    } catch (error) {
      console.error('生成分析失败:', error);
      setAnalysis('生成失败，请稍后重试。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentPerspective = PERSPECTIVES.find(p => p.id === selectedPerspective);

  return (
    <div 
      className="space-y-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif' }}
    >
      {/* 标题 - iOS风格卡片 */}
      <div 
        className="rounded-2xl p-6"
        style={{ 
          backgroundColor: cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        <h3 
          className="font-bold mb-2"
          style={{ 
            fontSize: '20px',
            fontWeight: 600,
            color: textColor,
          }}
        >
          ✨ 理想的自己
        </h3>
        <div className="text-sm" style={{ color: accentColor, fontWeight: 300 }}>
          选择一个视角，让未来的自己或不同角度的智慧，帮你看清当下
        </div>
      </div>

      {/* 视角选择 - iOS风格按钮 */}
      <div className="space-y-3">
        {PERSPECTIVES.map((perspective) => {
          const isSelected = selectedPerspective === perspective.id;
          
          return (
            <button
              key={perspective.id}
              onClick={() => setSelectedPerspective(perspective.id as PerspectiveType)}
              className="w-full p-4 rounded-xl flex items-center space-x-3 transition-transform active:scale-95"
              style={{
                backgroundColor: isSelected ? perspective.color : DIARY_COLORS.nuageDeLait,
                boxShadow: DIARY_COLORS.shadows.card,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : perspective.color + '40' }}
              >
                {perspective.emoji}
              </div>
              
              <div className="flex-1 text-left">
                <div 
                  className="font-medium"
                  style={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isSelected ? DIARY_COLORS.nuageDeLait : textColor,
                  }}
                >
                  {perspective.label}
                </div>
                <div 
                  className="text-xs mt-0.5"
                  style={{ 
                    color: isSelected ? 'rgba(254, 250, 240, 0.8)' : accentColor,
                    fontWeight: 300,
                  }}
                >
                  {perspective.id === '1year' && '看看一年后的你会怎么说'}
                  {perspective.id === '5year' && '从更长远的角度看待当下'}
                  {perspective.id === 'observer' && '跳出局限，客观看待问题'}
                  {perspective.id === 'god' && '从全局视角理解人生'}
                  {perspective.id === 'idol' && '用榜样的智慧指引方向'}
                </div>
              </div>
              
              {isSelected && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: DIARY_COLORS.nuageDeLait }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: perspective.color }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 生成按钮 - iOS风格 */}
      <button
        onClick={generateAnalysis}
        disabled={isAnalyzing}
        className="w-full px-6 py-4 rounded-lg transition-transform active:scale-95 disabled:opacity-50"
        style={{ 
          backgroundColor: currentPerspective?.color || DIARY_COLORS.espresso,
          color: DIARY_COLORS.nuageDeLait,
          fontSize: '16px',
          fontWeight: 500,
          minHeight: '44px',
          boxShadow: DIARY_COLORS.shadows.card,
        }}
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>深度思考中...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>开始对话</span>
          </div>
        )}
      </button>

      {/* 分析结果 - iOS风格卡片 */}
      {analysis && (
        <div 
          className="rounded-2xl p-6 space-y-4"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="flex items-center space-x-3">
            {currentPerspective && (
              <>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: currentPerspective.color + '40' }}
                >
                  {currentPerspective.emoji}
                </div>
                <div>
                  <div className="font-medium" style={{ fontSize: '14px', fontWeight: 500, color: textColor }}>
                    {currentPerspective.label}
                  </div>
                  <div className="text-xs" style={{ color: accentColor, fontWeight: 300 }}>
                    给你的话
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: textColor, fontWeight: 300 }}
          >
            {analysis}
          </div>
        </div>
      )}

      {/* 提示 - iOS风格卡片 */}
      {!analysis && (
        <div 
          className="rounded-2xl p-6"
          style={{ 
            backgroundColor: cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: DIARY_COLORS.shadows.card,
          }}
        >
          <div className="font-semibold mb-3 flex items-center space-x-2" style={{ color: textColor, fontSize: '14px' }}>
            <span>💡</span>
            <span>使用提示</span>
          </div>
          <ul className="space-y-2 text-sm" style={{ color: accentColor, fontWeight: 300 }}>
            <li>• 选择一个视角，让AI扮演不同角色给你建议</li>
            <li>• 每个视角都会带来不同的洞察和启发</li>
            <li>• 可以多次尝试不同视角，获得全方位的支持</li>
            <li>• 这些对话会帮你看清方向，找到力量</li>
          </ul>
        </div>
      )}
    </div>
  );
}

