import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'ManifestOS - 欢迎';
  }, []);

  const handleStart = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Logo 和标题 */}
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-primary-500 shadow-lg">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-primary-600">
            ManifestOS
          </h1>
          
          <p className="text-2xl text-neutral-600 mb-2">
            我要变好
          </p>
          
          <p className="text-lg text-neutral-500">
            大女主成长操作系统
          </p>
        </div>

        {/* 介绍文字 */}
        <div className="mb-12 space-y-4 animate-slide-up">
          <p className="text-xl text-neutral-700 leading-relaxed">
            将每一个日常行动都转化为通往
            <span className="text-primary-600 font-semibold">理想自我</span>
            的坚实步伐
          </p>
          
          <p className="text-base text-neutral-600">
            通过游戏化机制、AI 助手和视觉化成长追踪
            <br />
            真正实现「通过小任务，完成大蜕变」
          </p>
        </div>

        {/* 核心特性 */}
        <div className="grid grid-cols-2 gap-6 mb-12 animate-scale-in">
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-neutral-800 mb-1">成长系统</h3>
            <p className="text-sm text-neutral-600">可定制的维度和目标</p>
          </div>
          
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-3xl mb-2">🎤</div>
            <h3 className="font-semibold text-neutral-800 mb-1">Kiki 助手</h3>
            <p className="text-sm text-neutral-600">自然语言交互</p>
          </div>
          
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-neutral-800 mb-1">防拖延</h3>
            <p className="text-sm text-neutral-600">智能验证和提醒</p>
          </div>
          
          <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-neutral-800 mb-1">金币经济</h3>
            <p className="text-sm text-neutral-600">即时激励系统</p>
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={handleStart}
          className="px-12 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-primary-600"
        >
          开始我的成长之旅
        </button>

        {/* 底部提示 */}
        <p className="mt-8 text-sm text-neutral-500">
          所有数据保存在本地，安全可靠
        </p>
      </div>
    </div>
  );
}

