import GrowthPanel from '@/components/growth/GrowthPanel';
import { GoalsModule } from '@/components/growth/GoalsModule';
import TimelineCalendar from '@/components/calendar/TimelineCalendar';
import SyncCodeManager from '@/components/settings/SyncCodeManager';
import NotificationSettingsPanel from '@/components/settings/NotificationSettings';
import { useTaskStore } from '@/stores/taskStore';
import { useGrowthStore } from '@/stores/growthStore';
import { TrendingUp, Target, CheckCircle, Clock, ShoppingBag, History, Plus } from 'lucide-react';
import { useState } from 'react';

// 重新导出 GoalsModule
export { GoalsModule } from '@/components/growth/GoalsModule';

// 成长系统模块
export function GrowthModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: bgColor }}>
      <GrowthPanel isDark={isDark} bgColor={bgColor} />
    </div>
  );
}

// 任务管理模块
export function TasksModule({ isDark = false, bgColor = '#ffffff' }: { isDark?: boolean; bgColor?: string }) {
  const { tasks, updateTask, createTask, deleteTask } = useTaskStore();
  
  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: bgColor }}>
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
  const [showShop, setShowShop] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [shopCategory, setShopCategory] = useState<'utility' | 'privilege' | 'reward'>('utility');
  const [customRewards, setCustomRewards] = useState<any[]>([
    { id: 7, name: '休息1小时', price: 150, icon: '☕', desc: '自定义奖励' },
    { id: 8, name: '看电影', price: 300, icon: '🎬', desc: '自定义奖励' },
    { id: 9, name: '买零食', price: 100, icon: '🍿', desc: '自定义奖励' },
  ]);
  const [newReward, setNewReward] = useState({
    name: '',
    price: 100,
    desc: '',
  });

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

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

  // 交易记录
  const transactions = [
    { id: 1, title: '完成任务：写工作报告', amount: 120, type: 'income', time: '14:30', balance: 5280 },
    { id: 2, title: '完成任务：学习英语', amount: 80, type: 'income', time: '16:00', balance: 5160 },
    { id: 3, title: '兑换：深色主题', amount: -50, type: 'expense', time: '19:00', balance: 5080 },
    { id: 4, title: '连续完成奖励', amount: 50, type: 'income', time: '昨天', balance: 5130 },
    { id: 5, title: '购买：免监控券', amount: -200, type: 'expense', time: '昨天', balance: 4930 },
  ];

  // 添加奖励弹窗
  if (showAddReward) {
    return (
      <div className="space-y-4">
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
      <div className="space-y-4">
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
          <div className="text-2xl font-bold" style={{ color: textColor }}>5,280 💰</div>
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
      <div className="space-y-4">
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
        <div className="space-y-2">
          {transactions.map((trans) => (
            <div
              key={trans.id}
              className="rounded-lg p-3"
              style={{ backgroundColor: cardBg }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: textColor }}>{trans.title}</div>
                  <div className="text-xs mt-1" style={{ color: accentColor }}>{trans.time}</div>
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    color: trans.type === 'income'
                      ? (isDark ? '#4ade80' : '#16a34a')
                      : (isDark ? '#f87171' : '#dc2626')
                  }}
                >
                  {trans.amount > 0 ? '+' : ''}{trans.amount}
                </div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: accentColor }}>
                <span>{trans.type === 'income' ? '收入' : '支出'}</span>
                <span>余额: {trans.balance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 金币余额卡片 */}
      <div className="rounded-lg p-6" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-2" style={{ color: accentColor }}>金币余额</div>
        <div className="text-4xl font-bold mb-4" style={{ color: textColor }}>5,280 💰</div>
        <div className="flex justify-between text-sm">
          <div>
            <div style={{ color: accentColor }}>今日收入</div>
            <div className="font-semibold" style={{ color: textColor }}>+320</div>
          </div>
          <div>
            <div style={{ color: accentColor }}>今日支出</div>
            <div className="font-semibold" style={{ color: textColor }}>-50</div>
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
        <div className="space-y-2">
          {transactions.slice(0, 3).map((trans) => (
            <div
              key={trans.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: cardBg }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>{trans.title}</div>
                <div className="text-xs" style={{ color: accentColor }}>{trans.time}</div>
              </div>
              <div
                className="font-semibold"
                style={{
                  color: trans.type === 'income'
                    ? (isDark ? '#4ade80' : '#16a34a')
                    : (isDark ? '#f87171' : '#dc2626')
                }}
              >
                {trans.amount > 0 ? '+' : ''}{trans.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 坏习惯模块
export function HabitsModule({ isDark = false }: { isDark?: boolean }) {
  const [view, setView] = useState<'overview' | 'detail' | 'heatmap' | 'plan'>('overview');
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  
  const habits = [
    { 
      id: 1, 
      name: '拖延', 
      count: 3, 
      severity: 6,
      dots: 2,
      color: '#AC0327',
      consecutiveDays: 2,
      lastOccurrence: '2小时前',
      improvementPlan: { active: true, progress: 45, phase: '调整期' }
    },
    { 
      id: 2, 
      name: '熬夜', 
      count: 1, 
      severity: 3,
      dots: 1,
      color: '#DD617C',
      consecutiveDays: 5,
      lastOccurrence: '5天前',
      improvementPlan: { active: true, progress: 70, phase: '巩固期' }
    },
    { 
      id: 3, 
      name: '低效率', 
      count: 2, 
      severity: 4,
      dots: 2,
      color: '#E8C259',
      consecutiveDays: 0,
      lastOccurrence: '今天',
      improvementPlan: null
    },
    { 
      id: 4, 
      name: '起床晚', 
      count: 1, 
      severity: 2,
      dots: 1,
      color: '#6D9978',
      consecutiveDays: 3,
      lastOccurrence: '3天前',
      improvementPlan: null
    },
  ];

  const purity = Math.max(0, 100 - habits.reduce((sum, h) => sum + h.count * 3, 0));

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // 时间分布热力图视图
  if (view === 'heatmap') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('overview')}
            className="text-sm" 
            style={{ color: accentColor }}
          >
            ← 返回
          </button>
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>时间分布热力图</h3>
          <div></div>
        </div>

        {/* 24小时热力图 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {Array.from({ length: 24 }).map((_, hour) => {
              const intensity = Math.random();
              return (
                <div key={hour} className="text-center">
                  <div
                    className="aspect-square rounded-lg mb-1 transition-all hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: intensity > 0.7 ? '#f87171' : 
                                      intensity > 0.4 ? '#fbbf24' : 
                                      intensity > 0.2 ? '#4ade80' : 
                                      isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    }}
                    title={`${hour}:00 - ${intensity > 0.7 ? '高风险' : intensity > 0.4 ? '中风险' : '低风险'}`}
                  />
                  <div className="text-xs" style={{ color: accentColor }}>{hour}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs" style={{ color: accentColor }}>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-green-400"></div>
              <span>低风险</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-yellow-400"></div>
              <span>中风险</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded bg-red-400"></div>
              <span>高风险</span>
            </div>
          </div>
        </div>

        {/* 一周分布 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: textColor }}>一周分布</h4>
          <div className="space-y-2">
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => {
              const count = Math.floor(Math.random() * 5);
              return (
                <div key={day} className="flex items-center space-x-2">
                  <div className="w-12 text-xs" style={{ color: accentColor }}>{day}</div>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / 5) * 100}%`,
                        backgroundColor: count > 3 ? '#f87171' : count > 1 ? '#fbbf24' : '#4ade80',
                      }}
                    />
                  </div>
                  <div className="w-8 text-xs text-right" style={{ color: textColor }}>{count}次</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 添加记录视图
  if (showAddRecord) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>📝 记录坏习惯</h3>
          <button
            onClick={() => setShowAddRecord(false)}
            className="px-3 py-1 rounded-lg text-sm"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            取消
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              选择坏习惯类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['拖延', '熬夜', '刷手机', '暴饮暴食'].map((type) => (
                <button
                  key={type}
                  className="p-3 rounded-lg text-sm transition-all"
                  style={{ backgroundColor: buttonBg, color: textColor }}
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              className="w-full mt-2 p-3 rounded-lg text-sm border-2 border-dashed"
              style={{ 
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                color: accentColor 
              }}
            >
              + 自定义类型
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              发生时间
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 rounded-lg"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              严重程度
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition-all hover:scale-110"
                  style={{
                    backgroundColor: level <= 3 ? '#4ade80' : level <= 7 ? '#fbbf24' : '#f87171',
                    color: 'white',
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
              备注（可选）
            </label>
            <textarea
              rows={3}
              placeholder="描述当时的情况..."
              className="w-full px-3 py-2 rounded-lg resize-none"
              style={{
                backgroundColor: cardBg,
                color: textColor,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              }}
            />
          </div>

          <button
            className="w-full py-3 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            保存记录
          </button>
        </div>
      </div>
    );
  }

  // 坏习惯详情视图
  if (view === 'detail' && selectedHabit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('overview')}
            className="text-sm" 
            style={{ color: accentColor }}
          >
            ← 返回
          </button>
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>
            {selectedHabit.name}
          </h3>
          <div></div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs" style={{ color: accentColor }}>本周发生</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>{selectedHabit.count}次</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs" style={{ color: accentColor }}>连续控制</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>{selectedHabit.consecutiveDays}天</div>
          </div>
        </div>

        {/* 发生频率图 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: textColor }}>发生频率</h4>
          <div className="h-32 flex items-end justify-between space-x-1">
            {[3, 5, 2, 4, 1, 3, 2].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t"
                  style={{ 
                    height: `${(value / 5) * 100}%`, 
                    backgroundColor: selectedHabit.color 
                  }}
                />
                <div className="text-xs mt-1" style={{ color: accentColor }}>
                  {['一', '二', '三', '四', '五', '六', '日'][index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 时间分布 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: textColor }}>时间分布热力图</h4>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 24 }).map((_, hour) => {
              const intensity = Math.random();
              return (
                <div
                  key={hour}
                  className="aspect-square rounded"
                  style={{
                    backgroundColor: intensity > 0.7 ? selectedHabit.color : 
                                    intensity > 0.4 ? `${selectedHabit.color}80` : 
                                    `${selectedHabit.color}30`,
                  }}
                  title={`${hour}:00`}
                />
              );
            })}
          </div>
        </div>

        {/* AI改进建议 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: textColor }}>🤖 AI改进建议</h4>
          <p className="text-sm" style={{ color: accentColor }}>
            根据分析，你的{selectedHabit.name}习惯主要发生在晚上8-11点。建议在这个时间段设置提醒，并准备替代活动。
          </p>
        </div>

        {/* 开始改进计划 */}
        {!selectedHabit.improvementPlan && (
          <button
            onClick={() => setView('plan')}
            className="w-full py-3 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            🎯 开始21天改进计划
          </button>
        )}
      </div>
    );
  }

  // 改进计划视图
  if (view === 'plan') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('detail')}
            className="text-sm" 
            style={{ color: accentColor }}
          >
            ← 返回
          </button>
          <h3 className="text-lg font-semibold" style={{ color: textColor }}>21天改进计划</h3>
          <div></div>
        </div>

        {/* 计划阶段 */}
        <div className="space-y-2">
          {[
            { phase: '意识期', days: '1-7天', desc: '每天记录，建立意识', icon: '👁️' },
            { phase: '调整期', days: '8-14天', desc: '提供替代方案', icon: '🔄' },
            { phase: '巩固期', days: '15-21天', desc: '强化新习惯', icon: '💪' },
          ].map((stage, index) => (
            <div key={index} className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{stage.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: textColor }}>{stage.phase}</div>
                  <div className="text-xs" style={{ color: accentColor }}>{stage.days} · {stage.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 每日跟进说明 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: textColor }}>📅 每日跟进</h4>
          <ul className="space-y-2 text-sm" style={{ color: accentColor }}>
            <li>• 每天早上收到晨间简报</li>
            <li>• 风险时段实时提醒</li>
            <li>• 成功控制时收到庆祝</li>
            <li>• AI教练全程陪伴</li>
          </ul>
        </div>

        <button
          onClick={() => {
            setView('overview');
            // 这里应该调用API开始计划
          }}
          className="w-full py-3 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          开始计划
        </button>
      </div>
    );
  }

  // 主视图
  return (
    <div className="space-y-4">
      {/* 纯净度仪表盘 */}
      <div className="rounded-lg p-6 text-center" style={{ backgroundColor: cardBg }}>
        <div className="text-sm mb-2" style={{ color: accentColor }}>纯净度</div>
        <div className="relative w-32 h-32 mx-auto mb-2">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={purity >= 80 ? '#4ade80' : purity >= 60 ? '#fbbf24' : '#f87171'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(purity / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl font-bold" style={{ color: textColor }}>{purity}%</div>
          </div>
        </div>
        <div className="text-xs" style={{ color: accentColor }}>
          {purity >= 80 ? '状态优秀！' : purity >= 60 ? '继续努力' : '需要改进'}
        </div>
      </div>

      {/* 活跃坏习惯 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold" style={{ color: textColor }}>污染源</h4>
          <button
            onClick={() => setShowAddRecord(true)}
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => {
                setSelectedHabit(habit);
                setView('detail');
              }}
              className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02]"
              style={{ backgroundColor: cardBg }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {Array.from({ length: habit.dots }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: habit.color }}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-sm" style={{ color: textColor }}>
                    {habit.name} ({habit.count}次，严重度{habit.severity}/10)
                  </span>
                </div>
              </div>
              
              {habit.improvementPlan && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: accentColor }}>
                    <span>{habit.improvementPlan.phase}</span>
                    <span>{habit.improvementPlan.progress}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${habit.improvementPlan.progress}%`,
                        backgroundColor: '#7C3AED',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setView('heatmap')}
          className="py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          📅 时间分布热力图
        </button>
        <button
          onClick={() => setView('plan')}
          className="py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ backgroundColor: buttonBg, color: textColor }}
        >
          🎯 改进计划
        </button>
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
        subtitle: '2024年1月23日',
        content: '今天是充实的一天。你完成了8个任务，专注工作了6小时24分钟。在处理工作报告时，你展现出了极高的专注力，一气呵成完成了这项挑战。\n\n虽然晚上效率有所下降，但你及时调整了状态，没有让拖延习惯占据上风。这种自我觉察能力正是成长的关键。\n\n明天，继续保持这份专注，你会变得更好。',
        emoji: '🌟',
      },
      weekly: {
        title: '本周叙事',
        subtitle: '第3周 · 2024年1月',
        content: '这一周，你经历了从迷茫到清晰的转变。周一的低效让你意识到需要改变，于是你开始调整作息，优化任务安排。\n\n到了周三，你已经找到了节奏。连续三天完成所有任务，这不是偶然，而是你努力的结果。\n\n周末，你没有放松警惕，反而更加专注。这种持续性，正是卓越的基础。',
        emoji: '📖',
      },
      monthly: {
        title: '月度史诗',
        subtitle: '2024年1月',
        content: '一月，是觉醒的月份。你从新年的迷茫中走出，开始认真对待每一天。\n\n你建立了新的习惯系统，虽然偶尔会失败，但你从未放弃。拖延习惯从每周5次降到了3次，这是巨大的进步。\n\n你的成长值增长了350点，金币积累了2000多。但更重要的是，你找到了属于自己的节奏。\n\n二月，继续前行。',
        emoji: '🎭',
      },
      yearly: {
        title: '年度传记',
        subtitle: '2024年',
        content: '这一年，你完成了蜕变。从一个拖延者，成长为一个行动者。\n\n你完成了2847个任务，积累了15000+成长值。但数字背后，是你每一天的坚持。\n\n你战胜了拖延，克服了熬夜，建立了高效的工作习惯。你不再是那个总是说"明天开始"的人。\n\n2025年，你会更强大。',
        emoji: '📚',
      },
    };

    const story = storyContent[storyType];

    return (
      <div className="space-y-4">
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
      <div className="space-y-4">
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
            当前余额：5,280 金币
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
      <div className="space-y-4">
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
            <div className="text-2xl font-bold" style={{ color: textColor }}>8/10</div>
            <div className="text-xs" style={{ color: accentColor }}>80%</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>总用时</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>6h24m</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>金币收支</div>
            <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>+270</div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="text-xs mb-1" style={{ color: accentColor }}>成长值</div>
            <div className="text-2xl font-bold" style={{ color: textColor }}>+35</div>
          </div>
        </div>

        {/* 今日亮点 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            🏆 今日亮点
          </h4>
          <ul className="space-y-1 text-sm" style={{ color: accentColor }}>
            <li>• 连续3天完成所有任务</li>
            <li>• 专注时长超过目标1小时</li>
            <li>• 成功控制拖延习惯</li>
          </ul>
        </div>

        {/* 待改进 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            ⚠️ 待改进
          </h4>
          <ul className="space-y-1 text-sm" style={{ color: accentColor }}>
            <li>• 晚上效率较低，建议调整作息</li>
            <li>• 低效率习惯出现2次</li>
          </ul>
        </div>

        {/* 明日建议 */}
        <div className="rounded-lg p-4" style={{ backgroundColor: cardBg }}>
          <h4 className="text-sm font-semibold mb-2 flex items-center" style={{ color: textColor }}>
            💡 明日建议
          </h4>
          <ul className="space-y-1 text-sm" style={{ color: accentColor }}>
            <li>• 优先处理高优先级任务</li>
            <li>• 在9-11点安排重要工作</li>
            <li>• 设置晚上8点提醒避免拖延</li>
          </ul>
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
    <div className="space-y-4">
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
            <span className="font-semibold" style={{ color: textColor }}>8/10 任务 (80%)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>⏰ 总用时</span>
            <span className="font-semibold" style={{ color: textColor }}>6小时24分钟</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>💰 金币收支</span>
            <span className="font-semibold" style={{ color: '#4ade80' }}>+270</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: accentColor }}>⭐ 成长值</span>
            <span className="font-semibold" style={{ color: textColor }}>+35 点</span>
          </div>
        </div>
      </div>

      {/* 快速洞察 */}
      <div className="space-y-2">
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>🏆 今日亮点</div>
          <div className="text-xs" style={{ color: accentColor }}>连续3天完成所有任务</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>⚠️ 待改进</div>
          <div className="text-xs" style={{ color: accentColor }}>晚上效率较低，建议调整作息</div>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
          <div className="text-sm font-medium mb-1" style={{ color: textColor }}>💡 明日建议</div>
          <div className="text-xs" style={{ color: accentColor }}>优先处理高优先级任务</div>
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
  const [activeTab, setActiveTab] = useState<'growth' | 'identity' | 'procrastination' | 'economy' | 'appearance' | 'notification' | 'sync'>('sync');
  const [strictnessLevel, setStrictnessLevel] = useState(2); // 0=低, 1=中, 2=高
  
  // 外观设置状态
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [primaryColor, setPrimaryColor] = useState('#DD617C');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [defaultView, setDefaultView] = useState<'dashboard' | 'tasks' | 'timeline'>('dashboard');
  
  // 通知设置状态
  const [notifications, setNotifications] = useState({
    taskReminder: true,
    growthReminder: true,
    dailyReport: true,
    habitWarning: false,
    goldChange: false,
  });
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '08:00' });
  const [voiceType, setVoiceType] = useState('gentle_female');
  const [voiceSpeed, setVoiceSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [wakeSensitivity, setWakeSensitivity] = useState<'low' | 'medium' | 'high'>('medium');

  // API 配置状态
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [openaiKey, setOpenaiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1');

  // 云同步设置状态
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState<'realtime' | '1min' | '5min' | '15min'>('realtime');
  const [syncOnStartup, setSyncOnStartup] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'cloud' | 'local' | 'manual'>('cloud');

  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const accentColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const buttonBg = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  const tabs = [
    { id: 'sync', label: '云同步', icon: '☁️' },
    { id: 'appearance', label: '外观体验', icon: '🎨' },
    { id: 'notification', label: '通知语音', icon: '🔔' },
    { id: 'growth', label: '成长维度', icon: '📊' },
    { id: 'identity', label: '身份系统', icon: '👤' },
    { id: 'procrastination', label: '防拖延', icon: '⚡' },
    { id: 'economy', label: '金币经济', icon: '💰' },
  ];

  return (
    <div className="space-y-5">
      {/* 选项卡 - 增大文字和间距 */}
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="py-3 px-3 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? buttonBg : 'transparent',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <div className="text-xl">{tab.icon}</div>
            <div className="mt-1.5">{tab.label}</div>
          </button>
        ))}
      </div>

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
          {[
            { name: '工作效率', value: 85, color: '#DD617C', weight: 30 },
            { name: '学习进步', value: 72, color: '#6D9978', weight: 25 },
            { name: '健康生活', value: 68, color: '#E8C259', weight: 20 },
            { name: '社交关系', value: 55, color: '#AC0327', weight: 15 },
            { name: '个人成长', value: 90, color: '#D1CBBA', weight: 10 },
          ].map((dimension, index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dimension.color }} />
                  <span className="text-sm font-medium" style={{ color: textColor }}>{dimension.name}</span>
                </div>
                <button className="text-xs px-2 py-1 rounded" style={{ backgroundColor: buttonBg, color: textColor }}>
                  编辑
                </button>
              </div>
              <div className="flex items-center space-x-2 text-xs" style={{ color: accentColor }}>
                <span>权重: {dimension.weight}%</span>
                <span>•</span>
                <span>当前: {dimension.value}</span>
              </div>
            </div>
          ))}
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
            <div className="text-2xl font-bold mb-1" style={{ color: textColor }}>🌟 成长者</div>
            <div className="text-xs" style={{ color: accentColor }}>成长值: 650 / 1000</div>
          </div>
          {[
            { name: '🌱 萌芽', range: '0-200', unlocked: true },
            { name: '🌿 探索者', range: '200-500', unlocked: true },
            { name: '🌟 成长者', range: '500-1000', unlocked: true, current: true },
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

      {/* 外观与体验 */}
      {activeTab === 'appearance' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm" style={{ color: textColor }}>主题设置</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light', label: '☀️ 明亮' },
              { value: 'dark', label: '🌙 暗色' },
              { value: 'auto', label: '🌓 自动' }
            ].map((themeOption) => (
              <button 
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value as any)}
                className="py-2 rounded-lg text-xs font-medium transition-all" 
                style={{ 
                  backgroundColor: theme === themeOption.value ? buttonBg : 'transparent', 
                  color: textColor, 
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` 
                }}
              >
                {themeOption.label}
              </button>
            ))}
          </div>

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>主色调</h4>
          <div className="grid grid-cols-6 gap-2">
            {['#DD617C', '#6D9978', '#E8C259', '#AC0327', '#D1CBBA', '#7C3AED'].map((color) => (
              <button 
                key={color}
                onClick={() => setPrimaryColor(color)}
                className="w-full aspect-square rounded-lg transition-all hover:scale-110 relative" 
                style={{ backgroundColor: color }}
              >
                {primaryColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-black rounded-full" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>界面设置</h4>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: textColor }}>字体大小</span>
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                className="px-3 py-1.5 rounded text-xs cursor-pointer" 
                style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }}
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: textColor }}>界面密度</span>
              <select 
                value={density}
                onChange={(e) => setDensity(e.target.value as any)}
                className="px-3 py-1.5 rounded text-xs cursor-pointer" 
                style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }}
              >
                <option value="compact">紧凑</option>
                <option value="standard">标准</option>
                <option value="comfortable">宽松</option>
              </select>
            </div>
          </div>

          <h4 className="font-semibold text-sm mt-4" style={{ color: textColor }}>交互偏好</h4>
          <div className="rounded-lg p-3" style={{ backgroundColor: cardBg }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: textColor }}>默认视图</span>
              <select 
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value as any)}
                className="px-3 py-1.5 rounded text-xs cursor-pointer" 
                style={{ backgroundColor: buttonBg, color: textColor, border: 'none' }}
              >
                <option value="dashboard">仪表盘</option>
                <option value="tasks">任务列表</option>
                <option value="timeline">时间轴</option>
              </select>
            </div>
          </div>

          {/* 当前设置预览 */}
          <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: cardBg }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: textColor }}>当前设置</h4>
            <div className="space-y-1 text-xs" style={{ color: accentColor }}>
              <div>主题: {theme === 'light' ? '明亮' : theme === 'dark' ? '暗色' : '自动'}</div>
              <div>主色调: <span className="inline-block w-3 h-3 rounded-full ml-1" style={{ backgroundColor: primaryColor }} /></div>
              <div>字体: {fontSize === 'small' ? '小' : fontSize === 'medium' ? '中' : '大'}</div>
              <div>密度: {density === 'compact' ? '紧凑' : density === 'standard' ? '标准' : '宽松'}</div>
              <div>默认视图: {defaultView === 'dashboard' ? '仪表盘' : defaultView === 'tasks' ? '任务列表' : '时间轴'}</div>
            </div>
          </div>

          {/* 保存按钮 */}
          <button 
            onClick={() => {
              // 这里应该保存到 userStore
              alert('设置已保存！');
            }}
            className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]" 
            style={{ backgroundColor: buttonBg, color: textColor }}
          >
            💾 保存设置
          </button>
        </div>
      )}

      {/* 通知与语音 */}
      {activeTab === 'notification' && (
        <NotificationSettingsPanel isDark={isDark} accentColor={primaryColor} />
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
  
  return (
    <div className="h-full" style={{ backgroundColor: bgColor }}>
      <TimelineCalendar 
        tasks={tasks}
        onTaskUpdate={updateTask}
        onTaskCreate={createTask}
        onTaskDelete={deleteTask}
        bgColor={bgColor}
        moduleSize={moduleSize}
      />
    </div>
  );
}

