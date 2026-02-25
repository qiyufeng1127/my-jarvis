import { useState, useEffect } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { Key, Check, X, AlertCircle, ExternalLink, Mic } from 'lucide-react';
import { baiduVoiceRecognition } from '@/services/baiduVoiceRecognition';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const { config, setApiKey, setApiEndpoint, setModel, isConfigured } = useAIStore();
  const [localApiKey, setLocalApiKey] = useState(config.apiKey || '');
  const [localEndpoint, setLocalEndpoint] = useState(config.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions');
  const [localModel, setLocalModel] = useState(config.model || 'deepseek-chat');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // 百度语音识别配置
  const [baiduVoiceApiKey, setBaiduVoiceApiKey] = useState('');
  const [baiduVoiceSecretKey, setBaiduVoiceSecretKey] = useState('');
  const [showBaiduVoiceKey, setShowBaiduVoiceKey] = useState(false);

  // 当配置加载后，自动填充到表单
  useEffect(() => {
    if (config.apiKey) {
      setLocalApiKey(config.apiKey);
      console.log('✅ 已自动填充 API Key');
    }
    if (config.apiEndpoint) {
      setLocalEndpoint(config.apiEndpoint);
    }
    if (config.model) {
      setLocalModel(config.model);
    }
    
    // 加载百度语音配置
    const voiceApiKey = localStorage.getItem('baidu_voice_api_key');
    const voiceSecretKey = localStorage.getItem('baidu_voice_secret_key');
    if (voiceApiKey) setBaiduVoiceApiKey(voiceApiKey);
    if (voiceSecretKey) setBaiduVoiceSecretKey(voiceSecretKey);
  }, [config.apiKey, config.apiEndpoint, config.model]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(localApiKey);
    setApiEndpoint(localEndpoint);
    setModel(localModel);
    
    // 保存百度语音配置
    if (baiduVoiceApiKey && baiduVoiceSecretKey) {
      baiduVoiceRecognition.configure(baiduVoiceApiKey, baiduVoiceSecretKey);
    }
    
    console.log('💾 AI 配置已保存到 localStorage');
    alert('✅ AI 配置已保存！\n\n配置会自动保存到本地，刷新页面后依然有效。');
    onClose();
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const response = await fetch(localEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localApiKey}`,
        },
        body: JSON.stringify({
          model: localModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 3000);
      }
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
        {/* 醒目的头部 */}
        <div className="bg-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI 配置</h2>
                <p className="text-sm opacity-90">配置 API Key 以启用智能功能</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
            {isConfigured() ? (
              <>
                <Check className="w-5 h-5 text-green-300" />
                <span className="text-sm">✅ AI 功能已启用</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">⚠️ 需要配置 API Key</span>
              </>
            )}
          </div>
        </div>

        {/* 配置表单 */}
        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              🔑 API Key *
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-24 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm font-mono text-gray-900"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-900"
              >
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p>💡 支持 OpenAI、Claude、国内大模型等</p>
              <p>🔒 API Key 仅保存在本地浏览器，不会上传到服务器</p>
            </div>
          </div>

          {/* API 端点 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              🌐 API 端点
            </label>
            <input
              type="text"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="https://api.deepseek.com/v1/chat/completions"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm font-mono text-gray-900"
            />
            <div className="mt-2 text-xs text-gray-600">
              <p>常用端点：</p>
              <ul className="mt-1 space-y-1 ml-4">
                <li>• DeepSeek: https://api.deepseek.com/v1/chat/completions</li>
                <li>• OpenAI: https://api.openai.com/v1/chat/completions</li>
                <li>• 国内中转: 根据你的中转服务商提供的地址</li>
              </ul>
            </div>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              🤖 模型
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm cursor-pointer text-gray-900"
            >
              <option value="deepseek-chat">DeepSeek Chat (推荐)</option>
              <option value="deepseek-coder">DeepSeek Coder</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>

          {/* 测试连接 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">🧪 测试连接</span>
              <button
                onClick={handleTest}
                disabled={!localApiKey || testStatus === 'testing'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testStatus === 'testing' ? '测试中...' : '测试'}
              </button>
            </div>
            {testStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                <span>✅ 连接成功！</span>
              </div>
            )}
            {testStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <X className="w-4 h-4" />
                <span>❌ 连接失败，请检查配置</span>
              </div>
            )}
          </div>

          {/* 获取 API Key 指南 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📚 如何获取 API Key？</h3>
            <div className="space-y-2 text-xs text-blue-800">
              <div>
                <strong>DeepSeek (推荐):</strong>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                >
                  前往获取
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <div>
                <strong>OpenAI:</strong>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                >
                  前往获取
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p>💡 提示：DeepSeek 是国内大模型，速度快、价格便宜、效果好</p>
              </div>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">✨ 启用后可使用的功能</h3>
            <ul className="space-y-1 text-xs text-purple-800">
              <li>✅ 智能识别心情、碎碎念、待办、成功、感恩</li>
              <li>✅ 自动打情绪和分类标签（不再依赖关键词）</li>
              <li>✅ 智能任务分解到时间轴</li>
              <li>✅ 自然语言对话</li>
              <li>✅ 生成个性化成长故事</li>
              <li>✅ AI 改进建议</li>
            </ul>
          </div>

          {/* 百度语音识别配置 */}
          <div className="border-t-4 border-gray-200 pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mic className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">🎤 百度语音识别配置</h3>
            </div>
            
            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  🔑 百度语音 API Key
                </label>
                <div className="relative">
                  <input
                    type={showBaiduVoiceKey ? 'text' : 'password'}
                    value={baiduVoiceApiKey}
                    onChange={(e) => setBaiduVoiceApiKey(e.target.value)}
                    placeholder="输入百度语音识别 API Key"
                    className="w-full px-4 py-3 pr-24 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-mono text-gray-900"
                  />
                  <button
                    onClick={() => setShowBaiduVoiceKey(!showBaiduVoiceKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-900"
                  >
                    {showBaiduVoiceKey ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  🔐 百度语音 Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showBaiduVoiceKey ? 'text' : 'password'}
                    value={baiduVoiceSecretKey}
                    onChange={(e) => setBaiduVoiceSecretKey(e.target.value)}
                    placeholder="输入百度语音识别 Secret Key"
                    className="w-full px-4 py-3 pr-24 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-mono text-gray-900"
                  />
                  <button
                    onClick={() => setShowBaiduVoiceKey(!showBaiduVoiceKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-900"
                  >
                    {showBaiduVoiceKey ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>

              {/* 获取指南 */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-900 mb-2">📚 如何获取百度语音 API？</h4>
                <div className="space-y-2 text-xs text-green-800">
                  <p><strong>步骤 1:</strong> 访问百度智能云控制台</p>
                  <a
                    href="https://console.bce.baidu.com/ai/#/ai/speech/overview/index"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-800 underline"
                  >
                    前往百度语音识别控制台
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <p><strong>步骤 2:</strong> 创建应用，选择"语音识别"</p>
                  <p><strong>步骤 3:</strong> 在应用列表中找到 API Key 和 Secret Key</p>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p>💡 提示：百度语音识别每天有免费额度，适合个人使用</p>
                  </div>
                </div>
              </div>

              {/* 功能说明 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">✨ 配置后可使用的功能</h4>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li>✅ 免手模式语音控制</li>
                  <li>✅ 口语化指令识别（下一个任务、删除今天的任务等）</li>
                  <li>✅ 语音创建和管理任务</li>
                  <li>✅ 语音查询任务进度</li>
                  <li>✅ 更准确的语音识别（相比浏览器内置）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!localApiKey}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            💾 保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

