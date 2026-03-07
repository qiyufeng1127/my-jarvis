import React from 'react';
import AIAssistantChat from '@/components/ai/AIAssistantChat';

/**
 * AI 助手测试页面
 */
export default function AIAssistantTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI 助手测试
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            测试完整的 AI 系统提示词和性格设置
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <AIAssistantChat />
        </div>
        
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            测试用例
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                1. 任务创建
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>"5分钟后洗漱，然后洗衣服"</li>
                <li>"明天下午2点开会"</li>
                <li>"1小时后去健身房"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                2. 碎碎念（语义理解测试）
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>"今天不小心把代码都删了，好烦"（应识别为碎碎念，不是删除任务）</li>
                <li>"啊啊啊好烦今天什么都不顺"</li>
                <li>"今天心情不错"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                3. 记账
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>"午餐花了50块"</li>
                <li>"今天赚了200元"</li>
                <li>"买了一件衣服，花了300"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                4. 纯对话
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>"你好"</li>
                <li>"今天天气真好"</li>
                <li>"我有点累了"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                5. 性格测试
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                点击设置按钮，切换不同的性格类型，观察 AI 回复风格的变化：
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                <li>温柔鼓励型：温暖、体贴</li>
                <li>严格督促型：直接、严格</li>
                <li>幽默吐槽型：调侃、轻松</li>
                <li>理性分析型：数据、专业</li>
                <li>闺蜜陪伴型：亲密、八卦</li>
                <li>佛系随和型：随和、不评判</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

