import { useState, useEffect } from 'react';
import { Bell, Volume2, Clock, TrendingUp, FileText, AlertTriangle, Coins } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

interface NotificationSettings {
  taskReminder: boolean;
  growthReminder: boolean;
  dailyReport: boolean;
  badHabitWarning: boolean;
  goldChange: boolean;
  taskStartReminder: boolean;
  taskEndReminder: boolean;
  taskEndReminderMinutes: number;
  verificationReminder: boolean;
  urgentReminder: boolean;
  voiceEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  browserNotification: boolean;
}

interface NotificationSettingsProps {
  isDark: boolean;
  accentColor: string;
}

export default function NotificationSettingsPanel({ isDark, accentColor }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    taskReminder: true,
    growthReminder: true,
    dailyReport: true,
    badHabitWarning: true,
    goldChange: true,
    taskStartReminder: true,
    taskEndReminder: true,
    taskEndReminderMinutes: 5,
    verificationReminder: true,
    urgentReminder: true,
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
  }, [settings]);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testVoice = () => {
    setTestingVoice(true);
    notificationService.notifyTaskStart('测试任务', true);
    setTimeout(() => setTestingVoice(false), 3000);
  };

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      alert('通知权限已授予！');
    } else {
      alert('通知权限被拒绝，请在浏览器设置中手动开启。');
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6" style={{ color: accentColor }} />
        <h2 className="text-2xl font-bold">通知与语音设置</h2>
      </div>

      {/* 通知类型设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知类型
        </h3>
        
        <div className="space-y-3">
          <SettingToggle
            icon={<Clock className="w-5 h-5" />}
            label="任务提醒"
            description="任务开始、结束、验证等提醒"
            checked={settings.taskReminder}
            onChange={(checked) => updateSetting('taskReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
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

      {/* 任务提醒详细设置 */}
      {settings.taskReminder && (
        <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: accentColor }}>
          <h4 className="font-semibold">任务提醒详细设置</h4>
          
          <SettingToggle
            label="任务开始时提醒"
            description="任务到达开始时间时播报"
            checked={settings.taskStartReminder}
            onChange={(checked) => updateSetting('taskStartReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          <SettingToggle
            label="任务结束前提醒"
            description="任务即将结束时提前提醒"
            checked={settings.taskEndReminder}
            onChange={(checked) => updateSetting('taskEndReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          {settings.taskEndReminder && (
            <div className="pl-6">
              <label className="block text-sm font-medium mb-2">提前提醒时间</label>
              <select
                value={settings.taskEndReminderMinutes}
                onChange={(e) => updateSetting('taskEndReminderMinutes', Number(e.target.value))}
                className="px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                  borderColor: accentColor,
                }}
              >
                <option value={1}>提前 1 分钟</option>
                <option value={5}>提前 5 分钟</option>
                <option value={10}>提前 10 分钟</option>
              </select>
            </div>
          )}
          
          <SettingToggle
            label="验证提醒"
            description="启动验证和完成验证提醒"
            checked={settings.verificationReminder}
            onChange={(checked) => updateSetting('verificationReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
          
          <SettingToggle
            label="紧急提醒"
            description="验证倒计时10秒时紧急播报"
            checked={settings.urgentReminder}
            onChange={(checked) => updateSetting('urgentReminder', checked)}
            isDark={isDark}
            accentColor={accentColor}
          />
        </div>
      )}

      {/* 语音设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          语音设置
        </h3>
        
        <SettingToggle
          label="启用语音播报"
          description="使用系统语音引擎播报通知"
          checked={settings.voiceEnabled}
          onChange={(checked) => updateSetting('voiceEnabled', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />
        
        {settings.voiceEnabled && (
          <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: accentColor }}>
            {/* 语速 */}
            <div>
              <label className="block text-sm font-medium mb-2">
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
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>慢速 0.5x</span>
                <span>正常 1.0x</span>
                <span>快速 2.0x</span>
              </div>
            </div>
            
            {/* 音调 */}
            <div>
              <label className="block text-sm font-medium mb-2">
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
              <div className="flex justify-between text-xs opacity-60 mt-1">
                <span>低音 0.5</span>
                <span>正常 1.0</span>
                <span>高音 2.0</span>
              </div>
            </div>
            
            {/* 音量 */}
            <div>
              <label className="block text-sm font-medium mb-2">
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
              <div className="flex justify-between text-xs opacity-60 mt-1">
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
        <h3 className="text-lg font-semibold">浏览器通知</h3>
        
        <SettingToggle
          label="启用浏览器通知"
          description="在系统通知栏显示提醒（需要授权）"
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
            }}
          >
            🔔 请求通知权限
          </button>
        )}
        
        <div className="text-sm opacity-70 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="font-semibold mb-1">💡 提示：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>语音播报即使在后台也能听到</li>
            <li>浏览器通知需要授予权限</li>
            <li>PWA 模式下通知效果更好</li>
            <li>建议同时开启语音和通知</li>
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
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm opacity-60 mt-0.5">{description}</div>}
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

