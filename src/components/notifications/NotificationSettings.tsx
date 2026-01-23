import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, Clock, Check, X } from 'lucide-react';
import { notificationService } from '@/services/notificationService';

export default function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '08:00' });
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // 加载设置
    const notifEnabled = localStorage.getItem('notifications_enabled') === 'true';
    const voiceEn = localStorage.getItem('voice_notifications_enabled') === 'true';
    const quietHoursStr = localStorage.getItem('quiet_hours');
    const reminderMins = parseInt(localStorage.getItem('reminder_minutes') || '5');

    setNotificationsEnabled(notifEnabled);
    setVoiceEnabled(voiceEn);
    setReminderMinutes(reminderMins);

    if (quietHoursStr) {
      try {
        setQuietHours(JSON.parse(quietHoursStr));
      } catch (e) {
        console.error('解析免打扰时段失败', e);
      }
    }

    // 检查权限
    notificationService.checkPermission().then(setPermission);
  }, []);

  const handleEnableNotifications = async () => {
    if (!notificationsEnabled) {
      const perm = await notificationService.requestPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('notifications_enabled', 'true');
        
        // 发送测试通知
        await notificationService.sendNotification({
          title: '🎉 通知已启用',
          body: '您将收到任务提醒和其他重要通知',
        });
      } else {
        alert('请在浏览器设置中允许通知权限');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notifications_enabled', 'false');
    }
  };

  const handleVoiceToggle = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem('voice_notifications_enabled', String(newValue));

    if (newValue) {
      // 测试语音
      const utterance = new SpeechSynthesisUtterance('语音通知已启用');
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuietHoursChange = (type: 'start' | 'end', value: string) => {
    const newQuietHours = { ...quietHours, [type]: value };
    setQuietHours(newQuietHours);
    localStorage.setItem('quiet_hours', JSON.stringify(newQuietHours));
  };

  const handleReminderMinutesChange = (value: number) => {
    setReminderMinutes(value);
    localStorage.setItem('reminder_minutes', String(value));
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-800">通知设置</h2>
        <Bell className="w-6 h-6 text-blue-600" />
      </div>

      {/* 权限状态 */}
      {permission !== 'granted' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <BellOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">通知权限未授予</p>
              <p className="text-sm text-yellow-800 mt-1">
                请点击下方按钮授予通知权限，以便接收任务提醒
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 启用通知 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {notificationsEnabled ? (
              <Bell className="w-6 h-6 text-blue-600" />
            ) : (
              <BellOff className="w-6 h-6 text-neutral-400" />
            )}
            <div>
              <h3 className="font-semibold text-neutral-800">浏览器通知</h3>
              <p className="text-sm text-neutral-600">接收任务提醒和重要通知</p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              notificationsEnabled ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 语音通知 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {voiceEnabled ? (
              <Volume2 className="w-6 h-6 text-blue-600" />
            ) : (
              <VolumeX className="w-6 h-6 text-neutral-400" />
            )}
            <div>
              <h3 className="font-semibold text-neutral-800">语音播报</h3>
              <p className="text-sm text-neutral-600">重要通知将语音播报</p>
            </div>
          </div>
          <button
            onClick={handleVoiceToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              voiceEnabled ? 'bg-blue-600' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                voiceEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 提醒时间 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-neutral-800">提前提醒</h3>
            <p className="text-sm text-neutral-600">任务开始前提醒时间</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="30"
            value={reminderMinutes}
            onChange={(e) => handleReminderMinutesChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(reminderMinutes / 30) * 100}%, #e5e7eb ${(reminderMinutes / 30) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <span className="text-lg font-semibold text-blue-600 w-20 text-right">
            {reminderMinutes} 分钟
          </span>
        </div>
      </div>

      {/* 免打扰时段 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-neutral-800">免打扰时段</h3>
            <p className="text-sm text-neutral-600">在此时段内不会收到通知</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">开始时间</label>
            <input
              type="time"
              value={quietHours.start}
              onChange={(e) => handleQuietHoursChange('start', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">结束时间</label>
            <input
              type="time"
              value={quietHours.end}
              onChange={(e) => handleQuietHoursChange('end', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 通知类型 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <h3 className="font-semibold text-neutral-800 mb-4">通知类型</h3>
        <div className="space-y-3">
          {[
            { id: 'task_reminder', label: '任务提醒', icon: '📅' },
            { id: 'task_start', label: '任务开始', icon: '🚀' },
            { id: 'task_complete', label: '任务完成', icon: '✅' },
            { id: 'task_overdue', label: '任务逾期', icon: '⚠️' },
            { id: 'growth_milestone', label: '成长里程碑', icon: '🎉' },
            { id: 'level_up', label: '身份升级', icon: '👑' },
            { id: 'bad_habit', label: '坏习惯警告', icon: '⚠️' },
            { id: 'daily_report', label: '每日报告', icon: '📊' },
          ].map((type) => (
            <div key={type.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{type.icon}</span>
                <span className="text-neutral-700">{type.label}</span>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 测试通知 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-800 mb-1">测试通知</h3>
            <p className="text-sm text-neutral-600">发送一条测试通知，检查设置是否正常</p>
          </div>
          <button
            onClick={async () => {
              await notificationService.sendNotification({
                title: '🔔 测试通知',
                body: '这是一条测试通知，您的通知设置正常工作！',
              });
            }}
            disabled={!notificationsEnabled}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            发送测试
          </button>
        </div>
      </div>
    </div>
  );
}

