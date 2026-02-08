import { useState, useEffect } from 'react';
import { Smartphone, Monitor, Download, Upload, Trash2, Edit2, Check, X } from 'lucide-react';
import { useDeviceStore } from '@/stores/deviceStore';
import { DeviceIdentityService } from '@/services/deviceIdentityService';
import { PersistentStorageService } from '@/services/persistentStorageService';

interface DeviceSettingsProps {
  isDark?: boolean;
}

export default function DeviceSettings({ isDark = false }: DeviceSettingsProps) {
  const { identity, updateDeviceName, updateDeviceAvatar, clearAllData } = useDeviceStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [storageInfo, setStorageInfo] = useState(PersistentStorageService.getStorageInfo());

  useEffect(() => {
    // 定期更新存储信息
    const interval = setInterval(() => {
      setStorageInfo(PersistentStorageService.getStorageInfo());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  if (!identity) {
    return (
      <div className="p-6 text-center" style={{ color: secondaryColor }}>
        <p>正在加载设备信息...</p>
      </div>
    );
  }

  const handleStartEditName = () => {
    setEditedName(identity.deviceName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateDeviceName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSelectAvatar = (avatar: string) => {
    updateDeviceAvatar(avatar);
    setShowAvatarPicker(false);
  };

  const handleExportData = () => {
    const data = PersistentStorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifestos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          PersistentStorageService.importData(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const deviceIcon = identity.deviceType === 'mobile' ? Smartphone : Monitor;
  const DeviceIcon = deviceIcon;

  return (
    <div className="space-y-6 p-6">
      {/* 设备信息卡片 */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
          <DeviceIcon size={20} />
          设备信息
        </h3>

        <div className="space-y-4">
          {/* 设备头像和名称 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-5xl hover:scale-110 transition-transform cursor-pointer"
              title="点击更换头像"
            >
              {identity.avatar}
            </button>
            
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                    }}
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-lg hover:bg-green-500/20 transition-colors"
                    style={{ color: '#10B981' }}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    style={{ color: '#EF4444' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg" style={{ color: textColor }}>
                    {identity.deviceName}
                  </span>
                  <button
                    onClick={handleStartEditName}
                    className="p-1 rounded hover:bg-blue-500/20 transition-colors"
                    style={{ color: '#007AFF' }}
                    title="编辑设备名称"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              <div className="text-sm mt-1" style={{ color: secondaryColor }}>
                {identity.deviceType === 'mobile' ? '📱 手机设备' : '💻 电脑设备'} • {identity.browser}
              </div>
            </div>
          </div>

          {/* 头像选择器 */}
          {showAvatarPicker && (
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${borderColor}`,
              }}
            >
              <div className="text-sm font-medium mb-2" style={{ color: textColor }}>
                选择头像：
              </div>
              <div className="grid grid-cols-8 gap-2">
                {DeviceIdentityService.getAvatarPool().map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAvatar(avatar)}
                    className="text-3xl hover:scale-125 transition-transform cursor-pointer"
                    title={`选择 ${avatar}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 设备ID */}
          <div>
            <div className="text-sm font-medium mb-1" style={{ color: textColor }}>
              设备唯一ID
            </div>
            <div
              className="px-3 py-2 rounded-lg font-mono text-sm"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${borderColor}`,
                color: secondaryColor,
              }}
            >
              {identity.deviceId}
            </div>
            <div className="text-xs mt-1" style={{ color: secondaryColor }}>
              💡 此ID永久绑定当前设备和浏览器，用于数据持久化
            </div>
          </div>

          {/* 创建时间 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1" style={{ color: textColor }}>
                创建时间
              </div>
              <div style={{ color: secondaryColor }}>
                {new Date(identity.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1" style={{ color: textColor }}>
                最后访问
              </div>
              <div style={{ color: secondaryColor }}>
                {new Date(identity.lastAccessAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 存储信息卡片 */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          📊 存储使用情况
        </h3>

        <div className="space-y-3">
          {/* 存储进度条 */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: textColor }}>已使用</span>
              <span style={{ color: secondaryColor }}>
                {storageInfo.usedMB} MB / {storageInfo.totalMB} MB
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(storageInfo.percentage, 100)}%`,
                  backgroundColor: storageInfo.percentage > 80 ? '#EF4444' : storageInfo.percentage > 50 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
            <div className="text-xs mt-1" style={{ color: secondaryColor }}>
              {storageInfo.percentage.toFixed(1)}% 已使用
            </div>
          </div>

          {/* 存储说明 */}
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid rgba(59, 130, 246, 0.2)`,
              color: '#3B82F6',
            }}
          >
            💡 <strong>数据持久化说明：</strong>
            <br />
            • 所有数据存储在本地，不占用云端资源
            <br />
            • 数据与设备ID绑定，刷新页面不会丢失
            <br />
            • 仅在手动清除时才会删除数据
          </div>
        </div>
      </div>

      {/* 数据管理卡片 */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
          🔧 数据管理
        </h3>

        <div className="space-y-3">
          {/* 导出数据 */}
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: '#007AFF',
              color: '#ffffff',
            }}
          >
            <Download size={18} />
            导出所有数据（备份）
          </button>

          {/* 导入数据 */}
          <button
            onClick={handleImportData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: '#10B981',
              color: '#ffffff',
            }}
          >
            <Upload size={18} />
            导入数据（恢复）
          </button>

          {/* 清除所有数据 */}
          <button
            onClick={clearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: '#EF4444',
              color: '#ffffff',
            }}
          >
            <Trash2 size={18} />
            清除所有本地数据
          </button>

          {/* 警告提示 */}
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              border: `1px solid rgba(239, 68, 68, 0.2)`,
              color: '#EF4444',
            }}
          >
            ⚠️ <strong>警告：</strong>清除数据将删除所有本地内容，包括任务、收集箱、标签、设置等，此操作不可恢复！建议先导出备份。
          </div>
        </div>
      </div>
    </div>
  );
}






