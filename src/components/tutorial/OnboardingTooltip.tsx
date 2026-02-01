import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TooltipStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

interface OnboardingTooltipProps {
  steps: TooltipStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTooltip({ steps, onComplete, onSkip }: OnboardingTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;

    // 查找目标元素
    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`Target element not found: ${step.target}`);
      return;
    }

    // 计算位置
    const rect = targetElement.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - 10;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 10;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 10;
        break;
    }

    setTooltipPosition({ top, left });
    setIsVisible(true);

    // 高亮目标元素
    if (step.highlight) {
      targetElement.classList.add('onboarding-highlight');
      return () => {
        targetElement.classList.remove('onboarding-highlight');
      };
    }
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible || !step) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />

      {/* 提示框 */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-2xl p-5 max-w-sm animate-scale-in"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        {/* 进度指示 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-purple-600'
                    : index < currentStep
                    ? 'w-1.5 bg-purple-400'
                    : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            跳过
          </button>
        </div>

        {/* 内容 */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* 按钮 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一步</span>
          </button>

          <div className="text-xs text-gray-500">
            {currentStep + 1} / {steps.length}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
          >
            <span>{currentStep === steps.length - 1 ? '完成' : '下一步'}</span>
            {currentStep === steps.length - 1 ? (
              <Check className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 样式 */}
      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.5), 0 0 0 8px rgba(147, 51, 234, 0.2);
          border-radius: 8px;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.5), 0 0 0 8px rgba(147, 51, 234, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(147, 51, 234, 0.6), 0 0 0 12px rgba(147, 51, 234, 0.3);
          }
        }
      `}</style>
    </>
  );
}

// 预定义的引导步骤
export const ONBOARDING_STEPS = {
  // 首页引导
  home: [
    {
      id: 'ai-button',
      target: '[data-tour="ai-button"]',
      title: '🤖 AI 智能输入',
      description: '点击这里打开 AI 助手，直接对话输入任何想法，AI 会自动帮你分类和处理！',
      position: 'left' as const,
      highlight: true,
    },
    {
      id: 'inbox',
      target: '[data-tour="inbox"]',
      title: '📥 收集箱',
      description: '快速批量输入多条内容，然后点击"智能分析并分配"，AI 会自动整理到各个模块。',
      position: 'bottom' as const,
      highlight: true,
    },
    {
      id: 'timeline',
      target: '[data-tour="timeline"]',
      title: '📅 时间轴',
      description: 'AI 自动排序的任务列表，按家里格局优化动线，完成任务获得金币奖励！',
      position: 'bottom' as const,
      highlight: true,
    },
    {
      id: 'coins',
      target: '[data-tour="coins"]',
      title: '💰 金币系统',
      description: '完成任务、记录心情、写日记都能获得金币和成长值，激励你持续进步！',
      position: 'bottom' as const,
      highlight: true,
    },
  ],

  // 收集箱引导
  inbox: [
    {
      id: 'inbox-input',
      target: '[data-tour="inbox-input"]',
      title: '✍️ 快速输入',
      description: '在这里输入任何内容：任务、心情、想法、创业点子...不用担心分类，AI 会帮你处理！',
      position: 'bottom' as const,
      highlight: true,
    },
    {
      id: 'inbox-select',
      target: '[data-tour="inbox-list"]',
      title: '✅ 选择内容',
      description: '勾选要处理的内容，可以一次选择多条。',
      position: 'right' as const,
      highlight: true,
    },
    {
      id: 'inbox-distribute',
      target: '[data-tour="inbox-distribute"]',
      title: '✨ 智能分配',
      description: '点击这个按钮，AI 会自动分析内容类型，并分配到时间轴、记忆库、日记或副业追踪器！',
      position: 'top' as const,
      highlight: true,
    },
  ],

  // AI 输入引导
  ai: [
    {
      id: 'ai-input',
      target: '[data-tour="ai-input"]',
      title: '💬 自然对话',
      description: '像和朋友聊天一样输入，AI 会理解你的意图。试试说："帮我安排今天的任务"',
      position: 'top' as const,
      highlight: true,
    },
    {
      id: 'ai-quick',
      target: '[data-tour="ai-quick"]',
      title: '⚡ 快速指令',
      description: '不知道说什么？点击这些快速指令，AI 会给你智能建议！',
      position: 'top' as const,
      highlight: true,
    },
    {
      id: 'ai-select',
      target: '[data-tour="ai-select"]',
      title: '📋 批量处理',
      description: '点击这里进入选择模式，可以批量选择历史消息，一键智能分配！',
      position: 'left' as const,
      highlight: true,
    },
  ],

  // 时间轴引导
  timeline: [
    {
      id: 'timeline-task',
      target: '[data-tour="timeline-task"]',
      title: '📝 任务卡片',
      description: 'AI 已经帮你安排好了任务，包括时长、位置、优先级。点击开始执行！',
      position: 'right' as const,
      highlight: true,
    },
    {
      id: 'timeline-complete',
      target: '[data-tour="timeline-complete"]',
      title: '✅ 完成任务',
      description: '完成后点击这里，立即获得金币和成长值奖励！',
      position: 'left' as const,
      highlight: true,
    },
  ],

  // 副业追踪器引导
  sidehustle: [
    {
      id: 'sidehustle-add',
      target: '[data-tour="sidehustle-add"]',
      title: '💡 添加副业',
      description: '对 AI 说出你的创业想法，会自动创建副业项目。或者点击这里手动添加。',
      position: 'bottom' as const,
      highlight: true,
    },
    {
      id: 'sidehustle-income',
      target: '[data-tour="sidehustle-income"]',
      title: '💰 记录收入',
      description: '记录每笔收入和支出，系统会自动计算时薪、ROI 等数据，帮你找到最赚钱的副业！',
      position: 'left' as const,
      highlight: true,
    },
  ],
};

