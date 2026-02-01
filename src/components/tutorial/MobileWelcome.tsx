import { useState } from 'react';
import { ArrowRight, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';

// 简单的欢迎步骤
const WELCOME_STEPS = [
  {
    id: 1,
    emoji: '✨',
    title: '准备好变得更好了吗？',
    description: '这不是普通的待办清单\n这是你的成长操作系统',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 2,
    emoji: '🤖',
    title: '让 AI 帮你自动化',
    description: '90% 的操作由 AI 完成\n你只需说出想法',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    emoji: '🎯',
    title: '只需两个入口',
    description: 'AI 智能输入 + 万能收集箱\n自动分类、规划、追踪',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    emoji: '🚀',
    title: '开始你的成长之旅',
    description: '完成任务获得奖励\n让每个行动都有意义',
    color: 'from-orange-500 to-yellow-500',
  },
];

export default function MobileWelcome() {
  const { isFirstTime, setFirstTime } = useTutorialStore();
  const [currentStep, setCurrentStep] = useState(0);

  // 只在移动端且首次访问时显示
  if (!isFirstTime || window.innerWidth >= 768) return null;

  const step = WELCOME_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setFirstTime(false);
    }
  };

  const handleSkip = () => {
    setFirstTime(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* 顶部跳过按钮 */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-gray-500 text-sm font-medium"
        >
          跳过
        </button>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 大 Emoji */}
        <div className="text-8xl mb-8 animate-bounce-slow">
          {step.emoji}
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          {step.title}
        </h1>

        {/* 描述 */}
        <p className="text-lg text-gray-600 text-center whitespace-pre-line leading-relaxed">
          {step.description}
        </p>

        {/* 特色卡片（第3步） */}
        {currentStep === 2 && (
          <div className="mt-8 w-full space-y-3">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="font-bold text-gray-900">AI 智能输入</h3>
                  <p className="text-sm text-gray-600">对话式输入，自动理解</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">📥</div>
                <div>
                  <h3 className="font-bold text-gray-900">万能收集箱</h3>
                  <p className="text-sm text-gray-600">批量输入，智能分配</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮区域 */}
      <div className="p-8 pb-12">
        {/* 进度指示器 */}
        <div className="flex justify-center space-x-2 mb-6">
          {WELCOME_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-8 bg-purple-600'
                  : index < currentStep
                  ? 'w-2 bg-purple-400'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* 下一步按钮 */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform shadow-lg"
        >
          <span>
            {currentStep === WELCOME_STEPS.length - 1 ? '开始使用' : '下一步'}
          </span>
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* 提示文字 */}
        {currentStep === WELCOME_STEPS.length - 1 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            点击开始，让 AI 陪你一起成长
          </p>
        )}
      </div>

      {/* 简单动画 */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

