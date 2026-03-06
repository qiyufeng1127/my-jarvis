import GrowthPanel from '@/components/growth/GrowthPanel';
import { GoalsModule } from '@/components/growth/GoalsModule';
import TimelineCalendar from '@/components/calendar/TimelineCalendar';
import NotificationSettingsPanel from '@/components/settings/NotificationSettings';
import DataBackupPanel from '@/components/settings/DataBackupPanel';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import BaiduAISettings from '@/components/settings/BaiduAISettings';
import EmergencyTaskSettings from '@/components/settings/EmergencyTaskSettings';
import { MoneyTracker } from '@/components/money';
import MoodWeeklyChart from '@/components/journal/MoodWeeklyChart';
import FloatingAIChat from '@/components/ai/FloatingAIChat';
import HabitCanModule from '@/components/habits/HabitCanModule';
import HabitPage from '@/pages/HabitPage';
import SOPLibrary from '@/components/sop/SOPLibrary';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { useGoldStore } from '@/stores/goldStore';
import { useThemeStore, ACCENT_COLORS } from '@/stores/themeStore';
import { useDeviceStore } from '@/stores/deviceStore';
import { DeviceIdentityService } from '@/services/deviceIdentityService';
import { TrendingUp, Target, CheckCircle, Clock, ShoppingBag, History, Plus } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

// 设备信息面板组件
function DeviceInfoPanel({ isDark, cardBg, textColor, accentColor, buttonBg }: { 
  isDark: boolean; 
  cardBg: string; 
  textColor: string; 
  accentColor: string; 
  buttonBg: string;
}) {
  const { identity, updateDeviceName, updateDeviceAvatar, clearAllData } = useDeviceStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarPool = DeviceIdentityService.getAvatarPool();

  useEffect(() => {
    if (identity) {
      setNewName(identity.deviceName);
    }
  }, [identity]);

  if (!identity) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ backgroundColor: cardBg }}>
        <div className="text-sm" style={{ color: accentColor }}>正在加载设备信息...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base" style={{ color: textColor }}>📱 设备信息</h4>

      {/* 设备标识卡片 */}
      <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
        <div className="flex items-center space-x-4 mb-4">
          {/* 头像 */}
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="text-5xl hover:scale-110 transition-transform"
          >
            {identity.avatar}
          </button>
          
          {/* 设备信息 */}
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    updateDeviceName(newName);
                    setIsEditingName(false);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: buttonBg, color: textColor }}
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setNewName(identity.deviceName);
                    setIsEditingName(false);
                  }}
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{ color: accentColor }}
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="text-lg font-bold" style={{ color: textColor }}>
                  {identity.deviceName}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: buttonBg, color: textColor }}
                >
                  ✏️ 编辑
                </button>
              </div>
            )}
            <div className="text-xs mt-1" style={{ color: accentColor }}>
              {identity.deviceType === 'mobile' ? '📱 手机设备' : '💻 电脑设备'} · {identity.browser}
            </div>
          </div>
        </div>

        {/* 头像选择器 */}
        {showAvatarPicker && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)' }}>
            <div className="text-xs mb-2" style={{ color: accentColor }}>选择头像</div>
            <div className="grid grid-cols-8 gap-2">
              {avatarPool.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateDeviceAvatar(avatar);
                    setShowAvatarPicker(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform"
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 设备ID */}
        <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)' }}>
          <div className="text-xs mb-1" style={{ color: accentColor }}>设备唯一ID</div>
          <div className="font-mono text-sm" style={{ color: textColor }}>{identity.deviceId}</div>
        </div>
      </div>

      {/* 数据持久化说明 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <h5 className="text-sm font-semibold mb-2" style={{ color: textColor }}>💾 数据持久化</h5>
        <div className="text-xs leading-relaxed space-y-2" style={{ color: accentColor }}>
          <p>✅ 您的所有数据已安全保存在本设备</p>
          <p>✅ 刷新页面、更新版本、重启浏览器后数据不会丢失</p>
          <p>✅ 只要设备ID不变，数据永久保留</p>
          <p>⚠️ 不同设备或不同浏览器的数据相互独立</p>
        </div>
      </div>

      {/* 设备统计 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <h5 className="text-sm font-semibold mb-3" style={{ color: textColor }}>📊 设备统计</h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: accentColor }}>创建时间</span>
            <span className="text-xs font-medium" style={{ color: textColor }}>
              {new Date(identity.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: accentColor }}>最后访问</span>
            <span className="text-xs font-medium" style={{ color: textColor }}>
              {new Date(identity.lastAccessAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: accentColor }}>使用天数</span>
            <span className="text-xs font-medium" style={{ color: textColor }}>
              {Math.floor((Date.now() - new Date(identity.createdAt).getTime()) / (1000 * 60 * 60 * 24))} 天
            </span>
          </div>
        </div>
      </div>

      {/* 危险操作区 */}
      <div className="rounded-lg p-4 border-2 border-red-500/30" style={{ backgroundColor: cardBg }}>
        <h5 className="text-sm font-semibold mb-2 text-red-500">⚠️ 危险操作</h5>
        <div className="text-xs mb-3" style={{ color: accentColor }}>
          清除所有本地数据将删除：设备标识、任务、目标、日记、标签、设置、AI Key等所有数据。此操作不可恢复！
        </div>
        <button
          onClick={clearAllData}
          className="w-full py-3 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          🗑️ 清除所有本地数据
        </button>
      </div>
    </div>
  );
}

// 重新导出 GoalsModule
export { GoalsModule } from '@/components/growth/GoalsModule';

// 副业追踪模块
export function MoneyModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  return (
    <div className="h-full overflow-auto bg-white dark:bg-black">
      <MoneyTracker isDark={isDark} bgColor={bgColor} />
    </div>
  );
}

// 成长系统模块
export function GrowthModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  return (
    <div className="h-full overflow-auto bg-white dark:bg-black">
      <GrowthPanel isDark={isDark} bgColor={bgColor} />
    </div>
  );
}

// 任务管理模块
export function TasksModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  const { tasks, updateTask, createTask, deleteTask } = useTaskStore();
  
  return (
    <div className="h-full overflow-auto bg-white dark:bg-black">
      <TimelineCalendar 
        tasks={tasks}
        onTaskUpdate={updateTask}
        onTaskCreate={createTask}
        onTaskDelete={deleteTask}
      />
    </div>
  );
}

// 金币经济模块
export function GoldModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  const { balance, todayEarned, todaySpent, transactions, getTodayTransactions } = useGoldStore();
  const [showShop, setShowShop] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [shopCategory, setShopCategory] = useState<'utility' | 'privilege' | 'reward'>('utility');
  const [customRewards, setCustomRewards] = useState<any[]>([]);
  const [newReward, setNewReward] = useState({
    name: '',
    price: 100,
    desc: '',
  });

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  
  // 获取今日交易记录
  const todayTransactions = getTodayTransactions();

  // 根据文案智能生成图标
  const generateIcon = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // 食物相关
    if (lowerText.includes('吃') || lowerText.includes('食') || lowerText.includes('餐') || lowerText.includes('饭')) return '🍽️';
    if (lowerText.includes('零食') || lowerText.includes('snack')) return '🍿';
    if (lowerText.includes('咖啡') || lowerText.includes('coffee')) return '☕';
    if (lowerText.includes('奶茶') || lowerText.includes('tea')) return '🧋';
    if (lowerText.includes('冰淇淋') || lowerText.includes('ice cream')) return '🍦';
    if (lowerText.includes('蛋糕') || lowerText.includes('cake')) return '🍰';
    
    // 娱乐相关
    if (lowerText.includes('电影') || lowerText.includes('movie')) return '🎬';
    if (lowerText.includes('游戏') || lowerText.includes('game')) return '🎮';
    if (lowerText.includes('音乐') || lowerText.includes('music')) return '🎵';
    if (lowerText.includes('唱歌') || lowerText.includes('ktv')) return '🎤';
    if (lowerText.includes('看书') || lowerText.includes('阅读') || lowerText.includes('book')) return '📚';
    
    // 休息相关
    if (lowerText.includes('休息') || lowerText.includes('rest')) return '😴';
    if (lowerText.includes('睡觉') || lowerText.includes('sleep')) return '🛌';
    if (lowerText.includes('放松') || lowerText.includes('relax')) return '🧘';
    
    // 运动相关
    if (lowerText.includes('运动') || lowerText.includes('健身') || lowerText.includes('gym')) return '💪';
    if (lowerText.includes('跑步') || lowerText.includes('run')) return '🏃';
    if (lowerText.includes('游泳') || lowerText.includes('swim')) return '🏊';
    
    // 购物相关
    if (lowerText.includes('购物') || lowerText.includes('买') || lowerText.includes('shopping')) return '🛍️';
    if (lowerText.includes('衣服') || lowerText.includes('clothes')) return '👕';
    if (lowerText.includes('鞋') || lowerText.includes('shoes')) return '👟';
    
    // 旅行相关
    if (lowerText.includes('旅行') || lowerText.includes('旅游') || lowerText.includes('travel')) return '✈️';
    if (lowerText.includes('度假') || lowerText.includes('vacation')) return '🏖️';
    
    // 社交相关
    if (lowerText.includes('聚会') || lowerText.includes('party')) return '🎉';
    if (lowerText.includes('朋友') || lowerText.includes('friend')) return '👥';
    
    // 默认图标
    return '🎁';
  };

  // 添加自定义奖励
  const handleAddReward = () => {
    if (!newReward.name.trim()) return;
    
    const reward = {
      id: Date.now(),
      name: newReward.name,
      price: newReward.price,
      icon: generateIcon(newReward.name),
      desc: newReward.desc || '自定义奖励',
    };
    
    setCustomRewards([...customRewards, reward]);
    setNewReward({ name: '', price: 100, desc: '' });
    setShowAddReward(false);
  };

  // 商店物品
  const shopItems = {
    utility: [
      { id: 1, name: '赎回时间', price: 100, icon: '⏰', desc: '延长任务时间30分钟' },
      { id: 2, name: '解锁报告', price: 50, icon: '📊', desc: '查看详细数据报告' },
      { id: 3, name: '任务提示', price: 30, icon: '💡', desc: '获得任务完成提示' },
    ],
    privilege: [
      { id: 4, name: '免监控券', price: 200, icon: '🎫', desc: '跳过一次防拖延验证' },
      { id: 5, name: '时间暂停卡', price: 300, icon: '⏸️', desc: '暂停任务计时器' },
      { id: 6, name: '双倍奖励', price: 500, icon: '✨', desc: '下次任务双倍金币' },
    ],
    reward: customRewards,
  };

  // 添加奖励弹窗
  if (showAddReward) {
    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>➕ 添加自定义奖励</h3>
          <button
            onClick={() => setShowAddReward(false)}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            取消
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              奖励名称 *
            </label>
            <input
              type="text"
              value={newReward.name}
              onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
              placeholder="如：看电影、买零食、休息1小时"
              className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
              style={{
                backgroundColor: cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor,
              }}
            />
            <div className="text-xs mt-1" style={{ color: accentColor }}>
              💡 系统会根据名称自动生成图标
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              价格（金币）
            </label>
            <input
              type="number"
              value={newReward.price}
              onChange={(e) => setNewReward({ ...newReward, price: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
              style={{
                backgroundColor: cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              描述（可选）
            </label>
            <textarea
              value={newReward.desc}
              onChange={(e) => setNewReward({ ...newReward, desc: e.target.value })}
              placeholder="描述这个奖励..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none resize-none"
              style={{
                backgroundColor: cardBg,
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: textColor,
              }}
            />
          </div>

          {newReward.name && (
            <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
              <div className="text-sm mb-2" style={{ color: accentColor }}>预览</div>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{generateIcon(newReward.name)}</div>
                <div>
                  <div className="font-semibold" style={{ color: textColor }}>{newReward.name}</div>
                  <div className="text-xs" style={{ color: accentColor }}>
                    {newReward.desc || '自定义奖励'}
                  </div>
                </div>
                <div className="ml-auto font-bold" style={{ color: textColor }}>
                  {newReward.price} 💰
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAddReward}
            disabled={!newReward.name.trim()}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: newReward.name.trim() ? buttonBg : 'rgba(0,0,0,0.05)',
              color: newReward.name.trim() ? textColor : accentColor,
              opacity: newReward.name.trim() ? 1 : 0.5,
              cursor: newReward.name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            保存奖励
          </button>
        </div>
      </div>
    );
  }

  if (showShop) {
    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        {/* 商店头部 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>🛍️ 奖励商店</h3>
          <button
            onClick={() => setShowShop(false)}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            返回
          </button>
        </div>

        {/* 余额显示 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <div className="text-sm" style={{ color: accentColor }}>当前余额</div>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{balance} 💰</div>
        </div>

        {/* 分类标签 */}
        <div className="flex space-x-2">
          {[
            { key: 'utility', label: '实用功能' },
            { key: 'privilege', label: '特权购买' },
            { key: 'reward', label: '真实奖励' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setShopCategory(cat.key as any)}
              className="flex-1 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: shopCategory === cat.key ? buttonBg : 'transparent',
                color: textColor,
                border: `1px solid ${shopCategory === cat.key ? 'transparent' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 商品列表 */}
        <div className="space-y-2">
          {shopItems[shopCategory].map((item) => (
            <div
              key={item.id}
              className="rounded-lg p-4"
              style={{ backgroundColor: cardBg }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <div className="font-semibold" style={{ color: textColor }}>{item.name}</div>
                    <div className="text-xs mt-1" style={{ color: accentColor }}>{item.desc}</div>
                  </div>
                </div>
                <button
                  className="px-4 py-1 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    color: textColor,
                  }}
                >
                  {item.price} 💰
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 添加自定义奖励 */}
        {shopCategory === 'reward' && (
          <button
            onClick={() => setShowAddReward(true)}
            className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            <Plus className="w-4 h-4" />
            <span>添加自定义奖励</span>
          </button>
        )}
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        {/* 历史记录头部 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>📜 交易记录</h3>
          <button
            onClick={() => setShowHistory(false)}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            返回
          </button>
        </div>

        {/* 筛选器 */}
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            全部
          </button>
          <button
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: 'transparent', color: accentColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}
          >
            收入
          </button>
          <button
            className="px-3 py-1 rounded-lg text-xs"
            style={{ backgroundColor: 'transparent', color: accentColor, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}
          >
            支出
          </button>
        </div>

        {/* 交易列表 */}
        {transactions.length === 0 ? (
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: cardBg }}>
            <div className="text-sm" style={{ color: accentColor }}>暂无交易记录</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: textColor }}>{transaction.reason}</div>
                    {transaction.taskTitle && (
                      <div className="text-xs mt-1" style={{ color: accentColor }}>任务：{transaction.taskTitle}</div>
                    )}
                  </div>
                  <div className={`text-base font-bold ${transaction.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                  </div>
                </div>
                <div className="text-xs" style={{ color: accentColor }}>
                  {new Date(transaction.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-black">
      {/* 金币余额卡片 */}
      <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-2" style={{ color: accentColor }}>金币余额</div>
        <div className="text-4xl font-bold mb-4" style={{ color: textColor }}>{balance} 💰</div>
        <div className="flex justify-between text-sm">
          <div>
            <div style={{ color: accentColor }}>今日收入</div>
            <div className="font-semibold" style={{ color: textColor }}>+{todayEarned}</div>
          </div>
          <div>
            <div style={{ color: accentColor }}>今日支出</div>
            <div className="font-semibold" style={{ color: textColor }}>-{todaySpent}</div>
          </div>
        </div>
      </div>

      {/* 快捷按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowShop(true)}
          className="py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all hover:scale-105"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>奖励商店</span>
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all hover:scale-105"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          <History className="w-4 h-4" />
          <span>交易记录</span>
        </button>
      </div>

      {/* 最近交易 */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm" style={{ color: textColor }}>最近交易</h4>
        {todayTransactions.length === 0 ? (
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: cardBg }}>
            <div className="text-sm" style={{ color: accentColor }}>暂无交易记录</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: cardBg }}>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: textColor }}>{transaction.reason}</div>
                  <div className="text-xs" style={{ color: accentColor }}>
                    {new Date(transaction.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={`text-sm font-bold ${transaction.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// 数据报告模块
export function ReportsModule({ isDark = false }: { isDark?: boolean }) {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showDetail, setShowDetail] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockType, setUnlockType] = useState<'weekly' | 'monthly' | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [storyType, setStoryType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [unlockedReports, setUnlockedReports] = useState<Set<string>>(new Set(['daily']));

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 成长故事视图
  if (showStory) {
    const storyContent = {
      daily: {
        title: '今日成长故事',
        subtitle: new Date().toLocaleDateString('zh-CN'),
        content: '暂无数据。开始完成任务，记录你的成长故事吧！',
        emoji: '🌟',
      },
      weekly: {
        title: '本周叙事',
        subtitle: '本周',
        content: '暂无数据。坚持一周，你的故事将在这里展开。',
        emoji: '📖',
      },
      monthly: {
        title: '月度史诗',
        subtitle: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' }),
        content: '暂无数据。用一个月的时间，书写属于你的史诗篇章。',
        emoji: '🎭',
      },
      yearly: {
        title: '年度传记',
        subtitle: new Date().getFullYear() + '年',
        content: '暂无数据。用一整年的努力，完成你的年度传记。',
        emoji: '📚',
      },
    };

    const story = storyContent[storyType];

    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowStory(false)}
            className="text-sm"
            style={{ color: accentColor }}
          >
            ← 返回
          </button>
          <button className="text-sm" style={{ color: accentColor }}>
            分享
          </button>
        </div>

        <div className="text-center py-6">
          <div className="text-5xl mb-4">{story.emoji}</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{story.title}</h2>
          <div className="text-sm" style={{ color: accentColor }}>{story.subtitle}</div>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
          <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: textColor }}>
            {story.content}
          </div>
        </div>

        {/* 时间范围选择 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'daily', label: '今日故事', locked: false },
            { key: 'weekly', label: '本周叙事', locked: false },
            { key: 'monthly', label: '月度史诗', locked: false },
            { key: 'yearly', label: '年度传记', locked: true },
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => !type.locked && setStoryType(type.key as any)}
              disabled={type.locked}
              className="py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: storyType === type.key ? buttonBg : 'transparent',
                color: type.locked ? accentColor : textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                opacity: type.locked ? 0.5 : 1,
              }}
            >
              {type.label}
              {type.locked && ' 🔒'}
            </button>
          ))}
        </div>

        <button
          className="w-full py-3 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          ✏️ 编辑故事
        </button>
      </div>
    );
  }

  // 解锁付费报告弹窗
  if (showUnlockModal && unlockType) {
    const price = unlockType === 'weekly' ? 100 : 300;
    const features = unlockType === 'weekly' 
      ? [
          '• 效率分析和趋势图表',
          '• 成长维度变化雷达图',
          '• 坏习惯频率对比',
          '• 个性化改进建议',
          '• 可导出PDF格式',
        ]
      : [
          '• 深度行为洞察分析',
          '• 成长轨迹可视化',
          '• 下月预测和规划',
          '• 个性化成长路线图',
          '• 月度成长故事',
        ];

    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            解锁{unlockType === 'weekly' ? '周报' : '月报'}
          </h3>
          <button
            onClick={() => {
              setShowUnlockModal(false);
              setUnlockType(null);
            }}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            取消
          </button>
        </div>

        <div className="rounded-lg p-6 text-center" style={{ backgroundColor: cardBg }}>
          <div className="text-4xl mb-4">💰</div>
          <div className="text-2xl font-bold mb-2" style={{ color: textColor }}>{price} 金币</div>
          <div className="text-sm mb-4" style={{ color: accentColor }}>
            解锁后可查看详细的{unlockType === 'weekly' ? '周度' : '月度'}分析报告
          </div>
          <div className="text-xs" style={{ color: accentColor }}>
            当前余额：0 金币
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: textColor }}>报告包含：</h4>
          <ul className="space-y-1 text-sm" style={{ color: accentColor }}>
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => {
            const newUnlocked = new Set(unlockedReports);
            newUnlocked.add(unlockType);
            setUnlockedReports(newUnlocked);
            setShowUnlockModal(false);
            setUnlockType(null);
            setReportType(unlockType);
            setShowDetail(true);
          }}
          className="w-full py-3 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          确认支付 {price} 金币
        </button>
      </div>
    );
  }

  // 详细报告视图
  if (showDetail) {
    return (
      <div className="space-y-4 p-4 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetail(false)}
            className="text-sm"
            style={{ color: accentColor }}
          >
            ← 返回
          </button>
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {reportType === 'daily' ? '今日' : reportType === 'weekly' ? '本周' : '本月'}报告
          </h3>
          <button className="text-sm" style={{ color: accentColor }}>
            分享
          </button>
        </div>

        {/* 核心数据 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>任务完成</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>0/0</div>
            <div className="text-xs" style={{ color: accentColor }}>0%</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>总用时</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>0h0m</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>金币收支</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>+0</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>成长值</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>+0</div>
          </div>
        </div>

        {/* 今日亮点 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            🏆 今日亮点
          </h4>
          <div className="text-sm text-center py-2" style={{ color: accentColor }}>暂无数据</div>
        </div>

        {/* 待改进 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            ⚠️ 待改进
          </h4>
          <div className="text-sm text-center py-2" style={{ color: accentColor }}>暂无数据</div>
        </div>

        {/* 明日建议 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            💡 明日建议
          </h4>
          <div className="text-sm text-center py-2" style={{ color: accentColor }}>暂无数据</div>
        </div>

        {/* 导出按钮 */}
        <button
          className="w-full py-3 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          📥 导出报告
        </button>
      </div>
    );
  }

  // 主视图
  return (
    <div className="space-y-4 p-4 bg-white dark:bg-black">
      {/* 报告生成状态 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="text-2xl">📈</div>
          <div className="flex-1">
            <div className="font-semibold" style={{ color: textColor }}>今日报告已生成</div>
            <div className="text-xs" style={{ color: accentColor }}>2分钟前更新</div>
          </div>
        </div>
      </div>

      {/* 快速数据 */}
      <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>🎯 今日完成</span>
            <span className="font-semibold" style={{ color: textColor }}>0/0 任务 (0%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>⏰ 总用时</span>
            <span className="font-semibold" style={{ color: textColor }}>0小时0分钟</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>💰 金币收支</span>
            <span className="font-semibold" style={{ color: textColor }}>+0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>⭐ 成长值</span>
            <span className="font-semibold" style={{ color: textColor }}>+0 点</span>
          </div>
        </div>
      </div>

      {/* 快速洞察 */}
      <div className="space-y-2">
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>🏆 今日亮点</div>
          <div className="text-xs" style={{ color: accentColor }}>暂无数据</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>⚠️ 待改进</div>
          <div className="text-xs" style={{ color: accentColor }}>暂无数据</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>💡 明日建议</div>
          <div className="text-xs" style={{ color: accentColor }}>暂无数据</div>
        </div>
      </div>

      {/* 报告类型切换 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            setReportType('daily');
            setShowDetail(true);
          }}
          className="py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ 
            backgroundColor: reportType === 'daily' ? buttonBg : 'transparent',
            color: textColor,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          📅 日报
        </button>
        <button
          onClick={() => {
            setUnlockType('weekly');
            setShowUnlockModal(true);
          }}
          className="py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ 
            backgroundColor: 'transparent',
            color: textColor,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          📆 周报<br/>(100金币)
        </button>
        <button
          onClick={() => {
            setUnlockType('monthly');
            setShowUnlockModal(true);
          }}
          className="py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ 
            backgroundColor: 'transparent',
            color: textColor,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          📊 月报<br/>(300金币)
        </button>
      </div>
    </div>
  );
}

// 设置模块
export function SettingsModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  const [activeTab, setActiveTab] = useState<'device' | 'backup' | 'appearance' | 'notification' | 'baidu' | 'emergency' | 'sop'>('device');
  
  // 使用真正的主题 store
  const { effectiveTheme } = useThemeStore();
  
  // 根据主题更新 isDark
  useEffect(() => {
    isDark = effectiveTheme === 'dark';
  }, [effectiveTheme]);
  
  // 云同步设置状态（这些变量在代码中被使用但未定义）
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState<'realtime' | '1min' | '5min' | '15min'>('realtime');
  const [syncOnStartup, setSyncOnStartup] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'cloud' | 'local' | 'manual'>('cloud');
  
  // 防拖延设置状态
  const [strictnessLevel, setStrictnessLevel] = useState(1);

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  const tabs = [
    { id: 'device', label: '设备', icon: '📱' },
    { id: 'backup', label: '备份', icon: '💾' },
    { id: 'appearance', label: '外观', icon: '🎨' },
    { id: 'notification', label: '通知', icon: '🔔' },
    { id: 'baidu', label: 'AI', icon: '🤖' },
    { id: 'emergency', label: '紧急', icon: '🚨' },
    { id: 'sop', label: 'SOP', icon: '📋' },
  ];

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-black">
      {/* 选项卡 - 横向滚动布局 */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-lg mb-0.5">{tab.icon}</div>
              <div>{tab.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 设备信息 */}
      {activeTab === 'device' && (
        <DeviceInfoPanel isDark={isDark} cardBg={cardBg} textColor={textColor} accentColor={accentColor} buttonBg={buttonBg} />
      )}

      {/* 数据备份 */}
      {activeTab === 'backup' && (
        <DataBackupPanel />
      )}

      {/* 百度AI配置 */}
      {activeTab === 'baidu' && (
        <BaiduAISettings />
      )}

      {/* 紧急任务设置 */}
      {activeTab === 'emergency' && (
        <EmergencyTaskSettings />
      )}

      {/* 云同步设置 */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          {/* 云同步码管理器 */}
          <SyncCodeManager isDark={isDark} bgColor={bgColor} />

          <h4 className="font-semibold text-base" style={{ color: textColor }}>☁️ 云同步设置</h4>

          {/* 同步状态 */}
          <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>同步状态</div>
                <div className="text-xs mt-1" style={{ color: accentColor }}>最后同步：2分钟前</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium" style={{ color: '#4ade80' }}>已连接</span>
              </div>
            </div>
            <button
              onClick={() => alert('正在手动同步...')}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ backgroundColor: buttonBg, color: textColor }}
            >
              🔄 立即同步
            </button>
          </div>

          {/* 自动同步 */}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: cardBg }}>
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>自动同步</div>
                <div className="text-xs mt-1" style={{ color: accentColor }}>自动将数据同步到云端</div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </label>

            {autoSync && (
              <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
                <label className="block">
                  <span className="text-sm font-medium block mb-2" style={{ color: textColor }}>同步频率</span>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer"
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                      color: textColor,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                  >
                    <option value="realtime">实时同步（推荐）</option>
                    <option value="1min">每1分钟</option>
                    <option value="5min">每5分钟</option>
                    <option value="15min">每15分钟</option>
                  </select>
                </label>
              </div>
            )}

            <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: cardBg }}>
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>启动时同步</div>
                <div className="text-xs mt-1" style={{ color: accentColor }}>打开应用时自动从云端加载数据</div>
              </div>
              <input
                type="checkbox"
                checked={syncOnStartup}
                onChange={(e) => setSyncOnStartup(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </label>
          </div>

          {/* 冲突解决策略 */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm" style={{ color: textColor }}>冲突解决策略</h5>
            <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
              <label className="block">
                <span className="text-xs block mb-2" style={{ color: accentColor }}>
                  当本地数据与云端数据冲突时
                </span>
                <select
                  value={conflictResolution}
                  onChange={(e) => setConflictResolution(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm cursor-pointer"
                  style={{
                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  <option value="cloud">优先使用云端数据</option>
                  <option value="local">优先使用本地数据</option>
                  <option value="manual">手动选择</option>
                </select>
              </label>
            </div>
          </div>

          {/* 同步范围 */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm" style={{ color: textColor }}>同步范围</h5>
            {[
              { key: 'modules', label: '仪表盘模块配置', checked: true },
              { key: 'tasks', label: '任务数据', checked: true },
              { key: 'goals', label: '长期目标', checked: true },
              { key: 'habits', label: '习惯记录', checked: true },
              { key: 'journals', label: '日记和记忆', checked: true },
              { key: 'settings', label: '个人设置', checked: false },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01]" style={{ backgroundColor: cardBg }}>
                <span className="text-sm" style={{ color: textColor }}>{item.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-4 h-4 cursor-pointer"
                />
              </label>
            ))}
          </div>

          {/* 数据管理 */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm" style={{ color: textColor }}>数据管理</h5>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (confirm('确定要导出所有数据吗？')) {
                    alert('正在导出数据...');
                  }
                }}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: buttonBg, color: textColor }}
              >
                📥 导出数据
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要清除本地缓存吗？云端数据不会受影响。')) {
                    localStorage.clear();
                    alert('本地缓存已清除！');
                  }
                }}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: buttonBg, color: textColor }}
              >
                🗑️ 清除缓存
              </button>
            </div>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={() => {
              localStorage.setItem('sync_settings', JSON.stringify({
                autoSync,
                syncInterval,
                syncOnStartup,
                conflictResolution,
              }));
              alert('云同步设置已保存！');
            }}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            💾 保存设置
          </button>
        </div>
      )}

      {/* 成长维度 */}
      {activeTab === 'growth' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: textColor }}>自定义成长维度</h4>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: cardBg }}>
            <div className="text-sm" style={{ color: accentColor }}>暂无成长维度</div>
            <div className="text-xs mt-1" style={{ color: accentColor }}>点击下方按钮添加</div>
          </div>
          <button className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: buttonBg, color: textColor }}>
            + 添加新维度 (最多10个)
          </button>
        </div>
      )}

      {/* 身份系统 */}
      {activeTab === 'identity' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: textColor }}>身份层级管理</h4>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-sm font-medium mb-1" style={{ color: textColor }}>当前层级</div>
            <div className="text-2xl font-bold mb-1" style={{ color: textColor }}>🌱 萌芽</div>
            <div className="text-xs" style={{ color: accentColor }}>成长值: 0 / 200</div>
          </div>
          {[
            { name: '🌱 萌芽', range: '0-200', unlocked: true, current: true },
            { name: '🌿 探索者', range: '200-500', unlocked: false },
            { name: '🌟 成长者', range: '500-1000', unlocked: false },
            { name: '⭐ 实践家', range: '1000-2000', unlocked: false },
            { name: '💫 大师', range: '2000-5000', unlocked: false },
          ].map((level, index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: textColor }}>
                    {level.name} {level.current && '(当前)'}
                  </div>
                  <div className="text-xs" style={{ color: accentColor }}>{level.range} 成长值</div>
                </div>
                {level.unlocked && (
                  <button className="text-xs px-2 py-1 rounded" style={{ backgroundColor: buttonBg, color: textColor }}>
                    编辑
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="w-full py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: buttonBg, color: textColor }}>
            + 添加新层级
          </button>
        </div>
      )}

      {/* 防拖延设置 */}
      {activeTab === 'procrastination' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: textColor }}>防拖延严格度</h4>
          <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
            <div className="flex justify-between mb-2">
              {['低', '中', '高'].map((level, index) => (
                <button
                  key={index}
                  onClick={() => setStrictnessLevel(index)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: strictnessLevel === index ? buttonBg : 'transparent',
                    color: textColor,
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="text-xs" style={{ color: accentColor }}>
              {strictnessLevel === 0 && '宽松模式：较少验证，适合自律性强的用户'}
              {strictnessLevel === 1 && '标准模式：平衡验证频率和用户体验'}
              {strictnessLevel === 2 && '严格模式：频繁验证，帮助克服拖延'}
            </div>
          </div>

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>按任务类型设置</h4>
          {['工作', '学习', '健康', '生活'].map((type, index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: textColor }}>{type}</span>
                <select className="px-2 py-1 rounded text-xs" style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }}>
                  <option>低</option>
                  <option>中</option>
                  <option>高</option>
                </select>
              </div>
            </div>
          ))}

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>验证规则</h4>
          {['人脸识别验证', '位置验证', '时间限制', '专注模式'].map((rule, index) => (
            <label key={index} className="flex items-center justify-between p-3 rounded-lg cursor-pointer" style={{ backgroundColor: cardBg }}>
              <span className="text-sm" style={{ color: textColor }}>{rule}</span>
              <input type="checkbox" defaultChecked={index < 2} className="w-4 h-4" />
            </label>
          ))}
        </div>
      )}

      {/* 金币经济设置 */}
      {activeTab === 'economy' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: textColor }}>奖励参数</h4>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: textColor }}>基础奖励系数</span>
              <input type="number" defaultValue="1.0" step="0.1" className="w-16 px-2 py-1 rounded text-xs text-center" style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }} />
            </div>
          </div>
          
          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>任务类型系数</h4>
          {[
            { type: '工作', coefficient: 1.2 },
            { type: '学习', coefficient: 1.5 },
            { type: '健康', coefficient: 1.0 },
            { type: '生活', coefficient: 0.8 },
          ].map((item, index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: textColor }}>{item.type}</span>
                <input type="number" defaultValue={item.coefficient} step="0.1" className="w-16 px-2 py-1 rounded text-xs text-center" style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }} />
              </div>
            </div>
          ))}

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>惩罚参数</h4>
          {[
            { name: '拖延惩罚', value: -50 },
            { name: '低效率惩罚', value: -30 },
            { name: '坏习惯惩罚', value: -20 },
          ].map((item, index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: textColor }}>{item.name}</span>
                <input type="number" defaultValue={item.value} className="w-16 px-2 py-1 rounded text-xs text-center" style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 外观设置 */}
      {activeTab === 'appearance' && (
        <AppearanceSettings />
      )}

      {/* 通知与语音 */}
      {activeTab === 'notification' && (
        <NotificationSettingsPanel isDark={isDark} accentColor={accentColor} />
      )}

      {/* SOP 任务库 */}
      {activeTab === 'sop' && (
        <div className="bg-white dark:bg-black">
          <SOPLibrary />
        </div>
      )}
    </div>
  );
}

// Kiki宝宝模块
export function KikiModule({ isDark = false }: { isDark?: boolean }) {
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: buttonBg }}>
        🎤
      </div>
      <h3 className="text-xl font-bold" style={{ color: textColor }}>Kiki 宝宝</h3>
      <p className="text-sm text-center" style={{ color: accentColor }}>
        点击右下角的语音按钮<br />唤醒 Kiki 开始对话
      </p>
      <button className="px-6 py-2 rounded-lg transition-colors" style={{ backgroundColor: buttonBg, color: textColor }}>
        唤醒 Kiki
      </button>
    </div>
  );
}

// AI智能助手模块 - 直接嵌入对话界面
export { default as AISmartModule } from '@/components/ai/AISmartModule';

// 时间轴模块
export function TimelineModule({ isDark = false, bgColor = '#ffffff', moduleSize }: { isDark?: boolean; bgColor?: string; moduleSize?: { width: number; height: number } }) {
  const { tasks, updateTask, createTask, deleteTask } = useTaskStore();
  const [showAIChat, setShowAIChat] = useState(false);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);
  
  // 使用 useCallback 包装 createTask，避免无限循环
  const handleCreateTask = useCallback((task: any) => {
    return createTask(task);
  }, [createTask]);
  
  // 检查AI是否已配置
  const checkAIConfig = () => {
    const aiConfig = localStorage.getItem('manifestos-ai-config-storage');
    if (aiConfig) {
      try {
        const config = JSON.parse(aiConfig);
        return config?.state?.config?.apiKey ? true : false;
      } catch {
        return false;
      }
    }
    return false;
  };
  
  const handleAIButtonClick = () => {
    const isConfigured = checkAIConfig();
    if (!isConfigured) {
      setShowConfigPrompt(true);
    } else {
      setShowAIChat(true);
    }
  };
  
  return (
    <>
      <div className="h-full" style={{ backgroundColor: bgColor }}>
        <TimelineCalendar 
          tasks={tasks}
          onTaskUpdate={updateTask}
          onTaskCreate={handleCreateTask}
          onTaskDelete={deleteTask}
          bgColor={bgColor}
          moduleSize={moduleSize}
        />
      </div>
      
      {/* AI助手浮动按钮 - 黄色背景白色图标 */}
      <button
        onClick={handleAIButtonClick}
        className="fixed w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
        style={{ 
          backgroundColor: '#E8C259',
          color: '#ffffff',
          zIndex: 99999,
          bottom: '88px',
          right: '16px',
        }}
        title="AI助手"
      >
        <span className="text-3xl">🤖</span>
      </button>
      
      {/* AI配置提示弹窗 */}
      {showConfigPrompt && (
        <div className="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 功能需要配置</h2>
              <p className="text-sm text-gray-600">
                配置 API Key 后可以使用：
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ 智能识别心情、碎碎念、待办</li>
                <li>✅ 自动打情绪和分类标签</li>
                <li>✅ 智能任务分解到时间轴</li>
                <li>✅ 自然语言对话</li>
                <li>✅ AI 思考过程可视化</li>
                <li>✅ 智能动线优化</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 推荐使用 DeepSeek</h3>
              <p className="text-xs text-blue-800 mb-2">
                国内大模型，速度快、价格便宜、效果好
              </p>
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                👉 点击获取 DeepSeek API Key
              </a>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfigPrompt(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
              >
                稍后配置
              </button>
              <button
                onClick={() => {
                  setShowConfigPrompt(false);
                  setShowAIChat(true);
                }}
                className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                立即配置
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI对话全屏弹窗 */}
      {showAIChat && (
        <div className="fixed inset-0 z-[100000] bg-white">
          <FloatingAIChat 
            isFullScreen={true}
            onClose={() => setShowAIChat(false)}
          />
        </div>
      )}
    </>
  );
}

// 心情周报模块
export function MoodWeeklyModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: bgColor }}>
      <MoodWeeklyChart isDark={isDark} bgColor={bgColor} />
    </div>
  );
}

// 习惯追踪模块 - 新版
export function HabitsModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: bgColor }}>
      <HabitPage />
    </div>
  );
}

