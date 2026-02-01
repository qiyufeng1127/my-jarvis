import { Sparkles, Zap, MessageSquare, Inbox, ArrowRight } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';

export default function WelcomeModal() {
  const { isFirstTime, setFirstTime, setShowUserGuide } = useTutorialStore();

  if (!isFirstTime) return null;

  const handleStart = () => {
    setFirstTime(false);
    setShowUserGuide(true);
  };

  const handleSkip = () => {
    setFirstTime(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">欢迎来到 ManifestOS</h1>
          <p className="text-lg opacity-90">AI 驱动的成长操作系统</p>
        </div>

        {/* 内容 */}
        <div className="p-8">
          {/* 核心亮点 */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">核心优势</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
              <p className="text-lg text-gray-800 font-semibold mb-3">
                <span className="text-purple-600">90% 的操作由 AI 自动完成</span>，你只需要说出想法！
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span>AI 自动分类、打标签、分配奖励</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>AI 自动分解任务、优化动线、安排时间</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>AI 自动识别情绪、关联目标、追踪进度</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 两大入口 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>两大智能入口</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI 智能输入 */}
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">AI 智能输入</h4>
                </div>
                <p className="text-sm text-gray-600">
                  右下角黄色按钮，对话式输入，AI 自动理解并处理
                </p>
              </div>

              {/* 收集箱 */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">收集箱</h4>
                </div>
                <p className="text-sm text-gray-600">
                  顶部导航，批量输入后一键智能分配
                </p>
              </div>
            </div>
          </div>

          {/* 快速示例 */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-2">💡 试试这样说：</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-gray-600">"</span>
                <span className="text-purple-600 font-semibold">帮我安排今天的任务</span>
                <span className="text-gray-600">"</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-gray-600">"</span>
                <span className="text-blue-600 font-semibold">洗漱、洗碗、工作2小时、收拾房间</span>
                <span className="text-gray-600">"</span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-gray-600">"</span>
                <span className="text-green-600 font-semibold">今天完成了项目，很有成就感</span>
                <span className="text-gray-600">"</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
          >
            跳过
          </button>
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-bold flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <span>查看完整教程</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

