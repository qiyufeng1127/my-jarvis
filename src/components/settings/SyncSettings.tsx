import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Clock, Smartphone, Monitor, Tablet } from 'lucide-react';

interface SyncCode {
  code: string;
  expiresAt: Date;
  isExpired: boolean;
}

export default function SyncSettings() {
  const [syncCode, setSyncCode] = useState<SyncCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成6位同步码
  const generateSyncCode = () => {
    setIsGenerating(true);
    
    // 生成随机6位数字码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10分钟后过期

    setTimeout(() => {
      setSyncCode({
        code,
        expiresAt,
        isExpired: false,
      });
      setIsGenerating(false);
      
      // 保存到 localStorage
      localStorage.setItem('syncCode', JSON.stringify({ code, expiresAt: expiresAt.toISOString() }));
    }, 500);
  };

  // 复制同步码
  const copySyncCode = () => {
    if (syncCode) {
      navigator.clipboard.writeText(syncCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 检查同步码是否过期
  useEffect(() => {
    if (!syncCode) return;

    const checkExpiration = setInterval(() => {
      if (new Date() > syncCode.expiresAt) {
        setSyncCode(prev => prev ? { ...prev, isExpired: true } : null);
      }
    }, 1000);

    return () => clearInterval(checkExpiration);
  }, [syncCode]);

  // 加载已保存的同步码
  useEffect(() => {
    const saved = localStorage.getItem('syncCode');
    if (saved) {
      try {
        const { code, expiresAt } = JSON.parse(saved);
        const expireDate = new Date(expiresAt);
        const isExpired = new Date() > expireDate;
        
        if (!isExpired) {
          setSyncCode({ code, expiresAt: expireDate, isExpired: false });
        }
      } catch (error) {
        console.error('加载同步码失败:', error);
      }
    }
  }, []);

  // 计算剩余时间
  const getRemainingTime = () => {
    if (!syncCode || syncCode.isExpired) return '已过期';
    
    const now = new Date();
    const diff = syncCode.expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">☁️ 云同步设置</h1>
          <p className="text-blue-100">在多个设备间同步你的数据</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 同步码生成区域 */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔑 生成同步码</h2>
            
            {!syncCode || syncCode.isExpired ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  生成一个临时同步码，在其他设备上输入此码即可同步数据
                </p>
                <button
                  onClick={generateSyncCode}
                  disabled={isGenerating}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? '生成中...' : '生成同步码'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 同步码显示 */}
                <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">你的同步码</div>
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wider mb-4">
                      {syncCode.code}
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={copySyncCode}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={generateSyncCode}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>重新生成</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 倒计时 */}
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">有效期剩余：</span>
                  <span className="font-mono font-bold text-orange-600">
                    {getRemainingTime()}
                  </span>
                </div>

                {/* 使用说明 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📱 如何使用</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>在另一台设备上打开 ManifestOS</li>
                    <li>进入"云同步设置"</li>
                    <li>点击"输入同步码"</li>
                    <li>输入上方的6位数字码</li>
                    <li>等待数据同步完成</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* 输入同步码区域 */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📥 输入同步码</h2>
            <p className="text-gray-600 mb-4">
              在其他设备上生成了同步码？在这里输入以同步数据
            </p>
            
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="输入6位同步码"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-lg border-2 border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl font-mono tracking-wider"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:scale-105 transition-all">
                开始同步
              </button>
            </div>
          </div>

          {/* 已连接设备 */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 已连接设备</h2>
            
            <div className="space-y-3">
              {/* 当前设备 */}
              <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">当前设备</div>
                      <div className="text-sm text-gray-500">Windows PC · 最后同步：刚刚</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    在线
                  </span>
                </div>
              </div>

              {/* 示例设备 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">iPhone 15</div>
                      <div className="text-sm text-gray-500">最后同步：2小时前</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    离线
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              💡 提示：使用同步码连接新设备后，设备会自动出现在这里
            </div>
          </div>

          {/* 同步设置 */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ 同步设置</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">自动同步</div>
                  <div className="text-sm text-gray-500">在后台自动同步数据</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">同步照片</div>
                  <div className="text-sm text-gray-500">同步任务验证照片</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">同步间隔</div>
                  <div className="text-sm text-gray-500">自动同步的时间间隔</div>
                </div>
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>5分钟</option>
                  <option>15分钟</option>
                  <option>30分钟</option>
                  <option>1小时</option>
                </select>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">安全提示</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 同步码仅在10分钟内有效，过期后需重新生成</li>
                  <li>• 请勿将同步码分享给他人</li>
                  <li>• 所有数据传输均经过加密处理</li>
                  <li>• 可以随时断开设备连接</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

