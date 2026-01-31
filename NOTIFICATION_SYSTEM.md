# 🔔 完整通知提醒系统实现文档

## 📋 概述

为 ADHD 用户设计的**主动式通知提醒系统**，支持语音播报、浏览器通知和页面内弹窗，确保用户即使不在页面也能感知到任务状态变化。

## ✨ 核心特性

### 1. 多渠道通知
- **🔊 语音播报**：使用系统 TTS 引擎，支持中文语音
- **🔔 浏览器通知**：系统级通知，后台也能看到
- **💬 页面内弹窗**：高优先级通知的视觉提醒

### 2. 丰富的通知类型
- ✅ **任务提醒**：任务开始、即将结束、结束
- 🎯 **验证提醒**：启动验证、完成验证、紧急倒计时
- 💰 **金币变动**：获得金币、扣除金币
- ⚠️ **警告提醒**：超时、失败、连续失败
- 📈 **成长提醒**：里程碑、等级提升
- 📊 **每日报告**：每日总结

### 3. 智能语音系统
- **可调节语速**：0.5x - 2.0x
- **可调节音调**：0.5 - 2.0
- **可调节音量**：0% - 100%
- **优先级加速**：紧急通知自动加快语速
- **自动选择语音**：优先使用中文语音

### 4. 灵活的设置选项
- **通知类型开关**：任务提醒、成长提醒、每日报告、坏习惯警告、金币变动
- **任务提醒详细设置**：
  - 任务开始时提醒
  - 任务结束前提醒（可选 1/5/10 分钟）
  - 验证提醒
  - 紧急提醒（10秒倒计时）
- **浏览器通知权限管理**

## 📁 文件结构

```
src/
├── services/
│   ├── notificationService.ts          # 核心通知管理器
│   └── taskVerificationService.ts      # 任务验证服务（已集成）
├── components/
│   ├── notifications/
│   │   └── NotificationToast.tsx       # 页面内通知弹窗
│   └── settings/
│       └── NotificationSettings.tsx    # 通知设置面板
└── App.tsx                              # 全局通知组件集成
```

## 🔧 核心 API

### NotificationManager

```typescript
import { notificationManager } from '@/services/notificationService';

// 任务开始提醒
notificationManager.notifyTaskStart('写工作报告', ['打开电脑', '准备文档']);

// 任务即将结束
notificationManager.notifyTaskEnding('写工作报告', 5); // 5分钟后结束

// 任务结束
notificationManager.notifyTaskEnd('写工作报告', ['完成文档', '保存文件']);

// 紧急提醒（10秒倒计时）
notificationManager.notifyVerificationUrgent('写工作报告', 10);

// 验证超时
notificationManager.notifyVerificationTimeout('写工作报告', 200, 1, true);

// 验证成功
notificationManager.notifyVerificationSuccess('写工作报告', 120, true);

// 严重失败警告
notificationManager.notifyCriticalFailure('写工作报告', 600);

// 金币变动
notificationManager.notifyGoldChange(120, '完成任务');

// 每日报告
notificationManager.notifyDailyReport('今天完成了8个任务，获得320金币');

// 成长里程碑
notificationManager.notifyGrowthMilestone('恭喜！你已经连续7天完成所有任务');

// 坏习惯警告
notificationManager.notifyBadHabit('检测到拖延行为，已经超时10分钟');
```

### 自定义通知

```typescript
notificationManager.notify({
  type: 'task_start',
  title: '任务开始',
  message: '您的任务"写工作报告"现在开始',
  taskTitle: '写工作报告',
  goldAmount: 120,
  priority: 'high', // 'low' | 'normal' | 'high' | 'critical'
  autoClose: true,
  autoCloseDelay: 5000,
});
```

## 🎨 通知优先级

### Low（低）
- 普通信息提示
- 仅语音播报（如果启用）

### Normal（正常）
- 任务完成、金币获得
- 语音 + 浏览器通知

### High（高）
- 任务开始、任务结束、验证提醒
- 语音 + 浏览器通知 + 页面内弹窗

### Critical（严重）
- 连续失败、严重超时
- 语音（加快语速）+ 浏览器通知（不自动关闭）+ 页面内弹窗（震动效果）

## 🔊 语音播报示例

### 任务开始
> "您的任务"写工作报告"现在开始，请拍摄包含以下内容的照片：打开电脑、准备文档。两分钟倒计时开始。"

### 任务即将结束
> "您的任务"写工作报告"还有5分钟结束，准备收尾了哟。"

### 紧急提醒（加快语速）
> "注意！任务"写工作报告"启动还剩10秒，不要拖延了，快快快！"

### 验证超时
> "任务"写工作报告"启动超时第1次，扣除200金币。再给您2分钟重试机会。"

### 验证成功
> "太棒了！任务"写工作报告"启动成功，获得120金币（40%奖励）！"

### 严重失败（更快语速）
> "警告！任务"写工作报告"连续3次失败，总共扣除600金币！请立即认真完成任务！"

## 🎯 使用场景

### 场景1：任务开始时
```typescript
// 在 TaskMonitor 中，当任务到达开始时间
const startTime = task.scheduledStart;
if (now >= startTime && verification.status === 'pending') {
  // 触发任务开始提醒
  notificationManager.notifyTaskStart(
    task.title,
    verification.startKeywords
  );
  
  // 更新验证状态
  verification.status = 'waiting_start';
  verification.startDeadline = new Date(startTime.getTime() + 2 * 60 * 1000);
}
```

### 场景2：10秒倒计时
```typescript
// 在启动验证截止前10秒
const timeLeft = verification.startDeadline.getTime() - now;
if (timeLeft <= 10000 && timeLeft > 9000) {
  notificationManager.notifyVerificationUrgent(task.title, 10);
}
```

### 场景3：验证超时
```typescript
// 启动验证超时
if (now > verification.startDeadline) {
  const penalty = GoldSystem.calculateStartTimeoutPenalty(
    verification.startTimeoutCount
  );
  
  notificationManager.notifyVerificationTimeout(
    task.title,
    penalty,
    verification.startTimeoutCount + 1,
    true // isStart
  );
  
  // 扣除金币
  updateGold(-penalty);
}
```

### 场景4：连续失败
```typescript
// 连续3次失败
if (verification.startTimeoutCount >= 3) {
  notificationManager.notifyCriticalFailure(
    task.title,
    verification.totalGoldPenalty
  );
  
  // 显示全屏警报
  showFullScreenAlert();
}
```

## ⚙️ 设置界面

用户可以在**设置模块 → 通知语音**中配置：

### 通知类型
- ✅ 任务提醒
- ✅ 成长提醒
- ✅ 每日报告
- ✅ 坏习惯警告
- ✅ 金币变动

### 任务提醒详细设置
- ✅ 任务开始时提醒
- ✅ 任务结束前提醒（提前 1/5/10 分钟）
- ✅ 验证提醒
- ✅ 紧急提醒（10秒倒计时）

### 语音设置
- **语速**：0.5x - 2.0x（滑块调节）
- **音调**：0.5 - 2.0（滑块调节）
- **音量**：0% - 100%（滑块调节）
- **测试语音**：点击按钮测试当前设置

### 浏览器通知
- ✅ 启用浏览器通知
- 🔔 请求通知权限（按钮）

## 📱 PWA 支持

系统完全支持 PWA 模式：
- ✅ 后台语音播报
- ✅ 系统级通知
- ✅ 离线工作
- ✅ 桌面和移动端

## 🔐 权限管理

### 浏览器通知权限
```typescript
// 自动请求权限（首次加载）
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// 手动请求权限（设置页面）
const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('通知权限已授予！');
  }
};
```

## 🎨 页面内通知样式

### 普通通知
- 白色背景（暗色模式下为深灰色）
- 左侧图标（根据类型变化）
- 标题 + 消息
- 5秒后自动关闭

### 严重通知
- 红色背景
- 白色文字
- 震动动画
- 脉冲边框
- 不自动关闭
- 底部显示"⚠️ 请立即处理 ⚠️"

## 🚀 集成步骤

### 1. 在 App.tsx 中添加全局通知组件
```typescript
import NotificationToast from '@/components/notifications/NotificationToast';

function App() {
  return (
    <div>
      <NotificationToast />
      {/* 其他内容 */}
    </div>
  );
}
```

### 2. 在设置模块中添加通知设置面板
```typescript
import NotificationSettingsPanel from '@/components/settings/NotificationSettings';

// 在 SettingsModule 中
{activeTab === 'notification' && (
  <NotificationSettingsPanel isDark={isDark} accentColor={accentColor} />
)}
```

### 3. 在任务验证服务中使用通知
```typescript
import { notificationManager } from '@/services/notificationService';

// 替换原有的 VoiceReminder 调用
VoiceReminder.remindTaskStart(taskTitle, keywords);
// 改为
notificationManager.notifyTaskStart(taskTitle, keywords);
```

## 📊 数据持久化

通知设置自动保存到 `localStorage`：
```typescript
// 键名
'notificationSettings'

// 数据结构
{
  taskReminder: true,
  growthReminder: true,
  dailyReport: true,
  badHabitWarning: true,
  goldChange: true,
  voiceEnabled: true,
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  browserNotification: true,
  taskStartReminder: true,
  taskEndReminder: true,
  taskEndReminderMinutes: 5,
  verificationReminder: true,
  urgentReminder: true,
}
```

## 🐛 调试

### 查看通知日志
```typescript
// 所有通知都会在控制台输出
console.log('🔔 通知触发:', payload);
console.log('🔊 语音播报:', message);
```

### 测试语音
在设置页面点击"🔊 测试语音"按钮，会播放：
> "您的任务"测试任务"现在开始，请拍摄包含以下内容的照片：打开电脑、准备工作。两分钟倒计时开始。"

## 💡 最佳实践

### 1. 合理设置优先级
- 日常提醒：`normal`
- 重要提醒：`high`
- 紧急警告：`critical`

### 2. 避免通知疲劳
- 不要频繁发送低优先级通知
- 合并相似通知
- 尊重用户的通知设置

### 3. 提供清晰的消息
- 使用简洁明了的标题
- 提供具体的行动指引
- 包含相关的上下文信息

### 4. 测试多种场景
- 前台使用
- 后台运行
- PWA 模式
- 不同浏览器
- 移动端和桌面端

## 🎉 完成状态

✅ 核心通知管理器（`notificationService.ts`）
✅ 页面内通知弹窗（`NotificationToast.tsx`）
✅ 通知设置面板（`NotificationSettings.tsx`）
✅ 任务验证服务集成
✅ 全局通知组件集成
✅ 设置模块集成
✅ 编译测试通过

## 🔜 未来增强

- [ ] 自定义通知声音
- [ ] 通知历史记录
- [ ] 通知统计分析
- [ ] 智能通知时机（根据用户习惯）
- [ ] 多语言支持
- [ ] 通知模板系统
- [ ] 通知分组和批量管理

---

**现在，你的 ManifestOS 拥有了完整的通知提醒系统！** 🎉

即使你不在页面，也能通过语音和系统通知感知到任务状态的变化，真正解决 ADHD 用户的注意力管理问题。

