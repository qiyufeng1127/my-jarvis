import { useEffect, useState } from 'react';
import { Volume2, Clock3, TimerReset, Turtle, BellOff } from 'lucide-react';
import { notificationService, type VoiceNotificationSettings } from '@/services/notificationService';

interface NotificationSettingsProps {
  isDark: boolean;
  accentColor: string;
}

const STORAGE_KEY = 'notification_settings';

const defaultSettings: VoiceNotificationSettings = {
  voiceEnabled: true,
  taskStartBeforeReminder: true,
  taskStartBeforeMinutes: 2,
  taskEndBeforeReminder: true,
  taskEndBeforeMinutes: 0,
  overtimeReminder: true,
  overtimeReminderInterval: 20,
  procrastinationReminder: true,
  procrastinationReminderCount: 10,
};

export default function NotificationSettingsPanel({ isDark, accentColor }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<VoiceNotificationSettings>(defaultSettings);
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    } catch (error) {
      console.error('加载语音播报设置失败:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    notificationService.reloadSettings();
  }, [settings]);

  const updateSetting = <K extends keyof VoiceNotificationSettings>(
    key: K,
    value: VoiceNotificationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const testVoice = async () => {
    setTestingVoice(true);

    try {
      await notificationService.initSpeech();
      notificationService.reloadSettings();
      notificationService.speak('语音播报已开启。当前只保留任务开始前提醒、任务结束前提醒、超时提醒和拖延提醒。');
    } catch (error) {
      console.error('测试语音失败:', error);
    } finally {
      setTimeout(() => setTestingVoice(false), 1800);
    }
  };

  const textColor = isDark ? '#ffffff' : '#1f2937';
  const mutedColor = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(31,41,55,0.7)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.88)';
  const borderColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Volume2 className="w-6 h-6" style={{ color: accentColor }} />
        <div>
          <h2 className="text-2xl font-bold" style={{ color: textColor }}>
            语音播报设置
          </h2>
          <p className="text-sm mt-1" style={{ color: mutedColor }}>
            现在只保留任务开始前提醒、任务结束前提醒、超时提醒和拖延提醒。
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-5 border"
        style={{
          backgroundColor: cardBg,
          borderColor,
          boxShadow: isDark ? 'none' : '0 14px 34px rgba(15,23,42,0.05)',
        }}
      >
        <SettingToggle
          label="启用语音播报"
          description="关闭后将不再播报任何任务提醒。"
          checked={settings.voiceEnabled}
          onChange={(checked) => updateSetting('voiceEnabled', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={testVoice}
            disabled={!settings.voiceEnabled || testingVoice}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: accentColor,
              color: '#fff',
            }}
          >
            {testingVoice ? '播报中...' : '测试语音'}
          </button>

          <div
            className="px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
              color: mutedColor,
            }}
          >
            <BellOff className="w-4 h-4" />
            已停用浏览器弹窗通知，只保留语音播报逻辑
          </div>
        </div>
      </div>

      <SettingCard
        icon={<Clock3 className="w-5 h-5" />}
        title="任务开始前提醒"
        description="在任务开始前播报一次提醒。"
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        mutedColor={mutedColor}
      >
        <SettingToggle
          label="开启提醒"
          checked={settings.taskStartBeforeReminder}
          onChange={(checked) => updateSetting('taskStartBeforeReminder', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />

        {settings.taskStartBeforeReminder && (
          <SelectField
            label="提前时间"
            value={settings.taskStartBeforeMinutes}
            onChange={(value) => updateSetting('taskStartBeforeMinutes', value as 1 | 2 | 3)}
            options={[
              { value: 1, label: '提前 1 分钟' },
              { value: 2, label: '提前 2 分钟' },
              { value: 3, label: '提前 3 分钟' },
            ]}
            isDark={isDark}
            textColor={textColor}
            accentColor={accentColor}
          />
        )}
      </SettingCard>

      <SettingCard
        icon={<Clock3 className="w-5 h-5" />}
        title="任务结束前提醒"
        description="可选择结束前 1 / 2 / 3 分钟，或者到点时提醒。"
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        mutedColor={mutedColor}
      >
        <SettingToggle
          label="开启提醒"
          checked={settings.taskEndBeforeReminder}
          onChange={(checked) => updateSetting('taskEndBeforeReminder', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />

        {settings.taskEndBeforeReminder && (
          <SelectField
            label="提醒时间"
            value={settings.taskEndBeforeMinutes}
            onChange={(value) => updateSetting('taskEndBeforeMinutes', value as 0 | 1 | 2 | 3)}
            options={[
              { value: 0, label: '到点提醒（0 分钟）' },
              { value: 1, label: '提前 1 分钟' },
              { value: 2, label: '提前 2 分钟' },
              { value: 3, label: '提前 3 分钟' },
            ]}
            isDark={isDark}
            textColor={textColor}
            accentColor={accentColor}
          />
        )}
      </SettingCard>

      <SettingCard
        icon={<TimerReset className="w-5 h-5" />}
        title="超时提醒"
        description="超时达到 20 分钟后，按你选择的间隔重复播报。"
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        mutedColor={mutedColor}
      >
        <SettingToggle
          label="开启提醒"
          checked={settings.overtimeReminder}
          onChange={(checked) => updateSetting('overtimeReminder', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />

        {settings.overtimeReminder && (
          <SelectField
            label="提醒频率"
            value={settings.overtimeReminderInterval}
            onChange={(value) => updateSetting('overtimeReminderInterval', value as 20 | 30)}
            options={[
              { value: 20, label: '每 20 分钟提醒一次' },
              { value: 30, label: '每 30 分钟提醒一次' },
            ]}
            isDark={isDark}
            textColor={textColor}
            accentColor={accentColor}
          />
        )}
      </SettingCard>

      <SettingCard
        icon={<Turtle className="w-5 h-5" />}
        title="拖延提醒"
        description="拖延次数达到阈值时才会播报，避免一直重复吵你。"
        cardBg={cardBg}
        borderColor={borderColor}
        textColor={textColor}
        mutedColor={mutedColor}
      >
        <SettingToggle
          label="开启提醒"
          checked={settings.procrastinationReminder}
          onChange={(checked) => updateSetting('procrastinationReminder', checked)}
          isDark={isDark}
          accentColor={accentColor}
        />

        {settings.procrastinationReminder && (
          <SelectField
            label="提醒阈值"
            value={settings.procrastinationReminderCount}
            onChange={(value) => updateSetting('procrastinationReminderCount', value as 10 | 20 | 30)}
            options={[
              { value: 10, label: '每拖延 10 次提醒' },
              { value: 20, label: '每拖延 20 次提醒' },
              { value: 30, label: '每拖延 30 次提醒' },
            ]}
            isDark={isDark}
            textColor={textColor}
            accentColor={accentColor}
          />
        )}
      </SettingCard>
    </div>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
  cardBg,
  borderColor,
  textColor,
  mutedColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 border space-y-4"
      style={{
        backgroundColor: cardBg,
        borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5" style={{ color: textColor }}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {title}
          </h3>
          <p className="text-sm mt-1" style={{ color: mutedColor }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  isDark,
  textColor,
  accentColor,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: Array<{ value: number; label: string }>;
  isDark: boolean;
  textColor: string;
  accentColor: string;
}) {
  return (
    <div className="pl-1">
      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-xl border"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
          borderColor: accentColor,
          color: textColor,
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  isDark,
  accentColor,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDark: boolean;
  accentColor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="font-medium" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
          {label}
        </div>
        {description && (
          <div className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(31,41,55,0.7)' }}>
            {description}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-12 h-6 rounded-full transition-colors"
        style={{
          backgroundColor: checked ? accentColor : isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.16)',
        }}
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(26px)' : 'translateX(4px)' }}
        />
      </button>
    </div>
  );
}
