import { useState, useEffect } from 'react';
import { useSyncStore } from '@/stores/syncStore';
import { syncCodeService } from '@/services/syncCodeService';
import { X, Copy, Check, Smartphone, Monitor, Tablet } from 'lucide-react';

interface CloudSyncSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CloudSyncSettings({ isOpen, onClose }: CloudSyncSettingsProps) {
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

  // 加载设备列表
  useEffect(() => {
    if (isInSyncGroup) {
      loadDevices();
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
      await joinSyncCode(inputCode);
      setInputCode('');
      await loadDevices();
    } catch (err: any) {
      setError(err.message || '加入失败，请检查同步码是否正确');
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
      return <Smartphone className="w-5 h-5" />;
    }
    if (deviceName.includes('Android')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">☁️ 云同步</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 什么是云同步码？</h3>
            <p className="text-sm text-blue-800">
              云同步码是一个6位数字，用于在多个设备间同步数据。
              在一个设备上生成同步码，在其他设备上输入这个码，就能实现多端同步。
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!isInSyncGroup ? (
            <>
              {/* 生成同步码 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">🔑 还没有同步码？</h3>
                <button
                  onClick={handleGenerate}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  生成同步码
                </button>
                <p className="text-xs text-gray-500 text-center">
                  生成同步码后，可以在其他设备上输入这个码来同步数据
                </p>
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
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">📱 已有同步码？</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="输入6位数字同步码"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={inputCode.length !== 6}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    加入
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  输入其他设备生成的同步码，加入同步组
                </p>
              </div>
            </>
          ) : (
            <>
              {/* 当前同步码 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">🔑 当前同步码</h3>
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-blue-600 tracking-wider">
                      {syncCode}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="复制同步码"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  将这个同步码分享给其他设备，即可实现多端同步
                </p>
              </div>

              {/* 同步状态 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">📊 同步状态</h3>
                  <button
                    onClick={syncNow}
                    disabled={isSyncing}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? '同步中...' : '立即同步'}
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">📱 已连接设备</h3>
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="text-gray-600">
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
                    </div>
                  ))}
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
        </div>
      </div>
    </div>
  );
}

