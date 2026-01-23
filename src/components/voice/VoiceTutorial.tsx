import { useState } from 'react';
import { Mic, X, ChevronDown, ChevronUp, Sparkles, MessageCircle, Settings, Heart } from 'lucide-react';

interface CommandExample {
  command: string;
  description: string;
  example?: string;
}

interface CommandCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  commands: CommandExample[];
}

export default function VoiceTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

  const categories: CommandCategory[] = [
    {
      title: '任务管理指令',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500',
      commands: [
        {
          command: '创建任务：[任务描述]',
          description: '创建新任务，可以包含时间和时长信息',
          example: '创建任务：下午3点开始写项目报告，需要2小时',
        },
        {
          command: '查看今天的任务',
          description: '查看今天所有安排的任务',
        },
        {
          command: '我现在应该做什么',
          description: '获取当前时间段应该执行的任务',
        },
        {
          command: '删除任务：[任务名称]',
          description: '删除指定的任务',
          example: '删除任务：写报告',
        },
        {
          command: '修改任务：[任务名称] 为 [新时间]',
          description: '修改任务的时间',
          example: '修改任务：写报告 改为下午5点',
        },
      ],
    },
    {
      title: '成长查询指令',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500',
      commands: [
        {
          command: '我的成长进度',
          description: '查看总体成长值和进度',
        },
        {
          command: '专注力现在多少了',
          description: '查看专注力维度的当前值',
        },
        {
          command: '离月入10万还有多远',
          description: '查看长期目标的完成进度',
        },
        {
          command: '播放今天的成长故事',
          description: '生成并播放今日成长故事',
        },
        {
          command: '我的坏习惯情况',
          description: '查看坏习惯追踪数据',
        },
      ],
    },
    {
      title: '系统控制指令',
      icon: <Settings className="w-5 h-5" />,
      color: 'from-orange-500 to-red-500',
      commands: [
        {
          command: '开始专注模式',
          description: '启动专注模式，屏蔽干扰',
        },
        {
          command: '暂停10分钟',
          description: '暂停当前任务，休息指定时长',
        },
        {
          command: '跳过这个任务',
          description: '跳过当前任务，进入下一个',
        },
        {
          command: '兑换奖励：一杯奶茶',
          description: '使用金币兑换奖励',
        },
        {
          command: '设置提醒：下午3点开会',
          description: '设置定时提醒',
        },
      ],
    },
    {
      title: '情感支持指令',
      icon: <Heart className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500',
      commands: [
        {
          command: '我不想工作了',
          description: 'Kiki 会给你情感支持和建议',
        },
        {
          command: '我感觉很累',
          description: '获得休息建议和鼓励',
        },
        {
          command: '给我一点鼓励',
          description: 'Kiki 会给你加油打气',
        },
        {
          command: '庆祝一下',
          description: '庆祝你的成就',
        },
        {
          command: '讲个笑话',
          description: 'Kiki 会讲个笑话让你放松',
        },
      ],
    },
  ];

  return (
    <>
      {/* 教程按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 z-50 px-4 py-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm font-medium text-neutral-700 hover:scale-105"
      >
        <Mic className="w-4 h-4 text-primary-500" />
        语音指令帮助
      </button>

      {/* 教程弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-purple-50">
              <div>
                <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                  <span className="text-2xl">🎤</span>
                  Kiki 宝宝语音助手使用教程
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  点击右下角 🎤 或说"Kiki宝宝"唤醒，8秒内发出指令
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* 基础唤醒说明 */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                基础唤醒
              </h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <div>
                    <strong>唤醒方式：</strong>点击右下角 🎤 Kiki宝宝图标，或直接说"Kiki宝宝"
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <div>
                    <strong>唤醒响应：</strong>界面出现声波动画，AI语音回应"我在，请说"，进入8秒待命状态
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <div>
                    <strong>待命状态：</strong>8秒内可以发出指令，界面显示倒计时，8秒无指令则自动休眠
                  </div>
                </div>
              </div>
            </div>

            {/* 指令分类 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                常用语音指令
              </h3>

              <div className="space-y-3">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-colors"
                  >
                    {/* 分类标题 */}
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                      className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${category.color} text-white hover:opacity-90 transition-opacity`}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="font-semibold">{category.title}</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          {category.commands.length} 个指令
                        </span>
                      </div>
                      {expandedCategory === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    {/* 指令列表 */}
                    {expandedCategory === index && (
                      <div className="p-4 bg-neutral-50 space-y-3">
                        {category.commands.map((cmd, cmdIndex) => (
                          <div
                            key={cmdIndex}
                            className="bg-white rounded-lg p-3 border border-neutral-200"
                          >
                            <div className="flex items-start gap-2 mb-1">
                              <span className="text-primary-500 font-mono text-sm mt-0.5">▶</span>
                              <div className="flex-1">
                                <div className="font-medium text-neutral-800 text-sm mb-1">
                                  {cmd.command}
                                </div>
                                <div className="text-xs text-neutral-600">
                                  {cmd.description}
                                </div>
                                {cmd.example && (
                                  <div className="mt-2 px-3 py-2 bg-neutral-100 rounded text-xs text-neutral-700 font-mono">
                                    示例：{cmd.example}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 交互技巧 */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-neutral-200">
              <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                语音交互技巧
              </h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>自然语言：</strong>可以说完整句子，不用特定格式，支持上下文理解
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>多轮对话：</strong>Kiki 会引导你完成复杂操作，可以分步骤交互
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>语音反馈：</strong>成功操作会积极肯定，失败会给出改进建议
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                开始使用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

