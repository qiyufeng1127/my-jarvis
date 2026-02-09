import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Zap, MessageSquare, Inbox, Check } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';

interface WelcomeStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;

  iconName: 'sparkles' | 'zap' | 'message' | 'check';
  animation: string;
}

const WELCOME_STEPS: WelcomeStep[] = [
  {
    id: 1,
    title: '准备好成为更好的自己了吗？',
    subtitle: 'Are You Ready to Become Your Best Self?',
    description: '这不是一个普通的待办清单\n这是你通往理想人生的操作系统',
    gradient: 'from-purple-600 via-pink-600 to-red-600',
    iconName: 'sparkles',
    animation: 'animate-pulse-slow',
  },
  {
    id: 2,
    title: '让 AI 成为你的成长伙伴',
    subtitle: 'AI-Powered Growth Partner',
    description: '90% 的繁琐操作由 AI 自动完成\n你只需要专注于想法和行动',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    iconName: 'zap',
    animation: 'animate-bounce-slow',
  },
  {
    id: 3,
    title: '极简输入，全面成长',
    subtitle: 'Simple Input, Complete Growth',
    description: '只需两个入口，说出你的想法\nAI 自动分类、规划、追踪、激励',
    gradient: 'from-green-600 via-emerald-600 to-teal-600',
    iconName: 'message',
    animation: 'animate-float',
  },
  {
    id: 4,
    title: '每一天，都是新的开始',
    subtitle: 'Every Day is a New Beginning',
    description: '完成任务获得奖励\n记录成长看见进步\n让每个行动都有意义',
    gradient: 'from-orange-600 via-amber-600 to-yellow-600',
    iconName: 'check',
    animation: 'animate-scale-pulse',
  },
];

const getIcon = (iconName: string) => {
  const iconProps = { className: "w-16 h-16" };
  switch (iconName) {
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'message':
      return <MessageSquare {...iconProps} />;
    case 'check':
      return <Check {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
};

export default function PremiumWelcome() {
  const { isFirstTime, setFirstTime } = useTutorialStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const step = WELCOME_STEPS[currentStep];

  useEffect(() => {
    if (isFirstTime) {
      // 延迟显示内容，创造悬念
      setTimeout(() => setShowContent(true), 300);
    }
  }, [isFirstTime]);

  if (!isFirstTime) return null;

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      handleStart();
    }
  };

  const handleStart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setFirstTime(false);
    }, 500);
  };

  const handleSkip = () => {
    setFirstTime(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden touch-pan-y">
      {/* 动态渐变背景 */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${step.gradient} transition-all duration-1000 ease-in-out`}
        style={{
          opacity: showContent ? 1 : 0,
        }}
      >
        {/* 动态光效 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-float-reverse" />
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative h-full flex flex-col items-center justify-between p-8 md:p-12">
        {/* 顶部：跳过按钮 - 增加顶部间距避免与状态栏重叠 */}
        <div className="w-full flex justify-end pt-8 md:pt-0">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-white/80 hover:text-white font-medium transition-all hover:scale-105 active:scale-95 touch-manipulation"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'all 0.6s ease-out 0.3s',
            }}
          >
            跳过
          </button>
        </div>

        {/* 中间：内容区域 */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full">
          {/* 图标 */}
          <div
            className={`mb-8 text-white ${step.animation}`}
            style={{
              opacity: showContent && !isAnimating ? 1 : 0,
              transform: showContent && !isAnimating ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {getIcon(step.iconName)}
          </div>

          {/* 主标题 */}
          <h1
            className="text-4xl md:text-6xl font-bold text-white text-center mb-4 leading-tight"
            style={{
              opacity: showContent && !isAnimating ? 1 : 0,
              transform: showContent && !isAnimating ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
            }}
          >
            {step.title}
          </h1>

          {/* 副标题 */}
          <p
            className="text-lg md:text-xl text-white/90 text-center mb-6 font-light tracking-wide"
            style={{
              opacity: showContent && !isAnimating ? 1 : 0,
              transform: showContent && !isAnimating ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
            }}
          >
            {step.subtitle}
          </p>

          {/* 描述 */}
          <p
            className="text-base md:text-lg text-white/80 text-center whitespace-pre-line leading-relaxed"
            style={{
              opacity: showContent && !isAnimating ? 1 : 0,
              transform: showContent && !isAnimating ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s',
            }}
          >
            {step.description}
          </p>

          {/* 特色亮点（第3步显示） */}
          {currentStep === 2 && (
            <div
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg"
              style={{
                opacity: showContent && !isAnimating ? 1 : 0,
                transform: showContent && !isAnimating ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s',
              }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <MessageSquare className="w-8 h-8 text-white mb-2" />
                <h3 className="text-white font-semibold mb-1">AI 智能输入</h3>
                <p className="text-white/70 text-sm">对话式输入，自动理解</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <Inbox className="w-8 h-8 text-white mb-2" />
                <h3 className="text-white font-semibold mb-1">万能收集箱</h3>
                <p className="text-white/70 text-sm">批量输入，智能分配</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部：进度和按钮 */}
        <div className="w-full max-w-md">
          {/* 进度指示器 */}
          <div
            className="flex justify-center space-x-2 mb-8"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out 0.5s',
            }}
          >
            {WELCOME_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentStep
                    ? 'w-12 bg-white'
                    : index < currentStep
                    ? 'w-8 bg-white/60'
                    : 'w-8 bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* 下一步按钮 - 增强触摸响应 */}
          <button
            onClick={handleNext}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="w-full py-4 px-8 bg-white text-gray-900 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:scale-105 active:scale-95 transition-all shadow-2xl group touch-manipulation cursor-pointer"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out 0.6s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span>{currentStep === WELCOME_STEPS.length - 1 ? '开始我的成长之旅' : '下一步'}</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 提示文字 */}
          {currentStep === WELCOME_STEPS.length - 1 && (
            <p
              className="text-center text-white/60 text-sm mt-4"
              style={{
                opacity: showContent ? 1 : 0,
                transition: 'all 0.6s ease-out 0.7s',
              }}
            >
              点击开始，让 AI 陪你一起变得更好
            </p>
          )}
        </div>
      </div>

      {/* 自定义动画 */}
      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
          }
        }

        @keyframes float-reverse {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30px, 30px) scale(1.1);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }

        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: float-reverse 25s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-scale-pulse {
          animation: scale-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

