# PWA 通知和语音播报修复指南

## 🎯 问题描述

用户在手机上使用 PWA 时，即使打开了所有通知和语音设置，也不会收到提醒和语音播报。

## ✅ 已完成的修复

### 1. 更新了 Service Worker
- ✅ 添加了通知点击事件处理
- ✅ 添加了通知关闭事件处理
- ✅ 添加了后台同步支持
- ✅ 更新缓存版本为 v2

### 2. 创建了后台通知服务
- ✅ 自动请求通知权限
- ✅ 自动注册 Service Worker
- ✅ 请求屏幕常亮（防止后台休眠）
- ✅ 每30秒检查一次任务
- ✅ 提前5分钟发送任务开始/结束提醒
- ✅ 支持语音播报、音效、震动

### 3. 在 App.tsx 中初始化
- ✅ 应用启动时自动初始化后台通知服务

## 🧪 测试步骤

### 步骤 1：清除旧的 Service Worker

1. 打开浏览器开发者工具（F12）
2. 进入 "Application" 或 "应用" 标签
3. 点击左侧 "Service Workers"
4. 点击 "Unregister" 注销旧的 Service Worker
5. 刷新页面（Ctrl + Shift + R）

### 步骤 2：测试通知功能

在浏览器控制台执行：

```javascript
// 测试通知
const { backgroundNotificationService } = await import('./src/services/backgroundNotificationService');
await backgroundNotificationService.sendTestNotification();
```

你应该看到：
- ✅ 浏览器通知弹出
- ✅ 听到提示音
- ✅ 手机震动
- ✅ 听到语音播报："测试通知，如果你听到这段语音..."

### 步骤 3：测试任务提醒

1. 创建一个任务，开始时间设置为 **5分钟后**
2. 等待5分钟
3. 应该收到通知："⏰ 任务即将开始"
4. 应该听到语音播报

### 步骤 4：测试后台运行

1. 创建一个任务，开始时间设置为 **5分钟后**
2. **切换到其他应用**（让 PWA 进入后台）
3. 等待5分钟
4. 应该收到通知（即使在后台）

## 📱 手机端特殊设置

### Android

1. **允许后台运行**：
   - 设置 → 应用 → Chrome/Edge → 电池 → 允许后台活动

2. **允许通知**：
   - 设置 → 应用 → Chrome/Edge → 通知 → 允许

3. **添加到主屏幕**：
   - 在 Chrome 中打开应用
   - 点击菜单 → "添加到主屏幕"
   - 从主屏幕启动应用

### iOS

1. **添加到主屏幕**：
   - 在 Safari 中打开应用
   - 点击分享按钮 → "添加到主屏幕"
   - 从主屏幕启动应用

2. **允许通知**：
   - 设置 → Safari → 通知 → 允许

⚠️ **注意**：iOS 的 PWA 支持有限，语音播报可能不稳定。

## 🔧 高级调试

### 查看 Service Worker 状态

```javascript
// 在控制台执行
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### 查看通知权限

```javascript
// 在控制台执行
console.log('通知权限:', Notification.permission);
```

### 手动请求权限

```javascript
// 在控制台执行
await Notification.requestPermission();
```

### 查看屏幕常亮状态

```javascript
// 在控制台执行
if ('wakeLock' in navigator) {
  const wakeLock = await navigator.wakeLock.request('screen');
  console.log('屏幕常亮已启用');
}
```

## 🐛 常见问题

### 问题 1：没有收到通知

**解决方案**：
1. 检查通知权限：`Notification.permission` 应该是 `"granted"`
2. 检查浏览器设置中是否允许通知
3. 检查手机系统设置中是否允许浏览器通知

### 问题 2：没有语音播报

**解决方案**：
1. 检查设置中是否启用了语音播报
2. 确保手机音量已打开
3. 在控制台执行：
```javascript
const { notificationService } = await import('./src/services/notificationService');
notificationService.speak('测试语音');
```

### 问题 3：后台不工作

**解决方案**：
1. 确保已添加到主屏幕（作为 PWA 运行）
2. 检查手机是否允许应用后台运行
3. 检查是否启用了屏幕常亮

### 问题 4：Service Worker 没有注册

**解决方案**：
1. 检查 `public/service-worker.js` 文件是否存在
2. 检查路径是否正确（`/my-jarvis/service-worker.js`）
3. 清除浏览器缓存后重试

## 📊 工作原理

```
应用启动
  ↓
初始化后台通知服务
  ↓
┌─────────────────────────────────────┐
│ 1. 请求通知权限                      │
│ 2. 注册 Service Worker              │
│ 3. 请求屏幕常亮                      │
│ 4. 初始化音频上下文                  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 每30秒检查一次任务                   │
│ - 读取 localStorage 中的任务数据     │
│ - 检查是否有任务即将开始/结束        │
│ - 提前5分钟发送通知                  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 发送通知                             │
│ 1. 浏览器通知（Service Worker）     │
│ 2. 播放音效                          │
│ 3. 语音播报                          │
│ 4. 震动反馈                          │
└─────────────────────────────────────┘
```

## ✅ 验收标准

完成修复后，系统应该能够：

1. ✅ 在前台收到通知和语音播报
2. ✅ 在后台收到通知（即使应用最小化）
3. ✅ 提前5分钟提醒任务开始
4. ✅ 提前5分钟提醒任务结束
5. ✅ 播放音效和震动反馈
6. ✅ 语音播报任务信息
7. ✅ 点击通知后打开应用

## 🎉 完成！

现在刷新浏览器，后台通知服务就会自动启动。创建一个5分钟后开始的任务来测试吧！

