import { useState, useEffect } from 'react';
import { Bell, Volume2, Clock, TrendingUp, FileText, AlertTriangle, Coins } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

interface NotificationSettings {
  // 任务开始前提醒
  taskStartBeforeReminder: boolean;
  taskStartBeforeMinutes: number;
  // 任务开始时提醒
  taskStartReminder: boolean;
  // 任务进行中提醒
  taskDuringReminder: boolean;
  taskDuringMinutes: number;
  // 任务结束前提醒
  taskEndBeforeReminder: boolean;
  taskEndBeforeMinutes: number;
  // 任务结束时提醒
  taskEndReminder: boolean;
  // 验证提醒
  verificationStartReminder: boolean;
  verificationCompleteReminder: boolean;
  verificationUrgentReminder: boolean;
  // 其他提醒
  growthReminder: boolean;
  dailyReport: boolean;
  badHabitWarning: boolean;
  goldChange: boolean;
  // 新增：超时、扣币、拖延提醒
  overtimeReminder: boolean;
  goldDeductionReminder: boolean;
  procrastinationReminder: boolean;
  // 语音设置
  voiceEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  // 总通知开关：关闭后系统通知 / 语音 / 音效 / 震动全部停用
  browserNotification: boolean;
}

interface NotificationSettingsProps {
  isDark: boolean;
  accentColor: string;
}

export default function NotificationSettingsPanel({ isDark, accentColor }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    // 任务开始前提醒
    taskStartBeforeReminder: true,
    taskStartBeforeMinutes: 2,
    // 任务开始时提醒
    taskStartReminder: true,
    // 任务进行中提醒
    taskDuringReminder: false,
    taskDuringMinutes: 10,
    // 任务结束前提醒
    taskEndBeforeReminder: true,
    taskEndBeforeMinutes: 5,
    // 任务结束时提醒
    taskEndReminder: true,
    // 验证提醒
    verificationStartReminder: true,
    verificationCompleteReminder: true,
    verificationUrgentReminder: true,
    // 其他提醒
    growthReminder: true,
    dailyReport: true,
    badHabitWarning: true,
    goldChange: true,
    // 新增：超时、扣币、拖延提醒
    overtimeReminder: true,
    goldDeductionReminder: true,
    procrastinationReminder: true,
    // 语音设置
    voiceEnabled: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 0.8,
    browserNotification: true,
  });
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载设置
    const saved = localStorage.getItem('notification_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('加载通知设置失败:', e);
      }
    }
  }, []);

  useEffect(() => {
    // 保存设置到 localStorage
    localStorage.setItem('notification_settings', JSON.stringify(settings));
    // 通知服务重新加载设置
    notificationService.reloadSettings();
  }, [settings]);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testVoice = async () => {
    setTestingVoice(true);
    
    try {
      if (!settings.browserNotification || !settings.voiceEnabled) {
        setTestingVoice(false);
        return;
      }

      // 仅测试语音，不触发系统通知
      await notificationService.initSpeech();
      notificationService.reloadSettings();
      notificationService.speak('语音播报测试成功，当前仅进行静默语音测试，不会弹出通知或跳转页面。');
      
      setTimeout(() => setTestingVoice(false), 3000);
    } catch (error) {
      console.error('测试语音失败:', error);
      setTestingVoice(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      await notificationService.requestPermission();
    } catch (error) {
      console.error('请求通知权限失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6" style={{ color: accentColor }} />
        <h2 className="text-2xl font-bold" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>通知与语音设置</h2>
      </div>

      {/* 任务提醒详细设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <Clock className="w-5 h-5" />
          任务提醒设置（语音播报）
        </h3>
        
        <div className="space-y-4">
          {/* 任务开始前提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="任务开始前提醒"
              description="例如：「还有2分钟，洗澡任务即将开始」"
              checked={settings.taskStartBeforeReminder}
              onChange={(checked) => updateSetting('taskStartBeforeReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
            {settings.taskStartBeforeReminder && (
              <div className="mt-3 pl-6">
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>提前提醒时间</label>
                <select
                  value={settings.taskStartBeforeMinutes}
                  onChange={(e) => updateSetting('taskStartBeforeMinutes', Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border w-full"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                    borderColor: accentColor,
                    color: isDark ? '#ffffff' : '#1f2937',
                  }}
                >
                  <option value={1}>提前 1 分钟</option>
                  <option value={2}>提前 2 分钟</option>
                  <option value={3}>提前 3 分钟</option>
                  <option value={5}>提前 5 分钟</option>
                  <option value={10}>提前 10 分钟</option>
                </select>
              </div>
            )}
          </div>

          {/* 任务开始时提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="任务开始时提醒"
              description="例如：「洗澡任务已开始，请立即开始执行」"
              checked={settings.taskStartReminder}
              onChange={(checked) => updateSetting('taskStartReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>

          {/* 任务进行中提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="任务进行中提醒"
              description="例如：「洗澡任务已进行10分钟，请保持专注」"
              checked={settings.taskDuringReminder}
              onChange={(checked) => updateSetting('taskDuringReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
            {settings.taskDuringReminder && (
              <div className="mt-3 pl-6">
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>提醒间隔</label>
                <select
                  value={settings.taskDuringMinutes}
                  onChange={(e) => updateSetting('taskDuringMinutes', Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border w-full"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                    borderColor: accentColor,
                    color: isDark ? '#ffffff' : '#1f2937',
                  }}
                >
                  <option value={5}>每 5 分钟</option>
                  <option value={10}>每 10 分钟</option>
                  <option value={15}>每 15 分钟</option>
                  <option value={30}>每 30 分钟</option>
                </select>
              </div>
            )}
          </div>

          {/* 任务结束前提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="任务结束前提醒"
              description="例如：「还有5分钟，洗澡任务即将结束」"
              checked={settings.taskEndBeforeReminder}
              onChange={(checked) => updateSetting('taskEndBeforeReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
            {settings.taskEndBeforeReminder && (
              <div className="mt-3 pl-6">
                <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>提前提醒时间</label>
                <select
                  value={settings.taskEndBeforeMinutes}
                  onChange={(e) => updateSetting('taskEndBeforeMinutes', Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border w-full"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                    borderColor: accentColor,
                    color: isDark ? '#ffffff' : '#1f2937',
                  }}
                >
                  <option value={1}>提前 1 分钟</option>
                  <option value={2}>提前 2 分钟</option>
                  <option value={3}>提前 3 分钟</option>
                  <option value={5}>提前 5 分钟</option>
                  <option value={10}>提前 10 分钟</option>
                </select>
              </div>
            )}
          </div>

          {/* 任务结束时提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="任务结束时提醒"
              description="例如：「洗澡任务已结束，请进行验证」"
              checked={settings.taskEndReminder}
              onChange={(checked) => updateSetting('taskEndReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>

      {/* 验证提醒设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <AlertTriangle className="w-5 h-5" />
          验证提醒设置（语音播报）
        </h3>
        
        <div className="space-y-4">
          {/* 启动验证提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="启动验证提醒"
              description="例如：「请上传洗澡任务的启动验证照片」"
              checked={settings.verificationStartReminder}
              onChange={(checked) => updateSetting('verificationStartReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>

          {/* 完成验证提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="完成验证提醒"
              description="例如：「请上传洗澡任务的完成验证照片」"
              checked={settings.verificationCompleteReminder}
              onChange={(checked) => updateSetting('verificationCompleteReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>

          {/* 紧急验证提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
            <SettingToggle
              label="紧急验证提醒"
              description="例如：「警告！还有10秒，请立即上传验证照片」"
              checked={settings.verificationUrgentReminder}
              onChange={(checked) => updateSetting('verificationUrgentReminder', checked)}
              isDark={isDark}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>

      {/* 其他通知类型 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <Bell className="w-5 h-5" />
          其他通知类型
        </h3>
        
        <div className="space-y-3">
          <SettingToggle
            icon={<TrendingUp className="w-5 h-5" />}
            label="成长提醒"
            description="达成里程碑、等级提升等"
            checked={settings.growthReminder}
            onChange={(checked) => updateSetting('growthReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          <SettingToggle
            icon={<FileText className="w-5 h-5" />}
            label="每日报告"
            description="每日任务完成情况总结"
            checked={settings.dailyReport}
            onChange={(checked) => updateSetting('dailyReport', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          <SettingToggle
            icon={<AlertTriangle className="w-5 h-5" />}
            label="坏习惯警告"
            description="拖延、超时等警告提醒"
            checked={settings.badHabitWarning}
            onChange={(checked) => updateSetting('badHabitWarning', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          <SettingToggle
            icon={<Coins className="w-5 h-5" />}
            label="金币变动"
            description="获得或扣除金币时提醒"
            checked={settings.goldChange}
            onChange={(checked) => updateSetting('goldChange', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* 新增：超时、扣币、拖延提醒 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <AlertTriangle className="w-5 h-5" />
          特殊提醒设置（语音播报）
        </h3>
        
        <div className="space-y-4">
          {/* 超时提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)' }}>
            <SettingToggle
              label="超时提醒"
              description="例如：「警告！洗澡任务已超时5分钟，请尽快完成」"
              checked={settings.overtimeReminder}
              onChange={(checked) => updateSetting('overtimeReminder', checked)}
              isDark={isDark}
              accentColor="#ef4444"
            />
          </div>

          {/* 扣除金币提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: '#f59e0b', backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)' }}>
            <SettingToggle
              label="扣除金币提醒"
              description="例如：「任务失败，扣除50金币，当前余额200金币」"
              checked={settings.goldDeductionReminder}
              onChange={(checked) => updateSetting('goldDeductionReminder', checked)}
              isDark={isDark}
              accentColor="#f59e0b"
            />
          </div>

          {/* 拖延提醒 */}
          <div className="p-4 rounded-lg border" style={{ borderColor: '#8b5cf6', backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }}>
            <SettingToggle
              label="拖延提醒"
              description="例如：「检测到拖延行为，请立即开始任务」"
              checked={settings.procrastinationReminder}
              onChange={(checked) => updateSetting('procrastinationReminder', checked)}
              isDark={isDark}
              accentColor="#8b5cf6"
            />
          </div>
        </div>
      </div>

      {/* 语音设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <Volume2 className="w-5 h-5" />
          语音设置
        </h3>
        
        <SettingToggle
          label="启用语音播报"
          description={settings.browserNotification ? '使用系统语音引擎播报通知' : '需先打开通知总开关'}
          checked={settings.voiceEnabled}
          onChange={(checked) => updateSetting('voiceEnabled', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />
        
        {settings.browserNotification && settings.voiceEnabled && (
          <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: accentColor }}>
            {/* 语速 */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                语速：{settings.voiceRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voiceRate}
                onChange={(e) => updateSetting('voiceRate', Number(e.target.value))}
                className="w-full"
                style={{ accentColor }}
              />
              <div className="flex justify-between text-xs opacity-60 mt-1" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                <span>慢速 0.5x</span>
                <span>正常 1.0x</span>
                <span>快速 2.0x</span>
              </div>
            </div>
            
            {/* 音调 */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                音调：{settings.voicePitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voicePitch}
                onChange={(e) => updateSetting('voicePitch', Number(e.target.value))}
                className="w-full"
                style={{ accentColor }}
              />
              <div className="flex justify-between text-xs opacity-60 mt-1" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                <span>低音 0.5</span>
                <span>正常 1.0</span>
                <span>高音 2.0</span>
              </div>
            </div>
            
            {/* 音量 */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                音量：{Math.round(settings.voiceVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.voiceVolume}
                onChange={(e) => updateSetting('voiceVolume', Number(e.target.value))}
                className="w-full"
                style={{ accentColor }}
              />
              <div className="flex justify-between text-xs opacity-60 mt-1" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
                <span>静音 0%</span>
                <span>正常 50%</span>
                <span>最大 100%</span>
              </div>
            </div>
            
            {/* 测试语音 */}
            <button
              onClick={testVoice}
              disabled={testingVoice}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: accentColor,
                color: 'white',
                opacity: testingVoice ? 0.5 : 1,
              }}
            >
              {testingVoice ? '播放中...' : '🔊 测试语音'}
            </button>
          </div>
        )}
      </div>

      {/* 浏览器通知 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>通知总开关</h3>
        
        <SettingToggle
          label="启用通知"
          description="关闭后系统通知、语音、音效、震动全部停用"
          checked={settings.browserNotification}
          onChange={(checked) => updateSetting('browserNotification', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />
        
        {settings.browserNotification && (
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${accentColor}`,
              color: isDark ? '#ffffff' : '#1f2937',
            }}
          >
            🔔 请求通知权限
          </button>
        )}
        
        <div className="text-sm opacity-70 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          <p className="font-semibold mb-1">💡 提示：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>关闭通知总开关后，系统通知、语音、音效、震动会全部停止</li>
            <li>通知权限仍需要手动授予</li>
            <li>PWA 模式下通知效果更好</li>
            <li>全程不会自动弹窗、自动跳转到时间轴</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 设置开关组件
interface SettingToggleProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDark: boolean;
  accentColor: string;
}

function SettingToggle({ icon, label, description, checked, onChange, isDark, accentColor }: SettingToggleProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-black/5 transition-colors">
      {icon && <div className="mt-0.5" style={{ color: accentColor }}>{icon}</div>}
      
      <div className="flex-1">
        <div className="font-medium" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>{label}</div>
        {description && <div className="text-sm opacity-60 mt-0.5" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>{description}</div>}
      </div>
      
      <button
        onClick={() => onChange(!checked)}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{
          backgroundColor: checked ? accentColor : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        }}
      >
        <div
          className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform"
          style={{
            transform: checked ? 'translateX(26px)' : 'translateX(4px)',
          }}
        />
      </button>
    </div>
  );
}

