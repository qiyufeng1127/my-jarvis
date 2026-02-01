import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Users } from 'lucide-react';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '@/lib/supabase';

interface SyncCodeManagerProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function SyncCodeManager({ isDark = false, bgColor = '#ffffff' }: SyncCodeManagerProps) {
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 加载当前同步码
  useEffect(() => {
    loadSyncCode();
    loadConnectedDevices();
  }, []);

  // 生成随机同步码（6位纯数字）
  const generateSyncCode = (): string => {
    // 生成 100000 到 999999 之间的随机数字
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  };

  // 加载同步码
  const loadSyncCode = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const userId = getCurrentUserId();
      const { data, error } = await supabase
        .from('sync_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有同步码，这是正常的
          console.log('ℹ️ 暂无同步码');
        } else {
          console.error('❌ 加载同步码失败：', error);
        }
      } else if (data) {
        setSyncCode(data.sync_code);
      }
    } catch (error) {
      console.error('❌ 加载同步码时发生异常：', error);
    }
  };

  // 加载已连接设备
  const loadConnectedDevices = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const userId = getCurrentUserId();
      const { data, error } = await supabase
        .from('connected_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_sync', { ascending: false });

      if (error) {
        console.error('❌ 加载设备列表失败：', error);
      } else if (data) {
        setConnectedDevices(data);
      }
    } catch (error) {
      console.error('❌ 加载设备列表时发生异常：', error);
    }
  };

  // 创建新的同步码
  const handleGenerateCode = async () => {
    if (!isSupabaseConfigured()) {
      alert('❌ Supabase 未配置，无法生成同步码');
      return;
    }

    setIsLoading(true);
    try {
      const userId = getCurrentUserId();
      const newCode = generateSyncCode();

      // 保存到数据库
      const { error } = await supabase
        .from('sync_codes')
        .upsert({
          user_id: userId,
          sync_code: newCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ 生成同步码失败：', error);
        alert('生成同步码失败，请重试');
      } else {
        setSyncCode(newCode);
        
        // 记录当前设备
        await registerCurrentDevice(newCode);
        
        alert('✅ 同步码生成成功！');
      }
    } catch (error) {
      console.error('❌ 生成同步码时发生异常：', error);
      alert('生成同步码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 注册当前设备
  const registerCurrentDevice = async (code: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const userId = getCurrentUserId();
      const deviceInfo = {
        user_id: userId,
        sync_code: code,
        device_name: getDeviceName(),
        device_type: getDeviceType(),
        last_sync: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('connected_devices')
        .upsert(deviceInfo, {
          onConflict: 'user_id,device_name'
        });

      if (error) {
        console.error('❌ 注册设备失败：', error);
      } else {
        loadConnectedDevices();
      }
    } catch (error) {
      console.error('❌ 注册设备时发生异常：', error);
    }
  };

  // 获取设备名称
  const getDeviceName = (): string => {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    return '未知设备';
  };

  // 获取设备类型
  const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|Android/.test(ua)) return 'mobile';
    return 'desktop';
  };

  // 加入已有同步码
  const handleJoinCode = async () => {
    if (!inputCode.trim()) {
      alert('请输入同步码');
      return;
    }

    if (!isSupabaseConfigured()) {
      alert('❌ Supabase 未配置，无法加入同步');
      return;
    }

    setIsLoading(true);
    try {
      // 验证同步码是否存在
      const { data, error } = await supabase
        .from('sync_codes')
        .select('*')
        .eq('sync_code', inputCode.toUpperCase().replace(/\s/g, ''))
        .single();

      if (error || !data) {
        alert('❌ 同步码不存在或已失效');
        setIsLoading(false);
        return;
      }

      // 将当前用户ID关联到这个同步码
      const userId = getCurrentUserId();
      
      // 创建或更新当前用户的同步码记录
      const { error: updateError } = await supabase
        .from('sync_codes')
        .upsert({
          user_id: userId,
          sync_code: data.sync_code,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('❌ 加入同步失败：', updateError);
        alert('加入同步失败，请重试');
      } else {
        setSyncCode(data.sync_code);
        
        // 注册当前设备
        await registerCurrentDevice(data.sync_code);
        
        setShowJoinModal(false);
        setInputCode('');
        alert('✅ 成功加入同步！现在你的数据将与其他设备同步。');
      }
    } catch (error) {
      console.error('❌ 加入同步时发生异常：', error);
      alert('加入同步失败，请重试');
    } finally {
      setIsLoading(false);
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

  // 重新生成同步码
  const handleRegenerate = async () => {
    if (!confirm('重新生成同步码后，其他设备需要重新输入新的同步码才能继续同步。确定要继续吗？')) {
      return;
    }
    await handleGenerateCode();
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base" style={{ color: textColor }}>🔗 云同步码</h4>

      {/* 说明卡片 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-2" style={{ color: textColor }}>💡 什么是云同步码？</div>
        <div className="text-xs leading-relaxed" style={{ color: accentColor }}>
          云同步码是一个唯一的6位数字代码，用于在多个设备间同步数据。生成同步码后，在其他设备上输入相同的同步码，即可实现数据同步。
        </div>
      </div>

      {/* 当前同步码 */}
      {syncCode ? (
        <div className="space-y-3">
          <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
            <div className="text-sm mb-3" style={{ color: textColor }}>你的同步码</div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl font-mono font-bold tracking-wider" style={{ color: textColor }}>
                {syncCode}
              </div>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{ backgroundColor: buttonBg }}
                title="复制同步码"
              >
                {copied ? (
                  <Check className="w-5 h-5" style={{ color: '#4ade80' }} />
                ) : (
                  <Copy className="w-5 h-5" style={{ color: textColor }} />
                )}
              </button>
            </div>
            <div className="text-xs" style={{ color: accentColor }}>
              在其他设备上输入此同步码即可同步数据
            </div>
          </div>

          {/* 已连接设备 */}
          <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                <Users className="w-4 h-4 inline mr-1" />
                已连接设备 ({connectedDevices.length})
              </div>
              <button
                onClick={loadConnectedDevices}
                className="p-1 rounded transition-all hover:scale-110"
                style={{ backgroundColor: buttonBg }}
                title="刷新设备列表"
              >
                <RefreshCw className="w-4 h-4" style={{ color: textColor }} />
              </button>
            </div>
            
            {connectedDevices.length > 0 ? (
              <div className="space-y-2">
                {connectedDevices.map((device, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: textColor }}>
                        {device.device_type === 'mobile' ? '📱' : '💻'} {device.device_name}
                      </div>
                      <div className="text-xs" style={{ color: accentColor }}>
                        最后同步: {new Date(device.last_sync).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-center py-4" style={{ color: accentColor }}>
                暂无已连接设备
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              <Copy className="w-4 h-4" />
              <span>复制同步码</span>
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
              style={{ 
                backgroundColor: buttonBg, 
                color: textColor,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新生成</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 生成同步码 */}
          <div className="rounded-lg p-6 text-center" style={{ backgroundColor: cardBg }}>
            <div className="text-4xl mb-3">🔗</div>
            <div className="text-sm font-medium mb-2" style={{ color: textColor }}>
              还没有同步码
            </div>
            <div className="text-xs mb-4" style={{ color: accentColor }}>
              生成同步码后，可以在多个设备间同步数据
            </div>
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ 
                backgroundColor: buttonBg, 
                color: textColor,
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? '生成中...' : '🎯 生成同步码'}
            </button>
          </div>

          {/* 加入已有同步码 */}
          <div className="rounded-lg p-6 text-center" style={{ backgroundColor: cardBg }}>
            <div className="text-4xl mb-3">📲</div>
            <div className="text-sm font-medium mb-2" style={{ color: textColor }}>
              已有同步码？
            </div>
            <div className="text-xs mb-4" style={{ color: accentColor }}>
              输入其他设备的同步码，加入同步
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              🔑 加入已有同步码
            </button>
          </div>
        </div>
      )}

      {/* 加入同步码弹窗 */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div 
            className="rounded-2xl shadow-2xl max-w-md w-full p-6"
            style={{ backgroundColor: bgColor }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: textColor }}>
              加入已有同步码
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                输入同步码
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="例如：123456"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg text-center text-lg font-mono tracking-wider"
                style={{
                  backgroundColor: cardBg,
                  color: textColor,
                  border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                }}
              />
              <div className="text-xs mt-2" style={{ color: accentColor }}>
                💡 输入其他设备上显示的6位数字同步码
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setInputCode('');
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ backgroundColor: cardBg, color: textColor }}
              >
                取消
              </button>
              <button
                onClick={handleJoinCode}
                disabled={isLoading || !inputCode.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ 
                  backgroundColor: buttonBg, 
                  color: textColor,
                  opacity: (isLoading || !inputCode.trim()) ? 0.5 : 1,
                }}
              >
                {isLoading ? '加入中...' : '确认加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

