import { useState, useEffect } from 'react';
import { Brain, Key, Zap, Info } from 'lucide-react';

export default function BaiduAISettings() {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationThreshold, setVerificationThreshold] = useState(0.3);
  const [showKeys, setShowKeys] = useState(false);

  // 加载保存的设置
  useEffect(() => {
    const savedApiKey = localStorage.getItem('baidu_api_key') || '';
    const savedSecretKey = localStorage.getItem('baidu_secret_key') || '';
    const savedThreshold = localStorage.getItem('baidu_verification_threshold');
    
    setApiKey(savedApiKey);
    setSecretKey(savedSecretKey);
    setVerificationThreshold(savedThreshold ? parseFloat(savedThreshold) : 0.3);
  }, []);

  // 保存API密钥
  const handleSaveKeys = () => {
    localStorage.setItem('baidu_api_key', apiKey);
    localStorage.setItem('baidu_secret_key', secretKey);
    alert('✅ 百度AI密钥已保存');
  };

  // 保存验证阈值
  const handleThresholdChange = (value: number) => {
    setVerificationThreshold(value);
    localStorage.setItem('baidu_verification_threshold', value.toString());
  };

  // 获取阈值描述
  const getThresholdDescription = (threshold: number) => {
    if (threshold >= 0.9) {
      return {
        level: '🔴 极严格',
        desc: '必须完全匹配所有关键词，一个都不能少',
        example: '关键词：牙刷、牙膏、水龙头 → 必须全部识别到才通过'
      };
    } else if (threshold >= 0.7) {
      return {
        level: '🟠 很严格',
        desc: '需要匹配70%以上的关键词',
        example: '关键词：牙刷、牙膏、水龙头 → 至少识别到2个才通过'
      };
    } else if (threshold >= 0.5) {
      return {
        level: '🟡 较严格',
        desc: '需要匹配50%以上的关键词',
        example: '关键词：牙刷、牙膏、水龙头 → 至少识别到2个才通过'
      };
    } else if (threshold >= 0.3) {
      return {
        level: '🟢 适中（推荐）',
        desc: '需要匹配30%以上的关键词，支持同义词',
        example: '关键词：牙刷、牙膏、水龙头 → 识别到1个或相关物品即可通过'
      };
    } else if (threshold >= 0.2) {
      return {
        level: '🔵 宽松',
        desc: '需要匹配20%以上的关键词，大量同义词支持',
        example: '关键词：牙刷、牙膏、水龙头 → 识别到任意相关物品即可通过'
      };
    } else {
      return {
        level: '⚪ 极宽松',
        desc: '只要识别到任意一个关键词或相关物品即可',
        example: '关键词：牙刷、牙膏、水龙头 → 识别到洗漱相关的任何物品都通过'
      };
    }
  };

  const thresholdInfo = getThresholdDescription(verificationThreshold);

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          🤖 百度AI图像识别
        </h2>
      </div>

      {/* API密钥配置 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4" />
            API密钥配置
          </h3>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            {showKeys ? '隐藏' : '显示'}密钥
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              API Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入百度AI的API Key"
              className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
              Secret Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="请输入百度AI的Secret Key"
              className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
            />
          </div>

          <button
            onClick={handleSaveKeys}
            className="w-full px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            💾 保存密钥
          </button>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>如何获取密钥？</strong><br/>
            1. 访问 <a href="https://ai.baidu.com/" target="_blank" className="underline">百度AI开放平台</a><br/>
            2. 注册/登录账号<br/>
            3. 创建应用获取API Key和Secret Key<br/>
            4. 免费额度：500次/天
          </p>
        </div>
      </div>

      {/* 验证相似度设置 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            验证相似度（严格程度）
          </h3>
        </div>

        {/* 滑块 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {thresholdInfo.level}
            </span>
            <span className="text-sm font-bold text-blue-500">
              {(verificationThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={verificationThreshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>⚪ 极宽松</span>
            <span>🟢 适中</span>
            <span>🔴 极严格</span>
          </div>
        </div>

        {/* 当前设置说明 */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                {thresholdInfo.desc}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                📝 {thresholdInfo.example}
              </p>
            </div>
          </div>
        </div>

        {/* 详细说明 */}
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900">
          <h4 className="text-xs font-semibold mb-2 text-gray-800 dark:text-white">
            📊 各级别详细说明
          </h4>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex gap-2">
              <span className="font-semibold">🔴 90-100%:</span>
              <span>必须完全匹配，适合严格场景</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">🟠 70-89%:</span>
              <span>需要大部分匹配，较为严格</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">🟡 50-69%:</span>
              <span>需要一半以上匹配</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">🟢 30-49%:</span>
              <span>推荐设置，平衡严格与宽松</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">🔵 20-29%:</span>
              <span>较为宽松，容易通过</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold">⚪ 10-19%:</span>
              <span>极宽松，几乎都能通过</span>
            </div>
          </div>
        </div>

        {/* 同义词说明 */}
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <h4 className="text-xs font-semibold mb-2 text-green-800 dark:text-green-300">
            🔗 智能同义词匹配
          </h4>
          <p className="text-xs text-green-700 dark:text-green-300 mb-2">
            系统会自动识别相关物品，例如：
          </p>
          <div className="space-y-1 text-xs text-green-600 dark:text-green-400">
            <div>• <strong>牙刷</strong> ↔ 牙膏、洗漱台、洗面奶</div>
            <div>• <strong>水龙头</strong> ↔ 水槽、洗手台、杯子</div>
            <div>• <strong>厨房</strong> ↔ 灶台、冰箱、碗、锅</div>
            <div>• <strong>电脑</strong> ↔ iPad、平板、笔记本、键盘</div>
          </div>
        </div>
      </div>

      {/* 当前配置摘要 */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <h4 className="text-xs font-semibold mb-2 text-purple-800 dark:text-purple-300">
          ⚙️ 当前配置
        </h4>
        <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
          <div className="flex justify-between">
            <span>API状态:</span>
            <span className="font-medium">
              {apiKey && secretKey ? '✅ 已配置' : '❌ 未配置'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>验证严格度:</span>
            <span className="font-medium">{thresholdInfo.level}</span>
          </div>
          <div className="flex justify-between">
            <span>匹配阈值:</span>
            <span className="font-medium">{(verificationThreshold * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          ⚠️ <strong>注意：</strong>验证相似度设置会立即生效，影响所有任务的图像验证。建议先设置为30%（适中），根据实际使用情况调整。
        </p>
      </div>
    </div>
  );
}

