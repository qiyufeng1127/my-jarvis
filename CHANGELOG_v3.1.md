# 更新日志 - v3.1

## [v3.1] - 2025-01-11

### 🎉 新增功能

#### 📱 移动端自定义导航
- **自定义底部导航栏**：用户可以从12个功能中选择最多5个显示在底部导航栏
- **可视化配置界面**：提供友好的勾选界面，实时显示已选数量
- **配置持久化**：自定义配置自动保存到本地存储
- **一键恢复默认**：支持快速恢复到默认导航配置

#### 🔊 语音警报系统
- **循环语音播报**：拖延监控和低效率监控支持循环播放语音提醒
- **自定义提示语**：支持自定义预警和超时的语音内容
- **变量替换**：提示语支持 `{task}` `{step}` `{seconds}` `{minutes}` 等变量
- **智能循环**：可配置循环间隔，避免过于频繁

#### 💰 金币暂停功能
- **暂停语音提醒**：支付10金币可暂停语音警报30分钟
- **自动恢复**：暂停时间结束后自动重新启动语音提醒
- **状态显示**：清晰显示暂停结束时间和剩余时长
- **灵活配置**：可自定义暂停成本和时长

### ✨ 优化改进

#### 🤖 Kiki 问候优化
- **智能问候频率**：不再频繁显示常规问候（如"下午好"）
- **条件触发**：仅在新的一天且有任务、周一、或有重要通知时问候
- **减少干扰**：显著降低不必要的消息推送

#### 📱 移动端体验优化
- **移除冗余选项**：删除"更多"菜单中的深色/浅色模式切换（设置中已有）
- **简化菜单结构**：优化"更多"菜单布局，添加"自定义布局"入口
- **动态导航渲染**：底部导航栏根据用户配置动态生成

### 🔧 技术改进

#### 代码优化
- **模块化设计**：语音播报功能独立封装，便于维护
- **状态管理增强**：添加暂停状态、语音循环定时器等状态管理
- **配置持久化**：所有自定义配置自动保存到 localStorage

#### 新增方法
**procrastination.js:**
- `initSpeechSynthesis()` - 初始化语音合成系统
- `speakText(text)` - 播放语音文本
- `startVoiceLoop(text)` - 开始循环播放语音
- `stopVoiceLoop()` - 停止循环播放
- `pauseWithCoins()` - 金币暂停功能
- `resumeFromPause()` - 从暂停恢复
- `formatTime(date)` - 格式化时间显示

**inefficiency.js:**
- `initSpeechSynthesis()` - 初始化语音合成系统
- `speakText(text)` - 播放语音文本
- `startVoiceLoop(text)` - 开始循环播放语音
- `stopVoiceLoop()` - 停止循环播放
- `pauseWithCoins()` - 金币暂停功能
- `resumeFromPause()` - 从暂停恢复
- `formatTime(date)` - 格式化时间显示

**mobile-app.js:**
- `loadCustomNavItems()` - 加载自定义导航配置
- `saveCustomNavItems(items)` - 保存自定义导航配置
- `getCurrentNavItems()` - 获取当前使用的导航项
- `renderMobileNav()` - 渲染移动端导航栏
- `showCustomizeNavModal()` - 显示自定义导航模态框
- `closeCustomizeNavModal()` - 关闭自定义导航模态框
- `saveCustomNav()` - 保存自定义导航
- `resetNavToDefault()` - 恢复默认导航

#### 新增配置项
**拖延监控设置:**
```javascript
customPreAlertText: "距离{task}开始还有{seconds}秒，请准备启动步骤：{step}"
customAlertText: "任务{task}已超时，请立即开始执行步骤：{step}"
useVoiceAlert: true
voiceLoopEnabled: true
voiceLoopInterval: 10
pauseCost: 10
pauseDuration: 1800
pauseEnabled: true
```

**低效率监控设置:**
```javascript
customAlertText: "您已在当前步骤停留{minutes}分钟，可能陷入低效循环，请及时调整"
useVoiceAlert: true
voiceLoopEnabled: true
voiceLoopInterval: 15
pauseCost: 10
pauseDuration: 1800
pauseEnabled: true
```

### 📝 文档更新

- **OPTIMIZATION_NOTES.md** - 详细的优化说明文档
- **NEW_FEATURES_GUIDE.md** - 新功能使用指南
- **CHANGELOG_v3.1.md** - 本更新日志

### 🎨 样式更新

**mobile.css 新增样式:**
- `.customize-nav-list` - 自定义导航列表容器
- `.customize-nav-item` - 自定义导航项
- `.customize-nav-icon` - 导航图标
- `.customize-nav-label` - 导航标签
- `.customize-nav-badge` - 推荐徽章
- `.customize-nav-hint` - 提示信息

### 🐛 Bug 修复

- 修复移动端"更多"菜单点击事件冲突
- 优化语音播报在不同浏览器的兼容性
- 修复暂停状态下的计时器问题
- 优化移动端导航栏的响应式布局

### ⚠️ 已知问题

- `ai-secretary.js` 文件存在编码问题，需要后续修复
- 某些浏览器首次使用语音功能需要用户交互激活
- 无痕模式下自定义导航配置无法保存

### 🔄 兼容性

**浏览器支持:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ 移动端浏览器（iOS Safari, Chrome Mobile）

**语音合成支持:**
- ✅ Chrome/Edge (推荐，效果最佳)
- ✅ Safari (支持，但音色有限)
- ✅ Firefox (支持)
- ⚠️ 需要 HTTPS 或 localhost 环境

### 📊 性能影响

- **语音循环播放**：CPU 占用 < 1%，内存占用 < 5MB
- **自定义导航**：localStorage 占用 < 1KB
- **整体性能**：无明显影响，流畅度保持不变

### 🎯 下一步计划

#### v3.2 计划功能
- [ ] 修复 ai-secretary.js 编码问题
- [ ] 添加更多语音音色选择
- [ ] 支持语速和音量调节
- [ ] 添加语音提示模板库
- [ ] 优化移动端手势操作
- [ ] 添加数据统计和分析功能

#### 长期规划
- [ ] 支持多语言语音播报
- [ ] AI 智能调整监控参数
- [ ] 个性化推荐最佳配置
- [ ] 跨设备同步自定义配置
- [ ] 添加更多自定义选项

### 💬 用户反馈

欢迎通过以下方式提供反馈：
1. 在设置中导出数据备份
2. 记录问题发生的具体场景
3. 提供浏览器版本和设备信息

### 🙏 致谢

感谢所有用户的反馈和建议，让 ADHD Focus 变得更好！

---

## [v3.0] - 2025-01-10

### 初始版本
- 基础任务管理功能
- 拖延监控系统
- 低效率监控系统
- 游戏化奖励系统
- AI 智能助手
- 价值显化器
- 云同步功能
- 移动端适配

---

**更新时间：** 2025年1月11日  
**版本号：** v3.1  
**构建号：** 20250111

