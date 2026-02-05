import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Smartphone, Monitor, Tablet, X } from 'lucide-react';
import { useSyncStore } from '@/stores/syncStore';
import { syncCodeService } from '@/services/syncCodeService';

export default function SyncSettings() {
  const { 
    syncCode, 
    isInSyncGroup, 
    isSyncing,
    lastSyncTime,
    generateSyncCode, 
    joinSyncCode, 
    leaveSyncGroup,
    syncNow,
  } = useSyncStore();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  // 加载设备列表
  useEffect(() => {
    if (isInSyncGroup) {
      loadDevices();
      const interval = setInterval(loadDevices, 30000); // 每30秒刷新
      return () => clearInterval(interval);
    }
  }, [isInSyncGroup]);

  const loadDevices = async () => {
    const deviceList = await syncCodeService.getDevices();
    setDevices(deviceList);
  };

  // 生成同步码
  const handleGenerate = async () => {
    try {
      setError('');
      await generateSyncCode();
      await loadDevices();
    } catch (err: any) {
      setError(err.message || '生成失败');
    }
  };

  // 加入同步码
  const handleJoin = async () => {
    if (!inputCode || inputCode.length !== 6) {
      setError('请输入6位数字同步码');
      return;
    }

    try {
      setError('');
      console.log('开始加入同步码:', inputCode);
      await joinSyncCode(inputCode);
      console.log('加入成功');
      setInputCode('');
      setShowJoinInput(false);
      await loadDevices();
      alert('✅ 加入同步组成功！');
    } catch (err: any) {
      console.error('加入失败:', err);
      const errorMsg = err.message || '加入失败，请检查同步码是否正确';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    }
  };

  // 退出同步组
  const handleLeave = async () => {
    if (!confirm('确定要退出同步组吗？退出后将无法继续同步数据。')) {
      return;
    }

    try {
      await leaveSyncGroup();
      setDevices([]);
    } catch (err: any) {
      setError(err.message || '退出失败');
    }
  };

  // 复制同步码
  const handleCopy = () => {
    if (syncCode) {
      navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 获取设备图标
  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('iPhone') || deviceName.includes('iPad')) {
      return <Smartphone className="w-6 h-6 text-blue-600" />;
    }
    if (deviceName.includes('Android')) {
      return <Tablet className="w-6 h-6 text-green-600" />;
    }
    return <Monitor className="w-6 h-6 text-purple-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">☁️ 云同步设置</h1>
          <p className="text-blue-100">使用同步码在多个设备间同步数据</p>
        </div>

        <div className="p-6 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!isInSyncGroup ? (
            <>
              {/* 未加入同步组 - 显示生成和加入选项 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔑 还没有同步码？</h2>
                <p className="text-gray-600 mb-4">
                  生成一个永久有效的同步码，可以在任意数量的设备上使用
                </p>
                <button
                  onClick={handleGenerate}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-105 transition-all font-medium"
                >
                  生成同步码
                </button>
              </div>

              {/* 分隔线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              {/* 加入同步码 */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 已有同步码？</h2>
                
                {!showJoinInput ? (
                  <button
                    onClick={() => setShowJoinInput(true)}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:scale-105 transition-all font-medium"
                  >
                    加入已有同步码
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="输入6位数字"
                        className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl font-mono tracking-wider"
                        maxLength={6}
                      />
                      <button
                        onClick={handleJoin}
                        disabled={inputCode.length !== 6}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        加入
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowJoinInput(false);
                        setInputCode('');
                        setError('');
                      }}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              {/* 说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 什么是云同步码？</h3>
                <p className="text-sm text-blue-800 mb-2">
                  云同步码是一个6位数字，用于在多个设备间同步数据。
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>同步码永久有效，不会过期</li>
                  <li>可以在无限个设备上使用</li>
                  <li>数据每30秒自动同步一次</li>
                  <li>在后台同步，不影响使用</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* 已加入同步组 - 显示同步码和设备列表 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔑 当前同步码</h2>
                <div className="flex items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-300">
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-wider">
                      {syncCode}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                    title="复制同步码"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  将这个同步码分享给其他设备，即可实现多端同步
                </p>
              </div>

              {/* 同步状态 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">📊 同步状态</h2>
                  <button
                    onClick={syncNow}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? '同步中...' : '立即同步'}
                  </button>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">上次同步</span>
                    <span className="text-gray-900 font-medium">
                      {lastSyncTime 
                        ? lastSyncTime.toLocaleTimeString('zh-CN')
                        : '从未同步'
                      }
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    💡 数据会在后台自动同步，每30秒一次
                  </div>
                </div>
              </div>

              {/* 设备列表 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 已连接设备</h2>
                <div className="space-y-3">
                  {devices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      还没有设备连接
                    </div>
                  ) : (
                    devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          {getDeviceIcon(device.device_name)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {device.device_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            最后活跃: {new Date(device.last_active_at).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          在线
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 退出同步组 */}
              <button
                onClick={handleLeave}
                className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                退出同步组
              </button>
            </>
          )}

          {/* 安全提示 */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🔒</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">安全提示</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 同步码永久有效，请妥善保管</li>
                  <li>• 请勿将同步码分享给他人</li>
                  <li>• 所有数据传输均经过加密处理</li>
                  <li>• 可以随时退出同步组</li>
                  <li>• 后台自动同步，不影响使用</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
