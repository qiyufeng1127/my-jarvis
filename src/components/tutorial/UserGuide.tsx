import { useState } from 'react';
import { X, Sparkles, MessageSquare, Inbox, Target, TrendingUp, Coins, Briefcase, BookOpen, ChevronRight, Zap } from 'lucide-react';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'features'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">ManifestOS 使用指南</h2>
              <p className="text-sm opacity-90">AI 驱动的成长操作系统</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 标签切换 */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            快速开始
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'ai'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI 智能核心
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'features'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            功能详解
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'ai' && <AIContent />}
          {activeTab === 'features' && <FeaturesContent />}
        </div>

        {/* 底部 */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 提示：点击各个模块的 <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">?</span> 图标查看详细说明
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
}

// 快速开始内容
function OverviewContent() {
  return (
    <div className="space-y-6">
      {/* 核心理念 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">核心优势：AI 自动化</h3>
            <p className="text-gray-700 leading-relaxed">
              <strong className="text-purple-600">90% 的操作由 AI 自动完成</strong>，你只需要：
            </p>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-purple-600" />
                <span><strong>说出想法</strong> - AI 自动分类、打标签、分配奖励</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-purple-600" />
                <span><strong>描述任务</strong> - AI 自动分解、排序、优化动线</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-purple-600" />
                <span><strong>记录心情</strong> - AI 自动识别情绪、关联目标</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 三步上手 */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 三步开始使用</h3>
        <div className="space-y-4">
          {/* 步骤 1 */}
          <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>打开 AI 智能输入（右下角黄色按钮）</span>
              </h4>
              <p className="text-gray-600 text-sm">
                直接对话，说出任何想法：任务、心情、灵感、创业点子...
                <br />
                <span className="text-purple-600 font-semibold">AI 会自动理解并分类到对应模块</span>
              </p>
            </div>
          </div>

          {/* 步骤 2 */}
          <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-blue-600" />
                <span>或使用收集箱（顶部导航）</span>
              </h4>
              <p className="text-gray-600 text-sm">
                快速批量输入多条内容，选中后点击"智能分析并分配"
                <br />
                <span className="text-blue-600 font-semibold">AI 会批量处理并自动分配到各个模块</span>
              </p>
            </div>
          </div>

          {/* 步骤 3 */}
          <div className="flex items-start space-x-4 p-4 bg-white rounded-xl border-2 border-green-200 hover:border-green-400 transition-colors">
            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span>查看各个模块，开始行动</span>
              </h4>
              <p className="text-gray-600 text-sm">
                时间轴、记忆库、日记、副业追踪器...所有内容已自动整理好
                <br />
                <span className="text-green-600 font-semibold">完成任务获得金币和成长值，持续进步！</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速提示 */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          <span>💡 快速提示</span>
        </h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• 首次使用？每个模块都有 <span className="text-blue-600 font-semibold">新手引导</span>，点击 "?" 图标查看</li>
          <li>• 不知道说什么？试试：<span className="text-purple-600 font-semibold">"帮我安排今天的任务"</span></li>
          <li>• 想批量处理？在 AI 对话中选择多条消息，点击 <span className="text-blue-600 font-semibold">"智能分析并分配"</span></li>
        </ul>
      </div>
    </div>
  );
}

// AI 智能核心内容
function AIContent() {
  return (
    <div className="space-y-6">
      {/* AI 能力展示 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-3 flex items-center space-x-2">
          <Sparkles className="w-7 h-7" />
          <span>AI 智能引擎</span>
        </h3>
        <p className="text-lg opacity-90">
          让你专注于想法和行动，繁琐的分类、整理、规划全部交给 AI
        </p>
      </div>

      {/* AI 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 智能分类 */}
        <div className="bg-white rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 transition-colors">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900">智能内容分类</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            自动识别 7 种内容类型：任务、心情、想法、感恩、成功、创业想法、时间控制
          </p>
          <div className="bg-purple-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-purple-900 mb-1">示例：</div>
            <div className="text-gray-700">
              输入："今天完成了项目，感觉很有成就感"
              <br />
              <span className="text-purple-600">→ AI 识别为"成功日记"，自动保存到日记模块</span>
            </div>
          </div>
        </div>

        {/* 智能任务分解 */}
        <div className="bg-white rounded-xl p-5 border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900">智能任务分解</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            复杂任务自动拆分成小步骤，按家里格局优化动线，智能分配时长
          </p>
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-blue-900 mb-1">示例：</div>
            <div className="text-gray-700">
              输入："洗漱、洗碗、倒猫粮、工作2小时"
              <br />
              <span className="text-blue-600">→ AI 自动分解成4个任务，按位置排序，分配时长</span>
            </div>
          </div>
        </div>

        {/* 智能标签 */}
        <div className="bg-white rounded-xl p-5 border-2 border-green-200 hover:border-green-400 transition-colors">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900">智能情绪标签</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            自动识别情绪（开心、焦虑、平静...）和分类（工作、生活、健康...）
          </p>
          <div className="bg-green-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-green-900 mb-1">示例：</div>
            <div className="text-gray-700">
              输入："今天工作压力好大，有点焦虑"
              <br />
              <span className="text-green-600">→ AI 自动打上"焦虑"、"工作"标签</span>
            </div>
          </div>
        </div>

        {/* 智能目标关联 */}
        <div className="bg-white rounded-xl p-5 border-2 border-orange-200 hover:border-orange-400 transition-colors">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="font-bold text-gray-900">智能目标关联</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            自动匹配任务与长期目标，显示关联度和进度贡献
          </p>
          <div className="bg-orange-50 rounded-lg p-3 text-sm">
            <div className="font-semibold text-orange-900 mb-1">示例：</div>
            <div className="text-gray-700">
              任务："学习 React 1小时"
              <br />
              <span className="text-orange-600">→ AI 关联到"成为前端工程师"目标（85%匹配）</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI 使用技巧 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <span>🎯 AI 使用技巧</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-semibold text-gray-900 mb-1">✅ 推荐说法：</div>
            <ul className="space-y-1 text-gray-700">
              <li>• "帮我安排今天的任务"</li>
              <li>• "今天完成了XX，很开心"</li>
              <li>• "想做一个XX的副业"</li>
              <li>• "洗漱、洗碗、工作2小时"</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">💡 高级用法：</div>
            <ul className="space-y-1 text-gray-700">
              <li>• 批量选择历史消息，一键分配</li>
              <li>• 描述复杂任务，AI 自动拆分</li>
              <li>• 自然对话，无需记忆指令</li>
              <li>• 查看 AI 思考过程，理解决策</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 功能详解内容
function FeaturesContent() {
  const features = [
    {
      icon: Target,
      title: '时间轴',
      color: 'blue',
      description: 'AI 自动排序的任务列表，按家里格局优化动线',
      howToUse: [
        '通过 AI 输入或收集箱创建任务',
        'AI 自动分配时长、优先级、位置',
        '拖拽调整顺序，点击开始执行',
        '完成后获得金币和成长值奖励'
      ]
    },
    {
      icon: Inbox,
      title: '收集箱',
      color: 'purple',
      description: '万能收集入口，批量输入后 AI 智能分配',
      howToUse: [
        '快速输入多条想法、任务、心情',
        '选中要处理的内容',
        '点击"智能分析并分配"',
        'AI 自动分类到各个模块'
      ]
    },
    {
      icon: MessageSquare,
      title: 'AI 智能输入',
      color: 'yellow',
      description: '对话式输入，AI 自动理解并处理',
      howToUse: [
        '点击右下角黄色按钮打开',
        '自然对话，说出任何想法',
        'AI 自动分类、打标签、分配',
        '支持批量选择历史消息处理'
      ]
    },
    {
      icon: BookOpen,
      title: '全景记忆',
      color: 'green',
      description: '自动记录心情、想法，AI 智能标签',
      howToUse: [
        '通过 AI 输入心情或想法',
        'AI 自动识别情绪和分类',
        '查看情绪趋势和记忆时间线',
        '回顾成长轨迹'
      ]
    },
    {
      icon: TrendingUp,
      title: '长期目标',
      color: 'orange',
      description: 'AI 自动关联任务，追踪目标进度',
      howToUse: [
        '设置长期目标（如"学会编程"）',
        'AI 自动匹配相关任务',
        '实时显示目标进度',
        '获得目标达成奖励'
      ]
    },
    {
      icon: Briefcase,
      title: '副业追踪器',
      color: 'pink',
      description: 'AI 收集创业想法，追踪收入支出',
      howToUse: [
        '对 AI 说出创业想法',
        '自动创建副业项目',
        '记录收入、支出、时间',
        '查看时薪、ROI 等数据'
      ]
    },
    {
      icon: Coins,
      title: '金币系统',
      color: 'amber',
      description: '完成任务获得奖励，激励持续行动',
      howToUse: [
        '完成任务自动获得金币',
        '记录成功、感恩获得额外奖励',
        '累积金币解锁成就',
        '查看成长值和等级'
      ]
    }
  ];

  const colorClasses: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'bg-pink-100 text-pink-600', text: 'text-pink-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-600' },
  };

  return (
    <div className="space-y-4">
      {features.map((feature, index) => {
        const colors = colorClasses[feature.color];
        const Icon = feature.icon;
        
        return (
          <div
            key={index}
            className={`${colors.bg} rounded-xl p-5 border-2 ${colors.border} hover:shadow-lg transition-all`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                <div className="space-y-1">
                  {feature.howToUse.map((step, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm text-gray-700">
                      <span className={`${colors.text} font-semibold`}>{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

